// Prozeduraler Musik-Generator: erzeugt lizenzfreie Hintergrundmusik als WAV,
// passend zu Stimmung, Tempo und Länge des Reels. Keine externen Samples nötig.

import { writeFile } from "node:fs/promises";

const SAMPLE_RATE = 44100;

// Stimmungen → Tonart-Charakter, Akkordfolge (Stufen), Instrumentierung
export const MOODS = {
  calm: {
    label: "Ruhig & sanft",
    scale: "major",
    progression: [0, 5, 3, 4], // I – vi – IV – V
    bpm: 72,
    drums: false,
    arpDensity: 2,
    brightness: 0.35,
  },
  dreamy: {
    label: "Verträumt",
    scale: "major",
    progression: [0, 2, 5, 3], // I – iii – vi – IV
    bpm: 66,
    drums: false,
    arpDensity: 4,
    brightness: 0.45,
  },
  uplifting: {
    label: "Aufbauend",
    scale: "major",
    progression: [0, 4, 5, 3], // I – V – vi – IV
    bpm: 100,
    drums: true,
    arpDensity: 4,
    brightness: 0.6,
  },
  energetic: {
    label: "Energiegeladen",
    scale: "minor",
    progression: [0, 5, 2, 6], // i – VI – III – VII
    bpm: 122,
    drums: true,
    arpDensity: 8,
    brightness: 0.75,
  },
  melancholic: {
    label: "Melancholisch",
    scale: "minor",
    progression: [0, 3, 5, 4], // i – iv – VI – v
    bpm: 70,
    drums: false,
    arpDensity: 2,
    brightness: 0.3,
  },
};

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const KEYS = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Deterministischer Zufall, damit gleiche Eingaben gleiche Musik ergeben
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function chordNotes(scale, rootMidi, degree) {
  const n = (i) => {
    const idx = degree + i;
    return rootMidi + scale[idx % 7] + 12 * Math.floor(idx / 7);
  };
  return [n(0), n(2), n(4)];
}

/**
 * Rendert Musik in einen Float32-Stereo-Puffer.
 * @param {object} opts
 * @param {number} opts.duration Länge in Sekunden
 * @param {string} [opts.mood]   Schlüssel aus MOODS
 * @param {number} [opts.bpm]    Tempo überschreiben
 * @param {string} [opts.key]    Grundton, z. B. "D"
 * @param {number} [opts.seed]
 */
export function synthesize({ duration, mood = "calm", bpm, key = "D", seed = 7 }) {
  const cfg = MOODS[mood] ?? MOODS.calm;
  const tempo = Math.min(140, Math.max(55, bpm || cfg.bpm));
  const scale = SCALES[cfg.scale];
  const root = 48 + (KEYS[key] ?? 2); // Oktave um C3
  const rand = rng(seed);

  const total = Math.ceil((duration + 0.5) * SAMPLE_RATE);
  const L = new Float32Array(total);
  const R = new Float32Array(total);

  const beat = 60 / tempo;
  const bar = beat * 4;
  const chordLen = bar; // ein Akkord pro Takt

  const add = (buf, start, samples, gain) => {
    const s0 = Math.floor(start * SAMPLE_RATE);
    for (let i = 0; i < samples.length; i++) {
      const j = s0 + i;
      if (j >= 0 && j < buf.length) buf[j] += samples[i] * gain;
    }
  };

  // Weicher Pad-Sound: leicht verstimmte Sinus-Obertöne mit langsamer Hüllkurve
  const pad = (freq, len, detune) => {
    const n = Math.floor(len * SAMPLE_RATE);
    const out = new Float32Array(n);
    const harmonics = [1, 2, 3, 4];
    const amps = [1, 0.5 * cfg.brightness, 0.25 * cfg.brightness, 0.12 * cfg.brightness];
    const attack = Math.min(0.8, len * 0.3);
    const release = Math.min(1.2, len * 0.4);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      let v = 0;
      for (let h = 0; h < harmonics.length; h++) {
        const f = freq * harmonics[h] * (1 + detune * 0.0015 * (h + 1));
        v += Math.sin(2 * Math.PI * f * t) * amps[h];
      }
      const env = Math.min(1, t / attack) * Math.min(1, (len - t) / release);
      out[i] = v * Math.max(0, env) * 0.18;
    }
    return out;
  };

  // Gezupfter Arpeggio-Ton: Sinus + Oberton mit exponentiellem Abklingen
  const pluck = (freq, len) => {
    const n = Math.floor(len * SAMPLE_RATE);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 5) * Math.min(1, t / 0.005);
      out[i] =
        (Math.sin(2 * Math.PI * freq * t) + 0.3 * cfg.brightness * Math.sin(4 * Math.PI * freq * t)) * env * 0.22;
    }
    return out;
  };

  const bass = (freq, len) => {
    const n = Math.floor(len * SAMPLE_RATE);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, t / 0.02) * Math.exp(-t * 1.2) * Math.min(1, (len - t) / 0.1);
      out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.15 * Math.sin(4 * Math.PI * freq * t)) * Math.max(0, env) * 0.35;
    }
    return out;
  };

  const kick = () => {
    const len = 0.35;
    const n = Math.floor(len * SAMPLE_RATE);
    const out = new Float32Array(n);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const f = 45 + 90 * Math.exp(-t * 30);
      phase += (2 * Math.PI * f) / SAMPLE_RATE;
      out[i] = Math.sin(phase) * Math.exp(-t * 9) * 0.55;
    }
    return out;
  };

  const hat = () => {
    const len = 0.06;
    const n = Math.floor(len * SAMPLE_RATE);
    const out = new Float32Array(n);
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const white = rand() * 2 - 1;
      const hp = white - prev; // einfacher Hochpass
      prev = white;
      out[i] = hp * Math.exp(-t * 60) * 0.12;
    }
    return out;
  };

  const kickBuf = cfg.drums ? kick() : null;
  const hatBuf = cfg.drums ? hat() : null;

  const chords = Math.ceil(duration / chordLen) + 1;
  for (let c = 0; c < chords; c++) {
    const start = c * chordLen;
    const degree = cfg.progression[c % cfg.progression.length];
    const notes = chordNotes(scale, root, degree);

    // Pad (Stereo-Breite durch unterschiedliche Verstimmung)
    for (const m of notes) {
      const f = midiToFreq(m + 12);
      add(L, start, pad(f, chordLen + 0.6, -1), 1);
      add(R, start, pad(f, chordLen + 0.6, 1), 1);
    }

    // Bass auf Grundton, halbe Noten
    const bf = midiToFreq(notes[0] - 12);
    add(L, start, bass(bf, beat * 2), 1);
    add(R, start, bass(bf, beat * 2), 1);
    add(L, start + beat * 2, bass(bf, beat * 2), 0.8);
    add(R, start + beat * 2, bass(bf, beat * 2), 0.8);

    // Arpeggio – setzt nach dem ersten Takt ein, damit der Hook-Moment ruhig startet
    if (c >= 1 || mood === "energetic") {
      const steps = cfg.arpDensity * 2;
      const step = bar / steps;
      const arpNotes = [...notes, notes[0] + 12, notes[1] + 12];
      for (let s = 0; s < steps; s++) {
        const m = arpNotes[Math.floor(rand() * arpNotes.length)] + 12;
        const pan = 0.5 + (rand() - 0.5) * 0.6;
        const p = pluck(midiToFreq(m), Math.min(1.2, step * 3));
        const vel = 0.7 + rand() * 0.3;
        add(L, start + s * step, p, vel * (1 - pan) * 1.4);
        add(R, start + s * step, p, vel * pan * 1.4);
      }
    }

    // Beat
    if (cfg.drums && c >= 1) {
      for (let b = 0; b < 4; b++) {
        add(L, start + b * beat, kickBuf, 1);
        add(R, start + b * beat, kickBuf, 1);
        add(L, start + b * beat + beat / 2, hatBuf, 0.9);
        add(R, start + b * beat + beat / 2, hatBuf, 1.1);
      }
    }
  }

  // Einfacher Hall (Feedback-Delays), leicht unterschiedlich pro Kanal
  const reverb = (buf, delays) => {
    const out = Float32Array.from(buf);
    for (const [d, g] of delays) {
      const off = Math.floor(d * SAMPLE_RATE);
      for (let i = off; i < out.length; i++) out[i] += out[i - off] * g;
    }
    return out;
  };
  const Lr = reverb(L, [[0.113, 0.28], [0.197, 0.2], [0.331, 0.14]]);
  const Rr = reverb(R, [[0.127, 0.28], [0.211, 0.2], [0.349, 0.14]]);

  // Ein-/Ausblenden und Normalisieren
  const fadeIn = 0.8 * SAMPLE_RATE;
  const fadeOut = 2 * SAMPLE_RATE;
  const end = Math.floor(duration * SAMPLE_RATE);
  let peak = 1e-6;
  for (let i = 0; i < total; i++) {
    let g = Math.min(1, i / fadeIn);
    if (i > end - fadeOut) g *= Math.max(0, (end - i) / fadeOut);
    Lr[i] *= g;
    Rr[i] *= g;
    peak = Math.max(peak, Math.abs(Lr[i]), Math.abs(Rr[i]));
  }
  const norm = 0.85 / peak;
  for (let i = 0; i < total; i++) {
    Lr[i] = Math.tanh(Lr[i] * norm * 1.1); // sanfte Sättigung statt hartem Clipping
    Rr[i] = Math.tanh(Rr[i] * norm * 1.1);
  }

  return { left: Lr, right: Rr, sampleRate: SAMPLE_RATE };
}

export function encodeWav({ left, right, sampleRate }) {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // Stereo
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
  }
  return buf;
}

export async function writeMusic(path, opts) {
  await writeFile(path, encodeWav(synthesize(opts)));
  return path;
}
