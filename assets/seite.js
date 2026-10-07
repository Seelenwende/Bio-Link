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
    "werte":           "",
    "radar":           "",
    "sanft":           "",
    "journal":         "https://seelenwende.mytentary.com/p/niaKY4",
    "tagebuch":        "",
    "programm":        "",
    "kreis":           "",
    "bundle":          "https://seelenwende.mytentary.com/p/Mi6HH3",
    "du-bist-genug":   "https://seelenwende.mytentary.com/p/Mi6HH3"
  };
  var INSTAGRAM = "https://www.instagram.com/_seelenwende/";
  // Logo im Kopf. Das echte Logo einfach als assets/logo.svg (oder .png, dann hier anpassen) ablegen.
  var LOGO = "assets/logo.svg";
  var EXIT_URL = "https://www.google.com/search?q=wetter";
  var FREI_KEY = "seelenwende_werkzeuge_frei"; // derselbe Schlüssel wie im Bio-Link

  var $ = function(id){ return document.getElementById(id); };

  /* ---------- Kopf ---------- */
  var kopf = $("kopf");
  if (kopf) {
    kopf.className = "kopf";
    kopf.innerHTML =
      '<div class="kopf-innen">' +
        '<a class="marke" href="start.html"><img src="' + LOGO + '" alt=""><span>Seelenwende</span></a>' +
        '<nav class="nav" aria-label="Hauptnavigation">' +
          '<a class="nav-optional" href="start.html#werkzeuge">Gratis</a>' +
          '<a href="start.html#angebote">Angebote</a>' +
          '<a class="nav-optional" href="ueber-mich.html">Über mich</a>' +
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
          '<a href="ueber-mich.html">Über mich</a>' +
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
    // Knöpfe, die auf einen Abschnitt zeigen (z. B. #kaufen), bleiben stehen und springen zur Preisbox.
    var ziel = a.getAttribute("href") || "";
    if (ziel.length > 1 && ziel.charAt(0) === "#") return;
    // Noch kein Kauf-Link: Der Knopf bleibt ein Knopf und führt auf die Warteliste per Instagram.
    var wort = a.getAttribute("data-wort");
    if (!wort) { a.hidden = true; return; }
    a.href = INSTAGRAM;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Schreib " + wort + " an @_seelenwende";
    var hinweis = document.createElement("p");
    hinweis.className = "warteliste";
    hinweis.textContent = a.closest(".angebot")
      ? "Bald erhältlich"
      : "Bald erhältlich. Schreib uns, dann bekommst du Bescheid, sobald es losgeht.";
    var reihe = a.closest(".knopf-reihe");
    (reihe || a).insertAdjacentElement("afterend", hinweis);
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


  /* ---------- Bewegung: Einblenden beim Scrollen, Lesefortschritt ---------- */
  (function(){
    var ruhig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var balken = document.createElement("div");
    balken.className = "fortschritt";
    document.body.appendChild(balken);
    var tick = false;
    window.addEventListener("scroll", function(){
      if (tick) return; tick = true;
      requestAnimationFrame(function(){
        var h = document.documentElement.scrollHeight - innerHeight;
        balken.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")";
        tick = false;
      });
    }, { passive: true });
    if (ruhig || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("js-anim");
    var ziele = document.querySelectorAll(".abschnitt h2, .karte, .leistung, .angebot, .woche, .schritt-karte, .sicher, .zitat, .stimmung, .persoenlich, .preisbox, .fragen details, .zitat-karte, .gruppen-kopf, .bild-band blockquote, .bild-text .text, .zahlen li, .stufenleiter li, .foto-buehne, .muster-ergebnis, .zeitachse li");
    var io = new IntersectionObserver(function(eintraege){
      eintraege.forEach(function(e){ if (e.isIntersecting) { var t = e.target; t.classList.add("da"); io.unobserve(t); setTimeout(function(){ t.style.transitionDelay = ""; }, 1300); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    ziele.forEach(function(el){
      if (el.closest(".held")) return;
      var geschwister = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(geschwister, 5) * 70 + "ms";
      el.classList.add("enthuellen");
      io.observe(el);
    });
  })();


  /* ---------- Mehr Bewegung: Wechselwort, Zahlen, Kopf, Parallax, Neigung ---------- */
  (function(){
    var ruhig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Kopf wird beim Scrollen kompakter
    var kopfEl = document.getElementById("kopf");
    var kopfTick = false;
    window.addEventListener("scroll", function(){
      if (kopfTick || !kopfEl) return; kopfTick = true;
      requestAnimationFrame(function(){ kopfEl.classList.toggle("klein", scrollY > 40); kopfTick = false; });
    }, { passive: true });

    // Wechselndes Wort: <span class="wechsel-wort" data-woerter="a|b|c">
    document.querySelectorAll("[data-woerter]").forEach(function(el){
      var woerter = el.getAttribute("data-woerter").split("|"), i = 0;
      if (ruhig || woerter.length < 2) return;
      setInterval(function(){
        el.classList.add("raus");
        setTimeout(function(){ i = (i + 1) % woerter.length; el.textContent = woerter[i]; el.classList.remove("raus"); }, 450);
      }, 2600);
    });

    // Zahlen hochzählen, sobald sie sichtbar werden: <span data-zaehlen="15">15</span>
    var zahlen = document.querySelectorAll("[data-zaehlen]");
    if (zahlen.length && !ruhig && "IntersectionObserver" in window) {
      var zio = new IntersectionObserver(function(eintraege){
        eintraege.forEach(function(e){
          if (!e.isIntersecting) return;
          zio.unobserve(e.target);
          var el = e.target, ziel = Number(el.getAttribute("data-zaehlen")), start = null, dauer = 1400;
          function schritt(t){
            if (start === null) start = t;
            var p = Math.min(1, (t - start) / dauer);
            el.textContent = Math.round(ziel * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(schritt);
          }
          el.textContent = "0";
          requestAnimationFrame(schritt);
        });
      }, { threshold: .6 });
      zahlen.forEach(function(z){ zio.observe(z); });
    }

    if (ruhig) return;

    // Parallax: Hintergrund oben und Fotos bewegen sich leicht gegen die Scrollrichtung
    var held = document.querySelector(".held-hintergrund");
    var fotos = Array.prototype.slice.call(document.querySelectorAll(".stimmung img, .foto-buehne .foto img"));
    var pTick = false;
    function parallax(){
      pTick = false;
      var h = innerHeight;
      if (held) held.style.transform = "translate3d(0," + Math.min(scrollY, h) * 0.25 + "px,0)";
      fotos.forEach(function(img){
        var r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) return;
        var mitte = (r.top + r.height / 2 - h / 2) / h;
        img.style.transform = "translate3d(0," + (mitte * -24).toFixed(1) + "px,0)";
      });
    }
    window.addEventListener("scroll", function(){ if (!pTick) { pTick = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();

    // Leichte 3D-Neigung der Angebotskarten bei Maus
    if (window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll(".angebot, .stufenleiter li").forEach(function(k){
        k.addEventListener("mousemove", function(e){
          var r = k.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          k.style.transform = "perspective(900px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 6).toFixed(2) + "deg) translateY(-4px)";
        });
        k.addEventListener("mouseleave", function(){ k.style.transform = ""; });
      });
    }
  })();

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
