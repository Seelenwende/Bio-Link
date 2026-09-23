// Gemeinsame Logik für Oberfläche und Chat-Agent:
// Dateien (Bilder/Musik), Reels rendern, veröffentlichen, planen, Token pflegen.

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile, rm, rename, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { normalizePlan } from "./planner.js";
import { renderReel, totalDuration } from "./render.js";
import { publishReel, refreshToken } from "./instagram.js";
import { DATA_DIR, saveSettings } from "./settings.js";

export const OUTPUT = fileURLToPath(new URL("../output/", import.meta.url));
const ASSETS = path.join(DATA_DIR, "assets");
const SCHEDULE_FILE = path.join(DATA_DIR, "schedule.json");
export const TZ = process.env.TZ_NAME || "Europe/Berlin";

await mkdir(OUTPUT, { recursive: true });
await mkdir(ASSETS, { recursive: true });

const isId = (id) => typeof id === "string" && /^[0-9a-f-]{36}$/.test(id);
const reelDir = (id) => {
  if (!isId(id)) throw new Error("Ungültige Reel-ID");
  return path.join(OUTPUT, id);
};

// ---------- Dateien ----------

/** Übernimmt eine hochgeladene Datei (multer) in den Asset-Speicher. */
export async function storeAsset(file) {
  const id = randomUUID();
  const kind = file.mimetype.startsWith("image/") ? "image" : "music";
  const target = path.join(ASSETS, id);
  try {
    await rename(file.path, target);
  } catch {
    await copyFile(file.path, target);
    await rm(file.path, { force: true });
  }
  await writeFile(`${target}.json`, JSON.stringify({ id, kind, name: file.originalname, mimetype: file.mimetype }));
  return { id, kind, name: file.originalname };
}

function assetPath(id) {
  if (!isId(id)) throw new Error("Ungültige Datei-ID");
  const p = path.join(ASSETS, id);
  if (!existsSync(p)) throw new Error("Hochgeladene Datei nicht mehr vorhanden – bitte erneut hochladen.");
  return p;
}

// ---------- Reels ----------

const withUrls = (meta) => ({ ...meta, video: `/reels/${meta.id}/reel.mp4`, thumb: `/reels/${meta.id}/reel.jpg` });

/** Rendert ein Drehbuch zu einem Reel und speichert es. */
export async function createReel({ plan, imageIds = [], musicId, showHandle = true }, onStep = () => {}) {
  plan = normalizePlan(plan);
  if (totalDuration(plan) > 90) throw new Error("Reels dürfen über die API maximal 90 Sekunden lang sein.");
  const images = imageIds.map(assetPath);
  const musicFile = musicId ? assetPath(musicId) : undefined;

  const id = randomUUID();
  const dir = reelDir(id);
  await mkdir(dir, { recursive: true });
  try {
    onStep("Szenen & Musik werden erstellt …");
    const { duration } = await renderReel(plan, {
      outFile: path.join(dir, "reel.mp4"),
      workDir: path.join(dir, "work"),
      images,
      musicFile,
      handle: showHandle ? process.env.BRAND_HANDLE || "@_seelenwende" : "",
    });
    const meta = { id, createdAt: new Date().toISOString(), duration, plan, published: null };
    await writeFile(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
    return withUrls(meta);
  } catch (e) {
    await rm(dir, { recursive: true, force: true });
    throw e;
  }
}

export async function getReel(id) {
  const meta = JSON.parse(await readFile(path.join(reelDir(id), "meta.json"), "utf8").catch(() => {
    throw new Error("Reel nicht gefunden");
  }));
  return withUrls(meta);
}

export async function listReels() {
  const reels = [];
  for (const id of await readdir(OUTPUT)) {
    if (!isId(id)) continue;
    try {
      reels.push(await getReel(id));
    } catch {
      // unvollständige Ordner überspringen
    }
  }
  return reels.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const deleteReel = (id) => rm(reelDir(id), { recursive: true, force: true });

/** Standard-Caption eines Reels: Text + Hashtags. */
export const captionFor = (plan) =>
  [plan.caption?.trim(), (plan.hashtags ?? []).map((h) => `#${h}`).join(" ")].filter(Boolean).join("\n\n");

/** Veröffentlicht ein gespeichertes Reel sofort auf Instagram. */
export async function publishNow(id, { caption, shareToFeed = true } = {}, onStep = () => {}) {
  const reel = await getReel(id);
  const text = caption?.trim() || captionFor(reel.plan);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  const result = await publishReel({
    file: path.join(reelDir(id), "reel.mp4"),
    publicUrl: base ? `${base}/reels/${id}/reel.mp4` : undefined,
    caption: text,
    shareToFeed,
    thumbOffsetMs: 1000,
    onProgress: onStep,
  });
  const metaPath = path.join(reelDir(id), "meta.json");
  const meta = JSON.parse(await readFile(metaPath, "utf8"));
  meta.published = { ...result, at: new Date().toISOString(), caption: text };
  await writeFile(metaPath, JSON.stringify(meta, null, 2));
  return { ...result, reelId: id };
}

// ---------- Zeitplanung ----------

let schedule = [];
try {
  schedule = JSON.parse(await readFile(SCHEDULE_FILE, "utf8"));
} catch {
  schedule = [];
}
const saveSchedule = () => writeFile(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));

/** Wandelt "2026-09-24T18:00" (Ortszeit der Zeitzone) oder ISO mit Offset in ein Date. */
export function parseLocalTime(value, tz = TZ) {
  if (!value) throw new Error("Kein Zeitpunkt angegeben");
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(value)) return new Date(value);
  const asUtc = Date.parse(`${value}${value.length === 16 ? ":00" : ""}Z`);
  if (Number.isNaN(asUtc)) throw new Error(`Ungültiger Zeitpunkt: ${value}`);
  const offsetAt = (ms) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
        .formatToParts(new Date(ms))
        .map((p) => [p.type, p.value]),
    );
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - ms;
  };
  let ms = asUtc - offsetAt(asUtc);
  ms = asUtc - offsetAt(ms); // zweiter Durchgang für Sommer-/Winterzeitwechsel
  return new Date(ms);
}

export const formatLocal = (date) =>
  new Date(date).toLocaleString("de-DE", { timeZone: TZ, dateStyle: "full", timeStyle: "short" });

export async function addSchedule({ reelId, caption, at, shareToFeed = true }) {
  const reel = await getReel(reelId);
  const when = at instanceof Date ? at : parseLocalTime(at);
  if (Number.isNaN(when.getTime())) throw new Error("Ungültiger Zeitpunkt");
  if (when.getTime() < Date.now() - 60_000) throw new Error("Der Zeitpunkt liegt in der Vergangenheit.");
  const entry = {
    id: randomUUID(),
    reelId,
    title: reel.plan.title,
    caption: caption?.trim() || captionFor(reel.plan),
    shareToFeed,
    at: when.toISOString(),
    status: "geplant",
    error: null,
    result: null,
  };
  schedule.push(entry);
  await saveSchedule();
  return entry;
}

export const listSchedule = () => [...schedule].sort((a, b) => a.at.localeCompare(b.at));

export async function cancelSchedule(id) {
  const entry = schedule.find((e) => e.id === id);
  if (!entry) throw new Error("Geplanter Post nicht gefunden");
  if (entry.status !== "geplant") throw new Error("Dieser Post ist nicht mehr geplant.");
  schedule = schedule.filter((e) => e.id !== id);
  await saveSchedule();
}

let ticking = false;
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    for (const entry of schedule.filter((e) => e.status === "geplant" && Date.parse(e.at) <= Date.now())) {
      entry.status = "wird veröffentlicht";
      await saveSchedule();
      try {
        entry.result = await publishNow(entry.reelId, entry);
        entry.status = "veröffentlicht";
      } catch (e) {
        entry.status = "fehlgeschlagen";
        entry.error = e.message;
      }
      await saveSchedule();
    }
    await maybeRefreshToken();
  } finally {
    ticking = false;
  }
}

/** Verlängert das Instagram-Token automatisch, damit die Verbindung nicht nach 60 Tagen abreißt. */
async function maybeRefreshToken() {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token || (process.env.IG_GRAPH_HOST || "graph.instagram.com") !== "graph.instagram.com") return;
  const last = Date.parse(process.env.IG_TOKEN_REFRESHED_AT || 0) || 0;
  if (Date.now() - last < 7 * 24 * 3600_000) return;
  try {
    const { token: fresh } = await refreshToken(token);
    await saveSettings({ IG_ACCESS_TOKEN: fresh, IG_TOKEN_REFRESHED_AT: new Date().toISOString() });
    console.log("Instagram-Token automatisch verlängert.");
  } catch (e) {
    // Neue Tokens lassen sich erst nach 24 h verlängern – später erneut versuchen
    await saveSettings({ IG_TOKEN_REFRESHED_AT: new Date(Date.now() - 6 * 24 * 3600_000).toISOString() });
    console.warn(e.message);
  }
}

export function startScheduler() {
  setInterval(() => tick().catch((e) => console.error("[scheduler]", e)), 30_000).unref();
  tick().catch((e) => console.error("[scheduler]", e));
}
