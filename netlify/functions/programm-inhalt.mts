import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { PROGRAMM, isProgrammConfigured, isValidProgrammCode } from "../lib/programm.mts";

// Prüft den Zugangscode und liefert erst dann die Inhalte des 6-Wochen-Programms aus.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isProgrammConfigured()) return json({ error: "Das Programm ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!isValidProgrammCode(body?.code)) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);

  return json({ programm: PROGRAMM });
};

export const config: Config = {
  path: "/api/programm/inhalt",
};
