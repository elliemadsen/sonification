# DNA Sonification — _Pinna nobilis_ mitogenome

Scrolling visualisation and polyphonic audio sonification of the 18,915 bp
_Pinna nobilis_ mitochondrial genome (GenBank PZ220846.1).

---

## Visual media

### Main note area _(centre of the frame)_

The large central area shows the DNA sequence as **scrolling letters**
(A / T / G / C) moving right-to-left past a fixed white **playhead** line
(at 25 % from the left edge).

#### Vertical position = pitch

Every element in this area is placed vertically according to its
**audio pitch**: higher on screen = higher note. The mapping covers
MIDI notes 34 – 86 (roughly B1 to D#6).

#### What you see, layer by layer

| Element                               | Represents                 | Audio layer | Pitch range       |
| ------------------------------------- | -------------------------- | ----------- | ----------------- |
| **A / T / G / C letters**             | Single-nucleotide pitch    | Layer 1     | C3 – Bb3          |
| Faint horizontal **staff lines**      | Fixed lane for each base   | —           | (same as letters) |
| Small **circle dots** (mid-screen)    | Codon amino-acid pitch     | Layer 5     | E3 – E5           |
| Tiny **pixel dots** (high, near top)  | Di-nucleotide pair pitch   | Layer 2     | A4 – C6           |
| **White notch** marker                | Trinucleotide repeat event | Layer 6     | C6 – C7           |
| Scrolling **dim curve** (near bottom) | GC content — 10 bp window  | Layer 3     | C2 – A3           |
| Scrolling **very dim curve** (bottom) | GC content — 100 bp window | Layer 4     | E1 – E3           |

##### Letter brightness

- **White, larger** — the base currently under the playhead (what is sounding _now_)
- **Greying out leftward** — bases already played
- **Lighter rightward** — upcoming bases

##### The two horizontal curves near the bottom

These are the **GC-content waveforms**. Both scroll with the sequence:

- The slightly brighter curve tracks GC% over a **10 bp window** (fast, local variation)
- The dimmer curve below it tracks GC% over a **100 bp window** (slow, regional trend)

When GC content is roughly constant over the visible window the curves
look like flat horizontal lines; they bend and wave wherever the local
GC composition shifts.

---

### EQ panel _(narrow strip below the note area)_

Each base column has three vertical sub-bands, all growing upward:

| Sub-band         | Data                       |
| ---------------- | -------------------------- |
| Left (darker)    | GC% at 10 bp window        |
| Centre (darkest) | GC% at 100 bp window       |
| Right (lightest) | Di-nucleotide pitch height |

The playhead is marked by a dim vertical line.

---

### Progress bar _(very bottom, 3 px)_

A dim horizontal bar that fills left-to-right as the genome is scanned.

---

## Audio layers

| #   | Source                             | Waveform   | MIDI range         |
| --- | ---------------------------------- | ---------- | ------------------ |
| 1   | Single nucleotide (A/T/G/C)        | Sine       | 48 – 58 (C3 – Bb3) |
| 2   | Di-nucleotide pair (16 combos)     | Triangle   | 69 – 84 (A4 – C6)  |
| 3   | GC content — 10 bp window          | Soft sine  | 36 – 57 (C2 – A3)  |
| 4   | GC content — 100 bp window         | Drone sine | 28 – 52 (E1 – E3)  |
| 5   | Codon amino acid (reading frame 0) | Triangle   | 52 – 76 (E3 – E5)  |
| 6   | Trinucleotide repeat events        | FM bell    | 84 – 96 (C6 – C7)  |

All layers are mixed and soft-clipped (`tanh`) before output.

### Modes

| Flag          | Layers active         |
| ------------- | --------------------- |
| `--mode full` | 1 + 2 + 3 + 4 + 5 + 6 |
| `--mode lite` | 1 + 3 + 5             |
| `--mode base` | 1 only                |

---

## Usage

```bash
# Quick 10-second test (first 50 bases)
python sonify_dna.py --mode full --length 50 --speed 5

# Full genome, lite audio mode, 60 fps
python sonify_dna.py --mode lite --fps 60

# Custom region
python sonify_dna.py --mode full --start 1000 --length 500 --speed 3 --output cox1_region

# With reverb and echo effects
python sonify_dna.py --mode full --length 200 --reverb 0.3 --echo 0.25 --echo-delay 0.2
```

### All options

| Flag           | Default | Description                          |
| -------------- | ------- | ------------------------------------ |
| `--mode`       | `full`  | Audio mode: `full`, `lite`, `base`   |
| `--speed`      | `5`     | Bases per second                     |
| `--start`      | `1`     | Start position (1-based)             |
| `--length`     | `0`     | Bases to render (0 = full genome)    |
| `--fps`        | `30`    | Frames per second                    |
| `--width`      | `1280`  | Frame width (px)                     |
| `--height`     | `720`   | Frame height (px)                    |
| `--col-width`  | `14`    | Pixels per base column               |
| `--output`     | auto    | Output filename stem (no extension)  |
| `--reverb`     | `0.0`   | Reverb wet mix 0.0–1.0 (0 = off)     |
| `--echo`       | `0.0`   | Echo/delay wet mix 0.0–1.0 (0 = off) |
| `--echo-delay` | `0.30`  | Echo tap spacing in seconds          |

---

## Files

| File                       | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `sonify_dna.py`            | Main script (v2)                               |
| `visualize_dna.py`         | Static PNG visualisations (6 figures → `viz/`) |
| `pinna_nobilis.fasta`      | 18,915 bp mitogenome sequence                  |
| `pinna_nobilis_genes.json` | 36 annotated features (CDS, tRNA, rRNA)        |

---

## Reference

Auditory display approach inspired by  
Mark Temple — _8-Channel Auditory Display of DNA_  
<https://marktemple.github.io/8ChannelAuditoryDisplay/>
