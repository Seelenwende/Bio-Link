import { isCodeInList } from "./codes.mts";

/* „Wieder bei dir“ – das 6-Wochen-Programm von Seelenwende.
   Die Inhalte liegen nur hier auf dem Server und werden erst nach dem Zugangscode ausgeliefert. */

export function isValidProgrammCode(given: unknown): given is string {
  return isCodeInList("PROGRAMM_CODES", given);
}

export function isProgrammConfigured(): boolean {
  return Boolean(Netlify.env.get("PROGRAMM_CODES"));
}

export interface Impuls {
  titel: string;
  absaetze: string[];
}

export interface Werkzeug {
  text: string;
  label: string;
  href: string;
}

export interface Uebung {
  id: string;
  titel: string;
  anleitung: string;
  fragen: string[];
  /** Tool, das die Übung vorbereitet. Steht direkt unter der Anleitung. */
  werkzeug?: Werkzeug;
}

export interface Woche {
  nr: number;
  titel: string;
  untertitel: string;
  satz: string;
  einleitung: string[];
  impulse: Impuls[];
  uebungen: Uebung[];
  tage: string[];
  mira: string[];
  hinweis?: string;
  /** Weitere Seelenwende-Tools, die zum Thema der Woche passen. */
  werkzeuge?: Werkzeug[];
}

export interface Programm {
  titel: string;
  willkommen: string[];
  soGehts: string[];
  wochen: Woche[];
  abschluss: string[];
}

export const PROGRAMM: Programm = {
  titel: "Wieder bei dir",
  willkommen: [
    "Schön, dass du da bist. Du hast dir sechs Wochen geschenkt, in denen es um dich geht. Nicht um ihn, nicht darum, was du hättest anders machen sollen.",
    "Vielleicht bist du gerade dabei zu gehen. Vielleicht bist du schon draußen und merkst, dass du zwar funktionierst, dich aber noch nicht wie du fühlst. Beides hat hier Platz. Das Programm fragt nicht, wo du stehst. Es geht mit dir von dort aus, wo du bist.",
  ],
  soGehts: [
    "Eine Woche, ein Thema. Lies die Impulse, wenn du Ruhe hast. Das dauert etwa 15 Minuten.",
    "Die Übungen sind zum Schreiben. Kurz und ehrlich ist besser als schön. Du kannst jederzeit zurückkommen.",
    "Jeden Tag gibt es einen kleinen Anker. Fünf Minuten reichen. Wenn ein Tag nicht klappt, ist das kein Rückschritt.",
    "Mira ist im Programm enthalten. Du öffnest sie mit demselben Zugangscode. Zu jeder Woche findest du Gesprächsanstöße.",
    "Dein Tempo gilt. Wenn eine Woche länger braucht, bleib länger. Wenn dich ein Thema zu sehr aufwühlt, mach eine Pause.",
  ],
  wochen: [
    {
      nr: 1,
      titel: "Ankommen",
      untertitel: "Erst sicher, dann klar.",
      satz: "Ich darf zur Ruhe kommen, bevor ich alles verstehe.",
      einleitung: [
        "In der ersten Woche geht es noch nicht ums Verstehen. Es geht um deinen Körper. Solange er auf Alarm steht, fühlt sich jeder Gedanke an ihn an wie ein Notfall, und Klarheit hat kaum eine Chance.",
        "Diese Woche sammelst du deshalb kleine Werkzeuge, die dich zurück in die Ruhe holen. Und du legst fest, was du dir von diesen sechs Wochen wünschst.",
      ],
      impulse: [
        {
          titel: "Warum dein Körper noch Alarm schlägt",
          absaetze: [
            "Wenn du lange mit jemandem gelebt hast, dessen Stimmung du nie vorhersagen konntest, hat dein Nervensystem gelernt, ständig auf der Hut zu sein. Herzklopfen beim Ton des Handys, schlechter Schlaf, Gedanken, die nachts kreisen: Das ist keine Schwäche. Das ist ein Schutzprogramm, das noch läuft.",
            "Dieses Programm lässt sich nicht mit Einsicht abschalten. Es beruhigt sich durch Erfahrung: viele kleine Momente, in denen dein Körper merkt, dass gerade nichts passiert. Genau die sammelst du diese Woche.",
          ],
        },
        {
          titel: "Dein Fenster",
          absaetze: [
            "Stell dir einen Bereich vor, in dem du gleichzeitig fühlen und denken kannst. Darüber liegt die Überflutung: Panik, Wut, Rasen, der Drang, sofort etwas zu tun. Darunter liegt die Erstarrung: Leere, Taubheit, Müdigkeit, nichts mehr spüren.",
            "Beides sind Reaktionen auf Überforderung, keine Charakterfehler. Das Ziel ist nicht, immer im Fenster zu sein. Das Ziel ist, zu merken, wo du gerade bist, und einen Weg zurück zu kennen.",
          ],
        },
        {
          titel: "Drei Dinge, die immer gehen",
          absaetze: [
            "Länger aus- als einatmen: vier Zählzeiten ein, sechs aus, fünf Runden. Das langsame Ausatmen ist das Signal an deinen Körper, dass keine Gefahr besteht.",
            "Fünf, vier, drei, zwei, eins: fünf Dinge, die du siehst, vier, die du hörst, drei, die du spürst, zwei, die du riechst, eins, das du schmeckst. Das holt dich aus dem Kopf zurück in den Raum.",
            "Kaltes Wasser über die Handgelenke oder ins Gesicht. Klingt banal, wirkt oft schneller als jeder Gedanke.",
          ],
        },
      ],
      uebungen: [
        {
          id: "w1-alarm",
          titel: "Meine Alarmzeichen",
          anleitung: "Wenn du deine Zeichen kennst, merkst du früher, dass du aus dem Fenster rutschst.",
          fragen: [
            "Woran merke ich im Körper, dass ich überflutet bin?",
            "Woran merke ich, dass ich erstarre oder leer werde?",
            "Welche Situationen lösen das bei mir gerade am häufigsten aus?",
          ],
        },
        {
          id: "w1-anker",
          titel: "Mein Sicherheitsanker",
          anleitung: "Ein Anker ist etwas, an das du dich in schweren Momenten halten kannst, ohne lange nachzudenken.",
          fragen: [
            "Ein Ort, echt oder vorgestellt, an dem ich mich sicher fühle:",
            "Ein Mensch, dem ich schreiben oder den ich anrufen kann:",
            "Ein Satz, den ich mir in schweren Momenten sage:",
          ],
        },
        {
          id: "w1-wunsch",
          titel: "Was ich mir von diesen sechs Wochen wünsche",
          anleitung: "Schreib es so, dass es um dich geht, nicht um ihn. In Woche 6 liest du es noch einmal.",
          fragen: [
            "Wie möchte ich mich in sechs Wochen fühlen?",
            "Was soll diese Zeit nicht von mir verlangen?",
          ],
        },
      ],
      tage: [
        "Atme heute dreimal bewusst: vier ein, sechs aus, fünf Runden.",
        "Schreib deinen Anker-Satz auf einen Zettel oder mach ihn zu deinem Sperrbildschirm.",
        "Iss eine Mahlzeit in Ruhe, ohne Handy.",
        "Geh zehn Minuten nach draußen und such drei Dinge, die schön sind.",
        "Notier abends: Wann war ich heute in meinem Fenster?",
        "Schreib deinem Anker-Menschen eine kurze Nachricht, einfach so.",
        "Lies deine Notizen dieser Woche und markier einen Satz, der dich überrascht.",
      ],
      mira: [
        "Ich bin in Woche 1 des Programms. Mein Körper ist ständig in Alarm. Kannst du mir helfen, runterzukommen?",
        "Mir fällt kein Ort ein, an dem ich mich sicher fühle. Wie finde ich trotzdem einen Anker?",
      ],
      werkzeuge: [
        {
          text: "Das kostenlose Self Care Journal passt gut zu dieser Woche. Mit der Bestandsaufnahme darin siehst du, wo du gerade gut für dich sorgst und wo noch nicht.",
          label: "Zum Self Care Journal",
          href: "https://seelenwende.mytentary.com/p/niaKY4",
        },
      ],
      hinweis: "Wenn du noch mit ihm zusammenlebst oder Angst vor ihm hast, gehört zur Sicherheit auch die äußere Sicherheit. Beratungsstellen helfen dir kostenlos und vertraulich, einen Sicherheitsplan zu machen. Die Nummern stehen unten auf dieser Seite.",
    },
    {
      nr: 2,
      titel: "Verstehen, was war",
      untertitel: "Meine Erinnerung gehört mir.",
      satz: "Ich darf meiner Wahrnehmung wieder trauen.",
      einleitung: [
        "Diese Woche schaust du auf das, was passiert ist. Nicht, um ihn zu analysieren oder eine Diagnose zu stellen. Sondern um dir deine eigene Geschichte zurückzuholen, in deinen Worten.",
        "Viele Frauen erzählen, dass sie in der Beziehung irgendwann nicht mehr ihn geprüft haben, sondern sich selbst. Diese Woche drehst du das vorsichtig um.",
      ],
      impulse: [
        {
          titel: "Der Kreislauf, der dich festhält",
          absaetze: [
            "Viele dieser Beziehungen folgen einem Muster: Am Anfang viel Nähe und Aufmerksamkeit. Dann Abwertung, Kälte oder Rückzug. Dann wieder Wärme, eine Entschuldigung, ein guter Tag. Und von vorn.",
            "Gerade dieser Wechsel bindet so stark. Wenn Gutes unberechenbar kommt, hält das Gehirn umso fester daran fest. Fachleute nennen das Trauma-Bindung. Sie erklärt, warum Gehen so schwer ist, obwohl du längst weißt, dass es dir schadet. Mit fehlender Willenskraft hat das nichts zu tun.",
          ],
        },
        {
          titel: "Muster beim Namen nennen",
          absaetze: [
            "Gaslighting: Dir wird gesagt, dass etwas nicht passiert ist, das passiert ist, bis du deinem Gedächtnis nicht mehr traust. Schuldumkehr: Du sprichst etwas an und am Ende entschuldigst du dich. Schweigen als Strafe: Tagelang Kälte, bis du nachgibst. Isolation: Freundinnen und Familie werden schlechtgemacht, bis du kaum noch jemanden hast.",
            "Ein Wort für ein Muster ist kein Urteil über einen Menschen. Es ist ein Werkzeug, mit dem du ein Gefühl überprüfbar machst. Du musst nicht wissen, was mit ihm los ist. Es reicht zu sehen, was es mit dir gemacht hat.",
          ],
        },
        {
          titel: "Warum du an dir zweifelst",
          absaetze: [
            "„Vielleicht übertreibe ich.“ „Vielleicht war es doch nicht so schlimm.“ Diese Zweifel sind kein Beweis dafür, dass du dich irrst. Sie sind eine Folge dessen, was du erlebt hast.",
            "Wer lange gehört hat, dass er zu empfindlich ist, prüft irgendwann jedes Gefühl dreimal. Diese Woche schreibst du auf, was war, damit du es nicht jedes Mal neu verteidigen musst.",
          ],
        },
      ],
      uebungen: [
        {
          id: "w2-zeitlinie",
          titel: "Meine Zeitlinie",
          anleitung: "Stichpunkte reichen. Du musst nicht alles auf einmal aufschreiben.",
          fragen: [
            "Wie hat es angefangen? Was hat mich angezogen?",
            "Wann hatte ich zum ersten Mal das Gefühl, dass etwas nicht stimmt?",
            "Was hat sich über die Zeit verändert, bei ihm und bei mir?",
          ],
        },
        {
          id: "w2-tatsache",
          titel: "Tatsache und Deutung",
          anleitung: "Nimm eine Situation, die dich nicht loslässt. Trenne, was passiert ist, von dem, was du dir damals erklärt hast.",
          fragen: [
            "Was wurde gesagt oder getan? Nur das, was eine Kamera aufgenommen hätte:",
            "Wie habe ich es mir damals erklärt?",
            "Wie würde ich es heute einer guten Freundin beschreiben?",
          ],
        },
        {
          id: "w2-verloren",
          titel: "Was ich verloren habe und was geblieben ist",
          anleitung: "Beides ist wahr. Die Beziehung hat dir etwas genommen, und etwas in dir hat überstanden.",
          fragen: [
            "Was habe ich in dieser Beziehung von mir verloren?",
            "Was ist geblieben, trotz allem?",
          ],
        },
      ],
      tage: [
        "Schreib einen Satz auf, den er oft gesagt hat. Daneben: Stimmt das?",
        "Erinnere dich an einen Moment, in dem dein Bauchgefühl recht hatte.",
        "Mach heute deine Atemübung aus Woche 1, bevor du die Übungen schreibst.",
        "Such ein Foto von dir aus der Zeit vor der Beziehung. Was siehst du?",
        "Notier ein Gefühl von heute, ohne es zu begründen.",
        "Erzähl einem Menschen, dem du vertraust, einen kleinen Teil deiner Geschichte. Oder Mira.",
        "Lies deine Zeitlinie. Was weißt du jetzt, was du damals nicht wusstest?",
      ],
      mira: [
        "Ich bin in Woche 2 des Programms. Ich beschreibe dir eine Situation und frage mich, ob das normal war.",
        "Ich zweifle ständig an meiner Erinnerung. Kannst du mir helfen, das zu sortieren?",
      ],
      werkzeuge: [
        {
          text: "Du bist noch in der Beziehung oder gerade dabei zu gehen? Der kostenlose Mini-Guide „Der Weg nach draußen“ hilft dir, dir selbst zuzuhören, bevor du entscheidest.",
          label: "Zum Mini-Guide",
          href: "https://seelenwende.mytentary.com/p/WPedba",
        },
      ],
    },
    {
      nr: 3,
      titel: "Abstand und Grenzen",
      untertitel: "Ich muss mich nicht erklären.",
      satz: "Nein ist ein ganzer Satz.",
      einleitung: [
        "Abstand ist das, was Heilung möglich macht. Für manche heißt das: gar kein Kontakt mehr. Für andere, besonders mit gemeinsamen Kindern, heißt es: so wenig und so sachlich wie möglich.",
        "Diese Woche legst du fest, wie viel Kontakt du zulässt, findest deine Sätze und machst einen Plan für die Momente, in denen du schwach wirst. Denn die kommen, und das ist normal.",
      ],
      impulse: [
        {
          titel: "So wenig wie möglich, so klar wie nötig",
          absaetze: [
            "Kein Kontakt bedeutet: keine Nachrichten, keine Anrufe, kein Nachschauen auf seinen Profilen. Nicht als Strafe, sondern als Schutz für dein Nervensystem. Jeder Kontakt reißt die Wunde wieder auf.",
            "Wenn Kontakt nicht vermeidbar ist, etwa wegen Kindern, hilft der graue Stein: Du antwortest so langweilig, kurz und sachlich wie möglich. Keine Gefühle, keine Rechtfertigungen, keine Fragen, die ein Gespräch eröffnen. Es geht nur um Termine, Übergaben, Organisatorisches.",
          ],
        },
        {
          titel: "Kurz, sachlich, freundlich, fest",
          absaetze: [
            "Wenn du antworten musst, prüf deine Nachricht an vier Punkten: Ist sie kurz? Enthält sie nur Informationen? Ist der Ton neutral freundlich? Ist sie fest, also ohne Einladung zur Diskussion?",
            "Beispiel: Er schreibt drei Absätze voller Vorwürfe und fragt nebenbei, wann er die Kinder holen kann. Deine Antwort: „Die Kinder sind am Samstag um 10 Uhr bereit. Viele Grüße.“ Mehr nicht.",
            "Was du weglässt: Rechtfertigungen, Erklärungen, Verteidigung, Diskussion. Je mehr du erklärst, desto mehr Angriffsfläche hat er.",
          ],
        },
        {
          titel: "Wenn er zurückkommt",
          absaetze: [
            "Fast immer kommt irgendwann eine Nachricht: eine Entschuldigung, ein Notfall, „Ich habe mich verändert“, ein Geburtstagsgruß, eine Frage nach einer Kleinigkeit. Das hat einen Namen: Hoovering, wie ein Staubsauger, der dich zurückziehen soll.",
            "Du musst nicht in dem Moment entscheiden, was du tust. Entscheide es jetzt, in Ruhe. Dann musst du dich später nur noch an deinen Plan halten.",
          ],
        },
      ],
      uebungen: [
        {
          id: "w3-regeln",
          titel: "Meine Kontakt-Regeln",
          anleitung: "Schreib es so konkret, dass du dich in einem schwachen Moment daran halten kannst.",
          fragen: [
            "Über welche Kanäle darf er mich noch erreichen und welche blockiere oder stumme ich?",
            "Worüber spreche ich mit ihm, falls Kontakt nötig ist, und worüber nicht?",
            "Wer in meinem Umfeld soll mir nichts mehr über ihn erzählen?",
          ],
        },
        {
          id: "w3-saetze",
          titel: "Meine drei Grenz-Sätze",
          anleitung: "Ein weicher, ein klarer und ein fester Satz. Ohne Begründung.",
          fragen: [
            "Weich, zum Beispiel: „Darüber möchte ich gerade nicht sprechen.“",
            "Klar, zum Beispiel: „Ich antworte nur noch auf Fragen zu den Kindern.“",
            "Fest, zum Beispiel: „Wenn du mich so ansprichst, beende ich das Gespräch.“",
          ],
        },
        {
          id: "w3-plan",
          titel: "Mein Plan für den Moment, in dem ich schreiben will",
          anleitung: "Der Drang ist wie eine Welle. Er wird stark und lässt meistens nach 15 bis 20 Minuten nach.",
          fragen: [
            "Was tue ich in den ersten fünf Minuten statt zu schreiben?",
            "Wen rufe ich an oder wem schreibe ich stattdessen?",
            "Drei Gründe, warum ich Abstand halte, in meinen Worten:",
          ],
        },
      ],
      tage: [
        "Stumm oder archivier heute einen Chat oder ein Profil, das dich triggert.",
        "Sag heute zu irgendjemandem ein kleines Nein, ohne es zu begründen.",
        "Schreib deine drei Gründe für den Abstand auf einen Zettel und leg ihn neben dein Bett.",
        "Wenn der Drang kommt: Schreib die Nachricht in deine Notizen statt an ihn.",
        "Übe einen deiner Grenz-Sätze laut vor dem Spiegel.",
        "Plane etwas Schönes für die Zeit, in der du sonst auf seine Nachrichten gewartet hast.",
        "Notier, wie oft du diese Woche nicht geschrieben hast. Jedes Mal zählt.",
      ],
      mira: [
        "Ich bin in Woche 3 des Programms. Hilf mir, auf diese Nachricht von ihm kurz und sachlich zu antworten:",
        "Ich will ihm gerade unbedingt schreiben. Hilf mir, es nicht zu tun.",
      ],
      hinweis: "Wenn er droht, dich verfolgt oder du Angst hast, wie er auf eine Grenze reagiert: Deine Sicherheit geht vor Konsequenz. Sprich mit einer Beratungsstelle, bevor du etwas veränderst. Die Zeit rund um eine Trennung ist oft die gefährlichste.",
    },
    {
      nr: 4,
      titel: "Trauern dürfen",
      untertitel: "Vermissen ist kein Rückfall.",
      satz: "Ich darf vermissen und trotzdem gehen.",
      einleitung: [
        "Vielleicht fragst du dich: Warum vermisse ich ihn, obwohl er mir das angetan hat? Diese Frage gehört zu den häufigsten, die Frauen stellen. Und sie hat eine gute Antwort.",
        "Diese Woche gibst du der Trauer Raum. Und der Wut, falls sie da ist. Beides muss nicht weggemacht werden. Beides will gefühlt werden, damit es weiterziehen kann.",
      ],
      impulse: [
        {
          titel: "Du trauerst um mehr als einen Menschen",
          absaetze: [
            "Du trauerst um den Menschen, den du am Anfang kennengelernt hast. Um die gemeinsame Zukunft, die du dir vorgestellt hast. Um die Jahre, die Kraft, die Hoffnung, dass es doch noch gut wird.",
            "Diese Trauer ist echt, auch wenn manches, worum du trauerst, nie wirklich da war. Gerade das macht sie so verwirrend. Und gerade deshalb braucht sie Platz.",
          ],
        },
        {
          titel: "Gefühle kommen in Wellen",
          absaetze: [
            "An einem Tag fühlst du dich stark und klar. Am nächsten vermisst du ihn so sehr, dass du an allem zweifelst. Das ist kein Rückschritt. So verläuft Trauer: nicht in einer geraden Linie, sondern in Wellen, die mit der Zeit flacher werden.",
            "Hilfreich ist ein Satz für die schweren Momente: „Ich vermisse ihn. Und ich weiß, warum ich gegangen bin.“ Beides darf gleichzeitig wahr sein.",
          ],
        },
        {
          titel: "Wut ist eine Grenze, die spät kommt",
          absaetze: [
            "Viele Frauen haben in der Beziehung verlernt, wütend zu sein, weil Wut gefährlich war oder gegen sie verwendet wurde. Wenn sie jetzt kommt, erschreckt sie manchmal.",
            "Wut ist ein Zeichen, dass ein Teil von dir weiß: Das war nicht in Ordnung. Sie darf sein. Du musst sie nicht an ihm auslassen. Du kannst sie aufschreiben, herauslaufen, in ein Kissen schreien. Sie gehört dir.",
          ],
        },
      ],
      uebungen: [
        {
          id: "w4-brief",
          titel: "Der Brief, den du nicht abschickst",
          anleitung: "An ihn, an die Beziehung oder an die Hoffnung, die du hattest. Schreib alles, was nie Platz hatte. Dieser Brief wird nicht abgeschickt.",
          fragen: ["Mein Brief:"],
        },
        {
          id: "w4-vermissen",
          titel: "Was ich vermisse und was es wirklich war",
          anleitung: "Oft vermissen wir nicht den Menschen, sondern ein Gefühl, das wir mit ihm verbunden haben.",
          fragen: [
            "Was genau vermisse ich?",
            "Ist es er, oder ist es ein Gefühl: Nähe, nicht allein sein, der Anfang, die Hoffnung?",
            "Wo könnte ich dieses Gefühl heute ein kleines Stück anders finden?",
          ],
        },
        {
          id: "w4-wut",
          titel: "Meine Wut darf sprechen",
          anleitung: "Lass sie einmal ungefiltert reden. Niemand liest mit.",
          fragen: [
            "Worüber bin ich wütend?",
            "Wenn meine Wut mich beschützen wollte, wovor?",
          ],
        },
      ],
      tage: [
        "Erlaube dir heute zehn Minuten, in denen du traurig sein darfst. Mit Wecker.",
        "Hör ein Lied, das dich traurig macht, und bleib dabei, statt wegzuschalten.",
        "Beweg deinen Körper, bis du ihn spürst: schnelles Gehen, Tanzen, Treppen.",
        "Schreib den Satz auf: „Ich vermisse ihn. Und ich weiß, warum ich gegangen bin.“",
        "Mach heute etwas, das er nicht mochte und du schon.",
        "Lass dich von jemandem in den Arm nehmen. Oder leg die Hand auf dein Herz.",
        "Lies deinen Brief noch einmal. Dann entscheide: aufbewahren, zerreißen oder verbrennen.",
      ],
      mira: [
        "Ich bin in Woche 4 des Programms. Warum vermisse ich ihn, obwohl er mir das angetan hat?",
        "Ich bin so wütend und weiß nicht, wohin damit.",
      ],
      hinweis: "Schick den Brief nicht ab. Wenn er ihn finden könnte, schreib ihn auf Papier statt hier und vernichte ihn danach.",
    },
    {
      nr: 5,
      titel: "Alte Sätze, neue Sätze",
      untertitel: "Ich bin nicht, was er über mich gesagt hat.",
      satz: "Ich lerne, mir wieder zu glauben.",
      einleitung: [
        "In uns allen gibt es Sätze, die leise mitlaufen: „Ich bin nicht genug.“ „Ich bin schuld.“ „Ich bin zu viel.“ Die meisten sind älter als die Beziehung. Die Beziehung hat sie oft verstärkt.",
        "Diese Woche hörst du hin, welche Sätze bei dir am lautesten sind, woher sie kommen und welcher neue Satz an ihre Stelle treten darf.",
      ],
      impulse: [
        {
          titel: "Woher die alten Sätze kommen",
          absaetze: [
            "Glaubenssätze entstehen meist früh, als Schutz. „Wenn ich mich anpasse, bin ich sicher.“ „Wenn ich nichts brauche, werde ich nicht enttäuscht.“ Damals haben sie geholfen.",
            "In einer Beziehung, die dich klein gemacht hat, wurden genau diese Sätze bestätigt und ausgenutzt. Darum fühlen sie sich jetzt so wahr an. Wahr sind sie deshalb nicht.",
          ],
        },
        {
          titel: "Wessen Stimme ist das?",
          absaetze: [
            "Viele Frauen merken nach einer Trennung, dass ihre innere Kritikerin mit seiner Stimme spricht. Sie benutzt seine Worte und seinen Ton.",
            "Wenn der Satz das nächste Mal kommt, frag dich: Wessen Stimme ist das? Schon diese Frage schafft einen kleinen Abstand. Du bist nicht der Satz. Du hörst ihn nur.",
          ],
        },
        {
          titel: "Neue Sätze müssen glaubwürdig sein",
          absaetze: [
            "„Ich bin wunderbar und liebe mich bedingungslos“ prallt an einem schlechten Tag ab. Ein neuer Satz muss so gewählt sein, dass ein Teil von dir ihn heute schon glauben kann.",
            "Statt „Ich bin genug“ vielleicht: „Ich darf lernen, mich als genug zu sehen.“ Statt „Ich habe keine Schuld“ vielleicht: „Ich habe getan, was ich damals konnte.“ Klein und wahr wirkt stärker als groß und hohl.",
          ],
        },
      ],
      uebungen: [
        {
          id: "w5-laut",
          titel: "Mein lautester Satz",
          anleitung: "Wenn du den Glaubenssätze-Test gemacht hast, nimm deinen Hauptsatz.",
          werkzeug: {
            text: "Du weißt noch nicht, welcher Satz bei dir am lautesten ist? Der Glaubenssätze-Test zeigt es dir in fünf Minuten.",
            label: "Zum Glaubenssätze-Test",
            href: "glaubenssaetze.html",
          },
          fragen: [
            "Welcher Satz über mich ist gerade am lautesten?",
            "Wann habe ich ihn zum ersten Mal gefühlt? Wer hat ihn mir beigebracht?",
            "Wovor hat er mich früher geschützt?",
          ],
        },
        {
          id: "w5-beweise",
          titel: "Gegenbeweise",
          anleitung: "Such Momente aus deinem Leben, in denen der alte Satz nicht gestimmt hat. Auch kleine zählen.",
          fragen: ["Erster Moment:", "Zweiter Moment:", "Dritter Moment:"],
        },
        {
          id: "w5-neu",
          titel: "Mein neuer Satz",
          anleitung: "Formuliere ihn so, dass du ihn auch an einem schlechten Tag sagen kannst, ohne innerlich zu widersprechen.",
          fragen: [
            "Mein neuer Satz:",
            "Was würde ich meiner besten Freundin sagen, wenn sie den alten Satz über sich sagt?",
          ],
        },
      ],
      tage: [
        "Wenn der alte Satz heute kommt, frag: Wessen Stimme ist das?",
        "Schreib deinen neuen Satz auf und leg ihn dorthin, wo du ihn jeden Morgen siehst.",
        "Sag deinen neuen Satz laut, auch wenn du ihn noch nicht ganz glaubst.",
        "Notier abends einen Moment, in dem du heute gut zu dir warst.",
        "Bitte eine Freundin, dir drei Dinge zu sagen, die sie an dir schätzt. Schreib sie auf.",
        "Sprich heute so mit dir, wie du mit einem Kind sprechen würdest, das traurig ist.",
        "Lies deine Gegenbeweise. Füge einen neuen hinzu.",
      ],
      mira: [
        "Ich bin in Woche 5 des Programms. Mein lautester Satz ist: … Kannst du mich Schritt für Schritt begleiten, einen neuen Satz zu finden?",
        "Meine innere Kritikerin klingt wie er. Wie gehe ich damit um?",
      ],
    },
    {
      nr: 6,
      titel: "Wieder bei dir",
      untertitel: "Ich gehöre wieder mir.",
      satz: "Ich gehe meinen Weg in meinem Tempo.",
      einleitung: [
        "Die letzte Woche schaut nach vorn. Wer bist du ohne das? Was ist dir wichtig? Woran willst du in Zukunft merken, dass dir jemand guttut?",
        "Und sie schaut zurück: auf das, was du dir in Woche 1 gewünscht hast, und auf den Weg, den du seitdem gegangen bist.",
      ],
      impulse: [
        {
          titel: "Wer bist du ohne das?",
          absaetze: [
            "Nach einer Beziehung, in der sich alles um ihn gedreht hat, ist diese Frage oft beängstigend leer. Ein guter Anfang ist eine andere Frage: Was ist mir wichtig?",
            "Deine Werte sind wie ein Kompass. Sie sagen dir nicht, wo du ankommst, aber in welche Richtung du gehst. Und sie helfen dir, schneller zu merken, wenn dich etwas oder jemand davon wegzieht.",
          ],
        },
        {
          titel: "Woran du gesunde Nähe erkennst",
          absaetze: [
            "Gesunde Nähe wächst langsam. Sie ist beständig statt berauschend. Ein Nein wird respektiert, ohne dass du dich dafür rechtfertigen musst. Du darfst Freundinnen und eigene Zeit haben. Nach einem Treffen fühlst du dich ruhiger, nicht aufgewühlt.",
            "Vorsicht ist angebracht, wenn es zu schnell geht, zu viel ist oder zu perfekt wirkt: große Gefühle nach wenigen Tagen, viel Druck, Geschenke, die dich verpflichten, kleine Tests deiner Grenzen. Du musst dein Bauchgefühl nicht mehr wegerklären.",
          ],
        },
        {
          titel: "Rückfälle gehören dazu",
          absaetze: [
            "Heilung geht nicht geradeaus. Es wird Tage geben, an denen alles wieder da ist: ein Lied, ein Geruch, eine Nachricht. Das heißt nicht, dass die sechs Wochen umsonst waren.",
            "Es heißt nur, dass du einen Plan für diese Tage brauchst. Den schreibst du diese Woche.",
          ],
        },
      ],
      uebungen: [
        {
          id: "w6-werte",
          titel: "Meine Werte",
          anleitung: "Wenn du den Werte-Finder gemacht hast, nimm deine fünf Kernwerte.",
          werkzeug: {
            text: "Noch keine Werte gefunden? Der Werte-Finder führt dich in etwa zehn Minuten zu deinen fünf Kernwerten.",
            label: "Zum Werte-Finder",
            href: "werte-finder.html",
          },
          fragen: [
            "Meine fünf wichtigsten Werte:",
            "Wo lebe ich sie heute schon?",
            "Welchem Wert gebe ich im nächsten Monat mehr Raum, und wie?",
          ],
        },
        {
          id: "w6-fahnen",
          titel: "Meine grünen Fahnen",
          anleitung: "Schreib auf, woran du gute Menschen in deinem Leben erkennen willst, in Freundschaft und Liebe.",
          fragen: [
            "Woran merke ich, dass mir jemand guttut?",
            "Was ist für mich nicht verhandelbar?",
          ],
        },
        {
          id: "w6-plan",
          titel: "Mein Plan für schwere Tage",
          anleitung: "Schreib ihn für die Version von dir, die ihn an einem schlechten Tag liest.",
          fragen: [
            "Woran merke ich, dass es kippt?",
            "Was hilft mir dann? Drei Dinge aus diesen sechs Wochen:",
            "Wen rufe ich an?",
          ],
        },
        {
          id: "w6-brief",
          titel: "Ein Brief an mich in sechs Monaten",
          anleitung: "Was möchtest du dir sagen? Was hoffst du für sie?",
          fragen: ["Mein Brief:"],
        },
      ],
      tage: [
        "Mach etwas, das zu einem deiner Werte passt, auch wenn es nur zehn Minuten sind.",
        "Schreib drei Dinge auf, die du in den letzten sechs Wochen geschafft hast.",
        "Plane etwas für nächsten Monat, auf das du dich freust.",
        "Lies deinen Wunsch aus Woche 1. Was hat sich verändert?",
        "Bedank dich bei einem Menschen, der dich in dieser Zeit getragen hat.",
        "Speicher oder drucke deinen Plan für schwere Tage.",
        "Sag dir laut: „Ich gehöre wieder mir.“ Dann mach etwas Schönes.",
      ],
      mira: [
        "Ich bin in Woche 6 des Programms. Ich weiß nicht mehr, wer ich ohne ihn bin. Kannst du mir helfen, meine Werte in eigenen Worten zu finden?",
        "Ich habe Angst, dass mir so etwas wieder passiert. Woran erkenne ich es früh?",
      ],
    },
  ],
  abschluss: [
    "Du bist sechs Wochen lang für dich da gewesen. Das ist viel, auch wenn sich nicht alles gelöst hat.",
    "Die Übungen bleiben hier. Du kannst jederzeit zurückkommen, eine Woche wiederholen oder deinen Plan für schwere Tage lesen. Und Mira ist weiter für dich da, solange dein Kontingent reicht.",
  ],
};
