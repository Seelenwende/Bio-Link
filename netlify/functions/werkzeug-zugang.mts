import type { Config, Context } from "@netlify/functions";
import { isCodeInList } from "../lib/codes.mts";
import { json } from "../lib/common.mts";
import { resolveAccess } from "../lib/zugang.mts";

/* Freischaltung der bezahlten Browser-Werkzeuge (Red-Flag-Radar, Werte-Finder, Sei sanft mit dir).
   Es wird nur geprüft, ob der Code gilt; gespeichert wird nichts.
   - Eigene Codes je Werkzeug: RADAR_CODES, WERTE_CODES, SANFT_CODES
   - Kreis- und Programm-Codes öffnen alle drei („alle Werkzeuge inklusive“)
   Werte-Finder (Stufe 2) und Kompass (Stufe 3) sind getrennte Produkte, kein Code öffnet beide. */
const WERKZEUGE: Record<string, { env: string }> = {
  radar: { env: "RADAR_CODES" },
  werte: { env: "WERTE_CODES" },
  sanft: { env: "SANFT_CODES" },
};

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  const body = await req.json().catch(() => null);
  const werkzeug = WERKZEUGE[typeof body?.werkzeug === "string" ? body.werkzeug : ""];
  if (!werkzeug) return json({ error: "Unbekanntes Werkzeug." }, 400);

  const code = body?.code;
  let ok = isCodeInList(werkzeug.env, code);
  if (!ok) {
    const plan = (await resolveAccess(code))?.plan;
    ok = plan === "kreis" || plan === "programm";
  }
  if (!ok) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);
  return json({ ok: true });
};

export const config: Config = {
  path: "/api/werkzeug/zugang",
};
