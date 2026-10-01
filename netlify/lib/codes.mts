import { createHash, timingSafeEqual } from "node:crypto";

/* Zugangscodes stehen kommagetrennt in einer Umgebungsvariable, z. B. "Wendepunkt, WENDE-AB12-CD34".
   Groß-/Kleinschreibung und Leerzeichen am Rand sind egal. */

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function hashCode(value: string): Buffer {
  return createHash("sha256").update(normalizeCode(value)).digest();
}

export function codeList(envName: string): string[] {
  return (Netlify.env.get(envName) ?? "").split(",").map(normalizeCode).filter(Boolean);
}

/** Prüft, ob der Code in der Liste steht – in konstanter Zeit, damit sich Codes nicht erraten lassen. */
export function isCodeInList(envName: string, given: unknown): given is string {
  if (typeof given !== "string" || given.length > 64) return false;
  const g = hashCode(given);
  let ok = false;
  for (const c of codeList(envName)) ok = timingSafeEqual(g, hashCode(c)) || ok;
  return ok;
}
