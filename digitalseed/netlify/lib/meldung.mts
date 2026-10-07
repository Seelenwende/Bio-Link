import { siteUrl } from "./common.mts";
import type { Kunde } from "./kunden.mts";

/* Ereignisse an einen Webhook (z. B. Make) melden, der daraus Mails verschickt.
   Ohne DIGITALSEED_WEBHOOK_URL passiert nichts – das Dashboard zeigt den Stand trotzdem. */

export type Ereignis =
  | "analyse_fertig" // an dich: Analyse und Demo liegen vor
  | "pruefung_bereit" // an dich: alle Inhalte erzeugt, bitte prüfen
  | "freigabe_angefragt" // an den Kunden: Inhalte zur Freigabe
  | "aenderung_gewuenscht" // an dich: Kunde wünscht eine Änderung
  | "freigabe_erteilt" // an dich: Kunde hat Inhalte freigegeben
  | "bericht_fertig" // an den Kunden: Monatsbericht
  | "fehler"; // an dich: ein Schritt ist fehlgeschlagen

export async function melde(ereignis: Ereignis, kunde: Kunde, details: Record<string, unknown> = {}): Promise<void> {
  const url = Netlify.env.get("DIGITALSEED_WEBHOOK_URL");
  if (!url) return;
  const basis = siteUrl();
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        ereignis,
        zeit: new Date().toISOString(),
        kunde: { id: kunde.id, name: kunde.name, email: kunde.email, website: kunde.website },
        portal: `${basis}/kunde.html?k=${kunde.token}`,
        dashboard: `${basis}/#${kunde.id}`,
        ...details,
      }),
    });
  } catch (err) {
    console.error("webhook failed", ereignis, err);
  }
}
