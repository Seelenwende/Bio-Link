/* Darstellung, die Dashboard (index.html) und Kundenportal (kunde.html) gemeinsam nutzen. */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const KANAL = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn" };
const FORMAT = { bild: "Bild", karussell: "Karussell", reel: "Reel" };

function datum(iso, mitZeit = true) {
  if (!iso) return "";
  const d = new Date(iso);
  const opt = { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Zurich" };
  if (mitZeit) Object.assign(opt, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleString("de-CH", opt);
}

function notenFarbe(n) {
  return n >= 70 ? "" : n >= 50 ? "gelb" : "rot";
}

function liste(items) {
  return items?.length ? `<ul class="liste-plain">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
}

/* ---------- Analyse ---------- */

function analyseHtml(a, { intern = false } = {}) {
  if (!a) return `<p class="leise">Die Analyse ist noch nicht fertig.</p>`;
  const bereiche = a.bereiche
    .map(
      (b) => `<div class="karte">
        <div class="zeile" style="justify-content:space-between"><h3 style="margin:0">${esc(b.bereich)}</h3><span class="marke ${notenFarbe(b.note)}">${Math.round(b.note)} / 100</span></div>
        <div class="balken" style="margin:10px 0 12px"><i style="width:${Math.max(3, b.note)}%"></i></div>
        <p>${esc(b.befund)}</p>
        ${liste(b.empfehlungen)}
      </div>`,
    )
    .join("");
  const social = a.social
    .map((s) => `<tr><td><b>${esc(s.kanal)}</b></td><td><span class="marke ${s.status === "aktiv" ? "" : s.status === "nicht vorhanden" ? "rot" : "gelb"}">${esc(s.status)}</span></td><td>${esc(s.befund)}</td><td>${esc(s.potenzial)}</td></tr>`)
    .join("");
  const potenziale = a.potenziale
    .map((p) => `<tr><td><b>${esc(p.titel)}</b><br><span class="leise">${esc(p.beschreibung)}</span></td><td><span class="marke ${p.wirkung === "hoch" ? "" : "grau"}">${esc(p.wirkung)}</span></td><td><span class="marke grau">${esc(p.aufwand)}</span></td></tr>`)
    .join("");
  return `
    <div class="karte">
      <div class="zeile" style="gap:22px;align-items:flex-start">
        <div><div class="note">${Math.round(a.gesamtnote)}</div><div class="leise">von 100</div></div>
        <div style="flex:1;min-width:240px"><h2 style="margin-top:0">Gesamteindruck</h2><p>${esc(a.fazit)}</p>
        ${a.staerken?.length ? `<p class="leise" style="margin-bottom:4px"><b>Stärken</b></p>${liste(a.staerken)}` : ""}</div>
      </div>
    </div>
    <div class="karte"><h2>Die wichtigsten Optimierungspotenziale</h2>
      <table class="tabelle"><tr><th>Potenzial</th><th>Wirkung</th><th>Aufwand</th></tr>${potenziale}</table></div>
    <div class="karte"><h2>Sofort umsetzbar</h2>${liste(a.quickWins)}</div>
    <h2>Bewertung im Detail</h2>
    <div class="raster" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${bereiche}</div>
    <div class="karte"><h2>Social Media</h2>
      <div style="overflow-x:auto"><table class="tabelle"><tr><th>Kanal</th><th>Status</th><th>Befund</th><th>Potenzial</th></tr>${social}</table></div></div>
    <div class="karte"><h2>Unsere Empfehlung: ${esc(a.empfehlung.angebot)}</h2><p>${esc(a.empfehlung.begruendung)}</p></div>
    ${
      intern && a.intern
        ? `<div class="karte" style="border-color:var(--akzent)"><h2>Nur für dich: Verkaufsgespräch</h2>
          <p><b>Einstieg:</b> ${esc(a.intern.gespraechseinstieg)}</p>
          <p class="leise" style="margin-bottom:4px"><b>Argumente</b></p>${liste(a.intern.argumente)}
          <p class="leise" style="margin-bottom:4px"><b>Einwände</b></p>
          ${a.intern.einwaende.map((e) => `<p><b>„${esc(e.einwand)}“</b><br>${esc(e.antwort)}</p>`).join("")}</div>`
        : ""
    }`;
}

/* ---------- Marke ---------- */

function markeHtml(m) {
  if (!m) return `<p class="leise">Das Markenprofil ist noch nicht fertig.</p>`;
  const farben = Object.entries({ Primär: m.farben.primaer, Sekundär: m.farben.sekundaer, Akzent: m.farben.akzent, Hell: m.farben.hell, Dunkel: m.farben.dunkel })
    .map(([n, h]) => `<span class="farbe"><b style="background:${esc(h)}"></b>${esc(n)}<code>${esc(h)}</code></span>`)
    .join("");
  const logo = m.logo.pfad
    ? `<div style="display:inline-block;padding:18px;border-radius:10px;background:${m.logo.aufDunkel ? esc(m.farben.dunkel) : "#fff"};border:1px solid var(--linie)"><img src="${esc(m.logo.vorschau || m.logo.pfad)}" alt="Logo" style="max-height:90px;max-width:260px;display:block"></div>
       <p class="klein" style="margin-top:8px"><a href="${esc(m.logo.pfad)}" download>Logo herunterladen</a>${m.logo.vorschau ? ` · <a href="${esc(m.logo.vorschau)}" download>als PNG</a>` : ""}</p>`
    : `<p class="leise">Kein Logo auf der Website gefunden.</p>`;
  const schriftLink = (f) => `<a href="https://fonts.google.com/specimen/${encodeURIComponent(f).replace(/%20/g, "+")}" target="_blank" rel="noopener">${esc(f)}</a>`;
  return `
    <div class="raster" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
      <div class="karte"><h3>Logo</h3>${logo}</div>
      <div class="karte"><h3>CI-Farben</h3><div style="margin-bottom:10px">${farben}</div><p class="leise klein">${esc(m.farbBegruendung)}</p></div>
      <div class="karte"><h3>Schriften</h3>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(m.schriften.titel)}:wght@700&family=${encodeURIComponent(m.schriften.text)}:wght@400&display=swap">
        <p style="font-family:'${esc(m.schriften.titel)}';font-weight:700;font-size:1.6rem;margin-bottom:4px">${esc(m.name)}</p>
        <p class="leise klein">Überschriften: ${schriftLink(m.schriften.titel)}</p>
        <p style="font-family:'${esc(m.schriften.text)}'">${esc(m.claim)}</p>
        <p class="leise klein">Fliesstext: ${schriftLink(m.schriften.text)}</p></div>
    </div>
    <div class="karte"><h3>Stimmprofil</h3>
      <p>${esc(m.stimme.zusammenfassung)}</p>
      <p class="zeile">${m.stimme.tonalitaet.map((t) => `<span class="marke">${esc(t)}</span>`).join("")}<span class="marke grau">Anrede: ${esc(m.stimme.anrede)}</span><span class="marke grau">${esc(m.stimme.sprache)}</span></p>
      <div class="raster">
        <div><p class="leise" style="margin-bottom:4px"><b>Typische Wörter</b></p>${liste(m.stimme.typischeWoerter)}</div>
        <div><p class="leise" style="margin-bottom:4px"><b>Vermeiden</b></p>${liste(m.stimme.vermeiden)}</div>
        <div><p class="leise" style="margin-bottom:4px"><b>So klingt die Marke</b></p>${liste(m.stimme.beispielsaetze)}</div>
      </div>
      <p class="leise klein"><b>Zielgruppe:</b> ${esc(m.zielgruppe)}</p>
    </div>`;
}

/* ---------- Vorlagen ---------- */

function vorlagenHtml(v) {
  if (!v) return `<p class="leise">Die Vorlagen sind noch nicht fertig.</p>`;
  const grafiken = v.grafiken
    .map((g) => `<div class="karte post"><div class="bilder">${v.vorschau?.[g.layout] ? `<img src="${esc(v.vorschau[g.layout])}" alt="Vorlage ${esc(g.layout)}" loading="lazy">` : ""}</div><h3>${esc(g.layout[0].toUpperCase() + g.layout.slice(1))}</h3><p class="leise">${esc(g.wofuer)}</p></div>`)
    .join("");
  const kanaele = v.kanaele
    .map(
      (k) => `<div class="karte"><h3>${esc(KANAL[k.kanal])}</h3>
        <p><b>Rolle:</b> ${esc(k.rolle)}</p><p><b>Tonalität:</b> ${esc(k.tonalitaet)}</p><p><b>Länge:</b> ${esc(k.laenge)}</p>
        <p class="leise" style="margin-bottom:4px"><b>Aufbau</b></p><ol class="liste-plain">${k.aufbau.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
        <p class="leise" style="margin-bottom:4px"><b>Beispiel</b></p><div class="hinweis" style="white-space:pre-wrap">${esc(k.beispiel)}</div>
        <p class="tags" style="margin-top:10px">${k.hashtags.map((h) => esc(h.startsWith("#") ? h : `#${h}`)).join(" ")}</p>
        <p class="leise klein"><b>Handlungsaufforderungen:</b> ${k.ctas.map(esc).join(" · ")}</p></div>`,
    )
    .join("");
  return `<h2>Grafik-Vorlagen</h2><div class="raster">${grafiken}</div><h2>Text-Vorlagen je Kanal</h2><div class="raster" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">${kanaele}</div>`;
}

function newsletterKonzeptHtml(n, vorlageUrl) {
  if (!n) return `<p class="leise">Die Newsletter-Vorlage ist noch nicht fertig.</p>`;
  return `<div class="karte"><h2>${esc(n.name)}</h2><p class="leise">${esc(n.untertitel)}</p>
      <p><b>Rhythmus:</b> ${esc(n.rhythmus)} · <b>Ziel:</b> ${esc(n.ziel)}</p>
      <table class="tabelle"><tr><th>Rubrik</th><th>Zweck</th></tr>${n.aufbau.map((r) => `<tr><td><b>${esc(r.rubrik)}</b></td><td>${esc(r.zweck)}</td></tr>`).join("")}</table>
      <p class="leise" style="margin:14px 0 4px"><b>Betreffzeilen</b></p>${liste(n.betreffFormeln)}
      <p class="leise" style="margin-bottom:4px"><b>Tipps für den Versand</b></p>${liste(n.tipps)}
      ${vorlageUrl ? `<p class="zeile"><a class="knopf zweit klein" href="${esc(vorlageUrl)}" target="_blank" rel="noopener">Vorlage öffnen</a><a class="knopf zweit klein" href="${esc(vorlageUrl)}?download=1">HTML herunterladen</a></p>` : ""}
    </div>`;
}

/* ---------- Content- und Redaktionsplan ---------- */

function strategieHtml(s) {
  if (!s) return `<p class="leise">Der Plan ist noch nicht fertig.</p>`;
  const c = s.contentplan;
  const wochen = s.wochen
    .map((w) => `<tr><td><b>${w.woche}</b></td>${["instagram", "facebook", "linkedin"].map((k) => `<td>${esc(w[k].thema)}<br><span class="leise klein">${esc(w[k].saeule)} · ${FORMAT[w[k].format]}</span></td>`).join("")}</tr>`)
    .join("");
  return `
    <div class="karte"><h2>Contentplan</h2>
      <p class="leise" style="margin-bottom:4px"><b>Ziele für drei Monate</b></p>${liste(c.ziele)}
      <div class="raster">${c.saeulen.map((x) => `<div class="hinweis"><b>${esc(x.name)}</b> <span class="leise">· ${Math.round(x.anteil)} %</span><br>${esc(x.beschreibung)}</div>`).join("")}</div>
      <p style="margin-top:14px"><b>Zielgruppen:</b> ${c.zielgruppen.map((z) => `${esc(z.name)} (${esc(z.beschreibung)})`).join("; ")}</p>
      <p><b>Format-Mix:</b> ${esc(c.formate)}</p>
      <div class="raster">${c.monate.map((m) => `<div><h3>Monat ${m.monat}: ${esc(m.fokus)}</h3>${liste(m.themen)}${m.aktion ? `<p class="leise klein">Aktion: ${esc(m.aktion)}</p>` : ""}</div>`).join("")}</div>
      <p class="leise klein"><b>Erfolg messen wir an:</b> ${c.kennzahlen.map(esc).join(" · ")}</p>
    </div>
    <div class="karte"><h2>Redaktionsplan: eine Woche, ein Beitrag pro Kanal</h2>
      <div style="overflow-x:auto"><table class="tabelle"><tr><th>Woche</th><th>Instagram</th><th>Facebook</th><th>LinkedIn</th></tr>${wochen}</table></div>
      <p class="leise klein" style="margin-top:10px">Newsletter: ${s.newsletter.map((n) => `Monat ${n.monat}: ${esc(n.thema)}`).join(" · ")}</p>
    </div>`;
}

/* ---------- Beiträge ---------- */

function freigabeMarke(f) {
  if (!f || f.status === "offen") return f?.ueberarbeitet ? `<span class="marke blau">überarbeitet</span>` : `<span class="marke grau">offen</span>`;
  return { freigegeben: `<span class="marke">freigegeben</span>`, aenderung: `<span class="marke gelb">Änderung gewünscht</span>`, in_arbeit: `<span class="marke blau">wird überarbeitet</span>` }[f.status] ?? "";
}

function beitragHtml(b, { freigabe, zusatz = "", aktionen = "" } = {}) {
  const medien = b.video
    ? `<video src="${esc(b.video)}" controls playsinline poster="${esc(b.medien[0] ?? "")}"></video>`
    : b.medien.map((m, i) => `<img src="${esc(m)}" alt="${i === 0 ? esc(b.alt) : `Folie ${i + 1}`}" loading="lazy">`).join("");
  return `<div class="karte post" id="beitrag-${esc(b.id)}">
    <div class="bilder">${medien}</div>
    <div class="zeile" style="justify-content:space-between;margin-bottom:6px">
      <span><b>${KANAL[b.kanal]}</b> <span class="leise">· ${FORMAT[b.format]}${b.medien.length > 1 && !b.video ? ` · ${b.medien.length} Folien` : ""}</span></span>
      ${freigabeMarke(freigabe)}
    </div>
    <p class="leise klein" style="margin-bottom:8px">${datum(b.datum)} · ${esc(b.saeule)}</p>
    <div class="text">${esc(b.text)}</div>
    ${b.hashtags.length ? `<p class="tags" style="margin-top:8px">${b.hashtags.map((h) => `#${esc(h)}`).join(" ")}</p>` : ""}
    ${freigabe?.ueberarbeitet && freigabe.status === "offen" ? `<p class="hinweis klein">Umgesetzt: „${esc(freigabe.ueberarbeitet)}“</p>` : ""}
    ${freigabe?.status === "aenderung" ? `<p class="hinweis klein">Wunsch: „${esc(freigabe.kommentar)}“</p>` : ""}
    ${zusatz}
    <div style="margin-top:auto;padding-top:10px">${aktionen}</div>
  </div>`;
}

function newsletterAusgabeHtml(n, { freigabe, url, aktionen = "" } = {}) {
  return `<div class="karte" id="beitrag-${esc(n.id)}">
    <div class="zeile" style="justify-content:space-between"><b>Newsletter · Monat ${n.monat}</b>${freigabeMarke(freigabe)}</div>
    <p class="leise klein">${datum(n.datum)}</p>
    <p><b>Betreff:</b> ${esc(n.betreff)}<br><span class="leise">${esc(n.vorschau)}</span></p>
    <p>${esc(n.einleitung)}</p>
    ${liste(n.abschnitte.map((a) => a.titel))}
    ${freigabe?.ueberarbeitet && freigabe.status === "offen" ? `<p class="hinweis klein">Umgesetzt: „${esc(freigabe.ueberarbeitet)}“</p>` : ""}
    ${freigabe?.status === "aenderung" ? `<p class="hinweis klein">Wunsch: „${esc(freigabe.kommentar)}“</p>` : ""}
    ${url ? `<p><a href="${esc(url)}" target="_blank" rel="noopener">Ganzen Newsletter ansehen</a></p>` : ""}
    ${aktionen}
  </div>`;
}

/* ---------- Monatsbericht ---------- */

function berichtHtml(r) {
  const monat = new Date(`${r.monat}-01T12:00:00Z`).toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  const kanaele = r.kanaele
    .map(
      (k) => `<div class="karte"><h3>${KANAL[k.kanal]}</h3>${
        k.kennzahlen.length
          ? `<table class="tabelle">${k.kennzahlen.map((m) => `<tr><td>${esc(m.name)}</td><td style="text-align:right"><b>${Number(m.wert).toLocaleString("de-CH", { maximumFractionDigits: 2 })}${m.einheit === "percentage" ? " %" : ""}</b></td></tr>`).join("")}</table>`
          : `<p class="leise">Keine Daten</p>`
      }</div>`,
    )
    .join("");
  const a = r.auswertung;
  return `<div id="bericht-${esc(r.monat)}"><h2>Bericht ${esc(monat)}</h2>
    ${a ? `<div class="karte"><p>${esc(a.zusammenfassung)}</p><div class="raster"><div><b>Das lief gut</b>${liste(a.highlights)}</div><div><b>Erkenntnisse</b>${liste(a.erkenntnisse)}</div><div><b>Nächster Monat</b>${liste(a.naechsterMonat)}</div></div></div>` : `<p class="leise">In diesem Monat wurden noch keine Beiträge veröffentlicht.</p>`}
    <div class="raster">${kanaele}</div>
    ${r.posts.length ? `<div class="karte"><h3>Veröffentlichte Beiträge</h3><div style="overflow-x:auto"><table class="tabelle"><tr><th>Kanal</th><th>Datum</th><th>Beitrag</th><th>Kennzahlen</th></tr>${r.posts.map((p) => `<tr><td>${esc(p.kanalName)}</td><td>${datum(p.gesendet, false)}</td><td>${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.text.slice(0, 80))}…</a>` : esc(p.text.slice(0, 80))}</td><td class="klein">${p.kennzahlen.map((m) => `${esc(m.name)}: ${m.wert}`).join("<br>")}</td></tr>`).join("")}</table></div></div>` : ""}
  </div>`;
}
