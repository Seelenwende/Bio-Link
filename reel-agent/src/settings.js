// Einstellungen, die direkt in der App gepflegt werden (statt in der .env).
// Gespeichert in data/settings.json; Werte aus der .env gelten als Voreinstellung.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const DATA_DIR = fileURLToPath(new URL("../data/", import.meta.url));
const FILE = path.join(DATA_DIR, "settings.json");

// Felder, die über die Oberfläche geändert werden dürfen
const EDITABLE = [
  "ANTHROPIC_API_KEY",
  "BRAND_NAME",
  "BRAND_HANDLE",
  "BRAND_VOICE",
  "IG_ACCESS_TOKEN",
  "IG_USER_ID",
  "IG_USERNAME",
  "IG_GRAPH_HOST",
  "IG_TOKEN_REFRESHED_AT",
  "FB_PAGE_ID",
  "FB_PAGE_NAME",
  "FB_PAGE_TOKEN",
];
const SECRET = new Set(["ANTHROPIC_API_KEY", "IG_ACCESS_TOKEN", "FB_PAGE_TOKEN"]);

let stored = {};

/** Lädt gespeicherte Einstellungen und legt sie über die Umgebungsvariablen. */
export async function loadSettings() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    stored = JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    stored = {};
  }
  for (const [k, v] of Object.entries(stored)) if (EDITABLE.includes(k) && v != null) process.env[k] = String(v);
}

/** Übernimmt Änderungen; leere Strings löschen einen Wert. */
export async function saveSettings(changes) {
  for (const [k, v] of Object.entries(changes)) {
    if (!EDITABLE.includes(k) || v === undefined) continue;
    const value = String(v ?? "").trim();
    if (value) {
      stored[k] = value;
      process.env[k] = value;
    } else {
      delete stored[k];
      delete process.env[k];
    }
  }
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });
}

const mask = (v) => (v ? `${v.slice(0, 6)}…${v.slice(-4)}` : "");

/** Einstellungen für die Oberfläche – Geheimnisse nur maskiert. */
export function publicSettings() {
  const out = {};
  for (const k of EDITABLE) {
    const v = process.env[k] || "";
    out[k] = SECRET.has(k) ? { set: Boolean(v), preview: mask(v) } : v;
  }
  return out;
}
