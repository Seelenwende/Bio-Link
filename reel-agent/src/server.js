import "dotenv/config";
import { loadSettings, saveSettings, publicSettings } from "./settings.js";
await loadSettings();

import express from "express";
import multer from "multer";
import { timingSafeEqual } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { planReel, hasClaude } from "./planner.js";
import { totalDuration } from "./render.js";
import { isInstagramConfigured, getProfile, lookupAccount } from "./instagram.js";
import { MOODS } from "./music.js";
import { startJob, getJob } from "./jobs.js";
import {
  OUTPUT, TZ, storeAsset, createReel, listReels, deleteReel, publishNow,
  addSchedule, listSchedule, cancelSchedule, startScheduler,
} from "./reels.js";
import { getSession, chat, confirmPending } from "./agent.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const UPLOADS = path.join(ROOT, "uploads");
await mkdir(UPLOADS, { recursive: true });

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const app = express();
app.use(express.json({ limit: "2mb" }));

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
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/.test(file.mimetype) || /^audio\//.test(file.mimetype);
    cb(ok ? null : new Error(`Dateityp nicht unterstützt: ${file.originalname}`), ok);
  },
});

const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (e) {
    console.error(`[${req.method} ${req.path}]`, e.message);
    res.status(400).json({ error: e.message });
  }
};

// ---------- Status & Einstellungen ----------

app.get("/api/status", wrap(async () => {
  const instagram = { configured: isInstagramConfigured(), username: process.env.IG_USERNAME || null };
  if (instagram.configured && !instagram.username) {
    try {
      instagram.username = (await getProfile()).username;
    } catch (e) {
      instagram.error = e.message;
    }
  }
  return {
    claude: hasClaude(),
    instagram,
    handle: process.env.BRAND_HANDLE || "@_seelenwende",
    timezone: TZ,
    moods: Object.fromEntries(Object.entries(MOODS).map(([k, v]) => [k, v.label])),
  };
}));

app.get("/api/settings", wrap(async () => publicSettings()));

app.post("/api/settings", wrap(async (req) => {
  const { ANTHROPIC_API_KEY, BRAND_NAME, BRAND_HANDLE, BRAND_VOICE } = req.body ?? {};
  await saveSettings({ ANTHROPIC_API_KEY, BRAND_NAME, BRAND_HANDLE, BRAND_VOICE });
  return publicSettings();
}));

app.post("/api/instagram/connect", wrap(async (req) => {
  const token = String(req.body?.token ?? "").trim();
  const host = req.body?.host === "graph.facebook.com" ? "graph.facebook.com" : "graph.instagram.com";
  if (!token) throw new Error("Bitte füge dein Instagram-Access-Token ein.");
  const account = await lookupAccount(token, host);
  await saveSettings({
    IG_ACCESS_TOKEN: token,
    IG_USER_ID: account.userId,
    IG_USERNAME: account.username,
    IG_GRAPH_HOST: host,
    IG_TOKEN_REFRESHED_AT: new Date().toISOString(),
  });
  return account;
}));

app.post("/api/instagram/disconnect", wrap(async () => {
  await saveSettings({ IG_ACCESS_TOKEN: "", IG_USER_ID: "", IG_USERNAME: "", IG_TOKEN_REFRESHED_AT: "" });
  return { ok: true };
}));

// ---------- Drehbuch, Dateien, Rendern ----------

app.post("/api/plan", wrap(async (req) => {
  const { brief, duration, mood, style } = req.body ?? {};
  const plan = await planReel({ brief, duration: Math.min(90, Math.max(5, Number(duration) || 20)), mood, style });
  return { plan, duration: totalDuration(plan), ai: hasClaude() };
}));

app.post("/api/assets", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) throw new Error("Keine Datei empfangen");
    res.json(await storeAsset(req.file));
  } catch (e) {
    if (req.file) await rm(req.file.path, { force: true });
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/render", wrap(async (req) => {
  const { plan, imageIds, musicId, showHandle } = req.body ?? {};
  const job = startJob("render", (j) => createReel({ plan, imageIds, musicId, showHandle: showHandle !== false }, (s) => (j.step = s)));
  return { jobId: job.id };
}));

app.get("/api/reels", wrap(() => listReels()));
app.delete("/api/reels/:id", wrap(async (req) => {
  await deleteReel(req.params.id);
  return { ok: true };
}));

// ---------- Veröffentlichen & Planen ----------

app.post("/api/publish/:id", wrap(async (req) => {
  if (!isInstagramConfigured()) throw new Error("Instagram ist noch nicht verbunden (⚙️ Einstellungen).");
  const { caption, shareToFeed } = req.body ?? {};
  const job = startJob("publish", (j) => publishNow(req.params.id, { caption, shareToFeed: shareToFeed !== false }, (s) => (j.step = s)));
  return { jobId: job.id };
}));

app.get("/api/schedule", wrap(() => listSchedule()));
app.post("/api/schedule", wrap(async (req) => {
  if (!isInstagramConfigured()) throw new Error("Instagram ist noch nicht verbunden (⚙️ Einstellungen).");
  const { reelId, caption, at, shareToFeed } = req.body ?? {};
  return addSchedule({ reelId, caption, at, shareToFeed: shareToFeed !== false });
}));
app.delete("/api/schedule/:id", wrap(async (req) => {
  await cancelSchedule(req.params.id);
  return { ok: true };
}));

// ---------- Chat-Agent ----------

app.post("/api/agent/chat", wrap(async (req) => {
  const { sessionId, message, context } = req.body ?? {};
  const session = getSession(sessionId);
  if (session.busy) throw new Error("Der Agent arbeitet noch an deiner letzten Nachricht.");
  session.busy = true;
  const job = startJob("agent", async (j) => {
    try {
      return await chat(session, message, context, (s) => (j.step = s));
    } finally {
      session.busy = false;
    }
  });
  return { jobId: job.id, sessionId: session.id };
}));

app.post("/api/agent/confirm", wrap(async (req) => {
  const session = getSession(req.body?.sessionId);
  const approve = req.body?.approve === true;
  const job = startJob("confirm", (j) => confirmPending(session, approve, (s) => (j.step = s)));
  return { jobId: job.id };
}));

app.get("/api/jobs/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "Auftrag nicht gefunden" });
  res.json(job);
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

startScheduler();
app.listen(PORT, HOST, () => {
  console.log(`🎬 Reel-Agent läuft auf http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(`   Claude: ${hasClaude() ? "aktiv" : "nicht eingerichtet"} · Instagram: ${isInstagramConfigured() ? "verbunden" : "nicht verbunden"}`);
  console.log("   Einstellungen findest du in der App unter ⚙️.");
});
