import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { isKompassConfigured, isValidKompassCode, kompassTage, parseEingabe } from "../lib/kompass.mts";

// Prüft den Zugangscode und liefert die 30 Impulse, fertig eingesetzt mit Satz und Werten.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isKompassConfigured()) return json({ error: "Der Kompass ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!isValidKompassCode(body?.code)) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);

  const eingabe = parseEingabe(body);
  if (!eingabe) return json({ error: "Satz oder Werte fehlen. Geh bitte noch einmal durch die Einrichtung." }, 400);

  return json({ tage: kompassTage(eingabe) });
};

export const config: Config = {
  path: "/api/kompass/tage",
};
