---
name: ig-post
description: Feed-Posts für @_seelenwende schreiben — Einzelbilder, Zitatkacheln und Karussells inklusive Slide-Texten, Caption, CTA, Hashtags und Alt-Text. Nutze diesen Skill, wenn ein Post, ein Karussell, eine Caption oder eine Bildunterschrift für Instagram gebraucht wird.
---

# Feed-Posts schreiben

**Zuerst lesen:** `.claude/skills/ig-markenkern/SKILL.md`, dazu
`references/stimme.md` und `references/sicherheit.md` aus demselben Ordner.
Ohne die Stimme wird der Text generisch, ohne die Sicherheitsregeln riskant.

## Ablauf

1. **Thema schärfen.** Phase (1, 2 oder 3), Content-Säule und der wörtliche
   Gedanke aus ihrem Kopf. Siehe `references/zielgruppe.md`. Steht das nicht,
   schreib noch nicht.
2. **Format wählen.** Siehe Tabelle unten.
3. **Slides schreiben** (bei Karussell) oder **Kachel-Text** (bei Einzelbild).
4. **Caption** nach dem Fünf-Teile-Aufbau aus `references/stimme.md`.
5. **Hashtags** nach `references/hashtags.md` — genau fünf.
6. **Alt-Text** für jedes Bild.
7. **Gegenprobe** aus dem Markenkern durchgehen.
8. **Ausgabe** im Format unten — und fragen, ob es als Buffer-Entwurf angelegt
   werden soll.

## Format wählen

| Thema | Format |
|---|---|
| Begriff erklären (DARVO, Hoovering) | Karussell, 6–8 Slides |
| Fertige Sätze zum Mitnehmen | Karussell, ein Satz pro Slide |
| Ein Gedanke, der sitzt | Einzelbild / Zitatkachel |
| Wendepunkt, emotionaler Moment | Einzelbild mit längerer Caption |
| Liste von Zeichen oder Schritten | Karussell |
| Persönlicher Einblick | Einzelbild, Caption trägt |

Faustregel: Braucht der Gedanke nach dem Hook mehr als etwa 120 Wörter
Erklärung, ist es ein Karussell.

## Karussell-Aufbau

6 bis 8 Slides. Mehr liest niemand zu Ende.

```
Slide 1   HOOK          Maximal 8 Wörter. Groß. Muss allein im Feed funktionieren.
Slide 2   EINSTIEG      Das Gefühl, das sie kennt. Macht den Wisch anschlussfähig.
Slide 3–6 KERN          Ein Gedanke pro Slide. Nie zwei.
Slide 7   ENTLASTUNG    Der Satz, der den Druck rausnimmt.
Slide 8   CTA           Ein Schritt. Ruhig. Kein Verkaufsdruck.
```

**Pro Slide höchstens 20 Wörter.** Eine Slide ist keine Textseite. Passt es nicht,
ist der Gedanke noch nicht fertig gedacht.

Bei Satz-Karussells: ein Satz pro Slide, in Anführungszeichen, dazu in kleiner
Schrift die Situation („Wenn er sagt: ‚Du übertreibst.'"). Das ist das Format mit
den meisten Speicherungen.

## Alt-Text

Jedes Bild bekommt einen. Nicht nur Barrierefreiheit — Instagram liest ihn mit.
Beschreibe, was zu sehen ist, und nenne das Thema.

> „Helle Kachel in Altrosa mit der Aufschrift ‚Ein Nein braucht keinen Beweis' —
> Grenzen setzen nach einer toxischen Beziehung."

## Ausgabeformat

Gib immer alles in einem Block aus, damit es direkt übernommen werden kann:

```
FORMAT     Karussell, 8 Slides
SÄULE      Sprache geben
PHASE      2 – im Gehen
GEDANKE    „Ich weiß, was ich will, aber ich finde die Worte nicht."

SLIDES
1  …
2  …

CAPTION
…

HASHTAGS
#… #… #… #… #…

ALT-TEXT
Slide 1: …

HINWEIS   (falls ein Sicherheitshinweis oder Disclaimer nötig ist)
```

## Nach Buffer

Ist der Post freigegeben, leg ihn mit `create_post` an — Organisation und
Kanal-ID stehen in `references/kanaele.md`.

- **Immer `draft`**, nie direkt veröffentlichen.
- Hashtags gehören mit in den Caption-Text.
- Bilder liegen noch nicht vor: Text als Entwurf anlegen, die Grafiken werden in
  Buffer nachträglich angehängt. Sag das ausdrücklich dazu.
- Für reine Ideen ohne Termin ist `create_idea` das richtige Werkzeug.

## Woran du einen schwachen Entwurf erkennst

- Der Hook könnte über jedem beliebigen Selbstliebe-Account stehen.
- Der Entlastungssatz fehlt — der Post belehrt.
- Zwei CTAs.
- Eine Slide trägt zwei Gedanken.
- Die Caption wiederholt nur die Slides, statt sie zu vertiefen.
- Irgendwo steht „Narzissten sind…" statt „ein Muster, das viele beschreiben".

Ist eines davon wahr: nochmal. Ein schwacher Post kostet mehr Reichweite, als er
bringt.
