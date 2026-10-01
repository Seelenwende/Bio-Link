import { createHash, timingSafeEqual } from "node:crypto";

/* Zugangscodes, die in einer Umgebungsvariable kommagetrennt stehen (Groß-/Kleinschreibung egal). */

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function hash(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function codesFrom(envVar: string): string[] {
  return (Netlify.env.get(envVar) ?? "").split(",").map(normalizeCode).filter(Boolean);
}

export function isValidCodeFor(envVar: string, given: unknown): given is string {
  if (typeof given !== "string" || given.length > 64) return false;
  const g = hash(normalizeCode(given));
  let ok = false;
  for (const c of codesFrom(envVar)) ok = timingSafeEqual(g, hash(c)) || ok;
  return ok;
}
