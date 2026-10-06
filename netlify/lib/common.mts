import Anthropic from "@anthropic-ai/sdk";

/* ---------- Hilfsfunktionen ---------- */

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
