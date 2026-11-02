---
name: social-report
description: Erstellt ein Reporting für Instagram, LinkedIn und Facebook (Wachstum, Reichweite, Interaktionen, Top-Beiträge, Klicks auf Gratis-Einstiege) mit Vergleich zum Vormonat und konkreten Empfehlungen. Nutzen bei „Social-Media-Report“, „Monatsbericht Instagram“, „wie lief der Monat“.
---

# /social-report – Reporting

Lies zuerst `.claude/instagram/MARKE.md` und halte dich an alle Regeln dort.

## Daten – nur echte
In dieser Reihenfolge nutzen, was verbunden ist:
1. Buffer (`get_aggregated_post_metrics`, `list_posts`) für veröffentlichte Beiträge und Kennzahlen
2. Instagram-/Windsor.ai-/Manifold-Plugin, falls installiert
3. Von der Nutzerin eingefügte Insights (Screenshots oder Zahlen)
Fehlende Werte als „keine Daten“ ausweisen, nie schätzen oder erfinden. Zeitraum und Quelle immer angeben.

## Kennzahlen je Kanal
Follower (Stand, Zuwachs) · Reichweite/Impressionen · Interaktionsrate (Kommentare + Speicherungen + Teilungen) / Reichweite · Profilaufrufe · Link-Klicks · Stichwort-Kommentare je Stichwort (MUSTER, PLAN, SATZ, MIRA) als Hinweis auf Leads.
Wenn vorhanden: Anmeldungen über die Gratis-Werkzeuge der Website im selben Zeitraum.

## Ausgabe
1. Drei Sätze Zusammenfassung (was lief gut, was nicht, was jetzt tun)
2. Kennzahlen-Tabelle je Kanal mit Vormonat und Veränderung in %
3. Top 3 und Flop 3 Beiträge mit Grund (Hook, Format, Säule) – Analyse wie `/ig-viral`
4. Säulen- und Format-Auswertung (was bringt Speicherungen/Leads?)
5. **5 Empfehlungen** für den nächsten Monat, direkt übertragbar in `/ig-plan`
Speichern als `instagram/report-JJJJ-MM.md`, damit der nächste Report vergleichen kann.
