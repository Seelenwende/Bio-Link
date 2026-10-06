import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { ID_PATTERN, store, type VideoJob } from "../lib/avatar.mts";

const STALE_MS = 16 * 60 * 1000;

// Meldet, ob das Video fertig ist. Fertige und fehlgeschlagene Aufträge werden danach gelöscht;
// das Video selbst steht dann in der Liste des Avatars.
export default async (req: Request, _context: Context) => {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!ID_PATTERN.test(id)) return json({ error: "Ungültige Anfrage." }, 400);

  const s = store();
  const job = (await s.get(`job/${id}`, { type: "json" })) as VideoJob | null;
  if (!job) return json({ status: "error", error: "Dieser Auftrag ist nicht mehr da. Schau in der Liste deiner Videos nach." }, 404);

  if (job.status === "pending" || job.status === "running") {
    if (Date.now() - job.createdAt > STALE_MS) {
      await s.delete(`job/${id}`);
      return json({ status: "error", error: "Das hat zu lange gedauert. Bitte versuch es noch einmal." });
    }
    return json({ status: "pending" });
  }

  await s.delete(`job/${id}`);
  if (job.status === "done") return json({ status: "done", video: { id, createdAt: job.createdAt, text: job.text } });
  return json({ status: "error", error: job.error ?? "Das Video konnte nicht erstellt werden." });
};

export const config: Config = {
  path: "/api/avatar/video/status",
};
