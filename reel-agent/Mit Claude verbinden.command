#!/bin/bash
# Doppelklick trägt den Reel-Agenten in Claude Desktop ein (macOS/Linux).
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js fehlt. Bitte einmalig von https://nodejs.org installieren (LTS) und dann erneut doppelklicken."
  read -r -p "Enter zum Schließen …"
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Benötigte Bausteine werden installiert (dauert ca. 1 Minute) …"
  npm install --omit=dev || { read -r -p "Installation fehlgeschlagen. Enter zum Schließen …"; exit 1; }
fi
node src/install-claude.js
read -r -p "Enter zum Schließen …"
