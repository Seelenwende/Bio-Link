import { z } from "zod";
import { bildBlock, frage, schreibe, type Inhalt } from "./ki.mts";
import { erfasse, type Erfassung } from "./erfassung.mts";
import { beitragsGrafiken, ladeSchriften, svgZuPng, vorlage, type Bausteine } from "./grafik.mts";
import { ladeMediumPfad, speichereMedium } from "./medien.mts";
import type { NewsletterKonzept } from "./newsletter.mts";
import {
  KANAELE,
  KANAL_NAME,
  ladeDaten,
  speichereDaten,
  speichereText,
  type Beitrag,
  type Inhalte,
  type Kanal,
  type Kunde,
  type Marke,
  type NewsletterAusgabe,
  type SchrittKey,
} from "./kunden.mts";

/* Jeder Schritt liest, was die vorherigen gespeichert haben, und legt sein Ergebnis unter
   daten/<kundeId>/<schritt> ab. Rückgabe: angefallene KI-Kosten in USD. */

const GRUNDHALTUNG = `Du arbeitest für DigitalSeed, einen Dienstleister für Digital Marketing, Markenführung und Social-Media-Strategie für kleine und mittlere Unternehmen. DigitalSeed bietet faire Preise als Alternative zu teuren Agenturen.
Grundregeln:
- Erfinde keine Fakten über das Unternehmen (keine Preise, Auszeichnungen, Zahlen, Kundennamen, Öffnungszeiten), die nicht in den Daten stehen. Fehlt etwas, schreib einen Platzhalter in eckigen Klammern, z. B. [Öffnungszeiten].
- Sei konkret und beziehe dich auf das, was du wirklich siehst. Keine Floskeln.
- Interne Texte für DigitalSeed schreibst du auf Deutsch (Schweizer Rechtschreibung mit „ss“ statt „ß“).`;

/* ---------- Kontext aus der Erfassung ---------- */

function kontext(e: Erfassung, umfang: "voll" | "kurz" = "voll"): string {
  const budget = umfang === "voll" ? 28000 : 9000;
  let rest = budget;
  const seiten = e.seiten
    .map((s) => {
      const text = s.text.slice(0, Math.max(0, Math.min(rest, umfang === "voll" ? 6000 : 2500)));
      rest -= text.length;
      return `<seite url="${s.url}">\nTitel: ${s.titel}\nBeschreibung: ${s.beschreibung}\nÜberschriften: ${s.ueberschriften.join(" | ")}\n${text}\n</seite>`;
    })
    .join("\n");
  const social = e.social.length
    ? e.social
        .map(
          (s) =>
            `<profil kanal="${KANAL_NAME[s.kanal]}" url="${s.url}" gefunden="${s.gefunden}" lesbar="${s.lesbar}">\n${s.titel ?? ""}\n${s.beschreibung ?? ""}\n${s.kennzahlen ? `Kennzahlen: ${JSON.stringify(s.kennzahlen)}` : ""}\n${(s.letzteBeitraege ?? []).map((b) => `- ${b.datum} ${b.format}, ${b.likes ?? "?"} Likes, ${b.kommentare ?? "?"} Kommentare: ${b.text.slice(0, 200)}`).join("\n")}\n${s.hinweis ?? ""}\n</profil>`,
        )
        .join("\n")
    : "Keine Social-Media-Profile angegeben und keine auf der Website verlinkt.";
  return `<website start="${e.startUrl}" final="${e.endUrl}" sprache="${e.sprache}">
${seiten}
</website>

<technik>
${JSON.stringify(e.technik, null, 1)}
</technik>

<pagespeed_mobil>
${e.pagespeed ? `Leistung ${e.pagespeed.performance}, SEO ${e.pagespeed.seo}, Barrierefreiheit ${e.pagespeed.barrierefreiheit}, Best Practices ${e.pagespeed.bestPractices} (je von 100)` : "nicht verfügbar"}
</pagespeed_mobil>

<social_media>
${social}
</social_media>`;
}

async function bildAusPfad(pfad: string | null | undefined): Promise<Inhalt[number] | null> {
  if (!pfad) return null;
  const m = await ladeMediumPfad(pfad);
  return m ? bildBlock(m.data, m.contentType) : null;
}

function screenshotBlock(e: Erfassung): Inhalt[number] | null {
  const shot = e.pagespeed?.screenshot;
  const m = shot?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  return m ? { type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] } } : null;
}

async function lade<T>(id: string, name: string): Promise<T> {
  const daten = await ladeDaten<T>(id, name);
  if (!daten) throw new Error(`Ergebnis „${name}“ fehlt. Bitte den Ablauf ab diesem Schritt neu starten.`);
  return daten;
}

/* ---------- 1 · Erfassung ---------- */

async function schrittErfassung(kunde: Kunde): Promise<number> {
  const erfassung = await erfasse(kunde);
  await speichereDaten(kunde.id, "erfassung", erfassung);
  return 0;
}

/* ---------- 2 · Analyse ---------- */

export const BEREICHE = ["Design und Modernität", "Mobile und Technik", "Inhalte und Botschaft", "Auffindbarkeit (SEO)", "Vertrauen und Kundengewinnung", "Social Media", "Markenauftritt"] as const;

const AnalyseSchema = z.object({
  gesamtnote: z.number().describe("0–100"),
  fazit: z.string().describe("2–3 Sätze, ehrlich und wertschätzend, an das Unternehmen gerichtet"),
  staerken: z.array(z.string()).describe("2–4 echte Stärken"),
  bereiche: z.array(
    z.object({
      bereich: z.string().describe("Genau einer der vorgegebenen Bereiche"),
      note: z.number().describe("0–100"),
      befund: z.string().describe("Was du konkret siehst, mit Belegen aus den Daten"),
      empfehlungen: z.array(z.string()).describe("2–4 konkrete Massnahmen"),
    }),
  ),
  social: z.array(
    z.object({
      kanal: z.enum(["Instagram", "Facebook", "LinkedIn"]),
      status: z.enum(["aktiv", "vorhanden, wenig genutzt", "nicht vorhanden", "nicht prüfbar"]),
      befund: z.string(),
      potenzial: z.string().describe("Was dieser Kanal für genau dieses Unternehmen bringen kann"),
    }),
  ),
  potenziale: z.array(
    z.object({
      titel: z.string(),
      beschreibung: z.string(),
      wirkung: z.enum(["hoch", "mittel", "niedrig"]),
      aufwand: z.enum(["klein", "mittel", "gross"]),
    }),
  ).describe("Die 5–8 wichtigsten Optimierungspotenziale, nach Wirkung sortiert"),
  quickWins: z.array(z.string()).describe("3–5 Dinge, die sofort und ohne Budget umsetzbar sind"),
  empfehlung: z.object({
    angebot: z.enum(["Neue Website", "Social-Media-Betreuung", "Neue Website und Social-Media-Betreuung", "Optimierung der bestehenden Website und Social Media"]),
    begruendung: z.string(),
  }),
  intern: z.object({
    gespraechseinstieg: z.string().describe("Ein Satz, mit dem DigitalSeed das Erstgespräch eröffnen kann"),
    argumente: z.array(z.string()).describe("3–5 Verkaufsargumente, nur für DigitalSeed"),
    einwaende: z.array(z.object({ einwand: z.string(), antwort: z.string() })).describe("2–3 wahrscheinliche Einwände mit Antwort"),
  }),
});
export type Analyse = z.infer<typeof AnalyseSchema>;

async function schrittAnalyse(kunde: Kunde): Promise<number> {
  const e = await lade<Erfassung>(kunde.id, "erfassung");
  const inhalt: Inhalt = [];
  const shot = screenshotBlock(e);
  if (shot) inhalt.push({ type: "text", text: "Screenshot der Startseite auf dem Handy:" }, shot);
  for (const [i, b] of e.bilder.slice(0, 3).entries()) {
    const block = await bildAusPfad(b.pfad);
    if (block) inhalt.push({ type: "text", text: `Bild ${i + 1} von der Website:` }, block);
  }
  const logo = await bildAusPfad(e.logos[0]?.vorschau ?? e.logos[0]?.pfad);
  if (logo) inhalt.push({ type: "text", text: "Wahrscheinliches Logo:" }, logo);
  inhalt.push({ type: "text", text: `Analysiere die komplette Online-Präsenz von „${kunde.name}“.\n\n${kontext(e)}` });

  const { daten, kostenUsd } = await frage({
    schema: AnalyseSchema,
    effort: "high",
    system: `${GRUNDHALTUNG}

Du bist Senior-Beraterin für Digital Marketing und Markenführung. Du bewertest die Online-Präsenz eines Unternehmens und zeigst Optimierungspotenziale auf. Das Ergebnis bekommt das Unternehmen als Analyse-Bericht (ausser dem Feld „intern“). Es soll überzeugen, ohne schlechtzumachen: klar, konkret, respektvoll, Anrede „Sie“.

Bewerte genau diese Bereiche, jeden genau einmal und in dieser Reihenfolge: ${BEREICHE.join(", ")}.
- Nutze die technischen Daten und PageSpeed-Werte als Belege (z. B. fehlende Meta-Beschreibung, Bilder ohne Alt-Text, veraltetes Copyright, langsame Ladezeit).
- „Design und Modernität“ beurteilst du anhand von Screenshot, Bildern, Schriften und Struktur. Ohne Screenshot sag ehrlich, worauf dein Urteil beruht.
- Social Media: Bewerte Instagram, Facebook und LinkedIn je einmal. Ist ein Profil nicht lesbar, ist der Status „nicht prüfbar“, ausser es fehlt ganz. Ein fehlendes Profil ist eine Chance, kein Vorwurf.
- Noten: 90+ hervorragend, 70–89 gut, 50–69 ausbaufähig, unter 50 deutlicher Handlungsbedarf. Die Gesamtnote gewichtet, was am meisten Kundschaft kostet.
- Die Empfehlung wählt das DigitalSeed-Angebot, das am meisten bewirkt.`,
    inhalt,
  });
  await speichereDaten(kunde.id, "analyse", daten);
  return kostenUsd;
}

/* ---------- 3 · Marke ---------- */

const MarkeSchema = z.object({
  name: z.string().describe("Firmenname, wie er auf der Website verwendet wird"),
  claim: z.string().describe("Vorhandener Slogan oder ein kurzer, passender Vorschlag"),
  branche: z.string(),
  zielgruppe: z.string().describe("Wer die Kundschaft ist, 1–2 Sätze"),
  logoIndex: z.number().describe("Index des echten Logos unter den Kandidaten, -1 wenn keines passt"),
  logoAufDunkel: z.boolean().describe("true, wenn das Logo hell ist und auf dunklem Grund stehen muss"),
  farben: z.object({
    primaer: z.string().describe("Hex, Hauptfarbe der Marke"),
    sekundaer: z.string().describe("Hex, zweite Markenfarbe, sichtbar anders als primaer"),
    akzent: z.string().describe("Hex, für Buttons und Hervorhebungen"),
    hell: z.string().describe("Hex, heller Hintergrund, leicht getönt passend zur Marke"),
    dunkel: z.string().describe("Hex, dunkle Textfarbe, gut lesbar auf hell"),
  }),
  farbBegruendung: z.string().describe("Woher die Farben stammen (Logo, CSS, Website)"),
  schriften: z.object({
    titel: z.string().describe("Google-Fonts-Familie für Überschriften, möglichst die der Website oder die ähnlichste"),
    text: z.string().describe("Google-Fonts-Familie für Fliesstext"),
  }),
  stimme: z.object({
    zusammenfassung: z.string().describe("Stimmprofil in 3–4 Sätzen"),
    anrede: z.enum(["du", "Sie"]),
    sprache: z.string().describe("Sprachcode des Kunden, z. B. de-CH, de-DE, de-AT, fr-CH, en"),
    tonalitaet: z.array(z.string()).describe("4–6 Adjektive"),
    typischeWoerter: z.array(z.string()).describe("Wörter und Wendungen, die zur Marke gehören"),
    vermeiden: z.array(z.string()).describe("Was nicht zur Marke passt"),
    beispielsaetze: z.array(z.string()).describe("3 Beispielsätze in dieser Stimme"),
  }),
  fusszeile: z.string().describe("Kurze Domain für Grafiken, z. B. beispiel.ch"),
  bilder: z.array(z.object({ index: z.number(), beschreibung: z.string(), fuerPosts: z.boolean().describe("true, wenn sich das Bild als Hintergrund eines Social-Posts eignet") })),
});

const istHex = (h: string) => /^#[0-9a-f]{6}$/i.test(h);

async function schrittMarke(kunde: Kunde): Promise<number> {
  const e = await lade<Erfassung>(kunde.id, "erfassung");
  const inhalt: Inhalt = [];
  for (const [i, l] of e.logos.entries()) {
    const block = await bildAusPfad(l.vorschau ?? l.pfad);
    if (block) inhalt.push({ type: "text", text: `Logo-Kandidat ${i} (${l.quelle}, ${l.contentType}):` }, block);
  }
  for (const [i, b] of e.bilder.entries()) {
    const block = await bildAusPfad(b.pfad);
    if (block) inhalt.push({ type: "text", text: `Website-Bild ${i} (Alt-Text: ${b.alt || "keiner"}):` }, block);
  }
  const shot = screenshotBlock(e);
  if (shot) inhalt.push({ type: "text", text: "Screenshot der Startseite:" }, shot);
  inhalt.push({
    type: "text",
    text: `Leite das Markenprofil von „${kunde.name}“ ab.

<farben_aus_css hinweis="nach Häufigkeit; markiert = als Marken-/Theme-Farbe benannt">
${e.farben.map((f) => `${f.hex} ×${f.anzahl}${f.markiert ? " (markiert)" : ""}`).join("\n")}
</farben_aus_css>

<schriften_der_website>
${e.schriften.join(", ") || "keine erkannt"}
</schriften_der_website>

${kontext(e, "kurz")}`,
  });

  const { daten, kostenUsd } = await frage({
    schema: MarkeSchema,
    effort: "medium",
    system: `${GRUNDHALTUNG}

Du bist Markenstrategin. Du exportierst das Corporate Design und das Stimmprofil eines Unternehmens aus seiner Website, damit Website-Demo, Newsletter und Social-Media-Grafiken genau nach dieser Marke aussehen und klingen.
- Farben: Nimm die echten Markenfarben (Logo und markierte CSS-Farben zuerst, reine Grautöne und Standard-Linkblau nur, wenn die Marke wirklich so aussieht). „hell“ und „dunkel“ müssen zusammen gut lesbar sein (Kontrast mindestens 7:1).
- Schriften: Nur Familien, die es auf Google Fonts gibt, exakt geschrieben (z. B. „Playfair Display“, „Inter“).
- Stimmprofil: aus den echten Texten ableiten. Anrede und Sprache so, wie das Unternehmen seine Kundschaft anspricht.
- Bilder: beschreibe jedes Website-Bild in einem Satz (Index wie angegeben).`,
    inhalt,
  });

  const logo = daten.logoIndex >= 0 ? e.logos[daten.logoIndex] : undefined;
  const fallback = { primaer: "#1f3a5f", sekundaer: "#d9e4f0", akzent: "#e07a2f", hell: "#f7f8fa", dunkel: "#14202e" };
  const farben = Object.fromEntries(Object.entries(daten.farben).map(([k, v]) => [k, istHex(v) ? v.toLowerCase() : fallback[k as keyof typeof fallback]])) as Marke["farben"];
  const marke: Marke & { bilder: typeof daten.bilder } = {
    name: daten.name,
    claim: daten.claim,
    branche: daten.branche,
    zielgruppe: daten.zielgruppe,
    logo: { pfad: logo?.pfad ?? null, vorschau: logo?.vorschau ?? null, aufDunkel: daten.logoAufDunkel },
    farben,
    farbBegruendung: daten.farbBegruendung,
    schriften: daten.schriften,
    stimme: daten.stimme,
    fusszeile: daten.fusszeile,
    bilder: daten.bilder,
  };
  await speichereDaten(kunde.id, "marke", marke);
  return kostenUsd;
}

type MarkeMitBildern = Marke & { bilder: { index: number; beschreibung: string; fuerPosts: boolean }[] };

function markeText(m: Marke): string {
  return `<marke>
Name: ${m.name} · Claim: ${m.claim} · Branche: ${m.branche}
Zielgruppe: ${m.zielgruppe}
Farben: ${JSON.stringify(m.farben)}
Schriften: Titel „${m.schriften.titel}“, Text „${m.schriften.text}“
Stimme: ${m.stimme.zusammenfassung}
Anrede: ${m.stimme.anrede} · Sprache: ${m.stimme.sprache} · Tonalität: ${m.stimme.tonalitaet.join(", ")}
Typische Wörter: ${m.stimme.typischeWoerter.join(", ")}
Vermeiden: ${m.stimme.vermeiden.join(", ")}
Beispielsätze: ${m.stimme.beispielsaetze.join(" / ")}
</marke>`;
}

/* ---------- 4 · Website-Demo ---------- */

async function schrittWebsite(kunde: Kunde): Promise<number> {
  const e = await lade<Erfassung>(kunde.id, "erfassung");
  const marke = await lade<MarkeMitBildern>(kunde.id, "marke");
  const analyse = await lade<Analyse>(kunde.id, "analyse");
  const bilder = e.bilder.map((b, i) => `${b.pfad} – ${marke.bilder.find((x) => x.index === i)?.beschreibung ?? b.alt}`).join("\n");
  const logo = marke.logo.pfad ? `${marke.logo.pfad} (${marke.logo.aufDunkel ? "helles Logo, braucht dunklen Grund" : "für hellen Grund"})` : "kein Logo vorhanden – Firmenname als Schriftzug";

  const { daten, kostenUsd } = await schreibe({
    effort: "medium",
    maxTokens: 64000,
    system: `${GRUNDHALTUNG}

Du bist Webdesignerin und Frontend-Entwicklerin. Du baust eine Demo der neuen Website als Vorschlag für den Kunden: modern, dynamisch, hochwertig, in seiner Marke und mit seinen echten Inhalten. Sie soll zeigen, wie viel besser seine Website wirken kann.

Technik
- Genau eine vollständige HTML-Datei: beginnt mit <!doctype html>, CSS im <style>, JavaScript im <script>. Keine Erklärungen, keine Markdown-Codeblöcke.
- Keine externen Skripte oder Frameworks. Google Fonts per <link> sind erlaubt.
- Farben als CSS-Variablen aus der Marke, Schriften aus der Marke.
- Responsive (Mobile zuerst), semantisches HTML, gute Kontraste, Alt-Texte, sinnvolle Meta-Angaben.
- Dynamik: Einblenden beim Scrollen (IntersectionObserver), weicher Header beim Scrollen, Hover-Effekte, ein mobiles Menü. Respektiere prefers-reduced-motion.
- Bilder und Logo nur mit den angegebenen relativen Pfaden (/medien/…). Wo ein Bild fehlt, nutze Farbflächen, Verläufe oder grafische Formen statt Stockfotos.
- Ganz oben ein schmales Band: „Entwurf von DigitalSeed – Vorschau Ihrer neuen Website“.

Inhalt
- Struktur aus den echten Inhalten ableiten: starke Hero-Sektion mit klarem Nutzenversprechen und Handlungsaufforderung, Leistungen/Angebot, Über uns, Vertrauen (Werte, Ablauf, Stimmen nur falls vorhanden), Kontakt mit echten Kontaktdaten, Footer.
- Texte im Stimmprofil und in der Sprache des Kunden, besser geschrieben als bisher, aber ohne erfundene Fakten. Platzhalter in eckigen Klammern, wo Angaben fehlen.
- Setze die wichtigsten Empfehlungen aus der Analyse sichtbar um.`,
    inhalt: [
      {
        type: "text",
        text: `Baue die Website-Demo für „${marke.name}“.

${markeText(marke)}

Logo: ${logo}

<bilder>
${bilder || "keine"}
</bilder>

<kontakt>
E-Mails: ${e.kontakt.emails.join(", ") || "keine gefunden"} · Telefon: ${e.kontakt.telefone.join(", ") || "keins gefunden"}
</kontakt>

<analyse_empfehlungen>
${analyse.potenziale.map((p) => `- ${p.titel}: ${p.beschreibung}`).join("\n")}
</analyse_empfehlungen>

${kontext(e)}`,
      },
    ],
  });

  const html = daten.replace(/^[\s\S]*?(<!doctype html)/i, "$1").replace(/```\s*$/, "").trim();
  if (!/^<!doctype html/i.test(html) || !/<\/html>/i.test(html)) throw new Error("Die Website-Demo ist unvollständig. Bitte den Schritt neu starten.");
  await speichereText(kunde.id, "website", html);
  return kostenUsd;
}

/* ---------- 5 · Newsletter-Vorlage ---------- */

const NewsletterSchema = z.object({
  name: z.string().describe("Name des Newsletters"),
  untertitel: z.string(),
  rhythmus: z.string().describe("z. B. „monatlich, erster Donnerstag“"),
  ziel: z.string(),
  aufbau: z.array(z.object({ rubrik: z.string().describe("Kurzer Rubrikname"), zweck: z.string() })).describe("3–4 feste Rubriken"),
  betreffFormeln: z.array(z.string()).describe("4 Betreff-Muster mit Beispiel"),
  absenderName: z.string(),
  buttonText: z.string(),
  tipps: z.array(z.string()).describe("3 Hinweise für den Versand (Zeitpunkt, Anmeldung, Datenschutz)"),
});

async function schrittNewsletter(kunde: Kunde): Promise<number> {
  const marke = await lade<MarkeMitBildern>(kunde.id, "marke");
  const analyse = await lade<Analyse>(kunde.id, "analyse");
  const { daten, kostenUsd } = await frage({
    schema: NewsletterSchema,
    effort: "low",
    maxTokens: 8000,
    system: `${GRUNDHALTUNG}\n\nDu bist E-Mail-Marketing-Expertin. Du entwickelst das Konzept für einen regelmässigen Kunden-Newsletter, der Vertrauen aufbaut und verkauft, ohne aufdringlich zu sein. Alle Texte in Sprache und Anrede der Marke.`,
    inhalt: [{ type: "text", text: `Entwickle die Newsletter-Vorlage für „${marke.name}“.\n\n${markeText(marke)}\n\nWichtigste Potenziale aus der Analyse:\n${analyse.potenziale.map((p) => `- ${p.titel}`).join("\n")}` }],
  });
  await speichereDaten(kunde.id, "newsletter", daten satisfies NewsletterKonzept);
  return kostenUsd;
}

/* ---------- 6 · Social-Media-Vorlagen ---------- */

const LAYOUTS = ["aussage", "tipps", "zitat", "zahl", "frage"] as const;

const VorlagenSchema = z.object({
  kanaele: z.array(
    z.object({
      kanal: z.enum(["instagram", "facebook", "linkedin"]),
      rolle: z.string().describe("Wofür dieser Kanal bei diesem Kunden da ist"),
      tonalitaet: z.string().describe("Wie die Stimme auf diesem Kanal klingt"),
      laenge: z.string().describe("Empfohlene Textlänge"),
      aufbau: z.array(z.string()).describe("Bausteine eines Beitrags in Reihenfolge, z. B. Hook, Nutzen, Beleg, Handlungsaufforderung"),
      beispiel: z.string().describe("Ein vollständiger Beispielbeitrag nach dieser Vorlage"),
      hashtags: z.array(z.string()).describe("Feste Marken- und Themen-Hashtags, für LinkedIn höchstens 3"),
      ctas: z.array(z.string()).describe("3 passende Handlungsaufforderungen"),
    }),
  ),
  grafiken: z.array(
    z.object({
      layout: z.enum(LAYOUTS),
      wofuer: z.string().describe("Wann diese Grafik-Vorlage eingesetzt wird"),
      beispielTitel: z.string(),
      beispielUntertitel: z.string(),
      beispielPunkte: z.array(z.string()).describe("Nur für „tipps“ 3–4 Punkte, sonst leer"),
    }),
  ).describe("Je genau ein Eintrag für aussage, tipps, zitat, zahl, frage"),
});
export type Vorlagen = z.infer<typeof VorlagenSchema> & { vorschau: Record<string, string> };

async function bausteine(kunde: Kunde, marke: MarkeMitBildern, fotoIndex: number | null = null): Promise<Bausteine> {
  const schriften = await ladeSchriften(marke);
  const dataUri = async (pfad: string | null | undefined) => {
    const m = pfad ? await ladeMediumPfad(pfad) : null;
    return m && ["image/png", "image/jpeg", "image/svg+xml"].includes(m.contentType) ? `data:${m.contentType};base64,${Buffer.from(m.data).toString("base64")}` : null;
  };
  const e = await lade<Erfassung>(kunde.id, "erfassung");
  return {
    marke,
    schriften,
    // Bei SVG-Logos die PNG-Vorschau: in verschachtelten SVGs fehlen resvg sonst die Schriften
    logo: await dataUri(marke.logo.vorschau ?? marke.logo.pfad),
    foto: fotoIndex !== null ? await dataUri(e.bilder[fotoIndex]?.pfad) : null,
  };
}

async function schrittVorlagen(kunde: Kunde): Promise<number> {
  const marke = await lade<MarkeMitBildern>(kunde.id, "marke");
  const analyse = await lade<Analyse>(kunde.id, "analyse");
  const { daten, kostenUsd } = await frage({
    schema: VorlagenSchema,
    effort: "medium",
    maxTokens: 16000,
    system: `${GRUNDHALTUNG}\n\nDu bist Social-Media-Strategin. Du erstellst wiederverwendbare Text- und Grafikvorlagen für Instagram, Facebook und LinkedIn – je Kanal eine eigene, auf das Publikum zugeschnittene Vorlage, alle in der Stimme der Marke. Beispieltitel für Grafiken sind kurz (höchstens 9 Wörter).`,
    inhalt: [{ type: "text", text: `Erstelle die Social-Media-Vorlagen für „${marke.name}“.\n\n${markeText(marke)}\n\nSocial-Media-Befund:\n${analyse.social.map((s) => `- ${s.kanal}: ${s.status}. ${s.befund}`).join("\n")}` }],
  });

  // Vorschaubilder der fünf Grafik-Vorlagen in der Marke des Kunden
  const fotoIndex = marke.bilder.find((b) => b.fuerPosts)?.index ?? null;
  const vorschau: Record<string, string> = {};
  for (const g of daten.grafiken) {
    const bs = await bausteine(kunde, marke, g.layout === "aussage" ? fotoIndex : null);
    const svg = vorlage(g.layout, bs, "instagram", { titel: g.beispielTitel, untertitel: g.beispielUntertitel, punkte: g.beispielPunkte, etikett: "Vorlage" });
    vorschau[g.layout] = await speichereMedium(kunde.id, `vorlage-${g.layout}.png`, await svgZuPng(svg, undefined, bs.schriften), "image/png");
  }
  await speichereDaten(kunde.id, "vorlagen", { ...daten, vorschau } satisfies Vorlagen);
  return kostenUsd;
}

/* ---------- 7 · Contentplan und Redaktionsplan ---------- */

const PlanEintrag = z.object({
  thema: z.string().describe("Konkretes Thema des Beitrags"),
  saeule: z.string().describe("Name der Content-Säule"),
  format: z.enum(["bild", "karussell", "reel"]),
  layout: z.enum(LAYOUTS),
});

const StrategieSchema = z.object({
  contentplan: z.object({
    ziele: z.array(z.string()).describe("3 messbare Ziele für 3 Monate"),
    zielgruppen: z.array(z.object({ name: z.string(), beschreibung: z.string() })),
    saeulen: z.array(z.object({ name: z.string().describe("Höchstens 2 Wörter"), beschreibung: z.string(), anteil: z.number().describe("Prozent") })).describe("3–4 Content-Säulen"),
    monate: z.array(z.object({ monat: z.number(), fokus: z.string(), themen: z.array(z.string()), aktion: z.string().describe("Besondere Aktion oder Anlass, sonst leer") })).describe("Genau 3 Monate"),
    formate: z.string().describe("Format-Mix und warum"),
    kennzahlen: z.array(z.string()).describe("Woran Erfolg gemessen wird"),
  }),
  wochen: z
    .array(z.object({ woche: z.number(), instagram: PlanEintrag, facebook: PlanEintrag, linkedin: PlanEintrag }))
    .describe("Genau 13 Wochen"),
  newsletter: z.array(z.object({ monat: z.number(), thema: z.string() })).describe("Genau 3 Ausgaben"),
});
export type Strategie = z.infer<typeof StrategieSchema>;

async function schrittStrategie(kunde: Kunde): Promise<number> {
  const marke = await lade<MarkeMitBildern>(kunde.id, "marke");
  const analyse = await lade<Analyse>(kunde.id, "analyse");
  const vorlagen = await lade<Vorlagen>(kunde.id, "vorlagen");
  const e = await lade<Erfassung>(kunde.id, "erfassung");
  const { daten, kostenUsd } = await frage({
    schema: StrategieSchema,
    effort: "high",
    system: `${GRUNDHALTUNG}

Du bist Social-Media-Strategin. Du planst 3 Monate (13 Wochen) Content: pro Woche genau ein Beitrag auf Instagram, Facebook und LinkedIn, dazu ein Newsletter pro Monat.
- Contentplan: Ziele, Zielgruppen, 3–4 Säulen, Monatsfokus. Themen kommen aus dem echten Angebot des Unternehmens, Saison und Anlässen in den 3 Monaten ab ${kunde.startDatum} (Region und Sprache des Kunden beachten).
- Redaktionsplan: Die drei Kanäle bekommen in derselben Woche verwandte, aber eigene Themen passend zum Publikum (LinkedIn fachlich und B2B, Facebook lokal und gemeinschaftlich, Instagram visuell und nahbar). Kein Thema doppelt.
- Formate: Instagram etwa 1 Reel und 1 Karussell pro Monat, sonst Bild; Facebook und LinkedIn vor allem Bild und Karussell, Reels selten.
- Layouts: aussage (starke Aussage, auch mit Foto), tipps (Liste), zitat (Zitat oder Kundenstimme – nur echte Stimmen, sonst Haltung des Unternehmens), zahl (Fakt aus den Daten), frage (Interaktion). Abwechslungsreich einsetzen.`,
    inhalt: [
      {
        type: "text",
        text: `Plane die nächsten 3 Monate für „${marke.name}“. Start: Montag, ${kunde.startDatum}.

${markeText(marke)}

<kanal_vorlagen>
${vorlagen.kanaele.map((k) => `${KANAL_NAME[k.kanal]}: ${k.rolle}`).join("\n")}
</kanal_vorlagen>

<analyse>
${analyse.fazit}
${analyse.potenziale.map((p) => `- ${p.titel}: ${p.beschreibung}`).join("\n")}
</analyse>

${kontext(e, "kurz")}`,
      },
    ],
  });
  if (daten.wochen.length < 13) throw new Error(`Der Redaktionsplan hat nur ${daten.wochen.length} statt 13 Wochen. Bitte den Schritt neu starten.`);
  await speichereDaten(kunde.id, "strategie", { ...daten, wochen: daten.wochen.slice(0, 13), newsletter: daten.newsletter.slice(0, 3) });
  return kostenUsd;
}

/* ---------- 8 · Beiträge und Newsletter texten ---------- */

const POSTZEIT: Record<Kanal, { tag: number; zeit: string }> = {
  instagram: { tag: 1, zeit: "18:00" }, // Dienstag
  linkedin: { tag: 2, zeit: "08:30" }, // Mittwoch
  facebook: { tag: 3, zeit: "19:00" }, // Donnerstag
};

function plusTage(tag: string, n: number): string {
  const d = new Date(`${tag}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* Datum und Uhrzeit in Zürcher Zeit als ISO-String mit Offset (Sommer-/Winterzeit) */
export function zuerichIso(tag: string, zeit: string): string {
  const probe = new Date(`${tag}T${zeit}:00Z`);
  const teile = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Zurich", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(probe);
  const t = (typ: string) => Number(teile.find((p) => p.type === typ)?.value);
  const offset = (Date.UTC(t("year"), t("month") - 1, t("day"), t("hour"), t("minute")) - probe.getTime()) / 3_600_000;
  return `${tag}T${zeit}:00+${String(offset).padStart(2, "0")}:00`;
}

const TextSchema = z.object({
  beitraege: z.array(
    z.object({
      ref: z.string().describe("Referenz wie im Plan, z. B. w3-instagram"),
      text: z.string().describe("Fertiger Beitragstext ohne Hashtags"),
      hashtags: z.array(z.string()).describe("Ohne #, Instagram 5–10, Facebook 0–3, LinkedIn höchstens 3"),
      alt: z.string().describe("Alt-Text für die Grafik"),
      titel: z.string().describe("Text auf der Grafik, höchstens 9 Wörter (bei zahl: nur die Zahl, z. B. „48 h“)"),
      untertitel: z.string().describe("Unterzeile der Grafik, höchstens 20 Wörter, darf leer sein"),
      punkte: z.array(z.string()).describe("Nur bei Layout tipps: 3–5 kurze Punkte, sonst leer"),
      bild: z.number().describe("Index eines passenden Website-Fotos für Layout aussage, sonst -1"),
      folien: z.array(z.object({ titel: z.string(), text: z.string() })).describe("Karussell: 4–7 Folien nach dem Titelbild, letzte Folie mit Handlungsaufforderung. Reel: 3–5 Szenen mit sehr kurzem Text. Bild: leer"),
    }),
  ),
  newsletter: z.object({
    betreff: z.string(),
    vorschau: z.string(),
    einleitung: z.string(),
    abschnitte: z.array(z.object({ titel: z.string(), text: z.string(), button: z.string().describe("Buttontext oder leer") })),
    abschluss: z.string(),
  }),
});

async function schrittInhalte(kunde: Kunde): Promise<number> {
  const marke = await lade<MarkeMitBildern>(kunde.id, "marke");
  const vorlagen = await lade<Vorlagen>(kunde.id, "vorlagen");
  const strategie = await lade<Strategie>(kunde.id, "strategie");
  const konzept = await lade<NewsletterKonzept>(kunde.id, "newsletter");
  const e = await lade<Erfassung>(kunde.id, "erfassung");
  const fotos = marke.bilder.filter((b) => b.fuerPosts && e.bilder[b.index] && e.bilder[b.index].contentType !== "image/webp");

  const beitraege: Beitrag[] = [];
  const newsletter: NewsletterAusgabe[] = [];
  let kosten = 0;

  for (let monat = 1; monat <= 3; monat++) {
    // Monat 1: Wochen 1–4, Monat 2: 5–8, Monat 3: 9–13
    const wochen = strategie.wochen.filter((w) => Math.min(3, Math.ceil(w.woche / 4)) === monat);
    const plan = wochen.flatMap((w) => KANAELE.map((k) => `- w${w.woche}-${k}: ${KANAL_NAME[k]}, Woche ${w.woche}, Säule „${w[k].saeule}“, Format ${w[k].format}, Layout ${w[k].layout}: ${w[k].thema}`)).join("\n");
    const nlThema = strategie.newsletter.find((n) => n.monat === monat)?.thema ?? strategie.contentplan.monate[monat - 1]?.fokus ?? "";

    const { daten, kostenUsd } = await frage({
      schema: TextSchema,
      effort: "medium",
      maxTokens: 48000,
      system: `${GRUNDHALTUNG}

Du bist Content-Creatorin und Texterin. Du schreibst veröffentlichungsfertige Beiträge exakt in der Stimme, Sprache und Anrede der Marke – so, dass der Kunde sie ohne Änderung freigeben kann.
- Halte dich an die Kanal-Vorlagen (Aufbau, Länge, Hashtags, Handlungsaufforderungen).
- Erste Zeile ist ein starker Hook. Absätze für gute Lesbarkeit. Emojis nur, wenn sie zur Marke passen.
- Keine erfundenen Fakten, Preise, Aktionen oder Kundenstimmen. Platzhalter in eckigen Klammern, wo Angaben fehlen.
- Gib jeden Plan-Eintrag genau einmal zurück, mit derselben Referenz.`,
      inhalt: [
        {
          type: "text",
          text: `Schreibe Monat ${monat} von 3 für „${marke.name}“: alle Beiträge und den Newsletter.

${markeText(marke)}

<kanal_vorlagen>
${vorlagen.kanaele.map((k) => `${KANAL_NAME[k.kanal]}: Aufbau ${k.aufbau.join(" → ")}; Länge ${k.laenge}; Tonalität ${k.tonalitaet}; Hashtags ${k.hashtags.join(" ")}; CTAs ${k.ctas.join(" / ")}`).join("\n")}
</kanal_vorlagen>

<contentplan_monat>
${JSON.stringify(strategie.contentplan.monate[monat - 1] ?? {})}
Säulen: ${strategie.contentplan.saeulen.map((s) => `${s.name} (${s.beschreibung})`).join("; ")}
</contentplan_monat>

<plan>
${plan}
</plan>

<website_fotos hinweis="nur für Layout aussage">
${fotos.map((f) => `${f.index}: ${f.beschreibung}`).join("\n") || "keine geeigneten Fotos"}
</website_fotos>

<newsletter konzept="${konzept.name}" thema="${nlThema}">
Rubriken in dieser Reihenfolge: ${konzept.aufbau.map((r) => `${r.rubrik} (${r.zweck})`).join("; ")}
Buttontext: ${konzept.buttonText}
</newsletter>

${kontext(e, "kurz")}`,
        },
      ],
    });
    kosten += kostenUsd;

    for (const w of wochen) {
      for (const kanal of KANAELE) {
        const ref = `w${w.woche}-${kanal}`;
        const t = daten.beitraege.find((b) => b.ref === ref);
        if (!t) throw new Error(`Beitrag ${ref} fehlt in der KI-Antwort. Bitte den Schritt neu starten.`);
        const p = w[kanal];
        const tag = plusTage(kunde.startDatum, (w.woche - 1) * 7 + POSTZEIT[kanal].tag);
        beitraege.push({
          id: ref,
          kanal,
          datum: zuerichIso(tag, POSTZEIT[kanal].zeit),
          woche: w.woche,
          monat,
          saeule: p.saeule,
          thema: p.thema,
          format: p.format,
          layout: p.layout,
          grafik: { titel: t.titel, untertitel: t.untertitel, punkte: t.punkte, bild: fotos.some((f) => f.index === t.bild) ? t.bild : null },
          folien: p.format === "bild" ? [] : t.folien,
          text: t.text,
          hashtags: t.hashtags.map((h) => h.replace(/^#/, "")),
          alt: t.alt,
          medien: [],
        });
      }
    }
    // Newsletter am ersten Donnerstag des Monats-Blocks, 08:00
    const nlTag = plusTage(kunde.startDatum, (monat - 1) * 28 + 3);
    newsletter.push({ id: `nl-${monat}`, monat, datum: zuerichIso(nlTag, "08:00"), ...daten.newsletter });
  }

  await speichereDaten(kunde.id, "inhalte", { beitraege, newsletter } satisfies Inhalte);
  return kosten;
}

/* ---------- 9 · Bilder und Reel-Szenen ---------- */

export async function rendereBeitrag(kunde: Kunde, beitrag: Beitrag, marke: MarkeMitBildern): Promise<string[]> {
  const bs = await bausteine(kunde, marke, beitrag.layout === "aussage" ? beitrag.grafik.bild : null);
  const grafiken = beitragsGrafiken(beitrag, bs);
  const version = Date.now().toString(36);
  const pfade: string[] = [];
  for (const [i, svg] of grafiken.entries()) {
    const png = await svgZuPng(svg, undefined, bs.schriften);
    pfade.push(await speichereMedium(kunde.id, `post-${beitrag.id}-${i + 1}-${version}.png`, png, "image/png"));
  }
  return pfade;
}

async function schrittMedien(kunde: Kunde): Promise<number> {
  const marke = await lade<MarkeMitBildern>(kunde.id, "marke");
  const inhalte = await lade<Inhalte>(kunde.id, "inhalte");
  for (const beitrag of inhalte.beitraege) {
    beitrag.medien = await rendereBeitrag(kunde, beitrag, marke);
    delete beitrag.video;
  }
  await speichereDaten(kunde.id, "inhalte", inhalte);
  return 0;
}

/* ---------- Überarbeiten nach Änderungswunsch ---------- */

const UeberarbeitungSchema = z.object({
  text: z.string(),
  hashtags: z.array(z.string()),
  alt: z.string(),
  titel: z.string(),
  untertitel: z.string(),
  punkte: z.array(z.string()),
  folien: z.array(z.object({ titel: z.string(), text: z.string() })),
});

const NewsletterUeberarbeitung = TextSchema.shape.newsletter;

export async function ueberarbeite(kunde: Kunde, itemId: string, kommentar: string): Promise<number> {
  const marke = await lade<MarkeMitBildern>(kunde.id, "marke");
  const inhalte = await lade<Inhalte>(kunde.id, "inhalte");
  const system = `${GRUNDHALTUNG}\n\nDu überarbeitest einen Inhalt nach dem Änderungswunsch des Kunden. Setze den Wunsch genau um, behalte alles andere bei, bleib in der Stimme der Marke. Keine erfundenen Fakten.`;

  const beitrag = inhalte.beitraege.find((b) => b.id === itemId);
  if (beitrag) {
    const { daten, kostenUsd } = await frage({
      schema: UeberarbeitungSchema,
      effort: "medium",
      maxTokens: 12000,
      system,
      inhalt: [
        {
          type: "text",
          text: `${markeText(marke)}\n\n<beitrag kanal="${KANAL_NAME[beitrag.kanal]}" format="${beitrag.format}" layout="${beitrag.layout}">\n${JSON.stringify({ text: beitrag.text, hashtags: beitrag.hashtags, alt: beitrag.alt, titel: beitrag.grafik.titel, untertitel: beitrag.grafik.untertitel, punkte: beitrag.grafik.punkte, folien: beitrag.folien }, null, 1)}\n</beitrag>\n\n<aenderungswunsch>\n${kommentar}\n</aenderungswunsch>`,
        },
      ],
    });
    Object.assign(beitrag, {
      text: daten.text,
      hashtags: daten.hashtags.map((h) => h.replace(/^#/, "")),
      alt: daten.alt,
      folien: beitrag.format === "bild" ? [] : daten.folien,
      grafik: { ...beitrag.grafik, titel: daten.titel, untertitel: daten.untertitel, punkte: daten.punkte },
    });
    beitrag.medien = await rendereBeitrag(kunde, beitrag, marke);
    delete beitrag.video;
    await speichereDaten(kunde.id, "inhalte", inhalte);
    return kostenUsd;
  }

  const ausgabe = inhalte.newsletter.find((n) => n.id === itemId);
  if (!ausgabe) throw new Error(`Inhalt ${itemId} nicht gefunden.`);
  const { daten, kostenUsd } = await frage({
    schema: NewsletterUeberarbeitung,
    effort: "medium",
    maxTokens: 12000,
    system,
    inhalt: [{ type: "text", text: `${markeText(marke)}\n\n<newsletter>\n${JSON.stringify(ausgabe, null, 1)}\n</newsletter>\n\n<aenderungswunsch>\n${kommentar}\n</aenderungswunsch>` }],
  });
  Object.assign(ausgabe, daten);
  await speichereDaten(kunde.id, "inhalte", inhalte);
  return kostenUsd;
}

/* ---------- Ablauf ---------- */

export const AUSFUEHRUNG: Record<SchrittKey, (kunde: Kunde) => Promise<number>> = {
  erfassung: schrittErfassung,
  analyse: schrittAnalyse,
  marke: schrittMarke,
  website: schrittWebsite,
  newsletter: schrittNewsletter,
  vorlagen: schrittVorlagen,
  strategie: schrittStrategie,
  inhalte: schrittInhalte,
  medien: schrittMedien,
};
