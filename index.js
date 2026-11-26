const USE_SOUND_FILES = false;

const SOUND_FILES = {
  w: "sounds/tom-1.mp3",
  a: "sounds/tom-2.mp3",
  s: "sounds/tom-3.mp3",
  d: "sounds/tom-4.mp3",
  j: "sounds/snare.mp3",
  k: "sounds/crash.mp3",
  l: "sounds/kick-bass.mp3",
};
let ctx;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noiseBuffer(c, seconds) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function tone(c, { from, to, time, gain }) {
  const now = c.currentTime;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + time);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + time);
  osc.connect(amp).connect(c.destination);
  osc.start(now);
  osc.stop(now + time);
}

function noise(c, { filter, freq, time, gain }) {
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, time);
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  const amp = c.createGain();
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + time);
  src.connect(f).connect(amp).connect(c.destination);
  src.start(now);
}

const synth = {
  w: (c) => tone(c, { from: 260, to: 120, time: 0.35, gain: 0.9 }),
  a: (c) => tone(c, { from: 200, to: 95,  time: 0.4,  gain: 0.9 }),
  s: (c) => tone(c, { from: 150, to: 70,  time: 0.45, gain: 0.9 }),
  d: (c) => tone(c, { from: 110, to: 55,  time: 0.5,  gain: 0.9 }),
  j: (c) => {
    noise(c, { filter: "highpass", freq: 1500, time: 0.2, gain: 0.8 });
    tone(c, { from: 220, to: 160, time: 0.12, gain: 0.5 });
  },
  k: (c) => noise(c, { filter: "highpass", freq: 5000, time: 1.4, gain: 0.7 }),
  l: (c) => {
    tone(c, { from: 160, to: 40, time: 0.5, gain: 1 });
    noise(c, { filter: "lowpass", freq: 300, time: 0.05, gain: 0.5 });
  },
};
function playSound(key) {
  if (USE_SOUND_FILES) {
    new Audio(SOUND_FILES[key]).play();
  } else {
    synth[key](audio());
  }
}

function animate(key) {
  const drum = document.querySelector(`.drum[data-key="${key}"]`);
  if (!drum) return;
  drum.classList.add("pressed");
  setTimeout(() => drum.classList.remove("pressed"), 100);
}

function hit(key) {
  if (!(key in synth)) return;
  playSound(key);
  animate(key);
}
document.querySelectorAll(".drum").forEach((drum) => {
  drum.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    hit(drum.dataset.key);
  });
});
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  hit(e.key.toLowerCase());
});
