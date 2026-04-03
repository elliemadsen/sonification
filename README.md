# Sonify — Image Sonification Studio

A browser-based tool that scans images and converts pixel data into sound.

A vertical (or horizontal) playhead sweeps across the loaded image one pixel column (or row) at a time. At each step, N sample points are distributed evenly along the playhead. Each sample reads pixel colour data from an offscreen canvas and converts it to a musical pitch and volume according to the active scan mode.

## Scan Modes

### Bright

Pixel luminance maps to pitch. Each of the N voices samples one point along the playhead; darker pixels produce lower notes, brighter pixels produce higher notes. Volume scales with distance from mid-grey (pixels near pure black or pure white are louder than mid-greys).

- **Pitch formula:** `t = 1 − brightness` → mapped through `getNote(t)` to a scale degree
- **Volume formula:** `(0.15 + 0.85 × distFromEdge) × 0.4 / N`

### Color

The R, G, and B channels each drive a separate persistent oscillator. The pitch range is divided into three bands — red controls the low register, green the mid register, blue the high register. Within each band, the pitch is set by the intensity-weighted centroid of that channel across all sample points (where the colour is heaviest vertically sets the exact note).

- **Band mapping:** `bandT = band/3 + (1 − centroid)/3`, where `band ∈ {0, 1, 2}`
- **Volume:** proportional to average channel intensity; silent below 4% intensity

### Edge

Runs a Sobel edge-detection pass over the full image once on load. During scanning, each sample point compares the brightness difference between the current column and the previous column. Differences above the threshold fire a short percussive note.

- **Pitch:** vertical position of the edge → `getNote(1 − pos)`
- **Volume:** `min(diff × 4, 1) × 0.6`
- **Note shape:** 8 ms attack + exponential decay over `dur × 1.5` seconds

### Spectral

Treats the playhead column as a frequency spectrum: vertical position maps to pitch (top = high, bottom = low), and pixel brightness inverts to volume (darker pixels play louder, modelling energy at that frequency).

- **Pitch formula:** `t = 1 − pos`
- **Volume formula:** `(1 − normBrightness) × 0.5 / N`

---

## Audio Architecture

### Web Audio Graph

```
Oscillators / spawned notes
       │
  masterGain ──────────────── AudioContext.destination  (direct / dry)
       │
  reverbGainNode
       │
  ConvolverNode (1.5 s synthetic impulse response)
       │
  AudioContext.destination  (wet path)

  masterGain ──── AnalyserNode  (visualiser feed)
```

### Persistent Oscillator Pools

To avoid the buzzing artefacts caused by rapidly spawning and stopping oscillators every frame, **Bright**, **Color**, and **Spectral** modes use persistent oscillator pools that are created once and updated every tick with smooth parameter glides:

```javascript
osc.frequency.setTargetAtTime(targetFreq, now, 0.025); // 25 ms time constant
gain.gain.setTargetAtTime(targetVol, now, 0.025);
```

**`colorOscs`** — object with keys `r`, `g`, `b`, each holding `{ osc, gain }`. Created by `initColorOscs()`, updated by `updateColorOscs()`, torn down by `teardownColorOscs()`.

**`voiceOscs`** — array of `{ osc, gain }` with length equal to the Voices slider value. Managed by `initVoiceOscs(n)`, `updateVoiceOscs()`, `teardownVoiceOscs()`. If the Voices count changes between ticks the pool is re-initialised automatically.

Both pools are torn down (gain faded to 0, then nodes stopped after 300–400 ms) on:

- **Pause** — in `togglePlay()`
- **Reset** — in `resetScan()`
- **Mode change** — in `setMode()` (color pool on leaving color mode; voice pool on leaving bright/spectral)

### Edge Mode — Spawned Notes

Edge hits are intentionally kept as short-lived spawned oscillators because the sound is percussive (discrete events, not continuous tones). Each detected edge creates one `OscillatorNode` + `GainNode`, ramps up in ~8 ms, and stops after `dur × 1.5` seconds.

### Reverb

A synthetic impulse response is generated at audio init: 1.5 s stereo exponential noise decay (`(random × 2 − 1) × (1 − i/len)^2.5`). A `ConvolverNode` is fed through a `reverbGainNode` whose gain is controlled by the Reverb Mix slider.

### Scale & Pitch Mapping

```javascript
function getNote(t) {
  // t ∈ [0, 1]  →  MIDI note number
  const scale = SCALES[selectedScale]; // interval array from root
  const semis = rangeSlider; // max semitones above root
  // find the subset of scale degrees within semis
  // map t linearly onto that subset
  return root + scale[floor(t * (len - 1))];
}
```

Available scales: Pentatonic, Major, Natural Minor, Dorian, Chromatic, Whole Tone, Blues.

MIDI to frequency: `440 × 2^((midi − 69) / 12)`

---

## Sub-Pixel Scan Speed

- Range 0.25–30 px/frame (0.25 steps); float `scanAccum` advances each frame
- `playTick()` fires only when `Math.floor(scanAccum)` crosses a new integer pixel
- Reset to `0` on stop; set to `scanPos` on seek

---

## Image & File Support

- JPG, PNG, WebP, GIF — native browser decoding
- HEIC/HEIF — `heic2any` lazy-loaded from CDN
- PDF — `pdfjs-dist` v3.11 lazy-loaded, rendered at 2× scale; multi-page PREV/NEXT nav
- Images scaled to fit canvas; offscreen `<canvas>` used for fast `getImageData`

---

## Mask Editor

- Transparent canvas overlay; `alpha > 128` at a sample point silences it across all modes
- MASK brush: opaque red fill; UNMASK brush: `destination-out` erase; Clear resets canvas
- Brush preview: dashed white circle at canvas centre, clears after 1 400 ms
- Layer order: image → edge overlay → mask → playhead line

---

## Export (Audio & Video)

- All exports use `OfflineAudioContext` + `scheduleNotesAtPos()` to pre-render audio silently
- **Audio:** 16-bit stereo WAV via hand-written `DataView` → `sonify_audio.wav`
- **Video (primary):** WebCodecs + `mp4-muxer` — H.264 + AAC, 4 Mbps, keyframe every 2 s → `sonify_video.mp4`
- **Video (fallback):** MediaRecorder → WebM/MP4; last resort: audio-only WAV
- iOS: Web Share API (share sheet); desktop: `<a download>`

---

## Sound Parameters

| Parameter          | Range                 | Default    | Notes                                                  |
| ------------------ | --------------------- | ---------- | ------------------------------------------------------ |
| Scan Speed         | 0.25 – 30 px/frame    | 1          | Float; sub-pixel via accumulator                       |
| Sample Voices      | 2 – 24                | 10         | Points sampled per tick; also oscillator pool size     |
| Note Duration      | 20 – 500 ms           | 80 ms      | Controls edge note decay; affects export frame timing  |
| Volume             | 0 – 100 %             | 65 %       | Maps directly to `masterGain.gain`                     |
| Reverb Mix         | 0 – 100 %             | 20 %       | `reverbGainNode.gain` into ConvolverNode               |
| Pitch Range        | 6 – 48 semitones      | 24         | Clips scale degree array                               |
| Edge Threshold     | 1 – 50 %              | 7 %        | Min brightness diff to fire an edge note               |
| Brightness Floor   | 0 – 100 %             | 0 %        | Pixels below this → silent (bright / color / spectral) |
| Brightness Ceiling | 0 – 100 %             | 100 %      | Pixels above this → silent (bright / color / spectral) |
| Waveform           | sine / tri / sq / saw | sine       | Applied to all oscillators                             |
| Scale              | 7 options             | Pentatonic | Interval set used by `getNote()`                       |
| Root Note          | C3 – G4               | C4         | MIDI base offset for `getNote()`                       |

---

## Mobile & iOS

- ≤ 640 px: sidebar capped at 40 vh, canvas fills remainder; visualiser hidden
- iOS silent-switch fix: looping silent WAV keeps AVAudioSession alive
- `AudioContext` unlocked on first `touchstart`; play button uses `touchend` + `preventDefault()`
