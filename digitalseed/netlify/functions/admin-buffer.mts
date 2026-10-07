import type { Config, Context } from "@netlify/functions";
import { adminFromRequest, errorMessage, json } from "../lib/common.mts";
import { isBufferConfigured, kanaele } from "../lib/buffer.mts";

/* Die in Buffer verbundenen Kanäle, zum Zuordnen pro Kunde im Dashboard */
export default async (req: Request, _context: Context) => {
  if (!adminFromRequest(req)) return json({ error: "Passwort fehlt oder ist falsch." }, 401);
  if (!isBufferConfigured()) return json({ kanaele: [], hinweis: "BUFFER_API_TOKEN ist nicht gesetzt." });
  try {
    return json({ kanaele: await kanaele() });
  } catch (err) {
    return json({ error: errorMessage(err) }, 502);
  }
};

export const config: Config = {
  path: "/api/admin/buffer",
};
