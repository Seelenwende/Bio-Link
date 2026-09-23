// Instagram-Veröffentlichung über die offizielle Instagram Graph API (Content Publishing).
// Ablauf: Reel-Container anlegen → Video hochladen → Verarbeitung abwarten → veröffentlichen.
//
// Voraussetzungen: Instagram Business- oder Creator-Konto, eine Meta-App und ein Access Token
// mit den Berechtigungen instagram_business_basic + instagram_business_content_publish
// (Instagram Login) bzw. instagram_basic + instagram_content_publish (Facebook Login).

import { readFile, stat } from "node:fs/promises";

const cfg = () => ({
  token: process.env.IG_ACCESS_TOKEN,
  userId: process.env.IG_USER_ID,
  // graph.instagram.com für „Instagram API with Instagram Login“, graph.facebook.com für Facebook Login
  host: process.env.IG_GRAPH_HOST || "graph.instagram.com",
  version: process.env.IG_API_VERSION || "v23.0",
  // "resumable" lädt die Datei direkt hoch; "url" übergibt eine öffentlich erreichbare Video-URL
  mode: process.env.IG_UPLOAD_MODE || "resumable",
  publicBaseUrl: process.env.PUBLIC_BASE_URL,
});

export const isInstagramConfigured = () => Boolean(cfg().token && cfg().userId);

async function graph(method, pathname, params = {}) {
  const { host, version, token } = cfg();
  const url = new URL(`https://${host}/${version}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  const res =
    method === "GET"
      ? await fetch(`${url}?${body}`)
      : await fetch(url, { method, body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json.error?.error_user_msg || json.error?.message || `HTTP ${res.status}`;
    throw new Error(`Instagram API: ${msg}`);
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Prüft Token und liefert Profildaten (für die Statusanzeige). */
export async function getProfile() {
  const { userId } = cfg();
  return graph("GET", userId, { fields: "username,name,profile_picture_url" });
}

/**
 * Ermittelt zu einem Access Token das zugehörige Instagram-Konto (User-ID + Name),
 * damit man in der App nur das Token einfügen muss.
 */
export async function lookupAccount(token, host = "graph.instagram.com") {
  const version = process.env.IG_API_VERSION || "v23.0";
  const get = async (pathname, fields) => {
    const res = await fetch(`https://${host}/${version}/${pathname}?${new URLSearchParams({ fields, access_token: token })}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) throw new Error(`Instagram API: ${json.error?.message || `HTTP ${res.status}`}`);
    return json;
  };
  if (host === "graph.facebook.com") {
    // Facebook Login: Instagram-Konto hängt an einer Facebook-Seite
    const { data = [] } = await get("me/accounts", "instagram_business_account{id,username}");
    const ig = data.map((p) => p.instagram_business_account).find(Boolean);
    if (!ig) throw new Error("Kein mit einer Facebook-Seite verknüpftes Instagram-Business-Konto gefunden.");
    return { userId: ig.id, username: ig.username };
  }
  const me = await get("me", "user_id,username,account_type");
  if (me.account_type && !["BUSINESS", "MEDIA_CREATOR", "CREATOR"].includes(me.account_type)) {
    throw new Error("Dein Konto ist kein Business- oder Creator-Konto. Bitte in der Instagram-App umstellen.");
  }
  return { userId: String(me.user_id || me.id), username: me.username };
}

/** Verlängert ein langlebiges Instagram-Token (nur Instagram Login). */
export async function refreshToken(token) {
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token })}`,
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(`Token-Verlängerung fehlgeschlagen: ${json.error?.message || `HTTP ${res.status}`}`);
  return { token: json.access_token, expiresIn: json.expires_in };
}

/**
 * Veröffentlicht ein Reel.
 * @param {object} opts
 * @param {string} opts.file        lokaler Pfad zum MP4
 * @param {string} [opts.publicUrl] öffentliche URL des MP4 (nur für Modus "url")
 * @param {string} opts.caption     Caption inkl. Hashtags
 * @param {boolean} [opts.shareToFeed=true] Reel zusätzlich im Feed-Raster zeigen
 * @param {number} [opts.thumbOffsetMs]     Zeitpunkt des Titelbilds in ms
 * @param {(step: string) => void} [opts.onProgress]
 */
export async function publishReel({ file, publicUrl, caption, shareToFeed = true, thumbOffsetMs, onProgress = () => {} }) {
  const c = cfg();
  if (!isInstagramConfigured()) throw new Error("Instagram ist nicht konfiguriert (IG_ACCESS_TOKEN / IG_USER_ID fehlen).");

  const base = {
    media_type: "REELS",
    caption: caption.slice(0, 2200),
    share_to_feed: String(shareToFeed),
    ...(thumbOffsetMs != null ? { thumb_offset: String(Math.round(thumbOffsetMs)) } : {}),
  };

  onProgress("Container wird angelegt …");
  let container;
  if (c.mode === "url") {
    if (!publicUrl) throw new Error("IG_UPLOAD_MODE=url benötigt PUBLIC_BASE_URL, damit Instagram das Video abrufen kann.");
    container = await graph("POST", `${c.userId}/media`, { ...base, video_url: publicUrl });
  } else {
    container = await graph("POST", `${c.userId}/media`, { ...base, upload_type: "resumable" });
    onProgress("Video wird hochgeladen …");
    const data = await readFile(file);
    const { size } = await stat(file);
    const uploadUrl = container.uri || `https://rupload.facebook.com/ig-api-upload/${c.version}/${container.id}`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `OAuth ${c.token}`, offset: "0", file_size: String(size) },
      body: data,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.error) {
      throw new Error(`Upload fehlgeschlagen: ${json.debug_info?.message || json.error?.message || `HTTP ${res.status}`}`);
    }
  }

  onProgress("Instagram verarbeitet das Video …");
  const deadline = Date.now() + 10 * 60 * 1000;
  for (;;) {
    const s = await graph("GET", container.id, { fields: "status_code,status" });
    if (s.status_code === "FINISHED") break;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") {
      throw new Error(`Instagram konnte das Video nicht verarbeiten: ${s.status || s.status_code}`);
    }
    if (Date.now() > deadline) throw new Error("Zeitüberschreitung bei der Verarbeitung durch Instagram.");
    await sleep(5000);
  }

  onProgress("Reel wird veröffentlicht …");
  const published = await graph("POST", `${c.userId}/media_publish`, { creation_id: container.id });
  let permalink = null;
  try {
    ({ permalink } = await graph("GET", published.id, { fields: "permalink" }));
  } catch {
    // Permalink ist optional – das Reel ist trotzdem online
  }
  return { id: published.id, permalink };
}
