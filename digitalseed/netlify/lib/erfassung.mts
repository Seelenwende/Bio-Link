import { UA, endung, ladeExtern, speichereMedium } from "./medien.mts";
import { svgZuPng } from "./grafik.mts";
import type { Kanal, Kunde } from "./kunden.mts";

/* Schritt 1: liest Website (Startseite + wichtigste Unterseiten), Technik, Farben, Schriften,
   Logo-Kandidaten, Bilder, Social-Media-Profile und – falls erreichbar – Google PageSpeed. */

export interface Seite {
  url: string;
  titel: string;
  beschreibung: string;
  ueberschriften: string[];
  text: string;
}

export interface LogoKandidat {
  url: string;
  quelle: string;
  pfad: string; // gespeicherte Datei unter /medien
  contentType: string;
  vorschau?: string; // PNG-Fassung, falls das Logo als SVG kam
}

export interface SocialProfil {
  kanal: Kanal;
  url: string;
  gefunden: "angegeben" | "auf der Website verlinkt";
  lesbar: boolean;
  titel?: string;
  beschreibung?: string;
  bild?: string;
  kennzahlen?: Record<string, number | string | null>;
  letzteBeitraege?: { datum: string; text: string; likes: number | null; kommentare: number | null; format: string }[];
  hinweis?: string;
}

export interface Erfassung {
  startUrl: string;
  endUrl: string;
  sprache: string;
  seiten: Seite[];
  technik: Record<string, string | number | boolean | null>;
  farben: { hex: string; anzahl: number; markiert: boolean }[];
  schriften: string[];
  logos: LogoKandidat[];
  bilder: { pfad: string; contentType: string; alt: string; url: string }[];
  social: SocialProfil[];
  pagespeed: { performance: number | null; seo: number | null; barrierefreiheit: number | null; bestPractices: number | null; screenshot: string | null } | null;
  kontakt: { emails: string[]; telefone: string[] };
}

/* ---------- HTML-Hilfen (bewusst ohne DOM-Bibliothek) ---------- */

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "").trim() : null;
}

function tags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function meta(html: string, key: string): string {
  for (const tag of tags(html, "meta")) {
    const k = (attr(tag, "name") ?? attr(tag, "property") ?? "").toLowerCase();
    if (k === key) return attr(tag, "content") ?? "";
  }
  return "";
}

function textVon(html: string): string {
  return decode(
    html
      .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d|section|header|footer|article|tr|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function absolut(href: string | null, base: string): string | null {
  if (!href || href.startsWith("data:") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  try {
    const u = new URL(href, base);
    u.hash = "";
    return ["http:", "https:"].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

interface Abruf {
  url: string;
  status: number;
  ms: number;
  html: string;
  bytes: number;
}

async function holeSeite(url: string): Promise<Abruf | null> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
      headers: { "user-agent": UA, "accept-language": "de-CH,de;q=0.9,en;q=0.6" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return null;
    const html = await res.text();
    return { url: res.url || url, status: res.status, ms: Date.now() - t0, html: html.slice(0, 1_500_000), bytes: html.length };
  } catch {
    return null;
  }
}

/* ---------- Seiten ---------- */

const WICHTIG = /(ueber|über|about|team|leistung|angebot|service|produkt|referenz|projekt|preis|kontakt|contact|portfolio|unternehmen|firma|wir)/i;
const UNWICHTIG = /(impressum|datenschutz|privacy|agb|cookie|login|warenkorb|cart|checkout|wp-admin|feed|\.(pdf|jpg|png|zip|docx?))/i;

function seiteAus(abruf: Abruf): Seite {
  const html = abruf.html;
  const titel = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  const ueberschriften = (html.match(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/gi) ?? []).map((h) => textVon(h)).filter(Boolean).slice(0, 30);
  return { url: abruf.url, titel, beschreibung: meta(html, "description"), ueberschriften, text: textVon(html).slice(0, 7000) };
}

function interneLinks(html: string, base: string): string[] {
  const host = new URL(base).hostname.replace(/^www\./, "");
  const links = new Map<string, number>();
  for (const tag of tags(html, "a")) {
    const url = absolut(attr(tag, "href"), base);
    if (!url) continue;
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, "") !== host || UNWICHTIG.test(u.pathname)) continue;
    u.search = "";
    const key = u.toString().replace(/\/$/, "");
    if (key === base.replace(/\/$/, "")) continue;
    links.set(key, (links.get(key) ?? 0) + (WICHTIG.test(u.pathname) ? 10 : 1));
  }
  return [...links.entries()].sort((a, b) => b[1] - a[1]).map(([u]) => u);
}

/* ---------- Social Media ---------- */

const SOCIAL: Record<Kanal, RegExp> = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?/i,
  facebook: /^https?:\/\/(www\.|m\.|de-de\.)?facebook\.com\/(?!sharer|share|dialog|plugins|tr\b)[^?#]+/i,
  linkedin: /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(company|in|school)\/[^/?#]+/i,
};

function socialLinks(html: string, base: string): Partial<Record<Kanal, string>> {
  const out: Partial<Record<Kanal, string>> = {};
  for (const tag of tags(html, "a")) {
    const url = absolut(attr(tag, "href"), base);
    if (!url) continue;
    for (const kanal of Object.keys(SOCIAL) as Kanal[]) {
      if (!out[kanal] && SOCIAL[kanal].test(url)) out[kanal] = url;
    }
  }
  return out;
}

async function instagramGraph(handle: string): Promise<Partial<SocialProfil> | null> {
  const userId = Netlify.env.get("IG_USER_ID");
  const token = Netlify.env.get("IG_ACCESS_TOKEN");
  if (!userId || !token) return null;
  const version = Netlify.env.get("IG_GRAPH_VERSION") || "v23.0";
  const fields = `business_discovery.username(${handle}){username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url,media.limit(12){caption,media_type,media_product_type,timestamp,like_count,comments_count}}`;
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${userId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const p = data?.business_discovery;
    if (!res.ok || !p) return null;
    return {
      lesbar: true,
      titel: p.name ?? p.username,
      beschreibung: p.biography ?? "",
      bild: p.profile_picture_url ?? undefined,
      kennzahlen: { follower: p.followers_count ?? null, folgt: p.follows_count ?? null, beitraege: p.media_count ?? null, link: p.website ?? null },
      letzteBeitraege: (p.media?.data ?? []).map((m: Record<string, any>) => ({
        datum: String(m.timestamp ?? "").slice(0, 10),
        text: String(m.caption ?? "").slice(0, 600),
        likes: m.like_count ?? null,
        kommentare: m.comments_count ?? null,
        format: m.media_product_type === "REELS" ? "Reel" : m.media_type === "CAROUSEL_ALBUM" ? "Karussell" : "Bild",
      })),
    };
  } catch {
    return null;
  }
}

async function leseProfil(kanal: Kanal, url: string, gefunden: SocialProfil["gefunden"]): Promise<SocialProfil> {
  const profil: SocialProfil = { kanal, url, gefunden, lesbar: false };
  if (kanal === "instagram") {
    const handle = url.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").split(/[/?#]/)[0];
    const graph = await instagramGraph(handle);
    if (graph) return { ...profil, ...graph };
  }
  const abruf = await holeSeite(url);
  if (abruf) {
    const titel = meta(abruf.html, "og:title") || decode(abruf.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
    const beschreibung = meta(abruf.html, "og:description") || meta(abruf.html, "description");
    const login = /log ?in|anmelden|sign up|registrieren/i.test(titel) && !beschreibung;
    if (titel && !login) {
      profil.lesbar = true;
      profil.titel = titel;
      profil.beschreibung = beschreibung;
      profil.bild = meta(abruf.html, "og:image") || undefined;
    }
  }
  if (!profil.lesbar) {
    profil.hinweis = "Das Netzwerk zeigt ohne Anmeldung keine Profildaten. Bewertet wird nur, dass das Profil existiert und verlinkt ist.";
  } else if (kanal !== "instagram" || !profil.kennzahlen) {
    profil.hinweis = "Nur öffentliche Vorschaudaten (Titel, Beschreibung, Bild). Beiträge und Kennzahlen sind ohne Anmeldung nicht abrufbar.";
  }
  return profil;
}

/* ---------- Farben und Schriften ---------- */

function hexNormal(raw: string): string | null {
  let h = raw.toLowerCase().replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  return /^[0-9a-f]{6}$/.test(h) ? `#${h}` : null;
}

function rgbZuHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

function sammleFarben(css: string, gewicht: Map<string, { anzahl: number; markiert: boolean }>, themeColor: string): void {
  const add = (hex: string | null, n = 1, markiert = false) => {
    if (!hex) return;
    const e = gewicht.get(hex) ?? { anzahl: 0, markiert: false };
    e.anzahl += n;
    e.markiert ||= markiert;
    gewicht.set(hex, e);
  };
  for (const m of css.matchAll(/#([0-9a-f]{3,8})\b/gi)) add(hexNormal(m[0]));
  for (const m of css.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/gi)) add(rgbZuHex(+m[1], +m[2], +m[3]));
  // Variablen mit sprechenden Namen (--primary, --brand-color …) zählen stärker
  for (const m of css.matchAll(/--[\w-]*(primary|brand|accent|secondary|main|theme|haupt|akzent)[\w-]*\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/gi)) {
    const v = m[2];
    const rgb = v.match(/(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
    add(v.startsWith("#") ? hexNormal(v) : rgb ? rgbZuHex(+rgb[1], +rgb[2], +rgb[3]) : null, 25, true);
  }
  if (themeColor) add(hexNormal(themeColor), 25, true);
}

function sammleSchriften(css: string, html: string): string[] {
  const zaehler = new Map<string, number>();
  for (const m of css.matchAll(/font-family\s*:\s*([^;}"]+)/gi)) {
    const erste = m[1].split(",")[0].replace(/['"]/g, "").trim();
    if (erste && !/^(inherit|initial|var\(|-apple-system|system-ui|sans-serif|serif|monospace|arial|helvetica|times|georgia|verdana|tahoma|segoe)/i.test(erste)) {
      zaehler.set(erste, (zaehler.get(erste) ?? 0) + 1);
    }
  }
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&>]+)/gi)) {
    for (const fam of decodeURIComponent(m[1]).split("|")) {
      const name = fam.split(":")[0].replace(/\+/g, " ").trim();
      if (name) zaehler.set(name, (zaehler.get(name) ?? 0) + 20);
    }
  }
  return [...zaehler.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n).slice(0, 8);
}

/* ---------- Logo und Bilder ---------- */

function logoKandidaten(html: string, base: string): { url: string; quelle: string; punkte: number }[] {
  const liste: { url: string; quelle: string; punkte: number }[] = [];
  const add = (url: string | null, quelle: string, punkte: number) => {
    if (url && !liste.some((l) => l.url === url)) liste.push({ url, quelle, punkte });
  };
  for (const m of html.matchAll(/"logo"\s*:\s*(?:\{[^}]*?"url"\s*:\s*)?"([^"]+)"/gi)) add(absolut(m[1].replace(/\\\//g, "/"), base), "Strukturierte Daten", 90);
  const header = html.match(/<header[\s\S]*?<\/header>/i)?.[0] ?? "";
  for (const tag of tags(html, "img")) {
    const src = attr(tag, "src") ?? attr(tag, "data-src");
    const merkmal = `${attr(tag, "class") ?? ""} ${attr(tag, "id") ?? ""} ${attr(tag, "alt") ?? ""} ${src ?? ""}`.toLowerCase();
    if (merkmal.includes("logo")) add(absolut(src, base), "Bild mit „logo“ im Namen", header.includes(tag) ? 85 : 70);
  }
  const svgLogo = html.match(/<a[^>]*class="[^"]*logo[^"]*"[^>]*>\s*(<svg[\s\S]*?<\/svg>)/i)?.[1];
  if (svgLogo) liste.push({ url: `inline:${svgLogo}`, quelle: "Eingebettetes SVG im Logo-Link", punkte: 80 });
  const ersteHeaderImg = tags(header, "img")[0];
  if (ersteHeaderImg) add(absolut(attr(ersteHeaderImg, "src"), base), "Erstes Bild im Kopfbereich", 60);
  for (const tag of tags(html, "link")) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (rel.includes("apple-touch-icon")) add(absolut(attr(tag, "href"), base), "App-Symbol", 40);
    else if (rel.includes("icon")) add(absolut(attr(tag, "href"), base), "Favicon", 20);
  }
  add(absolut(meta(html, "og:image"), base), "Vorschaubild (og:image)", 15);
  return liste.sort((a, b) => b.punkte - a.punkte).slice(0, 5);
}

function inhaltsBilder(html: string, base: string): { url: string; alt: string; punkte: number }[] {
  const liste = new Map<string, { url: string; alt: string; punkte: number }>();
  const add = (url: string | null, alt: string, punkte: number) => {
    if (!url || /logo|icon|sprite|avatar|pixel|tracking|\.svg(\?|$)|\.gif(\?|$)/i.test(url)) return;
    const vorhanden = liste.get(url);
    if (!vorhanden || vorhanden.punkte < punkte) liste.set(url, { url, alt, punkte });
  };
  add(absolut(meta(html, "og:image"), base), "Vorschaubild", 30);
  tags(html, "img").forEach((tag, i) => {
    const srcset = attr(tag, "srcset") ?? attr(tag, "data-srcset");
    const groesstes = srcset
      ?.split(",")
      .map((s) => s.trim().split(/\s+/))
      .sort((a, b) => parseInt(b[1] ?? "0") - parseInt(a[1] ?? "0"))[0]?.[0];
    const src = groesstes ?? attr(tag, "data-src") ?? attr(tag, "src");
    const breite = parseInt(attr(tag, "width") ?? "0");
    add(absolut(src, base), attr(tag, "alt") ?? "", 20 - Math.min(i, 15) + (breite >= 600 ? 10 : 0));
  });
  for (const m of html.matchAll(/background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)/gi)) add(absolut(m[1], base), "Hintergrundbild", 18);
  return [...liste.values()].sort((a, b) => b.punkte - a.punkte);
}

/* ---------- PageSpeed ---------- */

async function pagespeed(url: string): Promise<Erfassung["pagespeed"]> {
  const key = Netlify.env.get("PAGESPEED_API_KEY");
  const params = new URLSearchParams({ url, strategy: "mobile", locale: "de" });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) params.append("category", c);
  if (key) params.set("key", key);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, { signal: AbortSignal.timeout(90000) });
    if (!res.ok) return null;
    const data = await res.json();
    const cat = data?.lighthouseResult?.categories ?? {};
    const score = (c: any) => (typeof c?.score === "number" ? Math.round(c.score * 100) : null);
    return {
      performance: score(cat.performance),
      seo: score(cat.seo),
      barrierefreiheit: score(cat.accessibility),
      bestPractices: score(cat["best-practices"]),
      screenshot: data?.lighthouseResult?.audits?.["final-screenshot"]?.details?.data ?? null,
    };
  } catch {
    return null;
  }
}

/* ---------- Ablauf ---------- */

export async function erfasse(kunde: Kunde): Promise<Erfassung> {
  const pagespeedLauf = pagespeed(kunde.website);
  const start = await holeSeite(kunde.website);
  if (!start) throw new Error(`Die Website ${kunde.website} ist nicht erreichbar oder liefert kein HTML.`);
  const html = start.html;
  const base = start.url;

  // Unterseiten
  const unterseiten = interneLinks(html, base).slice(0, 7);
  const abrufe = (await Promise.all(unterseiten.map(holeSeite))).filter((a): a is Abruf => Boolean(a && a.status < 400));
  const seiten = [seiteAus(start), ...abrufe.map(seiteAus)];
  const alleHtml = [html, ...abrufe.map((a) => a.html)].join("\n");

  // CSS für Farben und Schriften
  const stylesheets = tags(html, "link")
    .filter((t) => (attr(t, "rel") ?? "").toLowerCase().includes("stylesheet"))
    .map((t) => absolut(attr(t, "href"), base))
    .filter((u): u is string => Boolean(u) && !/fonts\.googleapis|font-awesome|fontawesome/i.test(u!))
    .slice(0, 5);
  const cssDateien = await Promise.all(
    stylesheets.map(async (u) => {
      try {
        const r = await fetch(u, { signal: AbortSignal.timeout(10000), headers: { "user-agent": UA } });
        return r.ok ? (await r.text()).slice(0, 600_000) : "";
      } catch {
        return "";
      }
    }),
  );
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n") + tags(html, "[a-z]+").map((t) => attr(t, "style") ?? "").join(";");
  const css = [inlineCss, ...cssDateien].join("\n");
  const gewicht = new Map<string, { anzahl: number; markiert: boolean }>();
  sammleFarben(css, gewicht, meta(html, "theme-color"));
  const farben = [...gewicht.entries()]
    .map(([hex, e]) => ({ hex, ...e }))
    .sort((a, b) => b.anzahl - a.anzahl)
    .slice(0, 24);

  // Logo
  const logos: LogoKandidat[] = [];
  for (const [i, k] of logoKandidaten(html, base).entries()) {
    if (logos.length >= 3) break;
    const inline = k.url.startsWith("inline:") ? k.url.slice(7) : null;
    const medium = inline
      ? {
          data: new TextEncoder().encode(/^<svg[^>]*\sxmlns=/i.test(inline) ? inline : inline.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"')),
          contentType: "image/svg+xml",
        }
      : await ladeExtern(k.url, 3_000_000);
    if (!medium || medium.contentType.includes("icon") || medium.data.length < 200) continue;
    const pfad = await speichereMedium(kunde.id, `logo-${i}.${endung(medium.contentType)}`, medium.data, medium.contentType);
    const kandidat: LogoKandidat = { url: k.url.startsWith("inline:") ? base : k.url, quelle: k.quelle, pfad, contentType: medium.contentType };
    if (medium.contentType === "image/svg+xml") {
      const png = await svgZuPng(new TextDecoder().decode(medium.data), 600).catch(() => null);
      if (png) kandidat.vorschau = await speichereMedium(kunde.id, `logo-${i}-vorschau.png`, png, "image/png");
    }
    logos.push(kandidat);
  }

  // Bilder (für Analyse, Website-Demo und Bild-Beiträge)
  const bilder: Erfassung["bilder"] = [];
  for (const b of inhaltsBilder(alleHtml, base)) {
    if (bilder.length >= 10) break;
    const medium = await ladeExtern(b.url, 5_000_000);
    if (!medium || !["image/jpeg", "image/png", "image/webp"].includes(medium.contentType) || medium.data.length < 15_000) continue;
    const pfad = await speichereMedium(kunde.id, `bild-${bilder.length + 1}.${endung(medium.contentType)}`, medium.data, medium.contentType);
    bilder.push({ pfad, contentType: medium.contentType, alt: b.alt, url: b.url });
  }

  // Social Media: angegebene Profile, sonst die auf der Website verlinkten
  const verlinkt = socialLinks(alleHtml, base);
  const social = await Promise.all(
    (["instagram", "facebook", "linkedin"] as Kanal[])
      .map((kanal) => {
        const angegeben = kunde.profile[kanal];
        if (angegeben) return { kanal, url: angegeben, gefunden: "angegeben" as const };
        if (verlinkt[kanal]) return { kanal, url: verlinkt[kanal]!, gefunden: "auf der Website verlinkt" as const };
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .map((x) => leseProfil(x.kanal, x.url, x.gefunden)),
  );

  // Technik
  const imgs = tags(alleHtml, "img");
  const jahr = new Date().getFullYear();
  const copyright = [...alleHtml.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => +m[1]).sort().pop() ?? null;
  const technik: Erfassung["technik"] = {
    https: base.startsWith("https://"),
    antwortzeitMs: start.ms,
    htmlKb: Math.round(start.bytes / 1024),
    mobilViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    sprache: attr(html.match(/<html[^>]*>/i)?.[0] ?? "", "lang"),
    titel: seiten[0].titel,
    titelLaenge: seiten[0].titel.length,
    metaBeschreibung: seiten[0].beschreibung || null,
    metaBeschreibungLaenge: seiten[0].beschreibung.length,
    h1Anzahl: (html.match(/<h1\b/gi) ?? []).length,
    bilderGesamt: imgs.length,
    bilderOhneAlt: imgs.filter((t) => !attr(t, "alt")).length,
    skripte: tags(html, "script").length,
    strukturierteDaten: /application\/ld\+json/i.test(html),
    ogBild: Boolean(meta(html, "og:image")),
    favicon: tags(html, "link").some((t) => (attr(t, "rel") ?? "").toLowerCase().includes("icon")),
    cookieBanner: /cookie(bot|consent|yes|banner)|usercentrics|onetrust|borlabs/i.test(html),
    generator: meta(html, "generator") || (/wp-content/i.test(html) ? "WordPress" : /wix\.com|wixstatic/i.test(html) ? "Wix" : /jimdo/i.test(html) ? "Jimdo" : /squarespace/i.test(html) ? "Squarespace" : null),
    copyrightJahr: copyright,
    copyrightVeraltet: copyright !== null && copyright < jahr - 1,
    unterseitenGelesen: abrufe.length,
    newsletterFormular: /newsletter|mailchimp|mailerlite|brevo|sendinblue|cleverreach/i.test(alleHtml),
    impressum: /impressum|imprint/i.test(alleHtml),
    datenschutz: /datenschutz|privacy/i.test(alleHtml),
  };

  const text = seiten.map((s) => s.text).join("\n");
  const kontakt = {
    emails: [...new Set(text.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? [])].slice(0, 5),
    telefone: [...new Set(text.match(/(?:\+41|\+49|\+43|0)[\d\s/]{8,16}\d/g) ?? [])].map((t) => t.trim()).slice(0, 3),
  };

  return {
    startUrl: kunde.website,
    endUrl: base,
    sprache: String(technik.sprache ?? ""),
    seiten,
    technik,
    farben,
    schriften: sammleSchriften(css, html),
    logos,
    bilder,
    social,
    pagespeed: await pagespeedLauf,
    kontakt,
  };
}
