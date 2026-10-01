import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

// Bio-Link: Bevor eine Frau die kostenlosen Werkzeuge öffnet, trägt sie ihre Mail-Adresse ein.
// Sie landet in MailerLite in der Gruppe „Bio-Link Werkzeuge“ (ohne Gruppe, solange die Variable fehlt).
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  const apiKey = Netlify.env.get("MAILERLITE_API_KEY");
  const gruppe = Netlify.env.get("MAILERLITE_GROUP_WERKZEUGE");
  if (!apiKey) return json({ error: "Die Anmeldung ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  // Unsichtbares Feld: Wird es ausgefüllt, war es ein Bot. Antwort wie bei Erfolg, damit er nichts lernt.
  if (body?.website) return json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) return json({ error: "Bitte prüf deine Mail-Adresse." }, 400);
  if (body?.einwilligung !== true) return json({ error: "Bitte bestätige, dass du Mails von Seelenwende bekommen möchtest." }, 400);

  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(gruppe ? { email, groups: [gruppe] } : { email }),
  });
  if (!res.ok) {
    console.error("mailerlite", res.status, await res.text().catch(() => ""));
    return json({ error: "Das hat gerade nicht geklappt. Versuch es bitte später noch einmal." }, 502);
  }
  return json({ ok: true });
};

export const config: Config = {
  path: "/api/werkzeuge/anmelden",
};
