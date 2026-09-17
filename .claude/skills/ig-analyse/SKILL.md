---
name: ig-analyse
description: Performance von @_seelenwende auswerten — Buffer-Metriken abrufen, Posts vergleichen, Muster erkennen und daraus konkrete nächste Schritte ableiten. Nutze diesen Skill bei Fragen nach Zahlen, Reichweite, was funktioniert hat oder wie der Monat lief.
---

# Auswerten

**Zuerst lesen:** `.claude/skills/ig-markenkern/references/kanaele.md` für IDs und
`SKILL.md` für die Säulen — ohne sie kannst du Ergebnisse nicht einordnen.

## Was verfügbar ist — und was nicht

Auswertbar ist, was über **Buffer** läuft: gesendete Posts, deren Text, Format,
Zeitpunkt und die Metriken, die Buffer zurückliefert.

Nicht verfügbar: Instagram Insights im Detail — Follower-Entwicklung,
Story-Abschlussraten, Verweildauer, demografische Daten, Reichweite nach
Nichtfollowern. Dafür gibt es keine Anbindung.

**Sag das dazu, wenn es die Antwort einschränkt.** Erfinde keine Zahlen und leite
keine Follower-Entwicklung aus Buffer-Daten ab.

## Werkzeuge

```
get_aggregated_post_metrics   Summen und Mittel über einen Zeitraum — für „wie lief der Monat?"
list_posts (includeMetrics)   Einzelposts mit Zahlen — für „welcher Post lief am besten?"
```

`includeMetrics: true` nur setzen, wenn wirklich nach Leistung gefragt ist — es
macht die Antwort groß. Für Summen ist `get_aggregated_post_metrics` das richtige
Werkzeug.

Organisation `6a5e8bc473fd71ea462fb30c`, Instagram-Kanal `6a698f4e4b2d03035f5e8bdd`.

## Welche Zahl zählt

In dieser Nische ist **Reichweite die unwichtigste Zahl.** Nach Bedeutung sortiert:

1. **Speicherungen** — sie hat etwas gefunden, das sie wiederbrauchen wird. Das
   ist der beste Indikator für Nutzen.
2. **Geteilt** — sie schickt es jemandem. Der stärkste Wachstumstreiber des Accounts.
3. **Kommentare** — besonders die Keywords CARE und PROGRAMM: das ist der Übergang
   vom Zuschauen zum Kontakt.
4. **Likes** — die schwächste Währung. Viele Betroffene liken bewusst nicht, weil
   das Like in ihrem Feed sichtbar wäre. Ein Post mit wenigen Likes und vielen
   Speicherungen ist ein sehr guter Post.

**Speicherungen pro Reichweite** ist die Kennzahl, auf die es ankommt.

## So wertest du aus

1. **Zeitraum und Frage klären.** „Wie lief der Monat" und „was soll ich häufiger
   machen" sind zwei verschiedene Auswertungen.
2. **Daten holen.**
3. **Jeden Post einsortieren** — Säule, Format, Phase, CTA-Art. Erst dadurch werden
   Zahlen zu Erkenntnis. Die Zuordnung stammt aus dem Caption-Text.
4. **Vergleichen, was vergleichbar ist.** Reels gegen Reels, Karussells gegen
   Karussells. Ein Reel hat fast immer mehr Reichweite und weniger Speicherungen —
   das ist kein Ergebnis, das ist die Formatlogik.
5. **Muster suchen, keine Ausreißer feiern.** Ein starker Post ist Zufall, drei
   starke aus derselben Säule sind eine Richtung.
6. **Genau eine Empfehlung ableiten.** Nicht fünf.

## Ausgabeformat

```
ZEITRAUM   1.–30. September · 22 Posts

OBEN
1  „Grenzen setzen…"  Karussell · Sprache geben · Ph. 2 · 412 Speicherungen
2  …

UNTEN
1  …

MUSTER
· Satz-Karussells werden rund dreimal so oft gespeichert wie Erklärposts
· Reels holen die Reichweite, Karussells die Speicherungen
· Posts nach 20:00 laufen deutlich besser als vor 18:00

EMPFEHLUNG
Ein Satz-Karussell pro Woche fest einplanen, statt zwei Erklärposts.

UNSICHER
Story-Daten fehlen — ohne sie lässt sich nicht sagen, ob CARE aus dem
Feed oder aus der Story kommt.
```

Die Abschnitte **Empfehlung** und **Unsicher** gehören immer dazu. Eine Auswertung
ohne nächsten Schritt ist Buchhaltung, und eine ohne Grenzen ist Angeberei.

## Fallen

- **Nicht auf kleine Zahlen überinterpretieren.** Unter etwa zehn vergleichbaren
  Posts ist alles Rauschen.
- **Zeit mitdenken.** Ein Post von gestern hatte weniger Stunden zum Sammeln.
- **Likes nicht als Erfolgsmaß nehmen.** Siehe oben — hier gelten andere Regeln als
  auf anderen Accounts.
- **Nie empfehlen, ein schweres Thema häufiger zu bringen, nur weil es lief.**
  Reichweite rechtfertigt keinen Post, der der Community nicht guttut. Die Balance
  aus `ig-redaktionsplan` steht über der Zahl.
