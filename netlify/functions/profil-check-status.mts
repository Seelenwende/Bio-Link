import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { STORE_NAME, ID_PATTERN, json } from "../lib/common.mts";

export default async (req: Request, _context: Context) => {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!ID_PATTERN.test(id)) return json({ error: "Ungültige ID." }, 400);

  const entry = await getStore({ name: STORE_NAME, consistency: "strong" }).get(id, { type: "json" });
  if (!entry) return json({ error: "Analyse nicht gefunden." }, 404);
  return json(entry);
};

export const config: Config = {
  path: "/api/profil-check/status",
};
