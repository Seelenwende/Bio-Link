// Content-Planer: verwandelt eine inhaltliche Vorgabe in ein Drehbuch für Reel, Bildbeitrag
// oder Karussell (Szenen/Folien, Texte, Musik, Farben, Texte für Instagram und Facebook) – mit Claude.

import Anthropic from "@anthropic-ai/sdk";
import { MOODS } from "./music.js";

export const model = () => process.env.ANTHROPIC_MODEL || "claude-opus-5";

export const FORMATS = { reel: "Reel (Video)", image: "Bildbeitrag", carousel: "Karussell" };
export const GOALS = {
  follower: "Neue Follower gewinnen",
  save: "Speichern lassen",
  comments: "Kommentare anregen",
  link: "Klicks auf Link in Bio / Website",
};

export const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "format", "scenes", "music", "palette", "caption", "hashtags", "facebook_text"],
  properties: {
    title: { type: "string", description: "Interner Arbeitstitel" },
    format: { type: "string", enum: Object.keys(FORMATS), description: "reel = Video, image = ein Bild, carousel = mehrere Folien" },
    scenes: {
      type: "array",
      description:
        "Reel: 3–10 Szenen. Bildbeitrag: genau 1 Szene. Karussell: 4–10 Folien (Hook-Folie, Inhaltsfolien, CTA-Folie). " +
        "Die erste Szene/Folie ist der Hook, die letzte der Call-to-Action (beim Bildbeitrag steckt der CTA in Caption/Subtext).",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "subtext", "duration", "role"],
        properties: {
          text: { type: "string", description: "Haupttext auf dem Bildschirm, maximal ca. 12 Wörter" },
          subtext: {
            type: "string",
            description: "Reel: optionale kleine Zeile. Bild/Karussell: erklärender Text, max. ca. 40 Wörter. Sonst leerer String",
          },
          duration: { type: "number", description: "Nur Reel: Anzeigedauer in Sekunden (2 bis 7); sonst 3" },
          role: { type: "string", enum: ["hook", "body", "cta"] },
        },
      },
    },
    music: {
      type: "object",
      additionalProperties: false,
      required: ["mood", "bpm", "key"],
      properties: {
        mood: { type: "string", enum: Object.keys(MOODS) },
        bpm: { type: "integer", description: "Tempo zwischen 60 und 130" },
        key: { type: "string", enum: ["C", "D", "E", "F", "G", "A", "B"] },
      },
    },
    palette: {
      type: "object",
      additionalProperties: false,
      required: ["background", "backgroundAlt", "text", "accent"],
      properties: {
        background: { type: "string", description: "Hex-Farbe, z. B. #FAF6F4" },
        backgroundAlt: { type: "string", description: "Zweite Hex-Farbe für den Verlauf" },
        text: { type: "string", description: "Hex-Farbe für Text, gut lesbar auf dem Hintergrund" },
        accent: { type: "string", description: "Hex-Akzentfarbe" },
      },
    },
    caption: { type: "string", description: "Instagram-Caption ohne Hashtags, mit Zeilenumbrüchen, max. 1500 Zeichen" },
    hashtags: { type: "array", items: { type: "string" }, description: "5 bis 15 Hashtags ohne #" },
    facebook_text: {
      type: "string",
      description: "Eigener Text für die Facebook-Seite: etwas ausführlicher und gesprächiger, höchstens 3 Hashtags, gern mit Frage an die Community",
    },
  },
};

export const brandContext = () => `Marke: ${process.env.BRAND_NAME || "Seelenwende"} (${process.env.BRAND_HANDLE || "@_seelenwende"}).
Markenstimme: ${process.env.BRAND_VOICE || "warm, achtsam, ermutigend, nahbar – Themen rund um Selbstfindung, innere Ruhe und persönliche Wandlung. Sprich die Zuschauer mit 'du' an."}
Markenfarben (wenn nichts anderes gewünscht): Papier #FAF6F4, Sand #F3ECE9, Rosé #B5808F, Beere #8C5A69, Pflaume #5C3A46.`;

export const REEL_RULES = `Formate:
- Reel: kurze Texte auf dem Bildschirm, eine Aussage pro Szene, mit Musik.
- Bildbeitrag: eine starke Aussage (Zitat, Impuls oder Tipp) als Überschrift, optional ein erklärender Satz darunter.
- Karussell: Folie 1 = Hook, der zum Wischen einlädt; danach je Folie ein Gedanke (Überschrift + kurzer Erklärtext); letzte Folie = CTA. Ideal für Tipps, Schritte, Listen – wird gern gespeichert.

Call-to-Action nach Ziel:
- Follower: „Folge für mehr …“ mit klarem Nutzen.
- Speichern: „Speicher dir das für …“.
- Kommentare: konkrete Frage oder „Schreib ‚WORT‘ in die Kommentare“.
- Link: „Mehr dazu über den Link in meiner Bio“ (Facebook: Link direkt im Text möglich).

Kanäle:
- Instagram-Caption: fesselnde erste Zeile, Absätze, 5–15 Hashtags separat.
- Facebook-Text: persönlicher und etwas ausführlicher, höchstens 3 Hashtags, Frage an die Community.

Regeln für gute Reels und Folien:
- Szene 1 ist ein starker Hook, der in unter 2 Sekunden neugierig macht.
- Kurze, gut lesbare Texte – eine Aussage pro Szene. Kein Fließtext. Keine Emojis im Bildschirmtext (in der Caption sind sie erlaubt).
- Die Dauer jeder Szene richtet sich nach der Lesezeit (ca. 3 Wörter pro Sekunde + 1 Sekunde).
- Die letzte Szene ist ein klarer Call-to-Action (z. B. speichern, teilen, folgen, Link in Bio).
- Die Musikstimmung passt zur Botschaft.
- Die Caption vertieft den Inhalt, beginnt mit einer fesselnden ersten Zeile und endet mit einer Frage oder einem CTA.
- Schreibe in der Sprache der Vorgabe (Standard: Deutsch).`;

const system = () => `Du bist ein erfahrener Social-Media-Creator und schreibst Inhalte für Instagram und Facebook: Reels im Text-on-Screen-Stil, Bildbeiträge und Karussells.

${brandContext()}

${REEL_RULES}`;

// Neuer Client pro Aufruf, damit ein in der App geänderter API-Key sofort greift
export const getClient = () => new Anthropic();

export const hasClaude = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/**
 * @param {object} input
 * @param {string} input.brief       Worum geht es?
 * @param {string} [input.format]    reel | image | carousel
 * @param {number} [input.duration]  Ziel-Länge in Sekunden (nur Reel)
 * @param {string} [input.mood]      gewünschte Musikstimmung oder "auto" (nur Reel)
 * @param {string} [input.goal]      Ziel des CTA (siehe GOALS)
 * @param {string} [input.style]     zusätzliche Stilwünsche
 */
export async function planContent({ brief, format = "reel", duration = 20, mood = "auto", goal = "", style = "" }) {
  if (!brief?.trim()) throw new Error("Bitte beschreibe den Inhalt.");
  if (!FORMATS[format]) format = "reel";
  if (!hasClaude()) return normalizePlan(fallbackPlan({ brief, duration, mood, format }), { mood });

  const userPrompt = [
    `Format: ${FORMATS[format]}.`,
    `Inhalt:\n${brief.trim()}`,
    format === "reel" ? `Ziel-Länge: ca. ${duration} Sekunden (Summe der Szenendauern).` : "",
    format === "reel" ? (mood && mood !== "auto" ? `Musikstimmung: ${mood}.` : "Wähle die passende Musikstimmung selbst.") : "",
    GOALS[goal] ? `Ziel des Call-to-Action: ${GOALS[goal]}.` : "",
    style ? `Stilwünsche: ${style}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await getClient().beta.messages.create({
    model: model(),
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: PLAN_SCHEMA } },
    system: system(),
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude hat diese Anfrage abgelehnt. Bitte formuliere den Inhalt um.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Die Antwort war zu lang und wurde abgeschnitten. Bitte versuche es erneut.");
  }
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  let plan;
  try {
    plan = JSON.parse(text);
  } catch {
    throw new Error("Claude hat kein gültiges Drehbuch geliefert. Bitte versuche es erneut.");
  }
  return normalizePlan({ ...plan, format }, { mood });
}

/** Alter Name – Reels sind ein Format von vielen. */
export const planReel = (input) => planContent({ ...input, format: "reel" });

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);

/** Bereinigt ein (auch manuell bearbeitetes) Drehbuch, damit das Rendering sicher funktioniert. */
export function normalizePlan(plan, { mood } = {}) {
  const format = FORMATS[plan?.format] ? plan.format : "reel";
  const subMax = format === "reel" ? 160 : 320;
  let scenes = (Array.isArray(plan?.scenes) ? plan.scenes : [])
    .map((s, i, arr) => ({
      text: String(s?.text ?? "").trim().slice(0, 160),
      subtext: String(s?.subtext ?? "").trim().slice(0, subMax),
      duration: clamp(s?.duration, 1.5, 10, 3),
      role: ["hook", "body", "cta"].includes(s?.role) ? s.role : i === 0 ? "hook" : i === arr.length - 1 ? "cta" : "body",
    }))
    .filter((s) => s.text);
  scenes = scenes.slice(0, format === "image" ? 1 : format === "carousel" ? 10 : 12);
  if (!scenes.length) throw new Error("Das Drehbuch enthält keine Szenen.");

  const p = plan.palette ?? {};
  const musicMood = mood && mood !== "auto" && MOODS[mood] ? mood : MOODS[plan.music?.mood] ? plan.music.mood : "calm";
  return {
    title: String(plan.title ?? FORMATS[format]).slice(0, 100),
    format,
    scenes,
    music: {
      mood: musicMood,
      bpm: clamp(plan.music?.bpm || NaN, 55, 140, MOODS[musicMood].bpm),
      key: /^[A-G]#?$/.test(plan.music?.key ?? "") ? plan.music.key : "D",
    },
    palette: {
      background: HEX.test(p.background) ? p.background : "#FAF6F4",
      backgroundAlt: HEX.test(p.backgroundAlt) ? p.backgroundAlt : "#F3ECE9",
      text: HEX.test(p.text) ? p.text : "#5C3A46",
      accent: HEX.test(p.accent) ? p.accent : "#B5808F",
    },
    caption: String(plan.caption ?? "").slice(0, 2000),
    hashtags: (Array.isArray(plan.hashtags) ? plan.hashtags : [])
      .map((h) => String(h).replace(/[#\s]/g, ""))
      .filter(Boolean)
      .slice(0, 30),
    facebook_text: String(plan.facebook_text ?? "").slice(0, 5000),
  };
}

/** Einfacher Offline-Plan ohne KI: teilt die Vorgabe in Sätze auf. */
function fallbackPlan({ brief, duration, mood, format }) {
  const sentences = brief
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const body = sentences.length ? sentences : [brief.trim()];
  const scenes = [
    { text: body[0], subtext: "", role: "hook" },
    ...body.slice(1).map((t) => ({ text: t, subtext: "", role: "body" })),
    { text: "Speichere dir diesen Reminder", subtext: process.env.BRAND_HANDLE || "@_seelenwende", role: "cta" },
  ];
  const per = Math.max(2.5, duration / scenes.length);
  return {
    title: body[0].slice(0, 60),
    format,
    scenes: format === "image" ? [{ text: body[0], subtext: body.slice(1).join(" "), role: "hook", duration: 3 }] : scenes.map((s) => ({ ...s, duration: per })),
    music: { mood: mood !== "auto" ? mood : "calm", bpm: 0, key: "D" },
    palette: {},
    caption: brief.trim(),
    facebook_text: brief.trim(),
    hashtags: ["seelenwende", "selbstliebe", "achtsamkeit", "persönlichkeitsentwicklung", "innereruhe"],
  };
}
