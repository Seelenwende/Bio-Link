import type { Marke, NewsletterAusgabe } from "./kunden.mts";

/* Newsletter-Vorlage als E-Mail-HTML (Tabellen-Layout, Inline-Styles), passend für
   Mailchimp, MailerLite, Brevo & Co. Ohne Ausgabe entsteht die leere Vorlage mit Platzhaltern. */

export interface NewsletterKonzept {
  name: string;
  untertitel: string;
  rhythmus: string;
  ziel: string;
  aufbau: { rubrik: string; zweck: string }[];
  betreffFormeln: string[];
  absenderName: string;
  buttonText: string;
  tipps: string[];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const absatz = (s: string) => esc(s).split(/\n{2,}/).map((p) => p.replace(/\n/g, "<br>")).join("</p><p style=\"margin:0 0 14px\">");

function hell(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

export function newsletterHtml(marke: Marke, konzept: NewsletterKonzept, ausgabe: NewsletterAusgabe | null, basisUrl: string, website: string): string {
  const f = marke.farben;
  const titelFont = `'${marke.schriften.titel}', Georgia, serif`;
  const textFont = `'${marke.schriften.text}', Helvetica, Arial, sans-serif`;
  const kopfText = hell(f.primaer) ? f.dunkel : "#ffffff";
  const buttonText = hell(f.akzent) ? f.dunkel : "#ffffff";
  const logo = marke.logo.vorschau ?? marke.logo.pfad;
  const logoBadge = !hell(f.primaer) && !marke.logo.aufDunkel;

  const a: NewsletterAusgabe = ausgabe ?? {
    id: "vorlage",
    monat: 0,
    datum: "",
    betreff: "{{Betreff}}",
    vorschau: "{{Vorschautext}}",
    einleitung: `{{Persönliche Einleitung: 2–3 Sätze, ${marke.stimme.anrede === "du" ? "per Du" : "per Sie"}}}`,
    abschnitte: konzept.aufbau.map((r) => ({ titel: r.rubrik, text: `{{${r.zweck}}}`, button: konzept.buttonText })),
    abschluss: "{{Abschluss und Gruss}}",
  };

  const abschnitte = a.abschnitte
    .map(
      (s, i) => `
      <tr><td style="padding:${i === 0 ? 8 : 28}px 40px 0">
        <p style="margin:0 0 6px;font:700 12px/1.4 ${textFont};letter-spacing:1.5px;text-transform:uppercase;color:${f.akzent}">${esc(konzept.aufbau[i]?.rubrik ?? "")}</p>
        <h2 style="margin:0 0 12px;font:700 22px/1.3 ${titelFont};color:${f.dunkel}">${esc(s.titel)}</h2>
        <p style="margin:0 0 14px">${absatz(s.text)}</p>
        ${s.button ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${f.akzent};border-radius:6px"><a href="${esc(website)}" style="display:inline-block;padding:12px 22px;font:700 15px/1 ${textFont};color:${buttonText};text-decoration:none">${esc(s.button)}</a></td></tr></table>` : ""}
      </td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${esc(marke.stimme.sprache || "de")}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(a.betreff)}</title>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(marke.schriften.titel)}:wght@700&family=${encodeURIComponent(marke.schriften.text)}:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${f.hell}">
<span style="display:none;max-height:0;overflow:hidden">${esc(a.vorschau)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${f.hell}">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;font:400 16px/1.6 ${textFont};color:${f.dunkel}">
    <tr><td style="background:${f.primaer};padding:28px 40px">
      ${logo ? `<div style="${logoBadge ? "display:inline-block;background:#fff;padding:8px 14px;border-radius:8px;" : ""}"><img src="${esc(basisUrl + logo)}" alt="${esc(marke.name)}" height="40" style="display:block;height:40px;width:auto"></div>` : `<p style="margin:0;font:700 22px/1.2 ${titelFont};color:${kopfText}">${esc(marke.name)}</p>`}
      <p style="margin:18px 0 0;font:700 26px/1.25 ${titelFont};color:${kopfText}">${esc(konzept.name)}</p>
      <p style="margin:6px 0 0;font:400 15px/1.4 ${textFont};color:${kopfText};opacity:.85">${esc(konzept.untertitel)}</p>
    </td></tr>
    <tr><td style="padding:32px 40px 8px"><p style="margin:0 0 14px">${absatz(a.einleitung)}</p></td></tr>
    ${abschnitte}
    <tr><td style="padding:28px 40px 36px"><p style="margin:0">${absatz(a.abschluss)}</p><p style="margin:14px 0 0;font-weight:700">${esc(konzept.absenderName)}</p></td></tr>
    <tr><td style="background:${f.dunkel};padding:22px 40px;font:400 13px/1.6 ${textFont};color:#ffffff">
      <a href="${esc(website)}" style="color:#ffffff">${esc(website.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a><br>
      <span style="opacity:.75">${marke.stimme.anrede === "du" ? "Du erhältst diese Mail, weil du dich angemeldet hast." : "Sie erhalten diese Mail, weil Sie sich angemeldet haben."} {{Abmeldelink}}</span>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
