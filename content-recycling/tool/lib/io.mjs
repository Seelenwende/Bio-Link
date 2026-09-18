// Transkripte einlesen und Ergebnisse schreiben.
import fs from "node:fs";
import path from "node:path";

/**
 * Liest .txt, .vtt oder .srt und gibt Text mit Zeitmarken am Zeilenanfang zurück.
 * Die Zeitmarken bleiben erhalten, weil das Modell sie für Timecodes und
 * Quellenangaben braucht — ohne sie kann es Belege nicht verorten.
 */
export function transkriptLesen(datei) {
  const roh = fs.readFileSync(datei, "utf8");
  const endung = path.extname(datei).toLowerCase();
  if (endung !== ".vtt" && endung !== ".srt") return roh.trim();

  const zeilen = roh.split(/\r?\n/);
  const zeit = /(\d{1,2}:\d{2}:\d{2})[.,]\d{3}\s*-->\s*(\d{1,2}:\d{2}:\d{2})/;
  const blöcke = [];
  let start = null;
  let text = [];

  const abschliessen = () => {
    const inhalt = text.join(" ").replace(/\s+/g, " ").trim();
    if (start && inhalt) blöcke.push(`[${kurz(start)}] ${inhalt}`);
    start = null;
    text = [];
  };

  for (const zeile of zeilen) {
    const treffer = zeile.match(zeit);
    if (treffer) {
      abschliessen();
      start = treffer[1];
    } else if (/^\s*$/.test(zeile)) {
      abschliessen();
    } else if (!/^(WEBVTT|NOTE|\d+)\s*$/.test(zeile)) {
      text.push(zeile.replace(/<[^>]+>/g, ""));
    }
  }
  abschliessen();

  // Aufeinanderfolgende Duplikate entfernen — YouTube-Autountertitel
  // wiederholen jede Zeile im nächsten Block.
  const sauber = [];
  for (const b of blöcke) {
    const vorher = sauber[sauber.length - 1];
    if (!vorher || !b.endsWith(vorher.replace(/^\[[^\]]+\]\s*/, ""))) sauber.push(b);
    else sauber[sauber.length - 1] = b;
  }
  return sauber.join("\n");
}

// 00:12:40 -> 12:40, aber 01:05:10 bleibt vollständig
function kurz(t) {
  return t.startsWith("00:") ? t.slice(3) : t;
}

export function kundeLesen(verzeichnis) {
  const profil = JSON.parse(fs.readFileSync(path.join(verzeichnis, "profil.json"), "utf8"));
  const stimmprofilPfad = path.join(verzeichnis, "stimmprofil.md");
  if (!fs.existsSync(stimmprofilPfad)) {
    throw new Error(
      `Kein stimmprofil.md in ${verzeichnis}. Erst mit "node recycle.mjs profil" erzeugen — ` +
        `ohne Stimmprofil klingen die Texte nach Werkzeug.`
    );
  }
  return { profil, stimmprofil: fs.readFileSync(stimmprofilPfad, "utf8").trim() };
}

/** Schreibt paket.md für den eigenen Redaktionsdurchgang. */
export function paketSchreiben(ziel, daten, folge, profil) {
  const z = [];
  z.push(`# ${profil.kunde} · Folge ${folge.nummer}: ${folge.titel}`);
  z.push(`\nErschienen ${folge.datum}. Erzeugt ${new Date().toLocaleDateString("de-CH")}.`);
  z.push(`\n> Nichts hiervon geht ungeprüft an den Kunden. Erst der Redaktionsdurchgang,`);
  z.push(`> dann das Freigabedokument. Die Faktenliste unten ist Hinweis, nicht Beweis —`);
  z.push(`> jede Zahl selbst gegen das Transkript prüfen.`);

  z.push(`\n## Kernaussagen\n`);
  z.push(`| # | These | Timecode | Eignung | Widerspruch |`);
  z.push(`|---|---|---|---|---|`);
  daten.aussagen.forEach((a, i) => {
    z.push(
      `| ${i + 1} | ${zelle(a.these)} | ${a.timecode} | ${a.eignung} | ${zelle(a.widerspruch) || "—"} |`
    );
  });

  z.push(`\n## Posts\n`);
  for (const p of daten.posts) {
    z.push(`### These ${p.index + 1} · ${p.these}\n`);
    z.push(`Quelle: ${p.timecode}\n`);
    for (const f of p.fassungen) {
      z.push(`**${f.kanal}**\n`);
      z.push("```");
      z.push(f.text);
      z.push("```");
      if (f.hashtags?.length) z.push(`Hashtags: ${f.hashtags.join(" ")}\n`);
    }
    if (p.pruefung) {
      z.push(`<details><summary>Redaktionsprüfung</summary>\n`);
      z.push(pruefungText(p.pruefung));
      z.push(`\n</details>\n`);
    }
  }

  z.push(`\n## Newsletter\n`);
  z.push(`Betreffzeilen zur Auswahl:\n`);
  daten.newsletter.betreff.forEach((b) => z.push(`- ${b} (${b.length} Zeichen)`));
  z.push(`\nVorschautext: ${daten.newsletter.vorschau}\n`);
  z.push("```");
  z.push(daten.newsletter.text);
  z.push("```");

  z.push(`\n## Clip-Timecodes\n`);
  for (const c of daten.clips) {
    z.push(`- **${c.timecode}** · „${c.ersteWorte}"`);
    z.push(`  - Titel: ${c.titel}`);
    z.push(`  - Trägt weil: ${c.warum}`);
    if (c.schnitt) z.push(`  - Schnitt: ${c.schnitt}`);
  }

  z.push(`\n---\n`);
  z.push(`## Checkliste vor dem Versand\n`);
  z.push(`- [ ] Jede Floskel gestrichen, die in jedem zweiten Post steht`);
  z.push(`- [ ] Erste Zeile jedes Posts laut gelesen`);
  z.push(`- [ ] Jede Zahl und jeden Namen gegen das Transkript geprüft`);
  z.push(`- [ ] Höchstens ein zugespitzter Post in dieser Folge`);
  z.push(`- [ ] Tabu-Liste des Kunden durchgegangen`);
  z.push(`- [ ] Stimmprofil um neue Korrekturen ergänzt`);

  fs.writeFileSync(ziel, z.join("\n") + "\n", "utf8");
}

function zelle(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function pruefungText(p) {
  const t = [];
  const block = (titel, werte) => {
    if (!werte?.length) return;
    t.push(`\n*${titel}*`);
    werte.forEach((w) => t.push(`- ${w}`));
  };
  block("Fakten", p.fakten);
  block("Stimme", p.stimme);
  block("Floskeln", p.floskeln);
  block("Erste Zeile", p.ersteZeile);
  block("Risiko", p.risiko);
  return t.length ? t.join("\n") : "\nKeine Einwände.";
}

/**
 * Baut das Freigabedokument, indem der Datenblock der Vorlage ersetzt wird.
 * Layout und Logik der Vorlage bleiben unberührt.
 */
export function freigabeSchreiben(ziel, vorlagePfad, daten, folge, profil) {
  const vorlage = fs.readFileSync(vorlagePfad, "utf8");
  const anfang = vorlage.indexOf("// <<<DATEN-ANFANG>>>");
  const ende = vorlage.indexOf("// <<<DATEN-ENDE>>>");
  if (anfang === -1 || ende === -1) {
    throw new Error(`Marken DATEN-ANFANG/DATEN-ENDE fehlen in ${vorlagePfad}`);
  }

  const items = [];
  for (const p of daten.posts) {
    for (const f of p.fassungen) {
      items.push({
        id: `f${folge.nummer}-t${p.index + 1}-${f.kanal.toLowerCase()}`,
        typ: "post",
        kanal: f.kanal,
        datum: "",
        quelle: `Minute ${p.timecode}`,
        text: f.hashtags?.length ? `${f.text}\n\n${f.hashtags.join(" ")}` : f.text,
      });
    }
  }
  items.push({
    id: `f${folge.nummer}-nl`,
    typ: "newsletter",
    kanal: "Newsletter",
    datum: "",
    quelle: `Folge ${folge.nummer}`,
    betreff: daten.newsletter.betreff,
    vorschau: daten.newsletter.vorschau,
    text: daten.newsletter.text,
  });
  items.push({
    id: `f${folge.nummer}-clips`,
    typ: "clips",
    kanal: "Clips",
    datum: "nach Freigabe",
    quelle: `Folge ${folge.nummer}`,
    hinweis: "Bitte ankreuzen, welche geschnitten werden sollen.",
    clips: daten.clips.map((c) => ({ tc: c.timecode, erste: c.ersteWorte, titel: c.titel })),
  });

  const block = [
    "// <<<DATEN-ANFANG>>>",
    "",
    `// Erzeugt von tool/recycle.mjs am ${new Date().toISOString().slice(0, 10)}.`,
    "// Veröffentlichungsdaten in FOLGEN[].items[].datum noch eintragen.",
    "",
    `const KUNDE    = ${JSON.stringify(profil.kunde)};`,
    `const MONAT    = ${JSON.stringify(folge.monat)};`,
    `const FRIST    = ${JSON.stringify(folge.frist)};`,
    `const ABSENDER = ${JSON.stringify(profil.absender)};`,
    `const MAIL_AN  = ${JSON.stringify(profil.mailAn)};`,
    "",
    `const FOLGEN = ${JSON.stringify(
      [
        {
          titel: folge.titel,
          nummer: folge.nummer,
          erschienen: folge.datum,
          items,
        },
      ],
      null,
      2
    )};`,
    "",
  ].join("\n");

  fs.writeFileSync(ziel, vorlage.slice(0, anfang) + block + vorlage.slice(ende), "utf8");
}
