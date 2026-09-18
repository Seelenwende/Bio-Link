# Prompts

Reihenfolge einhalten. Prompt 1 wird einmal pro Kunde ausgeführt, sein Ergebnis
gehört an den Anfang **jeder** späteren Anfrage — sonst bekommst du generische Texte.

---

## Prompt 1 · Stimmprofil (einmal pro Kunde)

```
Du analysierst die Schreib- und Sprechweise einer Person, damit ich später Texte
in ihrem Stil verfassen kann. Analysiere, bewerte nicht.

MATERIAL A — Transkriptauszüge aus drei Folgen:
<<<einfügen>>>

MATERIAL B — die letzten 20 Social-Posts:
<<<einfügen>>>

Erstelle ein Stimmprofil mit genau diesen Abschnitten:

1. SATZBAU: durchschnittliche Satzlänge, Verhältnis kurz/lang, Fragen als Stilmittel?
2. ANSPRACHE: du/Sie/ihr, wird das Publikum direkt adressiert, wie oft "ich"
3. WORTSCHATZ: 15 Wörter und Wendungen, die tatsächlich mehrfach vorkommen — wörtlich zitiert
4. VERMEIDET: Wörter und Muster, die im Material auffällig NICHT vorkommen
5. AUFBAU: Wie beginnt die Person? Wie endet sie? Gibt es eine wiederkehrende Struktur?
6. HALTUNG: belehrend, erzählend, fragend, thesenstark? Mit Belegstelle.
7. FÜNF ECHTE SÄTZE: wörtliche Zitate, die typisch sind.

Regeln: Keine Erfindungen. Wenn das Material für einen Punkt nicht ausreicht,
schreibe "zu wenig Material". Keine Lobhudelei über den Stil.
```

---

## Prompt 2 · Kernaussagen extrahieren (pro Folge)

```
Hier ist das Transkript einer Folge mit Timecodes:
<<<Transkript>>>

Finde jede eigenständige Aussage, die ohne den Rest der Folge verständlich ist.

Pro Aussage:
- THESE: in einem Satz, in den Worten der Person selbst (Zitat wo möglich)
- TIMECODE: Anfang–Ende
- BELEG: Beispiel, Zahl oder Anekdote aus dem Transkript, das die These stützt
- EIGNUNG: hoch / mittel / niedrig — wie gut funktioniert das ohne Kontext?
- WIDERSPRUCH: Wem würde diese Aussage widersprechen? Leer lassen, wenn niemandem.

Sortiere nach EIGNUNG. Erfinde keine Aussage, die nicht im Transkript steht.
Reine Übergänge, Begrüßungen und Werbeblöcke lässt du weg.
Aussagen ohne Widerspruch sind meist belanglos — markiere sie.
```

> Die Spalte WIDERSPRUCH ist der Qualitätsfilter. Eine These, der niemand
> widersprechen würde, wird auch niemand kommentieren.

---

## Prompt 3 · Posts (pro Aussage, nicht gebündelt)

```
STIMMPROFIL:
<<<Ergebnis Prompt 1>>>

AUSSAGE, über die geschrieben wird:
<<<eine These aus Prompt 2, inkl. BELEG>>>

KANAL: LinkedIn        (bzw. Instagram)
LÄNGE: 120–180 Wörter  (Instagram: 60–110)

Schreibe drei Fassungen desselben Posts:
A) beginnt mit dem konkreten Beleg, die These kommt am Ende
B) beginnt mit der These, der Beleg trägt sie
C) beginnt mit einer Frage, die der Leser sich selbst stellt

Für alle drei gilt:
- Erste Zeile muss allein stehen können, sie ist in der Vorschau alles was man sieht
- Keine Emojis, außer das Stimmprofil weist sie ausdrücklich nach
- Verboten: "Lass mich dir verraten", "Spoiler", "Das ändert alles", "Viele denken,
  dass ...", "Und dann passierte etwas Verrücktes", jede Aufzählung mit Pfeilen
- Nur Zahlen und Namen aus dem BELEG, keine zusätzlichen
- Kein Aufruf zum Kommentieren am Ende, außer es passt inhaltlich
- Keine Hashtags im Text; drei Vorschläge separat darunter
```

---

## Prompt 4 · Newsletter (pro Folge)

```
STIMMPROFIL: <<<einfügen>>>
FOLGE, Kernaussagen mit Belegen: <<<Ergebnis Prompt 2, die drei besten>>>
LINK ZUR FOLGE: <<<URL>>>

Schreibe einen Newsletter, 300–400 Wörter:
- 4 Betreffzeilen zur Auswahl, keine über 45 Zeichen, keine mit "Newsletter" darin
- Vorschautext, 60–90 Zeichen, der die Betreffzeile ergänzt und nicht wiederholt
- Einstieg: eine konkrete Situation, kein "in der neuen Folge sprechen wir über"
- Hauptteil: die stärkste Aussage ausführen, mit dem Beleg
- Ein Link zur Folge, an der Stelle wo die Neugier am größten ist — nicht am Ende
- Schluss: ein Satz, der auch ohne Klick etwas wert ist

Die Mail muss für sich funktionieren. Wer nicht klickt, soll trotzdem etwas gelernt haben.
```

---

## Prompt 5 · Clip-Timecodes

```
Transkript mit Timecodes: <<<einfügen>>>

Finde 12 Abschnitte von 25–60 Sekunden, die als Hochformat-Clip funktionieren.

Pro Clip:
- TIMECODE: Start–Ende, sekundengenau
- ERSTE WORTE: die ersten gesprochenen Worte, wörtlich
- WARUM: in einem Satz, warum das ohne Vorgeschichte trägt
- TITEL: Einblendung, maximal 6 Wörter
- SCHNITT: wo es hakt (Füllwörter, Nachfragen, langes Ausatmen)

Bedingungen: Der Abschnitt muss mit einem vollständigen Gedanken anfangen UND aufhören.
Keine Stelle, die sich auf etwas Vorheriges bezieht ("wie gesagt", "das eben").
Kein "Spannungsbogen ohne Auflösung" — der Clip soll die Antwort enthalten.
```

---

## Prompt 6 · Redaktionsprüfung (nach dem Erzeugen, vor der Freigabe)

```
Hier ist ein Post und das Stimmprofil der Person, in deren Namen er erscheint.

STIMMPROFIL: <<<einfügen>>>
POST: <<<einfügen>>>
QUELLTRANSKRIPT: <<<relevanter Auszug>>>

Prüfe und antworte nur in dieser Form:
1. FAKTEN: Jede Zahl, jeder Name, jede Behauptung — steht das so im Transkript? Liste
   mit Bewertung belegt / nicht belegt / abweichend.
2. STIMME: Drei Formulierungen, die nicht zum Profil passen, mit Ersatzvorschlag.
3. FLOSKELN: Alles, was nach Standardausgabe klingt.
4. ERSTE ZEILE: Funktioniert sie allein? Wenn nein, zwei Alternativen.
5. RISIKO: Etwas darin, das dem Kunden schaden kann — Wettbewerber, Gesundheits- oder
   Rechtsaussage, nicht freigegebene Kundennennung?

Keine Lobpunkte. Wenn etwas in Ordnung ist, schreibe nur "ok".
```

> Prompt 6 ersetzt deinen Redaktionsdurchgang nicht, er beschleunigt ihn. Die
> Faktenliste prüfst du selbst gegen das Transkript — auch das Prüfmodell irrt.
