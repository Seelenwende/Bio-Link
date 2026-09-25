import Anthropic from "@anthropic-ai/sdk";
import { createHash, timingSafeEqual } from "node:crypto";

export const STORE_NAME = "profil-check";
export const MODEL = "claude-opus-5";

/* ---------- Hilfsfunktionen ---------- */

export function checkAccessCode(given: unknown): boolean {
  const expected = Netlify.env.get("HOOKCHECK_ACCESS_CODE");
  if (!expected || typeof given !== "string") return false;
  const a = createHash("sha256").update(given.trim()).digest();
  const b = createHash("sha256").update(expected.trim()).digest();
  return timingSafeEqual(a, b);
}

export function isConfigured(): boolean {
  return Boolean(Netlify.env.get("ANTHROPIC_API_KEY") && Netlify.env.get("HOOKCHECK_ACCESS_CODE"));
}

export const ID_PATTERN = /^[0-9a-f-]{36}$/;

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Der API-Schlüssel ist ungültig. Bitte in Netlify prüfen.";
  if (err instanceof Anthropic.RateLimitError) return "Gerade zu viele Anfragen – bitte in einer Minute noch einmal.";
  if (err instanceof Anthropic.BadRequestError) return "Die Anfrage wurde abgelehnt (ungültige Eingabe oder Guthaben aufgebraucht).";
  if (err instanceof Anthropic.APIError) return `Die KI ist gerade nicht erreichbar (Fehler ${err.status}). Bitte später noch einmal.`;
  if (err instanceof Error) return err.message;
  return "Unbekannter Fehler.";
}
