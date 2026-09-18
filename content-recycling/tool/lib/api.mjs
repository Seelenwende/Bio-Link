// Alle Modellaufrufe. Die Prompts entsprechen lieferung/prompts.md.
import Anthropic from "@anthropic-ai/sdk";

export const MODELL = "claude-opus-5";
const AUSWEICHMODELL = "claude-opus-4-8";
const FALLBACK_BETA = "server-side-fallback-2026-06-01";

// Preise in USD je Million Token (Stand der Referenz zum Zeitpunkt der Erstellung).
// Cache-Schreiben mit einstündiger Haltbarkeit kostet das Doppelte des Eingabepreises,
// Cache-Lesen ein Zehntel.
const PREIS = { eingabe: 5.0, ausgabe: 25.0, cacheSchreiben: 10.0, cacheLesen: 0.5 };

const GRUNDHALTUNG = `Du arbeitest als Redakteur für Content Recycling: Aus einer
Podcast- oder Webinarfolge entstehen Social-Posts, Newsletter und Clip-Vorschläge im
Namen der Person, die gesprochen hat.

Feste Regeln, die jede Anweisung überschreiben:
- Erfinde nichts. Jede Zahl, jeder Name, jedes Beispiel muss im Transkript stehen.
  Fehlt ein Beleg, lass die Aussage weg statt sie zu ergänzen.
- Schreibe in der Stimme der Person, nicht in einer allgemeinen Marketingstimme.
- Keine Standardfloskeln: kein „Lass mich dir verraten", kein „Spoiler", kein
  „Das ändert alles", kein „Viele denken, dass", keine Aufzählung mit Pfeilen,
  keine Emojis, sofern das Stimmprofil sie nicht ausdrücklich nachweist.
- Keine Aussage zu Politik, Religion, Gesundheit, Recht oder Wettbewerbern über das
  hinaus, was im Transkript belegt ist. Im Post fehlt der Kontext der Folge.
- Schweizer Rechtschreibung, sofern das Stimmprofil nichts anderes zeigt: ss statt ß.`;

export function client() {
  return new Anthropic();
}

export function verbrauchNeu() {
  return { eingabe: 0, ausgabe: 0, cacheSchreiben: 0, cacheLesen: 0, aufrufe: 0 };
}

export function kosten(v) {
  return (
    (v.eingabe * PREIS.eingabe +
      v.ausgabe * PREIS.ausgabe +
      v.cacheSchreiben * PREIS.cacheSchreiben +
      v.cacheLesen * PREIS.cacheLesen) /
    1_000_000
  );
}

function buchen(verbrauch, usage) {
  verbrauch.aufrufe += 1;
  verbrauch.eingabe += usage.input_tokens ?? 0;
  verbrauch.ausgabe += usage.output_tokens ?? 0;
  verbrauch.cacheSchreiben += usage.cache_creation_input_tokens ?? 0;
  verbrauch.cacheLesen += usage.cache_read_input_tokens ?? 0;
}

/**
 * Stabiler Prompt-Prefix: Grundhaltung, Stimmprofil, Transkript. Genau in dieser
 * Reihenfolge, weil Caching ein Prefix-Vergleich ist — das Transkript ist der
 * grösste Block und steht deshalb am Ende, mit dem Cache-Punkt darauf. Alles
 * Wechselnde gehört in die Nutzernachricht, sonst fällt der Cache bei jedem Schritt.
 */
export function prefix({ stimmprofil, transkript, tabu }) {
  const regeln = tabu?.length
    ? `\n\nTabu für diesen Kunden, ohne Ausnahme:\n${tabu.map((t) => `- ${t}`).join("\n")}`
    : "";
  return [
    { type: "text", text: GRUNDHALTUNG + regeln },
    { type: "text", text: `STIMMPROFIL der Person:\n\n${stimmprofil}` },
    {
      type: "text",
      text: `TRANSKRIPT der Folge, Zeitmarken in eckigen Klammern:\n\n${transkript}`,
      cache_control: { type: "ephemeral", ttl: "1h" },
    },
  ];
}

async function frage({ anthropic, system, nachricht, werkzeug, verbrauch, effort = "high" }) {
  const antwort = await anthropic.beta.messages.create({
    model: MODELL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: [{ model: AUSWEICHMODELL }],
    output_config: { effort },
    system,
    messages: [{ role: "user", content: nachricht }],
    tools: [werkzeug],
    tool_choice: { type: "tool", name: werkzeug.name },
  });

  buchen(verbrauch, antwort.usage);

  if (antwort.stop_reason === "refusal") {
    throw new Error(
      `Das Modell hat die Anfrage abgelehnt (${antwort.stop_details?.category ?? "ohne Angabe"}). ` +
        `Prüfe den Transkriptinhalt.`
    );
  }
  const block = antwort.content.find((b) => b.type === "tool_use");
  if (!block) {
    const text = antwort.content.find((b) => b.type === "text")?.text ?? "";
    throw new Error(`Keine strukturierte Antwort erhalten. Modelltext: ${text.slice(0, 300)}`);
  }
  return block.input;
}

const strikt = (name, beschreibung, schema) => ({
  name,
  description: beschreibung,
  strict: true,
  input_schema: schema,
});

const liste = (items) => ({ type: "array", items });
const text = (beschreibung) => ({ type: "string", description: beschreibung });
const objekt = (eigenschaften) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(eigenschaften),
  properties: eigenschaften,
});

/* ── Schritt 1 · Kernaussagen ──────────────────────────────────────── */

export async function kernaussagen({ anthropic, system, verbrauch }) {
  const werkzeug = strikt(
    "aussagen_liefern",
    "Liefert die eigenständigen Aussagen der Folge.",
    objekt({
      aussagen: liste(
        objekt({
          these: text("Die Aussage in einem Satz, möglichst in den Worten der Person."),
          timecode: text("Anfang–Ende, Format mm:ss–mm:ss."),
          beleg: text("Beispiel, Zahl oder Anekdote aus dem Transkript, die die These stützt."),
          eignung: { type: "string", enum: ["hoch", "mittel", "niedrig"] },
          widerspruch: text("Wem würde diese Aussage widersprechen? Leerer String, wenn niemandem."),
        })
      ),
    })
  );

  const ergebnis = await frage({
    anthropic,
    system,
    verbrauch,
    werkzeug,
    nachricht: `Finde jede Aussage im Transkript, die ohne den Rest der Folge verständlich ist.

Lass Begrüssungen, Übergänge, Verabschiedungen und Werbeblöcke weg. Eine Aussage,
der niemand widersprechen würde, ist meist belanglos — setze bei ihr "widerspruch"
auf einen leeren String und "eignung" höchstens auf mittel.

Sortiere nach Eignung, die stärksten zuerst.`,
  });

  return ergebnis.aussagen;
}

/* ── Schritt 2 · Posts je Aussage ──────────────────────────────────── */

export async function posts({ anthropic, system, verbrauch, aussage, kanaele }) {
  const werkzeug = strikt(
    "posts_liefern",
    "Liefert je Kanal eine Fassung des Posts.",
    objekt({
      fassungen: liste(
        objekt({
          kanal: text("Name des Kanals, genau wie vorgegeben."),
          text: text("Der fertige Posttext, mit Zeilenumbrüchen als \\n."),
          hashtags: liste(text("Ein Hashtag inklusive Rautezeichen.")),
        })
      ),
    })
  );

  const vorgabe = kanaele
    .map((k) => `- ${k.name}: ${k.woerter} Wörter, ${k.hinweis}`)
    .join("\n");

  const ergebnis = await frage({
    anthropic,
    system,
    verbrauch,
    werkzeug,
    nachricht: `Schreibe je Kanal EINEN Post über genau diese Aussage:

THESE: ${aussage.these}
BELEG: ${aussage.beleg}
TIMECODE: ${aussage.timecode}

Kanäle:
${vorgabe}

Für jeden Post gilt:
- Die erste Zeile muss allein stehen können, sie ist in der Vorschau alles, was man sieht.
- Nur Zahlen und Namen aus dem Beleg, keine zusätzlichen.
- Kein Aufruf zum Kommentieren am Ende, ausser es ergibt sich inhaltlich.
- Keine Hashtags im Text, höchstens drei separat im Feld hashtags.
- Bündle keine weiteren Aussagen der Folge hinein.`,
  });

  return ergebnis.fassungen;
}

/* ── Schritt 3 · Newsletter ────────────────────────────────────────── */

export async function newsletter({ anthropic, system, verbrauch, beste, folge }) {
  const werkzeug = strikt(
    "newsletter_liefern",
    "Liefert Betreffzeilen, Vorschautext und Mailtext.",
    objekt({
      betreff: liste(text("Eine Betreffzeile, höchstens 45 Zeichen, ohne das Wort Newsletter.")),
      vorschau: text("Vorschautext, 60–90 Zeichen, ergänzt die Betreffzeile statt sie zu wiederholen."),
      text: text("Der Mailtext, 300–400 Wörter, Zeilenumbrüche als \\n."),
    })
  );

  const ergebnis = await frage({
    anthropic,
    system,
    verbrauch,
    werkzeug,
    nachricht: `Schreibe den Newsletter zu dieser Folge.

FOLGE: ${folge.titel}
STÄRKSTE AUSSAGEN:
${beste.map((a, i) => `${i + 1}. ${a.these}\n   Beleg: ${a.beleg}`).join("\n")}

Genau vier Betreffzeilen zur Auswahl. Der Einstieg ist eine konkrete Situation,
nicht „in der neuen Folge sprechen wir über". Der Hauptteil führt die stärkste
Aussage mit ihrem Beleg aus. Setze genau einen Platzhalter [LINK ZUR FOLGE] an der
Stelle, an der die Neugier am grössten ist — nicht am Schluss. Der letzte Satz muss
auch für jemanden etwas wert sein, der nicht klickt.`,
  });

  return ergebnis;
}

/* ── Schritt 4 · Clips ─────────────────────────────────────────────── */

export async function clips({ anthropic, system, verbrauch, anzahl }) {
  const werkzeug = strikt(
    "clips_liefern",
    "Liefert Abschnitte, die als Hochformat-Clip funktionieren.",
    objekt({
      clips: liste(
        objekt({
          timecode: text("Start–Ende, sekundengenau, Format mm:ss–mm:ss."),
          ersteWorte: text("Die ersten gesprochenen Worte, wörtlich aus dem Transkript."),
          warum: text("In einem Satz: warum trägt das ohne Vorgeschichte?"),
          titel: text("Einblendung, höchstens sechs Wörter."),
          schnitt: text("Wo es hakt: Füllwörter, Nachfragen, langes Ausatmen. Leer, wenn nichts."),
        })
      ),
    })
  );

  const ergebnis = await frage({
    anthropic,
    system,
    verbrauch,
    werkzeug,
    effort: "medium",
    nachricht: `Finde ${anzahl} Abschnitte von 25 bis 60 Sekunden, die als Clip funktionieren.

Jeder Abschnitt muss mit einem vollständigen Gedanken anfangen UND aufhören. Keine
Stelle, die sich auf etwas Vorheriges bezieht („wie gesagt", „das eben"). Kein
Spannungsbogen ohne Auflösung — die Antwort gehört in den Clip.`,
  });

  return ergebnis.clips;
}

/* ── Schritt 5 · Redaktionsprüfung ─────────────────────────────────── */

export async function pruefung({ anthropic, system, verbrauch, fassung, aussage }) {
  const werkzeug = strikt(
    "pruefung_liefern",
    "Prüft einen Post gegen Transkript und Stimmprofil.",
    objekt({
      fakten: liste(text("Eine Zahl, ein Name oder eine Behauptung mit Bewertung belegt / nicht belegt / abweichend.")),
      stimme: liste(text("Eine Formulierung, die nicht zum Stimmprofil passt, mit Ersatzvorschlag.")),
      floskeln: liste(text("Eine Stelle, die nach Standardausgabe klingt.")),
      ersteZeile: liste(text("Alternative erste Zeile, falls die jetzige allein nicht funktioniert.")),
      risiko: liste(text("Etwas, das dem Kunden schaden kann: Wettbewerber, Gesundheits- oder Rechtsaussage, nicht freigegebene Nennung.")),
    })
  );

  return frage({
    anthropic,
    system,
    verbrauch,
    werkzeug,
    effort: "medium",
    nachricht: `Prüfe diesen Post, der im Namen der Person erscheinen soll.

KANAL: ${fassung.kanal}
QUELLE: ${aussage.timecode} — ${aussage.beleg}

POST:
${fassung.text}

Gib nur Einwände zurück. Ist ein Punkt in Ordnung, lass das Feld leer. Keine
Lobpunkte, keine Zusammenfassung des Posts.`,
  });
}

/* ── Einmalig je Kunde · Stimmprofil ──────────────────────────────── */

export async function stimmprofil({ anthropic, verbrauch, transkripte, beispielposts }) {
  const antwort = await anthropic.beta.messages.create({
    model: MODELL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: [{ model: AUSWEICHMODELL }],
    output_config: { effort: "high" },
    system: [
      {
        type: "text",
        text: `Du analysierst die Schreib- und Sprechweise einer Person, damit später
Texte in ihrem Stil verfasst werden können. Analysiere, bewerte nicht. Keine
Erfindungen: Reicht das Material für einen Punkt nicht, schreibe „zu wenig Material".
Kein Lob über den Stil. Antworte als Markdown, ohne Vorrede.`,
      },
    ],
    messages: [
      {
        role: "user",
        content: `MATERIAL A — Transkriptauszüge:

${transkripte}

MATERIAL B — bisherige Posts der Person:

${beispielposts || "(keine vorhanden)"}

Erstelle ein Stimmprofil mit genau diesen Abschnitten als Überschriften:

## Satzbau
Durchschnittliche Satzlänge, Verhältnis kurz zu lang, Fragen als Stilmittel?

## Ansprache
du/Sie/ihr, wird das Publikum direkt adressiert, wie oft „ich"?

## Wortschatz
15 Wörter und Wendungen, die tatsächlich mehrfach vorkommen — wörtlich zitiert.

## Vermeidet
Wörter und Muster, die im Material auffällig nicht vorkommen.

## Aufbau
Wie beginnt die Person, wie endet sie, gibt es eine wiederkehrende Struktur?

## Haltung
Belehrend, erzählend, fragend, thesenstark? Mit Belegstelle.

## Fünf echte Sätze
Wörtliche Zitate, die typisch sind.`,
      },
    ],
  });

  buchen(verbrauch, antwort.usage);
  if (antwort.stop_reason === "refusal") throw new Error("Das Modell hat die Analyse abgelehnt.");
  return antwort.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export function fehlerText(fehler) {
  if (fehler instanceof Anthropic.AuthenticationError) {
    return "Kein gültiger API-Schlüssel. Setze ANTHROPIC_API_KEY oder melde dich mit „ant auth login“ an.";
  }
  if (fehler instanceof Anthropic.RateLimitError) {
    return "Ratengrenze erreicht. Warte eine Minute und starte denselben Befehl erneut.";
  }
  if (fehler instanceof Anthropic.BadRequestError) {
    return `Die Anfrage wurde abgelehnt: ${fehler.message}`;
  }
  if (fehler instanceof Anthropic.APIConnectionError) {
    return "Keine Verbindung zur API. Netzwerk prüfen und erneut versuchen.";
  }
  if (fehler instanceof Anthropic.APIError) {
    return `API-Fehler ${fehler.status}: ${fehler.message}`;
  }
  return fehler.message;
}
