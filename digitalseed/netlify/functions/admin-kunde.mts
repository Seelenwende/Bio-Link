import type { Config, Context } from "@netlify/functions";
import { adminFromRequest, errorMessage, json, siteUrl, startAufgabe } from "../lib/common.mts";
import {
  KANAELE,
  SCHRITT_KEYS,
  aendereKunde,
  ladeDaten,
  ladeKunde,
  listeDaten,
  loescheKunde,
  speichereDaten,
  type Freigaben,
  type Inhalte,
  type Kunde,
  type Marke,
  type SchrittKey,
} from "../lib/kunden.mts";
import { rendereBeitrag, zuerichIso } from "../lib/schritte.mts";
import { melde } from "../lib/meldung.mts";

/* GET ?id=…: alles zu einem Kunden · POST { id, aktion, … }: Aktionen aus dem Dashboard */

async function alles(kunde: Kunde) {
  const [erfassung, analyse, marke, newsletter, vorlagen, strategie, inhalte, freigaben, buffer] = await Promise.all(
    ["erfassung", "analyse", "marke", "newsletter", "vorlagen", "strategie", "inhalte", "freigaben", "buffer"].map((n) => ladeDaten<unknown>(kunde.id, n)),
  );
  const berichte = await Promise.all((await listeDaten(kunde.id, "bericht-")).sort().reverse().map((n) => ladeDaten<unknown>(kunde.id, n)));
  return { kunde, erfassung, analyse, marke, newsletter, vorlagen, strategie, inhalte, freigaben: freigaben ?? {}, buffer: buffer ?? {}, berichte, portal: `${siteUrl()}/kunde.html?k=${kunde.token}` };
}

function verschiebe(iso: string, tage: number): string {
  const [tag, rest] = iso.split("T");
  const d = new Date(`${tag}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage);
  return zuerichIso(d.toISOString().slice(0, 10), rest.slice(0, 5));
}

export default async (req: Request, _context: Context) => {
  if (!adminFromRequest(req)) return json({ error: "Passwort fehlt oder ist falsch." }, 401);
  const origin = new URL(req.url).origin;

  if (req.method === "GET") {
    const kunde = await ladeKunde(new URL(req.url).searchParams.get("id") ?? "");
    if (!kunde) return json({ error: "Kunde nicht gefunden." }, 404);
    return json(await alles(kunde));
  }
  if (req.method !== "POST") return json({ error: "Nur GET oder POST." }, 405);

  const body = await req.json().catch(() => null);
  const kunde = await ladeKunde(String(body?.id ?? ""));
  if (!kunde) return json({ error: "Kunde nicht gefunden." }, 404);

  try {
    switch (body.aktion) {
      case "neustart": {
        const ab: SchrittKey = SCHRITT_KEYS.includes(body.ab) ? body.ab : (SCHRITT_KEYS.find((k) => kunde.schritte[k].status !== "fertig") ?? "erfassung");
        await aendereKunde(kunde.id, (k) => {
          for (const key of SCHRITT_KEYS.slice(SCHRITT_KEYS.indexOf(ab))) k.schritte[key] = { status: "offen" };
          k.phase = "produktion";
        });
        if (!(await startAufgabe(origin, { aufgabe: "schritt", kundeId: kunde.id }))) return json({ error: "Der Ablauf konnte nicht gestartet werden." }, 502);
        return json({ ok: true });
      }

      case "einstellungen": {
        const neu = typeof body.startDatum === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDatum) ? body.startDatum : kunde.startDatum;
        const tage = Math.round((Date.parse(neu) - Date.parse(kunde.startDatum)) / 86_400_000);
        await aendereKunde(kunde.id, (k) => {
          if (typeof body.name === "string" && body.name.trim()) k.name = body.name.trim().slice(0, 120);
          if (typeof body.email === "string") k.email = body.email.trim().slice(0, 200);
          if (body.buffer && typeof body.buffer === "object") {
            for (const kanal of KANAELE) {
              const v = String(body.buffer[kanal] ?? "").trim();
              if (v) k.buffer[kanal] = v.slice(0, 100);
              else delete k.buffer[kanal];
            }
          }
          k.startDatum = neu;
        });
        // Termine aller Beiträge mitverschieben
        if (tage) {
          const inhalte = await ladeDaten<Inhalte>(kunde.id, "inhalte");
          if (inhalte) {
            for (const b of inhalte.beitraege) b.datum = verschiebe(b.datum, tage);
            for (const n of inhalte.newsletter) n.datum = verschiebe(n.datum, tage);
            await speichereDaten(kunde.id, "inhalte", inhalte);
          }
        }
        return json({ ok: true });
      }

      case "beitrag": {
        // Von Hand bearbeiten: Text, Hashtags, Grafiktexte. Grafiken werden neu gerendert.
        const inhalte = await ladeDaten<Inhalte>(kunde.id, "inhalte");
        const marke = await ladeDaten<Marke & { bilder: { index: number; beschreibung: string; fuerPosts: boolean }[] }>(kunde.id, "marke");
        const beitrag = inhalte?.beitraege.find((b) => b.id === body.itemId);
        if (!inhalte || !marke || !beitrag) return json({ error: "Beitrag nicht gefunden." }, 404);
        if (typeof body.text === "string") beitrag.text = body.text.slice(0, 5000);
        if (Array.isArray(body.hashtags)) beitrag.hashtags = body.hashtags.map((h: unknown) => String(h).replace(/^#/, "").trim()).filter(Boolean).slice(0, 30);
        let neuRendern = false;
        for (const feld of ["titel", "untertitel"] as const) {
          if (typeof body[feld] === "string" && body[feld] !== beitrag.grafik[feld]) {
            beitrag.grafik[feld] = body[feld].slice(0, 300);
            neuRendern = true;
          }
        }
        if (Array.isArray(body.punkte)) {
          beitrag.grafik.punkte = body.punkte.map(String).filter(Boolean).slice(0, 5);
          neuRendern = true;
        }
        if (neuRendern) {
          beitrag.medien = await rendereBeitrag(kunde, beitrag, marke);
          delete beitrag.video;
        }
        await speichereDaten(kunde.id, "inhalte", inhalte);
        return json({ ok: true, beitrag });
      }

      case "video": {
        const inhalte = await ladeDaten<Inhalte>(kunde.id, "inhalte");
        const beitrag = inhalte?.beitraege.find((b) => b.id === body.itemId);
        if (!inhalte || !beitrag || typeof body.pfad !== "string" || !body.pfad.startsWith(`/medien/${kunde.id}/`)) return json({ error: "Ungültige Angaben." }, 400);
        beitrag.video = body.pfad;
        await speichereDaten(kunde.id, "inhalte", inhalte);
        return json({ ok: true });
      }

      case "ueberarbeiten": {
        const kommentar = String(body.kommentar ?? "").trim().slice(0, 2000);
        if (!kommentar) return json({ error: "Bitte beschreiben, was geändert werden soll." }, 400);
        const freigaben = (await ladeDaten<Freigaben>(kunde.id, "freigaben")) ?? {};
        freigaben[body.itemId] = { status: "aenderung", kommentar, zeit: Date.now() };
        await speichereDaten(kunde.id, "freigaben", freigaben);
        await startAufgabe(origin, { aufgabe: "ueberarbeiten", kundeId: kunde.id, itemId: String(body.itemId) });
        return json({ ok: true });
      }

      case "senden": {
        if (kunde.phase === "produktion") return json({ error: "Die Inhalte sind noch nicht fertig erzeugt." }, 409);
        const k = await aendereKunde(kunde.id, (k) => {
          if (k.phase === "pruefung") k.phase = "freigabe";
          k.gesendet = Date.now();
        });
        await melde("freigabe_angefragt", k);
        return json({ ok: true, portal: `${siteUrl()}/kunde.html?k=${k.token}` });
      }

      case "einplanen":
        await startAufgabe(origin, { aufgabe: "einplanen", kundeId: kunde.id });
        return json({ ok: true });

      case "bericht":
        await startAufgabe(origin, { aufgabe: "bericht", kundeId: kunde.id, monat: typeof body.monat === "string" ? body.monat : undefined });
        return json({ ok: true });

      case "loeschen":
        await loescheKunde(kunde);
        return json({ ok: true });

      default:
        return json({ error: "Unbekannte Aktion." }, 400);
    }
  } catch (err) {
    return json({ error: errorMessage(err) }, 500);
  }
};

export const config: Config = {
  path: "/api/admin/kunde",
};
