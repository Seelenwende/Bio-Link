import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { themenBis } from "../lib/kreis-inhalte.mts";
import { accessInfo, currentPeriod, getUsage, resolveAccess, today } from "../lib/zugang.mts";

// Liefert den Mitgliederbereich des Kreises: Monatsthemen bis heute und das Mira-Kontingent.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);

  const body = await req.json().catch(() => null);
  const access = await resolveAccess(body?.code);
  if (!access) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Willkommens-Mail." }, 401);
  if (access.plan !== "kreis") {
    return json({ error: "Dieser Code gehört nicht zum Kreis. Mit ihm kannst du Mira direkt öffnen.", reason: "mira" }, 403);
  }

  const used = await getUsage(access);
  return json({
    heute: today(),
    themen: themenBis(currentPeriod()),
    mira: accessInfo(access, used),
  });
};

export const config: Config = {
  path: "/api/kreis/inhalt",
};
