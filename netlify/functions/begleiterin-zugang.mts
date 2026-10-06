import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { accessInfo, exhaustedMessage, getUsage, isMiraConfigured, resolveAccess } from "../lib/zugang.mts";

// Prüft den Zugangscode, bevor das Gespräch beginnt.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isMiraConfigured()) return json({ error: "Die Begleiterin ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  const access = await resolveAccess(body?.code);
  if (!access) return json({ error: "Dieser Zugangscode ist ungültig. Prüf ihn in deiner Bestätigungs-Mail." }, 401);

  const used = await getUsage(access);
  if (used >= access.limit) return json({ error: exhaustedMessage(access) }, 403);
  return json({ ok: true, ...accessInfo(access, used) });
};

export const config: Config = {
  path: "/api/begleiterin/zugang",
};
