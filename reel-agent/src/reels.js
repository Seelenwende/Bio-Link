// Gemeinsame Logik für Oberfläche und Chat-Agent:
// Dateien (Bilder/Musik), Reels rendern, veröffentlichen, planen, Token pflegen.

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile, rm, rename, copyFile, open, stat } from "node:fs/promises";
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
const LOCKS = path.join(DATA_DIR, "locks");
export const TZ = process.env.TZ_NAME || "Europe/Berlin";

await mkdir(OUTPUT, { recursive: true });
await mkdir(ASSETS, { recursive: true });
await mkdir(LOCKS, { recursive: true });

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

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const AUDIO_EXT = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];

/** Prüft eine lokale Datei (z. B. vom MCP-Client übergeben). */
async function localFile(p, exts) {
  const full = path.resolve(String(p));
  if (!exts.includes(path.extname(full).toLowerCase())) throw new Error(`Dateityp nicht unterstützt: ${p} (erlaubt: ${exts.join(", ")})`);
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) throw new Error(`Datei nicht gefunden: ${p}`);
  return full;
}

// ---------- Reels ----------

const withUrls = (meta) => ({ ...meta, video: `/reels/${meta.id}/reel.mp4`, thumb: `/reels/${meta.id}/reel.jpg` });

/** Rendert ein Drehbuch zu einem Reel und speichert es. */
export async function createReel(
  { plan, imageIds = [], musicId, imagePaths = [], musicPath, showHandle = true },
  onStep = () => {},
) {
  plan = normalizePlan(plan);
  if (totalDuration(plan) > 90) throw new Error("Reels dürfen über die API maximal 90 Sekunden lang sein.");
  const images = [...imageIds.map(assetPath), ...(await Promise.all(imagePaths.map((p) => localFile(p, IMAGE_EXT))))];
  const musicFile = musicId ? assetPath(musicId) : musicPath ? await localFile(musicPath, AUDIO_EXT) : undefined;

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

// Die Planung wird bei jedem Zugriff frisch gelesen, weil Web-App und MCP-Server parallel laufen können.
async function readSchedule() {
  try {
    return JSON.parse(await readFile(SCHEDULE_FILE, "utf8"));
  } catch {
    return [];
  }
}
async function writeSchedule(list) {
  const tmp = `${SCHEDULE_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2));
  await rename(tmp, SCHEDULE_FILE);
}
async function updateEntry(id, changes) {
  const list = await readSchedule();
  const entry = list.find((e) => e.id === id);
  if (entry) Object.assign(entry, changes);
  await writeSchedule(list);
  return entry;
}

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
  const list = await readSchedule();
  list.push(entry);
  await writeSchedule(list);
  return entry;
}

export const listSchedule = async () => (await readSchedule()).sort((a, b) => a.at.localeCompare(b.at));

export async function cancelSchedule(id) {
  const list = await readSchedule();
  const entry = list.find((e) => e.id === id);
  if (!entry) throw new Error("Geplanter Post nicht gefunden");
  if (entry.status !== "geplant") throw new Error("Dieser Post ist nicht mehr geplant.");
  await writeSchedule(list.filter((e) => e.id !== id));
}

/** Exklusive Sperre pro Post – verhindert doppeltes Posten, wenn mehrere Prozesse laufen. */
async function claim(id) {
  try {
    await (await open(path.join(LOCKS, id), "wx")).close();
    return true;
  } catch {
    return false;
  }
}

let ticking = false;
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const due = (await readSchedule()).filter((e) => e.status === "geplant" && Date.parse(e.at) <= Date.now());
    for (const entry of due) {
      if (!(await claim(entry.id))) continue; // ein anderer Prozess kümmert sich bereits darum
      await updateEntry(entry.id, { status: "wird veröffentlicht" });
      try {
        const result = await publishNow(entry.reelId, entry);
        await updateEntry(entry.id, { status: "veröffentlicht", result });
      } catch (e) {
        await updateEntry(entry.id, { status: "fehlgeschlagen", error: e.message });
      }
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
