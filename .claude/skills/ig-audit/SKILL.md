---
name: ig-audit
description: Prüft ein Instagram-Konto (Profil, Bio, Link, Highlights, Feed, Hooks, CTAs) Punkt für Punkt mit Score und den drei wichtigsten nächsten Schritten – für Seelenwende, digitalseed oder Kunden von digitalseed. Nutzen bei „prüf mein Instagram“, „Instagram-Audit“, „warum wächst der Account nicht“.
---

# /ig-audit – Konto-Prüfung

Lies zuerst `.claude/social/KONTEN.md`. Kläre, für welches Konto du arbeitest (Seelenwende, digitalseed oder ein Kunde von digitalseed), und halte dich an die allgemeinen Regeln und an die Regeln dieses Kontos (Stimme, Anrede, Rechtschreibung, Stichwörter, besondere Regeln).

## Ablauf
1. **Daten holen – ehrlich:** Ist ein Instagram-, Manifold- oder Windsor-Connector aktiv, damit Profil und letzte 12 Beiträge lesen. Bei Kunden von digitalseed: Erfassung und Analyse aus der App übernehmen, falls vorhanden. Sonst Bio, Namensfeld, Link, Kennzahlen, 6–12 Captions und Screenshots erfragen. Was fehlt, ist „nicht prüfbar“.
2. **Checkliste** (dieselben Punkte wie der Profil-Check von Seelenwende in `netlify/lib/profile-check.mts`):
   - Erster Eindruck: Profilbild klein erkennbar · Namensfeld mit Suchbegriff · Username merkbar · Business-/Creator-Konto mit passender Kategorie
   - Bio: Zeile 1 wem/wobei · Ergebnis klar · Persönlichkeit spürbar · CTA zum Link · gut lesbar
   - Link in Bio: mobile Linkseite · wichtigster Schritt oben · max. 5–6 Links · jeder Link sagt, was man bekommt
   - Highlights: klarer Zweck · „Start hier/Über uns“ · einheitliche Cover · aktuell
   - Feed: 3 angepinnte Beiträge · 3–4 erkennbare Themen · wiedererkennbarer Stil · regelmässig · Mensch sichtbar
   - Vertrauen & Angebot: Stimmen/Beispiele auffindbar · Angebot regelmässig erwähnt · einfacher erster Schritt · nötige Hinweise sichtbar
3. **Hooks & CTAs** jedes Beitrags bewerten (Hook-Hebel aus KONTEN.md; CTA gut / schwach / fehlt).

## Ausgabe
- Gesamtscore 0–100, ein Satz Urteil, **Top 3 Prioritäten**
- Tabelle je Bereich: Punkt · Bewertung · Befund (Zitat, Beitragsnummer) · Vorschlag
- Neues Namensfeld (≤ 64 Zeichen) und neue Bio (≤ 150 Zeichen) zum Kopieren
- Hook-Tabelle mit Umschreibung je Beitrag
- Auf Wunsch speichern unter `social/<konto>/audit-JJJJ-MM-TT.md`, damit der nächste Audit vergleichen kann.
