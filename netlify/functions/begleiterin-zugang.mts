import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { getUsage, isBegleiterinConfigured, isValidCode, messageLimit } from "../lib/begleiterin.mts";

// Prüft den Zugangscode, bevor das Gespräch beginnt.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isBegleiterinConfigured()) return json({ error: "Die Begleiterin ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!isValidCode(body?.code)) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);

  const limit = messageLimit(body.code);
  const used = await getUsage(body.code);
  if (used >= limit) return json({ error: "Die Nachrichten dieses Zugangs sind aufgebraucht." }, 403);
  return json({ ok: true, used, limit });
};

export const config: Config = {
  path: "/api/begleiterin/zugang",
};
