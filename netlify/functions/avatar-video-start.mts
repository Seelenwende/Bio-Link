import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { MAX_TEXT_CHARS, avatarId, getProfil, getUsage, isAvatarConfigured, monthlyLimit, parseText, setUsage, store, type VideoJob } from "../lib/avatar.mts";

// Nimmt den Text an, zählt das Video und startet die Erstellung im Hintergrund.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isAvatarConfigured()) return json({ error: "Das Avatar-Studio ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  const owner = avatarId(body?.code);
  if (!owner) return json({ error: "Dieser Zugangscode ist ungültig.", reason: "zugang" }, 401);

  const text = parseText(body.text);
  if (!text) return json({ error: `Bitte schreib einen Text mit höchstens ${MAX_TEXT_CHARS} Zeichen.` }, 400);

  const profil = await getProfil(owner);
  if (profil?.status !== "bereit") return json({ error: "Dein Avatar ist noch nicht fertig.", reason: "avatar" }, 409);

  const limit = monthlyLimit();
  const used = await getUsage(owner);
  if (used >= limit) return json({ error: "Deine Videos für diesen Monat sind aufgebraucht. Am Monatsersten geht es weiter." }, 403);

  const id = crypto.randomUUID();
  const job: VideoJob = { status: "pending", owner, createdAt: Date.now(), text };
  await store().setJSON(`job/${id}`, job);

  const res = await fetch(new URL("/.netlify/functions/avatar-video-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (res.status !== 202) {
    await store().delete(`job/${id}`);
    return json({ error: "Das hat nicht geklappt. Versuch es gleich noch einmal." }, 502);
  }

  await setUsage(owner, used + 1);
  return json({ id, used: used + 1, limit }, 202);
};

export const config: Config = {
  path: "/api/avatar/video/start",
};
