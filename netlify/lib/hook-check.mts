import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const STORE_NAME = "hook-check";
export const MODEL = "claude-opus-5";

/* ---------- Eingabe ---------- */

export const InputSchema = z.object({
  topic: z.string().max(120).default(""),
  audience: z.string().max(200).default(""),
  pillars: z.string().max(300).default(""),
  name: z.string().max(120).default(""),
  bio: z.string().max(400).default(""),
  link: z.string().max(300).default(""),
  linkType: z.string().max(40).default(""),
  posts: z
    .array(
      z.object({
        type: z.enum(["Post", "Karussell", "Reel"]).default("Post"),
        pillar: z.string().max(120).optional(),
        text: z.string().max(2400),
      }),
    )
    .max(15)
    .default([]),
});
export type HookCheckInput = z.infer<typeof InputSchema>;

/* ---------- Ergebnis ---------- */

const LEVERS = ["Zahl", "Zeitrahmen", "Echte Erfahrung", "Konkretes Gefühl/Problem", "Neugier-Lücke"] as const;

export const ResultSchema = z.object({
  overall_score: z.number().describe("Gesamtscore 0-100"),
  headline: z.string().describe("Ein kurzer Satz als Urteil, z. B. 'Solide Basis, die Hooks verpuffen.'"),
  summary: z.string().describe("2-3 Sätze Gesamteinschätzung"),
  top_priorities: z.array(z.string()).describe("Die 3 wichtigsten nächsten Schritte, konkret und in Reihenfolge"),
  profile: z.object({
    score: z.number(),
    weaknesses: z.array(z.string()),
    strengths: z.array(z.string()),
    link_assessment: z.string().describe("Führt der Link zu einem Lead-Magneten oder direkt zum teuren Angebot?"),
    rewrite_name: z.string().describe("Vorschlag fürs Namensfeld, max. 64 Zeichen"),
    rewrite_bio: z.string().describe("Vorschlag für die Bio, max. 150 Zeichen, mit Zeilenumbrüchen"),
  }),
  grid: z.object({
    score: z.number(),
    assessment: z.string().describe("Wirken die Posts wie eine Positionierung oder wie verschiedene Themen?"),
    off_topic_posts: z.array(z.number()).describe("Nummern der Posts, die nicht zur Positionierung passen"),
  }),
  posts: z.array(
    z.object({
      post_number: z.number().describe("Nummer des Posts wie in der Eingabe (1-basiert)"),
      hook: z.string().describe("Der Hook, wörtlich aus der Eingabe"),
      score: z.number().describe("Hook-Score 0-100"),
      levers_used: z.array(z.enum(LEVERS)),
      cta_rating: z.enum(["gut", "schwach", "fehlt"]),
      uses_comment_to_dm: z.boolean(),
      cta_comment: z.string(),
      weaknesses: z.array(z.string()),
      strengths: z.array(z.string()),
      rewrite_hook: z.string().describe("Fertig umgeschriebener Hook zum Kopieren"),
      rewrite_cta: z.string().describe("Fertig umgeschriebener CTA zum Kopieren"),
    }),
  ),
});
export type HookCheckResult = z.infer<typeof ResultSchema>;

/* ---------- Prompt ---------- */

const SYSTEM_PROMPT = `Du bist eine erfahrene Instagram-Copywriterin und prüfst Profile von Coaches und Selbsthilfe-Anbieterinnen. Du bekommst Namensfeld, Bio, Link und die Captions der letzten Posts eines Accounts und lieferst eine ehrliche, konkrete Bewertung mit Umschreibungen, die man direkt kopieren kann. Sprache: Deutsch, per Du, warm aber klar – keine Floskeln, kein Schönreden.

So bewertest du:

Profil (Namensfeld, Bio, Link)
- Das Namensfeld ist durchsuchbar (anders als der @handle). Enthält es neben dem Namen einen Suchbegriff, nach dem die Zielgruppe sucht?
- Sagt die Bio, wem die Person wobei hilft – oder nur, wer sie ist? Besucherinnen entscheiden in etwa drei Sekunden.
- Gibt es ein erkennbares Ergebnis/Versprechen und am Ende eine klare Handlungsaufforderung zum Link?
- Der Link: Führt er zu einem kostenlosen ersten Schritt (Lead-Magnet) oder direkt zum teuren Angebot? Fremde sind selten sofort kaufbereit.

Hooks (die erste Zeile jeder Caption; bei Reels der Text-Hook im Video, falls angegeben)
- Bewerte nach fünf Spezifitäts-Hebeln: Zahl, Zeitrahmen, echte Erfahrung, konkretes Gefühl/Problem der Zielgruppe, Neugier-Lücke. Ein Hook, der von jedem anderen Account stammen könnte, ist schwach – egal wie schön er klingt.
- Abzüge für Begrüßungen und Ankündigungen („Schön, dich kennen zu lernen“, „Neuer Post“), vage Superlative („Gold wert“, „bestes ever“), zu lange erste Zeilen (über ca. 70 Zeichen wird es beim Scrollen abgeschnitten).
- Score 0-100: unter 40 = verpufft, 40-64 = ausbaufähig, ab 65 = stark, ab 85 nur für wirklich herausragende Hooks.

CTA (Ende der Caption)
- „gut“: genau eine klare Aufforderung. Besonders stark ist ein Kommentar-zu-DM-Trigger („Kommentiere JOURNAL und ich schick dir …“), weil Kommentare und Gespräche entstehen.
- „schwach“: nur „Was meint ihr?“/Like-Bitte, oder mehrere Aufforderungen gleichzeitig (kommentieren, folgen, Link in Bio …) – das verwässert.
- „fehlt“: die Caption endet einfach.

Grid-Konsistenz
- Wirken die Posts zusammen wie eine klare Positionierung oder wie viele verschiedene Themen nebeneinander? Nutze die angegebenen Content-Säulen, falls vorhanden.

Umschreibungen
- Schreib in der Tonalität des Accounts (lies sie aus Bio und Captions) und passend zu Thema und Zielgruppe.
- Erfinde keine Fakten über die Person. Wo ein konkretes Detail nötig wäre, das du nicht kennst (Zahl, Zeitraum, Erlebnis), setze einen Platzhalter in eckigen Klammern, z. B. „Vor [X] Jahren …“.
- rewrite_bio höchstens 150 Zeichen, rewrite_name höchstens 64 Zeichen.
- Bei sensiblen Themen (Trennung, Selbstwert, psychische Belastung): keine Heilsversprechen, nichts, was Therapie ersetzen will.

Allgemein
- Schwächen und Stärken: kurze, konkrete Sätze mit Bezug auf den tatsächlichen Text. Lieber 2 treffende Punkte als 5 allgemeine.
- Gib für jeden eingereichten Post genau einen Eintrag in posts zurück, mit post_number wie in der Eingabe.
- overall_score ist deine Gesamteinschätzung (nicht zwingend der Durchschnitt), gewichtet nach dem, was gerade am meisten Kundinnen kostet.
- Fehlen Angaben (z. B. keine Bio), bewerte das als Schwäche statt zu raten.`;

const LINK_TYPES: Record<string, string> = {
  freebie: "direkt zu einem kostenlosen Angebot (Freebie/Lead-Magnet)",
  linkpage: "zu einer Linkseite, Freebie steht ganz oben",
  "linkpage-mixed": "zu einer Linkseite, Freebie nicht oben oder keins vorhanden",
  offer: "direkt zum bezahlten Angebot/Shop",
  other: "zu etwas anderem (z. B. Website-Startseite)",
};

function buildUserMessage(input: HookCheckInput): string {
  const posts = input.posts
    .filter((p) => p.text.trim())
    .map(
      (p, i) =>
        `<post nummer="${i + 1}" format="${p.type}"${p.pillar ? ` saeule="${p.pillar}"` : ""}>\n${p.text.trim()}\n</post>`,
    )
    .join("\n\n");
  return `Bitte prüfe dieses Instagram-Profil.

<angaben>
Thema: ${input.topic || "(nicht angegeben)"}
Zielgruppe: ${input.audience || "(nicht angegeben)"}
Content-Säulen: ${input.pillars || "(nicht angegeben)"}
</angaben>

<profil>
Namensfeld: ${input.name || "(leer)"}
Bio:
${input.bio || "(leer)"}
Link: ${input.link || "(kein Link)"}
Link führt laut Inhaberin: ${LINK_TYPES[input.linkType] ?? "(nicht angegeben)"}
</profil>

<posts>
${posts || "(keine Posts eingereicht)"}
</posts>`;
}

/* ---------- Analyse ---------- */

export async function runAnalysis(input: HookCheckInput): Promise<HookCheckResult> {
  const client = new Anthropic({ apiKey: Netlify.env.get("ANTHROPIC_API_KEY") });

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: betaZodOutputFormat(ResultSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Die KI hat diese Anfrage abgelehnt. Bitte prüfe die eingefügten Texte.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Die Antwort war zu lang. Bitte weniger Posts auf einmal prüfen.");
  }
  if (!response.parsed_output) {
    throw new Error("Die KI-Antwort konnte nicht gelesen werden. Bitte noch einmal versuchen.");
  }
  return response.parsed_output;
}

/* ---------- Hilfsfunktionen ---------- */

export function checkAccessCode(given: unknown): boolean {
  const expected = Netlify.env.get("HOOKCHECK_ACCESS_CODE");
  if (!expected || typeof given !== "string") return false;
  const a = createHash("sha256").update(given.trim()).digest();
  const b = createHash("sha256").update(expected.trim()).digest();
  return timingSafeEqual(a, b);
}

export function isConfigured(): boolean {
  return Boolean(Netlify.env.get("ANTHROPIC_API_KEY") && Netlify.env.get("HOOKCHECK_ACCESS_CODE"));
}

export const ID_PATTERN = /^[0-9a-f-]{36}$/;

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Der API-Schlüssel ist ungültig. Bitte in Netlify prüfen.";
  if (err instanceof Anthropic.RateLimitError) return "Gerade zu viele Anfragen – bitte in einer Minute noch einmal.";
  if (err instanceof Anthropic.BadRequestError) return "Die Anfrage wurde abgelehnt (ungültige Eingabe oder Guthaben aufgebraucht).";
  if (err instanceof Anthropic.APIError) return `Die KI ist gerade nicht erreichbar (Fehler ${err.status}). Bitte später noch einmal.`;
  if (err instanceof Error) return err.message;
  return "Unbekannter Fehler.";
}
