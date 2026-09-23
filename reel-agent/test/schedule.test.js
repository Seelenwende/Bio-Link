import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLocalTime } from "../src/reels.js";

test("Ortszeit Europe/Berlin wird korrekt in UTC umgerechnet (Sommer- und Winterzeit)", () => {
  assert.equal(parseLocalTime("2026-07-01T18:00", "Europe/Berlin").toISOString(), "2026-07-01T16:00:00.000Z");
  assert.equal(parseLocalTime("2026-12-01T18:00", "Europe/Berlin").toISOString(), "2026-12-01T17:00:00.000Z");
  assert.equal(parseLocalTime("2026-12-01T18:00:00Z").toISOString(), "2026-12-01T18:00:00.000Z");
  assert.throws(() => parseLocalTime("morgen"));
});
