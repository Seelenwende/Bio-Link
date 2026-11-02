---
name: social-report
description: Erstellt ein Reporting für Instagram, LinkedIn und Facebook (Wachstum, Reichweite, Interaktionen, Top/Flop-Beiträge, Leads) mit Vorperiodenvergleich und Empfehlungen – für eigene Konten oder Kunden von digitalseed. Nutzen bei „Social-Media-Report“, „Monatsbericht“, „wie lief der Monat“.
---

# /social-report – Reporting

Lies zuerst `.claude/social/KONTEN.md`. Kläre, für welches Konto du arbeitest (Seelenwende, digitalseed oder ein Kunde von digitalseed), und halte dich an die allgemeinen Regeln und an die Regeln dieses Kontos (Stimme, Anrede, Rechtschreibung, Stichwörter, besondere Regeln).

## Daten – nur echte
1. Kunden von digitalseed: Monats- oder Quartalsbericht der App (Buffer-Kennzahlen je Kanal und Beitrag). Die App erstellt ihn am Monatsersten als Entwurf; dieser Skill vertieft ihn.
2. Buffer-Connector (`get_aggregated_post_metrics`, `list_posts`) für eigene Konten
3. Instagram-, Windsor.ai- oder Manifold-Plugin, falls installiert
4. Eingefügte Insights oder Screenshots
Fehlendes als „keine Daten“ ausweisen. Zeitraum und Quelle immer angeben.

## Kennzahlen je Kanal
Follower (Stand, Zuwachs) · Reichweite/Impressionen · Interaktionsrate = (Kommentare + Speicherungen + Teilungen) / Reichweite · Profilaufrufe · Link-Klicks · Leads (Stichwort-Kommentare, Anfragen über die Website, Gratis-Analysen, Termine aus dem Cockpit der App)

## Ausgabe
1. 3 Sätze Zusammenfassung (Kunden: Anrede „Sie“, verständlich, ohne Fachjargon)
2. Kennzahlen-Tabelle je Kanal mit Vorperiode und Veränderung in %
3. Top 3 und Flop 3 Beiträge mit Grund (Hook, Format, Säule) wie bei `/ig-viral`
4. Auswertung nach Säule und Format
5. **5 Empfehlungen**, direkt übertragbar in `/ig-plan` bzw. den Jahresplan der App
Speichern als `social/<konto>/report-JJJJ-MM.md`.
