import type { Config, Context } from "@netlify/functions";
import { adminFromRequest, json, normalizeUrl, startAufgabe } from "../lib/common.mts";
import { KANAELE, alleKunden, neuerKunde, speichereKunde, type Kanal } from "../lib/kunden.mts";

/* GET: alle Kunden · POST: neuen Kunden anlegen und den Ablauf starten
   Body: { website, name?, email?, instagram?, facebook?, linkedin? } */
export default async (req: Request, _context: Context) => {
  if (!adminFromRequest(req)) return json({ error: "Admin-Schlüssel fehlt oder ist falsch." }, 401);

  if (req.method === "GET") {
    const kunden = await alleKunden();
    return json({
      kunden: kunden.map((k) => ({ id: k.id, name: k.name, website: k.website, phase: k.phase, schritte: k.schritte, erstellt: k.erstellt, kostenUsd: k.kostenUsd })),
      konfiguriert: {
        anthropic: Boolean(Netlify.env.get("ANTHROPIC_API_KEY")),
        buffer: Boolean(Netlify.env.get("BUFFER_API_TOKEN")),
        webhook: Boolean(Netlify.env.get("DIGITALSEED_WEBHOOK_URL")),
        instagram: Boolean(Netlify.env.get("IG_USER_ID") && Netlify.env.get("IG_ACCESS_TOKEN")),
      },
    });
  }

  if (req.method !== "POST") return json({ error: "Nur GET oder POST." }, 405);
  if (!Netlify.env.get("ANTHROPIC_API_KEY")) return json({ error: "ANTHROPIC_API_KEY fehlt in Netlify." }, 503);

  const body = await req.json().catch(() => null);
  const website = normalizeUrl(String(body?.website ?? ""));
  if (!website) return json({ error: "Bitte eine gültige Website-Adresse eingeben." }, 400);

  const profile: Partial<Record<Kanal, string>> = {};
  for (const kanal of KANAELE) {
    const raw = String(body?.[kanal] ?? "").trim();
    if (!raw) continue;
    const url = kanal === "instagram" && /^@?[A-Za-z0-9._]{1,30}$/.test(raw) ? `https://www.instagram.com/${raw.replace(/^@/, "")}/` : normalizeUrl(raw);
    if (!url) return json({ error: `Die Adresse für ${kanal} ist ungültig.` }, 400);
    profile[kanal] = url;
  }
  const email = String(body?.email ?? "").trim().slice(0, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Die E-Mail-Adresse ist ungültig." }, 400);

  const kunde = neuerKunde({ name: String(body?.name ?? "").trim().slice(0, 120), website, email, profile });
  await speichereKunde(kunde);
  const gestartet = await startAufgabe(new URL(req.url).origin, { aufgabe: "schritt", kundeId: kunde.id });
  if (!gestartet) return json({ error: "Kunde angelegt, aber der Ablauf konnte nicht gestartet werden. Bitte im Dashboard neu starten.", id: kunde.id }, 502);
  return json({ id: kunde.id }, 201);
};

export const config: Config = {
  path: "/api/admin/kunden",
};
