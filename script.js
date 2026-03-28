let img = null;
let audioCtx = null,
  masterGain = null,
  reverbNode = null,
  analyser = null;
let scanning = false,
  scanPos = 0,
  animId = null;
let direction = "lr",
  mode = "edge",
  waveform = "sine";
let edgeThreshold = 0.07;
let offscreenCanvas = null,
  offCtx = null;
let videoRecorder = null,
  videoChunks = [];
let audioDestination = null;

const SCALES = {
  pentatonic: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28],
  major: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24],
  minor: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24],
  chromatic: [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24,
  ],
  wholetone: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
  blues: [0, 3, 5, 6, 7, 10, 12, 15, 17, 18, 19, 22, 24],
};
const MODEDESCS = {
  bright: "Pixel brightness maps to pitch. Darker = lower, lighter = higher.",
  color:
    "Hue channel drives pitch. Red → warm tones, blue/green → cool tones.",
  edge: "Detects sharp contrast edges (like text, graph lines). Each edge fires a note pitched to its cross-axis position.",
};

// VU + placeholder setup
const vuMeter = document.getElementById("vuMeter");
for (let i = 0; i < 12; i++) {
  const b = document.createElement("div");
  b.className = "vu-bar";
  vuMeter.appendChild(b);
}
const pg = document.getElementById("pgrid");
for (let i = 0; i < 32; i++) {
  const c = document.createElement("div");
  c.className = "pg-cell";
  pg.appendChild(c);
}

// ── IOS AUDIO UNLOCK ─────────────────────────────────────────────────────
// iOS Safari needs a silent buffer played on the first user gesture to fully
// unlock the AudioContext even after resume().
function iosAudioUnlock() {
  if (!audioCtx) return;
  const buf = audioCtx.createBuffer(1, 1, 22050);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.connect(audioCtx.destination);
  src.start(0);
}

// Pre-unlock on the very first touch so audio is ready before PLAY is tapped
document.addEventListener(
  "touchstart",
  () => {
    if (!audioCtx) initAudio();
    audioCtx.resume().then(iosAudioUnlock);
  },
  { once: true },
);

// ── HEIC SUPPORT ──────────────────────────────────────────────────────────
async function decodeImageFile(file) {
  const isHeic =
    /\.(heic|heif)$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif";
  if (isHeic) {
    try {
      if (!window.heic2any) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src =
            "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const blob = await window.heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92,
      });
      return URL.createObjectURL(blob instanceof Array ? blob[0] : blob);
    } catch (e) {
      console.warn("heic2any failed, trying native:", e);
      return URL.createObjectURL(file);
    }
  }
  return URL.createObjectURL(file);
}

async function loadImage(file) {
  let objectUrl;
  try {
    objectUrl = await decodeImageFile(file);
  } catch (e) {
    alert("Could not decode image. Try saving as JPG or PNG first.");
    return;
  }

  const image = new Image();
  image.onload = () => {
    img = image;
    const wrap = document.getElementById("canvasWrap");
    const maxW = wrap.clientWidth - 32,
      maxH = wrap.clientHeight - 32;
    let w = image.width,
      h = image.height;
    if (w > maxW) {
      h = Math.round((h * maxW) / w);
      w = maxW;
    }
    if (h > maxH) {
      w = Math.round((w * maxH) / h);
      h = maxH;
    }

    const mc = document.getElementById("mainCanvas");
    mc.width = w;
    mc.height = h;
    offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;
    offCtx = offscreenCanvas.getContext("2d");
    offCtx.drawImage(img, 0, 0, w, h);
    mc.getContext("2d").drawImage(img, 0, 0, w, h);
    mc.style.display = "block";
    document.getElementById("placeholder").style.display = "none";
    document.getElementById("vizWrap").style.display = "block";
    document.getElementById("playBtn").disabled = false;
    document.getElementById("resetBtn").disabled = false;
    document.getElementById("dlAudio").disabled = false;
    document.getElementById("dlVideo").disabled = false;
    scanPos = 0;
    drawPlayhead();
    const vc = document.getElementById("vizCanvas");
    vc.width = mc.clientWidth || w;
    vc.height = 40;
  };
  image.onerror = () =>
    alert("Could not load image. For HEIC, try recent Chrome or Safari.");
  image.src = objectUrl;
}

document.getElementById("fileInput").addEventListener("change", (e) => {
  if (e.target.files[0]) loadImage(e.target.files[0]);
});
const dz = document.getElementById("dropZone");
dz.addEventListener("dragover", (e) => {
  e.preventDefault();
  dz.classList.add("drag-over");
});
dz.addEventListener("dragleave", () => dz.classList.remove("drag-over"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("drag-over");
  if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
});

// ── DRAW PLAYHEAD ─────────────────────────────────────────────────────────
function drawPlayhead() {
  if (!img || !offscreenCanvas) return;
  const mc = document.getElementById("mainCanvas");
  const mctx = mc.getContext("2d");
  mctx.drawImage(offscreenCanvas, 0, 0);
  const color = document.getElementById("lineColor").value;
  mctx.strokeStyle = color;
  mctx.lineWidth = 1.5;
  mctx.shadowColor = color;
  mctx.shadowBlur = 6;
  mctx.beginPath();
  if (direction === "lr") {
    mctx.moveTo(scanPos, 0);
    mctx.lineTo(scanPos, mc.height);
  } else {
    mctx.moveTo(0, scanPos);
    mctx.lineTo(mc.width, scanPos);
  }
  mctx.stroke();
  mctx.shadowBlur = 0;
}

// ── AUDIO INIT ────────────────────────────────────────────────────────────
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = parseFloat(
    document.getElementById("volSlider").value,
  );
  reverbNode = audioCtx.createConvolver();
  const irLen = audioCtx.sampleRate * 1.5;
  const ir = audioCtx.createBuffer(2, irLen, audioCtx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < irLen; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
  }
  reverbNode.buffer = ir;
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const reverbGain = audioCtx.createGain();
  reverbGain.gain.value = parseFloat(
    document.getElementById("reverbSlider").value,
  );
  document
    .getElementById("reverbSlider")
    .addEventListener(
      "input",
      (e) => (reverbGain.gain.value = parseFloat(e.target.value)),
    );
  masterGain.connect(audioCtx.destination);
  masterGain.connect(reverbGain);
  reverbGain.connect(reverbNode);
  reverbNode.connect(audioCtx.destination);
  masterGain.connect(analyser);
  audioDestination = audioCtx.createMediaStreamDestination();
  masterGain.connect(audioDestination);
  reverbNode.connect(audioDestination);
  drawViz();
}

function drawViz() {
  const vc = document.getElementById("vizCanvas");
  const vctx = vc.getContext("2d");
  const data = new Uint8Array(analyser.frequencyBinCount);
  function loop() {
    analyser.getByteFrequencyData(data);
    vctx.fillStyle = "#ffffff";
    vctx.fillRect(0, 0, vc.width, vc.height);
    const bw = vc.width / data.length;
    for (let i = 0; i < data.length; i++) {
      const h = (data[i] / 255) * vc.height;
      const t = i / data.length;
      vctx.fillStyle = `hsl(${80 + t * 40},${60 + t * 20}%,${30 + t * 15}%)`;
      vctx.fillRect(i * bw, vc.height - h, Math.max(bw - 0.5, 1), h);
    }
    const vuBars = vuMeter.querySelectorAll(".vu-bar");
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length / 255;
    vuBars.forEach((b, i) => {
      const thresh = i / vuBars.length;
      b.style.height = (thresh < avg ? 5 + Math.random() * 14 : 3) + "px";
      b.style.background =
        thresh < 0.6 ? "#e2f18e" : thresh < 0.85 ? "#d4e370" : "#c84000";
    });
    requestAnimationFrame(loop);
  }
  loop();
}

// ── AUDIO ENGINE ──────────────────────────────────────────────────────────
function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}
function getNote(t) {
  const scale = SCALES[document.getElementById("scaleSelect").value];
  const root = parseInt(document.getElementById("rootSelect").value);
  const semis = parseInt(document.getElementById("rangeSlider").value);
  const maxIdx = scale.findIndex((v) => v >= semis);
  const len = maxIdx > 0 ? maxIdx : scale.length;
  return root + scale[Math.min(Math.floor(t * (len - 1)), len - 1)];
}

function sampleLine() {
  const mc = document.getElementById("mainCanvas");
  const voices = parseInt(document.getElementById("voicesSlider").value);
  return Array.from({ length: voices }, (_, i) => {
    let x, y;
    if (direction === "lr") {
      x = Math.min(scanPos, mc.width - 1);
      y = Math.floor((i / (voices - 1 || 1)) * mc.height);
    } else {
      y = Math.min(scanPos, mc.height - 1);
      x = Math.floor((i / (voices - 1 || 1)) * mc.width);
    }
    const px = offCtx.getImageData(x, y, 1, 1).data;
    return {
      bright: (px[0] * 0.299 + px[1] * 0.587 + px[2] * 0.114) / 255,
      hue: (Math.atan2(px[1] - 128, px[0] - 128) + Math.PI) / (2 * Math.PI),
      a: px[3],
      pos: i / (voices - 1 || 1),
    };
  });
}

function detectEdgeAt(pos) {
  if (pos < 1) return [];
  const mc = document.getElementById("mainCanvas");
  const voices = parseInt(document.getElementById("voicesSlider").value);
  return Array.from({ length: voices }, (_, i) => {
    let x1, y1, x2, y2;
    if (direction === "lr") {
      x1 = pos;
      y1 = Math.floor((i / (voices - 1 || 1)) * mc.height);
      x2 = pos - 1;
      y2 = y1;
    } else {
      y1 = pos;
      x1 = Math.floor((i / (voices - 1 || 1)) * mc.width);
      y2 = pos - 1;
      x2 = x1;
    }
    const p1 = offCtx.getImageData(
      Math.min(x1, mc.width - 1),
      Math.min(y1, mc.height - 1),
      1,
      1,
    ).data;
    const p2 = offCtx.getImageData(
      Math.min(x2, mc.width - 1),
      Math.min(y2, mc.height - 1),
      1,
      1,
    ).data;
    const b1 = (p1[0] * 0.299 + p1[1] * 0.587 + p1[2] * 0.114) / 255;
    const b2 = (p2[0] * 0.299 + p2[1] * 0.587 + p2[2] * 0.114) / 255;
    return { diff: Math.abs(b1 - b2), pos: i / (voices - 1 || 1) };
  });
}

function playTick() {
  if (!audioCtx || audioCtx.state !== "running") return;
  const dur = parseInt(document.getElementById("durSlider").value) / 1000;
  const now = audioCtx.currentTime;
  if (mode === "edge") {
    detectEdgeAt(scanPos).forEach(({ diff, pos }) => {
      if (diff < edgeThreshold) return;
      const osc = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getNote(1 - pos));
      g.gain.setValueAtTime(Math.min(diff * 4, 1) * 0.6, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur * 1.5);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + dur * 1.5);
    });
  } else {
    const samples = sampleLine();
    samples.forEach((s) => {
      if (s.a < 10) return;
      const t = mode === "color" ? s.hue : s.bright;
      const osc = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getNote(1 - t));
      g.gain.setValueAtTime(0.5 / samples.length, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + dur);
    });
  }
}

// ── SCAN LOOP ─────────────────────────────────────────────────────────────
function scanStep() {
  const speed = parseInt(document.getElementById("speedSlider").value);
  const mc = document.getElementById("mainCanvas");
  const total = direction === "lr" ? mc.width : mc.height;
  scanPos += speed;
  if (scanPos >= total) scanPos = 0;
  drawPlayhead();
  playTick();
  const pct = Math.round((scanPos / total) * 100);
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressPct").textContent = pct + "%";
  animId = requestAnimationFrame(scanStep);
}

async function togglePlay() {
  if (!img) return;
  initAudio();
  // Await resume — critical on iOS Safari where the context starts suspended
  if (audioCtx.state === "suspended") await audioCtx.resume();
  iosAudioUnlock();
  scanning = !scanning;
  const btn = document.getElementById("playBtn");
  if (scanning) {
    btn.textContent = "⏸ PAUSE";
    btn.classList.add("playing");
    document.getElementById("statusDot").classList.add("active");
    document.getElementById("statusText").textContent = "SCANNING";
    animId = requestAnimationFrame(scanStep);
  } else {
    btn.textContent = "▶ PLAY";
    btn.classList.remove("playing");
    document.getElementById("statusDot").classList.remove("active");
    document.getElementById("statusText").textContent = "PAUSED";
    cancelAnimationFrame(animId);
  }
}

function resetScan() {
  cancelAnimationFrame(animId);
  scanning = false;
  scanPos = 0;
  document.getElementById("playBtn").textContent = "▶ PLAY";
  document.getElementById("playBtn").classList.remove("playing");
  document.getElementById("statusDot").classList.remove("active");
  document.getElementById("statusText").textContent = "IDLE";
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("progressPct").textContent = "0%";
  drawPlayhead();
}

function seekClick(e) {
  if (!img) return;
  const bg = document.getElementById("progressBg");
  const rect = bg.getBoundingClientRect();
  const t = (e.clientX - rect.left) / rect.width;
  const mc = document.getElementById("mainCanvas");
  scanPos = Math.floor(t * (direction === "lr" ? mc.width : mc.height));
  drawPlayhead();
}

// ── EXPORT AUDIO ──────────────────────────────────────────────────────────
async function exportAudio() {
  if (!img) {
    alert("Load an image first.");
    return;
  }
  initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  document.getElementById("statusText").textContent = "RENDERING";
  document.getElementById("statusDot").classList.add("active");
  document.getElementById("recIndicator").style.display = "flex";

  const mc = document.getElementById("mainCanvas");
  const total = direction === "lr" ? mc.width : mc.height;
  const speed = parseInt(document.getElementById("speedSlider").value);
  const dur = parseInt(document.getElementById("durSlider").value) / 1000;
  const voices = parseInt(document.getElementById("voicesSlider").value);
  const frames = Math.ceil(total / speed);
  const frameSecs = Math.max(dur / 1.5, 0.025);
  const totalSecs = frames * frameSecs + 0.5;
  const sr = 44100;
  const offCtxOff = new OfflineAudioContext(2, Math.ceil(sr * totalSecs), sr);
  const offGain = offCtxOff.createGain();
  offGain.gain.value = parseFloat(document.getElementById("volSlider").value);
  const reverbGainOff = offCtxOff.createGain();
  reverbGainOff.gain.value = parseFloat(
    document.getElementById("reverbSlider").value,
  );
  const irLen = sr * 1.5;
  const irBuf = offCtxOff.createBuffer(2, irLen, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = irBuf.getChannelData(ch);
    for (let i = 0; i < irLen; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
  }
  const convOff = offCtxOff.createConvolver();
  convOff.buffer = irBuf;
  offGain.connect(offCtxOff.destination);
  offGain.connect(reverbGainOff);
  reverbGainOff.connect(convOff);
  convOff.connect(offCtxOff.destination);

  const scale = SCALES[document.getElementById("scaleSelect").value];
  const root = parseInt(document.getElementById("rootSelect").value);
  const semis = parseInt(document.getElementById("rangeSlider").value);
  const maxIdx = scale.findIndex((v) => v >= semis);
  const sLen = maxIdx > 0 ? maxIdx : scale.length;
  function getN(t) {
    return root + scale[Math.min(Math.floor(t * (sLen - 1)), sLen - 1)];
  }

  let pos = 0;
  for (let f = 0; f < frames; f++) {
    const t = f * frameSecs;
    for (let i = 0; i < voices; i++) {
      let x, y;
      if (direction === "lr") {
        x = Math.min(pos, mc.width - 1);
        y = Math.floor((i / (voices - 1 || 1)) * mc.height);
      } else {
        y = Math.min(pos, mc.height - 1);
        x = Math.floor((i / (voices - 1 || 1)) * mc.width);
      }
      const px = offCtx.getImageData(x, y, 1, 1).data;
      if (px[3] < 10) continue;
      const bright = (px[0] * 0.299 + px[1] * 0.587 + px[2] * 0.114) / 255;
      const hue =
        (Math.atan2(px[1] - 128, px[0] - 128) + Math.PI) / (2 * Math.PI);
      const tv = mode === "color" ? hue : bright;
      const osc = offCtxOff.createOscillator(),
        g = offCtxOff.createGain();
      osc.type = waveform;
      osc.frequency.value = midiToFreq(getN(1 - tv));
      g.gain.setValueAtTime(0.5 / voices, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(offGain);
      osc.start(t);
      osc.stop(t + dur);
    }
    pos += speed;
    if (pos >= total) pos = 0;
  }

  const rendered = await offCtxOff.startRendering();
  const wav = audioBufferToWav(rendered);
  const blob = new Blob([wav], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sonify_audio.wav";
  a.click();
  document.getElementById("recIndicator").style.display = "none";
  document.getElementById("statusText").textContent = "IDLE";
  document.getElementById("statusDot").classList.remove("active");
}

// ── EXPORT VIDEO ──────────────────────────────────────────────────────────
async function exportVideo() {
  if (!img) {
    alert("Load an image first.");
    return;
  }
  initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (!audioDestination) {
    alert("Tap Play first to initialise audio, then export.");
    return;
  }

  const mc = document.getElementById("mainCanvas");
  const total = direction === "lr" ? mc.width : mc.height;
  const speed = parseInt(document.getElementById("speedSlider").value);
  const dur = parseInt(document.getElementById("durSlider").value) / 1000;

  const expCanvas = document.createElement("canvas");
  expCanvas.width = mc.width;
  expCanvas.height = mc.height;
  const expCtx = expCanvas.getContext("2d");
  const fps = 30;
  const canvasStream = expCanvas.captureStream(fps);
  audioDestination.stream
    .getAudioTracks()
    .forEach((t) => canvasStream.addTrack(t));

  let mimeType = "video/webm;codecs=vp8,opus";
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
  videoChunks = [];
  videoRecorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 4000000,
  });
  videoRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) videoChunks.push(e.data);
  };
  videoRecorder.onstop = () => {
    const blob = new Blob(videoChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sonify_video.webm";
    a.click();
    document.getElementById("recIndicator").style.display = "none";
    document.getElementById("statusText").textContent = "IDLE";
    document.getElementById("statusDot").classList.remove("active");
  };
  videoRecorder.start(100);
  document.getElementById("recIndicator").style.display = "flex";
  document.getElementById("statusText").textContent = "REC VIDEO";
  document.getElementById("statusDot").classList.add("active");

  const lineColor = document.getElementById("lineColor").value;
  let vpos = 0;
  const frameDur = Math.max(dur / 1.5, 1000 / fps) / 1000;
  const totalFrames = Math.ceil(total / speed) + Math.ceil(0.5 / frameDur);

  function renderFrame(f) {
    if (f >= totalFrames) {
      videoRecorder.stop();
      return;
    }
    expCtx.drawImage(offscreenCanvas, 0, 0);
    expCtx.strokeStyle = lineColor;
    expCtx.lineWidth = 2;
    expCtx.shadowColor = lineColor;
    expCtx.shadowBlur = 5;
    expCtx.beginPath();
    if (direction === "lr") {
      expCtx.moveTo(vpos, 0);
      expCtx.lineTo(vpos, mc.height);
    } else {
      expCtx.moveTo(0, vpos);
      expCtx.lineTo(mc.width, vpos);
    }
    expCtx.stroke();
    expCtx.shadowBlur = 0;
    playTickAt(vpos);
    vpos += speed;
    if (vpos >= total) vpos = total - 1;
    setTimeout(() => renderFrame(f + 1), frameDur * 1000);
  }
  renderFrame(0);
}

function playTickAt(pos) {
  if (!audioCtx) return;
  const mc = document.getElementById("mainCanvas");
  const voices = parseInt(document.getElementById("voicesSlider").value);
  const dur = parseInt(document.getElementById("durSlider").value) / 1000;
  const now = audioCtx.currentTime;
  const scale = SCALES[document.getElementById("scaleSelect").value];
  const root = parseInt(document.getElementById("rootSelect").value);
  const semis = parseInt(document.getElementById("rangeSlider").value);
  const maxIdx = scale.findIndex((v) => v >= semis);
  const len = maxIdx > 0 ? maxIdx : scale.length;
  for (let i = 0; i < voices; i++) {
    let x, y;
    if (direction === "lr") {
      x = Math.min(pos, mc.width - 1);
      y = Math.floor((i / (voices - 1 || 1)) * mc.height);
    } else {
      y = Math.min(pos, mc.height - 1);
      x = Math.floor((i / (voices - 1 || 1)) * mc.width);
    }
    const px = offCtx.getImageData(x, y, 1, 1).data;
    if (px[3] < 10) continue;
    const bright = (px[0] * 0.299 + px[1] * 0.587 + px[2] * 0.114) / 255;
    const hue = (Math.atan2(px[1] - 128, px[0] - 128) + Math.PI) / (2 * Math.PI);
    const tv = mode === "color" ? hue : bright;
    const midi = root + scale[Math.min(Math.floor((1 - tv) * (len - 1)), len - 1)];
    const osc = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    osc.type = waveform;
    osc.frequency.value = midiToFreq(midi);
    g.gain.setValueAtTime(0.4 / voices, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + dur);
  }
}

// ── WAV ENCODER ──────────────────────────────────────────────────────────
function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels,
    length = buffer.length * numCh * 2 + 44;
  const ab = new ArrayBuffer(length),
    view = new DataView(ab),
    sr = buffer.sampleRate;
  function ws(o, s) {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  }
  ws(0, "RIFF");
  view.setUint32(4, length - 8, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  ws(36, "data");
  view.setUint32(40, buffer.length * numCh * 2, true);
  let off = 44;
  for (let i = 0; i < buffer.length; i++)
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  return ab;
}

// ── UI SETTERS ────────────────────────────────────────────────────────────
function setDir(d) {
  direction = d;
  document.getElementById("dirLR").classList.toggle("active", d === "lr");
  document.getElementById("dirTB").classList.toggle("active", d === "tb");
  scanPos = 0;
  drawPlayhead();
}
function setMode(m, btn) {
  mode = m;
  document
    .querySelectorAll(".tog")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("modeDesc").textContent = MODEDESCS[m];
  // Show/hide edge threshold slider based on mode
  const edgeCtrl = document.getElementById("edgeThresholdCtrl");
  edgeCtrl.style.display = m === "edge" ? "block" : "none";
}
function setWave(w, btn) {
  waveform = w;
  document
    .querySelectorAll(".wave-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

[
  ["speedSlider", "speedVal", (v) => v + " px/f"],
  ["voicesSlider", "voicesVal", (v) => v],
  ["durSlider", "durVal", (v) => v + "ms"],
  ["volSlider", "volVal", (v) => Math.round(v * 100) + "%"],
  ["reverbSlider", "reverbVal", (v) => Math.round(v * 100) + "%"],
  ["rangeSlider", "rangeVal", (v) => v],
  [
    "edgeThresholdSlider",
    "edgeThresholdVal",
    (v) => Math.round(parseFloat(v) * 100) + "%",
  ],
].forEach(([id, outId, fmt]) => {
  document.getElementById(id).addEventListener("input", (e) => {
    document.getElementById(outId).textContent = fmt(e.target.value);
    if (id === "volSlider" && masterGain)
      masterGain.gain.value = parseFloat(e.target.value);
    if (id === "edgeThresholdSlider")
      edgeThreshold = parseFloat(e.target.value);
  });
});

document
  .getElementById("lineColor")
  .addEventListener("input", () => drawPlayhead());
