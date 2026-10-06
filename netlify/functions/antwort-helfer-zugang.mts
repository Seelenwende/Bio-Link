import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { checkLimit, getUsage, isAntwortHelferConfigured, isValidCode } from "../lib/antwort-helfer.mts";

// Prüft den Zugangscode, bevor die erste Nachricht eingefügt wird.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isAntwortHelferConfigured()) return json({ error: "Der Antwort-Helfer ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!(await isValidCode(body?.code))) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);

  const limit = checkLimit();
  const used = await getUsage(body.code);
  if (used >= limit) return json({ error: "Die Prüfungen dieses Zugangs sind aufgebraucht." }, 403);
  return json({ ok: true, used, limit });
};

export const config: Config = {
  path: "/api/antwort-helfer/zugang",
};
