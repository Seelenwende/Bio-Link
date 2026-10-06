import { getStore } from "@netlify/blobs";
import { hashCode, isCodeInList } from "./codes.mts";
import { currentPeriod } from "./zugang.mts";

/* Avatar-Studio: Aus einem Selfie und einer Stimmprobe wird ein sprechender Avatar.

   - ElevenLabs klont die Stimme (Instant Voice Cloning) und spricht den Text.
   - D-ID macht aus Foto + Tonspur ein Video (Talks-API).

   Gespeichert wird pro Code (als Hash): das Profil mit den IDs bei ElevenLabs und D-ID, das Foto
   als Vorschau und die fertigen Videos. Die Stimmprobe wird nach dem Klonen sofort gelöscht.
   Videos verschwinden nach VIDEO_TAGE Tagen, das ganze Profil nach AVATAR_AUFBEWAHRUNG_TAGE Tagen
   ohne Nutzung (Funktion avatar-aufraeumen). Die Kundin kann alles jederzeit selbst löschen. */

export const AVATAR_STORE = "avatar";
const DEFAULT_LIMIT = 10;
const DEFAULT_VIDEO_TAGE = 7;
const DEFAULT_PROFIL_TAGE = 30;
const DEFAULT_ELEVENLABS_MODEL = "eleven_multilingual_v2";
const MAX_VIDEOS_IN_LISTE = 20;

export const MAX_TEXT_CHARS = 600; // ca. 40 Sekunden gesprochen
export const MAX_FOTO_BYTES = 4 * 1024 * 1024;
export const MAX_STIMME_BYTES = 5 * 1024 * 1024;

const ELEVENLABS = "https://api.elevenlabs.io/v1";
const DID = "https://api.d-id.com";

export function store() {
  // stark konsistent: Hintergrund-Funktionen lesen sofort, was gerade geschrieben wurde
  return getStore({ name: AVATAR_STORE, consistency: "strong" });
}

/* ---------- Zugang ---------- */

export function isAvatarConfigured(): boolean {
  return Boolean(Netlify.env.get("ELEVENLABS_API_KEY") && Netlify.env.get("DID_API_KEY"));
}

/** Liefert die ID (Hash) zum Code oder null, wenn er nicht in AVATAR_CODES steht. */
export function avatarId(given: unknown): string | null {
  return isCodeInList("AVATAR_CODES", given) ? hashCode(given).toString("hex") : null;
}

function envNumber(name: string, fallback: number): number {
  const n = Number(Netlify.env.get(name));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const monthlyLimit = () => envNumber("AVATAR_LIMIT", DEFAULT_LIMIT);
export const videoTage = () => envNumber("VIDEO_TAGE", DEFAULT_VIDEO_TAGE);
export const profilTage = () => envNumber("AVATAR_AUFBEWAHRUNG_TAGE", DEFAULT_PROFIL_TAGE);
export const TAG_MS = 24 * 60 * 60 * 1000;

function usageKey(id: string): string {
  return `usage/${id}/${currentPeriod()}`;
}

export async function getUsage(id: string): Promise<number> {
  const data = (await store().get(usageKey(id), { type: "json" })) as { used?: number } | null;
  return data?.used ?? 0;
}

export async function setUsage(id: string, used: number): Promise<void> {
  await store().setJSON(usageKey(id), { used: Math.max(0, used), updatedAt: Date.now() });
}

/* ---------- Profil ---------- */

export interface VideoEintrag {
  id: string;
  createdAt: number;
  text: string;
}

export interface Profil {
  status: "pending" | "running" | "bereit" | "fehler";
  error?: string;
  createdAt: number;
  lastUsedAt: number;
  voiceId?: string;
  didImageId?: string;
  didImageUrl?: string;
  videos: VideoEintrag[];
}

export async function getProfil(id: string): Promise<Profil | null> {
  return (await store().get(`profil/${id}`, { type: "json" })) as Profil | null;
}

export async function setProfil(id: string, profil: Profil): Promise<void> {
  await store().setJSON(`profil/${id}`, profil);
}

export async function addVideo(id: string, video: VideoEintrag): Promise<void> {
  const profil = await getProfil(id);
  if (!profil) return;
  profil.videos = [video, ...profil.videos.filter((v) => v.id !== video.id)].slice(0, MAX_VIDEOS_IN_LISTE);
  profil.lastUsedAt = Date.now();
  await setProfil(id, profil);
}

/** Löscht alles zu einem Avatar: bei ElevenLabs, bei D-ID und hier. Fehler bei den Anbietern werden nur protokolliert. */
export async function deleteAvatar(id: string): Promise<void> {
  const s = store();
  const profil = await getProfil(id);
  if (profil?.voiceId) await deleteVoice(profil.voiceId).catch((err) => console.error("avatar: Stimme nicht gelöscht", err));
  if (profil?.didImageId) await didDelete(`/images/${profil.didImageId}`).catch((err) => console.error("avatar: Bild nicht gelöscht", err));
  for (const v of profil?.videos ?? []) {
    await s.delete(`video/${v.id}`);
    await s.delete(`job/${v.id}`);
  }
  await s.delete(`foto/${id}`);
  await s.delete(`roh/stimme/${id}`);
  await s.delete(`profil/${id}`);
}

/* ---------- Video-Aufträge ---------- */

export interface VideoJob {
  status: "pending" | "running" | "done" | "error";
  owner: string;
  createdAt: number;
  text: string;
  error?: string;
}

export const ID_PATTERN = /^[0-9a-f-]{36}$/;

export function parseText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.replace(/\s+/g, " ").trim();
  return text && text.length <= MAX_TEXT_CHARS ? text : null;
}

/* ---------- ElevenLabs ---------- */

function elevenHeaders(): Record<string, string> {
  return { "xi-api-key": Netlify.env.get("ELEVENLABS_API_KEY") ?? "" };
}

async function providerError(anbieter: string, res: Response): Promise<Error> {
  const body = await res.text().catch(() => "");
  console.error(`${anbieter} ${res.status}`, body.slice(0, 800));
  if (res.status === 401 || res.status === 403) return new Error(`Der ${anbieter}-Schlüssel ist ungültig oder das Abo erlaubt das nicht. Bitte in Netlify prüfen.`);
  if (res.status === 402) return new Error(`Das Guthaben bei ${anbieter} ist aufgebraucht.`);
  if (res.status === 429) return new Error(`${anbieter} ist gerade ausgelastet. Bitte in ein paar Minuten noch einmal.`);
  return new Error(`${anbieter} hat die Anfrage abgelehnt (Fehler ${res.status}).`);
}

/** Klont die Stimme aus der Probe und liefert die voice_id. */
export async function cloneVoice(name: string, sample: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("name", name);
  form.append("description", "Seelenwende Avatar-Studio");
  form.append("remove_background_noise", "true");
  form.append("files", sample, filename);
  const res = await fetch(`${ELEVENLABS}/voices/add`, { method: "POST", headers: elevenHeaders(), body: form });
  if (!res.ok) throw await providerError("ElevenLabs", res);
  const data = (await res.json()) as { voice_id?: string };
  if (!data.voice_id) throw new Error("ElevenLabs hat keine Stimme zurückgegeben.");
  return data.voice_id;
}

export async function deleteVoice(voiceId: string): Promise<void> {
  const res = await fetch(`${ELEVENLABS}/voices/${encodeURIComponent(voiceId)}`, { method: "DELETE", headers: elevenHeaders() });
  if (!res.ok && res.status !== 404) throw await providerError("ElevenLabs", res);
}

/** Spricht den Text mit der geklonten Stimme und liefert MP3. */
export async function speak(voiceId: string, text: string): Promise<Blob> {
  const model = Netlify.env.get("ELEVENLABS_MODEL") || DEFAULT_ELEVENLABS_MODEL;
  const res = await fetch(`${ELEVENLABS}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { ...elevenHeaders(), "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model }),
  });
  if (!res.ok) throw await providerError("ElevenLabs", res);
  return new Blob([await res.arrayBuffer()], { type: "audio/mpeg" });
}

/* ---------- D-ID ---------- */

function didHeaders(): Record<string, string> {
  // Den Schlüssel aus dem D-ID-Studio genau so eintragen, wie er angezeigt wird (Basic-Auth).
  return { authorization: `Basic ${Netlify.env.get("DID_API_KEY") ?? ""}`, accept: "application/json" };
}

async function didUpload(path: "/images" | "/audios", field: "image" | "audio", file: Blob, filename: string): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.append(field, file, filename);
  const res = await fetch(DID + path, { method: "POST", headers: didHeaders(), body: form });
  if (!res.ok) throw await providerError("D-ID", res);
  const data = (await res.json()) as { id?: string; url?: string };
  if (!data.url || !data.id) throw new Error("D-ID hat die Datei nicht angenommen.");
  return { id: data.id, url: data.url };
}

export const uploadImage = (foto: Blob) => didUpload("/images", "image", foto, "avatar.jpg");
export const uploadAudio = (audio: Blob) => didUpload("/audios", "audio", audio, "stimme.mp3");

export async function didDelete(path: string): Promise<void> {
  const res = await fetch(DID + path, { method: "DELETE", headers: didHeaders() });
  if (!res.ok && res.status !== 404) throw await providerError("D-ID", res);
}

export async function createTalk(imageUrl: string, audioUrl: string): Promise<string> {
  const res = await fetch(`${DID}/talks`, {
    method: "POST",
    headers: { ...didHeaders(), "content-type": "application/json" },
    body: JSON.stringify({
      source_url: imageUrl,
      script: { type: "audio", audio_url: audioUrl },
      config: { stitch: true },
    }),
  });
  if (!res.ok) throw await providerError("D-ID", res);
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("D-ID hat keinen Auftrag angelegt.");
  return data.id;
}

interface Talk {
  status?: "created" | "started" | "done" | "error" | "rejected";
  result_url?: string;
  error?: { kind?: string; description?: string };
}

/** Wartet, bis D-ID das Video fertig hat, und liefert die Adresse zum Herunterladen. */
export async function waitForTalk(talkId: string, maxMs: number): Promise<string> {
  const until = Date.now() + maxMs;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`${DID}/talks/${encodeURIComponent(talkId)}`, { headers: didHeaders() });
    if (!res.ok) throw await providerError("D-ID", res);
    const talk = (await res.json()) as Talk;
    if (talk.status === "done" && talk.result_url) return talk.result_url;
    if (talk.status === "rejected") throw new Error("D-ID hat das Video abgelehnt. Prüf, ob dein Foto dein Gesicht gut sichtbar von vorne zeigt.");
    if (talk.status === "error") {
      console.error("D-ID talk error", talk.error);
      throw new Error(talk.error?.kind === "FaceError"
        ? "Auf deinem Foto wurde kein Gesicht erkannt. Lösch den Avatar und nimm ein neues Foto auf – von vorne, mit gutem Licht."
        : "D-ID konnte das Video nicht erstellen. Bitte versuch es noch einmal.");
    }
  }
  throw new Error("Das Video hat zu lange gedauert. Bitte versuch es noch einmal.");
}

export function errorText(err: unknown): string {
  return err instanceof Error ? err.message : "Unbekannter Fehler.";
}
