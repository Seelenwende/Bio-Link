import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { MAX_FOTO_BYTES, MAX_STIMME_BYTES, avatarId, getProfil, isAvatarConfigured, setProfil, store } from "../lib/avatar.mts";

// Nimmt Selfie und Stimmprobe an, legt sie kurz ab und startet das Klonen im Hintergrund.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isAvatarConfigured()) return json({ error: "Das Avatar-Studio ist noch nicht eingerichtet." }, 503);

  const form = await req.formData().catch(() => null);
  const id = avatarId(form?.get("code"));
  if (!form || !id) return json({ error: "Dieser Zugangscode ist ungültig.", reason: "zugang" }, 401);

  if (form.get("einwilligung") !== "ja") return json({ error: "Bitte bestätige zuerst, dass Foto und Stimme deine eigenen sind." }, 400);
  const foto = form.get("foto");
  const stimme = form.get("stimme");
  if (!(foto instanceof Blob) || foto.type !== "image/jpeg" || foto.size < 5_000 || foto.size > MAX_FOTO_BYTES) {
    return json({ error: "Das Foto fehlt oder ist zu groß. Nimm es bitte noch einmal auf." }, 400);
  }
  if (!(stimme instanceof Blob) || stimme.type !== "audio/wav" || stimme.size < 200_000 || stimme.size > MAX_STIMME_BYTES) {
    return json({ error: "Die Sprachaufnahme fehlt oder ist zu kurz. Lies den Text bitte ganz vor." }, 400);
  }

  const vorher = await getProfil(id);
  if (vorher && vorher.status !== "fehler") {
    return json({ error: "Zu diesem Code gibt es schon einen Avatar. Lösch ihn zuerst, wenn du neu beginnen möchtest." }, 409);
  }

  const s = store();
  await s.set(`foto/${id}`, await foto.arrayBuffer());
  await s.set(`roh/stimme/${id}`, await stimme.arrayBuffer());
  const now = Date.now();
  await setProfil(id, { status: "pending", createdAt: now, lastUsedAt: now, videos: [] });

  const res = await fetch(new URL("/.netlify/functions/avatar-einrichten-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ owner: id }),
  });
  if (res.status !== 202) {
    await s.delete(`roh/stimme/${id}`);
    await setProfil(id, { status: "fehler", error: "Das hat nicht geklappt. Versuch es gleich noch einmal.", createdAt: now, lastUsedAt: now, videos: [] });
    return json({ error: "Das hat nicht geklappt. Versuch es gleich noch einmal." }, 502);
  }
  return json({ ok: true }, 202);
};

export const config: Config = {
  path: "/api/avatar/einrichten",
};
