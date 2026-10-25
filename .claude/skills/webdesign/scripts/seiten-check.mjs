// Seiten-Check: Screenshots und Grundprüfungen für die statischen Seiten.
// Aufruf: node .claude/skills/webdesign/scripts/seiten-check.mjs [seite.html ...]
// Ohne Argumente werden alle *.html im Hauptordner geprüft.
import { createServer } from "node:http";
import { readFile, readdir, mkdir } from "node:fs/promises";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const AUSGABE = join(WURZEL, ".seiten-check");
const TYPEN = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".pdf": "application/pdf",
};
const ANSICHTEN = [
  { name: "handy", width: 375, height: 812 },
  { name: "desktop", width: 1440, height: 900 },
];
const THEMEN = ["light", "dark"];

// Kleiner statischer Server über dem Repo (Netlify-Funktionen laufen hier nicht).
const server = createServer(async (req, res) => {
  const pfad = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const datei = join(WURZEL, pfad || "index.html");
  if (!datei.startsWith(WURZEL) || pfad.startsWith(".")) { res.writeHead(403).end(); return; }
  try {
    const inhalt = await readFile(datei);
    res.writeHead(200, { "content-type": TYPEN[extname(datei)] || "application/octet-stream" }).end(inhalt);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const basis = `http://127.0.0.1:${server.address().port}/`;

let seiten = process.argv.slice(2);
if (!seiten.length) seiten = (await readdir(WURZEL)).filter((d) => d.endsWith(".html")).sort();
await mkdir(AUSGABE, { recursive: true });

const browser = await chromium.launch();
let gesamt = 0;

for (const seite of seiten) {
  const funde = new Set();
  for (const thema of THEMEN) {
    for (const ansicht of ANSICHTEN) {
      const ctx = await browser.newContext({
        viewport: { width: ansicht.width, height: ansicht.height },
        colorScheme: thema, deviceScaleFactor: 1,
        reducedMotion: "reduce", // sonst bleiben die beim Scrollen eingeblendeten Abschnitte leer
      });
      const page = await ctx.newPage();
      page.on("console", (m) => { if (m.type() === "error" && !/netlify|\/api\//i.test(m.text())) funde.add(`Konsolenfehler: ${m.text().slice(0, 160)}`); });
      page.on("pageerror", (e) => funde.add(`Skriptfehler: ${e.message.slice(0, 160)}`));
      page.on("response", (r) => {
        const u = r.url();
        if (u.startsWith(basis) && r.status() === 404 && !u.includes("/.netlify/")) funde.add(`Fehlt (404): ${u.slice(basis.length)}`);
      });
      await page.goto(basis + seite, { waitUntil: "networkidle" }).catch((e) => funde.add(`Laden fehlgeschlagen: ${e.message}`));
      // Seiten setzen data-theme="light"; für den Dunkel-Check umschalten.
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), thema);
      await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
      await page.waitForTimeout(150);

      const befund = await page.evaluate((handy) => {
        const out = [];
        const d = document.documentElement;
        if (d.scrollWidth > d.clientWidth + 1) {
          const breit = [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > d.clientWidth + 1 && getComputedStyle(el).position !== "fixed")
            .slice(0, 3).map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""));
          out.push(`Waagrechtes Scrollen (${d.scrollWidth}px > ${d.clientWidth}px): ${breit.join(", ")}`);
        }
        for (const img of document.images) {
          const n = img.getAttribute("src");
          if (!img.hasAttribute("alt")) out.push(`Bild ohne alt: ${n}`);
          if (!img.hasAttribute("width") || !img.hasAttribute("height")) out.push(`Bild ohne width/height: ${n}`);
        }
        if (!document.title.trim()) out.push("Kein <title>");
        if (!document.querySelector('meta[name="description"]')) out.push("Keine meta description");
        if (!document.querySelector("h1")) out.push("Keine h1");
        if (handy) {
          const klein = [...document.querySelectorAll("a, button, summary, input, select, textarea")].filter((el) => {
            const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
            if (!r.width || !r.height || s.visibility === "hidden" || r.right < 0 || r.left > innerWidth) return false; // versteckte Felder (z. B. Spam-Schutz) auslassen
            if (el.tagName === "A" && s.display === "inline" && el.closest("p, li")) return false; // Links im Fließtext
            if (el.tagName === "INPUT" && el.closest("label")) return false; // Label ist die Tippfläche
            return r.height < 44 && r.width < 44 ? true : r.height < 32;
          });
          if (klein.length) out.push(`${klein.length} Tippfläche(n) kleiner als empfohlen, z. B. „${(klein[0].textContent || klein[0].getAttribute("aria-label") || klein[0].tagName).trim().slice(0, 40)}“`);
        }
        return out;
      }, ansicht.name === "handy");
      befund.forEach((b) => funde.add(`[${ansicht.name}] ${b}`));

      const bild = join(AUSGABE, `${seite.replace(/\.html$/, "")}-${ansicht.name}-${thema}.png`);
      await page.screenshot({ path: bild, fullPage: true });
      await ctx.close();
    }
  }
  gesamt += funde.size;
  console.log(`\n${funde.size ? "✗" : "✓"} ${seite}`);
  for (const f of funde) console.log(`   – ${f}`);
}

await browser.close();
server.close();
console.log(`\nScreenshots: ${AUSGABE}`);
console.log(gesamt ? `${gesamt} Hinweis(e) gefunden.` : "Keine Auffälligkeiten.");
