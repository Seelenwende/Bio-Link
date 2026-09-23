import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePlan, planReel } from "../src/planner.js";

test("normalizePlan bereinigt ungültige Werte", () => {
  const plan = normalizePlan({
    scenes: [{ text: "  Hallo  ", duration: 99 }, { text: "" }, { text: "Ende", duration: "x" }],
    music: { mood: "gibtsnicht", bpm: 500 },
    palette: { background: "rot", text: "#112233" },
    hashtags: ["#selbstliebe", "innere ruhe"],
  });
  assert.equal(plan.scenes.length, 2);
  assert.equal(plan.scenes[0].text, "Hallo");
  assert.equal(plan.scenes[0].duration, 10);
  assert.equal(plan.scenes[0].role, "hook");
  assert.equal(plan.scenes[1].duration, 3);
  assert.equal(plan.music.mood, "calm");
  assert.equal(plan.music.bpm, 140);
  assert.equal(plan.palette.background, "#FAF6F4");
  assert.equal(plan.palette.text, "#112233");
  assert.deepEqual(plan.hashtags, ["selbstliebe", "innereruhe"]);
});

test("normalizePlan lehnt leere Drehbücher ab", () => {
  assert.throws(() => normalizePlan({ scenes: [] }));
});

test("Offline-Plan ohne API-Key", async () => {
  const key = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  try {
    const plan = await planReel({ brief: "Erster Satz. Zweiter Satz!", duration: 12, mood: "dreamy" });
    assert.equal(plan.scenes.at(0).role, "hook");
    assert.equal(plan.scenes.at(-1).role, "cta");
    assert.equal(plan.music.mood, "dreamy");
  } finally {
    if (key) process.env.ANTHROPIC_API_KEY = key;
  }
});
