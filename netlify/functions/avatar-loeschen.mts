import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { ID_PATTERN, avatarId, deleteAvatar, getProfil, setProfil, store } from "../lib/avatar.mts";

// Löscht ein einzelnes Video ({ code, video }) oder den ganzen Avatar ({ code }):
// Stimme bei ElevenLabs, Foto bei D-ID, Foto und Videos hier.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);

  const body = await req.json().catch(() => null);
  const owner = avatarId(body?.code);
  if (!owner) return json({ error: "Dieser Zugangscode ist ungültig.", reason: "zugang" }, 401);

  if (body.video !== undefined) {
    if (typeof body.video !== "string" || !ID_PATTERN.test(body.video)) return json({ error: "Ungültige Anfrage." }, 400);
    const profil = await getProfil(owner);
    if (!profil?.videos.some((v) => v.id === body.video)) return json({ error: "Dieses Video gibt es nicht mehr." }, 404);
    await store().delete(`video/${body.video}`);
    await setProfil(owner, { ...profil, videos: profil.videos.filter((v) => v.id !== body.video) });
    return json({ ok: true });
  }

  await deleteAvatar(owner);
  return json({ ok: true });
};

export const config: Config = {
  path: "/api/avatar/loeschen",
};
