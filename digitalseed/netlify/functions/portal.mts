import type { Config, Context } from "@netlify/functions";
import { json, startAufgabe } from "../lib/common.mts";
import { aendereKunde, kundeZuToken, ladeDaten, listeDaten, speichereDaten, type BufferEintrag, type Freigaben, type Inhalte } from "../lib/kunden.mts";
import { melde } from "../lib/meldung.mts";
import type { Analyse } from "../lib/schritte.mts";

/* Kundenportal (kunde.html?k=<token>): Analyse, Markenprofil, Website-Demo, Pläne,
   Inhalte zur Freigabe und Monatsberichte. Der geheime Link ist der Zugang. */

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const kunde = await kundeZuToken(url.searchParams.get("k") ?? "");
    if (!kunde) return json({ error: "Dieser Link ist ungültig oder abgelaufen." }, 404);
    const [analyse, marke, vorlagen, newsletter, strategie, inhalte, freigaben, buffer] = await Promise.all(
      ["analyse", "marke", "vorlagen", "newsletter", "strategie", "inhalte", "freigaben", "buffer"].map((n) => ladeDaten<unknown>(kunde.id, n)),
    );
    const inhalteSichtbar = kunde.phase === "freigabe" || kunde.phase === "live";
    const berichte = await Promise.all((await listeDaten(kunde.id, "bericht-")).sort().reverse().map((n) => ladeDaten<unknown>(kunde.id, n)));
    const geplant = Object.fromEntries(Object.entries((buffer ?? {}) as Record<string, BufferEintrag>).map(([id, b]) => [id, Boolean(b.postId)]));
    const { intern: _intern, ...oeffentlich } = (analyse ?? {}) as Analyse;
    return json({
      kunde: { name: kunde.name, website: kunde.website, phase: kunde.phase, startDatum: kunde.startDatum },
      analyse: analyse ? oeffentlich : null,
      marke,
      demo: kunde.schritte.website.status === "fertig" ? `/demo/${kunde.token}` : null,
      vorlagen: inhalteSichtbar ? vorlagen : null,
      newsletter: inhalteSichtbar ? newsletter : null,
      strategie: inhalteSichtbar ? strategie : null,
      inhalte: inhalteSichtbar ? inhalte : null,
      freigaben: inhalteSichtbar ? (freigaben ?? {}) : {},
      geplant: inhalteSichtbar ? geplant : {},
      berichte,
    });
  }

  if (req.method !== "POST") return json({ error: "Nur GET oder POST." }, 405);
  const body = await req.json().catch(() => null);
  const kunde = await kundeZuToken(String(body?.k ?? ""));
  if (!kunde) return json({ error: "Dieser Link ist ungültig oder abgelaufen." }, 404);
  if (kunde.phase !== "freigabe" && kunde.phase !== "live") return json({ error: "Es liegen gerade keine Inhalte zur Freigabe vor." }, 409);

  const inhalte = await ladeDaten<Inhalte>(kunde.id, "inhalte");
  if (!inhalte) return json({ error: "Keine Inhalte vorhanden." }, 404);
  const alleIds = [...inhalte.beitraege.map((b) => b.id), ...inhalte.newsletter.map((n) => n.id)];
  const freigaben = (await ladeDaten<Freigaben>(kunde.id, "freigaben")) ?? {};
  const origin = url.origin;

  if (body.aktion === "freigeben") {
    const ids: string[] = body.alle ? alleIds.filter((id) => !["freigegeben", "in_arbeit"].includes(freigaben[id]?.status ?? "")) : Array.isArray(body.ids) ? body.ids.map(String) : [];
    const gueltig = ids.filter((id) => alleIds.includes(id) && freigaben[id]?.status !== "in_arbeit");
    if (!gueltig.length) return json({ error: "Nichts zum Freigeben ausgewählt." }, 400);
    for (const id of gueltig) freigaben[id] = { status: "freigegeben", zeit: Date.now() };
    await speichereDaten(kunde.id, "freigaben", freigaben);
    const fertig = alleIds.every((id) => freigaben[id]?.status === "freigegeben");
    const k = fertig ? await aendereKunde(kunde.id, (k) => void (k.phase = "live")) : kunde;
    await startAufgabe(origin, { aufgabe: "einplanen", kundeId: kunde.id });
    await melde("freigabe_erteilt", k, { anzahl: gueltig.length, alleFreigegeben: fertig });
    return json({ ok: true, freigaben });
  }

  if (body.aktion === "aenderung") {
    const id = String(body.id ?? "");
    const kommentar = String(body.kommentar ?? "").trim().slice(0, 2000);
    if (!alleIds.includes(id)) return json({ error: "Inhalt nicht gefunden." }, 404);
    if (!kommentar) return json({ error: "Bitte beschreiben Sie kurz, was wir ändern sollen." }, 400);
    freigaben[id] = { status: "aenderung", kommentar, zeit: Date.now() };
    await speichereDaten(kunde.id, "freigaben", freigaben);
    await startAufgabe(origin, { aufgabe: "ueberarbeiten", kundeId: kunde.id, itemId: id });
    await melde("aenderung_gewuenscht", kunde, { item: id, kommentar });
    return json({ ok: true, freigaben });
  }

  return json({ error: "Unbekannte Aktion." }, 400);
};

export const config: Config = {
  path: "/api/portal",
};
