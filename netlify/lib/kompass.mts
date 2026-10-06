import { isCodeInList } from "./codes.mts";

/* Neuer-Satz-Kompass: 30 Tage, ein Impuls pro Tag.
   Die Impulse liegen nur hier auf dem Server und werden erst nach dem Zugangscode ausgeliefert –
   fertig eingesetzt mit dem alten und neuen Satz und den drei Werten der Käuferin. */

export function isValidKompassCode(given: unknown): given is string {
  return isCodeInList("KOMPASS_CODES", given);
}

export function isKompassConfigured(): boolean {
  return Boolean(Netlify.env.get("KOMPASS_CODES"));
}

interface Glaubenssatz {
  id: string;
  satz: string;
  neu: string;
  wo: string;
  herkunft: string;
  stimme: string;
  beweis: string;
  ueb: string[];
}

interface Wert {
  name: string;
  meaning: string;
}

/** Kontext für die Impulse; alle Texte sind bereits für HTML maskiert. */
interface Ctx {
  alt: string;
  neu: string;
  b: Pick<Glaubenssatz, "wo" | "herkunft" | "stimme" | "beweis" | "ueb">;
  w: Wert[];
}

/** Ein Tag: Titel, Impuls (HTML), Aufgabe, Frage, optional der Schieberegler „Wie sehr glaubst du den Satz?“ */
export interface Tag {
  t: string;
  i: string;
  a: string;
  f: string;
  slider?: boolean;
}

export interface KompassEingabe {
  beliefId: string;
  alt: string;
  neu: string;
  values: Wert[];
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]!);

/* ---------- Glaubenssätze (wie im Glaubenssätze-Test) ---------- */
const BELIEFS: Glaubenssatz[] = [
  {id:"genug", satz:"Ich bin nicht genug.", neu:"Ich bin genug – auch an Tagen, an denen ich wenig schaffe.",
    wo:"Oft meldet er sich, wenn du ein Lob abwinkst – oder wenn du dich mit anderen vergleichst.",
    herkunft:"Oft aus Zeiten, in denen Anerkennung an Leistung geknüpft war oder du dich neben anderen übersehen gefühlt hast.",
    stimme:"Wessen Stimme höre ich, wenn ich mir sage, dass ich nicht genug bin?",
    beweis:"Wann hast du etwas getan, das völlig ausgereicht hat – auch wenn du es kleingeredet hast?",
    ueb:["Nimm heute ein Kompliment an, ohne es kleinzureden. Nur: „Danke.“",
         "Schreib am Abend drei Dinge auf, die du heute getan hast – auch die kleinen. Ohne ein „nur“ davor.",
         "Hör heute einmal bewusst bei „gut genug“ auf, statt weiter zu feilen."]},
  {id:"liebe", satz:"Liebe muss ich mir verdienen.", neu:"Ich bin liebenswert, einfach weil ich bin – nicht für das, was ich gebe.",
    wo:"Oft meldet er sich, wenn du mehr gibst, als du hast – oder Angst bekommst, dass sich jemand zurückzieht.",
    herkunft:"Häufig dort, wo Zuneigung unberechenbar war oder nur floss, wenn du „brav“, hilfreich oder unkompliziert warst.",
    stimme:"Wer hat mir beigebracht, dass ich mir Liebe erst verdienen muss?",
    beweis:"Wer mag dich, ohne dass du dafür etwas leisten musst? Woran merkst du das?",
    ueb:["Lass heute ein Hilfsangebot weg, das du nur aus Angst machen würdest – und beobachte, was passiert.",
         "Frag dich heute vor jedem Ja: Gebe ich das gern – oder damit man mich mag?",
         "Bitte jemanden, dem du vertraust, um eine Kleinigkeit – ohne dich vorher zu revanchieren."]},
  {id:"beduerfnisse", satz:"Meine Bedürfnisse sind nicht so wichtig.", neu:"Meine Bedürfnisse zählen. Ein Nein zu anderen kann ein Ja zu mir sein.",
    wo:"Oft meldet er sich, wenn du Ja sagst, obwohl du müde bist – oder wenn du erst an alle anderen denkst.",
    herkunft:"Oft aus einem Umfeld, in dem für deine Wünsche kein Platz war oder du früh für andere sorgen musstest.",
    stimme:"Wer hat mir gezeigt, dass meine Wünsche warten müssen?",
    beweis:"Wann hast du auf dich gehört – und es ist nichts Schlimmes passiert?",
    ueb:["Sag heute ein kleines Nein – ohne lange Erklärung. Ein Satz reicht.",
         "Frag dich heute dreimal: Was brauche ich gerade? Und gib dir eine Sache davon.",
         "Plane 20 Minuten nur für dich ein und schütze sie wie einen wichtigen Termin."]},
  {id:"perfekt", satz:"Ich darf keine Fehler machen.", neu:"Fehler gehören zum Wachsen. Ich darf lernen, statt perfekt zu sein.",
    wo:"Oft meldet er sich, bevor du etwas Neues anfängst – oder nachts, wenn du einen Fehler im Kopf wiederholst.",
    herkunft:"Oft aus Erfahrungen, in denen Fehler bestraft, belächelt oder mit Liebesentzug beantwortet wurden.",
    stimme:"Wer hat früher auf meine Fehler reagiert – und wie?",
    beweis:"Welcher Fehler hat dir etwas beigebracht oder war am Ende gar nicht so schlimm?",
    ueb:["Mach heute bewusst etwas „nur halb gut“ – eine Nachricht ohne zweites Durchlesen, ein Essen ohne Rezept.",
         "Wenn dir heute ein Fehler passiert, sag zu dir, was du einer Freundin sagen würdest.",
         "Fang etwas an, das du aufgeschoben hast – zehn Minuten, ohne dass es fertig werden muss."]},
  {id:"schuld", satz:"Ich bin dafür verantwortlich, dass es allen gut geht.", neu:"Ich bin für meine Gefühle verantwortlich – nicht für die aller anderen.",
    wo:"Oft meldet er sich, wenn jemand schlecht gelaunt ist – und du sofort nach deinem Fehler suchst.",
    herkunft:"Oft aus der frühen Rolle, für Frieden sorgen zu müssen, oder aus Beziehungen, in denen dir die Schuld für die Launen anderer gegeben wurde.",
    stimme:"Wer hat mir die Verantwortung für seine Gefühle gegeben?",
    beweis:"Wann ging es jemandem schlecht, ohne dass es etwas mit dir zu tun hatte?",
    ueb:["Zähl heute, wie oft du „Entschuldigung“ sagst. Ersetze eine davon durch „Danke“ – zum Beispiel „Danke fürs Warten“.",
         "Wenn heute jemand verstimmt ist, sag dir innerlich: „Das ist nicht mein Gefühl. Ich darf es dort lassen, wo es hingehört.“",
         "Tu heute etwas zuerst für dich – bevor du schaust, ob alle anderen versorgt sind."]},
  {id:"vertrauen", satz:"Ich kann mich auf niemanden verlassen.", neu:"Ich darf vorsichtig sein – und trotzdem Menschen finden, die sicher für mich sind.",
    wo:"Oft meldet er sich, wenn dir jemand näherkommt – oder wenn du Hilfe bräuchtest und sie lieber nicht annimmst.",
    herkunft:"Häufig aus Erfahrungen von Vertrauensbruch, Unzuverlässigkeit oder emotionaler Verletzung.",
    stimme:"Wer hat mein Vertrauen gebrochen – und was habe ich daraus über alle Menschen geschlossen?",
    beweis:"Wer war in letzter Zeit verlässlich für dich, auch in einer Kleinigkeit?",
    ueb:["Teile heute einem sicheren Menschen eine kleine, echte Sache von dir mit.",
         "Nimm heute eine angebotene Hilfe an, auch wenn du es allein könntest.",
         "Achte heute darauf, wer hält, was er oder sie sagt – und schreib es auf."]},
  {id:"kraft", satz:"Ich schaffe das nicht allein.", neu:"Ich habe schon so viel getragen. Ich kann mir selbst vertrauen – Schritt für Schritt.",
    wo:"Oft meldet er sich vor Entscheidungen – wenn du erst andere fragen willst, bevor du dir selbst glaubst.",
    herkunft:"Oft dort, wo dir wenig zugetraut wurde oder deine Wahrnehmung immer wieder infrage gestellt wurde.",
    stimme:"Wer hat mir eingeredet, dass ich es allein nicht kann?",
    beweis:"Was hast du in den letzten Monaten geschafft, von dem du früher dachtest, du kannst es nicht?",
    ueb:["Triff heute eine kleine Entscheidung, ohne jemanden zu fragen – und bleib dabei.",
         "Schreib eine Liste: zehn Dinge, die ich geschafft habe, obwohl es schwer war.",
         "Wenn du heute zweifelst, frag zuerst dich: Was sagt mein Bauch? Schreib es auf, bevor du andere fragst."]},
  {id:"erlaubnis", satz:"Ich darf nicht einfach glücklich sein.", neu:"Ich darf Freude empfangen, ohne sie mir vorher verdient zu haben.",
    wo:"Oft meldet er sich, wenn es gerade schön ist – als müsstest du gleich für das Glück bezahlen.",
    herkunft:"Oft aus einem Umfeld, in dem Leichtigkeit keinen Platz hatte oder Freude schnell wieder zerstört wurde.",
    stimme:"Wer hat mir das Gefühl gegeben, dass Glück gefährlich ist?",
    beweis:"Welcher schöne Moment war einfach da, ohne dass du ihn verdienen musstest?",
    ueb:["Gönn dir heute etwas Kleines, ohne es dir vorher zu verdienen.",
         "Wenn heute etwas Schönes passiert, bleib zehn Atemzüge länger darin, statt gleich weiterzumachen.",
         "Plane etwas nur zum Spaß – ohne Nutzen, ohne Zweck."]},
];
const OWN: Glaubenssatz = {id:"eigen", satz:"", neu:"",
  wo:"Achte darauf, in welchen Situationen und bei welchen Menschen er besonders laut wird.",
  herkunft:"Viele alte Sätze entstehen früh – in der Familie, in der Schule oder in Beziehungen, in denen du dich anpassen musstest, um sicher zu sein.",
  stimme:"Wessen Stimme höre ich, wenn dieser Satz in mir spricht?",
  beweis:"Wann war dein neuer Satz schon einmal wahr – auch nur für einen Moment?",
  ueb:["Tu heute eine kleine Sache so, als wäre dein neuer Satz schon ganz wahr.",
       "Schreib am Abend drei Momente auf, in denen du heute freundlich mit dir warst.",
       "Sag deinen neuen Satz heute einmal laut zu einem Menschen, der dir guttut – oder zu deinem Spiegelbild."]};
const beliefById = (id: string) => BELIEFS.find(b => b.id === id) || OWN;

/* ---------- 30 Impulse ---------- */
const q = (t: string) => `<q>${t}</q>`;
const wMean = (w: Wert) => w.meaning ? ` Für dich heißt ${w.name}: ${q(w.meaning)}.` : "";
const DAYS: ((c: Ctx) => Tag)[] = [
  /* Woche 1 · Bemerken */
  c => ({t:"Der alte Satz bekommt einen Platz",
    i:`<p>Heute beginnt nichts Großes. Du schaust nur hin. Dein alter Satz lautet: ${q(c.alt)}</p><p>Er ist vielleicht schon sehr lange bei dir. So lange, dass er sich wie die Wahrheit anfühlt. In den nächsten 30 Tagen lernst du, ihn als das zu sehen, was er ist: ein Satz. Nicht mehr.</p>`,
    a:"Schreib den alten Satz auf einen Zettel. Notiere daneben, wo du ihn im Körper spürst, wenn du ihn liest – im Bauch, in der Brust, im Hals?",
    f:"Wann habe ich diesen Satz zum ersten Mal gefühlt?"}),
  c => ({t:"Wann meldet er sich?",
    i:`<p>Ein alter Satz ist selten den ganzen Tag laut. Er hat seine Momente. ${c.b.wo}</p>`,
    a:"Achte heute nur darauf, wann der Satz auftaucht. Ein Strich auf einem Zettel oder im Handy pro Mal reicht. Du musst nichts ändern.",
    f:"In welcher Situation war er heute am lautesten?"}),
  c => ({t:"Er hat dich einmal geschützt",
    i:`<p>${c.b.herkunft}</p><p>Damals war der Satz vielleicht eine kluge Lösung. Er hat dir geholfen, durchzukommen. Dass er heute nicht mehr passt, heißt nicht, dass mit dir etwas falsch ist.</p>`,
    a:"Leg eine Hand auf dein Herz und sag innerlich: „Danke, dass du mich damals geschützt hast. Heute darf ich etwas anderes lernen.“",
    f:"Wovor hat mich dieser Satz damals geschützt?"}),
  c => ({t:"Wessen Stimme ist das?",
    i:`<p>Viele alte Sätze klingen in uns mit einer fremden Stimme – mit dem Tonfall eines Elternteils, einer Lehrerin, eines Ex-Partners. Wenn du genau hinhörst, merkst du vielleicht: Das bin gar nicht ich.</p>`,
    a:"Lies deinen alten Satz langsam und frag dich: Wie klingt die Stimme, die ihn sagt? Laut, kühl, besorgt, verächtlich?",
    f:c.b.stimme}),
  c => ({t:"Was er dich gekostet hat",
    i:`<p>Ein alter Satz entscheidet oft leise mit. Er sagt dir, was du aushalten sollst, was du nicht sagen darfst und wo du bleiben musst.</p><p>Heute darfst du ehrlich hinsehen, ohne dich dafür zu verurteilen.</p>`,
    a:"Schreib drei Dinge auf, die du wegen dieses Satzes nicht getan, nicht gesagt oder zu lange ausgehalten hast.",
    f:"Welches dieser drei Dinge tut am meisten weh – und was hätte ich damals gebraucht?"}),
  c => ({t:"Ein Gedanke, kein Fakt",
    i:`<p>Es gibt einen kleinen Trick mit großer Wirkung: Statt ${q(c.alt)} sagst du heute <q>Ich habe den Gedanken, dass …</q></p><p>Damit wird aus der Wahrheit ein Gedanke. Und Gedanken dürfen kommen und gehen.</p>`,
    a:`Immer wenn der alte Satz kommt, setz innerlich „Ich habe den Gedanken, dass …“ davor. Vielleicht sogar „Ich merke, dass ich den Gedanken habe, dass …“.`,
    f:"Wie fühlt sich der kleine Abstand zwischen mir und dem Satz an?"}),
  c => ({t:"Rückblick auf Woche 1",
    i:`<p>Eine Woche lang hast du deinen alten Satz beobachtet. Das ist mehr, als die meisten Menschen je tun. Bemerken ist der erste Schritt zur Veränderung – auch wenn sich noch nichts anders anfühlt.</p>`,
    a:"Lies deine Notizen der letzten Tage durch. Unterstreiche einen Satz, der dich überrascht hat.",
    f:"Was weiß ich jetzt über meinen alten Satz, was ich vor einer Woche noch nicht wusste?"}),

  /* Woche 2 · Der neue Satz */
  c => ({t:"Dein neuer Satz",
    i:`<p>Ab heute bekommt der alte Satz Gesellschaft. Dein neuer Satz lautet:</p><p class="quote" style="font-size:19px;text-align:center">„${c.neu}“</p><p>Er muss sich noch nicht wahr anfühlen. Es reicht, wenn ein kleiner Teil von dir denkt: Vielleicht.</p>`,
    a:"Lies den neuen Satz dreimal laut. Langsam. Achte darauf, was in dir passiert – Widerstand, Tränen, ein Lächeln, gar nichts. Alles ist richtig.",
    f:"Welcher Teil des Satzes fällt mir am schwersten?", slider:true}),
  c => ({t:"Eine Brücke bauen",
    i:`<p>Manchmal ist der neue Satz noch zu groß. Dann hilft eine Brücke – ein Satz, der zwischen alt und neu liegt.</p><p>Zum Beispiel: <q>Ich lerne gerade, dass …</q> oder <q>Ich bin bereit zu glauben, dass …</q> oder <q>Es ist möglich, dass …</q></p>`,
    a:`Schreib deinen eigenen Brückensatz auf. Er soll sich mindestens ein bisschen wahr anfühlen. Zum Beispiel: „Ich bin bereit zu glauben: ${c.neu}“`,
    f:"Wie klingt mein Brückensatz – und wie fühlt er sich an?"}),
  c => ({t:"Beweis Nummer eins",
    i:`<p>Dein alter Satz hat jahrelang Beweise gesammelt. Er hat sich jede Situation gemerkt, die ihn bestätigt hat – und alles andere übersehen.</p><p>Ab heute sammelst du Beweise für den neuen Satz.</p>`,
    a:c.b.beweis + " Schreib eine Situation so genau wie möglich auf.",
    f:"Was sagt dieser Moment über mich?"}),
  c => ({t:"Den Satz im Körper spüren",
    i:`<p>Ein Satz, den du nur denkst, bleibt im Kopf. Ein Satz, den du spürst, kommt an.</p>`,
    a:`Setz dich bequem hin. Leg eine Hand auf dein Herz, die andere auf den Bauch. Atme dreimal langsam aus. Sag dann leise: „${c.neu}“ – und atme noch einmal aus.`,
    f:"Wo im Körper spüre ich den neuen Satz – und wie fühlt er sich dort an?"}),
  c => ({t:"Sichtbar machen",
    i:`<p>Der alte Satz war jeden Tag da, ohne dass du ihn eingeladen hast. Der neue Satz braucht auch einen festen Platz in deinem Alltag.</p>`,
    a:"Schreib den neuen Satz auf einen Zettel und kleb ihn an einen Ort, an dem du ihn täglich siehst: Spiegel, Kühlschrank, Portemonnaie oder als Sperrbildschirm.",
    f:"Wo hängt mein Satz – und wie war es, ihn heute ein paarmal zu sehen?"}),
  c => ({t:"Dem alten Satz antworten",
    i:`<p>Der alte Satz wird sich weiter melden. Das ist normal. Neu ist: Du musst ihm nicht mehr gehorchen. Du kannst ihm antworten.</p>`,
    a:`Wenn heute ${q(c.alt)} kommt, antworte innerlich: „Danke, ich hab dich gehört. Heute gilt: ${c.neu}“`,
    f:"Wie hat es sich angefühlt, dem alten Satz zu antworten?"}),
  c => ({t:"Rückblick auf Woche 2",
    i:`<p>Du hast deinen neuen Satz gesprochen, gespürt, sichtbar gemacht und ihn dem alten entgegengestellt. Vielleicht fühlt er sich noch fremd an. Das darf so sein. Neue Wege im Kopf entstehen durch Wiederholung, nicht durch Überzeugung.</p>`,
    a:"Sammle drei Beweise für deinen neuen Satz aus dieser Woche. Kleine zählen genauso wie große.",
    f:"Welche drei Beweise habe ich diese Woche gefunden?"}),

  /* Woche 3 · Werte leben */
  c => ({t:"Dein innerer Kompass",
    i:`<p>Deine Werte sind ${c.w[0].name}, ${c.w[1].name} und ${c.w[2].name}. Sie zeigen dir, was sich stimmig anfühlt.</p><p>Dein neuer Satz und deine Werte gehören zusammen: Der Satz sagt, wer du sein darfst. Deine Werte zeigen, wie das im Alltag aussieht.</p>`,
    a:`Schreib deine drei Werte unter deinen neuen Satz. Lies alles zusammen einmal laut.`,
    f:`Was hat ${c.w[0].name} mit meinem neuen Satz zu tun?`}),
  c => ({t:`${c.w[0].name} im Kleinen`,
    i:`<p>Werte werden nicht in großen Entscheidungen gelebt, sondern in kleinen Momenten.${wMean(c.w[0])}</p>`,
    a:`Tu heute eine Sache, die zehn Minuten dauert und ${c.w[0].name} ein bisschen mehr Raum gibt.`,
    f:`Was habe ich für ${c.w[0].name} getan – und wie hat es sich angefühlt?`}),
  c => ({t:`${c.w[1].name} im Kleinen`,
    i:`<p>Heute ist ${c.w[1].name} dran.${wMean(c.w[1])}</p><p>Vielleicht hat dieser Wert lange keinen Platz bekommen. Dann ist auch ein ganz kleiner Schritt viel.</p>`,
    a:`Überleg dir einen Mini-Schritt für ${c.w[1].name} – so klein, dass du ihn heute sicher schaffst. Und dann tu ihn.`,
    f:`Wann in meinem Leben hatte ${c.w[1].name} schon einmal viel Platz?`}),
  c => ({t:"Eine Grenze ist ein Wert, der laut wird",
    i:`<p>Wo deine Werte verletzt werden, entsteht ein Gefühl: Wut, Enge, Traurigkeit. Dieses Gefühl ist kein Fehler – es ist ein Hinweis auf eine Grenze.</p><p>Wenn ${c.w[0].name}, ${c.w[1].name} oder ${c.w[2].name} dir wichtig sind, darfst du sie schützen.</p>`,
    a:`Formuliere einen Grenz-Satz, der mit einem deiner Werte beginnt: „Weil mir ${c.w[0].name} wichtig ist, …“`,
    f:"Wo wurde einer meiner Werte früher verletzt – und was wäre heute meine Grenze?"}),
  c => ({t:`${c.w[2].name} im Kleinen`,
    i:`<p>Heute bekommt ${c.w[2].name} deine Aufmerksamkeit.${wMean(c.w[2])}</p>`,
    a:`Schau auf deinen Tag: Wo ist heute eine Lücke, in die ${c.w[2].name} passt? Fülle sie – mit etwas Kleinem.`,
    f:`Wie würde mein Alltag aussehen, wenn ${c.w[2].name} darin selbstverständlich wäre?`}),
  c => ({t:"Entscheiden mit Kompass",
    i:`<p>Früher hat oft der alte Satz entschieden. Heute probierst du etwas anderes aus.</p>`,
    a:`Prüfe heute eine kleine Entscheidung mit der Frage: „Passt das zu ${c.w[0].name}, ${c.w[1].name} und ${c.w[2].name} – und zu meinem neuen Satz?“`,
    f:"Welche Entscheidung habe ich heute anders getroffen als sonst?"}),
  c => ({t:"Rückblick auf Woche 3",
    i:`<p>Diese Woche hast du deinen Werten Raum gegeben. Vielleicht hast du gemerkt: Der neue Satz fühlt sich wahrer an, wenn du nach deinen Werten handelst. Genau so entsteht ein neues Selbstbild – nicht im Kopf, sondern durch Taten.</p>`,
    a:"Lies deine Notizen dieser Woche. Markiere den Moment, in dem du dich am meisten wie du selbst gefühlt hast.",
    f:"Welcher meiner drei Werte möchte in Zukunft mehr Platz – und wie könnte das aussehen?"}),

  /* Woche 4 · Verankern */
  c => ({t:"Kleine Übung, große Wirkung",
    i:`<p>Ab heute geht es ums Verankern. Der neue Satz wird stark, wenn du ihn lebst – auch dann, wenn es sich ungewohnt anfühlt.</p>`,
    a:c.b.ueb[0], f:"Was ist passiert – in mir und um mich herum?"}),
  c => ({t:"Noch ein Schritt",
    i:`<p>Jede kleine Handlung im Sinne deines neuen Satzes ist eine Stimme dafür, wer du jetzt bist.</p>`,
    a:c.b.ueb[1], f:"Was hat mich die Übung heute gekostet – und was hat sie mir geschenkt?"}),
  c => ({t:"Wenn der alte Satz zurückkommt",
    i:`<p>Er wird zurückkommen. An müden Tagen, bei bestimmten Menschen, in alten Situationen. Das heißt nicht, dass du versagt hast. Es heißt nur, dass ein alter Weg im Kopf noch da ist.</p><p>Hilfreich ist ein Plan, den du dir jetzt in Ruhe überlegst.</p>`,
    a:`Schreib einen Wenn-dann-Satz: „Wenn sich ${q(c.alt)} meldet, dann …“ – zum Beispiel: dann atme ich dreimal aus, lese meinen Zettel oder schreibe einer Freundin.`,
    f:"Woran merke ich am frühesten, dass der alte Satz wieder laut wird?"}),
  c => ({t:"Die dritte Übung",
    i:`<p>Du bist jetzt über drei Wochen dabei. Das ist echte Ausdauer – auch wenn du Tage ausgelassen hast.</p>`,
    a:c.b.ueb[2], f:"Was traue ich mir heute zu, was ich mir vor 25 Tagen nicht zugetraut hätte?"}),
  c => ({t:"Menschen, die deinen Satz halten",
    i:`<p>Ein neuer Satz wächst leichter in der Nähe von Menschen, die dich so behandeln, als wäre er schon wahr. Und er wird schwerer bei Menschen, die den alten Satz füttern.</p>`,
    a:"Denk an einen Menschen, bei dem sich dein neuer Satz wahr anfühlt. Schreib ihm oder ihr heute eine kurze Nachricht – oder verbringe bewusst Zeit miteinander.",
    f:"Bei wem fühlt sich mein neuer Satz wahr an – und bei wem wird der alte laut?"}),
  c => ({t:"Ein Brief an die Frau von damals",
    i:`<p>Erinnere dich an die Frau, die du warst, als der alte Satz am lautesten war. Sie hat getan, was sie konnte, mit dem, was sie wusste.</p>`,
    a:`Schreib ihr ein paar Zeilen. Was möchtest du ihr heute sagen? Vielleicht beginnt es mit: „Ich weiß, du hast geglaubt: ${c.alt} Aber …“`,
    f:"Was hätte sie damals am dringendsten hören müssen?"}),
  c => ({t:"Ein Blick nach vorn",
    i:`<p>Stell dir vor, es ist ein Jahr später. Dein neuer Satz ist dir vertraut geworden. Er ist nicht mehr fremd, sondern einfach da.</p>`,
    a:`Schreib auf, wie ein gewöhnlicher Dienstag in deinem Leben aussieht, wenn du ganz aus ${q(c.neu)} heraus lebst – und ${c.w[0].name}, ${c.w[1].name} und ${c.w[2].name} Platz haben.`,
    f:"Was davon kann ich schon nächste Woche ausprobieren?"}),
  c => ({t:"Dein Satz in deinen Worten",
    i:`<p>Vor drei Wochen hast du deinen neuen Satz zum ersten Mal gelesen. Inzwischen hast du ihn gesprochen, gespürt, gelebt und geprüft.</p><p>Vielleicht hat er sich verändert. Vielleicht passt ein anderes Wort besser zu dir.</p>`,
    a:"Schreib deinen neuen Satz heute noch einmal – so, wie er jetzt in dir klingt. Er darf sich vom ursprünglichen Satz unterscheiden.",
    f:"Was ist an meinem Satz jetzt anders als am Anfang?"}),
  c => ({t:"30 Tage später",
    i:`<p>Du hast 30 Tage lang hingeschaut, geübt und dir selbst zugehört. Nicht perfekt, aber du hast es getan. Das ist der neue Satz in Aktion.</p><p>Der alte Satz ist vielleicht nicht ganz verschwunden. Aber er ist nicht mehr der einzige, der spricht.</p>`,
    a:"Lies deinen alten und deinen neuen Satz noch einmal nebeneinander. Spür nach, welcher sich heute mehr nach dir anfühlt.",
    f:"Was nehme ich aus diesen 30 Tagen mit?", slider:true}),
];


const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Prüft die Eingabe aus dem Browser; liefert null, wenn etwas fehlt. */
export function parseEingabe(body: unknown): KompassEingabe | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const values = Array.isArray(b.values) ? b.values.slice(0, 3).map(v => ({
    name: text((v as Wert)?.name, 40),
    meaning: text((v as Wert)?.meaning, 160),
  })) : [];
  const eingabe = {beliefId: text(b.beliefId, 20), alt: text(b.alt, 200), neu: text(b.neu, 200), values};
  if (!eingabe.alt || !eingabe.neu || values.length !== 3 || values.some(v => !v.name)) return null;
  return eingabe;
}

/** Setzt Satz und Werte in alle 30 Impulse ein. */
export function kompassTage(e: KompassEingabe): Tag[] {
  const b = beliefById(e.beliefId);
  const c: Ctx = {
    alt: esc(e.alt), neu: esc(e.neu),
    b: {wo: esc(b.wo), herkunft: esc(b.herkunft), stimme: esc(b.stimme), beweis: esc(b.beweis), ueb: b.ueb.map(esc)},
    w: e.values.map(v => ({name: esc(v.name), meaning: esc(v.meaning)})),
  };
  return DAYS.map(day => day(c));
}
