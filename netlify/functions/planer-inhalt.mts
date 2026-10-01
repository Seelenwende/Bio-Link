import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { codesFrom, isValidCodeFor } from "../lib/zugang.mts";
import { PLANER_INHALT } from "../lib/ausstiegs-planer.mts";

const CODES_VAR = "ERSTE_HILFE_CODES";

// Prüft den Zugangscode und liefert erst dann den Inhalt des Ausstiegs-Planers.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (codesFrom(CODES_VAR).length === 0) return json({ error: "Der Planer ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!isValidCodeFor(CODES_VAR, body?.code)) {
    return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);
  }
  return json({ ok: true, inhalt: PLANER_INHALT });
};

export const config: Config = {
  path: "/api/planer/inhalt",
};
