import { getStore } from "@netlify/blobs";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { isCodeInList, normalizeCode } from "./codes.mts";

/* Zugangscodes, die Mira öffnen: Mira einzeln, 6-Wochen-Programm und Seelenwende Kreis.

   Zwei Quellen:
   - Umgebungsvariablen (von Hand gepflegt, nach Änderung neu deployen):
     BEGLEITERIN_CODES = Mira-Codes mit festem Kontingent (BEGLEITERIN_LIMIT, gesamt)
     PROGRAMM_CODES    = Programm-Codes mit festem Kontingent (PROGRAMM_MIRA_LIMIT, gesamt)
     KREIS_CODES       = Kreis-Codes mit Monatskontingent (KREIS_LIMIT, jeden Monat neu)
   - Code-Register in Netlify Blobs (über /api/zugang/admin, z. B. aus Make nach einem Kauf).
     Dort lassen sich Codes auch wieder sperren, etwa wenn ein Kreis-Abo gekündigt wird.

   Gespeichert wird nur der Hash eines Codes, nie der Code selbst. */

export type Plan = "mira" | "programm" | "kreis";
/** Was sich im Code-Register anlegen lässt. Programm-Codes stehen weiter in PROGRAMM_CODES, weil die Programmseite nur diese Liste kennt. */
export const REGISTER_PLANS: readonly Plan[] = ["mira", "kreis"];

const ZUGANG_STORE = "zugang";
const USAGE_STORE = "begleiterin"; // Zähler lagen schon vor dem Kreis hier; Schlüssel bleiben kompatibel.
const DEFAULT_MIRA_LIMIT = 300;
const DEFAULT_PROGRAMM_LIMIT = 1000;
const DEFAULT_KREIS_LIMIT = 150;
const TIME_ZONE = "Europe/Zurich";

export interface Access {
  plan: Plan;
  /** Hash des Codes (hex), Grundlage aller Schlüssel. */
  id: string;
  limit: number;
  /** Abrechnungsmonat "2026-10" beim Kreis, null bei Mira (Kontingent gilt einmal). */
  period: string | null;
}

export interface AccessInfo {
  plan: Plan;
  used: number;
  limit: number;
  /** Erster Tag des nächsten Monats (ISO-Datum), nur beim Kreis. */
  resetsOn: string | null;
}

interface CodeRecord {
  plan: Plan;
  active: boolean;
  ref?: string;
  createdAt: number;
  changedAt?: number;
}

/* ---------- Hilfsfunktionen ---------- */

function sha(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function codeId(code: string): string {
  return sha(normalizeCode(code)).toString("hex");
}

function refKey(ref: string): string {
  return "ref/" + sha(ref.trim()).toString("hex");
}

function envLimit(name: string, fallback: number): number {
  const n = Number(Netlify.env.get(name));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function limitFor(plan: Plan): number {
  if (plan === "kreis") return envLimit("KREIS_LIMIT", DEFAULT_KREIS_LIMIT);
  if (plan === "programm") return envLimit("PROGRAMM_MIRA_LIMIT", DEFAULT_PROGRAMM_LIMIT);
  return envLimit("BEGLEITERIN_LIMIT", DEFAULT_MIRA_LIMIT);
}

/** Heutiges Datum in der Schweiz als { year, month, day }. */
export function today(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function currentPeriod(): string {
  const t = today();
  return `${t.year}-${String(t.month).padStart(2, "0")}`;
}

function nextPeriodStart(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/* ---------- Code prüfen ---------- */

export function isMiraConfigured(): boolean {
  return Boolean(Netlify.env.get("ANTHROPIC_API_KEY"));
}

/** Liefert den Zugang zu einem Code oder null, wenn er unbekannt oder gesperrt ist. */
export async function resolveAccess(given: unknown): Promise<Access | null> {
  if (typeof given !== "string" || given.length > 64 || !given.trim()) return null;
  const id = codeId(given);

  let plan: Plan | null = null;
  const record = (await getStore(ZUGANG_STORE).get(`code/${id}`, { type: "json" })) as CodeRecord | null;
  if (record) {
    if (!record.active) return null; // gesperrt hat Vorrang, auch wenn der Code noch in einer Liste steht
    plan = record.plan;
  } else if (isCodeInList("KREIS_CODES", given)) {
    plan = "kreis";
  } else if (isCodeInList("BEGLEITERIN_CODES", given)) {
    plan = "mira";
  } else if (isCodeInList("PROGRAMM_CODES", given)) {
    plan = "programm";
  }
  if (!plan) return null;

  return { plan, id, limit: limitFor(plan), period: plan === "kreis" ? currentPeriod() : null };
}

/* ---------- Kontingent ---------- */

function usageKey(access: Access): string {
  return access.period ? `usage/${access.id}/${access.period}` : `usage/${access.id}`;
}

export async function getUsage(access: Access): Promise<number> {
  const data = (await getStore(USAGE_STORE).get(usageKey(access), { type: "json" })) as { used?: number } | null;
  return data?.used ?? 0;
}

export async function setUsage(access: Access, used: number): Promise<void> {
  await getStore(USAGE_STORE).setJSON(usageKey(access), { used, updatedAt: Date.now() });
}

export function accessInfo(access: Access, used: number): AccessInfo {
  return { plan: access.plan, used, limit: access.limit, resetsOn: access.period ? nextPeriodStart(access.period) : null };
}

export function exhaustedMessage(access: Access): string {
  if (access.plan !== "kreis" || !access.period) return "Die Nachrichten dieses Zugangs sind aufgebraucht.";
  const [y, m, d] = nextPeriodStart(access.period).split("-").map(Number);
  const datum = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("de-CH", { day: "numeric", month: "long", timeZone: "UTC" });
  return `Deine Mira-Nachrichten für diesen Monat sind aufgebraucht. Am ${datum} wird dein Kontingent wieder aufgefüllt.`;
}

/* ---------- Code-Register (Admin) ---------- */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0/O, 1/I

function randomGroup(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

export function checkAdminKey(header: string | null): boolean {
  const expected = Netlify.env.get("SEELENWENDE_ADMIN_KEY");
  if (!expected || expected.length < 16 || !header) return false;
  const given = header.replace(/^Bearer\s+/i, "");
  return timingSafeEqual(sha(given), sha(expected));
}

export async function createCode(plan: Plan, ref?: string): Promise<string> {
  const store = getStore(ZUGANG_STORE);
  if (ref) {
    const existing = await findByRef(ref);
    if (existing) throw new Error("Für diese Referenz gibt es schon einen Code. Nutze ihn weiter (falls gesperrt: entsperren) oder nimm eine andere Referenz.");
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `WENDE-${randomGroup(4)}-${randomGroup(4)}`;
    const id = codeId(code);
    if (await store.get(`code/${id}`)) continue;
    const record: CodeRecord = { plan, active: true, createdAt: Date.now(), ...(ref ? { ref: ref.trim() } : {}) };
    await store.setJSON(`code/${id}`, record);
    if (ref) await store.setJSON(refKey(ref), { id });
    return code;
  }
  throw new Error("Es konnte kein freier Code erzeugt werden. Bitte noch einmal versuchen.");
}

async function findByRef(ref: string): Promise<string | null> {
  const data = (await getStore(ZUGANG_STORE).get(refKey(ref), { type: "json" })) as { id?: string } | null;
  return data?.id ?? null;
}

/** Sucht einen Code im Register, wahlweise über den Code selbst oder die Referenz (z. B. Bestellnummer). */
async function lookup(target: { code?: string; ref?: string }): Promise<{ id: string; record: CodeRecord } | null> {
  const id = target.code ? codeId(target.code) : target.ref ? await findByRef(target.ref) : null;
  if (!id) return null;
  const record = (await getStore(ZUGANG_STORE).get(`code/${id}`, { type: "json" })) as CodeRecord | null;
  return record ? { id, record } : null;
}

export async function setActive(target: { code?: string; ref?: string }, active: boolean): Promise<CodeRecord | null> {
  const found = await lookup(target);
  if (!found) return null;
  const record: CodeRecord = { ...found.record, active, changedAt: Date.now() };
  await getStore(ZUGANG_STORE).setJSON(`code/${found.id}`, record);
  return record;
}

export async function describe(target: { code?: string; ref?: string }): Promise<(CodeRecord & AccessInfo) | null> {
  const found = await lookup(target);
  if (!found) return null;
  const access: Access = {
    plan: found.record.plan,
    id: found.id,
    limit: limitFor(found.record.plan),
    period: found.record.plan === "kreis" ? currentPeriod() : null,
  };
  return { ...found.record, ...accessInfo(access, await getUsage(access)) };
}
