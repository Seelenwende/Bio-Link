import type { Config, Context } from "@netlify/functions";
import { adminFromRequest, json } from "../lib/common.mts";
import { ladeKunde } from "../lib/kunden.mts";
import { NAME_PATTERN, speichereMedium } from "../lib/medien.mts";

/* Upload aus dem Dashboard, z. B. die im Browser erzeugten Reel-Videos.
   POST /api/admin/medien?id=<kundeId>&name=<datei>  Body: Datei (höchstens ~6 MB) */
export default async (req: Request, _context: Context) => {
  if (!adminFromRequest(req)) return json({ error: "Passwort fehlt oder ist falsch." }, 401);
  if (req.method !== "POST") return json({ error: "Nur POST." }, 405);
  const params = new URL(req.url).searchParams;
  const kunde = await ladeKunde(params.get("id") ?? "");
  const name = params.get("name") ?? "";
  if (!kunde) return json({ error: "Kunde nicht gefunden." }, 404);
  if (!NAME_PATTERN.test(name)) return json({ error: "Ungültiger Dateiname." }, 400);
  const contentType = (req.headers.get("content-type") ?? "").split(";")[0];
  if (!["video/mp4", "video/webm", "image/png", "image/jpeg"].includes(contentType)) return json({ error: "Nur MP4, WebM, PNG oder JPEG." }, 415);
  const data = new Uint8Array(await req.arrayBuffer());
  if (!data.length) return json({ error: "Leere Datei." }, 400);
  return json({ pfad: await speichereMedium(kunde.id, name, data, contentType) }, 201);
};

export const config: Config = {
  path: "/api/admin/medien",
};
