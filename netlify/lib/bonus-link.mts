/* Zeitlich begrenzte, signierte Links für Bonus-Dateien unter /bonus/.
   Läuft mit Web Crypto, damit Funktion (Node) und Edge-Funktion (Deno) denselben Code nutzen. */

const GUELTIG_MS = 3 * 60 * 60 * 1000;
const encoder = new TextEncoder();

async function geheimnis(): Promise<CryptoKey> {
  // Eigenes Geheimnis über BONUS_SECRET; sonst aus den Programm-Codes abgeleitet.
  const roh = Netlify.env.get("BONUS_SECRET") || "bonus:" + (Netlify.env.get("PROGRAMM_CODES") ?? "");
  return crypto.subtle.importKey("raw", encoder.encode(roh), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function base64url(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signatur(pfad: string, ablauf: number): Promise<string> {
  return base64url(await crypto.subtle.sign("HMAC", await geheimnis(), encoder.encode(pfad + "|" + ablauf)));
}

/** Link zu /bonus/<datei>, der drei Stunden gilt. */
export async function signierterLink(datei: string): Promise<string> {
  const pfad = "/bonus/" + datei;
  const ablauf = Date.now() + GUELTIG_MS;
  return `${pfad}?ablauf=${ablauf}&sig=${await signatur(pfad, ablauf)}`;
}

export async function linkIstGueltig(url: URL): Promise<boolean> {
  const ablauf = Number(url.searchParams.get("ablauf"));
  const sig = url.searchParams.get("sig") ?? "";
  if (!Number.isFinite(ablauf) || ablauf < Date.now() || !sig) return false;
  const erwartet = await signatur(decodeURIComponent(url.pathname), ablauf);
  if (erwartet.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= erwartet.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
