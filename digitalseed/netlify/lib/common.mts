import Anthropic from "@anthropic-ai/sdk";
import { createHash, timingSafeEqual } from "node:crypto";

export const ID_PATTERN = /^[0-9a-f-]{36}$/;
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{24,64}$/;

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

/* Passwort (DIGITALSEED_ADMIN_KEY): Dashboard und interne Aufrufe der Hintergrund-Funktion.
   Header „Authorization: Bearer <DIGITALSEED_ADMIN_KEY>“ oder Feld „schluessel“ im Body. */
export function checkAdminKey(given: string | null | undefined): boolean {
  const expected = Netlify.env.get("DIGITALSEED_ADMIN_KEY");
  if (!expected || expected.length < 12 || typeof given !== "string") return false;
  const value = given.replace(/^Bearer\s+/i, "").trim();
  const a = createHash("sha256").update(value).digest();
  const b = createHash("sha256").update(expected.trim()).digest();
  return timingSafeEqual(a, b);
}

export function adminFromRequest(req: Request): boolean {
  return checkAdminKey(req.headers.get("authorization"));
}

export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Buffer.from(bytes).toString("base64url");
}

/* Öffentliche Adresse der App, z. B. für Links in Mails und Bild-URLs für Buffer. */
export function siteUrl(): string {
  return (Netlify.env.get("DIGITALSEED_URL") || Netlify.env.get("URL") || "").replace(/\/$/, "");
}

export function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Der Anthropic-API-Schlüssel ist ungültig. Bitte in Netlify prüfen.";
  if (err instanceof Anthropic.RateLimitError) return "Gerade zu viele KI-Anfragen. Bitte den Schritt in einer Minute neu starten.";
  if (err instanceof Anthropic.BadRequestError) return `Die KI hat die Anfrage abgelehnt (${err.message}).`;
  if (err instanceof Anthropic.APIError) return `Die KI ist gerade nicht erreichbar (Fehler ${err.status}).`;
  if (err instanceof Error) return err.message;
  return "Unbekannter Fehler.";
}

export function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

/* Interne Aufgaben laufen in der Hintergrund-Funktion (bis 15 Minuten). */
export type Aufgabe =
  | { aufgabe: "schritt"; kundeId: string }
  | { aufgabe: "einplanen"; kundeId: string }
  | { aufgabe: "ueberarbeiten"; kundeId: string; itemId: string }
  | { aufgabe: "bericht"; kundeId: string; monat?: string };

export async function startAufgabe(origin: string, aufgabe: Aufgabe): Promise<boolean> {
  const res = await fetch(new URL("/.netlify/functions/aufgabe-background", origin), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...aufgabe, schluessel: Netlify.env.get("DIGITALSEED_ADMIN_KEY") }),
  });
  return res.status === 202;
}
