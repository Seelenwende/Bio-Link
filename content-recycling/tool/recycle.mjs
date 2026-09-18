#!/usr/bin/env node
// Content Recycling: Transkript rein, Freigabedokument raus.
// Ablauf und Prompts folgen ../lieferung/checkliste.md und ../lieferung/prompts.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as api from "./lib/api.mjs";
import { transkriptLesen, kundeLesen, paketSchreiben, freigabeSchreiben } from "./lib/io.mjs";

const hier = path.dirname(fileURLToPath(import.meta.url));
const VORLAGE = path.join(hier, "..", "lieferung", "freigabe.html");

const HILFE = `Content Recycling

  node recycle.mjs folge   --kunde <name> --nummer <n> --titel "<titel>" \\
                           --datum <tt.mm.jjjj> --monat "<Monat Jahr>" \\
                           --frist "<tt.mm.jjjj>" [--posts 4] [--clips 12] <transkript>

  node recycle.mjs profil  --kunde <name> <transkript...> [--posts-datei <datei>]

  node recycle.mjs freigabe --daten <rohdaten.json>

Kunden liegen unter kunden/<name>/ mit profil.json und stimmprofil.md.
Transkripte: .txt, .vtt oder .srt. Der Schlüssel kommt aus ANTHROPIC_API_KEY.

Beispiel:
  node recycle.mjs folge --kunde beispiel --nummer 47 \\
    --titel "Warum Rückstellungen keine Rücklagen sind" \\
    --datum 18.02.2026 --monat "März 2026" --frist "27.02.2026" folge47.vtt
`;

/* ── Argumente ─────────────────────────────────────────────────────── */

function argumente(roh) {
  const opt = {};
  const frei = [];
  for (let i = 0; i < roh.length; i++) {
    const a = roh[i];
    if (a.startsWith("--")) {
      const schlüssel = a.slice(2);
      const wert = roh[i + 1];
      if (wert === undefined || wert.startsWith("--")) opt[schlüssel] = true;
      else {
        opt[schlüssel] = wert;
        i++;
      }
    } else frei.push(a);
  }
  return { opt, frei };
}

function pflicht(opt, felder) {
  const fehlend = felder.filter((f) => !opt[f] || opt[f] === true);
  if (fehlend.length) {
    throw new Error(`Fehlende Angaben: ${fehlend.map((f) => "--" + f).join(", ")}`);
  }
}

/* ── Nebenläufigkeit mit Obergrenze ────────────────────────────────── */

async function nacheinanderDreifach(elemente, arbeit) {
  const ergebnisse = new Array(elemente.length);
  let index = 0;
  const arbeiter = Array.from({ length: Math.min(3, elemente.length) }, async () => {
    while (index < elemente.length) {
      const eigen = index++;
      ergebnisse[eigen] = await arbeit(elemente[eigen], eigen);
    }
  });
  await Promise.all(arbeiter);
  return ergebnisse;
}

/* ── Befehl: folge ─────────────────────────────────────────────────── */

async function befehlFolge(opt, frei) {
  pflicht(opt, ["kunde", "nummer", "titel", "datum", "monat", "frist"]);
  if (!frei.length) throw new Error("Kein Transkript angegeben.");

  const kundenpfad = path.join(hier, "kunden", opt.kunde);
  const { profil, stimmprofil } = kundeLesen(kundenpfad);
  const transkript = transkriptLesen(frei[0]);

  const folge = {
    nummer: Number(opt.nummer),
    titel: opt.titel,
    datum: opt.datum,
    monat: opt.monat,
    frist: opt.frist,
  };
  const anzahlPosts = Number(opt.posts ?? profil.postsProFolge ?? 4);
  const anzahlClips = Number(opt.clips ?? 12);

  const anthropic = api.client();
  const verbrauch = api.verbrauchNeu();
  const system = api.prefix({ stimmprofil, transkript, tabu: profil.tabu });

  const zeichen = transkript.length;
  console.log(`Transkript: ${zeichen.toLocaleString("de-CH")} Zeichen`);
  console.log(`Modell: ${api.MODELL}\n`);

  // Der erste Aufruf legt den Cache an; alle folgenden lesen daraus.
  console.log("1/5  Kernaussagen suchen …");
  const alle = await api.kernaussagen({ anthropic, system, verbrauch });
  const aussagen = alle.filter((a) => a.eignung !== "niedrig");
  console.log(
    `     ${alle.length} gefunden, ${aussagen.length} brauchbar, ${Math.min(
      anzahlPosts,
      aussagen.length
    )} werden zu Posts`
  );
  const gewählt = aussagen.slice(0, anzahlPosts);
  if (!gewählt.length) throw new Error("Keine brauchbare Aussage gefunden. Transkript prüfen.");

  console.log("2/5  Posts schreiben …");
  const postpakete = await nacheinanderDreifach(gewählt, async (aussage, i) => {
    const fassungen = await api.posts({
      anthropic,
      system,
      verbrauch,
      aussage,
      kanaele: profil.kanaele,
    });
    return { index: i, these: aussage.these, timecode: aussage.timecode, aussage, fassungen };
  });

  console.log("3/5  Newsletter und Clips …");
  const [brief, clipliste] = await Promise.all([
    api.newsletter({ anthropic, system, verbrauch, beste: gewählt.slice(0, 3), folge }),
    api.clips({ anthropic, system, verbrauch, anzahl: anzahlClips }),
  ]);

  console.log("4/5  Redaktionsprüfung …");
  const zuPrüfen = postpakete.flatMap((p) =>
    p.fassungen.map((f) => ({ paket: p, fassung: f }))
  );
  const prüfungen = await nacheinanderDreifach(zuPrüfen, ({ paket, fassung }) =>
    api.pruefung({ anthropic, system, verbrauch, fassung, aussage: paket.aussage })
  );
  // Pro Aussage die Einwände aller Kanalfassungen zusammenlegen.
  prüfungen.forEach((p, i) => {
    const paket = zuPrüfen[i].paket;
    paket.pruefung = paket.pruefung ?? { fakten: [], stimme: [], floskeln: [], ersteZeile: [], risiko: [] };
    for (const feld of Object.keys(paket.pruefung)) {
      paket.pruefung[feld].push(...(p[feld] ?? []));
    }
  });

  console.log("5/5  Dateien schreiben …");
  const daten = { aussagen: alle, posts: postpakete, newsletter: brief, clips: clipliste };
  const ziel = path.join(hier, "ausgabe", `${opt.kunde}-${folge.nummer}`);
  fs.mkdirSync(ziel, { recursive: true });

  fs.writeFileSync(
    path.join(ziel, "rohdaten.json"),
    JSON.stringify({ profil, folge, daten }, null, 2),
    "utf8"
  );
  paketSchreiben(path.join(ziel, "paket.md"), daten, folge, profil);
  freigabeSchreiben(path.join(ziel, "freigabe.html"), VORLAGE, daten, folge, profil);

  const risiken = postpakete.flatMap((p) => p.pruefung?.risiko ?? []);
  console.log(`\nFertig: ${path.relative(process.cwd(), ziel)}/`);
  console.log(`  paket.md       für deinen Redaktionsdurchgang`);
  console.log(`  freigabe.html  für den Kunden, nach der Redaktion`);
  console.log(`  rohdaten.json  zum Neubauen ohne weitere API-Aufrufe`);
  if (risiken.length) {
    console.log(`\n  Achtung — ${risiken.length} Risikohinweis(e) in paket.md, vor Versand lesen.`);
  }
  bilanz(verbrauch);
  console.log(
    `\nNoch offen: Veröffentlichungsdaten in freigabe.html eintragen (Feld "datum"),\n` +
      `[LINK ZUR FOLGE] im Newsletter ersetzen, dann Redaktionsdurchgang.`
  );
}

/* ── Befehl: profil ────────────────────────────────────────────────── */

async function befehlProfil(opt, frei) {
  pflicht(opt, ["kunde"]);
  if (frei.length < 2) {
    throw new Error("Mindestens zwei Transkripte angeben, besser drei.");
  }
  const kundenpfad = path.join(hier, "kunden", opt.kunde);
  fs.mkdirSync(kundenpfad, { recursive: true });

  const transkripte = frei
    .map((d, i) => `--- Folge ${i + 1} (${path.basename(d)}) ---\n${transkriptLesen(d)}`)
    .join("\n\n");
  const beispielposts = opt["posts-datei"] ? fs.readFileSync(opt["posts-datei"], "utf8") : "";

  const anthropic = api.client();
  const verbrauch = api.verbrauchNeu();
  console.log(`Analysiere ${frei.length} Transkripte …`);
  const profiltext = await api.stimmprofil({ anthropic, verbrauch, transkripte, beispielposts });

  const ziel = path.join(kundenpfad, "stimmprofil.md");
  fs.writeFileSync(ziel, `# Stimmprofil · ${opt.kunde}\n\n${profiltext}\n`, "utf8");
  console.log(`\nGeschrieben: ${path.relative(process.cwd(), ziel)}`);
  bilanz(verbrauch);
  console.log(
    `\nJetzt der wichtigste Schritt: Schick das Profil dem Kunden mit der Frage\n` +
      `„Steht hier etwas, das du so nie sagen würdest?" Eine Korrektur hier spart zehn später.`
  );
}

/* ── Befehl: freigabe (ohne API) ───────────────────────────────────── */

function befehlFreigabe(opt) {
  pflicht(opt, ["daten"]);
  const { profil, folge, daten } = JSON.parse(fs.readFileSync(opt.daten, "utf8"));
  const ziel = path.join(path.dirname(opt.daten), "freigabe.html");
  freigabeSchreiben(ziel, VORLAGE, daten, folge, profil);
  console.log(`Neu gebaut: ${path.relative(process.cwd(), ziel)}`);
}

/* ── Bilanz ────────────────────────────────────────────────────────── */

function bilanz(v) {
  const usd = api.kosten(v);
  console.log(
    `\n${v.aufrufe} Aufrufe · ${v.eingabe.toLocaleString("de-CH")} Eingabe-Token, ` +
      `${v.ausgabe.toLocaleString("de-CH")} Ausgabe-Token`
  );
  console.log(
    `Cache: ${v.cacheSchreiben.toLocaleString("de-CH")} geschrieben, ` +
      `${v.cacheLesen.toLocaleString("de-CH")} gelesen`
  );
  console.log(`Geschätzte Kosten: ca. USD ${usd.toFixed(2)}`);
}

/* ── Einstieg ──────────────────────────────────────────────────────── */

const [befehl, ...rest] = process.argv.slice(2);
const { opt, frei } = argumente(rest);

try {
  if (!befehl || befehl === "hilfe" || opt.hilfe || opt.help) {
    console.log(HILFE);
  } else if (befehl === "folge") {
    await befehlFolge(opt, frei);
  } else if (befehl === "profil") {
    await befehlProfil(opt, frei);
  } else if (befehl === "freigabe") {
    befehlFreigabe(opt);
  } else {
    console.error(`Unbekannter Befehl: ${befehl}\n`);
    console.log(HILFE);
    process.exit(1);
  }
} catch (fehler) {
  console.error(`\nAbbruch: ${api.fehlerText(fehler)}`);
  process.exit(1);
}
