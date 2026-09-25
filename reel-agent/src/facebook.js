// Facebook-Seite: verbinden und veröffentlichen (Bildbeitrag, Mehrbild-Beitrag, Reel)
// über die offizielle Graph API. Benötigt ein Seiten-Token mit pages_manage_posts,
// pages_read_engagement und pages_show_list.

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const version = () => process.env.IG_API_VERSION || "v23.0";
const BASE = () => `https://graph.facebook.com/${version()}`;

const cfg = () => ({ pageId: process.env.FB_PAGE_ID, token: process.env.FB_PAGE_TOKEN });
export const isFacebookConfigured = () => Boolean(cfg().pageId && cfg().token);

async function call(method, pathname, params = {}, token = cfg().token) {
  const isForm = params instanceof FormData;
  let res;
  if (method === "GET") {
    res = await fetch(`${BASE()}/${pathname}?${new URLSearchParams({ ...params, access_token: token })}`);
  } else if (isForm) {
    params.append("access_token", token);
    res = await fetch(`${BASE()}/${pathname}`, { method, body: params });
  } else {
    res = await fetch(`${BASE()}/${pathname}`, { method, body: new URLSearchParams({ ...params, access_token: token }) });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(`Facebook API: ${json.error?.error_user_msg || json.error?.message || `HTTP ${res.status}`}`);
  }
  return json;
}

/**
 * Ermittelt aus einem Token die Facebook-Seite. Akzeptiert ein Seiten-Token oder ein Nutzer-Token
 * (dann wird die Seite über /me/accounts gesucht). Mit App-ID + App-Geheimnis wird das Token
 * vorher in ein langlebiges getauscht, sodass das Seiten-Token nicht mehr abläuft.
 */
export async function lookupPage({ token, pageName, appId, appSecret }) {
  let userToken = token.trim();
  if (appId && appSecret) {
    const ex = await call("GET", "oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: userToken,
    }, userToken);
    userToken = ex.access_token;
  }
  const me = await call("GET", "me", { fields: "id,name,category" }, userToken);
  if (me.category) return { pageId: me.id, pageName: me.name, token: userToken, others: [] };

  const { data = [] } = await call("GET", "me/accounts", { fields: "id,name,access_token", limit: "100" }, userToken);
  if (!data.length) throw new Error("Zu diesem Konto wurde keine Facebook-Seite gefunden (Berechtigung pages_show_list?).");
  const wanted = pageName?.trim().toLowerCase();
  const page = (wanted && data.find((p) => p.name.toLowerCase().includes(wanted))) || data[0];
  return {
    pageId: page.id,
    pageName: page.name,
    token: page.access_token,
    others: data.filter((p) => p.id !== page.id).map((p) => p.name),
  };
}

async function fileBlob(file) {
  const ext = path.extname(file).toLowerCase();
  const type = ext === ".png" ? "image/png" : ext === ".mp4" ? "video/mp4" : "image/jpeg";
  return new Blob([await readFile(file)], { type });
}

async function uploadPhoto(file, extra = {}) {
  const form = new FormData();
  form.append("source", await fileBlob(file), path.basename(file));
  for (const [k, v] of Object.entries(extra)) form.append(k, String(v));
  return call("POST", `${cfg().pageId}/photos`, form);
}

async function permalink(id) {
  try {
    return (await call("GET", id, { fields: "permalink_url" })).permalink_url ?? null;
  } catch {
    return null;
  }
}

/** Bildbeitrag (1 Bild) oder Mehrbild-Beitrag (Karussell) auf der Seite veröffentlichen. */
export async function publishPhotos({ files, message, onProgress = () => {} }) {
  if (!isFacebookConfigured()) throw new Error("Facebook ist nicht verbunden.");
  if (files.length === 1) {
    onProgress("Facebook: Bild wird hochgeladen …");
    const res = await uploadPhoto(files[0], { message });
    const id = res.post_id || res.id;
    return { id, permalink: await permalink(id) };
  }
  const ids = [];
  for (const [i, f] of files.entries()) {
    onProgress(`Facebook: Bild ${i + 1}/${files.length} wird hochgeladen …`);
    ids.push((await uploadPhoto(f, { published: "false" })).id);
  }
  onProgress("Facebook: Beitrag wird veröffentlicht …");
  const params = { message };
  ids.forEach((id, i) => (params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })));
  const post = await call("POST", `${cfg().pageId}/feed`, params);
  return { id: post.id, permalink: await permalink(post.id) };
}

/** Video als Facebook-Reel auf der Seite veröffentlichen. */
export async function publishVideoReel({ file, description, onProgress = () => {} }) {
  if (!isFacebookConfigured()) throw new Error("Facebook ist nicht verbunden.");
  const { pageId, token } = cfg();
  onProgress("Facebook: Reel wird vorbereitet …");
  const start = await call("POST", `${pageId}/video_reels`, { upload_phase: "start" });
  onProgress("Facebook: Video wird hochgeladen …");
  const { size } = await stat(file);
  const res = await fetch(start.upload_url || `https://rupload.facebook.com/video-upload/${version()}/${start.video_id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${token}`, offset: "0", file_size: String(size) },
    body: await readFile(file),
  });
  const up = await res.json().catch(() => ({}));
  if (!res.ok || up.success === false || up.error) {
    throw new Error(`Facebook-Upload fehlgeschlagen: ${up.debug_info?.message || up.error?.message || `HTTP ${res.status}`}`);
  }
  onProgress("Facebook: Reel wird veröffentlicht …");
  await call("POST", `${pageId}/video_reels`, {
    upload_phase: "finish",
    video_id: start.video_id,
    video_state: "PUBLISHED",
    description,
  });
  return { id: start.video_id, permalink: await permalink(start.video_id) };
}

/**
 * Lädt ein Bild unveröffentlicht auf die Facebook-Seite und liefert eine öffentliche Bild-URL.
 * Instagram holt Bilder nur von öffentlichen Adressen ab – so klappt das auch, wenn der Agent
 * nur lokal läuft.
 */
export async function hostImage(file) {
  const { id } = await uploadPhoto(file, { published: "false" });
  const { images = [] } = await call("GET", id, { fields: "images" });
  const best = images.sort((a, b) => b.width - a.width)[0];
  if (!best?.source) throw new Error("Bild-URL von Facebook nicht erhalten.");
  return best.source;
}
