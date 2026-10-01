import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

/* Zugangscodes und Kontingente – gemeinsam für alle Werkzeuge mit Code (Mira, Antwort-Helfer …). */

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function hash(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Codes stehen kommagetrennt in den genannten Variablen, z. B. "Wendepunkt, WENDE-AB12-CD34" (Groß-/Kleinschreibung egal). */
export function isValidCodeIn(envNames: string[], given: unknown): given is string {
  if (typeof given !== "string" || given.length > 64) return false;
  const codes = envNames.flatMap((name) => (Netlify.env.get(name) ?? "").split(",")).map(normalizeCode).filter(Boolean);
  const g = hash(normalizeCode(given));
  let ok = false;
  for (const c of codes) ok = timingSafeEqual(g, hash(c)) || ok;
  return ok;
}

export function hasCodes(envNames: string[]): boolean {
  return envNames.some((name) => Boolean(Netlify.env.get(name)?.trim()));
}

export function limitFromEnv(envName: string, fallback: number): number {
  const n = Number(Netlify.env.get(envName));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Gezählt wird pro Code (als Hash) und pro Werkzeug-Store. */
function usageKey(code: string): string {
  return "usage/" + hash(normalizeCode(code)).toString("hex");
}

export async function getUsage(storeName: string, code: string): Promise<number> {
  const data = (await getStore(storeName).get(usageKey(code), { type: "json" })) as { used?: number } | null;
  return data?.used ?? 0;
}

export async function setUsage(storeName: string, code: string, used: number): Promise<void> {
  await getStore(storeName).setJSON(usageKey(code), { used, updatedAt: Date.now() });
}
