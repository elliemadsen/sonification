#!/usr/bin/env python3
"""
sonify_dna.py  -  DNA Sonification - Pinna nobilis mitogenome
------------------------------------------------------------------
Multi-layer polyphonic audio + grayscale white-on-black pitch-bar visual.

Audio layers
  1  Base note      A/T/G/C  4 pitches, sine wave        (C3-Bb3)
  2  Dinucleotide   16 pairs  pitches, triangle wave      (A4-C6)
  3  GC short       10 bp window GC pct  pitch, soft sine (C2-A3)
  4  GC long        100 bp window GC pct  drone, soft sine (E1-E3)
  5  Codon AA       reading-frame amino acid  pitch, triangle (E3-E5)
  6  Trinuc repeat  trinucleotide run  FM bell tone        (C6-C7)

Modes
  full  - all 6 layers
  lite  - layers 1 + 3 + 5
  base  - layer 1 only

Usage
  python sonify_dna.py [--mode {full,lite,base}] [--speed 5]
                       [--start 1] [--length 0] [--output stem]
                       [--fps 30] [--width 1280] [--height 720]
                       [--col-width 14]
                       [--reverb 0.0] [--echo 0.0] [--echo-delay 0.30]

Quick test (10 s):
  python sonify_dna.py --mode full --length 50 --speed 5

With effects:
  python sonify_dna.py --mode full --length 50 --reverb 0.3 --echo 0.25
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# -------------------------------------------------
#  Paths & global constants
# -------------------------------------------------
SCRIPT_DIR  = Path(__file__).parent
FASTA_FILE  = SCRIPT_DIR / "pinna_nobilis.fasta"
GENES_FILE  = SCRIPT_DIR / "pinna_nobilis_genes.json"
FFMPEG      = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
SAMPLE_RATE = 44100

# Grayscale base shades: A=bright, C=dim (white-on-black palette)
BASE_GRAY = {"A": 240, "T": 185, "G": 118, "C": 62, "N": 100}

# Gene feature background shades (grayscale — clearly distinct on black)
FEAT_BG = {
    "CDS":        (72, 72, 72),   # medium grey
    "tRNA":       (48, 48, 48),   # dark grey
    "rRNA":       (32, 32, 32),   # very dark grey
    "intergenic": ( 0,  0,  0),   # black
}

# Visual constants for letter-scroll display
PLAYHEAD_FRAC  = 0.25   # fraction from left where the playhead sits
NOTE_MIDI_LO   = 34.0   # bottom of note area — GC long drone pushed toward bottom edge
NOTE_MIDI_HI   = 86.0   # top of note area  — covers dinucleotide highs (84)
LETTER_SIZE    = 16     # font size for regular scrolling letters
LETTER_SIZE_HI = 24     # font size for the highlighted letter at playhead

# -------------------------------------------------
#  Music / pitch constants
# -------------------------------------------------
def midi_to_hz(midi):
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


# Layer 1 - base note (minor-pentatonic flavour, C3-Bb3)
BASE_MIDI    = {"A": 48, "T": 51, "G": 55, "C": 58, "N": 48}
BASE_MIDI_LO = 48.0
BASE_MIDI_HI = 58.0

# Layer 2 - dinucleotide: 16 pairs -> A4(69) ... C6(84)
_DINUCS       = [b1 + b2 for b1 in "ACGT" for b2 in "ACGT"]
DINUC_MIDI    = {d: 69 + i for i, d in enumerate(_DINUCS)}
DINUC_MIDI_LO = 69.0
DINUC_MIDI_HI = 84.0

# Layer 3 - GC short (10 bp): C2(36) - A3(57)
GC_SHORT_LO, GC_SHORT_HI = 36.0, 57.0

# Layer 4 - GC long (100 bp): E1(28) - E3(52)
GC_LONG_LO, GC_LONG_HI   = 28.0, 52.0

# Layer 5 - codon amino acid: E3(52) - E5(76)
GENETIC_CODE = {
    "TTT":"F","TTC":"F","TTA":"L","TTG":"L",
    "CTT":"L","CTC":"L","CTA":"L","CTG":"L",
    "ATT":"I","ATC":"I","ATA":"I","ATG":"M",
    "GTT":"V","GTC":"V","GTA":"V","GTG":"V",
    "TCT":"S","TCC":"S","TCA":"S","TCG":"S",
    "CCT":"P","CCC":"P","CCA":"P","CCG":"P",
    "ACT":"T","ACC":"T","ACA":"T","ACG":"T",
    "GCT":"A","GCC":"A","GCA":"A","GCG":"A",
    "TAT":"Y","TAC":"Y","TAA":"*","TAG":"*",
    "CAT":"H","CAC":"H","CAA":"Q","CAG":"Q",
    "AAT":"N","AAC":"N","AAA":"K","AAG":"K",
    "GAT":"D","GAC":"D","GAA":"E","GAG":"E",
    "TGT":"C","TGC":"C","TGA":"*","TGG":"W",
    "CGT":"R","CGC":"R","CGA":"R","CGG":"R",
    "AGT":"S","AGC":"S","AGA":"R","AGG":"R",
    "GGT":"G","GGC":"G","GGA":"G","GGG":"G",
}
_AA_ORDER = sorted(set(GENETIC_CODE.values()))   # 21 items (incl. *)
AA_MIDI   = {
    aa: 52 + int(i * (76 - 52) / max(1, len(_AA_ORDER) - 1))
    for i, aa in enumerate(_AA_ORDER)
}
AA_MIDI_LO, AA_MIDI_HI = 52.0, 76.0

# Layer 6 - trinucleotide repeat: bell tones C6(84) - C7(96)
def trinuc_to_midi(trinuc):
    return 84.0 + (sum(ord(c) for c in trinuc) % 12)


# -------------------------------------------------
#  Sequence / annotation I/O
# -------------------------------------------------
def load_sequence(fasta_path):
    lines = fasta_path.read_text().splitlines()
    return "".join(l for l in lines if not l.startswith(">")).upper()


def load_genes(genes_path):
    with open(genes_path) as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    return data.get("features", [])


def feature_at(pos, genes):
    """Return feature overlapping 1-based position pos, or None."""
    for g in genes:
        if g["start"] <= pos <= g["end"]:
            return g
    return None


# -------------------------------------------------
#  Pre-computed tracks  (vectorised for speed)
# -------------------------------------------------
def compute_gc_track(seq, window):
    n     = len(seq)
    is_gc = np.array([1.0 if b in "GC" else 0.0 for b in seq])
    cs    = np.concatenate([[0.0], np.cumsum(is_gc)])
    half  = window // 2
    starts = np.maximum(0, np.arange(n) - half)
    ends   = np.minimum(n, np.arange(n) + half + 1)
    return (cs[ends] - cs[starts]) / (ends - starts)


def compute_codon_track(seq):
    """Amino acid at every position (reading frame 0)."""
    n      = len(seq)
    result = ["?"] * n
    for i in range(0, n - 2, 3):
        aa = GENETIC_CODE.get(seq[i:i+3], "?")
        result[i] = result[i+1] = result[i+2] = aa
    return result


def compute_trinuc_track(seq):
    """1.0 where current trinucleotide equals the immediately preceding one."""
    n     = len(seq)
    track = np.zeros(n)
    for i in range(3, n - 2):
        if seq[i:i+3] == seq[i-3:i]:
            track[i] = track[i+1] = track[i+2] = 1.0
    return track


# -------------------------------------------------
#  Audio synthesis primitives
# -------------------------------------------------
def _env(arr, attack, release):
    n   = len(arr)
    atk = min(int(attack  * SAMPLE_RATE), n // 2)
    rel = min(int(release * SAMPLE_RATE), n // 2)
    if atk > 0:
        arr[:atk]   *= np.linspace(0.0, 1.0, atk)
    if rel > 0:
        arr[n-rel:] *= np.linspace(1.0, 0.0, rel)
    return arr


def make_sine(freq, dur, amp=0.35):
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(0.0, dur, n, endpoint=False)
    return _env(amp * np.sin(2 * np.pi * freq * t), 0.005, 0.010)


def make_triangle(freq, dur, amp=0.28):
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(0.0, dur, n, endpoint=False)
    return _env(
        amp * (2.0 / np.pi) * np.arcsin(np.sin(2 * np.pi * freq * t)),
        0.008, 0.015,
    )


def make_bell(freq, dur, amp=0.38):
    """FM bell for trinucleotide repeat events."""
    n   = int(dur * SAMPLE_RATE)
    t   = np.linspace(0.0, dur, n, endpoint=False)
    mod = 3.5 * np.sin(2 * np.pi * freq * 2.756 * t)
    return amp * np.sin(2 * np.pi * freq * t + mod) * np.exp(-t * 5.0)


# -------------------------------------------------
#  Post-processing audio effects
# -------------------------------------------------
def apply_reverb(audio, wet=0.25, decay=1.5, sr=SAMPLE_RATE):
    """Convolution reverb with an exponential-decay noise impulse response."""
    ir_len  = int(decay * sr)
    t_ir    = np.linspace(0.0, decay, ir_len)
    rng     = np.random.default_rng(42)
    ir      = rng.standard_normal(ir_len) * np.exp(-t_ir * 6.0 / max(decay, 0.1))
    ir[0]   = 1.0
    ir     /= np.max(np.abs(ir)) * 3.0
    n_fft   = len(audio) + len(ir) - 1
    wet_sig = np.fft.irfft(
        np.fft.rfft(audio, n_fft) * np.fft.rfft(ir, n_fft), n_fft
    )[:len(audio)]
    return np.clip(audio * (1.0 - wet) + wet_sig * wet, -1.0, 1.0)


def apply_echo(audio, delay=0.30, decay=0.45, n_echoes=4, sr=SAMPLE_RATE):
    """Multi-tap echo / delay effect."""
    out = audio.copy()
    for i in range(1, n_echoes + 1):
        d = int(delay * i * sr)
        if d < len(audio):
            out[d:] += audio[: len(audio) - d] * (decay ** i)
    peak = np.max(np.abs(out))
    if peak > 1.0:
        out /= peak
    return out


# -------------------------------------------------
#  Per-position polyphonic audio mix
# -------------------------------------------------
def synth_position(pos, seq, gc_short, gc_long, codon_aa, trinuc, dur, mode):
    """Return a mixed audio chunk for one base step (all active layers)."""
    n    = len(seq)
    base = seq[pos] if pos < n else "N"
    parts = []

    # Layer 1: Base note
    parts.append(make_sine(midi_to_hz(float(BASE_MIDI.get(base, 48))), dur, amp=0.35))

    if mode in ("full", "lite"):
        # Layer 3: GC short window
        gc_s  = float(gc_short[pos]) if pos < len(gc_short) else 0.5
        midi3 = GC_SHORT_LO + gc_s * (GC_SHORT_HI - GC_SHORT_LO)
        parts.append(make_sine(midi_to_hz(midi3), dur, amp=0.13))

        # Layer 5: Codon amino acid
        aa = codon_aa[pos] if pos < len(codon_aa) else "?"
        if aa in AA_MIDI:
            parts.append(make_triangle(midi_to_hz(float(AA_MIDI[aa])), dur, amp=0.21))

    if mode == "full":
        # Layer 2: Dinucleotide
        if pos + 1 < n:
            midi2 = float(DINUC_MIDI.get(base + seq[pos + 1], 69))
            parts.append(make_triangle(midi_to_hz(midi2), dur, amp=0.15))

        # Layer 4: GC long window (drone)
        gc_l  = float(gc_long[pos]) if pos < len(gc_long) else 0.5
        midi4 = GC_LONG_LO + gc_l * (GC_LONG_HI - GC_LONG_LO)
        parts.append(make_sine(midi_to_hz(midi4), dur, amp=0.09))

        # Layer 6: Trinucleotide repeat
        if pos < len(trinuc) and trinuc[pos] > 0:
            trinuc_str = seq[pos:pos+3] if pos + 3 <= n else "NNN"
            parts.append(make_bell(midi_to_hz(trinuc_to_midi(trinuc_str)), dur, amp=0.27))

    if not parts:
        return np.zeros(int(dur * SAMPLE_RATE))

    max_len = max(len(p) for p in parts)
    out     = np.zeros(max_len)
    for p in parts:
        out[:len(p)] += p
    return np.tanh(out * 0.65)


# -------------------------------------------------
#  Frame rendering
# -------------------------------------------------
def get_font(size):
    for path in [
        "/System/Library/Fonts/Menlo.ttc",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def norm_h(midi, lo, hi, max_px):
    """Map a MIDI value to a pixel height within [0, max_px]."""
    t = float(np.clip((midi - lo) / max(1.0, hi - lo), 0.0, 1.0))
    return int(t * max_px)


def _smooth_curve(pts, window=9):
    """Smooth a list of (x, y) pixel coords with a running average.
    Returns a new list of int (x, y) tuples — sharp corners become gentle waves.
    """
    if len(pts) < window + 1:
        return pts
    ys      = np.array([p[1] for p in pts], dtype=float)
    pad     = window // 2
    ys_pad  = np.pad(ys, pad, mode="edge")
    kernel  = np.ones(window) / window
    ys_smth = np.convolve(ys_pad, kernel, mode="valid")[: len(ys)]
    return [(pts[i][0], int(round(ys_smth[i]))) for i in range(len(pts))]


def render_frame(seq, genes, center_pos, width, height,
                 gc_short, gc_long, codon_aa, trinuc, col_w, scroll_px=0.0):
    img  = Image.new("RGB", (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    font_sm  = get_font(10)
    font_let = get_font(LETTER_SIZE)
    font_hi  = get_font(LETTER_SIZE_HI)

    seq_len = len(seq)

    # ── Layout zones ──────────────────────────────────────────────────────
    curve_h  = 60           # dedicated GC-curve strip
    label_h  = 22
    eq_h     = 48
    note_y0  = 0
    note_h   = height - note_y0 - curve_h - 4 - eq_h - label_h - 6
    note_y1  = note_y0 + note_h
    curve_y0 = note_y1 + 4
    curve_y1 = curve_y0 + curve_h
    eq_y0    = curve_y1 + 3
    eq_y1    = eq_y0 + eq_h
    label_y  = eq_y1 + 2
    _cm      = max(3, int(curve_h * 0.08))   # curve margin

    def gc_curve_y(gc_val):
        """Map GC% (0.0–1.0) to a Y pixel inside the curve strip."""
        t = max(0.0, min(1.0, float(gc_val)))
        return int(curve_y1 - _cm - t * (curve_h - 2 * _cm))

    # ── Lane Y (vertical centre of each base letter) ──────────────────────
    # High MIDI = high pitch = high on screen = low y value
    def lane_y(midi):
        t = (float(midi) - NOTE_MIDI_LO) / (NOTE_MIDI_HI - NOTE_MIDI_LO)
        t = max(0.0, min(1.0, t))
        return int(note_y1 - t * note_h)

    # Shift letter lanes downward to separate them from the dot layers above
    # and fill the gap that would otherwise appear at the bottom of the note area.
    _letter_shift = int(note_h * 0.20)
    LANE = {b: lane_y(m) + _letter_shift for b, m in BASE_MIDI.items()}

    playhead_x = int(width * PLAYHEAD_FRAC)
    left_cols  = playhead_x // col_w + 4
    right_cols = (width - playhead_x) // col_w + 4

    def col_x(ci):
        """Pixel x for column ci, incorporating the smooth sub-column offset."""
        return int(playhead_x + ci * col_w - scroll_px)

    # ── Staff lines — one faint horizontal line per base lane ─────────────
    for b, ly in LANE.items():
        if b == "N":
            continue
        draw.line([0, ly, width, ly], fill=(16, 16, 16), width=1)

    # Lane labels at left edge
    for b, ly in LANE.items():
        if b == "N":
            continue
        shade = BASE_GRAY.get(b, 100) // 3
        draw.text((4, ly - LETTER_SIZE // 2), b, font=font_sm,
                  fill=(shade, shade, shade))

    # (GC curves are rendered in their own strip below the note area)

    # ── Scrolling base letters ────────────────────────────────────────────
    for ci in range(-left_cols, right_cols + 1):
        pos = center_pos + ci
        if pos < 0 or pos >= seq_len:
            continue
        base = seq[pos]
        x    = col_x(ci)
        if x < -col_w * 2 or x > width + col_w:
            continue

        ly   = LANE.get(base, note_y0 + note_h // 2)
        gray = BASE_GRAY.get(base, 100)

        if ci == 0:
            # ── Letter at playhead: bright, larger ────────────────────────
            fw = LETTER_SIZE_HI
            draw.text((x, ly - fw // 2), base, font=font_hi,
                      fill=(255, 255, 255))
        else:
            # ── Regular letter: fade with distance from playhead ──────────
            fw = LETTER_SIZE
            if ci < 0:
                # Already played — fade out as they move away to the left
                frac = max(0.0, 1.0 + ci / max(1, left_cols * 0.75))
                v    = int(gray * frac * 0.6)
            else:
                # Upcoming — mostly visible, slight far-right fade
                frac = max(0.35, 1.0 - ci / max(1, right_cols * 1.3))
                v    = int(gray * frac)
            v = max(0, min(255, v))
            draw.text((x, ly - fw // 2), base, font=font_let,
                      fill=(v, v, v))

        # Tiny dot above letter when inside a trinucleotide repeat
        if pos < len(trinuc) and trinuc[pos] > 0:
            dot_y = ly - LETTER_SIZE // 2 - 5
            if dot_y >= note_y0:
                draw.ellipse([x + 1, dot_y, x + 3, dot_y + 2],
                             fill=(180, 180, 180))

        # Codon AA dot — floats at the amino-acid pitch height
        aa = codon_aa[pos] if pos < len(codon_aa) else "?"
        if aa in AA_MIDI:
            y_aa = lane_y(float(AA_MIDI[aa]))
            if note_y0 <= y_aa <= note_y1:
                if ci == 0:
                    v_aa = 160
                elif ci < 0:
                    v_aa = max(0, int(110 * (1.0 + ci / max(1, left_cols * 0.75))))
                else:
                    v_aa = max(0, int(90 * (1.0 - ci / max(1, right_cols * 1.3))))
                if v_aa > 0:
                    xc = x + col_w // 2
                    draw.ellipse([xc - 3, y_aa - 3, xc + 3, y_aa + 3],
                                 fill=(v_aa, v_aa, v_aa))

        # Dinucleotide dot — floats at the pair-pitch height
        if pos + 1 < seq_len:
            y_dn = lane_y(float(DINUC_MIDI.get(base + seq[pos + 1], 69)))
            if note_y0 <= y_dn <= note_y1:
                if ci == 0:
                    v_dn = 130
                elif ci < 0:
                    v_dn = max(0, int(90 * (1.0 + ci / max(1, left_cols * 0.75))))
                else:
                    v_dn = max(0, int(70 * (1.0 - ci / max(1, right_cols * 1.3))))
                if v_dn > 0:
                    xc = x + col_w // 2
                    draw.ellipse([xc - 2, y_dn - 2, xc + 2, y_dn + 2],
                                 fill=(v_dn, v_dn, v_dn))

    # ── Playhead line ─────────────────────────────────────────────────────
    draw.line([playhead_x, 0, playhead_x, note_y1],
              fill=(255, 255, 255), width=1)

    # ── GC curve zone ─────────────────────────────────────────────────────
    draw.line([0, curve_y0 - 1, width - 1, curve_y0 - 1], fill=(22, 22, 22), width=1)
    draw.rectangle([0, curve_y0, width - 1, curve_y1], fill=(3, 3, 3))
    draw.line([0, curve_y1 + 1, width - 1, curve_y1 + 1], fill=(22, 22, 22), width=1)
    for _grid_pct in (0.25, 0.5, 0.75):
        _gy = gc_curve_y(_grid_pct)
        draw.line([0, _gy, width - 1, _gy], fill=(14, 14, 14), width=1)
    draw.text((4, curve_y0 + 3), "GC", font=font_sm, fill=(60, 60, 60))

    gc_l_pts = []
    gc_s_pts = []
    for ci in range(-left_cols, right_cols + 1):
        _p = center_pos + ci
        if _p < 0 or _p >= seq_len:
            continue
        _cx = col_x(ci) + col_w // 2
        if _cx < 0 or _cx > width:
            continue
        if _p < len(gc_long):
            gc_l_pts.append((_cx, gc_curve_y(float(gc_long[_p]))))
        if _p < len(gc_short):
            gc_s_pts.append((_cx, gc_curve_y(float(gc_short[_p]))))
    if len(gc_l_pts) >= 2:
        draw.line(gc_l_pts, fill=(95, 95, 95), width=2)
    if len(gc_s_pts) >= 2:
        draw.line(_smooth_curve(gc_s_pts), fill=(165, 165, 165), width=2)
    draw.line([playhead_x, curve_y0, playhead_x, curve_y1],
              fill=(180, 180, 180), width=1)

    # ── EQ multi-layer panel ──────────────────────────────────────────────
    draw.rectangle([0, eq_y0, width - 1, eq_y1], fill=(5, 5, 5))
    sw = max(1, col_w // 3)

    for ci in range(-left_cols, right_cols + 1):
        pos = center_pos + ci
        if pos < 0 or pos >= seq_len:
            continue
        base = seq[pos]
        x0   = col_x(ci)
        if x0 >= width or x0 + col_w < 0:
            continue

        # Sub-band A: GC short
        gc_s = float(gc_short[pos]) if pos < len(gc_short) else 0.5
        h_gs = int(gc_s * eq_h)
        if h_gs > 0:
            draw.rectangle([x0, eq_y1 - h_gs, x0 + sw - 1, eq_y1],
                           fill=(65, 65, 65))

        # Sub-band B: GC long
        gc_l = float(gc_long[pos]) if pos < len(gc_long) else 0.5
        h_gl = int(gc_l * eq_h)
        if h_gl > 0:
            draw.rectangle([x0 + sw, eq_y1 - h_gl, x0 + 2 * sw - 1, eq_y1],
                           fill=(40, 40, 40))

        # Sub-band C: dinucleotide
        if pos + 1 < seq_len:
            midi2 = float(DINUC_MIDI.get(base + seq[pos + 1], 69))
            h_dn  = norm_h(midi2, DINUC_MIDI_LO, DINUC_MIDI_HI, eq_h)
            if h_dn > 0:
                draw.rectangle(
                    [x0 + 2 * sw, eq_y1 - h_dn, x0 + col_w - 1, eq_y1],
                    fill=(85, 85, 85),
                )

    # EQ playhead marker
    draw.line([playhead_x, eq_y0, playhead_x, eq_y1],
              fill=(180, 180, 180), width=1)

    # ── Genome progress bar ───────────────────────────────────────────────
    prog = center_pos / max(1, seq_len - 1)
    draw.rectangle([0, height - 3, width - 1, height - 1], fill=(12, 12, 12))
    draw.rectangle([0, height - 3, int(prog * width), height - 1],
                   fill=(70, 70, 70))

    # ── Labels ────────────────────────────────────────────────────────────
    draw.text(
        (10, label_y + 2),
        f"{center_pos + 1:,} / {seq_len:,} bp",
        font=font_sm, fill=(120, 120, 120),
    )
    feat_here = feature_at(center_pos + 1, genes)
    if feat_here:
        fname = feat_here.get("gene") or feat_here.get("product", feat_here["type"])
        draw.text(
            (width - 210, label_y + 2),
            f"{feat_here['type']}  {fname}",
            font=font_sm, fill=(160, 160, 160),
        )

    return img


# -------------------------------------------------
#  Main render pipeline
# -------------------------------------------------
def render(args):
    mode     = args.mode
    speed    = args.speed
    fps      = args.fps
    width    = args.width
    height   = args.height
    col_w    = args.col_width
    out_stem = args.output or f"sonify_{mode}"
    out_path = SCRIPT_DIR / f"output/{out_stem}.mp4"

    print(f"Loading {FASTA_FILE.name} ...")
    seq = load_sequence(FASTA_FILE)
    print(f"  {len(seq):,} bp")

    print(f"Loading {GENES_FILE.name} ...")
    genes = load_genes(GENES_FILE)
    print(f"  {len(genes)} features")

    start_idx = max(0, args.start - 1)
    length    = args.length if args.length > 0 else len(seq) - start_idx
    end_idx   = min(len(seq), start_idx + length)
    n_bases   = end_idx - start_idx
    print(f"Sonifying bp {start_idx+1:,} - {end_idx:,}  ({n_bases:,} bases)")
    print(f"Mode: {mode}  |  Speed: {speed} bp/s  |  FPS: {fps}")

    print("Computing GC tracks ...")
    gc_short = compute_gc_track(seq, 10)
    gc_long  = compute_gc_track(seq, 100)

    print("Computing codon track (frame 0) ...")
    codon_aa = compute_codon_track(seq)

    print("Computing trinucleotide repeat track ...")
    trinuc = compute_trinuc_track(seq)

    duration  = n_bases / speed
    n_frames  = int(duration * fps) + 1
    n_samples = int(duration * SAMPLE_RATE) + SAMPLE_RATE
    base_dur  = 1.0 / speed
    print(f"Duration: {duration:.1f} s  |  Frames: {n_frames:,}")

    # Audio
    print("Generating audio ...")
    audio = np.zeros(n_samples)
    for i in range(n_bases):
        pos    = start_idx + i
        offset = int(i * base_dur * SAMPLE_RATE)
        chunk  = synth_position(
            pos, seq, gc_short, gc_long, codon_aa, trinuc, base_dur, mode,
        )
        end_s = offset + len(chunk)
        if end_s <= n_samples:
            audio[offset:end_s] += chunk
        elif offset < n_samples:
            audio[offset:] += chunk[:n_samples - offset]
        if i % 2000 == 0 and i > 0:
            print(f"  audio  {i:,}/{n_bases:,} ...", end="\r")

    print()
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak * 0.92

    if args.reverb > 0:
        print(f"Applying reverb  (wet={args.reverb:.2f}) ...")
        audio = apply_reverb(audio, wet=args.reverb)
    if args.echo > 0:
        print(f"Applying echo    (wet={args.echo:.2f}, delay={args.echo_delay:.2f}s) ...")
        audio = apply_echo(audio, delay=args.echo_delay)
    if args.reverb > 0 or args.echo > 0:
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak * 0.92

    tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    with wave.open(tmp_wav.name, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes((audio * 32767).astype(np.int16).tobytes())
    print(f"WAV: {tmp_wav.name}")

    # Frames
    tmp_dir = tempfile.mkdtemp()
    print(f"Rendering {n_frames:,} frames ...")
    for f_idx in range(n_frames):
        t         = f_idx / fps
        exact     = t * speed
        pos       = start_idx + int(exact)
        pos       = min(pos, end_idx - 1)
        scroll_px = (exact - int(exact)) * col_w
        frame = render_frame(
            seq, genes, pos, width, height,
            gc_short, gc_long, codon_aa, trinuc, col_w, scroll_px,
        )
        frame.save(os.path.join(tmp_dir, f"frame_{f_idx:06d}.png"))
        if f_idx % fps == 0:
            print(f"  frame  {f_idx:,}/{n_frames:,}  t={t:.1f}s  pos={pos+1:,}", end="\r")

    print()
    print("Muxing ...")
    cmd = [
        FFMPEG, "-y",
        "-framerate", str(fps),
        "-i", os.path.join(tmp_dir, "frame_%06d.png"),
        "-i", tmp_wav.name,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "fast",
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        str(out_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("ffmpeg error:\n", result.stderr[-2000:])
        sys.exit(1)

    os.unlink(tmp_wav.name)
    for f in Path(tmp_dir).glob("*.png"):
        f.unlink()
    os.rmdir(tmp_dir)

    print(f"\nDone!  Output: {out_path}")


# -------------------------------------------------
#  CLI
# -------------------------------------------------
def parse_args():
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--mode", default="full", choices=["full", "lite", "base"],
                   help="Audio mode: full=6 layers, lite=3, base=1  (default: full)")
    p.add_argument("--speed", type=float, default=5,
                   help="Bases per second  (default: 5)")
    p.add_argument("--output", default="",
                   help="Output filename stem, no extension  (default: auto)")
    p.add_argument("--start", type=int, default=1,
                   help="Start position, 1-based  (default: 1)")
    p.add_argument("--length", type=int, default=0,
                   help="Number of bases to render  (default: full genome)")
    p.add_argument("--fps", type=int, default=30,
                   help="Frames per second  (default: 30)")
    p.add_argument("--width", type=int, default=1280,
                   help="Frame width px  (default: 1280)")
    p.add_argument("--height", type=int, default=720,
                   help="Frame height px  (default: 720)")
    p.add_argument("--col-width", type=int, default=14, dest="col_width",
                   help="Pixels per base column  (default: 14)")
    p.add_argument("--reverb", type=float, default=0.0, metavar="WET",
                   help="Reverb wet mix 0.0–1.0  (default: 0 = off)")
    p.add_argument("--echo", type=float, default=0.0, metavar="WET",
                   help="Echo/delay wet mix 0.0–1.0  (default: 0 = off)")
    p.add_argument("--echo-delay", type=float, default=0.30, dest="echo_delay",
                   help="Echo delay time in seconds  (default: 0.30)")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    render(args)
