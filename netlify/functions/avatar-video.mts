import type { Config, Context } from "@netlify/functions";
import { ID_PATTERN, store } from "../lib/avatar.mts";

// Liefert ein fertiges Video. Die ID ist zufällig und nicht zu erraten; ohne sie gibt es nichts.
// Unterstützt Range-Anfragen, sonst spielt Safari auf dem iPhone das Video nicht ab.
export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!ID_PATTERN.test(id)) return new Response("Ungültige Anfrage.", { status: 400 });

  const data = await store().get(`video/${id}`, { type: "arrayBuffer" });
  if (!data) return new Response("Dieses Video ist nicht mehr da.", { status: 404 });

  const size = data.byteLength;
  const headers: Record<string, string> = {
    "content-type": "video/mp4",
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=3600",
    "content-disposition": url.searchParams.has("download") ? 'attachment; filename="avatar-video.mp4"' : "inline",
  };

  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    if (range[1]) {
      start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), size - 1);
    } else {
      start = Math.max(0, size - Number(range[2]));
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    }
    status = 206;
    headers["content-range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["content-length"] = String(end - start + 1);

  // Als Stream ausliefern, damit auch Videos über 6 MB durchgehen
  const chunk = new Uint8Array(data, start, end - start + 1);
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const STEP = 512 * 1024;
      for (let i = 0; i < chunk.length; i += STEP) controller.enqueue(chunk.subarray(i, i + STEP));
      controller.close();
    },
  });
  return new Response(body, { status, headers });
};

export const config: Config = {
  path: "/api/avatar/video",
};
