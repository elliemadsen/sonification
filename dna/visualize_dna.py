#!/usr/bin/env python3
"""
visualize_dna.py  —  aesthetic edition
=======================================
Six black-on-white data-art prints of the Pinna nobilis mitogenome.

Outputs -> dna/viz/
  viz_01_genome_barcode.png    Strand-aware gene barcode
  viz_02_gc_horizon.png        GC% silhouette
  viz_03_frequency_raster.png  Base-frequency density grid
  viz_04_waveforms.png         Stacked synthetic audio traces
  viz_05_codon_textile.png     Codon-usage tile grid
  viz_06_base_composition.png  Overlapping base-frequency curves
"""

import json
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# --- paths -------------------------------------------------------------------
SCRIPT_DIR  = Path(__file__).parent
OUT_DIR     = SCRIPT_DIR / "viz"
OUT_DIR.mkdir(exist_ok=True)
FASTA_FILE  = SCRIPT_DIR / "pinna_nobilis.fasta"
GENES_FILE  = SCRIPT_DIR / "pinna_nobilis_genes.json"
SAMPLE_RATE = 44100

# --- global style: minimal, black on white -----------------------------------
plt.rcParams.update({
    'figure.facecolor':   'white',
    'savefig.facecolor':  'white',
    'axes.facecolor':     'white',
    'text.color':         '#111111',
    'font.family':        'sans-serif',
    'font.size':          8,
    'figure.dpi':         150,
    'savefig.dpi':        150,
    'axes.linewidth':     0.4,
    'xtick.major.size':   2.5,
    'xtick.major.width':  0.4,
    'xtick.color':        '#aaaaaa',
    'ytick.major.size':   0,
    'xtick.labelsize':    7,
})

# --- sonification constants --------------------------------------------------
PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]
BASE_DEG   = {'A': 0, 'T': 2, 'G': 5, 'C': 7, 'N': 4}
BASES      = ['A', 'T', 'G', 'C']
BASE_HZ    = {'A': 131, 'T': 165, 'G': 262, 'C': 330}

def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)

# --- data loaders ------------------------------------------------------------
def load_sequence():
    return ''.join(l for l in FASTA_FILE.read_text().splitlines()
                   if not l.startswith('>')).upper()

def load_genes():
    d = json.loads(GENES_FILE.read_text())
    return d['features'] if isinstance(d, dict) else d

def feature_at(pos1, genes):
    for g in genes:
        if g['start'] <= pos1 <= g['end']:
            return g
    return None

def sliding(arr, w):
    return np.convolve(arr.astype(float), np.ones(w) / w, mode='same')

# --- axis helpers ------------------------------------------------------------
def bare(ax):
    for sp in ax.spines.values():
        sp.set_visible(False)
    ax.set_xticks([])
    ax.set_yticks([])

def bottom_only(ax):
    for k, sp in ax.spines.items():
        sp.set_visible(k == 'bottom')
        if k == 'bottom':
            sp.set_color('#bbbbbb')
            sp.set_linewidth(0.4)
    ax.set_yticks([])
    ax.tick_params(axis='x', length=2.5, width=0.4, pad=4, color='#cccccc')

def pos_labels(ax, seq_len, n=6):
    ticks = np.linspace(0, seq_len, n, dtype=int)
    ax.set_xticks(ticks)
    ax.set_xticklabels([f'{p:,}' for p in ticks], color='#aaaaaa')

def caption(ax, text):
    ax.set_xlabel(text, fontsize=6.5, color='#aaaaaa', labelpad=10)


# =============================================================================
#  FIG 01  --  Strand-aware gene barcode
# =============================================================================
def fig_barcode(seq, genes, out):
    seq_len = len(seq)
    fig, ax = plt.subplots(figsize=(22, 3.4))
    bare(ax)
    ax.set_xlim(0, seq_len)
    ax.set_ylim(-1.15, 1.15)
    ax.axhline(0, color='#e8e8e8', linewidth=0.6, zorder=0)

    H = {'CDS': 0.75, 'rRNA': 0.58, 'tRNA': 0.38}

    for g in genes:
        h    = H.get(g['type'], 0.40)
        x    = g['start'] - 1
        w    = max(1, g['end'] - g['start'] + 1)
        sign = 1 if g.get('strand', '+') == '+' else -1
        ax.add_patch(mpatches.Rectangle(
            (x, sign * 0.03), w, h * sign - sign * 0.03,
            facecolor='#111111', edgecolor='none', zorder=2
        ))
        label = (g.get('gene') or g.get('product', g['type'])[:9]).upper()
        ty = (h + 0.10) * sign
        ax.text(x + w / 2, ty, label,
                ha='center', va='bottom' if sign > 0 else 'top',
                fontsize=4.0, color='#aaaaaa', clip_on=True)

    ax.text(0, -1.10, 'PINNA  NOBILIS',
            fontsize=13, fontweight='bold', color='#111111', va='bottom')
    ax.text(seq_len, -1.10,
            f'MITOCHONDRIAL  GENOME   *   {seq_len:,}  BP   *   36  FEATURES'
            f'   *   + STRAND  ABOVE   *   - STRAND  BELOW',
            fontsize=6, color='#aaaaaa', ha='right', va='bottom')

    fig.savefig(out, bbox_inches='tight', pad_inches=0.28)
    plt.close(fig)
    print(f'  {out.name}')


# =============================================================================
#  FIG 02  --  GC content silhouette
# =============================================================================
def fig_gc_horizon(seq, genes, out):
    WINDOW  = 150
    seq_arr = np.array(list(seq))
    is_gc   = np.isin(seq_arr, ['G', 'C']).astype(float)
    gc      = sliding(is_gc, WINDOW) * 100.0
    mean_gc = is_gc.mean() * 100.0
    pos     = np.arange(len(seq))

    fig, ax = plt.subplots(figsize=(17, 4.8))
    ax.fill_between(pos, 0, mean_gc, color='#e8e8e8', zorder=1)
    ax.fill_between(pos, 0, gc, color='#111111', alpha=0.88, zorder=2)
    ax.axhline(mean_gc, color='#bbbbbb', linewidth=0.7,
               linestyle=(0, (5, 7)), zorder=3)
    ax.set_xlim(0, len(seq))
    ax.set_ylim(0, 100)
    bottom_only(ax)
    pos_labels(ax, len(seq))
    caption(ax,
            f'GC  CONTENT   *   {WINDOW} BP  SLIDING  WINDOW   *   '
            f'MEAN  {mean_gc:.1f}%   *   DARK  FILL = GC  SIGNAL   *   '
            f'DASHED  LINE = GENOME  AVERAGE')

    fig.savefig(out, bbox_inches='tight', pad_inches=0.22)
    plt.close(fig)
    print(f'  {out.name}')


# =============================================================================
#  FIG 03  --  Base-frequency density raster
# =============================================================================
def fig_raster(seq, genes, out):
    N_BINS  = 900
    seq_len = len(seq)
    seq_arr = np.array(list(seq))
    bin_idx = np.minimum((np.arange(seq_len) * N_BINS // seq_len), N_BINS - 1)
    bin_cnt = np.bincount(bin_idx, minlength=N_BINS).astype(float)

    grid = np.zeros((4, N_BINS))
    for j, b in enumerate(BASES):
        w   = (seq_arr == b).astype(float)
        raw = np.bincount(bin_idx, weights=w, minlength=N_BINS) / np.maximum(bin_cnt, 1)
        mn, mx = raw.min(), raw.max()
        grid[j] = (raw - mn) / (mx - mn) if mx > mn else raw

    fig, ax = plt.subplots(figsize=(18, 5.0))
    ax.imshow(grid, cmap='binary', aspect='auto', vmin=0, vmax=1,
              extent=[0, seq_len, -0.5, 3.5], origin='lower',
              interpolation='bilinear')
    ax.set_xlim(0, seq_len)
    ax.set_ylim(-0.5, 3.5)
    ax.set_yticks([0, 1, 2, 3])
    ax.set_yticklabels(
        [f'{b}    {BASE_HZ[b]} Hz' for b in BASES],
        fontsize=8, color='#888888'
    )
    ax.tick_params(axis='y', length=0, pad=6)
    for k, sp in ax.spines.items():
        sp.set_visible(k == 'bottom')
        if k == 'bottom':
            sp.set_color('#bbbbbb'); sp.set_linewidth(0.4)
    bottom_only(ax)
    pos_labels(ax, seq_len)
    caption(ax,
            f'PITCH  DENSITY   *   BASE-MODE  PENTATONIC  MAPPING   *   '
            f'{N_BINS}  POSITION  BINS   *   '
            f'DARKNESS = RELATIVE  BASE  FREQUENCY  (NORMALISED  PER  ROW)')
    ax.set_yticks([0, 1, 2, 3])
    ax.set_yticklabels(
        [f'{b}    {BASE_HZ[b]} Hz' for b in BASES],
        fontsize=8, color='#888888'
    )
    ax.tick_params(axis='y', length=0, pad=6)

    fig.savefig(out, bbox_inches='tight', pad_inches=0.22)
    plt.close(fig)
    print(f'  {out.name}')


# =============================================================================
#  Audio synthesis  (for fig 04 only)
# =============================================================================
def _sine(f, d, a=0.40, atk=0.005, rel=0.010):
    n = max(1, int(d * SAMPLE_RATE))
    t = np.linspace(0, d, n, endpoint=False)
    w = a * np.sin(2 * np.pi * f * t)
    ai, ri = int(atk * SAMPLE_RATE), int(rel * SAMPLE_RATE)
    if ai > 0:            w[:ai]    *= np.linspace(0, 1, ai)
    if ri > 0 and ri < n: w[n - ri:] *= np.linspace(1, 0, ri)
    return w

def _tri(f, d, a=0.35, atk=0.010, rel=0.020):
    n = max(1, int(d * SAMPLE_RATE))
    t = np.linspace(0, d, n, endpoint=False)
    w = a * (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * t))
    ai, ri = int(atk * SAMPLE_RATE), int(rel * SAMPLE_RATE)
    if ai > 0:            w[:ai]    *= np.linspace(0, 1, ai)
    if ri > 0 and ri < n: w[n - ri:] *= np.linspace(1, 0, ri)
    return w

def _bell(f, d, a=0.50):
    n = max(1, int(d * SAMPLE_RATE))
    t = np.linspace(0, d, n, endpoint=False)
    mod = 3.5 * np.sin(2 * np.pi * f * 2.756 * t)
    return a * np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 6.0)

def _synth(seq, genes, start0, n_bases, mode, speed=60.0):
    bdur  = 1.0 / speed
    total = int(n_bases * bdur * SAMPLE_RATE) + SAMPLE_RATE
    audio = np.zeros(total)
    i = 0
    while i < n_bases and start0 + i < len(seq):
        pos  = start0 + i
        base = seq[pos]
        feat = feature_at(pos + 1, genes)
        soff = int(i * bdur * SAMPLE_RATE)
        deg  = BASE_DEG.get(base, 4)
        semi = PENTATONIC[deg % len(PENTATONIC)]
        if mode == 'base':
            chunk = _sine(midi_hz(48 + semi), bdur); i += 1
        elif mode == 'codon':
            if i % 3 == 0:
                cod = seq[pos:pos + 3] if pos + 3 <= len(seq) else 'NNN'
                gc  = sum(1 for b in cod if b in 'GC')
                f1  = {'A': 0, 'T': 1, 'G': 2, 'C': 3}.get(cod[0], 0)
                s2  = {'A': 0, 'T': 1, 'G': 2, 'C': 3}.get(cod[1], 0)
                d2  = (gc * 3 + f1 + s2) % 10
                chunk = _tri(midi_hz(52 + PENTATONIC[d2]), bdur * 3)
            else:
                i += 1; continue
            i += 1
        elif mode == 'gc':
            win  = seq[max(0, pos - 30): pos + 30]
            gcv  = sum(1 for b in win if b in 'GC') / max(1, len(win))
            chunk = _sine(midi_hz(36 + gcv * 36), bdur, a=0.30); i += 1
        elif mode == 'gene':
            if feat is None:
                chunk = _sine(midi_hz(36), bdur, a=0.08)
            elif feat['type'] == 'CDS':
                chunk = _tri(midi_hz(52 + semi), bdur, a=0.35)
            elif feat['type'] == 'tRNA':
                chunk = _bell(midi_hz(64 + semi), bdur * 2, a=0.50)
            elif feat['type'] == 'rRNA':
                chunk = _sine(midi_hz(40 + semi), bdur, a=0.45)
            else:
                chunk = _sine(midi_hz(48), bdur, a=0.08)
            i += 1
        else:
            chunk = np.zeros(max(1, int(bdur * SAMPLE_RATE))); i += 1
        e = soff + len(chunk)
        if e <= len(audio):     audio[soff:e] += chunk
        elif soff < len(audio): audio[soff:] += chunk[:len(audio) - soff]
    pk = np.max(np.abs(audio))
    return audio / pk * 0.9 if pk > 0 else audio


# =============================================================================
#  FIG 04  --  Stacked waveforms (Joy Division style)
# =============================================================================
def fig_waves(seq, genes, out):
    START0  = 13593
    N_BASES = 120
    SPEED   = 60.0
    MODES   = ['base', 'codon', 'gc', 'gene']
    LABELS  = ['BASE', 'CODON', 'GC', 'GENE']
    TMAX    = N_BASES / SPEED

    traces = []
    for mode in MODES:
        audio = _synth(seq, genes, START0, N_BASES, mode, SPEED)
        n     = int(TMAX * SAMPLE_RATE)
        t     = np.linspace(0, TMAX, min(n, len(audio)), endpoint=False)
        sig   = audio[:len(t)]
        step  = max(1, len(t) // 8000)
        traces.append((t[::step], sig[::step]))

    OFFSET = 2.6
    MARGIN = TMAX * 0.14

    fig, ax = plt.subplots(figsize=(13, 8.0))
    bare(ax)
    ax.set_xlim(-MARGIN, TMAX)
    ax.set_ylim(-1.2, len(MODES) * OFFSET + 0.8)

    for i, ((t, sig), label) in enumerate(zip(traces, LABELS)):
        y0 = i * OFFSET
        y  = sig + y0
        ax.fill_between(t, y0 - 1.05, y, color='white', zorder=i * 3 + 1)
        ax.plot(t, y, color='#111111', linewidth=0.55, zorder=i * 3 + 2)
        ax.axhline(y0, color='#eeeeee', linewidth=0.4, zorder=i * 3)
        ax.text(-MARGIN * 0.08, y0, label,
                ha='right', va='center', fontsize=8,
                color='#666666', fontweight='bold')

    ax.spines['bottom'].set_visible(True)
    ax.spines['bottom'].set_color('#cccccc')
    ax.spines['bottom'].set_linewidth(0.4)
    ticks = np.linspace(0, TMAX, 9)
    ax.set_xticks(ticks)
    ax.set_xticklabels([f'{v:.1f}' for v in ticks], color='#cccccc', fontsize=6.5)
    ax.tick_params(axis='x', length=2.5, width=0.4, pad=3, color='#cccccc')
    ax.set_xlabel(
        f'TIME  (seconds)   *   COX1  REGION  (POS  13,594 - 13,713)   *   '
        f'{N_BASES}  BASES  AT  {int(SPEED)} BP/S   *   FOUR  SONIFICATION  MODES',
        fontsize=6.5, color='#aaaaaa', labelpad=10)

    fig.savefig(out, bbox_inches='tight', pad_inches=0.28)
    plt.close(fig)
    print(f'  {out.name}')


# =============================================================================
#  FIG 05  --  Codon-usage textile
# =============================================================================
def fig_codon_textile(seq, genes, out):
    ALL_BASES = ['A', 'C', 'G', 'T']
    counts = {b1 + b2 + b3: 0
              for b1 in ALL_BASES for b2 in ALL_BASES for b3 in ALL_BASES}
    total = 0
    for g in genes:
        if g['type'] != 'CDS': continue
        cds = seq[g['start'] - 1: g['end']]
        for i in range(0, len(cds) - 2, 3):
            c = cds[i:i + 3]
            if c in counts:
                counts[c] += 1; total += 1

    b23 = [b2 + b3 for b2 in ALL_BASES for b3 in ALL_BASES]
    grid = np.zeros((4, 16))
    for i, b1 in enumerate(ALL_BASES):
        for j, bc in enumerate(b23):
            grid[i, j] = counts.get(b1 + bc, 0)
    row_sum  = grid.sum(axis=1, keepdims=True)
    grid_pct = np.where(row_sum > 0, grid / row_sum * 100.0, 0)
    thresh   = 0.50 * grid_pct.max()

    fig, ax = plt.subplots(figsize=(15, 4.8))
    ax.imshow(grid_pct, cmap='Greys', aspect='auto', vmin=0, vmax=grid_pct.max())

    for i, b1 in enumerate(ALL_BASES):
        for j, bc in enumerate(b23):
            pct = grid_pct[i, j]
            tc  = 'white' if pct > thresh else '#333333'
            ax.text(j, i, b1 + bc,
                    ha='center', va='center',
                    fontsize=8, fontfamily='monospace',
                    color=tc, fontweight='bold')

    ax.set_xticks(range(16))
    ax.set_xticklabels(b23, fontsize=7.5, fontfamily='monospace', color='#999999')
    ax.set_yticks(range(4))
    ax.set_yticklabels(ALL_BASES, fontsize=13, fontfamily='monospace',
                       fontweight='bold', color='#777777')
    ax.tick_params(length=0, pad=8)
    for sp in ax.spines.values():
        sp.set_visible(False)
    caption(ax,
            f'CODON  USAGE   *   ALL  CDS  REGIONS   *   {total:,}  CODONS   *   '
            f'COLUMNS = 2ND + 3RD  POSITION   *   '
            f'SHADE = FREQUENCY  WITHIN  FIRST-BASE  GROUP')

    fig.savefig(out, bbox_inches='tight', pad_inches=0.22)
    plt.close(fig)
    print(f'  {out.name}')


# =============================================================================
#  FIG 06  --  Base composition overlapping curves
# =============================================================================
def fig_base_composition(seq, genes, out):
    WINDOW  = 250
    seq_len = len(seq)
    seq_arr = np.array(list(seq))
    pos     = np.arange(seq_len)

    STYLES = {
        'A': dict(lw=1.10, ls=(0, (1, 0))),
        'T': dict(lw=0.90, ls=(0, (5, 3))),
        'G': dict(lw=0.85, ls=(0, (1, 1.8))),
        'C': dict(lw=0.80, ls=(0, (4, 2, 1, 2))),
    }
    STEP = 4

    fig, ax = plt.subplots(figsize=(17, 4.4))
    for b in BASES:
        arr   = sliding((seq_arr == b).astype(float), WINDOW) * 100.0
        arr_d = arr[::STEP]
        pos_d = pos[::STEP]
        ax.plot(pos_d, arr_d, color='#111111', zorder=2, **STYLES[b])
        ax.text(seq_len + seq_len * 0.005, float(arr[-1]),
                b, fontsize=9.5, fontweight='bold',
                color='#555555', va='center', clip_on=False)

    ax.set_xlim(0, seq_len)
    ax.set_ylim(0, 50)
    ax.axhline(25, color='#eeeeee', linewidth=0.5, zorder=1)
    bottom_only(ax)
    pos_labels(ax, seq_len)
    caption(ax,
            f'BASE  COMPOSITION   *   {WINDOW} BP  SLIDING  WINDOW   *   '
            f'SOLID = A   *   DASHED = T   *   DOTTED = G   *   DASH-DOT = C')

    fig.savefig(out, bbox_inches='tight', pad_inches=0.28)
    plt.close(fig)
    print(f'  {out.name}')


# =============================================================================
#  Main
# =============================================================================
def main():
    print('Loading data ...')
    seq   = load_sequence()
    genes = load_genes()
    print(f'  {len(seq):,} bp  *  {len(genes)} features  ->  {OUT_DIR.relative_to(SCRIPT_DIR)}/')

    FIGURES = [
        ('viz_01_genome_barcode.png',   fig_barcode),
        ('viz_02_gc_horizon.png',        fig_gc_horizon),
        ('viz_03_frequency_raster.png',  fig_raster),
        ('viz_04_waveforms.png',         fig_waves),
        ('viz_05_codon_textile.png',     fig_codon_textile),
        ('viz_06_base_composition.png',  fig_base_composition),
    ]

    for name, fn in FIGURES:
        print(f'-> {name}')
        fn(seq, genes, OUT_DIR / name)

    print(f'\nDone.  6 figures in  {OUT_DIR}/')


if __name__ == '__main__':
    main()
