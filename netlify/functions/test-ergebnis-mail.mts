import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { mailFelder, parsePunkte } from "../lib/glaubenssaetze.mts";

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

// Trägt die Frau mit ihrem Testergebnis in MailerLite ein. Die Mail selbst verschickt eine
// MailerLite-Automatisierung, sobald sie in der Gruppe landet (bei Double-Opt-in erst nach der Bestätigung).
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  const apiKey = Netlify.env.get("MAILERLITE_API_KEY");
  const gruppe = Netlify.env.get("MAILERLITE_GROUP_GLAUBENSSAETZE");
  if (!apiKey || !gruppe) return json({ error: "Der Mail-Versand ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  // Unsichtbares Feld: Wird es ausgefüllt, war es ein Bot. Antwort wie bei Erfolg, damit er nichts lernt.
  if (body?.website) return json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) return json({ error: "Bitte prüf deine Mail-Adresse." }, 400);
  if (body?.einwilligung !== true) return json({ error: "Bitte bestätige, dass du die Mail bekommen möchtest." }, 400);

  const punkte = parsePunkte(body?.punkte);
  if (!punkte) return json({ error: "Das Ergebnis ist unvollständig. Mach den Test bitte noch einmal." }, 400);

  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ email, fields: mailFelder(punkte), groups: [gruppe] }),
  });
  if (!res.ok) {
    console.error("mailerlite", res.status, await res.text().catch(() => ""));
    return json({ error: "Das hat gerade nicht geklappt. Versuch es bitte später noch einmal." }, 502);
  }
  return json({ ok: true });
};

export const config: Config = {
  path: "/api/glaubenssaetze/mail",
};
