import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import type { Beitrag, Kanal, Layout, Marke } from "./kunden.mts";

/* Beitragsgrafiken als SVG-Vorlagen in den CI-Farben und Schriften des Kunden,
   gerendert mit resvg (WebAssembly, läuft ohne Browser in der Netlify-Funktion). */

/* ---------- resvg und Schriften ---------- */

let wasmBereit: Promise<void> | null = null;

function initResvg(): Promise<void> {
  wasmBereit ??= (async () => {
    try {
      const pfad = createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm");
      await initWasm(await readFile(pfad));
    } catch {
      // Fallback, falls die Datei nicht mit der Funktion ausgeliefert wurde
      await initWasm(fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"));
    }
  })();
  return wasmBereit;
}

export interface Schriften {
  titel: string;
  text: string;
  buffers: Uint8Array[];
}

const schriftCache = new Map<string, Uint8Array[]>();

async function googleFont(familie: string, gewichte: number[]): Promise<Uint8Array[]> {
  const key = `${familie}:${gewichte.join(",")}`;
  const cached = schriftCache.get(key);
  if (cached) return cached;
  const name = encodeURIComponent(familie).replace(/%20/g, "+");
  for (const url of [`https://fonts.googleapis.com/css2?family=${name}:wght@${gewichte.join(";")}`, `https://fonts.googleapis.com/css2?family=${name}`]) {
    try {
      // Ohne Browser-Kennung liefert Google TTF statt WOFF2 – genau das braucht resvg
      const css = await (await fetch(url, { signal: AbortSignal.timeout(10000) })).text();
      const urls = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
      if (!urls.length) continue;
      const fonts = await Promise.all(urls.map(async (u) => new Uint8Array(await (await fetch(u, { signal: AbortSignal.timeout(10000) })).arrayBuffer())));
      schriftCache.set(key, fonts);
      return fonts;
    } catch {
      /* nächste Variante */
    }
  }
  return [];
}

export async function ladeSchriften(marke: Pick<Marke, "schriften">): Promise<Schriften> {
  await initResvg();
  let titel = marke.schriften.titel || "Inter";
  let text = marke.schriften.text || "Inter";
  let titelFonts = await googleFont(titel, [700]);
  if (!titelFonts.length) [titel, titelFonts] = ["Inter", await googleFont("Inter", [700])];
  let textFonts = await googleFont(text, [400, 700]);
  if (!textFonts.length) [text, textFonts] = ["Inter", await googleFont("Inter", [400, 700])];
  // Arimo ist metrisch gleich wie Arial: Ersatz für Systemschriften in SVG-Logos
  const buffers = [...titelFonts, ...textFonts, ...(await googleFont("Arimo", [400, 700]))];
  if (!buffers.length) throw new Error("Es konnten keine Schriften von Google Fonts geladen werden.");
  return { titel, text, buffers };
}

export async function svgZuPng(svg: string, breite?: number, schriften?: Schriften): Promise<Uint8Array> {
  await initResvg();
  // Ohne Markenschriften (z. B. Logo-Vorschau): Arimo als Ersatz für Arial, Helvetica & Co.
  schriften ??= { titel: "Arimo", text: "Arimo", buffers: await googleFont("Arimo", [400, 700]) };
  const resvg = new Resvg(svg, {
    fitTo: breite ? { mode: "width", value: breite } : { mode: "original" },
    font: { fontBuffers: schriften.buffers, loadSystemFonts: false, defaultFontFamily: schriften.text, sansSerifFamily: "Arimo", serifFamily: schriften.titel },
  });
  return resvg.render().asPng();
}

/* ---------- Text messen und umbrechen ---------- */

const breitenCache = new Map<string, number>();

function wortBreite(wort: string, familie: string, gewicht: number, schriften: Schriften): number {
  const key = `${familie}|${gewicht}|${wort}`;
  let w = breitenCache.get(key);
  if (w === undefined) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="200"><text x="0" y="150" font-family="${esc(familie)}" font-weight="${gewicht}" font-size="100">${esc(wort)}</text></svg>`;
    const bbox = new Resvg(svg, { font: { fontBuffers: schriften.buffers, loadSystemFonts: false, defaultFontFamily: familie } }).getBBox();
    w = bbox ? bbox.width : wort.length * 55;
    breitenCache.set(key, w);
  }
  return w;
}

interface Satz {
  zeilen: string[];
  groesse: number;
}

/* Passt Text in eine Box: verkleinert die Schrift, bis höchstens maxZeilen Zeilen entstehen. */
function setze(text: string, opts: { familie: string; gewicht: number; breite: number; max: number; min: number; maxZeilen: number }, schriften: Schriften): Satz {
  const woerter = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const leer = wortBreite("a a", opts.familie, opts.gewicht, schriften) - wortBreite("aa", opts.familie, opts.gewicht, schriften);
  for (let groesse = opts.max; groesse >= opts.min; groesse -= 4) {
    const f = groesse / 100;
    const zeilen: string[] = [];
    let zeile = "";
    let breite = 0;
    for (const wort of woerter) {
      const w = wortBreite(wort, opts.familie, opts.gewicht, schriften) * f;
      if (zeile && breite + leer * f + w > opts.breite) {
        zeilen.push(zeile);
        zeile = wort;
        breite = w;
      } else {
        breite += (zeile ? leer * f : 0) + w;
        zeile = zeile ? `${zeile} ${wort}` : wort;
      }
    }
    if (zeile) zeilen.push(zeile);
    const zuBreit = woerter.some((wort) => wortBreite(wort, opts.familie, opts.gewicht, schriften) * f > opts.breite);
    if (zeilen.length <= opts.maxZeilen && !zuBreit) return { zeilen, groesse };
  }
  // Notfalls kürzen
  const f = opts.min / 100;
  const zeilen: string[] = [];
  let zeile = "";
  for (const wort of woerter) {
    const probe = zeile ? `${zeile} ${wort}` : wort;
    if (wortBreite(probe, opts.familie, opts.gewicht, schriften) * f > opts.breite && zeile) {
      zeilen.push(zeile);
      zeile = wort;
      if (zeilen.length === opts.maxZeilen) break;
    } else zeile = probe;
  }
  if (zeilen.length < opts.maxZeilen && zeile) zeilen.push(zeile);
  if (zeilen.length === opts.maxZeilen) zeilen[zeilen.length - 1] = zeilen[zeilen.length - 1].replace(/\s*\S*$/, " …");
  return { zeilen, groesse: opts.min };
}

function textBlock(satz: Satz, x: number, y: number, opts: { familie: string; gewicht: number; farbe: string; zeilenhoehe?: number; anker?: "start" | "middle" }): string {
  const lh = satz.groesse * (opts.zeilenhoehe ?? 1.18);
  return `<text x="${x}" y="${y + satz.groesse * 0.8}" font-family="${esc(opts.familie)}" font-weight="${opts.gewicht}" font-size="${satz.groesse}" fill="${opts.farbe}" text-anchor="${opts.anker ?? "start"}">${satz.zeilen
    .map((z, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(z)}</tspan>`)
    .join("")}</text>`;
}

const hoehe = (satz: Satz, zeilenhoehe = 1.18) => satz.groesse * (1 + (satz.zeilen.length - 1) * zeilenhoehe);

/* ---------- Farben ---------- */

function luminanz(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(a: string, b: string): number {
  const [l1, l2] = [luminanz(a), luminanz(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* Lesbare Textfarbe auf einem Hintergrund: Markenfarbe „dunkel“ oder Weiss */
function aufFarbe(bg: string, marke: Marke): string {
  return kontrast(bg, marke.farben.dunkel) >= kontrast(bg, "#ffffff") ? marke.farben.dunkel : "#ffffff";
}

/* Akzentfarbe nur, wenn sie sich vom Hintergrund abhebt */
function akzentAuf(bg: string, marke: Marke): string {
  for (const f of [marke.farben.akzent, marke.farben.sekundaer, marke.farben.primaer]) if (kontrast(bg, f) >= 2.2) return f;
  return aufFarbe(bg, marke);
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- Vorlagen ---------- */

export const FORMATE: Record<Kanal | "reel", { b: number; h: number }> = {
  instagram: { b: 1080, h: 1350 },
  facebook: { b: 1080, h: 1080 },
  linkedin: { b: 1200, h: 1200 },
  reel: { b: 1080, h: 1920 },
};

export interface Bausteine {
  marke: Marke;
  schriften: Schriften;
  logo: string | null; // data:-URI
  foto: string | null; // data:-URI
}

interface Rahmen extends Bausteine {
  b: number;
  h: number;
  rand: number;
}

function rahmen(bs: Bausteine, b: number, h: number): Rahmen {
  return { ...bs, b, h, rand: Math.round(b * 0.083) };
}

function fusszeile(r: Rahmen, bg: string, nummer?: string): string {
  const { marke, schriften, logo, b, h, rand } = r;
  const farbe = aufFarbe(bg, marke);
  const y = h - rand * 0.62;
  let out = "";
  if (logo) {
    const lh = Math.round(b * 0.06);
    const lw = Math.round(lh * 3.2);
    const dunklerGrund = luminanz(bg) < 0.35;
    const badge = dunklerGrund !== marke.logo.aufDunkel; // Logo würde auf diesem Grund verschwinden
    const badgeFarbe = marke.logo.aufDunkel ? marke.farben.dunkel : "#ffffff";
    if (badge) out += `<rect x="${rand - 16}" y="${y - lh - 14}" width="${lw + 32}" height="${lh + 28}" rx="${(lh + 28) / 2}" fill="${badgeFarbe}"/>`;
    out += `<image href="${logo}" x="${rand}" y="${y - lh}" width="${lw}" height="${lh}" preserveAspectRatio="xMinYMid meet"/>`;
  } else {
    out += `<text x="${rand}" y="${y - 6}" font-family="${esc(schriften.titel)}" font-weight="700" font-size="${Math.round(b * 0.03)}" fill="${farbe}">${esc(marke.name)}</text>`;
  }
  const rechts = nummer ?? marke.fusszeile;
  if (rechts) out += `<text x="${b - rand}" y="${y - 6}" font-family="${esc(schriften.text)}" font-weight="400" font-size="${Math.round(b * 0.024)}" fill="${farbe}" fill-opacity="0.8" text-anchor="end">${esc(rechts)}</text>`;
  return out;
}

function svg(r: Rahmen, inhalt: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${r.b}" height="${r.h}" viewBox="0 0 ${r.b} ${r.h}">${inhalt}</svg>`;
}

function deko(r: Rahmen, farbe: string, deckkraft = 0.18): string {
  return `<circle cx="${r.b * 0.92}" cy="${r.h * 0.1}" r="${r.b * 0.34}" fill="${farbe}" fill-opacity="${deckkraft}"/><circle cx="${r.b * 0.05}" cy="${r.h * 0.95}" r="${r.b * 0.16}" fill="${farbe}" fill-opacity="${deckkraft * 0.7}"/>`;
}

function etikett(r: Rahmen, text: string, x: number, y: number, bg: string): string {
  if (!text) return "";
  const groesse = Math.round(r.b * 0.024);
  const breite = (wortBreite(text.toUpperCase(), r.schriften.text, 700, r.schriften) * groesse) / 100 + groesse * 1.6;
  const fill = akzentAuf(bg, r.marke);
  return `<rect x="${x}" y="${y}" width="${breite}" height="${groesse * 2}" rx="${groesse}" fill="${fill}"/><text x="${x + groesse * 0.8}" y="${y + groesse * 1.36}" font-family="${esc(r.schriften.text)}" font-weight="700" font-size="${groesse}" letter-spacing="1" fill="${aufFarbe(fill, r.marke)}">${esc(text.toUpperCase())}</text>`;
}

/* Aussage: grosse Headline, optional über einem Foto der Kunden-Website */
function aussage(r: Rahmen, g: { titel: string; untertitel: string; etikett: string }): string {
  const { marke, schriften, b, h, rand, foto } = r;
  const bg = foto ? "#111111" : marke.farben.primaer;
  const farbe = foto ? "#ffffff" : aufFarbe(bg, marke);
  const breite = b - rand * 2;
  const titel = setze(g.titel, { familie: schriften.titel, gewicht: 700, breite, max: Math.round(b * 0.1), min: Math.round(b * 0.05), maxZeilen: 5 }, schriften);
  const unter = g.untertitel ? setze(g.untertitel, { familie: schriften.text, gewicht: 400, breite, max: Math.round(b * 0.036), min: Math.round(b * 0.026), maxZeilen: 4 }, schriften) : null;
  const block = hoehe(titel) + (unter ? hoehe(unter, 1.35) + b * 0.04 : 0);
  const y0 = h - rand * 1.9 - block;
  let out = `<rect width="${b}" height="${h}" fill="${bg}"/>`;
  if (foto) {
    out += `<image href="${foto}" x="0" y="0" width="${b}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`;
    out += `<defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.05"/><stop offset="0.45" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="${marke.farben.dunkel}" stop-opacity="0.92"/></linearGradient></defs><rect width="${b}" height="${h}" fill="url(#v)"/>`;
  } else {
    out += deko(r, marke.farben.sekundaer === bg ? marke.farben.akzent : marke.farben.sekundaer, 0.22);
  }
  out += etikett(r, g.etikett, rand, y0 - b * 0.09, foto ? marke.farben.dunkel : bg);
  out += textBlock(titel, rand, y0, { familie: schriften.titel, gewicht: 700, farbe, zeilenhoehe: 1.12 });
  if (unter) out += textBlock(unter, rand, y0 + hoehe(titel, 1.12) + b * 0.04, { familie: schriften.text, gewicht: 400, farbe, zeilenhoehe: 1.35 });
  out += fusszeile(r, foto ? marke.farben.dunkel : bg);
  return svg(r, out);
}

/* Tipps: Titel und nummerierte Punkte auf hellem Grund */
function tipps(r: Rahmen, g: { titel: string; punkte: string[]; etikett: string }): string {
  const { marke, schriften, b, h, rand } = r;
  const bg = marke.farben.hell;
  const farbe = aufFarbe(bg, marke);
  const akzent = akzentAuf(bg, marke);
  const punkte = g.punkte.slice(0, 5);
  const breite = b - rand * 2;
  const titel = setze(g.titel, { familie: schriften.titel, gewicht: 700, breite, max: Math.round(b * 0.072), min: Math.round(b * 0.046), maxZeilen: 3 }, schriften);
  const kreis = Math.round(b * 0.062);
  const listeStart = rand + b * 0.08 + hoehe(titel, 1.12) + b * 0.07;
  const verfuegbar = h - rand * 1.9 - listeStart;
  // Alle Punkte in einheitlicher Grösse setzen; zu viel Text → kleiner
  let saetze = punkte.map((p) => setze(p, { familie: schriften.text, gewicht: 400, breite: breite - kreis * 1.5, max: Math.round(b * 0.044), min: Math.round(b * 0.044), maxZeilen: 3 }, schriften));
  const block = (s: Satz[]) => s.reduce((sum, x) => sum + Math.max(kreis, hoehe(x, 1.3)), 0);
  for (let groesse = Math.round(b * 0.044); groesse >= Math.round(b * 0.026) && block(saetze) + (punkte.length - 1) * b * 0.035 > verfuegbar; groesse -= 2) {
    saetze = punkte.map((p) => setze(p, { familie: schriften.text, gewicht: 400, breite: breite - kreis * 1.5, max: groesse, min: groesse, maxZeilen: 4 }, schriften));
  }
  const abstand = Math.min(b * 0.075, Math.max(b * 0.025, (verfuegbar - block(saetze)) / Math.max(punkte.length, 1)));
  let out = `<rect width="${b}" height="${h}" fill="${bg}"/><rect width="${b}" height="${Math.round(b * 0.018)}" fill="${marke.farben.primaer}"/>`;
  out += etikett(r, g.etikett, rand, rand, bg);
  out += textBlock(titel, rand, rand + b * 0.08, { familie: schriften.titel, gewicht: 700, farbe, zeilenhoehe: 1.12 });
  let y = listeStart;
  for (const [i, satz] of saetze.entries()) {
    out += `<circle cx="${rand + kreis / 2}" cy="${y + kreis / 2}" r="${kreis / 2}" fill="${akzent}"/><text x="${rand + kreis / 2}" y="${y + kreis * 0.68}" font-family="${esc(schriften.titel)}" font-weight="700" font-size="${Math.round(kreis * 0.5)}" fill="${aufFarbe(akzent, marke)}" text-anchor="middle">${i + 1}</text>`;
    out += textBlock(satz, rand + kreis * 1.5, y + (kreis - satz.groesse) / 2 - satz.groesse * 0.05, { familie: schriften.text, gewicht: 400, farbe, zeilenhoehe: 1.3 });
    y += Math.max(kreis, hoehe(satz, 1.3)) + abstand;
  }
  out += fusszeile(r, bg);
  return svg(r, out);
}

/* Zitat oder Kundenstimme */
function zitat(r: Rahmen, g: { titel: string; untertitel: string }): string {
  const { marke, schriften, b, h, rand } = r;
  const bg = marke.farben.primaer;
  const farbe = aufFarbe(bg, marke);
  const akzent = akzentAuf(bg, marke);
  const breite = b - rand * 2;
  const satz = setze(g.titel, { familie: schriften.titel, gewicht: 700, breite, max: Math.round(b * 0.075), min: Math.round(b * 0.042), maxZeilen: 7 }, schriften);
  const y0 = (h - hoehe(satz, 1.2)) / 2 + b * 0.02;
  let out = `<rect width="${b}" height="${h}" fill="${bg}"/>${deko(r, akzent, 0.12)}`;
  out += `<text x="${rand - b * 0.01}" y="${y0 - b * 0.03}" font-family="${esc(schriften.titel)}" font-weight="700" font-size="${Math.round(b * 0.26)}" fill="${akzent}">“</text>`;
  out += textBlock(satz, rand, y0, { familie: schriften.titel, gewicht: 700, farbe, zeilenhoehe: 1.2 });
  if (g.untertitel) {
    const y = y0 + hoehe(satz, 1.2) + b * 0.06;
    out += `<rect x="${rand}" y="${y}" width="${b * 0.08}" height="${Math.round(b * 0.006)}" fill="${akzent}"/><text x="${rand}" y="${y + b * 0.06}" font-family="${esc(schriften.text)}" font-weight="400" font-size="${Math.round(b * 0.03)}" fill="${farbe}">${esc(g.untertitel)}</text>`;
  }
  out += fusszeile(r, bg);
  return svg(r, out);
}

/* Zahl oder Fakt */
function zahl(r: Rahmen, g: { titel: string; untertitel: string; etikett: string }): string {
  const { marke, schriften, b, h, rand } = r;
  const bg = marke.farben.hell;
  const farbe = aufFarbe(bg, marke);
  const breite = b - rand * 2;
  const gross = setze(g.titel, { familie: schriften.titel, gewicht: 700, breite, max: Math.round(b * 0.3), min: Math.round(b * 0.1), maxZeilen: 2 }, schriften);
  const unter = setze(g.untertitel || " ", { familie: schriften.text, gewicht: 400, breite, max: Math.round(b * 0.045), min: Math.round(b * 0.03), maxZeilen: 5 }, schriften);
  const block = hoehe(gross, 1.05) + b * 0.05 + hoehe(unter, 1.35);
  const y0 = (h - block) / 2;
  let out = `<rect width="${b}" height="${h}" fill="${bg}"/>${deko(r, marke.farben.primaer, 0.08)}`;
  out += etikett(r, g.etikett, rand, rand, bg);
  out += textBlock(gross, rand, y0, { familie: schriften.titel, gewicht: 700, farbe: akzentAuf(bg, marke), zeilenhoehe: 1.05 });
  out += textBlock(unter, rand, y0 + hoehe(gross, 1.05) + b * 0.05, { familie: schriften.text, gewicht: 400, farbe, zeilenhoehe: 1.35 });
  out += fusszeile(r, bg);
  return svg(r, out);
}

/* Frage an die Community */
function frage(r: Rahmen, g: { titel: string; untertitel: string }): string {
  const { marke, schriften, b, h, rand } = r;
  const bg = marke.farben.sekundaer;
  const farbe = aufFarbe(bg, marke);
  const breite = b - rand * 2;
  const satz = setze(g.titel, { familie: schriften.titel, gewicht: 700, breite, max: Math.round(b * 0.095), min: Math.round(b * 0.05), maxZeilen: 6 }, schriften);
  const y0 = (h - hoehe(satz, 1.12)) / 2 - b * 0.03;
  let out = `<rect width="${b}" height="${h}" fill="${bg}"/>${deko(r, aufFarbe(bg, marke), 0.08)}`;
  out += `<text x="${b - rand}" y="${rand + b * 0.2}" font-family="${esc(schriften.titel)}" font-weight="700" font-size="${Math.round(b * 0.28)}" fill="${farbe}" fill-opacity="0.15" text-anchor="end">?</text>`;
  out += textBlock(satz, rand, y0, { familie: schriften.titel, gewicht: 700, farbe, zeilenhoehe: 1.12 });
  const cta = g.untertitel || "Schreib uns deine Antwort in die Kommentare";
  const groesse = Math.round(b * 0.028);
  const ctaBreite = (wortBreite(cta, schriften.text, 700, schriften) * groesse) / 100 + groesse * 2.4;
  const y = y0 + hoehe(satz, 1.12) + b * 0.07;
  const pill = akzentAuf(bg, marke);
  out += `<rect x="${rand}" y="${y}" width="${Math.min(ctaBreite, breite)}" height="${groesse * 2.4}" rx="${groesse * 1.2}" fill="${pill}"/><text x="${rand + groesse * 1.2}" y="${y + groesse * 1.58}" font-family="${esc(schriften.text)}" font-weight="700" font-size="${groesse}" fill="${aufFarbe(pill, marke)}">${esc(cta)}</text>`;
  out += fusszeile(r, bg);
  return svg(r, out);
}

/* Inhaltsfolie für Karussell und Reel */
function folie(r: Rahmen, f: { titel: string; text: string }, nummer: string, dunkel: boolean): string {
  const { marke, schriften, b, h, rand } = r;
  const bg = dunkel ? marke.farben.primaer : marke.farben.hell;
  const farbe = aufFarbe(bg, marke);
  const breite = b - rand * 2;
  const titel = setze(f.titel, { familie: schriften.titel, gewicht: 700, breite, max: Math.round(b * 0.075), min: Math.round(b * 0.048), maxZeilen: 4 }, schriften);
  const text = f.text ? setze(f.text, { familie: schriften.text, gewicht: 400, breite, max: Math.round(b * 0.04), min: Math.round(b * 0.028), maxZeilen: 9 }, schriften) : null;
  const block = hoehe(titel, 1.12) + (text ? b * 0.05 + hoehe(text, 1.4) : 0);
  const y0 = Math.max(rand * 1.8, (h - block) / 2);
  let out = `<rect width="${b}" height="${h}" fill="${bg}"/><rect x="${rand}" y="${rand}" width="${b * 0.1}" height="${Math.round(b * 0.01)}" fill="${akzentAuf(bg, marke)}"/>`;
  out += textBlock(titel, rand, y0, { familie: schriften.titel, gewicht: 700, farbe, zeilenhoehe: 1.12 });
  if (text) out += textBlock(text, rand, y0 + hoehe(titel, 1.12) + b * 0.05, { familie: schriften.text, gewicht: 400, farbe, zeilenhoehe: 1.4 });
  out += fusszeile(r, bg, nummer);
  return svg(r, out);
}

export function vorlage(layout: Layout, bs: Bausteine, kanal: Kanal | "reel", g: { titel: string; untertitel: string; punkte: string[]; etikett: string }): string {
  const { b, h } = FORMATE[kanal];
  const r = rahmen(bs, b, h);
  switch (layout) {
    case "tipps":
      return g.punkte.length ? tipps(r, g) : aussage(r, g);
    case "zitat":
      return zitat(r, g);
    case "zahl":
      return zahl(r, g);
    case "frage":
      return frage(r, g);
    default:
      return aussage(r, g);
  }
}

/* Alle Grafiken eines Beitrags: Einzelbild, Karussell-Folien oder Reel-Szenen (9:16) */
export function beitragsGrafiken(beitrag: Beitrag, bs: Bausteine): string[] {
  const kanal = beitrag.format === "reel" ? "reel" : beitrag.kanal;
  const g = { ...beitrag.grafik, etikett: beitrag.saeule };
  const titelbild = vorlage(beitrag.layout, bs, kanal, g);
  if (beitrag.format === "bild") return [titelbild];
  const { b, h } = FORMATE[kanal];
  const r = rahmen(bs, b, h);
  const folien = beitrag.folien.slice(0, beitrag.format === "reel" ? 6 : 9);
  const gesamt = folien.length + 1;
  return [titelbild, ...folien.map((f, i) => folie(r, f, `${i + 2}/${gesamt}`, i === folien.length - 1))];
}
