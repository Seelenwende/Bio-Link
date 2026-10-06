/* Erzeugt bonus/wieder-bei-dir-begleitheft.pdf aus den Programminhalten in netlify/lib/programm.mts.
   Aufruf (Node 22+, Playwright mit Chromium): node scripts/begleitheft.mjs [schriften.css]
   Ohne schriften.css werden Playfair Display und Jost von Google Fonts geladen. */
import { readFile } from "node:fs/promises";

globalThis.Netlify = { env: { get: () => "" } };
const { PROGRAMM } = await import("../netlify/lib/programm.mts");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const schriften = process.argv[2]
  ? `<style>${await readFile(process.argv[2], "utf8")}</style>`
  : `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">`;

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const linien = (n) => `<div class="linien">${'<span></span>'.repeat(n)}</div>`;

const schmetterling = `<svg class="falter" viewBox="0 0 100 100" aria-hidden="true">
  <ellipse cx="38" cy="40" rx="13" ry="18" transform="rotate(-35 38 40)"/><ellipse cx="62" cy="40" rx="13" ry="18" transform="rotate(35 62 40)"/>
  <ellipse cx="41" cy="61" rx="9" ry="13" transform="rotate(-20 41 61)"/><ellipse cx="59" cy="61" rx="9" ry="13" transform="rotate(20 59 61)"/>
  <ellipse class="k" cx="50" cy="50" rx="1.5" ry="16"/><path d="M50 36 C47 30 45 27 43 24"/><path d="M50 36 C53 30 55 27 57 24"/>
  <circle class="k" cx="43" cy="23.5" r="1.5"/><circle class="k" cx="57" cy="23.5" r="1.5"/></svg>`;

function woche(w) {
  const uebungen = w.uebungen.map((u) => `
    <section class="uebung">
      <h3>${esc(u.titel)}</h3>
      <p class="anl">${esc(u.anleitung)}</p>
      ${u.fragen.map((f) => `<p class="frage">${esc(f)}</p>${linien(u.fragen.length === 1 ? 14 : 4)}`).join("")}
    </section>`).join("");
  const rueck = w.nr === 6 ? `
    <section class="uebung"><h3>Zurückschauen</h3>
      <p class="anl">Lies, was du dir in Woche 1 gewünscht hast.</p>
      <p class="frage">Was hat sich seitdem verändert, auch im Kleinen?</p>${linien(5)}</section>` : "";
  return `
  <article class="woche">
    <header class="kopf">
      <span class="eyebrow">Woche ${w.nr} von ${PROGRAMM.wochen.length}</span>
      <h2>${esc(w.titel)}</h2>
      <p class="unter">${esc(w.untertitel)}</p>
    </header>
    <div class="satz"><span class="eyebrow">Dein Satz für diese Woche</span><p>„${esc(w.satz)}“</p></div>
    ${rueck}${uebungen}
    <section class="tage">
      <h3>Jeden Tag ein kleiner Anker</h3>
      <ol>${w.tage.map((t, i) => `<li><span class="box"></span><span><b>Tag ${i + 1}</b> ${esc(t)}</span></li>`).join("")}</ol>
    </section>
    <section class="uebung"><h3>Was nehme ich aus dieser Woche mit?</h3>${linien(5)}</section>
  </article>`;
}

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">${schriften}<style>
  :root{--papier:#FAF6F4; --sand:#F3ECE9; --rose:#B5808F; --beere:#8C5A69; --pflaume:#5C3A46; --gedaempft:#8E7079; --linie:#E4D8D8;}
  @page{size:A4; margin:18mm 18mm 20mm;}
  *{box-sizing:border-box;}
  body{margin:0; font-family:"Jost",sans-serif; font-weight:300; font-size:10.5pt; line-height:1.55; color:var(--pflaume); -webkit-print-color-adjust:exact; print-color-adjust:exact;}
  h1,h2,h3{font-family:"Playfair Display",Georgia,serif; font-weight:500; margin:0; line-height:1.25;}
  .eyebrow{font-size:7.5pt; letter-spacing:.24em; text-transform:uppercase; color:var(--rose); font-weight:500;}
  .falter{width:22mm; height:22mm;} .falter ellipse,.falter path{fill:none; stroke:var(--rose); stroke-width:1.5; stroke-linecap:round;} .falter .k{fill:var(--rose); stroke:none;}
  .titel{height:255mm; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:6mm; break-after:page;}
  .titel h1{font-size:34pt;} .titel .unter{font-family:"Playfair Display",serif; font-style:italic; font-size:14pt;}
  .titel .klein{font-size:9pt; color:var(--gedaempft); max-width:110mm;}
  .seite{break-after:page;}
  .seite h2{font-size:18pt; margin-bottom:4mm;}
  .seite p{margin:0 0 3mm;}
  .liste li{margin-bottom:2mm;}
  .hinweis{background:var(--sand); border-radius:4mm; padding:5mm 6mm; margin-top:6mm; font-size:9.5pt;}
  .hinweis b{font-weight:500;}
  .woche{break-before:page;}
  .kopf{display:grid; gap:1.5mm; margin-bottom:5mm;}
  .kopf h2{font-size:24pt;} .kopf .unter{font-family:"Playfair Display",serif; font-style:italic; color:var(--beere); font-size:12pt; margin:0;}
  .satz{background:var(--pflaume); color:var(--papier); border-radius:4mm; padding:5mm 6mm; text-align:center; margin-bottom:6mm;}
  .satz .eyebrow{color:#E3CFD5;} .satz p{font-family:"Playfair Display",serif; font-size:14pt; margin:1.5mm 0 0;}
  .uebung{margin-bottom:6mm; break-inside:avoid-page;}
  .uebung h3, .tage h3{font-size:13pt; margin-bottom:1.5mm;}
  .anl{color:var(--gedaempft); font-size:9.5pt; margin:0 0 3mm;}
  .frage{margin:3mm 0 1mm; font-weight:400;}
  .linien span{display:block; height:8.5mm; border-bottom:.3mm solid var(--linie);}
  .tage{margin-bottom:6mm; break-inside:avoid;}
  .tage ol{list-style:none; margin:0; padding:0; display:grid; gap:2.2mm;}
  .tage li{display:grid; grid-template-columns:5mm 1fr; gap:3mm; align-items:start;}
  .tage .box{width:4.2mm; height:4.2mm; border:.35mm solid var(--rose); border-radius:1mm; margin-top:.8mm;}
  .tage b{font-weight:500; color:var(--beere); margin-right:1.5mm;}
  .ende{break-before:page; text-align:center; padding-top:60mm; display:grid; gap:5mm; justify-items:center;}
  .ende p{max-width:120mm; margin:0;}
</style></head><body>
  <section class="titel">
    ${schmetterling}
    <span class="eyebrow">Seelenwende · 6 Wochen</span>
    <h1>${esc(PROGRAMM.titel)}</h1>
    <p class="unter">Dein Begleitheft</p>
    <p class="klein">Alle Übungen und Tagesanker zum Ausdrucken und Ausfüllen mit der Hand. Die Impulse zum Lesen findest du online in deinem Programm.</p>
  </section>
  <section class="seite">
    <span class="eyebrow">Bevor du beginnst</span>
    <h2>So nutzt du dieses Heft</h2>
    ${PROGRAMM.soGehts.slice(0, 3).map((t) => `<p>${esc(t)}</p>`).join("")}
    <p>Schreib kurz und ehrlich, nicht schön. Niemand außer dir liest mit.</p>
    <div class="hinweis">
      <p><b>Deine Sicherheit zuerst.</b> Wenn jemand deine Sachen durchsieht, bewahre dieses Heft an einem Ort auf, den nur du kennst, oder fülle die Übungen lieber online aus.</p>
      <p><b>In Gefahr:</b> Notruf 112 (Schweiz Polizei 117) · Gewalt gegen Frauen: Deutschland 116 016 · Österreich 0800 222 555 · Schweiz: Opferhilfe 142 (opferhilfe-schweiz.ch) · Seelsorge: Schweiz 143 · Deutschland 0800 111 0 111 · Österreich 142</p>
      <p style="margin:0">„Wieder bei dir“ ist ein Selbsthilfe-Programm und ersetzt keine Therapie.</p>
    </div>
  </section>
  ${PROGRAMM.wochen.map(woche).join("")}
  <section class="ende">
    ${schmetterling}
    <h2>Du bist sechs Wochen für dich da gewesen.</h2>
    ${PROGRAMM.abschluss.slice(0, 1).map((t) => `<p>${esc(t)}</p>`).join("")}
    <p class="eyebrow">@_seelenwende</p>
  </section>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: new URL("../bonus/wieder-bei-dir-begleitheft.pdf", import.meta.url).pathname,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;font-family:sans-serif;font-size:7pt;color:#8E7079;text-align:center;letter-spacing:.2em;">WIEDER BEI DIR · <span class="pageNumber"></span></div>`,
  margin: { top: "18mm", bottom: "20mm", left: "18mm", right: "18mm" },
});
await browser.close();
console.log("bonus/wieder-bei-dir-begleitheft.pdf erstellt");
