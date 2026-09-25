/* Liest ein öffentliches Business-/Creator-Profil über die offizielle Instagram Graph API
   ("Business Discovery"). Braucht IG_USER_ID (dein eigenes Instagram-Business-Konto) und
   IG_ACCESS_TOKEN (Token mit instagram_basic + pages_read_engagement). */

export const HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

export interface IgPost {
  caption: string;
  type: "Post" | "Karussell" | "Reel";
  timestamp: string;
  likes: number | null;
  comments: number | null;
  permalink: string;
  imageUrl: string | null;
}

export interface IgProfile {
  username: string;
  name: string;
  biography: string;
  website: string;
  followers: number | null;
  following: number | null;
  mediaCount: number | null;
  profilePictureUrl: string | null;
  posts: IgPost[];
}

export class InstagramError extends Error {}

export function isInstagramConfigured(): boolean {
  return Boolean(Netlify.env.get("IG_USER_ID") && Netlify.env.get("IG_ACCESS_TOKEN"));
}

export function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
}

const PROFILE_FIELDS = "username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url";
const mediaFields = (limit: number) =>
  `media.limit(${limit}){caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink,media_url,thumbnail_url}`;

async function graph(path: string, fields: string, handle: string): Promise<Record<string, any>> {
  const version = Netlify.env.get("IG_GRAPH_VERSION") || "v23.0";
  const token = Netlify.env.get("IG_ACCESS_TOKEN") ?? "";
  const url = `https://graph.facebook.com/${version}/${path}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (res.ok && !data.error) return data;

  const err = data.error ?? {};
  console.error("instagram error", res.status, err);
  if (err.code === 190) throw new InstagramError("Der Instagram-Zugang ist abgelaufen oder ungültig. Bitte IG_ACCESS_TOKEN in Netlify erneuern.");
  if (err.code === 4 || err.code === 17 || err.code === 32) throw new InstagramError("Instagram-Limit erreicht – bitte in einer Stunde noch einmal.");
  const detail = err.message ? ` Instagram meldet: „${err.message}“ (Code ${err.code ?? res.status}${err.error_subcode ? `/${err.error_subcode}` : ""}).` : "";
  throw new InstagramError(`Das Profil @${handle} konnte nicht gelesen werden.${detail}`);
}

function toProfile(p: Record<string, any>): IgProfile {
  const posts: IgPost[] = (p.media?.data ?? []).map((m: Record<string, any>) => ({
    caption: m.caption ?? "",
    type: m.media_product_type === "REELS" || m.media_type === "VIDEO" ? "Reel" : m.media_type === "CAROUSEL_ALBUM" ? "Karussell" : "Post",
    timestamp: m.timestamp ?? "",
    likes: m.like_count ?? null,
    comments: m.comments_count ?? null,
    permalink: m.permalink ?? "",
    imageUrl: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? null,
  }));

  return {
    username: p.username,
    name: p.name ?? "",
    biography: p.biography ?? "",
    website: p.website ?? "",
    followers: p.followers_count ?? null,
    following: p.follows_count ?? null,
    mediaCount: p.media_count ?? null,
    profilePictureUrl: p.profile_picture_url ?? null,
    posts,
  };
}

export async function fetchInstagramProfile(handle: string, postLimit = 12): Promise<IgProfile> {
  const igUserId = Netlify.env.get("IG_USER_ID") ?? "";

  // Eigenes Konto: direkt lesen (braucht nur instagram_basic)
  const own = await graph(igUserId, "username", handle);
  if (String(own.username).toLowerCase() === handle.toLowerCase()) {
    return toProfile(await graph(igUserId, `${PROFILE_FIELDS},${mediaFields(postLimit)}`, handle));
  }

  // Fremdes Konto: über Business Discovery
  const data = await graph(igUserId, `business_discovery.username(${handle}){${PROFILE_FIELDS},${mediaFields(postLimit)}}`, handle);
  return toProfile(data.business_discovery);
}
