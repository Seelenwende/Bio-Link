/* Seelenwende – „Schnell weg“ für Werkzeuge, die bisher keinen eigenen Knopf hatten.
   Der Knopf steht im Kopf (<button id="sw-weg">), zweimal Esc wirkt genauso.
   Verlässt die Seite sofort und ersetzt sie im Verlauf durch eine harmlose Seite. */
(function(){
  "use strict";
  var EXIT_URL = "https://www.google.com/search?q=wetter";
  function weg(){
    try { document.body.innerHTML = ""; } catch (e) {}
    location.replace(EXIT_URL);
  }
  var knopf = document.getElementById("sw-weg");
  if (knopf) knopf.addEventListener("click", weg);
  var zahl = 0, timer = null;
  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    if (document.querySelector("dialog[open]")) return;
    zahl++;
    clearTimeout(timer);
    timer = setTimeout(function(){ zahl = 0; }, 800);
    if (zahl >= 2) weg();
  });
})();
