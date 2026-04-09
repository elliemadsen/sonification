/* ═══════════════════════════════════════════════════════════════════════════
   Sonify – Image Sonification Studio
   ═══════════════════════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────────────────────
let img = null;
let audioCtx = null, masterGain = null, reverbNode = null, reverbGainNode = null, analyser = null;
let scanning = false, scanPos = 0, scanAccum = 0, animId = null;
let colorOscs = null; // persistent R/G/B oscillators for color mode
let voiceOscs = null; // persistent oscillator pool for bright / spectral
let voiceOscCount = 0;
let brushPreviewTimeout = null;
let direction = 'lr', mode = 'edge', waveform = 'sine';
let edgeThreshold = 0.07;
let brightnessFloor = 0.0;
let brightnessCeiling = 1.0;
let offscreenCanvas = null, offCtx = null;
let logicalW = 0, logicalH = 0;

// Edge detection
let edgeMap = null;               // Float32Array of normalised Sobel magnitudes
let edgeOverlayCanvas = null;     // Pre-rendered green overlay

// Mask (edit mode)
let maskCanvas = null, maskCtx = null;
let editMode = false, showOverlay = false;
let isPainting = false;
let brushSize = 20;
let brushErase = true; // true = mask out (hide), false = unmask (restore)

// Export state – no longer using MediaRecorder live audio
let isExporting = false;

// ── CONSTANTS ─────────────────────────────────────────────────────────────
const SCALES = {
  pentatonic: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28],
  major:      [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24],
  minor:      [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24],
  dorian:     [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24],
  chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
  wholetone:  [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
  blues:      [0, 3, 5, 6, 7, 10, 12, 15, 17, 18, 19, 22, 24],
};
const MODEDESCS = {
  bright:   'Pixel brightness maps to pitch. Darker = lower, lighter = higher.',
  color:    'R, G, and B each play separate notes. Red = low register, green = mid, blue = high. Vertical position sweeps pitch within each band.',
  edge:     'Detects sharp contrast edges. Each edge fires a note pitched to its vertical position.',
  spectral: 'Column becomes a frequency spectrum: position = pitch, brightness = volume. Like playing a spectrogram.',
};

// ── DETERMINISTIC REVERB IR ───────────────────────────────────────────────
// Using a seeded LCG so the IR is identical every time (live and offline).
function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}
function makeIR(ctx) {
  const irLen = Math.round(ctx.sampleRate * 1.5);
  const ir    = ctx.createBuffer(2, irLen, ctx.sampleRate);
  const rand  = seededRand(0xdeadbeef);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < irLen; i++)
      d[i] = (rand() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
  }
  return ir;
}

// ── DOM SETUP ─────────────────────────────────────────────────────────────
const vuMeter = document.getElementById('vuMeter');
for (let i = 0; i < 12; i++) {
  const b = document.createElement('div');
  b.className = 'vu-bar';
  vuMeter.appendChild(b);
}
const pg = document.getElementById('pgrid');
for (let i = 0; i < 32; i++) {
  const c = document.createElement('div');
  c.className = 'pg-cell';
  pg.appendChild(c);
}

// ── HELPERS ───────────────────────────────────────────────────────────────
function setStatus(text, active) {
  document.getElementById('statusText').textContent = text;
  document.getElementById('statusDot').classList.toggle('active', active);
}

// ── iOS AUDIO UNLOCK ──────────────────────────────────────────────────────
function iosAudioUnlock() {
  if (!audioCtx) return;
  const buf = audioCtx.createBuffer(1, 1, 22050);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.connect(audioCtx.destination);
  src.start(0);
}

document.addEventListener('touchstart', () => {
  window._iosSessionStart();
  if (audioCtx && audioCtx.state !== 'running') {
    audioCtx.resume().then(iosAudioUnlock);
  }
}, true);

// ── iOS SILENT-SWITCH FIX ─────────────────────────────────────────────────
(function () {
  const sr = 44100, n = sr;
  const ab = new ArrayBuffer(44 + n * 2);
  const v = new DataView(ab);
  const ws = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, n * 2, true);
  const url = URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }));
  const _silentAudio = new Audio(url);
  _silentAudio.loop = true;
  _silentAudio.volume = 0.001;
  _silentAudio.setAttribute('playsinline', '');
  _silentAudio.setAttribute('webkit-playsinline', '');

  window._iosSessionStart = () => { _silentAudio.play().catch(() => {}); };
  window._iosSessionStop  = () => { if (!_silentAudio.paused) _silentAudio.pause(); };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !_silentAudio.paused) _silentAudio.play().catch(() => {});
  });
}());

// ── PDF STATE ─────────────────────────────────────────────────────────────
let pdfDoc = null;       // PDF.js document
let pdfCurrentPage = 1;  // Current page number (1-based)
let pdfFile = null;      // Keep reference to original PDF file

// ── HEIC SUPPORT ──────────────────────────────────────────────────────────
async function decodeImageFile(file) {
  const isHeic = /\.(heic|heif)$/i.test(file.name) ||
    file.type === 'image/heic' || file.type === 'image/heif';
  if (isHeic) {
    try {
      if (!window.heic2any) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const blob = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      return URL.createObjectURL(blob instanceof Array ? blob[0] : blob);
    } catch (e) {
      console.warn('heic2any failed, trying native:', e);
      return URL.createObjectURL(file);
    }
  }
  return URL.createObjectURL(file);
}

// ── PDF SUPPORT ───────────────────────────────────────────────────────────
async function loadPdfJs() {
  if (window.pdfjsLib) return;
  // Use the UMD build which reliably sets window.pdfjsLib
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }
}

function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

async function renderPdfPage(doc, pageNum) {
  const page = await doc.getPage(pageNum);
  // Render at 2x for crisp quality
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

async function loadPdf(file) {
  try {
    await loadPdfJs();
    if (!window.pdfjsLib) { alert('Could not load PDF library.'); return; }
    const arrayBuf = await file.arrayBuffer();
    pdfDoc = await window.pdfjsLib.getDocument({ data: arrayBuf }).promise;
    pdfFile = file;
    pdfCurrentPage = 1;
    updatePdfPageNav();
    await loadPdfPageAsImage(pdfCurrentPage);
  } catch (e) {
    console.error('PDF load failed:', e);
    alert('Could not load PDF: ' + e.message);
  }
}

async function loadPdfPageAsImage(pageNum) {
  if (!pdfDoc) return;
  setStatus('RENDERING PDF…', true);
  try {
    const objectUrl = await renderPdfPage(pdfDoc, pageNum);
    const image = new Image();
    image.onload = () => { loadImageFromElement(image); };
    image.onerror = () => alert('Could not render PDF page.');
    image.src = objectUrl;
  } catch (e) {
    console.error('PDF page render failed:', e);
    alert('Could not render PDF page: ' + e.message);
    setStatus('IDLE', false);
  }
}

function updatePdfPageNav() {
  const nav = document.getElementById('pdfPageNav');
  if (!pdfDoc || pdfDoc.numPages <= 1) {
    nav.style.display = 'none';
    return;
  }
  nav.style.display = 'block';
  document.getElementById('pdfPageInfo').textContent =
    pdfCurrentPage + ' / ' + pdfDoc.numPages;
  document.getElementById('pdfPrev').disabled = pdfCurrentPage <= 1;
  document.getElementById('pdfNext').disabled = pdfCurrentPage >= pdfDoc.numPages;
}

async function pdfChangePage(delta) {
  if (!pdfDoc) return;
  const newPage = pdfCurrentPage + delta;
  if (newPage < 1 || newPage > pdfDoc.numPages) return;
  pdfCurrentPage = newPage;
  updatePdfPageNav();
  // Stop scanning before switching pages
  if (scanning) togglePlay();
  await loadPdfPageAsImage(pdfCurrentPage);
}
// Expose to global for onclick
window.pdfChangePage = pdfChangePage;

// ── IMAGE LOADING ─────────────────────────────────────────────────────────
function loadImageFromElement(image) {
  img = image;
  const wrap = document.getElementById('canvasWrap');
  const maxW = wrap.clientWidth - 32, maxH = wrap.clientHeight - 32;
  let w = image.width, h = image.height;
  if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
  if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }

  const dpr = window.devicePixelRatio || 1;
  logicalW = w; logicalH = h;
  const mc = document.getElementById('mainCanvas');
  mc.width  = Math.round(w * dpr);
  mc.height = Math.round(h * dpr);
  mc.style.width  = w + 'px';
  mc.style.height = h + 'px';

  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = w; offscreenCanvas.height = h;
  offCtx = offscreenCanvas.getContext('2d');
  offCtx.drawImage(img, 0, 0, w, h);

  mc.style.display = 'block';
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('vizWrap').style.display = window.innerWidth > 640 ? 'block' : 'none';
  document.getElementById('playBtn').disabled = false;
  document.getElementById('resetBtn').disabled = false;
  document.getElementById('dlAudio').disabled = false;
  document.getElementById('dlVideo').disabled = false;

  // Show edge editor section
  document.getElementById('edgeEditorSection').style.display = 'block';

  scanPos = 0;

  // Compute edge map & init mask
  computeEdgeMap();
  initMask();

  drawPlayhead();
  setStatus('IDLE', false);

  const vc = document.getElementById('vizCanvas');
  vc.width = vc.parentElement.clientWidth || mc.clientWidth || w;
  vc.height = 32;
}

async function loadImage(file) {
  // Check if it's a PDF
  if (isPdfFile(file)) {
    // Hide PDF page nav from a previous image load
    document.getElementById('pdfPageNav').style.display = 'none';
    await loadPdf(file);
    return;
  }

  // Reset PDF state when loading a non-PDF
  pdfDoc = null;
  pdfFile = null;
  document.getElementById('pdfPageNav').style.display = 'none';

  let objectUrl;
  try { objectUrl = await decodeImageFile(file); }
  catch (e) { alert('Could not decode image. Try saving as JPG or PNG first.'); return; }

  const image = new Image();
  image.onload = () => { loadImageFromElement(image); };
  image.onerror = () => alert('Could not load image. For HEIC, try recent Chrome or Safari.');
  image.src = objectUrl;
}

document.getElementById('fileInput').addEventListener('change', e => {
  if (e.target.files[0]) loadImage(e.target.files[0]);
});
const dz = document.getElementById('dropZone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
dz.addEventListener('drop', e => {
  e.preventDefault(); dz.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) {
    // Also accept PDFs from drag-and-drop
    loadImage(file);
  }
});

// ── SOBEL EDGE DETECTION ──────────────────────────────────────────────────
function computeEdgeMap() {
  if (!offCtx) return;
  const w = logicalW, h = logicalH;
  const imgData = offCtx.getImageData(0, 0, w, h).data;

  // Convert to greyscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = (imgData[i*4]*0.299 + imgData[i*4+1]*0.587 + imgData[i*4+2]*0.114) / 255;
  }

  // Sobel
  const edges = new Float32Array(w * h);
  let maxVal = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx = -gray[(y-1)*w+(x-1)] + gray[(y-1)*w+(x+1)]
               - 2*gray[y*w+(x-1)]     + 2*gray[y*w+(x+1)]
               - gray[(y+1)*w+(x-1)]   + gray[(y+1)*w+(x+1)];
      const gy = -gray[(y-1)*w+(x-1)] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+(x+1)]
               + gray[(y+1)*w+(x-1)]   + 2*gray[(y+1)*w+x] + gray[(y+1)*w+(x+1)];
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[y * w + x] = mag;
      if (mag > maxVal) maxVal = mag;
    }
  }

  // Normalise to [0, 1]
  if (maxVal > 0) for (let i = 0; i < edges.length; i++) edges[i] /= maxVal;
  edgeMap = edges;
  renderEdgeOverlay();
}

function renderEdgeOverlay() {
  if (!edgeMap) return;
  const w = logicalW, h = logicalH;
  edgeOverlayCanvas = document.createElement('canvas');
  edgeOverlayCanvas.width = w; edgeOverlayCanvas.height = h;
  const ctx = edgeOverlayCanvas.getContext('2d');
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = edgeMap[i];
    if (v >= edgeThreshold) {
      const a = Math.min(v * 2.5, 1);
      out.data[i*4]     = 150;
      out.data[i*4 + 1] = 240;
      out.data[i*4 + 2] = 140;
    //   out.data[i*4]     = 226;
    //   out.data[i*4 + 1] = 241;
    //   out.data[i*4 + 2] = 142;
      out.data[i*4 + 3] = Math.floor(a * 180);
    }
  }
  ctx.putImageData(out, 0, 0);
}

// ── MASK CANVAS ───────────────────────────────────────────────────────────
function initMask() {
  maskCanvas = document.createElement('canvas');
  maskCanvas.width = logicalW; maskCanvas.height = logicalH;
  maskCtx = maskCanvas.getContext('2d');
  // Default: fully transparent = unmasked
  maskCtx.clearRect(0, 0, logicalW, logicalH);
}

function clearMask() {
  if (!maskCtx) return;
  maskCtx.clearRect(0, 0, logicalW, logicalH);
  drawPlayhead();
}

function paintMask(cx, cy) {
  if (!maskCtx) return;
  if (brushErase) {
    // Paint opaque red = masked
    maskCtx.fillStyle = 'rgba(255, 40, 40, 0.85)';
    maskCtx.beginPath();
    maskCtx.arc(cx, cy, brushSize, 0, Math.PI * 2);
    maskCtx.fill();
  } else {
    // Erase mask = restore
    maskCtx.save();
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.beginPath();
    maskCtx.arc(cx, cy, brushSize, 0, Math.PI * 2);
    maskCtx.fill();
    maskCtx.restore();
  }
}

// ── DRAW PLAYHEAD ─────────────────────────────────────────────────────────
function drawPlayhead() {
  if (!img || !offscreenCanvas) return;
  const mc = document.getElementById('mainCanvas');
  const mctx = mc.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 1. Base image
  mctx.drawImage(offscreenCanvas, 0, 0, logicalW, logicalH);

  // 2. Edge overlay
  if (showOverlay && edgeOverlayCanvas) {
    mctx.globalAlpha = 0.7;
    mctx.drawImage(edgeOverlayCanvas, 0, 0, logicalW, logicalH);
    mctx.globalAlpha = 1.0;
  }

  // 3. Mask overlay
  if (maskCanvas && editMode) {
    mctx.globalAlpha = 0.45;
    mctx.drawImage(maskCanvas, 0, 0, logicalW, logicalH);
    mctx.globalAlpha = 1.0;
  }

  // 4. Playhead line
  const color = document.getElementById('lineColor').value;
  mctx.strokeStyle = color;
  mctx.lineWidth = 1.5;
  mctx.shadowColor = color;
  mctx.shadowBlur = 6;
  mctx.beginPath();
  if (direction === 'lr') {
    mctx.moveTo(scanPos, 0);
    mctx.lineTo(scanPos, logicalH);
  } else {
    mctx.moveTo(0, scanPos);
    mctx.lineTo(logicalW, scanPos);
  }
  mctx.stroke();
  mctx.shadowBlur = 0;
}

// ── AUDIO INIT ────────────────────────────────────────────────────────────
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.onstatechange = () => {
    if (audioCtx.state !== 'running' && scanning) audioCtx.resume();
  };
  masterGain = audioCtx.createGain();
  masterGain.gain.value = parseFloat(document.getElementById('volSlider').value);

  reverbNode = audioCtx.createConvolver();
  reverbNode.buffer = makeIR(audioCtx);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  reverbGainNode = audioCtx.createGain();
  reverbGainNode.gain.value = parseFloat(document.getElementById('reverbSlider').value);
  document.getElementById('reverbSlider').addEventListener('input',
    e => (reverbGainNode.gain.value = parseFloat(e.target.value)));

  masterGain.connect(audioCtx.destination);
  masterGain.connect(reverbGainNode);
  reverbGainNode.connect(reverbNode);
  reverbNode.connect(audioCtx.destination);
  masterGain.connect(analyser);

  drawViz();
}

function drawViz() {
  const vc = document.getElementById('vizCanvas');
  const vctx = vc.getContext('2d');
  const data = new Uint8Array(analyser.frequencyBinCount);
  function loop() {
    analyser.getByteFrequencyData(data);
    vctx.fillStyle = '#ffffff';
    vctx.fillRect(0, 0, vc.width, vc.height);
    const bw = vc.width / data.length;
    for (let i = 0; i < data.length; i++) {
      const h = (data[i] / 255) * vc.height;
      const t = i / data.length;
      vctx.fillStyle = `hsl(${80 + t * 40},${60 + t * 20}%,${30 + t * 15}%)`;
      vctx.fillRect(i * bw, vc.height - h, Math.max(bw - 0.5, 1), h);
    }
    const vuBars = vuMeter.querySelectorAll('.vu-bar');
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length / 255;
    vuBars.forEach((b, idx) => {
      const thresh = idx / vuBars.length;
      b.style.height = (thresh < avg ? 5 + Math.random() * 14 : 3) + 'px';
      b.style.background = thresh < 0.6 ? '#e2f18e' : thresh < 0.85 ? '#d4e370' : '#c84000';
    });
    requestAnimationFrame(loop);
  }
  loop();
}

// ── COLOR MODE – PERSISTENT OSCILLATORS ─────────────────────────────────
function initColorOscs() {
  if (!audioCtx || colorOscs) return;
  colorOscs = {};
  ['r', 'g', 'b'].forEach(ch => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = waveform;
    osc.frequency.value = 220;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    colorOscs[ch] = { osc, gain };
  });
}

function teardownColorOscs() {
  if (!colorOscs || !audioCtx) return;
  const now = audioCtx.currentTime;
  Object.values(colorOscs).forEach(({ osc, gain }) => {
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.04);
      setTimeout(() => { try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch(e) {} }, 400);
    } catch(e) {}
  });
  colorOscs = null;
}

function updateColorOscs() {
  if (!audioCtx) return;
  if (!colorOscs) initColorOscs();
  if (!colorOscs) return;
  const now = audioCtx.currentTime;
  const smooth = 0.025;
  const samples = sampleLine().filter(s => s.a >= 10 && !s.masked);
  if (samples.length === 0) return;
  [[s => s.r, 'r', 0], [s => s.g, 'g', 1], [s => s.b, 'b', 2]].forEach(([ch, key, band]) => {
    let weightSum = 0, posSum = 0;
    samples.forEach(s => { const v = ch(s); weightSum += v; posSum += v * s.pos; });
    const avg = weightSum / samples.length;
    const centroid = weightSum > 0 ? posSum / weightSum : 0.5;
    const bandT = band / 3 + (1 - centroid) / 3;
    const freq = midiToFreq(getNote(bandT));
    const vol = avg < 0.04 ? 0 : Math.min(avg * 0.45, 0.32);
    colorOscs[key].osc.type = waveform;
    colorOscs[key].osc.frequency.setTargetAtTime(freq, now, smooth);
    colorOscs[key].gain.gain.setTargetAtTime(vol, now, smooth);
  });
}

// ── AUDIO ENGINE ──────────────────────────────────────────────────────────
function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function getNote(t) {
  const scale = SCALES[document.getElementById('scaleSelect').value];
  const root  = parseInt(document.getElementById('rootSelect').value);
  const semis = parseInt(document.getElementById('rangeSlider').value);
  const maxIdx = scale.findIndex(v => v >= semis);
  const len = maxIdx > 0 ? maxIdx : scale.length;
  return root + scale[Math.min(Math.floor(t * (len - 1)), len - 1)];
}

function sampleLine() {
  const voices = parseInt(document.getElementById('voicesSlider').value);
  return Array.from({ length: voices }, (_, i) => {
    let x, y;
    if (direction === 'lr') {
      x = Math.min(scanPos, logicalW - 1);
      y = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
    } else {
      y = Math.min(scanPos, logicalH - 1);
      x = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
    }
    const px = offCtx.getImageData(x, y, 1, 1).data;
    const r = px[0] / 255, gv = px[1] / 255, b = px[2] / 255;
    const bright = r * 0.299 + gv * 0.587 + b * 0.114;
    const maxC = Math.max(r, gv, b), minC = Math.min(r, gv, b);
    const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
    // Check mask
    let masked = false;
    if (maskCanvas) {
      const mp = maskCtx.getImageData(x, y, 1, 1).data;
      if (mp[3] > 128) masked = true;
    }
    return {
      bright,
      r,
      g: gv,
      b,
      hue: (Math.atan2(px[1] - 128, px[0] - 128) + Math.PI) / (2 * Math.PI),
      saturation: sat,
      a: px[3],
      pos: i / (voices - 1 || 1),
      masked,
    };
  });
}

function detectEdgeAt(pos) {
  if (pos < 1) return [];
  const voices = parseInt(document.getElementById('voicesSlider').value);
  return Array.from({ length: voices }, (_, i) => {
    let x1, y1, x2, y2;
    if (direction === 'lr') {
      x1 = pos; y1 = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
      x2 = pos - 1; y2 = y1;
    } else {
      y1 = pos; x1 = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
      y2 = pos - 1; x2 = x1;
    }
    const p1 = offCtx.getImageData(Math.min(x1, logicalW-1), Math.min(y1, logicalH-1), 1, 1).data;
    const p2 = offCtx.getImageData(Math.min(x2, logicalW-1), Math.min(y2, logicalH-1), 1, 1).data;
    const b1 = (p1[0]*0.299 + p1[1]*0.587 + p1[2]*0.114) / 255;
    const b2 = (p2[0]*0.299 + p2[1]*0.587 + p2[2]*0.114) / 255;
    let diff = Math.abs(b1 - b2);
    // Apply mask
    if (maskCanvas) {
      const mx = Math.min(x1, logicalW - 1), my = Math.min(y1, logicalH - 1);
      const mp = maskCtx.getImageData(mx, my, 1, 1).data;
      if (mp[3] > 128) diff = 0;
    }
    return { diff, pos: i / (voices - 1 || 1) };
  });
}

// ── VOICE OSCILLATOR POOL (bright / spectral) ─────────────────────────────
function initVoiceOscs(n) {
  teardownVoiceOscs();
  if (!audioCtx) return;
  voiceOscs = Array.from({ length: n }, () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = waveform;
    osc.frequency.value = 220;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    return { osc, gain };
  });
  voiceOscCount = n;
}

function teardownVoiceOscs() {
  if (!voiceOscs || !audioCtx) return;
  const now = audioCtx.currentTime;
  voiceOscs.forEach(({ osc, gain }) => {
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.02);
      setTimeout(() => { try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch (e) {} }, 300);
    } catch (e) {}
  });
  voiceOscs = null;
  voiceOscCount = 0;
}

function updateVoiceOscs() {
  if (!audioCtx) return;
  const voices = parseInt(document.getElementById('voicesSlider').value);
  if (!voiceOscs || voiceOscCount !== voices) initVoiceOscs(voices);
  if (!voiceOscs) return;
  const now = audioCtx.currentTime;
  const smooth = 0.025;
  const samples = sampleLine();
  const range = brightnessCeiling - brightnessFloor;
  voiceOscs.forEach((v, i) => {
    const s = samples[i];
    if (!s || s.a < 10 || s.masked) { v.gain.gain.setTargetAtTime(0, now, smooth); return; }
    let t, vol;
    if (mode === 'spectral') {
      if (s.bright < brightnessFloor || s.bright > brightnessCeiling) { v.gain.gain.setTargetAtTime(0, now, smooth); return; }
      const normBright = range > 0 ? (s.bright - brightnessFloor) / range : 0;
      t = 1 - s.pos;
      vol = Math.max((1 - normBright) * 0.5 / voices, 0);
    } else {
      // bright
      if (s.bright < brightnessFloor || s.bright > brightnessCeiling) { v.gain.gain.setTargetAtTime(0, now, smooth); return; }
      const normBright = range > 0 ? (s.bright - brightnessFloor) / range : 0;
      const dist = Math.min(normBright, 1 - normBright) * 2;
      t = 1 - s.bright;
      vol = (0.15 + 0.85 * dist) * 0.4 / voices;
    }
    if (vol < 0.001) { v.gain.gain.setTargetAtTime(0, now, smooth); return; }
    v.osc.type = waveform;
    v.osc.frequency.setTargetAtTime(midiToFreq(getNote(t)), now, smooth);
    v.gain.gain.setTargetAtTime(vol, now, smooth);
  });
}

// ── BRUSH SIZE PREVIEW ────────────────────────────────────────────────
function showBrushSizePreview() {
  if (!img) return;
  drawPlayhead();
  const mc = document.getElementById('mainCanvas');
  const mctx = mc.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = logicalW / 2, cy = logicalH / 2;
  mctx.beginPath();
  mctx.arc(cx, cy, brushSize, 0, Math.PI * 2);
  mctx.strokeStyle = 'rgba(255,255,255,0.85)';
  mctx.lineWidth = 1.5;
  mctx.setLineDash([4, 3]);
  mctx.stroke();
  mctx.setLineDash([]);
  if (brushPreviewTimeout) clearTimeout(brushPreviewTimeout);
  brushPreviewTimeout = setTimeout(() => drawPlayhead(), 1400);
}

// ── PLAY TICK (live) ──────────────────────────────────────────────────────
function playTick() {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const dur = parseInt(document.getElementById('durSlider').value) / 1000;
  const now = audioCtx.currentTime;

  const attack = Math.min(0.008, dur * 0.15); // 8ms or 15% of dur, smooth onset

  if (mode === 'edge') {
    const edges = detectEdgeAt(scanPos);
    edges.forEach(({ diff, pos }) => {
      if (diff < edgeThreshold) return;
      const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getNote(1 - pos));
      const vol = Math.min(diff * 4, 1) * 0.6;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(vol, now + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur * 1.5);
      osc.connect(g); g.connect(masterGain);
      osc.start(now); osc.stop(now + dur * 1.5);
    });

  } else if (mode === 'spectral') {
    updateVoiceOscs();

  } else if (mode === 'color') {
    updateColorOscs();

  } else {
    // bright
    updateVoiceOscs();
  }
}

// ── UNIFIED NOTE SCHEDULING (for offline rendering) ───────────────────────
function scheduleNotesAtPos(ctx, gainNode, pos, time, frameSecs = 0.053) {
  const voices = parseInt(document.getElementById('voicesSlider').value);
  const dur    = parseInt(document.getElementById('durSlider').value) / 1000;
  const scale  = SCALES[document.getElementById('scaleSelect').value];
  const root   = parseInt(document.getElementById('rootSelect').value);
  const semis  = parseInt(document.getElementById('rangeSlider').value);
  const maxIdx = scale.findIndex(v => v >= semis);
  const sLen   = maxIdx > 0 ? maxIdx : scale.length;
  function getN(t) { return root + scale[Math.min(Math.floor(t * (sLen - 1)), sLen - 1)]; }

  const total = direction === 'lr' ? logicalW : logicalH;
  const clampedPos = Math.min(Math.max(Math.floor(pos), 0), total - 1);

  const attack = Math.min(0.008, dur * 0.15);

  if (mode === 'edge') {
    // Re-implement edge detection inline (works with any AudioContext)
    if (clampedPos < 1) return;
    for (let i = 0; i < voices; i++) {
      let x1, y1, x2, y2;
      if (direction === 'lr') {
        x1 = clampedPos; y1 = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
        x2 = clampedPos - 1; y2 = y1;
      } else {
        y1 = clampedPos; x1 = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
        y2 = clampedPos - 1; x2 = x1;
      }
      const p1 = offCtx.getImageData(Math.min(x1, logicalW-1), Math.min(y1, logicalH-1), 1, 1).data;
      const p2 = offCtx.getImageData(Math.min(x2, logicalW-1), Math.min(y2, logicalH-1), 1, 1).data;
      const b1 = (p1[0]*0.299 + p1[1]*0.587 + p1[2]*0.114) / 255;
      const b2 = (p2[0]*0.299 + p2[1]*0.587 + p2[2]*0.114) / 255;
      let diff = Math.abs(b1 - b2);
      if (maskCanvas) {
        const mp = maskCtx.getImageData(Math.min(x1, logicalW-1), Math.min(y1, logicalH-1), 1, 1).data;
        if (mp[3] > 128) diff = 0;
      }
      if (diff < edgeThreshold) continue;
      const epos = i / (voices - 1 || 1);
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getN(1 - epos));
      const vol = Math.min(diff * 4, 1) * 0.6;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vol, time + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur * 1.5);
      osc.connect(g); g.connect(gainNode);
      osc.start(time); osc.stop(time + dur * 1.5);
    }

  } else if (mode === 'spectral') {
    const range = brightnessCeiling - brightnessFloor;
    for (let i = 0; i < voices; i++) {
      let x, y;
      if (direction === 'lr') {
        x = Math.min(clampedPos, logicalW - 1);
        y = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
      } else {
        y = Math.min(clampedPos, logicalH - 1);
        x = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
      }
      const px = offCtx.getImageData(x, y, 1, 1).data;
      if (px[3] < 10) continue;
      // Check mask
      if (maskCanvas) {
        const mp = maskCtx.getImageData(x, y, 1, 1).data;
        if (mp[3] > 128) continue;
      }
      const bright = (px[0]*0.299 + px[1]*0.587 + px[2]*0.114) / 255;
      if (bright < brightnessFloor || bright > brightnessCeiling) continue;
      const normBright = range > 0 ? (bright - brightnessFloor) / range : 0;
      const vol = (1 - normBright) * 0.5 / voices;
      if (vol < 0.002) continue;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getN(1 - (i / (voices - 1 || 1))));
      // Sustain for the full frame so consecutive frames blend smoothly
      // (mirrors the live persistent-oscillator behaviour)
      const noteDur = frameSecs + 0.015;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vol, time + attack);
      g.gain.setValueAtTime(vol, time + noteDur - 0.008);
      g.gain.linearRampToValueAtTime(0.0001, time + noteDur);
      osc.connect(g); g.connect(gainNode);
      osc.start(time); osc.stop(time + noteDur);
    }

  } else if (mode === 'color') {
    // Compute one note per channel via intensity-weighted centroid.
    const samples = [];
    for (let i = 0; i < voices; i++) {
      let x, y;
      if (direction === 'lr') {
        x = Math.min(clampedPos, logicalW - 1);
        y = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
      } else {
        y = Math.min(clampedPos, logicalH - 1);
        x = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
      }
      const px = offCtx.getImageData(x, y, 1, 1).data;
      if (px[3] < 10) continue;
      if (maskCanvas) {
        const mp = maskCtx.getImageData(x, y, 1, 1).data;
        if (mp[3] > 128) continue;
      }
      samples.push({ r: px[0]/255, g: px[1]/255, b: px[2]/255, pos: i / (voices - 1 || 1) });
    }
    if (samples.length === 0) return;
    [[s => s.r, 0], [s => s.g, 1], [s => s.b, 2]].forEach(([ch, band]) => {
      let weightSum = 0, posSum = 0;
      samples.forEach(s => { const v = ch(s); weightSum += v; posSum += v * s.pos; });
      const avg = weightSum / samples.length;
      if (avg < 0.04) return;
      const centroid = weightSum > 0 ? posSum / weightSum : 0.5;
      const bandT = band / 3 + (1 - centroid) / 3;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getN(bandT));
      // Match live persistent-oscillator behavior: flat sustain for full frame duration
      const vol = Math.min(avg * 0.45, 0.32);
      const colDur = frameSecs + 0.015;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vol, time + attack);
      g.gain.setValueAtTime(vol, time + colDur - 0.01);
      g.gain.linearRampToValueAtTime(0.0001, time + colDur);
      osc.connect(g); g.connect(gainNode);
      osc.start(time); osc.stop(time + colDur);
    });

  } else {
    // bright
    const range = brightnessCeiling - brightnessFloor;
    for (let i = 0; i < voices; i++) {
      let x, y;
      if (direction === 'lr') {
        x = Math.min(clampedPos, logicalW - 1);
        y = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
      } else {
        y = Math.min(clampedPos, logicalH - 1);
        x = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
      }
      const px = offCtx.getImageData(x, y, 1, 1).data;
      if (px[3] < 10) continue;
      if (maskCanvas) {
        const mp = maskCtx.getImageData(x, y, 1, 1).data;
        if (mp[3] > 128) continue;
      }
      const r = px[0] / 255, gv = px[1] / 255, b = px[2] / 255;
      const bright = r * 0.299 + gv * 0.587 + b * 0.114;
      if (bright < brightnessFloor || bright > brightnessCeiling) continue;
      const normBright = range > 0 ? (bright - brightnessFloor) / range : 0;
      const distFromEdge = Math.min(normBright, 1 - normBright) * 2;
      const vol = (0.15 + 0.85 * distFromEdge) * 0.4 / voices;
      if (vol < 0.002) continue;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getN(1 - bright));
      // Sustain for the full frame so consecutive frames blend smoothly
      // (mirrors the live persistent-oscillator behaviour)
      const noteDur = frameSecs + 0.015;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vol, time + attack);
      g.gain.setValueAtTime(vol, time + noteDur - 0.008);
      g.gain.linearRampToValueAtTime(0.0001, time + noteDur);
      osc.connect(g); g.connect(gainNode);
      osc.start(time); osc.stop(time + noteDur);
    }
  }
}

// ── SCAN LOOP ─────────────────────────────────────────────────────────────
function scanStep() {
  const speed = parseFloat(document.getElementById('speedSlider').value);
  const total = direction === 'lr' ? logicalW : logicalH;
  scanAccum += speed;
  if (scanAccum >= total) scanAccum = 0;
  const newPos = Math.floor(scanAccum);
  const didStep = newPos !== scanPos;
  scanPos = newPos;
  drawPlayhead();
  if (didStep) playTick();
  const pct = Math.round(scanAccum / total * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPct').textContent  = pct + '%';
  animId = requestAnimationFrame(scanStep);
}

function togglePlay() {
  if (!img || isExporting) return;
  window._iosSessionStart();
  if (!audioCtx) initAudio();
  scanning = !scanning;
  const btn = document.getElementById('playBtn');
  if (scanning) {
    // Exit edit mode when playing
    if (editMode) toggleEditMode();
    btn.textContent = '⏸ PAUSE'; btn.classList.add('playing');
    setStatus('SCANNING', true);
    audioCtx.resume().then(() => {
      iosAudioUnlock();
      if (scanning) animId = requestAnimationFrame(scanStep);
    });
  } else {
    btn.textContent = '▶ PLAY'; btn.classList.remove('playing');
    setStatus('PAUSED', false);
    cancelAnimationFrame(animId);
    teardownColorOscs();
    teardownVoiceOscs();
    window._iosSessionStop();
  }
}

function resetScan() {
  cancelAnimationFrame(animId);
  scanning = false;
  teardownColorOscs();
  teardownVoiceOscs();
  window._iosSessionStop();
  scanPos = 0;
  scanAccum = 0;
  document.getElementById('playBtn').textContent = '▶ PLAY';
  document.getElementById('playBtn').classList.remove('playing');
  setStatus('IDLE', false);
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressPct').textContent = '0%';
  drawPlayhead();
}

function seekClick(e) {
  if (!img) return;
  const bg = document.getElementById('progressBg');
  const rect = bg.getBoundingClientRect();
  const t = (e.clientX - rect.left) / rect.width;
  scanPos = Math.floor(t * (direction === 'lr' ? logicalW : logicalH));
  scanAccum = scanPos;
  drawPlayhead();
}

// ── OFFLINE AUDIO RENDERING ───────────────────────────────────────────────
// Mirrors live updateVoiceOscs — schedules setTargetAtTime on persistent oscs.
function _offlineUpdateVoices(pool, pos, time, smooth) {
  const voices = pool.length;
  const total  = direction === 'lr' ? logicalW : logicalH;
  const cp     = Math.min(Math.max(Math.floor(pos), 0), total - 1);
  const range  = brightnessCeiling - brightnessFloor;
  const scale  = SCALES[document.getElementById('scaleSelect').value];
  const root   = parseInt(document.getElementById('rootSelect').value);
  const semis  = parseInt(document.getElementById('rangeSlider').value);
  const maxIdx = scale.findIndex(v => v >= semis);
  const sLen   = maxIdx > 0 ? maxIdx : scale.length;
  const getN   = t => root + scale[Math.min(Math.floor(t * (sLen - 1)), sLen - 1)];

  pool.forEach((v, i) => {
    let x, y;
    if (direction === 'lr') {
      x = Math.min(cp, logicalW - 1);
      y = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
    } else {
      y = Math.min(cp, logicalH - 1);
      x = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
    }
    const px = offCtx.getImageData(x, y, 1, 1).data;
    if (px[3] < 10) { v.g.gain.setTargetAtTime(0, time, smooth); return; }
    if (maskCanvas) {
      const mp = maskCtx.getImageData(x, y, 1, 1).data;
      if (mp[3] > 128) { v.g.gain.setTargetAtTime(0, time, smooth); return; }
    }
    let freq, vol;
    if (mode === 'spectral') {
      const bright = (px[0] * 0.299 + px[1] * 0.587 + px[2] * 0.114) / 255;
      if (bright < brightnessFloor || bright > brightnessCeiling) { v.g.gain.setTargetAtTime(0, time, smooth); return; }
      const nb = range > 0 ? (bright - brightnessFloor) / range : 0;
      vol  = Math.max((1 - nb) * 0.5 / voices, 0);
      freq = midiToFreq(getN(1 - (i / (voices - 1 || 1))));
    } else {
      const r = px[0] / 255, gv = px[1] / 255, b = px[2] / 255;
      const bright = r * 0.299 + gv * 0.587 + b * 0.114;
      if (bright < brightnessFloor || bright > brightnessCeiling) { v.g.gain.setTargetAtTime(0, time, smooth); return; }
      const nb = range > 0 ? (bright - brightnessFloor) / range : 0;
      vol  = (0.15 + 0.85 * Math.min(nb, 1 - nb) * 2) * 0.4 / voices;
      freq = midiToFreq(getN(1 - bright));
    }
    if (vol < 0.001) { v.g.gain.setTargetAtTime(0, time, smooth); return; }
    v.osc.frequency.setTargetAtTime(freq, time, smooth);
    v.g.gain.setTargetAtTime(vol, time, smooth);
  });
}

// Mirrors live updateColorOscs — schedules setTargetAtTime on 3 persistent oscs.
function _offlineUpdateColor(colPool, pos, time, smooth) {
  const voices = parseInt(document.getElementById('voicesSlider').value);
  const total  = direction === 'lr' ? logicalW : logicalH;
  const cp     = Math.min(Math.max(Math.floor(pos), 0), total - 1);
  const scale  = SCALES[document.getElementById('scaleSelect').value];
  const root   = parseInt(document.getElementById('rootSelect').value);
  const semis  = parseInt(document.getElementById('rangeSlider').value);
  const maxIdx = scale.findIndex(v => v >= semis);
  const sLen   = maxIdx > 0 ? maxIdx : scale.length;
  const getN   = t => root + scale[Math.min(Math.floor(t * (sLen - 1)), sLen - 1)];

  const samples = [];
  for (let i = 0; i < voices; i++) {
    let x, y;
    if (direction === 'lr') {
      x = Math.min(cp, logicalW - 1);
      y = Math.floor((i / (voices - 1 || 1)) * (logicalH - 1));
    } else {
      y = Math.min(cp, logicalH - 1);
      x = Math.floor((i / (voices - 1 || 1)) * (logicalW - 1));
    }
    const px = offCtx.getImageData(x, y, 1, 1).data;
    if (px[3] < 10) continue;
    if (maskCanvas) {
      const mp = maskCtx.getImageData(x, y, 1, 1).data;
      if (mp[3] > 128) continue;
    }
    samples.push({ r: px[0] / 255, g: px[1] / 255, b: px[2] / 255, pos: i / (voices - 1 || 1) });
  }
  [[s => s.r, 0], [s => s.g, 1], [s => s.b, 2]].forEach(([ch, band], idx) => {
    const v = colPool[idx];
    if (samples.length === 0) { v.g.gain.setTargetAtTime(0, time, smooth); return; }
    let weightSum = 0, posSum = 0;
    samples.forEach(s => { const val = ch(s); weightSum += val; posSum += val * s.pos; });
    const avg = weightSum / samples.length;
    if (avg < 0.04) { v.g.gain.setTargetAtTime(0, time, smooth); return; }
    const centroid = weightSum > 0 ? posSum / weightSum : 0.5;
    const bandT = band / 3 + (1 - centroid) / 3;
    v.osc.frequency.setTargetAtTime(midiToFreq(getN(bandT)), time, smooth);
    v.g.gain.setTargetAtTime(Math.min(avg * 0.45, 0.32), time, smooth);
  });
}

async function renderAudioOffline(totalFrames, frameSecs, speed, total) {
  const sr       = 44100;
  const totalSecs = totalFrames * frameSecs + 1.5;
  const offAudioCtx = new OfflineAudioContext(2, Math.ceil(sr * totalSecs), sr);
  const smooth   = 0.025; // matches live setTargetAtTime constant

  const offGain = offAudioCtx.createGain();
  offGain.gain.value = parseFloat(document.getElementById('volSlider').value);
  const offReverbGain = offAudioCtx.createGain();
  offReverbGain.gain.value = parseFloat(document.getElementById('reverbSlider').value);
  const convOff = offAudioCtx.createConvolver();
  convOff.buffer = makeIR(offAudioCtx);
  offGain.connect(offAudioCtx.destination);
  offGain.connect(offReverbGain);
  offReverbGain.connect(convOff);
  convOff.connect(offAudioCtx.destination);

  if (mode === 'bright' || mode === 'spectral') {
    // ── Persistent oscillator pool — exact offline mirror of updateVoiceOscs ──
    const voices = parseInt(document.getElementById('voicesSlider').value);
    const pool = Array.from({ length: voices }, () => {
      const osc = offAudioCtx.createOscillator();
      const g   = offAudioCtx.createGain();
      osc.type = waveform; osc.frequency.value = 220; g.gain.value = 0;
      osc.connect(g); g.connect(offGain);
      osc.start(0); osc.stop(totalSecs);
      return { osc, g };
    });
    let pos = 0;
    for (let f = 0; f < totalFrames; f++) {
      _offlineUpdateVoices(pool, pos, f * frameSecs, smooth);
      pos += speed;
      if (pos >= total) break;
    }

  } else if (mode === 'color') {
    // ── Persistent R/G/B oscillators — exact offline mirror of updateColorOscs ──
    const colPool = [0, 1, 2].map(() => {
      const osc = offAudioCtx.createOscillator();
      const g   = offAudioCtx.createGain();
      osc.type = waveform; osc.frequency.value = 220; g.gain.value = 0;
      osc.connect(g); g.connect(offGain);
      osc.start(0); osc.stop(totalSecs);
      return { osc, g };
    });
    let pos = 0;
    for (let f = 0; f < totalFrames; f++) {
      _offlineUpdateColor(colPool, pos, f * frameSecs, smooth);
      pos += speed;
      if (pos >= total) break;
    }

  } else {
    // ── Edge mode: discrete per-note oscillators (correct for this mode) ──
    let pos = 0;
    for (let f = 0; f < totalFrames; f++) {
      scheduleNotesAtPos(offAudioCtx, offGain, pos, f * frameSecs, frameSecs);
      pos += speed;
      if (pos >= total) break;
    }
  }

  return offAudioCtx.startRendering();
}

// ── EXPORT AUDIO ──────────────────────────────────────────────────────────
async function exportAudio() {
  if (!img) { alert('Load an image first.'); return; }
  if (isExporting) return;
  isExporting = true;

  const wasScanning = scanning;
  if (scanning) togglePlay();

  setStatus('RENDERING AUDIO…', true);
  document.getElementById('recIndicator').style.display = 'flex';

  try {
    const total = direction === 'lr' ? logicalW : logicalH;
    const speed = parseFloat(document.getElementById('speedSlider').value);
    const dur   = parseInt(document.getElementById('durSlider').value) / 1000;
    const totalFrames = Math.ceil(total / speed);
    const frameSecs   = Math.max(dur / 1.5, 0.025);

    const rendered = await renderAudioOffline(totalFrames, frameSecs, speed, total);
    const wav  = audioBufferToWav(rendered);
    const blob = new Blob([wav], { type: 'audio/wav' });
    downloadOrShare(blob, 'sonify_audio.wav', 'audio/wav');
  } catch (e) {
    console.error('Audio export failed:', e);
    alert('Audio export failed: ' + e.message);
  } finally {
    document.getElementById('recIndicator').style.display = 'none';
    setStatus('IDLE', false);
    isExporting = false;
  }
}

// ── LOAD MP4-MUXER ───────────────────────────────────────────────────────
async function loadMp4Muxer() {
  if (window.Mp4Muxer) return true;
  try {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    return !!window.Mp4Muxer;
  } catch { return false; }
}

// ── EXPORT VIDEO ──────────────────────────────────────────────────────────
async function exportVideo() {
  if (!img) { alert('Load an image first.'); return; }
  if (isExporting) return;
  isExporting = true;

  const wasScanning = scanning;
  if (scanning) togglePlay();

  setStatus('PREPARING…', true);
  document.getElementById('recIndicator').style.display = 'flex';

  try {
    const total = direction === 'lr' ? logicalW : logicalH;
    const speed = parseFloat(document.getElementById('speedSlider').value);
    const dur   = parseInt(document.getElementById('durSlider').value) / 1000;
    const fps   = 30;
    const totalFrames = Math.ceil(total / speed);
    const frameSecs   = Math.max(dur / 1.5, 1 / fps);

    // Step 1: Pre-render audio (silent, no speakers)
    setStatus('RENDERING AUDIO…', true);
    const audioBuffer = await renderAudioOffline(totalFrames, frameSecs, speed, total);

    // Step 2: Try WebCodecs + mp4-muxer
    if (typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined') {
      try {
        await exportVideoWebCodecs(audioBuffer, totalFrames, fps, frameSecs, speed, total);
        return; // Success
      } catch (e) {
        console.warn('WebCodecs export failed, trying fallback:', e);
      }
    }

    // Step 3: Fallback to MediaRecorder
    if (typeof MediaRecorder !== 'undefined') {
      await exportVideoMediaRecorder(audioBuffer, totalFrames, fps, frameSecs, speed, total);
    } else {
      // Last resort: just export audio
      alert('Video recording is not supported in this browser. Exporting audio instead.');
      const wav  = audioBufferToWav(audioBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      downloadOrShare(blob, 'sonify_audio.wav', 'audio/wav');
    }

  } catch (e) {
    console.error('Video export failed:', e);
    alert('Video export failed: ' + e.message);
  } finally {
    document.getElementById('recIndicator').style.display = 'none';
    setStatus('IDLE', false);
    isExporting = false;
  }
}

// ── EXPORT VIDEO: WebCodecs + mp4-muxer path ─────────────────────────────
async function exportVideoWebCodecs(audioBuffer, totalFrames, fps, frameSecs, speed, total) {
  // Load the mp4-muxer library
  const loaded = await loadMp4Muxer();
  if (!loaded) throw new Error('Could not load mp4-muxer library');

  // H.264 requires even dimensions
  const exportW = logicalW + (logicalW % 2);
  const exportH = logicalH + (logicalH % 2);

  // Check video encoder support
  const videoConfig = {
    codec: 'avc1.42001E', // Baseline Level 3.0
    width: exportW, height: exportH,
    bitrate: 4_000_000, framerate: fps,
  };
  const vSupport = await VideoEncoder.isConfigSupported(videoConfig);
  if (!vSupport.supported) {
    videoConfig.codec = 'avc1.4D001E'; // Main Profile
    const vSupport2 = await VideoEncoder.isConfigSupported(videoConfig);
    if (!vSupport2.supported) throw new Error('H.264 encoding not supported');
  }

  // Check audio encoder support (try AAC, then Opus)
  const sr = audioBuffer.sampleRate;
  let audioCodec = 'mp4a.40.2';
  let muxerAudioCodec = 'aac';
  const aacConfig = { codec: audioCodec, numberOfChannels: 2, sampleRate: sr, bitrate: 128_000 };
  let aSupport = await AudioEncoder.isConfigSupported(aacConfig);
  if (!aSupport.supported) {
    audioCodec = 'opus';
    muxerAudioCodec = 'opus';
    aacConfig.codec = audioCodec;
    aSupport = await AudioEncoder.isConfigSupported(aacConfig);
    if (!aSupport.supported) throw new Error('No audio encoder available');
  }

  // Create muxer
  const { Muxer, ArrayBufferTarget } = Mp4Muxer;
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: exportW, height: exportH },
    audio: { codec: muxerAudioCodec, numberOfChannels: 2, sampleRate: sr },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  // Video encoder
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => console.error('VideoEncoder error:', e),
  });
  videoEncoder.configure(videoConfig);

  // Audio encoder
  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: e => console.error('AudioEncoder error:', e),
  });
  audioEncoder.configure(aacConfig);

  // Export canvas
  const expCanvas = document.createElement('canvas');
  expCanvas.width = exportW; expCanvas.height = exportH;
  const expCtx = expCanvas.getContext('2d');
  const lineColor = document.getElementById('lineColor').value;

  // Render video frames
  setStatus('ENCODING VIDEO…', true);
  let vpos = 0;
  for (let f = 0; f < totalFrames; f++) {
    // Draw frame
    expCtx.fillStyle = '#000';
    expCtx.fillRect(0, 0, exportW, exportH); // Fill padding if odd dims
    expCtx.drawImage(offscreenCanvas, 0, 0, logicalW, logicalH);

    // Edge overlay in video if active
    if (showOverlay && edgeOverlayCanvas) {
      expCtx.globalAlpha = 0.7;
      expCtx.drawImage(edgeOverlayCanvas, 0, 0, logicalW, logicalH);
      expCtx.globalAlpha = 1.0;
    }

    // Playhead
    expCtx.strokeStyle = lineColor;
    expCtx.lineWidth = 2;
    expCtx.shadowColor = lineColor;
    expCtx.shadowBlur = 5;
    expCtx.beginPath();
    if (direction === 'lr') { expCtx.moveTo(vpos, 0); expCtx.lineTo(vpos, logicalH); }
    else { expCtx.moveTo(0, vpos); expCtx.lineTo(logicalW, vpos); }
    expCtx.stroke();
    expCtx.shadowBlur = 0;

    // Encode frame
    const timestamp = Math.round(f * frameSecs * 1_000_000);
    const frame = new VideoFrame(expCanvas, { timestamp });
    videoEncoder.encode(frame, { keyFrame: f % (fps * 2) === 0 });
    frame.close();

    vpos += speed;
    if (vpos >= total) vpos = total - 1;

    // Yield & progress
    if (f % 30 === 0) {
      await new Promise(r => setTimeout(r, 0));
      setStatus(`ENCODING ${Math.round(f / totalFrames * 100)}%`, true);
    }
    // Back-pressure
    if (videoEncoder.encodeQueueSize > 20) {
      await new Promise(r => setTimeout(r, 10));
    }
  }

  // Encode audio
  setStatus('ENCODING AUDIO…', true);
  const chunkSize = 1024;
  const ch0 = audioBuffer.getChannelData(0);
  const ch1 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : ch0;
  for (let i = 0; i < audioBuffer.length; i += chunkSize) {
    const len = Math.min(chunkSize, audioBuffer.length - i);
    const planar = new Float32Array(len * 2);
    planar.set(ch0.subarray(i, i + len), 0);
    planar.set(ch1.subarray(i, i + len), len);
    const ad = new AudioData({
      format: 'f32-planar',
      sampleRate: sr,
      numberOfFrames: len,
      numberOfChannels: 2,
      timestamp: Math.round(i / sr * 1_000_000),
      data: planar,
    });
    audioEncoder.encode(ad);
    ad.close();
  }

  // Flush & finalize
  setStatus('FINALIZING…', true);
  await videoEncoder.flush();
  await audioEncoder.flush();
  videoEncoder.close();
  audioEncoder.close();
  muxer.finalize();

  const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
  downloadOrShare(blob, 'sonify_video.mp4', 'video/mp4');
}

// ── EXPORT VIDEO: MediaRecorder fallback ──────────────────────────────────
async function exportVideoMediaRecorder(audioBuffer, totalFrames, fps, frameSecs, speed, total) {
  initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const expCanvas = document.createElement('canvas');
  expCanvas.width = logicalW; expCanvas.height = logicalH;
  const expCtx = expCanvas.getContext('2d');
  const lineColor = document.getElementById('lineColor').value;

  // Create a separate destination for recording audio (NOT speakers)
  const audioDest = audioCtx.createMediaStreamDestination();
  const bufSource = audioCtx.createBufferSource();
  bufSource.buffer = audioBuffer;
  bufSource.connect(audioDest); // Audio goes to recording only

  // Canvas video stream
  const canvasStream = expCanvas.captureStream(fps);
  audioDest.stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));

  // Find best mime type
  let mimeType = '';
  for (const mt of ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']) {
    if (MediaRecorder.isTypeSupported(mt)) { mimeType = mt; break; }
  }
  if (!mimeType) throw new Error('No supported video MIME type');

  const chunks = [];
  const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 4_000_000 });
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      try { bufSource.disconnect(); } catch {}
      const actualMime = recorder.mimeType || mimeType;
      const ext = actualMime.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: actualMime });
      downloadOrShare(blob, `sonify_video.${ext}`, actualMime);
      resolve();
    };
    recorder.onerror = e => reject(e.error || new Error('MediaRecorder error'));

    recorder.start(100);
    bufSource.start(0);

    let vpos = 0, f = 0;
    function renderFrame() {
      if (f >= totalFrames) {
        try { bufSource.stop(); } catch {}
        setTimeout(() => recorder.stop(), 200); // Give recorder time to flush
        return;
      }
      expCtx.drawImage(offscreenCanvas, 0, 0, logicalW, logicalH);
      if (showOverlay && edgeOverlayCanvas) {
        expCtx.globalAlpha = 0.7;
        expCtx.drawImage(edgeOverlayCanvas, 0, 0, logicalW, logicalH);
        expCtx.globalAlpha = 1.0;
      }
      expCtx.strokeStyle = lineColor; expCtx.lineWidth = 2;
      expCtx.shadowColor = lineColor; expCtx.shadowBlur = 5;
      expCtx.beginPath();
      if (direction === 'lr') { expCtx.moveTo(vpos, 0); expCtx.lineTo(vpos, logicalH); }
      else { expCtx.moveTo(0, vpos); expCtx.lineTo(logicalW, vpos); }
      expCtx.stroke(); expCtx.shadowBlur = 0;

      vpos += speed;
      if (vpos >= total) vpos = total - 1;
      f++;
      setStatus(`REC ${Math.round(f / totalFrames * 100)}%`, true);
      setTimeout(renderFrame, frameSecs * 1000);
    }
    renderFrame();
  });
}

// ── DOWNLOAD / SHARE ──────────────────────────────────────────────────────
function downloadOrShare(blob, filename, mimeType) {
  const file = new File([blob], filename, { type: mimeType });
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  // On iOS, navigator.share() must be called synchronously within a user gesture.
  // Export rendering is async so the gesture token expires by the time we arrive here.
  // Instead, arm the export button: the user's next tap fires share() with a fresh gesture.
  if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })) {
    const isAudio = mimeType.startsWith('audio');
    const btn = document.getElementById(isAudio ? 'dlAudio' : 'dlVideo');
    const origText = isAudio ? '↓ AUDIO' : '↓ VIDEO';
    btn.textContent = 'TAP TO SAVE';
    btn.classList.add('btn-save-ready');
    btn.onclick = () => {
      navigator.share({ files: [file], title: 'Sonify Export' })
        .catch(() => triggerDownload(blob, filename))
        .finally(() => {
          btn.textContent = origText;
          btn.classList.remove('btn-save-ready');
          btn.onclick = isAudio ? exportAudio : exportVideo;
        });
    };
  } else {
    triggerDownload(blob, filename);
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── WAV ENCODER ──────────────────────────────────────────────────────────
function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels, length = buffer.length * numCh * 2 + 44;
  const ab = new ArrayBuffer(length), view = new DataView(ab), sr = buffer.sampleRate;
  function ws(o, s) { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }
  ws(0, 'RIFF'); view.setUint32(4, length - 8, true); ws(8, 'WAVE');
  ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true); view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true); ws(36, 'data');
  view.setUint32(40, buffer.length * numCh * 2, true);
  let off = 44;
  for (let i = 0; i < buffer.length; i++)
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  return ab;
}

// ── UI SETTERS ────────────────────────────────────────────────────────────
function setDir(d) {
  direction = d;
  document.getElementById('dirLR').classList.toggle('active', d === 'lr');
  document.getElementById('dirTB').classList.toggle('active', d === 'tb');
  scanPos = 0;
  drawPlayhead();
}

function setMode(m, btn) {
  if (m !== 'color') teardownColorOscs();
  if (m !== 'bright' && m !== 'spectral') teardownVoiceOscs();
  mode = m;
  document.querySelectorAll('.mode-toggles .tog').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('modeDesc').textContent = MODEDESCS[m];
  // Show edge threshold for edge mode
  const edgeCtrl = document.getElementById('edgeThresholdCtrl');
  edgeCtrl.style.display = (m === 'edge') ? 'block' : 'none';
  // Show brightness floor/ceiling for pixel-based modes
  const showBright = (m === 'bright' || m === 'color' || m === 'spectral');
  document.getElementById('brightnessFloorCtrl').style.display = showBright ? 'block' : 'none';
  document.getElementById('brightnessCeilingCtrl').style.display = showBright ? 'block' : 'none';
}

function setWave(w, btn) {
  waveform = w;
  document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// Slider listeners
[
  ['speedSlider',         'speedVal',         v => parseFloat(v) + ' px/f'],
  ['voicesSlider',        'voicesVal',        v => v],
  ['durSlider',           'durVal',           v => v + 'ms'],
  ['volSlider',           'volVal',           v => Math.round(v * 100) + '%'],
  ['reverbSlider',        'reverbVal',        v => Math.round(v * 100) + '%'],
  ['rangeSlider',         'rangeVal',         v => v],
  ['edgeThresholdSlider', 'edgeThresholdVal', v => Math.round(parseFloat(v) * 100) + '%'],
  ['brightnessFloorSlider', 'brightnessFloorVal', v => Math.round(parseFloat(v) * 100) + '%'],
  ['brightnessCeilingSlider', 'brightnessCeilingVal', v => Math.round(parseFloat(v) * 100) + '%'],
].forEach(([id, outId, fmt]) => {
  document.getElementById(id).addEventListener('input', e => {
    document.getElementById(outId).textContent = fmt(e.target.value);
    if (id === 'volSlider' && masterGain) masterGain.gain.value = parseFloat(e.target.value);
    if (id === 'edgeThresholdSlider') {
      edgeThreshold = parseFloat(e.target.value);
      renderEdgeOverlay();
      drawPlayhead();
    }
    if (id === 'brightnessFloorSlider') {
      brightnessFloor = parseFloat(e.target.value);
      // Ensure floor doesn't exceed ceiling
      if (brightnessFloor > brightnessCeiling) {
        brightnessCeiling = brightnessFloor;
        document.getElementById('brightnessCeilingSlider').value = brightnessCeiling;
        document.getElementById('brightnessCeilingVal').textContent = Math.round(brightnessCeiling * 100) + '%';
      }
    }
    if (id === 'brightnessCeilingSlider') {
      brightnessCeiling = parseFloat(e.target.value);
      // Ensure ceiling doesn't go below floor
      if (brightnessCeiling < brightnessFloor) {
        brightnessFloor = brightnessCeiling;
        document.getElementById('brightnessFloorSlider').value = brightnessFloor;
        document.getElementById('brightnessFloorVal').textContent = Math.round(brightnessFloor * 100) + '%';
      }
    }
  });
});

document.getElementById('lineColor').addEventListener('input', () => drawPlayhead());

// Brush size slider
document.getElementById('brushSizeSlider').addEventListener('input', e => {
  brushSize = parseInt(e.target.value);
  document.getElementById('brushSizeVal').textContent = brushSize + 'px';
  showBrushSizePreview();
});

// ── EDIT MODE ─────────────────────────────────────────────────────────────
function toggleOverlay() {
  showOverlay = !showOverlay;
  document.getElementById('overlayToggle').classList.toggle('active', showOverlay);
  drawPlayhead();
}

function toggleEditMode() {
  editMode = !editMode;
  const mc = document.getElementById('mainCanvas');
  const editToggle = document.getElementById('editToggle');
  const editTools = document.getElementById('editTools');
  editToggle.classList.toggle('active', editMode);
  editTools.style.display = editMode ? 'block' : 'none';
  mc.classList.toggle('edit-cursor', editMode);

  // Auto-show overlay in edit mode
  if (editMode && !showOverlay) toggleOverlay();
  drawPlayhead();
}

function setBrushMode(erase) {
  brushErase = erase;
  document.getElementById('brushEraseBtn').classList.toggle('active', erase);
  document.getElementById('brushRestoreBtn').classList.toggle('active', !erase);
}

// Canvas coordinate helper
function canvasCoords(e) {
  const mc = document.getElementById('mainCanvas');
  const rect = mc.getBoundingClientRect();
  const scaleX = logicalW / rect.width;
  const scaleY = logicalH / rect.height;
  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

// Mouse events for edit mode
const mainCanvas = document.getElementById('mainCanvas');

mainCanvas.addEventListener('mousedown', e => {
  if (!editMode) return;
  isPainting = true;
  const { x, y } = canvasCoords(e);
  paintMask(x, y);
  drawPlayhead();
});
mainCanvas.addEventListener('mousemove', e => {
  if (!editMode || !isPainting) return;
  const { x, y } = canvasCoords(e);
  paintMask(x, y);
  drawPlayhead();
});
mainCanvas.addEventListener('mouseup', () => { isPainting = false; });
mainCanvas.addEventListener('mouseleave', () => { isPainting = false; });

// Touch events for edit mode
mainCanvas.addEventListener('touchstart', e => {
  if (!editMode) return;
  e.preventDefault();
  isPainting = true;
  const { x, y } = canvasCoords(e);
  paintMask(x, y);
  drawPlayhead();
}, { passive: false });
mainCanvas.addEventListener('touchmove', e => {
  if (!editMode || !isPainting) return;
  e.preventDefault();
  const { x, y } = canvasCoords(e);
  paintMask(x, y);
  drawPlayhead();
}, { passive: false });
mainCanvas.addEventListener('touchend', () => { isPainting = false; });

// ── iOS PLAY BUTTON FIX ──────────────────────────────────────────────────
document.getElementById('playBtn').addEventListener('touchend', e => {
  e.preventDefault();
  togglePlay();
}, { passive: false });
