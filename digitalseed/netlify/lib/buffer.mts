import type { Beitrag, Kanal } from "./kunden.mts";

/* Buffer GraphQL-API (https://api.buffer.com). Die Social-Media-Kanäle der Kunden werden in
   deinem Buffer-Konto verbunden; im Dashboard ordnest du jedem Kunden seine Kanäle zu. */

export function isBufferConfigured(): boolean {
  return Boolean(Netlify.env.get("BUFFER_API_TOKEN"));
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = Netlify.env.get("BUFFER_API_TOKEN");
  if (!token) throw new Error("BUFFER_API_TOKEN fehlt in Netlify.");
  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errors?.length) {
    const msg = data.errors?.map((e: { message: string }) => e.message).join("; ") || `HTTP ${res.status}`;
    throw new Error(`Buffer meldet: ${msg}`);
  }
  return data.data as T;
}

let orgCache: string | null = null;

export async function organisation(): Promise<string> {
  const fest = Netlify.env.get("BUFFER_ORGANIZATION_ID");
  if (fest) return fest;
  if (orgCache) return orgCache;
  const data = await gql<{ account: { organizations: { id: string }[] } }>(`query { account { organizations { id } } }`);
  const id = data.account.organizations[0]?.id;
  if (!id) throw new Error("Im Buffer-Konto ist keine Organisation vorhanden.");
  orgCache = id;
  return id;
}

export interface BufferKanal {
  id: string;
  name: string;
  service: string;
  avatar: string;
  getrennt: boolean;
}

export async function kanaele(): Promise<BufferKanal[]> {
  const organizationId = await organisation();
  const data = await gql<{ channels: { id: string; name: string; displayName: string | null; service: string; avatar: string; isDisconnected: boolean }[] }>(
    `query($input: ChannelsInput!) { channels(input: $input) { id name displayName service avatar isDisconnected } }`,
    { input: { organizationId } },
  );
  return data.channels.map((c) => ({ id: c.id, name: c.displayName || c.name, service: c.service, avatar: c.avatar, getrennt: c.isDisconnected }));
}

/* Plant einen freigegebenen Beitrag zum vorgesehenen Zeitpunkt ein. */
export async function planeBeitrag(beitrag: Beitrag, channelId: string, basisUrl: string): Promise<string> {
  const text = [beitrag.text.trim(), beitrag.hashtags.length ? beitrag.hashtags.map((h) => `#${h}`).join(" ") : ""].filter(Boolean).join("\n\n");
  const istReel = beitrag.format === "reel" && Boolean(beitrag.video);
  const assets = istReel
    ? [{ video: { url: basisUrl + beitrag.video, thumbnailUrl: basisUrl + beitrag.medien[0] } }]
    : (beitrag.format === "reel" ? beitrag.medien.slice(0, 1) : beitrag.medien).map((m) => ({ image: { url: basisUrl + m, metadata: { altText: beitrag.alt.slice(0, 1000) } } }));

  const metadata: Partial<Record<Kanal, unknown>> = {};
  if (beitrag.kanal === "instagram") metadata.instagram = { type: istReel ? "reel" : assets.length > 1 ? "carousel" : "post", shouldShareToFeed: true };
  if (beitrag.kanal === "facebook") metadata.facebook = { type: istReel ? "reel" : "post" };

  const data = await gql<{ createPost: { __typename: string; post?: { id: string }; message?: string } }>(
    `mutation($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess { post { id } }
        ... on MutationError { message }
      }
    }`,
    {
      input: {
        channelId,
        text,
        assets,
        metadata,
        mode: "customScheduled",
        schedulingType: "automatic",
        dueAt: beitrag.datum,
        source: "digitalseed",
      },
    },
  );
  const r = data.createPost;
  if (!r.post) throw new Error(r.message || `Buffer: ${r.__typename}`);
  return r.post.id;
}

export interface Kennzahl {
  name: string;
  typ: string;
  einheit: string;
  wert: number;
}

export interface GesendeterPost {
  id: string;
  kanal: string;
  text: string;
  gesendet: string | null;
  link: string | null;
  kennzahlen: Kennzahl[];
}

/* Kennzahlen eines Zeitraums: Summen je Kanal und die einzelnen veröffentlichten Beiträge */
export async function kennzahlen(channelIds: string[], start: string, ende: string): Promise<{ summen: Record<string, Kennzahl[]>; posts: GesendeterPost[] }> {
  const organizationId = await organisation();
  const summen: Record<string, Kennzahl[]> = {};
  for (const channelId of channelIds) {
    const data = await gql<{ aggregatedPostMetrics: { metrics: { name: string; type: string; unit: string; value: number }[] } }>(
      `query($input: AggregatedPostMetricsInput!) { aggregatedPostMetrics(input: $input) { metrics { name type unit value } } }`,
      { input: { organizationId, channelIds: [channelId], startDateTime: start, endDateTime: ende } },
    );
    summen[channelId] = data.aggregatedPostMetrics.metrics.map((m) => ({ name: m.name, typ: m.type, einheit: m.unit, wert: m.value }));
  }
  const data = await gql<{ posts: { edges: { node: { id: string; channelId: string; text: string; sentAt: string | null; externalLink: string | null; metrics: { name: string; type: string; unit: string; value: number }[] | null } }[] | null } }>(
    `query($input: PostsInput!) {
      posts(first: 100, input: $input) {
        edges { node { id channelId text sentAt externalLink metrics { name type unit value } } }
      }
    }`,
    { input: { organizationId, filter: { channelIds, status: ["sent"], dueAt: { start, end: ende } } } },
  );
  const posts = (data.posts.edges ?? []).map(({ node }) => ({
    id: node.id,
    kanal: node.channelId,
    text: node.text.slice(0, 300),
    gesendet: node.sentAt,
    link: node.externalLink,
    kennzahlen: (node.metrics ?? []).map((m) => ({ name: m.name, typ: m.type, einheit: m.unit, wert: m.value })),
  }));
  return { summen, posts };
}
