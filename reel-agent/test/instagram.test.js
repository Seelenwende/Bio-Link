import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { publishReel } from "../src/instagram.js";

test("Veröffentlichung: Container → Upload → Status → Publish", async () => {
  Object.assign(process.env, { IG_ACCESS_TOKEN: "tok", IG_USER_ID: "123", IG_UPLOAD_MODE: "resumable" });
  const dir = await mkdtemp(path.join(tmpdir(), "ig-"));
  const file = path.join(dir, "reel.mp4");
  await writeFile(file, Buffer.from("fake-video"));

  const calls = [];
  let polls = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    calls.push({ url: u, method: opts.method || "GET", headers: opts.headers, body: opts.body });
    const json = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (u.endsWith("/123/media")) return json({ id: "c1", uri: "https://rupload.facebook.com/ig-api-upload/v23.0/c1" });
    if (u.startsWith("https://rupload")) return json({ success: true });
    if (u.includes("/c1?")) return json({ status_code: ++polls < 2 ? "IN_PROGRESS" : "FINISHED" });
    if (u.endsWith("/123/media_publish")) return json({ id: "m1" });
    if (u.includes("/m1?")) return json({ permalink: "https://instagram.com/reel/abc" });
    return new Response("{}", { status: 404 });
  };
  const realTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn) => realTimeout(fn, 0);
  try {
    const res = await publishReel({ file, caption: "Hallo #test" });
    assert.deepEqual(res, { id: "m1", permalink: "https://instagram.com/reel/abc" });
    const create = new URLSearchParams(calls[0].body);
    assert.equal(create.get("media_type"), "REELS");
    assert.equal(create.get("upload_type"), "resumable");
    assert.equal(create.get("caption"), "Hallo #test");
    assert.equal(calls[1].headers.Authorization, "OAuth tok");
    assert.equal(calls[1].headers.file_size, "10");
    assert.equal(new URLSearchParams(calls.at(-2).body).get("creation_id"), "c1");
  } finally {
    globalThis.fetch = realFetch;
    globalThis.setTimeout = realTimeout;
  }
});
