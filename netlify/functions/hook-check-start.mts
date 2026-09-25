import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { STORE_NAME, InputSchema, checkAccessCode, isConfigured, json } from "../lib/hook-check.mts";
import { HANDLE_PATTERN, InstagramError, fetchInstagramProfile, isInstagramConfigured, normalizeHandle } from "../lib/instagram.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isConfigured()) return json({ error: "Die KI-Analyse ist noch nicht eingerichtet (Umgebungsvariablen fehlen)." }, 503);

  let body: { accessCode?: unknown; mode?: unknown; handle?: unknown; input?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }
  if (!checkAccessCode(body.accessCode)) return json({ error: "Der Zugangscode stimmt nicht." }, 401);

  let job: Record<string, unknown>;
  let preview: Record<string, unknown> | undefined;

  if (body.mode === "profile") {
    if (!isInstagramConfigured()) return json({ error: "Der Instagram-Zugang ist noch nicht eingerichtet (IG_USER_ID / IG_ACCESS_TOKEN fehlen)." }, 503);
    const handle = normalizeHandle(String(body.handle ?? ""));
    if (!HANDLE_PATTERN.test(handle)) return json({ error: "Bitte gib einen gültigen Instagram-Namen ein, z. B. @_seelenwende." }, 400);
    try {
      const profile = await fetchInstagramProfile(handle);
      job = { mode: "profile", profile };
      preview = {
        username: profile.username, name: profile.name, followers: profile.followers,
        mediaCount: profile.mediaCount, profilePictureUrl: profile.profilePictureUrl, posts: profile.posts.length,
      };
    } catch (err) {
      if (err instanceof InstagramError) return json({ error: err.message }, 422);
      throw err;
    }
  } else {
    const parsed = InputSchema.safeParse(body.input);
    if (!parsed.success) return json({ error: "Die Eingaben sind zu lang oder unvollständig (max. 15 Posts)." }, 400);
    if (!parsed.data.bio.trim() && !parsed.data.posts.some((p) => p.text.trim())) {
      return json({ error: "Füge mindestens deine Bio oder einen Post ein." }, 400);
    }
    job = { mode: "hook", input: parsed.data };
  }

  const id = crypto.randomUUID();
  await getStore(STORE_NAME).setJSON(id, { status: "pending", createdAt: Date.now() });

  const res = await fetch(new URL("/.netlify/functions/hook-check-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, accessCode: body.accessCode, ...job }),
  });
  if (res.status !== 202) return json({ error: "Die Analyse konnte nicht gestartet werden." }, 502);

  return json({ id, preview }, 202);
};

export const config: Config = {
  path: "/api/hook-check/start",
};
