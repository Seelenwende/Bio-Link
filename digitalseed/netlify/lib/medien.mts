import { getStore } from "@netlify/blobs";

/* Bilder, Logos und Videos je Kunde. Öffentlich abrufbar unter /medien/<kundeId>/<name>,
   damit Buffer und die Kundin sie laden können. Die Kunden-ID ist eine zufällige UUID. */

const STORE = "digitalseed-medien";
const store = () => getStore({ name: STORE, consistency: "strong" });

export const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,80}$/;

export interface Medium {
  data: Uint8Array;
  contentType: string;
}

export function medienPfad(kundeId: string, name: string): string {
  return `/medien/${kundeId}/${name}`;
}

export async function speichereMedium(kundeId: string, name: string, data: Uint8Array, contentType: string): Promise<string> {
  if (!NAME_PATTERN.test(name)) throw new Error(`Ungültiger Dateiname: ${name}`);
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  await store().set(`${kundeId}/${name}`, buffer, { metadata: { contentType } });
  return medienPfad(kundeId, name);
}

export async function ladeMedium(kundeId: string, name: string): Promise<Medium | null> {
  if (!NAME_PATTERN.test(name)) return null;
  const entry = await store().getWithMetadata(`${kundeId}/${name}`, { type: "arrayBuffer" });
  if (!entry) return null;
  return { data: new Uint8Array(entry.data), contentType: String(entry.metadata.contentType ?? "application/octet-stream") };
}

/* Pfad /medien/<kundeId>/<name> → Medium */
export async function ladeMediumPfad(pfad: string): Promise<Medium | null> {
  const m = pfad.match(/^\/medien\/([0-9a-f-]{36})\/([^/]+)$/);
  return m ? ladeMedium(m[1], m[2]) : null;
}

const ERLAUBT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];

/* Datei aus dem Netz laden, mit Grössen- und Typprüfung. */
export async function ladeExtern(url: string, maxBytes = 6_000_000): Promise<Medium | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: "follow", headers: { "user-agent": UA } });
    if (!res.ok) return null;
    let contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const data = new Uint8Array(await res.arrayBuffer());
    if (data.length === 0 || data.length > maxBytes) return null;
    if (!ERLAUBT.includes(contentType)) contentType = schnueffle(data) ?? contentType;
    if (!ERLAUBT.includes(contentType)) return null;
    return { data, contentType };
  } catch {
    return null;
  }
}

function schnueffle(d: Uint8Array): string | null {
  if (d[0] === 0xff && d[1] === 0xd8) return "image/jpeg";
  if (d[0] === 0x89 && d[1] === 0x50) return "image/png";
  if (d[0] === 0x52 && d[1] === 0x49 && d[8] === 0x57) return "image/webp";
  if (d[0] === 0x47 && d[1] === 0x49) return "image/gif";
  const head = new TextDecoder().decode(d.slice(0, 300)).toLowerCase();
  if (head.includes("<svg")) return "image/svg+xml";
  return null;
}

export function endung(contentType: string): string {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "video/mp4": "mp4", "video/webm": "webm" } as Record<string, string>)[contentType] ?? "bin";
}

// Viele Seiten liefern einfachen Bots eine leere Seite aus, darum eine übliche Browser-Kennung.
export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
