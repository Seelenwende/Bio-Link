import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { avatarId, getProfil, getUsage, isAvatarConfigured, monthlyLimit, profilTage, setProfil, store, videoTage } from "../lib/avatar.mts";

// Prüft den Zugangscode und liefert den Stand des Avatars (noch keiner, wird erstellt, bereit, Fehler).
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isAvatarConfigured()) return json({ error: "Das Avatar-Studio ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  const id = avatarId(body?.code);
  if (!id) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);

  const profil = await getProfil(id);
  let foto: string | null = null;
  if (profil?.status === "bereit") {
    // Anmelden zählt als Nutzung, damit der Avatar nicht während der Nutzung abläuft
    profil.lastUsedAt = Date.now();
    await setProfil(id, profil);
    const bytes = await store().get(`foto/${id}`, { type: "arrayBuffer" });
    if (bytes) foto = "data:image/jpeg;base64," + Buffer.from(bytes).toString("base64");
  }

  return json({
    ok: true,
    used: await getUsage(id),
    limit: monthlyLimit(),
    videoTage: videoTage(),
    profilTage: profilTage(),
    avatar: profil ? { status: profil.status, error: profil.error ?? null, foto, videos: profil.videos } : null,
  });
};

export const config: Config = {
  path: "/api/avatar/zugang",
};
