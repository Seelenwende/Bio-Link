import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { naechstesThema, themenBis } from "../lib/kreis-inhalte.mts";
import { accessInfo, currentPeriod, getUsage, resolveAccess, today } from "../lib/zugang.mts";

// Liefert den Mitgliederbereich des Kreises: Monatsthemen bis heute, eine Vorschau auf den nächsten Monat
// und das Mira-Kontingent. In Netlify-Vorschauen (Deploy Previews) kommen alle Monate mit, zum Prüfen.
export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);

  const body = await req.json().catch(() => null);
  const access = await resolveAccess(body?.code);
  if (!access) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Willkommens-Mail." }, 401);
  if (access.plan !== "kreis") {
    return json({ error: "Dieser Code gehört nicht zum Kreis. Mit ihm kannst du Mira direkt öffnen.", reason: "mira" }, 403);
  }

  const aktuell = currentPeriod();
  const vorschau = context?.deploy?.context === "deploy-preview";
  const used = await getUsage(access);
  return json({
    heute: today(),
    aktuell,
    vorschau,
    themen: themenBis(vorschau ? "9999-12" : aktuell),
    naechstes: naechstesThema(aktuell),
    mira: accessInfo(access, used),
  });
};

export const config: Config = {
  path: "/api/kreis/inhalt",
};
