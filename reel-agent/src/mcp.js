#!/usr/bin/env node
// MCP-Server: macht den Reel-Agenten als Werkzeugkasten für Claude verfügbar
// (Claude Desktop, Claude Code …). Claude schreibt die Inhalte (Hook, Szenen, CTA, Caption),
// dieser Server erstellt das Video mit Musik, veröffentlicht und plant auf Instagram.
//
// Wichtig: stdout gehört dem MCP-Protokoll – alle Logs gehen nach stderr.

import "./env.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadSettings, saveSettings } from "./settings.js";
import { brandContext, REEL_RULES, normalizePlan } from "./planner.js";
import { MOODS } from "./music.js";
import { totalDuration } from "./render.js";
import { isInstagramConfigured, lookupAccount } from "./instagram.js";
import {
  OUTPUT, TZ, createReel, getReel, listReels, publishNow, addSchedule, listSchedule, cancelSchedule,
  captionFor, parseLocalTime, formatLocal, startScheduler,
} from "./reels.js";

console.log = console.error;
await loadSettings();

const server = new McpServer({ name: "seelenwende-reel-agent", version: "1.0.0" });

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

const videoPath = (id) => path.join(OUTPUT, id, "reel.mp4");
const describeReel = (r) =>
  `„${r.plan.title}“ · ${r.duration.toFixed(1)} Sek. · ID ${r.id}\nDatei: ${videoPath(r.id)}` +
  (r.published ? `\nVeröffentlicht: ${formatLocal(r.published.at)}${r.published.permalink ? ` – ${r.published.permalink}` : ""}` : "");

async function thumbnail(id) {
  try {
    const data = await readFile(path.join(OUTPUT, id, "reel.jpg"));
    return [{ type: "image", data: data.toString("base64"), mimeType: "image/jpeg" }];
  } catch {
    return [];
  }
}

// ---------- Werkzeuge ----------

const sceneSchema = z.object({
  text: z.string().describe("Haupttext auf dem Bildschirm, max. ca. 12 Wörter, keine Emojis"),
  subtext: z.string().optional().describe("Optionale kleine Zeile darunter"),
  duration: z.number().describe("Anzeigedauer in Sekunden (2–7, nach Lesezeit)"),
  role: z.enum(["hook", "body", "cta"]).describe("hook = erste Szene, cta = letzte Szene"),
});

const planSchema = z.object({
  title: z.string().describe("Kurzer Arbeitstitel"),
  scenes: z.array(sceneSchema).min(1).max(12),
  music: z
    .object({
      mood: z.enum(Object.keys(MOODS)),
      bpm: z.number().optional().describe("Tempo 55–140; leer = passend zur Stimmung"),
      key: z.string().optional().describe("Grundton, z. B. D"),
    })
    .optional(),
  palette: z
    .object({
      background: z.string(),
      backgroundAlt: z.string(),
      text: z.string(),
      accent: z.string(),
    })
    .partial()
    .optional()
    .describe("Hex-Farben; leer = Markenfarben"),
  caption: z.string().describe("Instagram-Caption ohne Hashtags"),
  hashtags: z.array(z.string()).describe("5–15 Hashtags ohne #"),
});

server.registerTool(
  "reel_guide",
  {
    title: "Marken- & Reel-Leitfaden",
    description:
      "IMMER ZUERST aufrufen, bevor du Reel-Inhalte schreibst. Liefert Markenstimme, Farben, Regeln für Hook/Szenen/CTA, " +
      "verfügbare Musikstimmungen, Instagram-Status und die aktuelle Uhrzeit. Danach schreibst du das Drehbuch selbst " +
      "(Hook, Inhalt, CTA, Caption, Hashtags), zeigst es dem Nutzer und rufst create_reel auf.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  safe(async () =>
    ok(
      text(
        [
          brandContext(),
          REEL_RULES,
          `Musikstimmungen (music.mood): ${Object.entries(MOODS).map(([k, v]) => `${k} = ${v.label}`).join(", ")}. ` +
            "Die Musik wird für jedes Reel neu und lizenzfrei komponiert; Titel aus der Instagram-Musikbibliothek sind über die API nicht möglich.",
          "Ablauf: 1) Drehbuch schreiben und dem Nutzer kurz zeigen, 2) create_reel, 3) Vorschau zeigen, " +
            "4) Nur nach ausdrücklicher Zustimmung des Nutzers publish_reel oder schedule_reel.",
          "Tipp: Biete bei Bedarf 3 Hook-Varianten zur Auswahl an und richte den CTA am Ziel aus (Follower, Speichern, Kommentare, Link in Bio).",
          `Instagram verbunden: ${isInstagramConfigured() ? `ja${process.env.IG_USERNAME ? ` (@${process.env.IG_USERNAME})` : ""}` : "nein – Nutzer braucht ein Access Token, dann connect_instagram"}.`,
          `Jetzt: ${formatLocal(new Date())} (${TZ}).`,
        ].join("\n\n"),
      ),
    ),
  ),
);

server.registerTool(
  "create_reel",
  {
    title: "Reel-Video erstellen",
    description:
      "Erstellt aus einem Drehbuch ein fertiges Instagram-Reel (1080×1920 MP4) mit eigens komponierter Musik, " +
      "Markendesign und sanften Übergängen. Dauert ca. 1–2 Minuten. Optional mit eigenen Fotos (lokale Pfade) und eigener Musikdatei.",
    inputSchema: {
      plan: planSchema,
      image_paths: z.array(z.string()).optional().describe("Lokale Bildpfade (jpg/png/webp) als Hintergründe, werden reihum verwendet"),
      music_path: z.string().optional().describe("Lokale Musikdatei statt generierter Musik (nur mit Nutzungsrechten)"),
      show_handle: z.boolean().optional().describe("Instagram-Handle einblenden (Standard: ja)"),
    },
  },
  safe(async ({ plan, image_paths = [], music_path, show_handle = true }) => {
    const normalized = normalizePlan(plan);
    if (totalDuration(normalized) > 90) throw new Error("Maximal 90 Sekunden – bitte Szenen kürzen.");
    const reel = await createReel({ plan: normalized, imagePaths: image_paths, musicPath: music_path, showHandle: show_handle });
    return ok(
      text(`Reel erstellt ✅\n${describeReel(reel)}\n\nCaption-Vorschlag:\n${captionFor(reel.plan)}\n\nZum Veröffentlichen: erst Zustimmung des Nutzers einholen, dann publish_reel bzw. schedule_reel.`),
      ...(await thumbnail(reel.id)),
    );
  }),
);

server.registerTool(
  "list_reels",
  {
    title: "Gespeicherte Reels",
    description: "Listet die zuletzt erstellten Reels mit ID, Länge, Dateipfad und Veröffentlichungsstatus.",
    inputSchema: { limit: z.number().optional().describe("Anzahl, Standard 10") },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ limit = 10 }) => {
    const reels = (await listReels()).slice(0, limit);
    return ok(text(reels.length ? reels.map(describeReel).join("\n\n") : "Noch keine Reels erstellt."));
  }),
);

server.registerTool(
  "show_reel",
  {
    title: "Reel-Vorschau",
    description: "Zeigt Vorschaubild, Drehbuch und Caption eines gespeicherten Reels.",
    inputSchema: { reel_id: z.string() },
    annotations: { readOnlyHint: true },
  },
  safe(async ({ reel_id }) => {
    const r = await getReel(reel_id);
    const scenes = r.plan.scenes.map((s, i) => `${i + 1}. [${s.role}] ${s.text}${s.subtext ? ` – ${s.subtext}` : ""} (${s.duration}s)`).join("\n");
    return ok(text(`${describeReel(r)}\n\n${scenes}\n\nMusik: ${MOODS[r.plan.music.mood]?.label}\n\n${captionFor(r.plan)}`), ...(await thumbnail(r.id)));
  }),
);

server.registerTool(
  "publish_reel",
  {
    title: "Reel sofort auf Instagram posten",
    description:
      "Veröffentlicht ein erstelltes Reel SOFORT öffentlich auf Instagram. Nur aufrufen, nachdem der Nutzer " +
      "ausdrücklich zugestimmt hat (Caption vorher zeigen).",
    inputSchema: {
      reel_id: z.string(),
      caption: z.string().optional().describe("Vollständige Caption inkl. Hashtags; leer = aus dem Drehbuch"),
      share_to_feed: z.boolean().optional().describe("Auch im Profil-Raster zeigen (Standard: ja)"),
    },
    annotations: { destructiveHint: false, openWorldHint: true },
  },
  safe(async ({ reel_id, caption, share_to_feed = true }) => {
    if (!isInstagramConfigured()) throw new Error("Instagram ist nicht verbunden. Bitte zuerst connect_instagram mit einem Access Token.");
    const res = await publishNow(reel_id, { caption, shareToFeed: share_to_feed });
    return ok(text(`🎉 Veröffentlicht!${res.permalink ? ` ${res.permalink}` : ""}`));
  }),
);

server.registerTool(
  "schedule_reel",
  {
    title: "Reel-Post einplanen",
    description:
      `Plant die Veröffentlichung eines Reels. Zeitpunkt als Ortszeit ${TZ} im Format JJJJ-MM-TTTHH:MM. ` +
      "Nur nach Zustimmung des Nutzers. Hinweis: Geplante Posts gehen raus, solange Claude Desktop oder die Reel-Agent-Web-App läuft " +
      "(verpasste werden beim nächsten Start nachgeholt).",
    inputSchema: {
      reel_id: z.string(),
      at: z.string().describe("z. B. 2026-09-26T18:00"),
      caption: z.string().optional(),
      share_to_feed: z.boolean().optional(),
    },
  },
  safe(async ({ reel_id, at, caption, share_to_feed = true }) => {
    if (!isInstagramConfigured()) throw new Error("Instagram ist nicht verbunden. Bitte zuerst connect_instagram.");
    const entry = await addSchedule({ reelId: reel_id, at: parseLocalTime(at), caption, shareToFeed: share_to_feed });
    return ok(text(`📅 Eingeplant für ${formatLocal(entry.at)} (ID ${entry.id}).`));
  }),
);

server.registerTool(
  "list_scheduled",
  {
    title: "Geplante Posts",
    description: "Listet geplante und bereits ausgeführte zeitgesteuerte Posts.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  safe(async () => {
    const list = await listSchedule();
    return ok(
      text(
        list.length
          ? list.map((e) => `${formatLocal(e.at)} · ${e.title} · ${e.status}${e.error ? ` (${e.error})` : ""} · ID ${e.id}`).join("\n")
          : "Nichts geplant.",
      ),
    );
  }),
);

server.registerTool(
  "cancel_scheduled",
  {
    title: "Geplanten Post stornieren",
    description: "Storniert einen geplanten Post.",
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
      "Verbindet ein Instagram-Business-/Creator-Konto per Access Token (aus der Meta-App, Berechtigung instagram_business_content_publish). " +
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
    return ok(text(`Verbunden mit @${acc.username} ✅`));
  }),
);

server.registerTool(
  "set_brand",
  {
    title: "Marke einstellen",
    description: "Speichert Markenname, Instagram-Handle (wird im Video eingeblendet) und Markenstimme.",
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

// ---------- Vorlage (erscheint in Claude als Prompt/Slash-Befehl) ----------

server.registerPrompt(
  "neues_reel",
  {
    title: "Neues Reel",
    description: "Reel von der Idee bis zum Post",
    argsSchema: {
      thema: z.string().describe("Worum geht es?"),
      ziel: z.string().optional().describe("z. B. Follower, Speichern, Kommentare, Link in Bio"),
    },
  },
  ({ thema, ziel }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text:
            `Erstelle mit dem Reel-Agenten ein Instagram-Reel zum Thema: ${thema}.` +
            (ziel ? ` Ziel des CTA: ${ziel}.` : "") +
            " Lies zuerst den reel_guide, schlag mir 3 Hook-Varianten vor, schreib dann das Drehbuch, " +
            "erstelle das Video und frag mich, ob und wann es gepostet werden soll.",
        },
      },
    ],
  }),
);

startScheduler();
await server.connect(new StdioServerTransport());
console.error("Reel-Agent MCP-Server bereit.");
