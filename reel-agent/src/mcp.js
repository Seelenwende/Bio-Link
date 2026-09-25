#!/usr/bin/env node
// MCP-Server: macht den Social-Media-Agenten als Werkzeugkasten für Claude verfügbar
// (Claude Desktop, Claude Code …). Claude schreibt die Inhalte (Hook, Szenen/Folien, CTA, Texte),
// dieser Server gestaltet Reels, Bildbeiträge und Karussells und veröffentlicht bzw. plant sie
// auf Instagram und Facebook.
//
// Wichtig: stdout gehört dem MCP-Protokoll – alle Logs gehen nach stderr.

import "./env.js";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadSettings, saveSettings } from "./settings.js";
import { brandContext, REEL_RULES, normalizePlan, FORMATS, GOALS } from "./planner.js";
import { MOODS } from "./music.js";
import { totalDuration } from "./render.js";
import { lookupAccount } from "./instagram.js";
import { lookupPage } from "./facebook.js";
import {
  TZ, createReel, getReel, listReels, publishNow, addSchedule, listSchedule, cancelSchedule,
  captionFor, facebookTextFor, parseLocalTime, formatLocal, startScheduler, mediaFiles, connectedChannels, CHANNELS,
} from "./reels.js";

console.log = console.error;
await loadSettings();

const server = new McpServer({ name: "seelenwende-social-agent", version: "2.0.0" });

const text = (t) => ({ type: "text", text: t });
const ok = (...content) => ({ content });
const fail = (e) => ({ content: [text(`Fehler: ${e.message ?? e}`)], isError: true });
const safe = (fn) => async (args) => {
  try {
    return await fn(args ?? {});
  } catch (e) {
    return fail(e);
  }
};

const channelList = () => connectedChannels().map((c) => CHANNELS[c]).join(", ") || "keine";

function describe(item) {
  const kind = item.format === "reel" ? `${item.duration.toFixed(1)} Sek.` : `${item.slides.length} Bild${item.slides.length > 1 ? "er" : ""}`;
  const pubs = Object.entries(item.publications ?? {}).map(([c, p]) => `${CHANNELS[c]}: ${formatLocal(p.at)}${p.permalink ? ` – ${p.permalink}` : ""}`);
  return (
    `${FORMATS[item.format]} „${item.plan.title}“ · ${kind} · ID ${item.id}\n` +
    `Dateien: ${mediaFiles(item).join(", ")}` +
    (pubs.length ? `\nVeröffentlicht – ${pubs.join(" · ")}` : "")
  );
}

/** Vorschaubilder für Claude: Reel-Standbild bzw. bis zu 4 Folien. */
async function previews(item) {
  const files = item.format === "reel" ? [mediaFiles(item)[0].replace(/\.mp4$/, ".jpg")] : mediaFiles(item).slice(0, 4);
  const out = [];
  for (const f of files) {
    try {
      out.push({ type: "image", data: (await readFile(f)).toString("base64"), mimeType: "image/jpeg" });
    } catch {
      // Vorschau ist optional
    }
  }
  return out;
}

// ---------- Werkzeuge ----------

const sceneSchema = z.object({
  text: z.string().describe("Überschrift/Haupttext, max. ca. 12 Wörter, keine Emojis"),
  subtext: z.string().optional().describe("Reel: kleine Zeile. Bild/Karussell: erklärender Text, max. ca. 40 Wörter"),
  duration: z.number().optional().describe("Nur Reel: Anzeigedauer in Sekunden (2–7, nach Lesezeit)"),
  role: z.enum(["hook", "body", "cta"]).describe("hook = erste Szene/Folie, cta = letzte"),
});

const planSchema = z.object({
  title: z.string().describe("Kurzer Arbeitstitel"),
  format: z.enum(Object.keys(FORMATS)).describe("reel = Video mit Musik, image = ein Bild, carousel = 2–10 Folien"),
  scenes: z.array(sceneSchema).min(1).max(12).describe("Reel: 3–10 Szenen · Bild: genau 1 · Karussell: 4–10 Folien"),
  music: z
    .object({
      mood: z.enum(Object.keys(MOODS)),
      bpm: z.number().optional().describe("Tempo 55–140; leer = passend zur Stimmung"),
      key: z.string().optional().describe("Grundton, z. B. D"),
    })
    .optional()
    .describe("Nur Reel"),
  palette: z
    .object({ background: z.string(), backgroundAlt: z.string(), text: z.string(), accent: z.string() })
    .partial()
    .optional()
    .describe("Hex-Farben; leer = Markenfarben"),
  caption: z.string().describe("Instagram-Caption ohne Hashtags"),
  hashtags: z.array(z.string()).describe("5–15 Hashtags ohne #"),
  facebook_text: z.string().optional().describe("Eigener Facebook-Text (persönlicher, max. 3 Hashtags); leer = aus Caption"),
});

const channelsSchema = z
  .array(z.enum(Object.keys(CHANNELS)))
  .optional()
  .describe("instagram und/oder facebook; leer = alle verbundenen");

server.registerTool(
  "content_guide",
  {
    title: "Marken- & Content-Leitfaden",
    description:
      "IMMER ZUERST aufrufen, bevor du Inhalte schreibst. Liefert Markenstimme, Farben, Regeln für Reels, Bildbeiträge und " +
      "Karussells (Hook, CTA nach Ziel, Instagram- vs. Facebook-Text), Musikstimmungen, verbundene Kanäle und die aktuelle Uhrzeit.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  safe(async () =>
    ok(
      text(
        [
          brandContext(),
          REEL_RULES,
          `Formate: ${Object.entries(FORMATS).map(([k, v]) => `${k} = ${v}`).join(", ")}. CTA-Ziele: ${Object.values(GOALS).join(", ")}.`,
          `Musikstimmungen (nur Reel, music.mood): ${Object.entries(MOODS).map(([k, v]) => `${k} = ${v.label}`).join(", ")}. ` +
            "Die Musik wird für jedes Reel neu und lizenzfrei komponiert; Titel aus der Instagram-Musikbibliothek sind über die API nicht möglich.",
          "Ablauf: 1) Bei Bedarf Ideen oder 3 Hook-Varianten anbieten, 2) Drehbuch schreiben und kurz zeigen, 3) create_post, " +
            "4) Vorschau zeigen, 5) nur nach ausdrücklicher Zustimmung publish_post oder schedule_post.",
          `Verbundene Kanäle: ${channelList()}.` +
            (connectedChannels().length < 2 ? " Fehlende Kanäle verbindet der Nutzer mit connect_instagram bzw. connect_facebook." : ""),
          "Hinweis: Bild- und Karussellbeiträge auf Instagram brauchen zusätzlich eine verbundene Facebook-Seite (oder einen Online-Server).",
          `Jetzt: ${formatLocal(new Date())} (${TZ}).`,
        ].join("\n\n"),
      ),
    ),
  ),
);

server.registerTool(
  "create_post",
  {
    title: "Beitrag erstellen (Reel, Bild, Karussell)",
    description:
      "Gestaltet aus einem Drehbuch einen fertigen Beitrag im Markendesign: Reel = Video 1080×1920 mit eigens komponierter Musik " +
      "(ca. 1–2 Minuten), Bild/Karussell = JPEG-Folien im 4:5-Format (Sekunden). Optional eigene Fotos (lokale Pfade) und Musik.",
    inputSchema: {
      plan: planSchema,
      image_paths: z.array(z.string()).optional().describe("Lokale Bildpfade (jpg/png/webp) als Hintergründe, werden reihum verwendet"),
      music_path: z.string().optional().describe("Nur Reel: lokale Musikdatei statt generierter Musik (nur mit Nutzungsrechten)"),
      show_handle: z.boolean().optional().describe("Instagram-Handle einblenden (Standard: ja)"),
    },
  },
  safe(async ({ plan, image_paths = [], music_path, show_handle = true }) => {
    const normalized = normalizePlan(plan);
    if (normalized.format === "reel" && totalDuration(normalized) > 90) throw new Error("Maximal 90 Sekunden – bitte Szenen kürzen.");
    const item = await createReel({ plan: normalized, imagePaths: image_paths, musicPath: music_path, showHandle: show_handle });
    return ok(
      text(
        `Erstellt ✅\n${describe(item)}\n\nInstagram-Caption:\n${captionFor(item.plan)}\n\nFacebook-Text:\n${facebookTextFor(item.plan)}\n\n` +
          "Zum Veröffentlichen: erst Zustimmung des Nutzers einholen, dann publish_post bzw. schedule_post.",
      ),
      ...(await previews(item)),
    );
  }),
);

server.registerTool(
  "list_posts",
  {
    title: "Gespeicherte Beiträge",
    description: "Listet die zuletzt erstellten Beiträge mit ID, Format, Dateipfaden und Veröffentlichungsstatus.",
    inputSchema: { limit: z.number().optional().describe("Anzahl, Standard 10") },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ limit = 10 }) => {
    const items = (await listReels()).slice(0, limit);
    return ok(text(items.length ? items.map(describe).join("\n\n") : "Noch keine Beiträge erstellt."));
  }),
);

server.registerTool(
  "show_post",
  {
    title: "Beitrags-Vorschau",
    description: "Zeigt Vorschaubilder, Drehbuch und Texte eines gespeicherten Beitrags.",
    inputSchema: { post_id: z.string() },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ post_id }) => {
    const r = await getReel(post_id);
    const scenes = r.plan.scenes
      .map((s, i) => `${i + 1}. [${s.role}] ${s.text}${s.subtext ? ` – ${s.subtext}` : ""}${r.format === "reel" ? ` (${s.duration}s)` : ""}`)
      .join("\n");
    return ok(
      text(`${describe(r)}\n\n${scenes}\n\nInstagram:\n${captionFor(r.plan)}\n\nFacebook:\n${facebookTextFor(r.plan)}`),
      ...(await previews(r)),
    );
  }),
);

server.registerTool(
  "publish_post",
  {
    title: "Beitrag sofort veröffentlichen",
    description:
      "Veröffentlicht einen erstellten Beitrag SOFORT öffentlich auf Instagram und/oder Facebook. Nur aufrufen, nachdem der Nutzer " +
      "ausdrücklich zugestimmt hat (Texte und Kanäle vorher zeigen).",
    inputSchema: {
      post_id: z.string(),
      channels: channelsSchema,
      caption: z.string().optional().describe("Vollständige Instagram-Caption inkl. Hashtags; leer = aus dem Drehbuch"),
      facebook_text: z.string().optional().describe("Facebook-Text; leer = aus dem Drehbuch"),
      share_to_feed: z.boolean().optional().describe("Reel auch im Instagram-Profilraster zeigen (Standard: ja)"),
    },
    annotations: { destructiveHint: false, openWorldHint: true },
  },
  safe(async ({ post_id, channels, caption, facebook_text, share_to_feed = true }) => {
    const res = await publishNow(post_id, { channels, caption, facebookText: facebook_text, shareToFeed: share_to_feed });
    const lines = Object.entries(res.results).map(([c, r]) => `✅ ${CHANNELS[c]}${r.permalink ? `: ${r.permalink}` : ""}`);
    for (const [c, m] of Object.entries(res.errors)) lines.push(`❌ ${CHANNELS[c]}: ${m}`);
    return ok(text(lines.join("\n")));
  }),
);

server.registerTool(
  "schedule_post",
  {
    title: "Beitrag einplanen",
    description:
      `Plant die Veröffentlichung eines Beitrags. Zeitpunkt als Ortszeit ${TZ} im Format JJJJ-MM-TTTHH:MM. ` +
      "Nur nach Zustimmung des Nutzers. Geplante Beiträge gehen raus, solange Claude Desktop oder die Web-App des Agenten läuft " +
      "(verpasste werden beim nächsten Start nachgeholt).",
    inputSchema: {
      post_id: z.string(),
      at: z.string().describe("z. B. 2026-09-26T18:00"),
      channels: channelsSchema,
      caption: z.string().optional(),
      facebook_text: z.string().optional(),
    },
  },
  safe(async ({ post_id, at, channels, caption, facebook_text }) => {
    if (!connectedChannels().length) throw new Error("Kein Kanal verbunden. Bitte zuerst connect_instagram oder connect_facebook.");
    const entry = await addSchedule({ reelId: post_id, at: parseLocalTime(at), channels, caption, facebookText: facebook_text });
    return ok(text(`📅 Eingeplant für ${formatLocal(entry.at)} auf ${entry.channels.map((c) => CHANNELS[c]).join(" + ")} (ID ${entry.id}).`));
  }),
);

server.registerTool(
  "list_scheduled",
  {
    title: "Geplante Beiträge",
    description: "Listet geplante und bereits ausgeführte zeitgesteuerte Beiträge.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  safe(async () => {
    const list = await listSchedule();
    return ok(
      text(
        list.length
          ? list
              .map((e) => `${formatLocal(e.at)} · ${e.title} · ${(e.channels ?? ["instagram"]).map((c) => CHANNELS[c]).join("+")} · ${e.status}${e.error ? ` (${e.error})` : ""} · ID ${e.id}`)
              .join("\n")
          : "Nichts geplant.",
      ),
    );
  }),
);

server.registerTool(
  "cancel_scheduled",
  {
    title: "Geplanten Beitrag stornieren",
    description: "Storniert einen geplanten Beitrag.",
    inputSchema: { schedule_id: z.string() },
  },
  safe(async ({ schedule_id }) => {
    await cancelSchedule(schedule_id);
    return ok(text("Storniert."));
  }),
);

server.registerTool(
  "connect_instagram",
  {
    title: "Instagram verbinden",
    description:
      "Verbindet ein Instagram-Business-/Creator-Konto per Access Token (Meta-App, Berechtigung instagram_business_content_publish). " +
      "Konto-ID und Name werden automatisch ermittelt; das Token wird danach automatisch verlängert.",
    inputSchema: {
      token: z.string(),
      login_type: z.enum(["instagram", "facebook"]).optional().describe("Standard: instagram"),
    },
  },
  safe(async ({ token, login_type = "instagram" }) => {
    const host = login_type === "facebook" ? "graph.facebook.com" : "graph.instagram.com";
    const acc = await lookupAccount(token.trim(), host);
    await saveSettings({
      IG_ACCESS_TOKEN: token.trim(),
      IG_USER_ID: acc.userId,
      IG_USERNAME: acc.username,
      IG_GRAPH_HOST: host,
      IG_TOKEN_REFRESHED_AT: new Date().toISOString(),
    });
    return ok(text(`Instagram verbunden mit @${acc.username} ✅`));
  }),
);

server.registerTool(
  "connect_facebook",
  {
    title: "Facebook-Seite verbinden",
    description:
      "Verbindet eine Facebook-Seite per Access Token (Nutzer- oder Seiten-Token mit pages_manage_posts, pages_read_engagement, " +
      "pages_show_list). Mit App-ID und App-Geheimnis wird ein dauerhaft gültiges Seiten-Token erzeugt.",
    inputSchema: {
      token: z.string(),
      page_name: z.string().optional().describe("Name der Seite, falls mehrere verwaltet werden"),
      app_id: z.string().optional(),
      app_secret: z.string().optional(),
    },
  },
  safe(async ({ token, page_name, app_id, app_secret }) => {
    const page = await lookupPage({ token, pageName: page_name, appId: app_id, appSecret: app_secret });
    await saveSettings({ FB_PAGE_ID: page.pageId, FB_PAGE_NAME: page.pageName, FB_PAGE_TOKEN: page.token });
    return ok(
      text(`Facebook-Seite „${page.pageName}“ verbunden ✅${page.others.length ? `\nWeitere Seiten: ${page.others.join(", ")} (mit page_name auswählbar)` : ""}`),
    );
  }),
);

server.registerTool(
  "set_brand",
  {
    title: "Marke einstellen",
    description: "Speichert Markenname, Instagram-Handle (wird eingeblendet) und Markenstimme.",
    inputSchema: {
      name: z.string().optional(),
      handle: z.string().optional().describe("z. B. @_seelenwende"),
      voice: z.string().optional().describe("Tonalität & Themen"),
    },
  },
  safe(async ({ name, handle, voice }) => {
    await saveSettings({ BRAND_NAME: name, BRAND_HANDLE: handle, BRAND_VOICE: voice });
    return ok(text(`Gespeichert.\n\n${brandContext()}`));
  }),
);

// ---------- Vorlagen (erscheinen in Claude im ➕-Menü) ----------

server.registerPrompt(
  "neuer_beitrag",
  {
    title: "Neuer Beitrag",
    description: "Reel, Bildbeitrag oder Karussell – von der Idee bis zum Post",
    argsSchema: {
      thema: z.string().describe("Worum geht es?"),
      format: z.string().optional().describe("Reel, Bild oder Karussell"),
      ziel: z.string().optional().describe("z. B. Follower, Speichern, Kommentare, Link in Bio"),
    },
  },
  ({ thema, format, ziel }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text:
            `Erstelle mit dem Social-Media-Agenten einen Beitrag zum Thema: ${thema}.` +
            (format ? ` Format: ${format}.` : "") +
            (ziel ? ` Ziel des CTA: ${ziel}.` : "") +
            " Lies zuerst den content_guide, schlag mir 3 Hook-Varianten vor, schreib dann das Drehbuch mit Instagram- und " +
            "Facebook-Text, erstelle den Beitrag und frag mich, ob, wo und wann er veröffentlicht werden soll.",
        },
      },
    ],
  }),
);

server.registerPrompt(
  "ideen",
  {
    title: "Content-Ideen",
    description: "Beitragsideen mit passendem Format",
    argsSchema: { thema: z.string().describe("Themenfeld, z. B. Selbstliebe") },
  },
  ({ thema }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Lies den content_guide und schlag mir 10 Beitragsideen zum Themenfeld „${thema}“ vor – je mit Format (Reel, Bild oder Karussell), Hook und CTA-Ziel.`,
        },
      },
    ],
  }),
);

startScheduler();
await server.connect(new StdioServerTransport());
console.error("Social-Media-Agent MCP-Server bereit.");
