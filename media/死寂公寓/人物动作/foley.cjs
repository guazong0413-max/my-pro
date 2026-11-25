"use strict";

const {FPS, shots, frames, footsteps, mealEvents, ear} = require("./motion.cjs");

const RATE = 48_000;
const TAU = 2 * Math.PI;
function noise(seed) {
  let value = seed;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 2147483648 - 1;
  };
}

function footstep(t, high, low, heavy) {
  const impact = Math.exp(-t * (heavy ? 35 : 53));
  const dust = (high - low) * Math.exp(-t * 26) * .30;
  const heel = low * impact * 1.9 + .44 * Math.sin(TAU * (heavy ? 63 : 79) * t) * impact;
  return (dust + heel) * Math.min(1, t / .0065);
}

function plastic(t, high, low, settingDown) {
  const decay = Math.exp(-t * 36);
  const ripple = .62 + .38 * Math.sin(112.0 * t) ** 2;
  const creak = (high - low) * ripple * decay;
  if (!settingDown) return creak;
  return creak * .47 + (low * 2.2 + Math.sin(TAU * 146 * t) * .55) * Math.exp(-t * 43);
}

function ceramic(t, high, low, pitches) {
  let ring = (high - low) * .26 * Math.exp(-t * 81);
  pitches.forEach((freq, i) => {
    ring += Math.sin(TAU * freq * t) * Math.exp(-t * (22 + i * 10)) * .60 / (i + 1);
  });
  return ring;
}

function tap(t, high, low) {
  const wood = Math.sin(TAU * 123 * t) * .52 + Math.sin(TAU * 236 * t) * .22;
  return (low * 1.7 + wood) * Math.exp(-t * 29) + high * .20 * Math.exp(-t * 122);
}

function playbackLevel(sample) {
  const amplified = Math.abs(sample) * 3.12;
  const knee = .40, ceiling = .83;
  const amplitude = amplified <= knee ? amplified : knee + (ceiling - knee) *
    (1 - Math.exp((knee - amplified) / (ceiling - knee)));
  return Math.round(Math.sign(sample) * amplitude * 32767);
}

function wav() {
  const count = Math.round(frames / FPS * RATE);
  const left = new Float32Array(count), right = new Float32Array(count);
  const roomNoise = noise(39841);
  let lo = 0, lowMid = 0;
  for (let i = 0; i < count; i++) {
    const t = i / RATE, w = roomNoise();
    lo += .0037 * (w - lo);
    lowMid += .042 * (w - lowMid);
    const edge = Math.min(1, i / 6000, (count - i) / 14000);
    left[i] = edge * (lo * .152 + (lowMid - lo) * .035 + w * .0024);
    right[i] = edge * (lo * .141 + (lowMid - lo) * .031 - w * .0019 + .0008 * Math.sin(TAU * 67 * t));
  }
  let seed = 22891;
  function add(shot, at, length, gain, pan, synth, reflect = .11) {
    const source = noise(seed++);
    const start = Math.round((shot.from / FPS + at) * RATE);
    const total = Math.round(length * RATE);
    const l = gain * Math.sqrt((1 - pan) / 2), r = gain * Math.sqrt((1 + pan) / 2);
    const echo = Math.round(.031 * RATE);
    let low = 0;
    for (let i = 0; i < total && start + i < count; i++) {
      const raw = source();
      low += .068 * (raw - low);
      const onset = Math.min(1, i / 137, (total - i) / 133);
      const sample = onset * synth(i / RATE, raw, low);
      const index = start + i;
      left[index] += sample * l;
      right[index] += sample * r;
      if (index + echo < count) {
        left[index + echo] += sample * r * reflect;
        right[index + echo] += sample * l * reflect;
      }
    }
  }
  for (const shot of shots) {
    for (const [i, step] of (footsteps[shot.id] ?? []).entries()) {
      const heavy = shot.id === "listen";
      add(shot, step.land, .19, (heavy ? .107 : .087) * (i % 2 ? 1 : .85), (step.x - 220) / 340,
        (t, hi, lo) => footstep(t, hi, lo, heavy), .065);
    }
    if (shot.id === "bottle") {
      add(shot, 2.06, .22, .18, .10, (t, hi, lo) => plastic(t, hi, lo, false));
      add(shot, 7.15, .25, .46, .18, (t, hi, lo) => plastic(t, hi, lo, true));
      add(shot, 7.43, .12, .055, .18, (t, hi, lo) => plastic(t, hi, lo, false));
    } else if (shot.id === "meal") {
      add(shot, mealEvents.scoop, .24, .13, .05, (t, hi, lo) => ceramic(t, hi, lo, [990, 1855, 2813]));
      add(shot, mealEvents.set, .30, .24, .06, (t, hi, lo) => ceramic(t, hi, lo, [1191, 2340, 3431]));
    } else if (shot.id === "listen") {
      add(shot, 1.21, .43, .26, .62, tap, .19);
      add(shot, ear.contact, .16, .10, -.16, (t, hi, lo) => plastic(t, hi, lo, false));
      add(shot, 3.90, .38, .18, .53, tap, .27);
    }
  }

  const result = Buffer.alloc(44 + count * 4);
  result.write("RIFF", 0); result.writeUInt32LE(result.length - 8, 4);
  result.write("WAVEfmt ", 8); result.writeUInt32LE(16, 16);
  result.writeUInt16LE(1, 20); result.writeUInt16LE(2, 22);
  result.writeUInt32LE(RATE, 24); result.writeUInt32LE(RATE * 4, 28);
  result.writeUInt16LE(4, 32); result.writeUInt16LE(16, 34);
  result.write("data", 36); result.writeUInt32LE(count * 4, 40);
  for (let i = 0; i < count; i++) {
    result.writeInt16LE(playbackLevel(left[i]), 44 + 4 * i);
    result.writeInt16LE(playbackLevel(right[i]), 46 + 4 * i);
  }
  return result;
}

module.exports = {wav};
