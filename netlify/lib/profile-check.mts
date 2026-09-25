import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { MODEL } from "./common.mts";
import type { IgProfile } from "./instagram.mts";

/* Die Punkte des Profil-Checks – dieselben wie in der manuellen Checkliste auf profil-check.html */
const CHECKLIST: { area: string; points: string[] }[] = [
  {
    area: "Erster Eindruck",
    points: [
      "Profilbild ist auch winzig klein klar erkennbar",
      "Namensfeld enthält einen Suchbegriff, nicht nur den Namen",
      "Username ist leicht zu merken, zu schreiben und passt zur Marke",
      "Professionelles Konto mit passender Kategorie",
    ],
  },
  {
    area: "Bio",
    points: [
      "Erste Zeile sagt klar, wem geholfen wird und wobei",
      "Man versteht, welches Ergebnis / welche Veränderung angeboten wird",
      "Persönlichkeit und Ton sind spürbar",
      "Bio endet mit einer klaren Handlungsaufforderung zum Link",
      "Bio ist leicht lesbar: Zeilenumbrüche, wenige Emojis, keine Hashtag-Wand",
    ],
  },
  {
    area: "Link in Bio",
    points: [
      "Link führt zu einer übersichtlichen, mobilen Linkseite",
      "Ganz oben steht der wichtigste nächste Schritt (z. B. Freebie)",
      "Höchstens 5–6 Links – keine Auswahl-Überforderung",
      "Jeder Link sagt, was die Person bekommt (nicht nur „Shop“)",
    ],
  },
  {
    area: "Story-Highlights",
    points: [
      "Highlights mit klarem Zweck (Über mich, Angebote, Stimmen …)",
      "„Start hier“ / „Über mich“-Highlight mit der eigenen Geschichte",
      "Highlight-Cover sind einheitlich gestaltet",
      "Highlights sind aktuell (keine alten Aktionen/Preise)",
    ],
  },
  {
    area: "Feed & Inhalte",
    points: [
      "3 angepinnte Beiträge, die die Person und ihr Angebot erklären",
      "Man erkennt auf einen Blick 3–4 Hauptthemen",
      "Feed hat einen wiedererkennbaren visuellen Stil",
      "Regelmäßig posten (mind. 2–3× pro Woche)",
      "Zeigt sich als Mensch (Gesicht, Stimme, eigene Erfahrungen)",
    ],
  },
  {
    area: "Vertrauen & Angebot",
    points: [
      "Kundenstimmen / Erfahrungen sind leicht zu finden",
      "Angebot wird regelmäßig in Posts erwähnt",
      "Neue Followerinnen bekommen einen einfachen ersten Schritt (Freebie)",
      "Wichtige Hinweise sind sichtbar (z. B. „ersetzt keine Therapie“)",
    ],
  },
];

const ProfileResultSchema = z.object({
  overall_score: z.number().describe("Gesamtscore 0-100"),
  headline: z.string().describe("Ein kurzer Satz als Urteil"),
  summary: z.string().describe("2-3 Sätze Gesamteinschätzung"),
  top_priorities: z.array(z.string()).describe("Die 3 wichtigsten nächsten Schritte, konkret und in Reihenfolge"),
  areas: z.array(
    z.object({
      area: z.string().describe("Name des Bereichs wie in der Checkliste"),
      score: z.number().describe("0-100; bei komplett nicht prüfbaren Bereichen -1"),
      items: z.array(
        z.object({
          point: z.string().describe("Der Prüfpunkt wie in der Checkliste"),
          rating: z.enum(["gut", "ausbaufähig", "fehlt", "nicht prüfbar"]),
          finding: z.string().describe("Was du konkret siehst – mit Bezug auf das echte Profil"),
          suggestion: z.string().describe("Konkreter Verbesserungsvorschlag, möglichst direkt umsetzbar oder zum Kopieren"),
        }),
      ),
    }),
  ),
  rewrite_name: z.string().describe("Vorschlag fürs Namensfeld, max. 64 Zeichen"),
  rewrite_bio: z.string().describe("Vorschlag für die Bio, max. 150 Zeichen, mit Zeilenumbrüchen"),
  posts: z.array(
    z.object({
      post_number: z.number(),
      hook: z.string().describe("Erste Zeile der Caption, wörtlich"),
      score: z.number().describe("Hook-Score 0-100"),
      cta_rating: z.enum(["gut", "schwach", "fehlt"]),
      uses_comment_to_dm: z.boolean(),
      weaknesses: z.array(z.string()),
      rewrite_hook: z.string(),
      rewrite_cta: z.string(),
    }),
  ),
});
export type ProfileResult = z.infer<typeof ProfileResultSchema>;

const SYSTEM_PROMPT = `Du bist eine erfahrene Instagram-Strategin und Copywriterin für Coaches und Selbsthilfe-Anbieterinnen. Du bekommst die öffentlichen Daten eines Instagram-Profils (Name, Bio, Link, Kennzahlen, die letzten Posts mit Captions und Bildern, das Profilbild und – falls abrufbar – den Text der verlinkten Seite) und prüfst es Punkt für Punkt gegen eine feste Checkliste. Sprache: Deutsch, per Du, warm aber klar – keine Floskeln, kein Schönreden.

Checkliste (bewerte jeden Punkt genau einmal, in dieser Reihenfolge, Bereichs- und Punktnamen wie hier):
${CHECKLIST.map((a) => `\n${a.area}\n${a.points.map((p) => `- ${p}`).join("\n")}`).join("\n")}

Bewertung pro Punkt
- rating: „gut“, „ausbaufähig“, „fehlt“ oder „nicht prüfbar“. Nur Dinge, die in den Daten nicht enthalten sind, sind „nicht prüfbar“: Story-Highlights, angepinnte Beiträge und Stories liefert die Schnittstelle nicht; die Kategorie des Kontos auch nicht. Rate nicht.
- finding: was du tatsächlich siehst, mit konkretem Bezug (Zitat aus der Bio, Post-Nummer, Bildbeschreibung). Bei „nicht prüfbar“ kurz sagen, warum.
- suggestion: ein konkreter, sofort umsetzbarer Verbesserungsvorschlag – wenn möglich als fertiger Text zum Kopieren oder als klare Anleitung (z. B. welche 5 Highlights mit welchen Titeln). Auch bei „gut“ einen kleinen nächsten Feinschliff nennen. Bei „nicht prüfbar“: was die Person selbst prüfen soll und wie „gut“ aussieht.
- score pro Bereich 0-100 aus den prüfbaren Punkten; ist kein Punkt prüfbar, -1.

Hooks der Posts (erste Zeile der Caption)
- Bewerte nach fünf Spezifitäts-Hebeln: Zahl, Zeitrahmen, echte Erfahrung, konkretes Gefühl/Problem der Zielgruppe, Neugier-Lücke. Abzüge für Begrüßungen/Ankündigungen, vage Superlative, erste Zeilen über ca. 70 Zeichen.
- CTA: „gut“ = genau eine klare Aufforderung (besonders stark: Kommentar-zu-DM mit Stichwort); „schwach“ = nur „Was meint ihr?“/Like-Bitte oder mehrere Aufforderungen gleichzeitig; „fehlt“ = Caption endet einfach.
- Nutze Likes/Kommentare als Hinweis, was bei dieser Community funktioniert, aber bewerte die Texte.
- Gib für jeden Post genau einen Eintrag zurück, post_number wie in den Daten.

Umschreibungen
- In der Tonalität des Accounts, passend zu Thema und Zielgruppe, die du aus Bio und Posts ableitest.
- Erfinde keine Fakten über die Person. Wo ein konkretes Detail fehlt (Zahl, Zeitraum, Erlebnis, Name eines Freebies), setze einen Platzhalter in eckigen Klammern.
- rewrite_bio höchstens 150 Zeichen, rewrite_name höchstens 64 Zeichen.
- Bei sensiblen Themen (Trennung, Selbstwert, psychische Belastung): keine Heilsversprechen, nichts, was Therapie ersetzen will.

overall_score ist deine Gesamteinschätzung, gewichtet nach dem, was gerade am meisten Followerinnen und Kundinnen kostet. top_priorities: die drei Änderungen mit der größten Wirkung.`;

/* ---------- Eingabe für Claude bauen ---------- */

async function fetchImage(url: string | null): Promise<Anthropic.Beta.BetaImageBlockParam | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_500_000) return null;
    return {
      type: "image",
      source: { type: "base64", media_type: type as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: buf.toString("base64") },
    };
  } catch {
    return null;
  }
}

async function fetchLinkPageText(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) url = url ? `https://${url}` : "";
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "follow" });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return null;
    const html = (await res.text()).slice(0, 400_000);
    const text = html
      .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<a\b[^>]*>/gi, "\n[Link] ")
      .replace(/<\/(p|div|li|h\d|a|section|header|footer)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();
    return text.slice(0, 6000) || null;
  } catch {
    return null;
  }
}

const fmt = (n: number | null) => (n === null ? "unbekannt" : n.toLocaleString("de-DE"));

async function buildContent(p: IgProfile): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
  const [avatar, linkText, ...postImages] = await Promise.all([
    fetchImage(p.profilePictureUrl),
    fetchLinkPageText(p.website),
    ...p.posts.slice(0, 9).map((post) => fetchImage(post.imageUrl)),
  ]);

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (avatar) content.push({ type: "text", text: "Profilbild:" }, avatar);
  postImages.forEach((img, i) => {
    if (img) content.push({ type: "text", text: `Bild von Post ${i + 1}:` }, img);
  });

  const posts = p.posts
    .map(
      (post, i) =>
        `<post nummer="${i + 1}" format="${post.type}" datum="${post.timestamp.slice(0, 10)}" likes="${fmt(post.likes)}" kommentare="${fmt(post.comments)}">\n${post.caption.trim() || "(keine Caption)"}\n</post>`,
    )
    .join("\n\n");

  content.push({
    type: "text",
    text: `Bitte prüfe dieses Instagram-Profil.

<profil>
Username: @${p.username}
Namensfeld: ${p.name || "(leer)"}
Bio:
${p.biography || "(leer)"}
Link: ${p.website || "(kein Link)"}
Follower: ${fmt(p.followers)} · folgt: ${fmt(p.following)} · Beiträge gesamt: ${fmt(p.mediaCount)}
</profil>

<verlinkte_seite>
${linkText ?? "(konnte nicht abgerufen werden)"}
</verlinkte_seite>

<posts anzahl="${p.posts.length}" hinweis="neueste zuerst; Bilder oben für die ersten ${Math.min(9, p.posts.length)} Posts">
${posts || "(keine Posts)"}
</posts>`,
  });
  return content;
}

/* ---------- Analyse ---------- */

export async function runProfileAnalysis(profile: IgProfile): Promise<ProfileResult> {
  const client = new Anthropic({ apiKey: Netlify.env.get("ANTHROPIC_API_KEY") });

  // Streaming, weil die Antwort lang werden kann (26 Punkte + Posts + Denkzeit)
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: betaZodOutputFormat(ProfileResultSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: await buildContent(profile) }],
  });
  const response = await stream.finalMessage();

  if (response.stop_reason === "refusal") throw new Error("Die KI hat diese Anfrage abgelehnt.");
  if (response.stop_reason === "max_tokens") throw new Error("Die Antwort war zu lang. Bitte noch einmal versuchen.");
  if (!response.parsed_output) throw new Error("Die KI-Antwort konnte nicht gelesen werden. Bitte noch einmal versuchen.");
  return response.parsed_output;
}
