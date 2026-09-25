import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { publishImages } from "../src/instagram.js";
import { publishPhotos, publishVideoReel, lookupPage } from "../src/facebook.js";
import { normalizePlan } from "../src/planner.js";

const json = (o) => new Response(JSON.stringify(o), { status: 200 });

async function withFetch(handler, fn) {
  const calls = [];
  const realFetch = globalThis.fetch;
  const realTimeout = globalThis.setTimeout;
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method || "GET", body: opts.body, headers: opts.headers });
    return handler(String(url), opts);
  };
  globalThis.setTimeout = (f) => realTimeout(f, 0);
  try {
    await fn(calls);
  } finally {
    globalThis.fetch = realFetch;
    globalThis.setTimeout = realTimeout;
  }
}

test("Instagram-Karussell: Kinder-Container → Karussell → Veröffentlichen", async () => {
  Object.assign(process.env, { IG_ACCESS_TOKEN: "tok", IG_USER_ID: "123" });
  let n = 0;
  await withFetch(
    (url, opts) => {
      if (url.endsWith("/123/media")) return json({ id: `c${++n}` });
      if (/\/c\d\?/.test(url)) return json({ status_code: "FINISHED" });
      if (url.endsWith("/123/media_publish")) return json({ id: "m1" });
      if (url.includes("/m1?")) return json({ permalink: "https://instagram.com/p/x" });
      return new Response("{}", { status: 404 });
    },
    async (calls) => {
      const res = await publishImages({ imageUrls: ["https://a/1.jpg", "https://a/2.jpg"], caption: "Hallo" });
      assert.equal(res.permalink, "https://instagram.com/p/x");
      const creates = calls.filter((c) => c.url.endsWith("/123/media")).map((c) => new URLSearchParams(c.body));
      assert.equal(creates[0].get("is_carousel_item"), "true");
      assert.equal(creates[2].get("media_type"), "CAROUSEL");
      assert.equal(creates[2].get("children"), "c1,c2");
      assert.equal(creates[2].get("caption"), "Hallo");
    },
  );
});

test("Facebook: Mehrbild-Beitrag und Reel", async () => {
  Object.assign(process.env, { FB_PAGE_ID: "p1", FB_PAGE_TOKEN: "ptok" });
  const dir = await mkdtemp(path.join(tmpdir(), "fb-"));
  const a = path.join(dir, "a.jpg");
  const b = path.join(dir, "b.jpg");
  const v = path.join(dir, "v.mp4");
  for (const f of [a, b, v]) await writeFile(f, "x");
  let photo = 0;
  await withFetch(
    (url, opts) => {
      if (url.endsWith("/p1/photos")) return json({ id: `ph${++photo}` });
      if (url.endsWith("/p1/feed")) return json({ id: "p1_post" });
      if (url.endsWith("/p1/video_reels")) {
        const phase = new URLSearchParams(opts.body).get("upload_phase");
        return json(phase === "start" ? { video_id: "v9", upload_url: "https://rupload.facebook.com/video-upload/v23.0/v9" } : { success: true });
      }
      if (url.startsWith("https://rupload")) return json({ success: true });
      if (url.includes("permalink_url")) return json({ permalink_url: "https://facebook.com/x" });
      return new Response("{}", { status: 404 });
    },
    async (calls) => {
      const post = await publishPhotos({ files: [a, b], message: "Hallo Facebook" });
      assert.equal(post.id, "p1_post");
      const feed = new URLSearchParams(calls.find((c) => c.url.endsWith("/p1/feed")).body);
      assert.equal(feed.get("message"), "Hallo Facebook");
      assert.equal(feed.get("attached_media[1]"), JSON.stringify({ media_fbid: "ph2" }));
      const uploads = calls.filter((c) => c.url.endsWith("/p1/photos"));
      assert.equal(uploads[0].body.get("published"), "false");

      const reel = await publishVideoReel({ file: v, description: "Mein Reel" });
      assert.equal(reel.id, "v9");
      assert.equal(calls.find((c) => c.url.startsWith("https://rupload")).headers.Authorization, "OAuth ptok");
      const finish = new URLSearchParams(calls.filter((c) => c.url.endsWith("/video_reels")).at(-1).body);
      assert.equal(finish.get("video_state"), "PUBLISHED");
      assert.equal(finish.get("description"), "Mein Reel");
    },
  );
});

test("Facebook verbinden: Nutzer-Token → Seite wird gefunden", async () => {
  await withFetch(
    (url) => {
      if (url.includes("/me?")) return json({ id: "u1", name: "Tanja" });
      if (url.includes("/me/accounts")) return json({ data: [{ id: "p1", name: "Andere Seite", access_token: "a" }, { id: "p2", name: "Seelenwende", access_token: "b" }] });
      return new Response("{}", { status: 404 });
    },
    async () => {
      const page = await lookupPage({ token: "utok", pageName: "seelen" });
      assert.deepEqual(page, { pageId: "p2", pageName: "Seelenwende", token: "b", others: ["Andere Seite"] });
    },
  );
});

test("Formate: Bild hat genau eine Folie, Karussell höchstens zehn", () => {
  const scenes = Array.from({ length: 12 }, (_, i) => ({ text: `Folie ${i + 1}` }));
  assert.equal(normalizePlan({ format: "image", scenes }).scenes.length, 1);
  assert.equal(normalizePlan({ format: "carousel", scenes }).scenes.length, 10);
  assert.equal(normalizePlan({ scenes }).format, "reel");
});
