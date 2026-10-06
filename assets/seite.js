/* Seelenwende – gemeinsames Skript für Website und Angebotsseiten.
   - Kopf, Fuß und Krisenleiste (einmal hier gepflegt, auf allen Seiten gleich)
   - Kauf-Links aller Produkte an EINER Stelle (KAUF)
   - „Schnell weg“-Knopf (auch zweimal Esc)
   - Mail-Fenster vor den kostenlosen Werkzeugen (wie im Bio-Link) */
(function(){
  "use strict";

  // Kauf-Links (Tentary). Leer = noch nicht im Verkauf: Statt des Knopfs erscheint
  // „Schreib <WORT> an @_seelenwende“, damit sie trotzdem auf die Liste kommt.
  var KAUF = {
    "mira":            "",
    "antwort-helfer":  "",
    "kompass":         "",
    "tagebuch":        "",
    "programm":        "",
    "kreis":           "",
    "bundle":          "https://seelenwende.mytentary.com/p/Mi6HH3",
    "du-bist-genug":   "https://seelenwende.mytentary.com/p/Mi6HH3"
  };
  var INSTAGRAM = "https://www.instagram.com/_seelenwende/";
  var EXIT_URL = "https://www.google.com/search?q=wetter";
  var FREI_KEY = "seelenwende_werkzeuge_frei"; // derselbe Schlüssel wie im Bio-Link

  var $ = function(id){ return document.getElementById(id); };

  var FALTER =
    '<svg class="falter" viewBox="0 0 100 100" aria-hidden="true">' +
    '<path class="w1" d="M50 30 C46 14 30 6 18 12 C6 18 8 38 22 44 C32 48 44 42 50 30 Z"/>' +
    '<path class="w2" d="M50 30 C54 14 70 6 82 12 C94 18 92 38 78 44 C68 48 56 42 50 30 Z"/>' +
    '<path class="w3" d="M50 46 C47 36 36 32 28 37 C20 42 22 54 32 57 C40 59 47 54 50 46 Z"/>' +
    '<path class="w3" d="M50 46 C53 36 64 32 72 37 C80 42 78 54 68 57 C60 59 53 54 50 46 Z"/>' +
    '<rect class="k" x="48.7" y="26" width="2.6" height="34" rx="1.3"/></svg>';

  /* ---------- Kopf ---------- */
  var kopf = $("kopf");
  if (kopf) {
    kopf.className = "kopf";
    kopf.innerHTML =
      '<div class="kopf-innen">' +
        '<a class="marke" href="start.html">' + FALTER + '<span>Seelenwende</span></a>' +
        '<nav class="nav" aria-label="Hauptnavigation">' +
          '<a class="nav-optional" href="start.html#werkzeuge">Gratis</a>' +
          '<a href="start.html#angebote">Angebote</a>' +
          '<a class="nav-optional" href="start.html#ueber">Über</a>' +
          '<button class="schnell-weg" type="button" id="schnell-weg" title="Verlässt die Seite sofort (auch: zweimal Esc)">Schnell weg</button>' +
        '</nav>' +
      '</div>';
  }

  /* ---------- Fuß + Krisenleiste ---------- */
  var fuss = $("fuss");
  if (fuss) {
    fuss.innerHTML =
      '<footer class="fuss"><div class="innen">' +
        '<nav aria-label="Weitere Seiten">' +
          '<a href="start.html">Start</a>' +
          '<a href="start.html#werkzeuge">Kostenlose Werkzeuge</a>' +
          '<a href="start.html#angebote">Alle Angebote</a>' +
          '<a href="planer.html">Ausstiegs-Planer</a>' +
          '<a href="' + INSTAGRAM + '" target="_blank" rel="noopener">Instagram</a>' +
        '</nav>' +
        '<p class="hinweis">Seelenwende ist Selbsthilfe und ersetzt keine Therapie, Beratung oder Rechtsberatung. Wenn du in Gefahr bist, wende dich bitte an die Nummern unten.</p>' +
        '<div class="handle">@_seelenwende</div>' +
      '</div></footer>' +
      '<div class="krise">In Gefahr: <b>Notruf 112</b> (CH Polizei <b>117</b>) · Gewalt gegen Frauen: <b>DE 116 016</b> · <b>AT 0800 222 555</b> · CH Opferhilfe <b>142</b> · Seelsorge: <b>CH 143</b> · <b>DE 0800 111 0 111</b> · <b>AT 142</b></div>';
  }

  /* ---------- Schnell weg ---------- */
  function weg(){
    try { document.body.innerHTML = ""; } catch (e) {}
    location.replace(EXIT_URL);
  }
  var wegKnopf = $("schnell-weg");
  if (wegKnopf) wegKnopf.addEventListener("click", weg);
  var escZahl = 0, escTimer = null;
  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    if (document.querySelector("dialog[open]")) return;
    escZahl++;
    clearTimeout(escTimer);
    escTimer = setTimeout(function(){ escZahl = 0; }, 800);
    if (escZahl >= 2) weg();
  });

  /* ---------- Kauf-Knöpfe ---------- */
  // <a class="knopf" data-kauf="mira" data-wort="MIRA">…</a>
  document.querySelectorAll("[data-kauf]").forEach(function(a){
    var url = KAUF[a.getAttribute("data-kauf")];
    if (url) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      return;
    }
    var wort = a.getAttribute("data-wort");
    if (!wort) { a.hidden = true; return; }
    var p = document.createElement("p");
    p.className = "warteliste";
    p.innerHTML = 'Bald erhältlich. Schreib <b></b> an <a href="' + INSTAGRAM + '" target="_blank" rel="noopener">@_seelenwende</a>, dann bekommst du Bescheid, sobald es losgeht.';
    p.querySelector("b").textContent = wort;
    var reihe = a.closest(".knopf-reihe");
    if (reihe && reihe.querySelectorAll("a").length === 1) { reihe.replaceWith(p); }
    else { a.replaceWith(p); }
  });

  /* ---------- Kaufleiste auf dem Handy ---------- */
  var leiste = $("kaufleiste");
  var held = document.querySelector(".held");
  var preisbox = $("kaufen");
  if (leiste && held && "IntersectionObserver" in window) {
    if (!leiste.querySelector("[data-kauf]") && !leiste.querySelector("a[href^='#']")) leiste.remove();
    else {
      document.body.classList.add("mit-kaufleiste");
      var heldSichtbar = true, boxSichtbar = false;
      var zeigen = function(){ leiste.classList.toggle("sichtbar", !heldSichtbar && !boxSichtbar); };
      new IntersectionObserver(function(e){ heldSichtbar = e[0].isIntersecting; zeigen(); }).observe(held);
      if (preisbox) new IntersectionObserver(function(e){ boxSichtbar = e[0].isIntersecting; zeigen(); }).observe(preisbox);
    }
  }

  /* ---------- Mail-Fenster vor den kostenlosen Werkzeugen ---------- */
  var freiLinks = document.querySelectorAll("a[data-ziel]");
  if (!freiLinks.length) return;

  function istFrei(){ try { return localStorage.getItem(FREI_KEY) === "1"; } catch (e) { return false; } }
  function merken(){ try { localStorage.setItem(FREI_KEY, "1"); } catch (e) {} }

  var tor = document.createElement("dialog");
  tor.className = "tor";
  tor.setAttribute("aria-labelledby", "tor-titel");
  tor.innerHTML =
    '<button class="zu" type="button" aria-label="Schließen">&times;</button>' +
    '<form novalidate>' +
      '<h2 id="tor-titel">Schön, dass du da bist.</h2>' +
      '<p>Trag deine Mail-Adresse ein, dann öffnen sich alle kostenlosen Werkzeuge für dich.</p>' +
      '<label class="sr" for="tor-email">Deine Mail-Adresse</label>' +
      '<input type="email" id="tor-email" autocomplete="email" placeholder="Deine Mail-Adresse" required>' +
      '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="check"><input type="checkbox" id="tor-ok"> Ich möchte gelegentlich Impulse von Seelenwende per Mail bekommen. Abmelden kann ich mich jederzeit mit einem Klick.</label>' +
      '<p class="klein" style="margin-top:8px">Nutze eine Adresse, die nur du liest.</p>' +
      '<button class="knopf" type="submit">Jetzt öffnen</button>' +
      '<p class="status" role="status"></p>' +
    '</form>';
  document.body.appendChild(tor);

  var form = tor.querySelector("form");
  var status = tor.querySelector(".status");
  var senden = tor.querySelector("button[type=submit]");
  var ziel = null;
  var schliessen = function(){ if (tor.close) tor.close(); else tor.removeAttribute("open"); };

  freiLinks.forEach(function(link){
    link.addEventListener("click", function(e){
      e.preventDefault();
      ziel = link.getAttribute("data-ziel");
      if (istFrei()) { location.href = ziel; return; }
      status.textContent = "";
      if (tor.showModal) tor.showModal(); else tor.setAttribute("open", "");
      $("tor-email").focus();
    });
  });
  tor.querySelector(".zu").addEventListener("click", schliessen);
  tor.addEventListener("click", function(e){ if (e.target === tor) schliessen(); });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var email = $("tor-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = "Bitte prüf deine Mail-Adresse."; return; }
    if (!$("tor-ok").checked) { status.textContent = "Bitte bestätige, dass du Mails von Seelenwende bekommen möchtest."; return; }
    senden.disabled = true;
    status.textContent = "Einen Moment …";
    fetch("/api/werkzeuge/anmelden", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email, einwilligung: true, website: form.website.value })
    })
      .then(function(res){ return res.json().catch(function(){ return {}; }).then(function(d){ return { ok: res.ok, data: d }; }); })
      .then(function(r){
        if (!r.ok) throw new Error(r.data.error || "Das hat gerade nicht geklappt. Versuch es bitte später noch einmal.");
        merken();
        status.textContent = "Danke! Es öffnet sich gleich …";
        location.href = ziel;
      })
      .catch(function(err){
        status.textContent = err.message || "Das hat gerade nicht geklappt. Versuch es bitte später noch einmal.";
        senden.disabled = false;
      });
  });
})();
