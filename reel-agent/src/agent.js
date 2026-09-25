// Chat-Agent: Du sagst in eigenen Worten, was du willst – der Agent plant, ändert,
// erstellt, veröffentlicht oder plant Beiträge (Reel, Bild, Karussell) für Instagram und Facebook. Veröffentlichen passiert
// nie ohne deine Bestätigung in der Oberfläche.

import { randomUUID } from "node:crypto";
import { getClient, model, brandContext, REEL_RULES, PLAN_SCHEMA, planContent, normalizePlan, hasClaude, FORMATS, GOALS } from "./planner.js";
import { MOODS } from "./music.js";
import { totalDuration } from "./render.js";
import {
  createReel, getReel, listReels, publishNow, addSchedule, listSchedule, cancelSchedule,
  captionFor, facebookTextFor, parseLocalTime, formatLocal, TZ, connectedChannels, CHANNELS,
} from "./reels.js";

const MAX_STEPS = 12;

const TOOLS = [
  {
    name: "create_script",
    description:
      "Erstellt ein neues Drehbuch für einen Beitrag – Reel (Video), Bildbeitrag oder Karussell – mit Hook, Inhalt, CTA, " +
      "Instagram-Caption, Hashtags und eigenem Facebook-Text. Das Ergebnis ersetzt das aktuelle Drehbuch und erscheint im Editor.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["brief"],
      properties: {
        brief: { type: "string", description: "Inhalt, Botschaft, Zielgruppe, ggf. gewählter Hook – so ausführlich wie möglich" },
        format: { type: "string", enum: Object.keys(FORMATS), description: "reel (Standard), image oder carousel" },
        goal: { type: "string", enum: Object.keys(GOALS), description: "Ziel des Call-to-Action" },
        duration: { type: "number", description: "Nur Reel: Ziel-Länge in Sekunden (5–90), Standard 20" },
        mood: { type: "string", enum: ["auto", ...Object.keys(MOODS)] },
        style: { type: "string", description: "Stilwünsche, z. B. poetisch, Frage als Hook" },
      },
    },
  },
  {
    name: "update_script",
    description:
      "Ersetzt das aktuelle Drehbuch durch eine überarbeitete Fassung. Nutze es für Änderungswünsche " +
      "(Texte, Reihenfolge, Länge, Format, Musik, Farben, Caption, Hashtags, Facebook-Text). Übergib immer das vollständige Drehbuch.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["plan"],
      properties: { plan: PLAN_SCHEMA },
    },
  },
  {
    name: "render_reel",
    description:
      "Erstellt aus dem aktuellen Drehbuch den fertigen Beitrag: beim Reel das Video inkl. Musik (ca. 1–2 Minuten), " +
      "bei Bild/Karussell die gestalteten Bilder (wenige Sekunden). Hochgeladene Fotos/Musik werden automatisch verwendet.",
    input_schema: { type: "object", additionalProperties: false, properties: {} },
  },
  {
    name: "request_publish",
    description:
      "Bereitet das Veröffentlichen eines fertigen Beitrags auf Instagram und/oder Facebook vor – sofort oder geplant. " +
      "Der Nutzer bekommt einen Bestätigen-Button; erst dann wird gepostet bzw. eingeplant. Behaupte nie, dass etwas " +
      "veröffentlicht wurde, bevor der Nutzer bestätigt hat.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        reel_id: { type: "string", description: "ID des Reels; leer = zuletzt erstelltes/angezeigtes Reel" },
        caption: { type: "string", description: "Vollständige Instagram-Caption inkl. Hashtags; leer = aus dem Drehbuch" },
        facebook_text: { type: "string", description: "Facebook-Text; leer = aus dem Drehbuch" },
        channels: {
          type: "array",
          items: { type: "string", enum: Object.keys(CHANNELS) },
          description: "Kanäle; leer = alle verbundenen",
        },
        schedule_at: {
          type: "string",
          description: `Geplanter Zeitpunkt als Ortszeit ${TZ} im Format JJJJ-MM-TTTHH:MM (z. B. 2026-09-24T18:00). Leer = sofort.`,
        },
      },
    },
  },
  {
    name: "list_reels",
    description: "Listet die gespeicherten Beiträge (ID, Format, Titel, ob veröffentlicht).",
    input_schema: { type: "object", additionalProperties: false, properties: {} },
  },
  {
    name: "list_scheduled",
    description: "Listet geplante und bereits ausgeführte zeitgesteuerte Posts.",
    input_schema: { type: "object", additionalProperties: false, properties: {} },
  },
  {
    name: "cancel_scheduled",
    description: "Storniert einen geplanten Post.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["schedule_id"],
      properties: { schedule_id: { type: "string" } },
    },
  },
];

const system = () => `Du bist der persönliche Social-Media-Agent der Marke – ein warmherziger, kompetenter Assistent.
Du erledigst alles für Instagram und Facebook in diesem einen Werkzeug: Ideen entwickeln, Hooks und CTAs formulieren,
Reels, Bildbeiträge und Karussells erstellen und überarbeiten, veröffentlichen und einplanen.

${brandContext()}

${REEL_RULES}

So arbeitest du:
- Wenn der Nutzer einen Beitrag möchte, lege direkt los (create_script) statt viele Rückfragen zu stellen. Ohne Formatwunsch: Reel. Tipps/Schritte/Listen eignen sich besonders als Karussell, einzelne Zitate oder Impulse als Bildbeitrag.
- Wenn der Nutzer nach Ideen fragt, schlag 5–10 konkrete Beitragsideen mit passendem Format vor (ohne Werkzeug). Wenn er Hook-Varianten möchte, schlag 3 unterschiedliche vor (Frage, provokant, persönlich) und nutze den gewählten.
- Fasse ein neues oder geändertes Drehbuch kurz zusammen (Hook, Anzahl Szenen, Länge, Musik) und frag, ob du das Video erstellen sollst – es sei denn, der Nutzer hat schon gesagt, dass du direkt rendern sollst.
- Nach Änderungswünschen am Drehbuch ein bereits gerendertes Video nur neu rendern, wenn der Nutzer das möchte oder ohnehin veröffentlichen will.
- Veröffentlichen/Einplanen immer über request_publish. Danach sagen, dass der Nutzer bitte auf „Bestätigen“ klickt.
- Ist kein Kanal verbunden, erkläre, dass der Nutzer oben unter ⚙️ Einstellungen Instagram und/oder Facebook verbindet.
- Titel aus der Instagram-Musikbibliothek kannst du nicht hinzufügen; du komponierst eigene, lizenzfreie Musik (Stimmungen: ${Object.entries(MOODS).map(([k, v]) => `${k} = ${v.label}`).join(", ")}). Eigene Musikdateien kann der Nutzer im Editor hochladen.
- Antworte kurz, freundlich und auf Deutsch (du-Form). Keine langen Listen, keine Technik-Details.`;

const sessions = new Map();

export function getSession(id) {
  let s = id && sessions.get(id);
  if (!s) {
    s = { id: randomUUID(), messages: [], plan: null, reelId: null, pending: null, imageIds: [], musicId: null, showHandle: true, notes: [], busy: false };
    sessions.set(s.id, s);
  }
  return s;
}

const summarizeReel = (r) => ({
  reel_id: r.id,
  format: FORMATS[r.format],
  titel: r.plan.title,
  ...(r.format === "reel" ? { laenge_sek: Number(r.duration.toFixed(1)) } : { bilder: r.slides.length }),
  erstellt: formatLocal(r.createdAt),
  veroeffentlicht: r.publications
    ? Object.fromEntries(Object.entries(r.publications).map(([c, p]) => [c, { am: formatLocal(p.at), link: p.permalink }]))
    : r.published
      ? { am: formatLocal(r.published.at), link: r.published.permalink }
      : false,
});

async function runTool(session, name, input, onStep) {
  switch (name) {
    case "create_script": {
      onStep("Schreibe das Drehbuch …");
      session.plan = await planContent({
        brief: input.brief,
        format: input.format || "reel",
        goal: input.goal || "",
        duration: Math.min(90, Math.max(5, Number(input.duration) || 20)),
        mood: input.mood || "auto",
        style: input.style || "",
      });
      return { ok: true, drehbuch: session.plan, ...(session.plan.format === "reel" ? { gesamtlaenge_sek: totalDuration(session.plan) } : {}) };
    }
    case "update_script": {
      session.plan = normalizePlan(input.plan);
      return { ok: true, drehbuch: session.plan, ...(session.plan.format === "reel" ? { gesamtlaenge_sek: totalDuration(session.plan) } : {}) };
    }
    case "render_reel": {
      if (!session.plan) return { ok: false, fehler: "Es gibt noch kein Drehbuch. Erstelle zuerst eins." };
      const reel = await createReel(
        { plan: session.plan, imageIds: session.imageIds, musicId: session.musicId, showHandle: session.showHandle },
        onStep,
      );
      session.reelId = reel.id;
      return { ok: true, ...summarizeReel(reel), hinweis: "Die Vorschau wird dem Nutzer jetzt angezeigt." };
    }
    case "request_publish": {
      const connected = connectedChannels();
      if (!connected.length) return { ok: false, fehler: "Kein Kanal verbunden (⚙️ Einstellungen)." };
      const channels = input.channels?.length ? input.channels : connected;
      const missing = channels.filter((c) => !connected.includes(c));
      if (missing.length) return { ok: false, fehler: `Nicht verbunden: ${missing.map((c) => CHANNELS[c]).join(", ")}` };
      const reelId = input.reel_id || session.reelId;
      if (!reelId) return { ok: false, fehler: "Es gibt noch keinen fertigen Beitrag. Erstelle ihn zuerst (render_reel)." };
      const reel = await getReel(reelId);
      let at = null;
      if (input.schedule_at) {
        at = parseLocalTime(input.schedule_at);
        if (at.getTime() < Date.now()) return { ok: false, fehler: "Dieser Zeitpunkt liegt in der Vergangenheit." };
      }
      session.pending = {
        type: at ? "schedule" : "publish",
        reelId,
        title: reel.plan.title,
        format: reel.format,
        channels,
        caption: input.caption?.trim() || captionFor(reel.plan),
        facebookText: input.facebook_text?.trim() || facebookTextFor(reel.plan),
        at: at?.toISOString() ?? null,
        atLabel: at ? formatLocal(at) : null,
      };
      session.reelId = reelId;
      return { ok: true, status: "Bestätigung angefordert – der Nutzer sieht jetzt den Bestätigen-Button.", ...session.pending };
    }
    case "list_reels":
      return { reels: (await listReels()).slice(0, 20).map(summarizeReel) };
    case "list_scheduled":
      return {
        geplant: (await listSchedule()).map((e) => ({ schedule_id: e.id, titel: e.title, zeitpunkt: formatLocal(e.at), status: e.status, fehler: e.error })),
      };
    case "cancel_scheduled":
      await cancelSchedule(input.schedule_id);
      return { ok: true };
    default:
      return { ok: false, fehler: `Unbekanntes Werkzeug ${name}` };
  }
}

/**
 * Verarbeitet eine Chat-Nachricht.
 * @param {object} session  aus getSession()
 * @param {string} message  Text des Nutzers
 * @param {object} context  aktueller Stand der Oberfläche: plan, imageIds, musicId, reelId, showHandle
 */
export async function chat(session, message, context = {}, onStep = () => {}) {
  if (!hasClaude()) throw new Error("Für den Chat-Agenten wird ein Claude-API-Key benötigt (⚙️ Einstellungen).");
  if (!message?.trim()) throw new Error("Leere Nachricht");

  // Stand der Oberfläche übernehmen (Nutzer kann im Editor manuell geändert haben)
  const info = [...session.notes];
  session.notes = [];
  if (context.plan) {
    const plan = normalizePlan(context.plan);
    if (JSON.stringify(plan) !== JSON.stringify(session.plan)) {
      if (session.plan) info.push(`Der Nutzer hat das Drehbuch im Editor geändert. Aktueller Stand: ${JSON.stringify(plan)}`);
      else info.push(`Im Editor ist dieses Drehbuch geöffnet: ${JSON.stringify(plan)}`);
      session.plan = plan;
    }
  }
  if (Array.isArray(context.imageIds)) session.imageIds = context.imageIds;
  if (context.musicId !== undefined) session.musicId = context.musicId || null;
  if (context.showHandle !== undefined) session.showHandle = context.showHandle !== false;
  if (context.reelId && context.reelId !== session.reelId) {
    session.reelId = context.reelId;
    info.push(`Der Nutzer hat den Beitrag ${context.reelId} in der Vorschau geöffnet.`);
  }
  info.push(
    `Jetzt: ${formatLocal(new Date())} (${TZ}). Verbundene Kanäle: ${connectedChannels().map((c) => CHANNELS[c]).join(", ") || "keine"}. ` +
      `Hochgeladene Bilder: ${session.imageIds.length}. Eigene Musik: ${session.musicId ? "ja" : "nein"}.`,
  );

  session.messages.push({
    role: "user",
    content: [{ type: "text", text: `<kontext>\n${info.join("\n")}\n</kontext>\n\n${message.trim()}` }],
  });

  const client = getClient();
  const texts = [];
  for (let step = 0; step < MAX_STEPS; step++) {
    onStep("Denkt nach …");
    const response = await client.beta.messages.create({
      model: model(),
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: system(),
      tools: TOOLS,
      messages: session.messages,
    });
    session.messages.push({ role: "assistant", content: response.content });
    for (const b of response.content) if (b.type === "text" && b.text.trim()) texts.push(b.text.trim());

    if (response.stop_reason === "refusal") {
      texts.push("Dabei kann ich leider nicht helfen. Magst du es anders formulieren?");
      break;
    }
    if (response.stop_reason === "pause_turn") continue;
    if (response.stop_reason !== "tool_use") break;

    const results = [];
    for (const block of response.content.filter((b) => b.type === "tool_use")) {
      let result;
      try {
        result = await runTool(session, block.name, block.input ?? {}, onStep);
      } catch (e) {
        result = { ok: false, fehler: e.message };
      }
      results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result), is_error: result?.ok === false });
    }
    session.messages.push({ role: "user", content: results });
  }

  // Endet der Verlauf wegen des Schrittlimits mit Werkzeug-Ergebnissen, hängt die API die nächste Nutzernachricht einfach an
  const reel = session.reelId ? await getReel(session.reelId).catch(() => null) : null;
  return {
    sessionId: session.id,
    reply: texts.join("\n\n") || "Erledigt.",
    plan: session.plan,
    reel,
    pending: session.pending,
  };
}

/** Führt eine vom Agenten vorbereitete Veröffentlichung nach Bestätigung aus. */
export async function confirmPending(session, approve, onStep = () => {}) {
  const p = session.pending;
  if (!p) throw new Error("Es gibt nichts zu bestätigen.");
  session.pending = null;
  if (!approve) {
    session.notes.push("Der Nutzer hat die vorgeschlagene Veröffentlichung abgelehnt.");
    return { cancelled: true };
  }
  try {
    if (p.type === "schedule") {
      const entry = await addSchedule({ reelId: p.reelId, caption: p.caption, facebookText: p.facebookText, channels: p.channels, at: p.at });
      session.notes.push(`Der Nutzer hat bestätigt: Beitrag ${p.reelId} ist für ${formatLocal(entry.at)} eingeplant (schedule_id ${entry.id}).`);
      return { scheduled: entry };
    }
    const result = await publishNow(p.reelId, { caption: p.caption, facebookText: p.facebookText, channels: p.channels }, onStep);
    const errs = Object.entries(result.errors ?? {}).map(([c, m]) => `${CHANNELS[c]} fehlgeschlagen: ${m}`);
    session.notes.push(
      `Der Nutzer hat bestätigt: Beitrag ${p.reelId} wurde veröffentlicht auf ${Object.keys(result.results).map((c) => CHANNELS[c]).join(", ")}.` +
        (errs.length ? ` ${errs.join("; ")}` : ""),
    );
    return { published: result, reel: await getReel(p.reelId) };
  } catch (e) {
    session.notes.push(`Die bestätigte Veröffentlichung ist fehlgeschlagen: ${e.message}`);
    throw e;
  }
}
