/* Inhalte des Seelenwende Kreises: ein Thema pro Monat, vier Wochen-Impulse.
   Ein Monat wird ab seinem ersten Tag sichtbar (Schweizer Zeit), ältere bleiben im Archiv.
   Jedes Thema muss für alle drei Phasen tragen: noch drin, im Gehen, danach.

   Neuen Monat anlegen: unten in THEMEN ein Objekt mit "monat": "JJJJ-MM" anhängen. */

export interface Woche {
  titel: string;
  /** Der Impuls der Woche, 60–120 Wörter. Absätze mit Leerzeile trennen. */
  text: string;
  /** Eine kleine Übung, die in den Alltag passt und niemandem auffällt. */
  uebung: string;
  /** Eine Frage für das Journal. */
  frage: string;
  /** Vorschlag für den Einstieg ins Gespräch mit Mira. */
  miraSatz: string;
}

export interface Thema {
  monat: string;
  titel: string;
  untertitel: string;
  /** Kurzer Brief zum Monatsanfang. */
  brief: string;
  wochen: [Woche, Woche, Woche, Woche];
}

const THEMEN: Thema[] = [
  {
    monat: "2026-10",
    titel: "Deiner Wahrnehmung wieder trauen",
    untertitel: "Was du gesehen, gehört und gespürt hast, zählt.",
    brief:
      "Willkommen im Kreis. Schön, dass du da bist.\n\nIm Oktober geht es um etwas, das fast alle von uns kennen: das Gefühl, der eigenen Wahrnehmung nicht mehr trauen zu können. „Vielleicht übertreibe ich.“ „Vielleicht habe ich das falsch verstanden.“ Egal, ob du noch mittendrin bist, gerade gehst oder schon draußen bist: Dieser Zweifel ist kein Zeichen von Schwäche. Er ist eine Folge dessen, was du erlebt hast. Und er lässt sich Schritt für Schritt wieder leiser machen.\n\nJede Woche bekommst du einen Impuls, eine kleine Übung und eine Frage. Nimm dir, was dir guttut. Nichts davon musst du perfekt machen.",
    wochen: [
      {
        titel: "Woher der Zweifel kommt",
        text:
          "Wenn jemand dir immer wieder sagt, dass etwas nicht so war, wie du es erlebt hast, beginnt dein Kopf irgendwann, sich selbst zu überprüfen. Erst bei großen Dingen, dann bei kleinen. Das ist keine Charakterschwäche. Dein Gehirn versucht, Frieden herzustellen, indem es die Schuld bei dir sucht. Das fühlt sich sicherer an, als zu akzeptieren, dass jemand, den du liebst, dir die Wirklichkeit verdreht.\n\nDiese Woche geht es nur ums Bemerken. Wann zweifelst du an dir? Bei welchen Themen? Bei welchen Menschen?",
        uebung:
          "Achte diese Woche auf den Satz „Vielleicht bin ich zu …“. Wann immer er auftaucht, mach im Kopf einen kleinen Strich. Mehr nicht. Du musst nichts ändern, nur zählen.",
        frage: "In welchen Momenten traue ich mir am wenigsten, und wer ist dann meistens in der Nähe?",
        miraSatz: "Ich merke, dass ich oft an meiner eigenen Wahrnehmung zweifle. Kannst du mir helfen zu verstehen, woher das kommt?",
      },
      {
        titel: "Was passiert ist und was du dir dazu erzählst",
        text:
          "Ein Werkzeug, das dir Halt gibt: Trenne, was passiert ist, von dem, was du darüber denkst. „Er hat gesagt, ich sei zu empfindlich“ ist passiert. „Ich bin zu empfindlich“ ist eine Deutung, die du übernommen hast.\n\nWenn du die beiden auseinanderhältst, wird vieles klarer. Die Fakten gehören dir. Niemand kann sie dir nachträglich wegnehmen, auch wenn er es versucht. Die Deutung darfst du prüfen, in Ruhe und ohne Druck.",
        uebung:
          "Nimm eine Situation der letzten Tage, die dich verunsichert hat. Schreib zwei Zeilen: „Was wurde gesagt oder getan?“ und „Was habe ich danach über mich gedacht?“. Wenn es für dich sicher ist, schreib es auf, sonst denk es nur durch.",
        frage: "Welche Deutung über mich habe ich übernommen, die eigentlich gar nicht von mir stammt?",
        miraSatz: "Ich möchte eine Situation auseinandernehmen: was wirklich passiert ist und was ich mir danach über mich erzählt habe.",
      },
      {
        titel: "Dein Körper hat es zuerst gewusst",
        text:
          "Oft weiß der Körper es früher als der Kopf. Der Magen zieht sich zusammen, wenn sein Name auf dem Display erscheint. Die Schultern gehen hoch, wenn du seinen Schlüssel in der Tür hörst. Oder du atmest auf, wenn er nicht da ist.\n\nDiese Signale sind keine Einbildung. Sie sind Informationen. Du musst nicht sofort etwas mit ihnen machen. Aber du darfst ihnen wieder zuhören, statt sie wegzudrücken.",
        uebung:
          "Halte dreimal am Tag kurz inne, zum Beispiel beim Händewaschen. Frag dich: „Wie fühlt sich mein Körper gerade an? Eng oder weit, angespannt oder ruhig?“ Nur wahrnehmen, nicht bewerten.",
        frage: "Wo in meinem Körper spüre ich, dass etwas nicht stimmt, und wo spüre ich, dass ich sicher bin?",
        miraSatz: "Mein Körper reagiert stark auf manche Situationen, und ich weiß nicht, ob ich dem trauen kann.",
      },
      {
        titel: "Eine Stimme, die dir glaubt",
        text:
          "Zweifel wachsen in der Isolation. Sie werden kleiner, wenn eine einzige Person sagt: „Ich glaube dir. Das klingt wirklich schwer.“ Das kann eine Freundin sein, eine Beratungsstelle, eine Therapeutin. Und es kann eine Stimme in dir selbst sein, die du nach und nach stärker werden lässt.\n\nDu musst niemandem alles erzählen. Aber du verdienst einen Ort, an dem du nicht beweisen musst, dass deine Gefühle berechtigt sind. Dieser Kreis soll einer davon sein.",
        uebung:
          "Schreib dir einen Satz, den du hören möchtest, wenn der Zweifel kommt, zum Beispiel: „Ich war dabei. Ich weiß, was ich erlebt habe.“ Lies ihn diese Woche jeden Abend einmal, leise oder in Gedanken.",
        frage: "Wer in meinem Leben glaubt mir, und wie kann ich diese Verbindung ein kleines Stück stärken?",
        miraSatz: "Ich möchte einen Satz für mich finden, der mich stärkt, wenn ich wieder an mir zweifle.",
      },
    ],
  },
  {
    monat: "2026-11",
    titel: "Grenzen, die dich schützen",
    untertitel: "Ein Nein ist ein vollständiger Satz.",
    brief:
      "Im November schauen wir auf Grenzen. Nicht die großen, dramatischen, sondern die kleinen, alltäglichen, die uns langsam abhandengekommen sind.\n\nWenn du noch in der Beziehung bist, kann eine Grenze manchmal mehr Ärger bringen als Schutz. Deine Sicherheit geht immer vor. Du entscheidest, welche Grenze gerade möglich ist, und auch eine Grenze nur in deinem Kopf zählt. Wenn du gerade gehst oder schon draußen bist, helfen Grenzen dir, deinen Raum zurückzuholen, Stück für Stück.",
    wochen: [
      {
        titel: "Wo deine Grenzen verschwunden sind",
        text:
          "Grenzen verschwinden selten auf einmal. Sie werden kleiner, weil es einfacher ist, nachzugeben, als den nächsten Streit zu führen. Irgendwann weißt du nicht mehr genau, was du eigentlich willst, weil du so lange darauf geachtet hast, was er will.\n\nDas war kein Fehler. Es war eine Art, dich zu schützen. Jetzt darfst du langsam wieder nachspüren, wo deine Linie verläuft.",
        uebung:
          "Achte diese Woche auf Momente, in denen du „Ja“ sagst und innerlich „Nein“ meinst. Du musst nichts ändern. Merk dir nur, wann es passiert.",
        frage: "Wobei sage ich Ja, obwohl ich Nein meine, und was befürchte ich, wenn ich Nein sage?",
        miraSatz: "Ich merke, dass ich oft Ja sage, obwohl ich Nein meine. Kannst du mir helfen, das zu verstehen?",
      },
      {
        titel: "Erklären, rechtfertigen, verteidigen",
        text:
          "Viele von uns haben gelernt, jedes Nein ausführlich zu begründen. Doch je mehr wir erklären, desto mehr Angriffsfläche bieten wir. Jede Begründung kann zerpflückt werden.\n\nEine Grenze braucht keine Rechtfertigung. „Das möchte ich nicht.“ „Darüber spreche ich nicht.“ „Ich melde mich, wenn ich so weit bin.“ Diese Sätze sind vollständig. Sie dürfen sich anfangs fremd anfühlen.",
        uebung:
          "Such dir einen kurzen Grenz-Satz aus, der zu dir passt. Sag ihn dir diese Woche ein paarmal vor, am besten in einem ruhigen Moment, nicht mitten im Konflikt.",
        frage: "Welche Erklärung gebe ich immer wieder ab, obwohl sie nie etwas ändert?",
        miraSatz: "Ich möchte einen kurzen Satz für eine Grenze finden, ohne mich zu rechtfertigen.",
      },
      {
        titel: "Wenn die Grenze nicht respektiert wird",
        text:
          "Eine Grenze ist nicht das, was du vom anderen verlangst. Es ist das, was du tust, wenn sie überschritten wird. „Wenn du mich anschreist, beende ich das Gespräch“ liegt in deiner Hand. Ob er aufhört, liegt nicht in deiner Hand.\n\nWichtig: Wenn eine Grenze dich in Gefahr bringen könnte, ist es klug, sie erst einmal nur für dich zu kennen. Eine Beratungsstelle kann dir helfen, einen sicheren Weg zu finden.",
        uebung:
          "Denk an eine Grenze, die immer wieder überschritten wird. Überleg dir: Was könnte ich tun, das nur von mir abhängt? Wenn dir nichts Sicheres einfällt, ist das auch eine wichtige Erkenntnis.",
        frage: "Was liegt in meiner Hand, wenn jemand meine Grenze ignoriert, und was nicht?",
        miraSatz: "Eine meiner Grenzen wird immer wieder ignoriert. Was kann ich tun, ohne mich in Gefahr zu bringen?",
      },
      {
        titel: "Grenzen nach innen",
        text:
          "Nicht jede Grenze richtet sich an andere. Manche richten sich an die Stimme in dir, die dich klein macht. „Ich lese seine alten Nachrichten heute nicht.“ „Ich rede nicht so mit mir.“ „Ich schaue nicht nach, was er gerade postet.“\n\nAuch das ist Schutz. Und auch hier gilt: Es muss nicht jedes Mal klappen. Jedes Mal, wenn es klappt, wird deine Linie ein bisschen fester.",
        uebung:
          "Wähle eine einzige innere Grenze für diese Woche. Schreib sie dir in Gedanken auf. Wenn du sie einmal nicht einhältst, sag dir: „Morgen ist ein neuer Versuch.“",
        frage: "Welche Grenze möchte ich mir selbst gegenüber ziehen, damit es mir besser geht?",
        miraSatz: "Ich möchte mir selbst gegenüber eine Grenze ziehen, aber ich halte sie nie lange durch.",
      },
    ],
  },
  {
    monat: "2026-12",
    titel: "Durch die Feiertage",
    untertitel: "Du musst nicht funktionieren, um dazuzugehören.",
    brief:
      "Der Dezember ist für viele von uns schwer. Familie, Erwartungen, Erinnerungen, die Frage, wie es „sein sollte“. Wer noch in der Beziehung ist, erlebt oft besonders viel Druck. Wer gerade gegangen ist oder schon draußen ist, spürt die Lücke manchmal besonders laut.\n\nIn diesem Monat geht es nicht um große Schritte. Es geht darum, gut durch diese Wochen zu kommen, mit kleinen Ankern, die dich halten.",
    wochen: [
      {
        titel: "Erwartungen leiser stellen",
        text:
          "Die Feiertage kommen mit einem Bild, wie alles sein soll: harmonisch, warm, voller Licht. Wenn dein Leben gerade anders aussieht, kann dieses Bild wehtun.\n\nDu darfst die Erwartungen leiser stellen. Es muss nicht schön werden. Es reicht, wenn es aushaltbar ist. Und vielleicht findest du darin einen kleinen Moment, der nur dir gehört.",
        uebung: "Schreib dir drei Dinge auf, die du diesen Dezember nicht tun musst. Streich sie in Gedanken durch.",
        frage: "Welche Erwartung an die Feiertage lege ich dieses Jahr bewusst ab?",
        miraSatz: "Die Feiertage machen mir Angst. Ich weiß nicht, wie ich sie überstehen soll.",
      },
      {
        titel: "Ein Plan für schwere Momente",
        text:
          "Es hilft, vorher zu wissen, was du tust, wenn es schwer wird. Ein Spaziergang, ein Anruf, ein Raum, in den du dich kurz zurückziehen kannst. Eine Ausrede, um früher zu gehen.\n\nEin Plan nimmt nicht den Schmerz, aber er nimmt die Ohnmacht. Du bist nicht ausgeliefert. Du hast Möglichkeiten, auch wenn sie klein sind.",
        uebung:
          "Überleg dir einen Satz, mit dem du eine Situation verlassen kannst, zum Beispiel: „Ich brauche kurz frische Luft.“ Und einen Ort, an den du dann gehst.",
        frage: "Was brauche ich, wenn es an den Feiertagen eng wird, und wer oder was kann mir das geben?",
        miraSatz: "Ich möchte mir einen Plan für schwierige Momente an den Feiertagen machen.",
      },
      {
        titel: "Erinnerungen, die wehtun",
        text:
          "Gerade jetzt können Erinnerungen an die guten Zeiten laut werden. Das erste gemeinsame Weihnachten. Die Momente, in denen alles gut schien. Das ist verwirrend, besonders wenn du weißt, dass es nicht gut war.\n\nBeides darf da sein: die schönen Erinnerungen und das, was dir wehgetan hat. Das eine löscht das andere nicht aus. Vermissen heißt nicht, dass du zurück musst.",
        uebung:
          "Wenn eine schöne Erinnerung kommt, sag dir leise: „Das war auch da. Und das andere war auch da.“ Lass beides nebeneinander stehen.",
        frage: "Welche Erinnerung kommt gerade immer wieder, und was möchte ich ihr sagen?",
        miraSatz: "Ich vermisse die schönen Zeiten, obwohl ich weiß, dass es nicht gut für mich war.",
      },
      {
        titel: "Ein leiser Ausblick",
        text:
          "Das Jahr geht zu Ende. Du musst keine Vorsätze fassen und nichts bilanzieren. Aber vielleicht magst du kurz zurückschauen: Was hast du in diesem Jahr ausgehalten, gelernt, gewagt?\n\nDu bist weiter, als du denkst. Auch wenn es sich nicht so anfühlt. Allein, dass du hier bist und dich mit dir selbst beschäftigst, ist ein Schritt.",
        uebung: "Schreib dir einen Satz auf, den du im neuen Jahr öfter zu dir sagen möchtest.",
        frage: "Worauf bin ich in diesem Jahr stolz, auch wenn es niemand gesehen hat?",
        miraSatz: "Ich möchte auf dieses Jahr zurückschauen und einen Satz für das neue Jahr finden.",
      },
    ],
  },
];

/** Alle Themen bis einschließlich des angegebenen Monats, neuestes zuerst. */
export function themenBis(period: string): Thema[] {
  return THEMEN.filter((t) => t.monat <= period).sort((a, b) => b.monat.localeCompare(a.monat));
}
