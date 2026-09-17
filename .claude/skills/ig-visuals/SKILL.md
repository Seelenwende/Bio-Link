---
name: ig-visuals
description: Grafiken für @_seelenwende gestalten — Farben, Schriften, Karussell-Layouts, Zitatkacheln, Reel-Cover und Design-Briefings für Canva. Nutze diesen Skill, wenn Bilder, Kacheln, Slides, Cover oder das Feed-Erscheinungsbild gebraucht werden.
---

# Visuelles

**Zuerst lesen:** `.claude/skills/ig-markenkern/SKILL.md`.

Der Look ist bereits definiert — in `index.html` in diesem Repository, der
Bio-Link-Seite. Die Werte unten sind von dort übernommen. Weicht Instagram davon
ab, ist Instagram falsch, nicht die Seite.

## Farben

| Name | Hex | Wofür |
|---|---|---|
| Papier | `#FAF6F4` | Hintergrund, Standard |
| Sand | `#F3ECE9` | zweiter Hintergrund, Abwechslung |
| Rose | `#B5808F` | Akzent, Linien, kleine Beschriftungen |
| Beere | `#8C5A69` | Flächen für wichtige Aussagen |
| Pflaume | `#5C3A46` | Text, dunkle Flächen |
| Gedämpft | `#8E7079` | Nebentext |
| Linie | `#E4D8D8` | Trennlinien |
| Mikro | `#C3AEB2` | Seitenzahlen, Feinstes |

**Regeln:** heller Grund mit pflaumefarbenem Text ist der Normalfall. Dunkle
Flächen (Beere, Pflaume) sind für Aussagen reserviert, die sitzen sollen — nie
mehr als zwei Slides pro Karussell. Kein Weiß, kein Schwarz, keine Farbe außerhalb
der Palette. Keine Verläufe.

## Schriften

- **Playfair Display** (500) — Aussagen, Hooks, Slide-Überschriften.
  *Kursiv* für Taglines und Zitate. Das ist die Stimme der Marke.
- **Jost** (300) — Fließtext, Erklärungen, Kleingedrucktes. Leicht, nie fett.
- **Versalien mit weiter Laufweite** (Playfair, ~10 px, `letter-spacing: .4em`)
  für kleine Rubriken über einer Slide: `DEIN ERSTER SCHRITT`.

Keine dritte Schrift. Keine handgeschriebenen Schriften.

## Der Schmetterling

Das Erkennungszeichen: vier runde Flügel als feine Linie, mit Fühlern und Punkten.
Der komplette SVG-Pfad steht in `index.html` und kann von dort übernommen werden.

- Nur als Linie in Rose (`#B5808F`), nie ausgefüllt, nie in anderer Farbe.
- Klein und beiläufig — auf der letzten Karussell-Slide, als Signatur auf einer
  Zitatkachel. Nicht auf jeder Slide.

## Karussell-Slides

Format **1080 × 1350** (4:5) — mehr Platz im Feed als quadratisch.

```
┌─────────────────────┐
│                     │  ≥ 120 px Rand oben
│   RUBRIK (klein)    │  Playfair Versalien, Rose, optional
│                     │
│   Die Aussage       │  Playfair 500, 56–72 px, Pflaume
│   in zwei Zeilen    │  linksbündig oder mittig, pro Karussell einheitlich
│                     │
│   Erklärung dazu    │  Jost 300, 28–34 px, Gedämpft
│                     │
│                  1/8│  Mikro, unten rechts
└─────────────────────┘  ≥ 120 px Rand unten
```

- **Viel Weißraum.** Das ist das Markenzeichen. Im Zweifel Text kürzen, nicht
  Schrift verkleinern.
- Maximal 20 Wörter pro Slide.
- Seitenzahlen ab Slide 2, dezent.
- Slide 1 muss allein im Feed funktionieren — sie ist das Titelbild.
- **Sicherer Bereich:** unten 20 % und oben 15 % frei lassen, dort liegen
  Bedienelemente und die Caption-Vorschau.

## Zitatkacheln

Ein Satz, mittig, Playfair kursiv auf Papier oder Sand. Darunter klein
`@_seelenwende` in Versalien mit weiter Laufweite. Der Schmetterling darf hier
stehen. Sonst nichts.

Das ist das meistgeteilte Format — Screenshots davon landen in WhatsApp-Chats.
Deshalb muss der Handle immer drauf sein.

## Reel-Cover

- 1080 × 1920, aber die entscheidende Fläche ist der **mittlere quadratische
  Ausschnitt** — nur der ist im Feed-Raster sichtbar.
- Höchstens 6 Wörter, Playfair, groß.
- Im Raster betrachten: Die Cover der letzten neun Beiträge sollen zusammen ruhig
  wirken, nicht wie neun verschiedene Accounts.

## Bildsprache

**Passend:** leere, helle Räume · Fenster mit Morgenlicht · eine Hand an einer
Tasse · zerknittertes Bettzeug · Weg, Tür, Schwelle · Papier und Stift ·
Natur in gedeckten Tönen · Rückenansichten, Gesicht nicht erkennbar.

**Nicht:** weinende Frauen in Nahaufnahme · Fäuste, Schatten, bedrohliche Männer ·
Stockfoto-Lächeln · alles, was Gewalt darstellt oder andeutet · grelle Farben ·
erkennbare Gesichter realer Personen.

Die Bilder sollen Ruhe halten, während der Text die Schwere trägt. Das ist die
Aufteilung.

## Mit Canva arbeiten

Für Karussells und Kacheln ist Canva angebunden.

- Prüfe mit `list-brand-kits`, ob ein Seelenwende-Brand-Kit existiert. Wenn ja,
  verwende es — es ist verbindlicher als diese Seite.
- Prüfe mit `search-designs` und `search-brand-templates`, ob es schon eine
  Vorlage gibt. Bestehende Vorlagen wiederverwenden schlägt neue erzeugen.
- Bei `generate-design` immer die Hex-Werte und Schriftnamen oben mitgeben —
  ohne sie fällt Canva auf Standardfarben zurück.
- Erzeugte Designs sind Entwürfe. Vor der Veröffentlichung wird geprüft.

## Design-Briefing

Wenn du kein Design erzeugst, sondern eines beschreibst:

```
FORMAT      Karussell 1080×1350, 8 Slides
GRUNDTON    Papier #FAF6F4, Slide 1 und 7 auf Beere #8C5A69
SCHRIFT     Playfair Display 500 für Aussagen, Jost 300 für Erklärungen

SLIDE 1     Hintergrund Beere · Text Papier
            Rubrik:    GRENZEN
            Aussage:   „Ein Nein braucht keinen Beweis."
            Bild:      —

SLIDE 2     …
```
