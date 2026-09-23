import "dotenv/config";
import express from "express";
import multer from "multer";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { planReel, normalizePlan, hasClaude } from "./planner.js";
import { renderReel, totalDuration } from "./render.js";
import { publishReel, isInstagramConfigured, getProfile } from "./instagram.js";
import { MOODS } from "./music.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUTPUT = path.join(ROOT, "output");
const UPLOADS = path.join(ROOT, "uploads");
await mkdir(OUTPUT, { recursive: true });
await mkdir(UPLOADS, { recursive: true });

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const HANDLE = process.env.BRAND_HANDLE || "@_seelenwende";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Optionaler Passwortschutz, falls der Agent öffentlich erreichbar ist
if (process.env.APP_PASSWORD) {
  const expected = Buffer.from(`reel:${process.env.APP_PASSWORD}`);
  app.use((req, res, next) => {
    // Instagram muss im URL-Modus die Videos ohne Login abrufen können
    if (req.path.startsWith("/reels/") && req.path.endsWith(".mp4")) return next();
    const given = Buffer.from(Buffer.from((req.headers.authorization || "").replace(/^Basic /, ""), "base64").toString());
    if (given.length === expected.length && timingSafeEqual(given, expected)) return next();
    res.set("WWW-Authenticate", 'Basic realm="Reel-Agent"').status(401).send("Login erforderlich (Benutzer: reel)");
  });
}

app.use(express.static(path.join(ROOT, "public")));
app.use("/reels", express.static(OUTPUT, { index: false }));

const upload = multer({
  dest: UPLOADS,
  limits: { fileSize: 50 * 1024 * 1024, files: 13 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.fieldname === "images" ? /^image\/(jpeg|png|webp)$/.test(file.mimetype) : /^audio\//.test(file.mimetype);
    cb(ok ? null : new Error(`Dateityp nicht unterstützt: ${file.originalname}`), ok);
  },
});

// Laufende Render-/Veröffentlichungsaufträge (im Speicher)
const jobs = new Map();
const newJob = (type) => {
  const job = { id: randomUUID(), type, status: "running", step: "Startet …", result: null, error: null };
  jobs.set(job.id, job);
  return job;
};
const runJob = (job, fn) =>
  fn(job)
    .then((result) => Object.assign(job, { status: "done", result }))
    .catch((err) => {
      console.error(`[${job.type}]`, err);
      Object.assign(job, { status: "error", error: err.message });
    });

const reelDir = (id) => {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Ungültige Reel-ID");
  return path.join(OUTPUT, id);
};

app.get("/api/status", async (req, res) => {
  let instagram = { configured: isInstagramConfigured() };
  if (instagram.configured) {
    try {
      instagram.username = (await getProfile()).username;
    } catch (e) {
      instagram.error = e.message;
    }
  }
  res.json({ claude: hasClaude(), instagram, handle: HANDLE, moods: Object.fromEntries(Object.entries(MOODS).map(([k, v]) => [k, v.label])) });
});

app.post("/api/plan", async (req, res) => {
  try {
    const { brief, duration, mood, style } = req.body ?? {};
    const plan = await planReel({ brief, duration: Math.min(90, Math.max(5, Number(duration) || 20)), mood, style });
    res.json({ plan, duration: totalDuration(plan), ai: hasClaude() });
  } catch (e) {
    console.error("[plan]", e);
    res.status(400).json({ error: e.message });
  }
});

app.post(
  "/api/render",
  upload.fields([{ name: "images", maxCount: 12 }, { name: "music", maxCount: 1 }]),
  async (req, res) => {
    const files = [...(req.files?.images ?? []), ...(req.files?.music ?? [])];
    let plan;
    try {
      plan = normalizePlan(JSON.parse(req.body.plan || "{}"));
      if (totalDuration(plan) > 90) throw new Error("Reels dürfen über die API maximal 90 Sekunden lang sein.");
    } catch (e) {
      await Promise.all(files.map((f) => rm(f.path, { force: true })));
      return res.status(400).json({ error: e.message });
    }

    const job = newJob("render");
    const id = randomUUID();
    runJob(job, async (j) => {
      const dir = reelDir(id);
      await mkdir(dir, { recursive: true });
      try {
        j.step = "Szenen & Musik werden erstellt …";
        const { duration } = await renderReel(plan, {
          outFile: path.join(dir, "reel.mp4"),
          workDir: path.join(dir, "work"),
          images: (req.files?.images ?? []).map((f) => f.path),
          musicFile: req.files?.music?.[0]?.path,
          handle: req.body.showHandle === "false" ? "" : HANDLE,
        });
        const meta = { id, createdAt: new Date().toISOString(), duration, plan, published: null };
        await writeFile(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
        return { ...meta, video: `/reels/${id}/reel.mp4`, thumb: `/reels/${id}/reel.jpg` };
      } catch (e) {
        await rm(dir, { recursive: true, force: true });
        throw e;
      } finally {
        await Promise.all(files.map((f) => rm(f.path, { force: true })));
      }
    });
    res.status(202).json({ jobId: job.id });
  },
);

app.post("/api/publish/:id", async (req, res) => {
  let dir;
  try {
    dir = reelDir(req.params.id);
    if (!existsSync(path.join(dir, "reel.mp4"))) throw new Error("Reel nicht gefunden");
  } catch (e) {
    return res.status(404).json({ error: e.message });
  }
  if (!isInstagramConfigured()) return res.status(400).json({ error: "Instagram ist noch nicht verbunden (siehe README)." });

  const caption = String(req.body?.caption ?? "").trim();
  const job = newJob("publish");
  runJob(job, async (j) => {
    const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
    const result = await publishReel({
      file: path.join(dir, "reel.mp4"),
      publicUrl: base ? `${base}/reels/${req.params.id}/reel.mp4` : undefined,
      caption,
      shareToFeed: req.body?.shareToFeed !== false,
      thumbOffsetMs: 1000,
      onProgress: (s) => (j.step = s),
    });
    const metaPath = path.join(dir, "meta.json");
    const meta = JSON.parse(await readFile(metaPath, "utf8"));
    meta.published = { ...result, at: new Date().toISOString(), caption };
    await writeFile(metaPath, JSON.stringify(meta, null, 2));
    return result;
  });
  res.status(202).json({ jobId: job.id });
});

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Auftrag nicht gefunden" });
  res.json(job);
});

app.get("/api/reels", async (req, res) => {
  const reels = [];
  for (const id of await readdir(OUTPUT)) {
    try {
      const meta = JSON.parse(await readFile(path.join(OUTPUT, id, "meta.json"), "utf8"));
      reels.push({ ...meta, video: `/reels/${id}/reel.mp4`, thumb: `/reels/${id}/reel.jpg` });
    } catch {
      // unvollständige Ordner überspringen
    }
  }
  reels.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(reels);
});

app.delete("/api/reels/:id", async (req, res) => {
  try {
    await rm(reelDir(req.params.id), { recursive: true, force: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`🎬 Reel-Agent läuft auf http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(`   Claude: ${hasClaude() ? "aktiv" : "nicht konfiguriert (Offline-Modus)"} · Instagram: ${isInstagramConfigured() ? "verbunden" : "nicht verbunden"}`);
});
