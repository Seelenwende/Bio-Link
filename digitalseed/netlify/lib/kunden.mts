import { getStore } from "@netlify/blobs";
import { ID_PATTERN, TOKEN_PATTERN, newToken } from "./common.mts";

/* ---------- Ablauf ---------- */

export const SCHRITTE = [
  { key: "erfassung", titel: "Website und Profile erfassen" },
  { key: "analyse", titel: "Analyse und Bewertung" },
  { key: "marke", titel: "Logo, Stimmprofil und CI-Farben" },
  { key: "website", titel: "Demo der neuen Website" },
  { key: "newsletter", titel: "Newsletter-Vorlage" },
  { key: "vorlagen", titel: "Vorlagen für Instagram, Facebook und LinkedIn" },
  { key: "strategie", titel: "Contentplan und Redaktionsplan" },
  { key: "inhalte", titel: "Beiträge und Newsletter texten" },
  { key: "medien", titel: "Bilder und Reels erzeugen" },
] as const;

export type SchrittKey = (typeof SCHRITTE)[number]["key"];
export const SCHRITT_KEYS = SCHRITTE.map((s) => s.key) as SchrittKey[];

/* Kundenreise: Produktion (automatisch) → Prüfung (du) → Freigabe (Kunde) → Live (Posten + Berichte) */
export type Phase = "produktion" | "pruefung" | "freigabe" | "live";

export type Kanal = "instagram" | "facebook" | "linkedin";
export const KANAELE: Kanal[] = ["instagram", "facebook", "linkedin"];
export const KANAL_NAME: Record<Kanal, string> = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn" };

export interface SchrittStatus {
  status: "offen" | "laeuft" | "fertig" | "fehler";
  start?: number;
  ende?: number;
  fehler?: string;
}

export interface Kunde {
  id: string;
  token: string; // geheimer Link zum Kundenportal
  name: string;
  website: string;
  email: string;
  profile: Partial<Record<Kanal, string>>;
  phase: Phase;
  schritte: Record<SchrittKey, SchrittStatus>;
  startDatum: string; // Montag der ersten Content-Woche, YYYY-MM-DD
  buffer: Partial<Record<Kanal, string>>; // Buffer-Kanal-IDs des Kunden
  kostenUsd: number;
  erstellt: number;
  aktualisiert: number;
  gesendet?: number;
}

/* ---------- Marke (Ergebnis von Schritt 3) ---------- */

export interface Marke {
  name: string;
  claim: string;
  branche: string;
  zielgruppe: string;
  logo: { pfad: string | null; vorschau: string | null; aufDunkel: boolean };
  farben: { primaer: string; sekundaer: string; akzent: string; hell: string; dunkel: string };
  farbBegruendung: string;
  schriften: { titel: string; text: string };
  stimme: {
    zusammenfassung: string;
    anrede: "du" | "Sie";
    sprache: string;
    tonalitaet: string[];
    typischeWoerter: string[];
    vermeiden: string[];
    beispielsaetze: string[];
  };
  fusszeile: string; // z. B. Domain oder @handle für die Grafiken
}

/* ---------- Inhalte ---------- */

export type Layout = "aussage" | "tipps" | "zitat" | "zahl" | "frage";
export type Format = "bild" | "karussell" | "reel";

export interface Folie {
  titel: string;
  text: string;
}

export interface Beitrag {
  id: string;
  kanal: Kanal;
  datum: string; // ISO mit Zeitzone
  woche: number; // 1–13
  monat: number; // 1–3
  saeule: string;
  thema: string;
  format: Format;
  layout: Layout;
  grafik: { titel: string; untertitel: string; punkte: string[]; bild: number | null };
  folien: Folie[]; // Karussell-Folien bzw. Reel-Szenen
  text: string;
  hashtags: string[];
  alt: string;
  medien: string[]; // Pfade unter /medien/
  video?: string; // Pfad des Reel-Videos, wenn im Dashboard erzeugt
}

export interface NewsletterAusgabe {
  id: string;
  monat: number;
  datum: string;
  betreff: string;
  vorschau: string;
  einleitung: string;
  abschnitte: { titel: string; text: string; button: string }[];
  abschluss: string;
}

export interface Inhalte {
  beitraege: Beitrag[];
  newsletter: NewsletterAusgabe[];
}

export interface FreigabeEintrag {
  status: "offen" | "freigegeben" | "aenderung" | "in_arbeit";
  kommentar?: string; // aktueller Änderungswunsch
  ueberarbeitet?: string; // letzter umgesetzter Wunsch, damit die Kundin sieht, was neu ist
  zeit?: number;
}

export type Freigaben = Record<string, FreigabeEintrag>;

export interface BufferEintrag {
  postId?: string;
  fehler?: string;
  zeit: number;
}

/* ---------- Speicher ---------- */

const STORE = "digitalseed";
const store = () => getStore({ name: STORE, consistency: "strong" });

export async function ladeKunde(id: string): Promise<Kunde | null> {
  if (!ID_PATTERN.test(id)) return null;
  return (await store().get(`kunden/${id}`, { type: "json" })) as Kunde | null;
}

export async function speichereKunde(kunde: Kunde): Promise<void> {
  kunde.aktualisiert = Date.now();
  await store().setJSON(`kunden/${kunde.id}`, kunde);
  await store().set(`token/${kunde.token}`, kunde.id);
}

/* Lesen, ändern, schreiben – für kleine Änderungen am Kunden aus verschiedenen Funktionen. */
export async function aendereKunde(id: string, fn: (k: Kunde) => void): Promise<Kunde> {
  const kunde = await ladeKunde(id);
  if (!kunde) throw new Error("Kunde nicht gefunden.");
  fn(kunde);
  await speichereKunde(kunde);
  return kunde;
}

export async function kundeZuToken(token: string): Promise<Kunde | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const id = await store().get(`token/${token}`, { type: "text" });
  return id ? ladeKunde(id) : null;
}

export async function alleKunden(): Promise<Kunde[]> {
  const { blobs } = await store().list({ prefix: "kunden/" });
  const kunden = await Promise.all(blobs.map((b) => store().get(b.key, { type: "json" }) as Promise<Kunde | null>));
  return kunden.filter((k): k is Kunde => Boolean(k)).sort((a, b) => b.erstellt - a.erstellt);
}

export async function loescheKunde(kunde: Kunde): Promise<void> {
  const s = store();
  const { blobs } = await s.list({ prefix: `daten/${kunde.id}/` });
  await Promise.all(blobs.map((b) => s.delete(b.key)));
  await s.delete(`token/${kunde.token}`);
  await s.delete(`kunden/${kunde.id}`);
  const medien = getStore("digitalseed-medien");
  const { blobs: dateien } = await medien.list({ prefix: `${kunde.id}/` });
  await Promise.all(dateien.map((b) => medien.delete(b.key)));
}

/* Ergebnisse je Kunde: daten/<id>/<name> */
export async function ladeDaten<T>(id: string, name: string): Promise<T | null> {
  return (await store().get(`daten/${id}/${name}`, { type: "json" })) as T | null;
}

export async function speichereDaten(id: string, name: string, value: unknown): Promise<void> {
  await store().setJSON(`daten/${id}/${name}`, value);
}

export async function ladeText(id: string, name: string): Promise<string | null> {
  return store().get(`daten/${id}/${name}`, { type: "text" });
}

export async function speichereText(id: string, name: string, value: string): Promise<void> {
  await store().set(`daten/${id}/${name}`, value);
}

export async function listeDaten(id: string, prefix: string): Promise<string[]> {
  const { blobs } = await store().list({ prefix: `daten/${id}/${prefix}` });
  return blobs.map((b) => b.key.slice(`daten/${id}/`.length));
}

/* ---------- Neuer Kunde ---------- */

function naechsterMontag(von = new Date()): string {
  const d = new Date(Date.UTC(von.getUTCFullYear(), von.getUTCMonth(), von.getUTCDate()));
  const tage = ((8 - d.getUTCDay()) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + tage + 7); // eine Woche Puffer für Prüfung und Freigabe
  return d.toISOString().slice(0, 10);
}

export function neuerKunde(input: { name: string; website: string; email: string; profile: Kunde["profile"] }): Kunde {
  const jetzt = Date.now();
  return {
    id: crypto.randomUUID(),
    token: newToken(),
    name: input.name,
    website: input.website,
    email: input.email,
    profile: input.profile,
    phase: "produktion",
    schritte: Object.fromEntries(SCHRITT_KEYS.map((k) => [k, { status: "offen" }])) as Kunde["schritte"],
    startDatum: naechsterMontag(),
    buffer: {},
    kostenUsd: 0,
    erstellt: jetzt,
    aktualisiert: jetzt,
  };
}

export function naechsterSchritt(kunde: Kunde): SchrittKey | null {
  return SCHRITT_KEYS.find((k) => kunde.schritte[k].status !== "fertig") ?? null;
}
