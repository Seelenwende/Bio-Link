#!/bin/bash
# Doppelklick startet den Reel-Agenten (macOS/Linux) und öffnet ihn im Browser.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js fehlt. Bitte einmalig von https://nodejs.org installieren (LTS) und dann erneut doppelklicken."
  read -r -p "Enter zum Schließen …"
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Erster Start: benötigte Bausteine werden installiert (dauert ca. 1 Minute) …"
  npm install --omit=dev || { read -r -p "Installation fehlgeschlagen. Enter zum Schließen …"; exit 1; }
fi
PORT="${PORT:-3000}"
( sleep 2; (command -v open >/dev/null && open "http://localhost:$PORT") || xdg-open "http://localhost:$PORT" ) >/dev/null 2>&1 &
echo "Reel-Agent läuft. Dieses Fenster offen lassen – schließen beendet den Agenten."
node src/server.js
