import { test } from "node:test";
import assert from "node:assert/strict";
import { synthesize, encodeWav, MOODS } from "../src/music.js";

test("erzeugt für jede Stimmung hörbare, nicht übersteuerte Musik", () => {
  for (const mood of Object.keys(MOODS)) {
    const { left, right, sampleRate } = synthesize({ duration: 4, mood });
    assert.ok(left.length >= 4 * sampleRate);
    let peak = 0, energy = 0;
    for (let i = 0; i < left.length; i++) {
      peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
      energy += left[i] * left[i];
    }
    assert.ok(peak <= 1, `${mood}: Übersteuerung`);
    assert.ok(energy / left.length > 1e-4, `${mood}: zu leise`);
  }
});

test("WAV-Header ist korrekt", () => {
  const wav = encodeWav(synthesize({ duration: 1 }));
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.equal(wav.readUInt16LE(22), 2);
  assert.equal(wav.readUInt32LE(24), 44100);
});
