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

export async function fetchInstagramProfile(handle: string, postLimit = 12): Promise<IgProfile> {
  const version = Netlify.env.get("IG_GRAPH_VERSION") || "v23.0";
  const igUserId = Netlify.env.get("IG_USER_ID");
  const token = Netlify.env.get("IG_ACCESS_TOKEN");
  const fields =
    `business_discovery.username(${handle}){username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url,` +
    `media.limit(${postLimit}){caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink,media_url,thumbnail_url}}`;
  const url = `https://graph.facebook.com/${version}/${igUserId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token ?? "")}`;

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = data.error ?? {};
    console.error("instagram error", res.status, err);
    if (err.code === 190) throw new InstagramError("Der Instagram-Zugang ist abgelaufen. Bitte IG_ACCESS_TOKEN in Netlify erneuern.");
    if (err.code === 4 || err.code === 17 || err.code === 32) throw new InstagramError("Instagram-Limit erreicht – bitte in einer Stunde noch einmal.");
    throw new InstagramError(
      `Das Profil @${handle} konnte nicht gelesen werden. Es muss öffentlich und ein Creator- oder Business-Konto sein.`,
    );
  }

  const bd = data.business_discovery;
  const posts: IgPost[] = (bd.media?.data ?? []).map((m: Record<string, any>) => ({
    caption: m.caption ?? "",
    type: m.media_product_type === "REELS" || m.media_type === "VIDEO" ? "Reel" : m.media_type === "CAROUSEL_ALBUM" ? "Karussell" : "Post",
    timestamp: m.timestamp ?? "",
    likes: m.like_count ?? null,
    comments: m.comments_count ?? null,
    permalink: m.permalink ?? "",
    imageUrl: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? null,
  }));

  return {
    username: bd.username,
    name: bd.name ?? "",
    biography: bd.biography ?? "",
    website: bd.website ?? "",
    followers: bd.followers_count ?? null,
    following: bd.follows_count ?? null,
    mediaCount: bd.media_count ?? null,
    profilePictureUrl: bd.profile_picture_url ?? null,
    posts,
  };
}
