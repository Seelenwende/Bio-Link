/* Code-Freischaltung für bezahlte Browser-Werkzeuge (Red-Flag-Radar, Werte-Finder, Sei sanft mit dir).
   Einbinden am Ende von <body>:
   <script src="assets/werkzeug-zugang.js" data-werkzeug="radar" data-name="Red-Flag-Radar"
           data-preis="9 €" data-angebot="angebot-radar.html"></script>
   Der Code wird nur geprüft (/api/werkzeug/zugang), nicht gespeichert. Gemerkt wird nur „frei“ –
   dauerhaft nur mit Häkchen, sonst bis der Tab geschlossen wird.
   In Netlify-Vorschauen (deploy-preview-…) gibt es zusätzlich „Vorschau ohne Code ansehen“. */
(function(){
  "use strict";
  var s = document.currentScript;
  var werkzeug = s.getAttribute("data-werkzeug");
  var name = s.getAttribute("data-name") || "Dieses Werkzeug";
  var preis = s.getAttribute("data-preis") || "";
  var angebot = s.getAttribute("data-angebot") || "start.html#angebote";
  var KEY = "sw_frei_" + werkzeug;
  var EXIT_URL = "https://www.google.com/search?q=wetter";

  function frei(){
    try { if (localStorage.getItem(KEY) === "1" || sessionStorage.getItem(KEY) === "1") return true; } catch (e) {}
    return false;
  }
  if (!werkzeug || frei()) return;

  var css =
    ".swz{position:fixed;inset:0;z-index:9999;overflow:auto;display:flex;align-items:center;justify-content:center;padding:24px 16px;" +
      "background:linear-gradient(135deg,#F6E9EC,#F3DDE2 55%,#EFD3DA);font-family:Jost,system-ui,sans-serif;font-weight:300;color:#5C3A46;}" +
    ".swz *{box-sizing:border-box;}" +
    ".swz-karte{width:100%;max-width:440px;background:#fff;border-radius:26px;padding:34px 28px 26px;position:relative;overflow:hidden;" +
      "box-shadow:0 4px 10px rgba(74,45,56,.06),0 28px 60px -22px rgba(74,45,56,.38);}" +
    ".swz-karte::before{content:'';position:absolute;left:0;right:0;top:0;height:6px;background:linear-gradient(90deg,#B5808F,#8C5A69,#5C3A46);}" +
    ".swz-logo{width:44px;height:44px;display:block;margin-bottom:14px;}" +
    ".swz-label{font-size:.72rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#8C5A69;}" +
    ".swz h1{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:1.7rem;line-height:1.15;margin:6px 0 10px;letter-spacing:-.01em;}" +
    ".swz p{margin:0 0 10px;font-size:.95rem;line-height:1.6;color:#8E7079;}" +
    ".swz label.f{display:block;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#8E7079;margin:14px 0 6px;}" +
    ".swz input[type=text]{width:100%;font:inherit;font-size:16px;font-weight:400;letter-spacing:.04em;color:#5C3A46;background:#FAF6F4;border:1px solid #E4D8D8;border-radius:12px;padding:13px 14px;}" +
    ".swz .merk{display:flex;gap:9px;align-items:flex-start;font-size:.82rem;color:#8E7079;margin-top:10px;line-height:1.45;}" +
    ".swz .merk input{margin-top:3px;accent-color:#8C5A69;flex-shrink:0;}" +
    ".swz button.los{width:100%;margin-top:16px;border:none;border-radius:14px;cursor:pointer;font:inherit;font-weight:500;font-size:1rem;color:#fff;" +
      "background:linear-gradient(135deg,#9A6476,#7A4B5B);padding:15px;box-shadow:0 8px 20px -8px rgba(110,65,82,.65);}" +
    ".swz button.los:disabled{opacity:.6;cursor:default;}" +
    ".swz .fehler{color:#8C5A69;font-size:.88rem;min-height:1.3em;margin-top:8px;}" +
    ".swz .kauf{margin-top:14px;padding:16px;border-radius:16px;background:#FAF6F4;font-size:.92rem;line-height:1.5;}" +
    ".swz .kauf a{color:#8C5A69;font-weight:500;}" +
    ".swz .klein{font-size:.8rem;color:#8E7079;margin-top:12px;text-align:center;}" +
    ".swz .klein a{color:#8E7079;}" +
    ".swz .weg{position:fixed;top:14px;right:14px;background:#F3ECE9;color:#5C3A46;border:1px solid #E4D8D8;border-radius:20px;padding:7px 14px;font:inherit;font-size:.8rem;cursor:pointer;}" +
    ".swz .vorschau{display:block;margin-top:10px;text-align:center;font-size:.82rem;color:#8C5A69;}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement("div");
  box.className = "swz";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "swz-titel");
  box.innerHTML =
    '<button class="weg" type="button" title="Verlässt die Seite sofort">Schnell weg</button>' +
    '<form class="swz-karte" novalidate>' +
      '<img class="swz-logo" src="assets/logo.svg" alt="">' +
      '<span class="swz-label">Mit Zugangscode</span>' +
      '<h1 id="swz-titel"></h1>' +
      '<p>Gib deinen Zugangscode ein. Du findest ihn in deiner Bestätigungs-Mail.</p>' +
      '<label class="f" for="swz-code">Zugangscode</label>' +
      '<input type="text" id="swz-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Dein Zugangscode">' +
      '<label class="merk"><input type="checkbox" id="swz-merk"> Auf diesem Gerät freigeschaltet lassen. Lass das aus, wenn jemand anderes dein Handy benutzt.</label>' +
      '<button class="los" type="submit">Freischalten</button>' +
      '<div class="fehler" role="alert"></div>' +
      '<div class="kauf">Noch keinen Code? <a id="swz-kauf"></a><br><span style="color:#8E7079">Kreis- und Programm-Codes gelten hier auch.</span></div>' +
      '<p class="klein"><a href="start.html">Zurück zur Übersicht</a></p>' +
    '</form>';
  box.querySelector("#swz-titel").textContent = name;
  var kauf = box.querySelector("#swz-kauf");
  kauf.href = angebot;
  kauf.textContent = preis ? name + " für " + preis.replace(" ", "\u00a0") + " holen" : "So bekommst du " + name;
  if (/^deploy-preview-|--/.test(location.hostname) || location.hostname === "localhost") {
    var v = document.createElement("a");
    v.className = "vorschau"; v.href = "#"; v.textContent = "Vorschau: ohne Code ansehen";
    v.addEventListener("click", function(e){ e.preventDefault(); oeffnen(false); });
    box.querySelector(".swz-karte").appendChild(v);
  }

  function weg(){ try { document.body.innerHTML = ""; } catch (e) {} location.replace(EXIT_URL); }
  box.querySelector(".weg").addEventListener("click", weg);

  var vorher = "";
  function zeigen(){
    document.body.appendChild(box);
    vorher = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    box.querySelector("#swz-code").focus();
  }
  function oeffnen(merken){
    try { (merken ? localStorage : sessionStorage).setItem(KEY, "1"); } catch (e) {}
    document.documentElement.style.overflow = vorher;
    box.remove();
  }

  box.querySelector("form").addEventListener("submit", function(e){
    e.preventDefault();
    var code = box.querySelector("#swz-code").value.trim();
    var fehler = box.querySelector(".fehler");
    var los = box.querySelector(".los");
    if (!code) { fehler.textContent = "Bitte gib deinen Zugangscode ein."; return; }
    los.disabled = true; fehler.textContent = "";
    fetch("/api/werkzeug/zugang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ werkzeug: werkzeug, code: code })
    })
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(d){ return { ok: r.ok, d: d }; }); })
      .then(function(r){
        if (!r.ok) throw new Error(r.d.error || "Das hat nicht geklappt. Versuch es noch einmal.");
        oeffnen(box.querySelector("#swz-merk").checked);
      })
      .catch(function(err){ fehler.textContent = err.message; los.disabled = false; });
  });

  if (document.body) zeigen(); else document.addEventListener("DOMContentLoaded", zeigen);
})();
