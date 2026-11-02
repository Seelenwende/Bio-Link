---
name: ig-audit
description: Prüft ein ganzes Instagram-Konto (Profil, Bio, Link, Highlights, Feed, Hooks, CTAs) Punkt für Punkt und gibt die drei wichtigsten nächsten Schritte. Nutzen bei „prüf mein Instagram“, „Instagram-Audit“, „warum wächst mein Account nicht“.
---

# /ig-audit – Konto-Prüfung

Lies zuerst `.claude/instagram/MARKE.md` (Zielgruppe, Säulen, Stichwörter, feste Regeln) und halte dich an alle Regeln dort.

## Ablauf
1. **Konto klären:** Welcher Handle? Ohne Angabe: @_seelenwende.
2. **Daten holen – ehrlich:**
   - Ist ein Instagram-Connector/MCP aktiv, damit Profil + letzte 12 Posts lesen.
   - Sonst: die Nutzerin bitten, Bio, Namensfeld, Link, Follower/Beiträge, 6–12 Captions (erste Zeilen reichen) und ggf. Screenshots von Highlights/Feed einzufügen.
   - Was nicht vorliegt, ist „nicht prüfbar“ – nicht raten.
3. **Prüfen** gegen die Checkliste aus `netlify/lib/profile-check.mts` (Bereiche: Erster Eindruck, Bio, Link in Bio, Story-Highlights, Feed & Inhalte, Vertrauen & Angebot). Jeder Punkt: gut / ausbaufähig / fehlt / nicht prüfbar, mit Befund (Zitat, Post-Nummer) und konkretem Vorschlag.
4. **Hooks & CTAs** der Posts bewerten (Zahl, Zeitrahmen, echte Erfahrung, konkretes Gefühl, Neugier-Lücke; CTA genau einer, ideal Stichwort → DM).
5. **Abgleich mit dem Bio-Link:** Passt der Link zur Startseite in diesem Repo (`index.html`)? Führt er zu genau einem nächsten Schritt pro Phase?

## Ausgabe
- Gesamtscore 0–100 und ein Satz als Urteil
- **Top 3 Prioritäten** (größte Wirkung zuerst)
- Tabelle pro Bereich: Punkt · Bewertung · Befund · Vorschlag
- Neues Namensfeld (≤ 64 Zeichen) und neue Bio (≤ 150 Zeichen) zum Kopieren
- Hook-Tabelle pro Post mit Umschreibung
- Auf Wunsch speichern unter `instagram/audit-JJJJ-MM-TT.md`, damit der nächste Audit vergleichen kann (Score-Verlauf).
