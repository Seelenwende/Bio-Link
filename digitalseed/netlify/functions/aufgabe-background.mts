import type { Context } from "@netlify/functions";
import { checkAdminKey, errorMessage, siteUrl, startAufgabe, ID_PATTERN } from "../lib/common.mts";
import { aendereKunde, ladeDaten, ladeKunde, naechsterSchritt, speichereDaten, type BufferEintrag, type Freigaben, type Inhalte, type Marke } from "../lib/kunden.mts";
import { AUSFUEHRUNG, ueberarbeite } from "../lib/schritte.mts";
import { isBufferConfigured, planeBeitrag } from "../lib/buffer.mts";
import { erstelleBericht, vormonat } from "../lib/bericht.mts";
import { melde } from "../lib/meldung.mts";

/* Hintergrund-Funktion (bis 15 Minuten): ein Schritt des Ablaufs pro Aufruf. Danach startet
   sie sich für den nächsten Schritt selbst neu, damit jeder Schritt die volle Laufzeit hat. */

const HAENGT_NACH = 16 * 60 * 1000;

async function schritt(kundeId: string, origin: string): Promise<void> {
  const kunde = await ladeKunde(kundeId);
  if (!kunde) return;
  const key = naechsterSchritt(kunde);
  if (!key) return;
  const status = kunde.schritte[key];
  if (status.status === "laeuft" && Date.now() - (status.start ?? 0) < HAENGT_NACH) return; // läuft schon
  if (status.status === "fehler") return; // wartet auf Neustart im Dashboard

  await aendereKunde(kundeId, (k) => {
    k.schritte[key] = { status: "laeuft", start: Date.now() };
  });

  try {
    const kosten = await AUSFUEHRUNG[key]((await ladeKunde(kundeId))!);
    // Firmenname aus dem Markenprofil übernehmen, falls beim Anlegen keiner angegeben war
    const marke = key === "marke" ? await ladeDaten<Marke>(kundeId, "marke") : null;
    const nachher = await aendereKunde(kundeId, (k) => {
      k.schritte[key] = { status: "fertig", start: k.schritte[key].start, ende: Date.now() };
      k.kostenUsd = Math.round((k.kostenUsd + kosten) * 100) / 100;
      if (marke && !k.name) k.name = marke.name;
      if (!naechsterSchritt(k)) k.phase = "pruefung";
    });
    if (key === "analyse") await melde("analyse_fertig", nachher);
    if (naechsterSchritt(nachher)) {
      if (!(await startAufgabe(origin, { aufgabe: "schritt", kundeId }))) throw new Error("Der nächste Schritt konnte nicht gestartet werden.");
    } else {
      await melde("pruefung_bereit", nachher);
    }
  } catch (err) {
    console.error("schritt failed", key, err);
    const k = await aendereKunde(kundeId, (k) => {
      k.schritte[key] = { status: "fehler", start: k.schritte[key].start, ende: Date.now(), fehler: errorMessage(err) };
    });
    await melde("fehler", k, { schritt: key, fehler: errorMessage(err) });
  }
}

/* Freigegebene Beiträge in Buffer einplanen (nur Zukunft, nur einmal) */
async function einplanen(kundeId: string): Promise<void> {
  const kunde = await ladeKunde(kundeId);
  if (!kunde || !isBufferConfigured()) return;
  const inhalte = await ladeDaten<Inhalte>(kundeId, "inhalte");
  const freigaben = (await ladeDaten<Freigaben>(kundeId, "freigaben")) ?? {};
  const buffer = (await ladeDaten<Record<string, BufferEintrag>>(kundeId, "buffer")) ?? {};
  if (!inhalte) return;
  const basis = siteUrl();
  for (const beitrag of inhalte.beitraege) {
    const channelId = kunde.buffer[beitrag.kanal];
    if (!channelId || freigaben[beitrag.id]?.status !== "freigegeben" || buffer[beitrag.id]?.postId) continue;
    if (new Date(beitrag.datum).getTime() < Date.now() + 10 * 60 * 1000) {
      buffer[beitrag.id] = { fehler: "Termin liegt in der Vergangenheit – bitte Startdatum anpassen.", zeit: Date.now() };
      continue;
    }
    try {
      buffer[beitrag.id] = { postId: await planeBeitrag(beitrag, channelId, basis), zeit: Date.now() };
    } catch (err) {
      buffer[beitrag.id] = { fehler: errorMessage(err), zeit: Date.now() };
    }
    await speichereDaten(kundeId, "buffer", buffer);
  }
  await speichereDaten(kundeId, "buffer", buffer);
}

async function ueberarbeiten(kundeId: string, itemId: string): Promise<void> {
  const kunde = await ladeKunde(kundeId);
  if (!kunde) return;
  const freigaben = (await ladeDaten<Freigaben>(kundeId, "freigaben")) ?? {};
  const wunsch = freigaben[itemId]?.kommentar;
  if (!wunsch) return;
  freigaben[itemId] = { ...freigaben[itemId], status: "in_arbeit", zeit: Date.now() };
  await speichereDaten(kundeId, "freigaben", freigaben);
  try {
    const kosten = await ueberarbeite(kunde, itemId, wunsch);
    await aendereKunde(kundeId, (k) => {
      k.kostenUsd = Math.round((k.kostenUsd + kosten) * 100) / 100;
    });
    const aktuell = (await ladeDaten<Freigaben>(kundeId, "freigaben")) ?? {};
    aktuell[itemId] = { status: "offen", ueberarbeitet: wunsch, zeit: Date.now() };
    await speichereDaten(kundeId, "freigaben", aktuell);
  } catch (err) {
    console.error("ueberarbeiten failed", err);
    const aktuell = (await ladeDaten<Freigaben>(kundeId, "freigaben")) ?? {};
    aktuell[itemId] = { status: "aenderung", kommentar: wunsch, zeit: Date.now() };
    await speichereDaten(kundeId, "freigaben", aktuell);
    await melde("fehler", kunde, { schritt: "ueberarbeiten", item: itemId, fehler: errorMessage(err) });
  }
}

async function bericht(kundeId: string, monat?: string): Promise<void> {
  const kunde = await ladeKunde(kundeId);
  if (!kunde) return;
  const m = monat && /^\d{4}-\d{2}$/.test(monat) ? monat : vormonat();
  try {
    const { kostenUsd } = await erstelleBericht(kunde, m);
    const k = await aendereKunde(kundeId, (k) => {
      k.kostenUsd = Math.round((k.kostenUsd + kostenUsd) * 100) / 100;
    });
    await melde("bericht_fertig", k, { monat: m, bericht: `${siteUrl()}/kunde.html?k=${k.token}#bericht-${m}` });
  } catch (err) {
    console.error("bericht failed", err);
    await melde("fehler", kunde, { schritt: "bericht", monat: m, fehler: errorMessage(err) });
  }
}

export default async (req: Request, _context: Context) => {
  const body = await req.json().catch(() => null);
  if (!body || !checkAdminKey(body.schluessel) || typeof body.kundeId !== "string" || !ID_PATTERN.test(body.kundeId)) return;
  const origin = new URL(req.url).origin;
  switch (body.aufgabe) {
    case "schritt":
      return schritt(body.kundeId, origin);
    case "einplanen":
      return einplanen(body.kundeId);
    case "ueberarbeiten":
      return typeof body.itemId === "string" ? ueberarbeiten(body.kundeId, body.itemId) : undefined;
    case "bericht":
      return bericht(body.kundeId, body.monat);
  }
};
