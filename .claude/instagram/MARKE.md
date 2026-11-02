# Seelenwende auf Instagram – gemeinsame Grundlage aller /ig-Skills

Jeder `/ig-…`-Skill liest diese Datei zuerst. Sie gilt für @_seelenwende und lässt sich für weitere Konten (z. B. digitalseed) kopieren: einfach einen Abschnitt „Konto: …“ ergänzen.

## Konto: @_seelenwende

- **Wer spricht:** eine Frau, die selbst aus einer belastenden Beziehung herausgefunden hat. Per Du, warm, klar, ohne Floskeln, ohne Schönreden.
- **Für wen:** Frauen in oder nach einer emotional missbräuchlichen / toxischen Beziehung, in drei Phasen:
  - **Noch drin**: sie zweifelt an sich („Ist das noch normal?“)
  - **Im Gehen**: sie steht kurz vor dem Ausstieg
  - **Danach**: sie baut sich wieder auf
- **Themen-Säulen:** 1. Muster erkennen (Gaslighting, heiß-kalt, Schuldumkehr) · 2. Selbstwert & Glaubenssätze · 3. Grenzen & No Contact · 4. Wieder bei dir (Werte, Selbstfürsorge) · 5. Persönliches & Behind the Scenes
- **Einstiege (Stichwort → DM-Link):**
  - `MUSTER` → Muster-Check (gratis, noch drin)
  - `PLAN` → Ausstiegs-Planer (gratis, im Gehen, Sicherheit immer gratis)
  - `SATZ` → Glaubenssätze-Test (gratis, danach)
  - `MIRA` → Mira-Schnupper-Code
  - Kaufprodukte und Preise: siehe `PRODUKTLEITER.md` und `assets/seite.js` (`KAUF`). Keine Preise erfinden.
- **Bio-Link:** die Startseite dieses Repos (`index.html` / `start.html#phasen`), Phasen direkt verlinkbar: `start.html#drin`, `#gehen`, `#draussen`, `#unsicher`.

## Feste Regeln (für alle Skills)

1. **Sicherheit vor Reichweite.** Keine Inhalte, die eine Frau in Gefahr bringen könnten, wenn er mitliest (keine Aufforderungen zur Konfrontation, keine Tipps, die Spuren auf dem Handy hinterlassen, ohne Hinweis). Bei Gewalt-, Suizid- oder Gefahrthemen immer Hilfenummern nennen (CH 143 / 147, DE 116 016, AT 0800 222 555; Notfall 112 / 117 / 133) und keine Diagnose stellen.
2. **Keine Heilsversprechen, keine Therapie-Ersatz-Aussagen.** Kein „In 7 Tagen geheilt“. Hinweis „ersetzt keine Therapie“, wo es um Angebote geht.
3. **Keine Diagnosen über Dritte.** Nicht „er ist ein Narzisst“, sondern Verhalten beschreiben („wenn er …, ist das …“).
4. **Nichts erfinden.** Keine erfundenen Zahlen, Kundinnenstimmen, Erlebnisse, Studien. Fehlt ein Detail: Platzhalter in eckigen Klammern, z. B. `[eigenes Erlebnis]`.
5. **Kein Druck, keine Dark Patterns.** Keine künstliche Knappheit, keine Fake-Countdowns, keine Scham als Hebel.
6. **Menschlich klingen** (siehe `/ig-human`): kurze Sätze, gesprochene Sprache, keine KI-Floskeln („In der heutigen schnelllebigen Welt“, „Lass uns eintauchen“, „Gamechanger“), sparsam mit Emojis (max. 1–2) und Gedankenstrichen.
7. **Genau eine Handlungsaufforderung pro Beitrag.** Am stärksten: Kommentar-Stichwort → DM.

## Datenquellen

- **Profil-Daten:** offizielle Instagram Graph API über `netlify/lib/instagram.mts` (Business Discovery, braucht `IG_USER_ID` + `IG_ACCESS_TOKEN`). Die Checkliste des Profil-Checks steht in `netlify/lib/profile-check.mts` – `/ig-audit` und `/ig-profile` nutzen genau diese Punkte.
- **Ohne API-Zugang:** die Nutzerin fügt Bio, Captions, Kennzahlen oder Screenshots ein. Nie so tun, als hätte man Daten abgerufen, die nicht vorliegen.
- **Veröffentlichen/Planen:** Buffer-Connector (falls verbunden) – nur als Entwurf bzw. in die Warteschlange, nie ohne Bestätigung veröffentlichen.
- **Ablage:** Ergebnisse als Markdown unter `instagram/` im Repo (z. B. `instagram/plan-2026-11.md`, `instagram/audit-2026-11-02.md`), wenn die Nutzerin es möchte.
