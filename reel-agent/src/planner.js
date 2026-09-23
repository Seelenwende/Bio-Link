// Reel-Planer: verwandelt eine inhaltliche Vorgabe in ein Reel-Drehbuch
// (Szenen, Texte, Musikstimmung, Farben, Caption, Hashtags) – mit Claude.

import Anthropic from "@anthropic-ai/sdk";
import { MOODS } from "./music.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "scenes", "music", "palette", "caption", "hashtags"],
  properties: {
    title: { type: "string", description: "Interner Arbeitstitel des Reels" },
    scenes: {
      type: "array",
      description: "3 bis 10 Szenen. Die erste Szene ist der Hook, die letzte ein Call-to-Action.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "subtext", "duration", "role"],
        properties: {
          text: { type: "string", description: "Haupttext auf dem Bildschirm, maximal ca. 12 Wörter" },
          subtext: { type: "string", description: "Optionale kleine Zeile darunter, sonst leerer String" },
          duration: { type: "number", description: "Anzeigedauer in Sekunden (2 bis 7)" },
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
  },
};

const SYSTEM = `Du bist ein erfahrener Social-Media-Creator und schreibst Drehbücher für Instagram-Reels im Text-on-Screen-Stil.

Marke: ${process.env.BRAND_NAME || "Seelenwende"} (${process.env.BRAND_HANDLE || "@_seelenwende"}).
Markenstimme: ${process.env.BRAND_VOICE || "warm, achtsam, ermutigend, nahbar – Themen rund um Selbstfindung, innere Ruhe und persönliche Wandlung. Sprich die Zuschauer mit 'du' an."}
Markenfarben (wenn nichts anderes gewünscht): Papier #FAF6F4, Sand #F3ECE9, Rosé #B5808F, Beere #8C5A69, Pflaume #5C3A46.

Regeln für gute Reels:
- Szene 1 ist ein starker Hook, der in unter 2 Sekunden neugierig macht.
- Kurze, gut lesbare Texte – eine Aussage pro Szene. Kein Fließtext. Keine Emojis im Bildschirmtext (in der Caption sind sie erlaubt).
- Die Dauer jeder Szene richtet sich nach der Lesezeit (ca. 3 Wörter pro Sekunde + 1 Sekunde).
- Die letzte Szene ist ein klarer Call-to-Action (z. B. speichern, teilen, folgen, Link in Bio).
- Die Musikstimmung passt zur Botschaft.
- Die Caption vertieft den Inhalt, beginnt mit einer fesselnden ersten Zeile und endet mit einer Frage oder einem CTA.
- Schreibe in der Sprache der Vorgabe (Standard: Deutsch).`;

let client;
const getClient = () => (client ??= new Anthropic());

export const hasClaude = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/**
 * @param {object} input
 * @param {string} input.brief       Worum geht es im Reel?
 * @param {number} [input.duration]  Ziel-Länge in Sekunden
 * @param {string} [input.mood]      gewünschte Musikstimmung oder "auto"
 * @param {string} [input.style]     zusätzliche Stilwünsche
 */
export async function planReel({ brief, duration = 20, mood = "auto", style = "" }) {
  if (!brief?.trim()) throw new Error("Bitte beschreibe den Inhalt des Reels.");
  if (!hasClaude()) return normalizePlan(fallbackPlan({ brief, duration, mood }), { duration, mood });

  const userPrompt = [
    `Inhalt des Reels:\n${brief.trim()}`,
    `Ziel-Länge: ca. ${duration} Sekunden (Summe der Szenendauern).`,
    mood && mood !== "auto" ? `Musikstimmung: ${mood}.` : "Wähle die passende Musikstimmung selbst.",
    style ? `Stilwünsche: ${style}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: PLAN_SCHEMA } },
    system: SYSTEM,
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
  return normalizePlan(plan, { duration, mood });
}

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);

/** Bereinigt ein (auch manuell bearbeitetes) Drehbuch, damit das Rendering sicher funktioniert. */
export function normalizePlan(plan, { mood } = {}) {
  const scenes = (Array.isArray(plan?.scenes) ? plan.scenes : [])
    .map((s, i, arr) => ({
      text: String(s?.text ?? "").trim().slice(0, 160),
      subtext: String(s?.subtext ?? "").trim().slice(0, 160),
      duration: clamp(s?.duration, 1.5, 10, 3),
      role: ["hook", "body", "cta"].includes(s?.role) ? s.role : i === 0 ? "hook" : i === arr.length - 1 ? "cta" : "body",
    }))
    .filter((s) => s.text)
    .slice(0, 12);
  if (!scenes.length) throw new Error("Das Drehbuch enthält keine Szenen.");

  const p = plan.palette ?? {};
  const musicMood = mood && mood !== "auto" && MOODS[mood] ? mood : MOODS[plan.music?.mood] ? plan.music.mood : "calm";
  return {
    title: String(plan.title ?? "Reel").slice(0, 100),
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
  };
}

/** Einfacher Offline-Plan ohne KI: teilt die Vorgabe in Sätze auf. */
function fallbackPlan({ brief, duration, mood }) {
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
    scenes: scenes.map((s) => ({ ...s, duration: per })),
    music: { mood: mood !== "auto" ? mood : "calm", bpm: 0, key: "D" },
    palette: {},
    caption: brief.trim(),
    hashtags: ["seelenwende", "selbstliebe", "achtsamkeit", "persönlichkeitsentwicklung", "innereruhe"],
  };
}
