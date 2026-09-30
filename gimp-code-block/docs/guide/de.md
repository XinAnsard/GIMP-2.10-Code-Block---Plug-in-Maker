# Benutzerhandbuch — GIMP Code Block

## 🗺️ Der Bildschirm der Werkstatt

- **Links** die Blockkategorien. Klicke auf eine Kategorie, um ihre Blöcke zu sehen, und ziehe dann einen Block auf die Baufläche.
- In der **Mitte** die Baufläche. Mausrad: scrollen; Strg + Mausrad: zoomen; Ziehen auf freier Fläche: verschieben.
- **Rechts** die Seitenleiste: 💡 Hilfe (zum ausgewählten Block), 🐍 Code (das erzeugte Python), ✅ Prüfung, 🤖 KI und 🎓 Kurs.
- **Oben** die Menüs, die Blocksuche (Taste /) und die Schaltfläche ⬇ Herunterladen.

## 🧩 Die Formen der Blöcke

- **Block mit Kerbe**: eine Aktion. Er wird unter einen anderen gestapelt.
- **Abgerundeter Block**: ein Wert (Zahl, Text, Ebene, Variable). Er passt in eine Lücke.
- **Spitzer (sechseckiger) Block**: eine Wahr/Falsch-Bedingung, für „wenn“ und „solange“.
- **C-Block**: Er enthält andere Blöcke (Schleifen, Bedingungen, Abkürzungen).

Ein ausgegrauter Block ist deaktiviert: Er ist nicht im Code. Rechtsklick auf einen Block: duplizieren, kommentieren, deaktivieren, einklappen, Hilfe.

## ▶ Der Startblock

Der gelbe Block **▶ Wenn ich starte** beschreibt dein Plug-in: seinen Namen im Menü, das Menü, in dem es erscheint, ob es ein offenes Bild braucht, und seine Einstellungen („zuerst fragen“).

Die Einstellungen werden zu dem Fenster, das GIMP vor dem Start des Plug-ins zeigt. Nutze ihren Wert mit den 🎛️-Blöcken der Kategorie ▶ Start.

**Einstellungen ▸ Mein Plug-in** regelt den Rest: Autor, gruppiertes Rückgängig, Fehlerbehandlung, importierte Module.

## ⬇ Herunterladen und installieren

Klicke auf **⬇ Herunterladen**: Du bekommst eine `.py`-Datei. Lege sie in den Plug-in-Ordner von GIMP und starte GIMP neu.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins`, dann `chmod +x file.py`
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

Der genaue Ordner steht unter **Bearbeiten ▸ Einstellungen ▸ Ordner ▸ Plugins**. Hier erstellte Plug-ins laufen in **GIMP 2.10** (nicht in GIMP 3, das eine andere API hat).

## 🐍 Python-Skript importieren

**Datei ▸ Python-Skript importieren**, oder lege die `.py`-Datei auf der Seite ab. Jede Zeile wird zu einem Python-Block.

Garantie: Solange du nichts änderst, gibt der Download **dieselbe Datei zurück, Byte für Byte** (Kommentare, Leerzeichen und Tabulatoren inklusive). Änderst du einen Block, werden nur seine Zeilen neu geschrieben.

Ein Skript mit Syntaxfehler lässt sich trotzdem importieren: Der fehlerhafte Teil wird zu einem 🧱-„Rohcode“-Block, der korrigiert werden muss.

## 🟠 Python-Blöcke und ihre Pillen

- **orange**: Variable; **violett**: GIMP-Konstante; **gelb**: GIMP-Funktion; **dunkelgrün**: andere Funktion; grüne Blöcke: Rechnungen und Vergleiche; weiße Felder: Werte, so wie sie geschrieben sind.

Klicke auf eine Pille und tippe: Eine Liste mit Vorschlägen öffnet sich (Pfeile ↑↓ dann Eingabe, oder Klick). Bei einer GIMP-Funktion füllen sich die fehlenden Felder von selbst.

Rechtsklick auf einen Funktionsaufruf: ein Argument hinzufügen oder entfernen. Rechtsklick auf „wenn“: „sonst wenn“ oder „sonst“ hinzufügen.

Die Kategorie 🐍 Python zeigt die Variablen deines Skripts und fertige **GIMP-Abkürzungen** (gruppiertes Rückgängig, Schleife über Bilder, über Ebenen…).

## ⚙️ Die 857 GIMP-Funktionen (PDB)

Zwei Wege, sie zu nutzen: der Block „⚙️ GIMP-Funktion“ (🧰 Fortgeschritten) in einem Plug-in aus einfachen Blöcken, oder der Block „rufe auf …“ in Python-Blöcken.

Suche: Tippe ein Wort auf Englisch oder Französisch (blur, layer, selection, text…). Die meistgenutzten Funktionen kommen zuerst; „alt“ kennzeichnet eine veraltete Funktion, die einen Ersatz hat.

Der `run_mode` wird nie angegeben: pygimp fügt ihn hinzu. Listen haben oft direkt davor einen Zähler (z. B. `num_points`, dann `points`).

## ⚡ GIMP-Abkürzungen

Blöcke, die ersetzen, was jedes Skript von Hand schreibt:
- „als ein einziger Rückgängig-Schritt“: Alles zählt als ein Strg+Z, auch bei einem Fehler;
- „danach wiederherstellen…“ die Farben und Werkzeuge, die Auswahl oder die aktive Ebene;
- „für jedes offene Bild“, „für jede Ebene aller Bilder“, „für jede Datei des Ordners“;
- „neue Ebene in Bildgröße“, „Ebene in ein anderes Bild kopieren“.

## ✅ Prüfung und Fehler

Der Tab **✅ Prüfung** liest dein Plug-in nach jeder Änderung neu: 🛑 Fehler (es würde nicht laufen), ⚠️ ansehen, ℹ️ Information. Klicke auf eine Zeile, um zum Block zu springen.

In GIMP: **Fenster ▸ Andockbare Dialoge ▸ Fehlerkonsole** zeigt Python-Fehler. Hier erstellte Plug-ins zeigen den vollständigen Fehler außerdem in einer Meldung.

**Filter ▸ Python-Fu ▸ Konsole**: um eine Python-Zeile direkt in GIMP auszuprobieren.

## 🤖 Der KI-Assistent

**KI ▸ KI wählen**: jeder kompatible Dienst (OpenAI, Anthropic, Gemini, Mistral…), eine lokale KI (Ollama, LM Studio) oder der Kopieren-und-Einfügen-Modus ohne Verbindung.

Bitte um eine Funktion, ein ganzes Plug-in, eine Korrektur oder eine Erklärung. Die Antwort wird automatisch geprüft und repariert, bevor sie zu Blöcken wird.

## 💾 Deine Arbeit speichern

Die Werkstatt speichert deine Arbeit automatisch in diesem Browser.

Um sie woanders aufzubewahren oder zu teilen: **Datei ▸ Projekt speichern** (`.json`-Datei). Die heruntergeladene `.py` enthält auch den Fingerabdruck der Blöcke: Importierst du sie erneut, bekommst du deine Blöcke genau zurück.

## ❓ Häufige Probleme

- **Das Plug-in erscheint nicht**: falscher Ordner, GIMP nicht neu gestartet, Datei nicht ausführbar (Linux) oder Python-Fu fehlt (Linux: Paket `gimp-python`).
- **Das Menü ist ausgegraut**: Das Plug-in braucht ein offenes Bild (Kästchen im ▶-Block).
- **„argument count“ / „wrong type“**: Sieh im Tab ✅ Prüfung nach, er nennt die erwartete Anzahl von Argumenten.
- **Seltsame Umlaute und Akzente**: Nutze die Textblöcke der Werkstatt, sie kümmern sich für dich um UTF-8.

---

# Kurs: vom völligen Anfänger zum Profi

Jede Lektion erklärt eine Idee und gibt dir dann eine Mission. Die Werkstatt prüft von selbst, wann du es geschafft hast.

## 🌱 Stufe 1 — Erste Schritte

*Noch nie programmiert? Perfekt, wir fangen hier an.*

### 1. Dein erstes Plug-in

🎯 **GIMP „Hallo“ sagen lassen.**

Ein **Plug-in** ist ein kleines Programm, das den Menüs von GIMP einen Befehl hinzufügt. Hier baust du es, indem du Blöcke wie ein Puzzle zusammensteckst: Die Werkstatt schreibt den echten Python-Code für dich.

Jedes Plug-in beginnt mit dem gelben Block **▶ Wenn ich starte**. Die Blöcke unter „dann tun“ laufen **von oben nach unten**, einer nach dem anderen.

**Deine Mission**

1. Klicke auf den Block unten, um ihn hinzuzufügen: Er hängt sich von selbst unter „dann tun“.
2. Klicke in das weiße Feld der Meldung und tippe deinen Text.
3. Sieh dir den Tab 🐍 Code an: Die Zeile `pdb.gimp_message(...)` ist erschienen.

### 2. Dein Plug-in in GIMP installieren

🎯 **Dein Plug-in in den Menüs von GIMP sehen und starten.**

GIMP lädt Plug-ins beim Start aus einem besonderen Ordner namens **plug-ins**.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins` (dann mache die Datei ausführbar: `chmod +x file.py`)
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

Der genaue Pfad steht in GIMP: **Bearbeiten ▸ Einstellungen ▸ Ordner ▸ Plugins**.

**Deine Mission**

1. Gib deinem Plug-in im ▶-Block einen Namen und wähle sein Menü.
2. Klicke oben rechts auf **⬇ Herunterladen**.
3. Lege die `.py`-Datei in den Plug-in-Ordner und **starte GIMP neu**.
4. Öffne ein Bild und suche dein Plug-in im gewählten Menü. Klicke darauf: Deine Meldung erscheint!
5. Wenn es klappt, klicke auf „Geschafft“.

> 💡 Das Plug-in erscheint nicht? Prüfe, ob die Datei wirklich im Plug-in-Ordner liegt (nicht in einem zusätzlichen Unterordner), ob sie auf .py endet und ob GIMP neu gestartet wurde. Unter Linux brauchst du außerdem das Paket gimp-python.

### 3. Das Bild verändern: eine neue Ebene

🎯 **Eine weiß gefüllte Ebene im Bild erstellen.**

Eine **Ebene** ist eine durchsichtige Folie auf dem Bild. Die lila Blöcke (📑 Ebenen) erstellen und ändern sie.

Der Block „neue Ebene“ aus der Kategorie ⚡ Abkürzungen erledigt auf einmal, was Programmierer in 3 Zeilen schreiben: Ebene erstellen, zum Bild hinzufügen, füllen.

Achte auf die blauen Ovale „🖼️ aktuelles Bild“: Das sind **Werte**. Sie stehen für das Bild, auf dem du das Plug-in gestartet hast.

**Deine Mission**

1. Füge den Block unten hinzu.
2. Ändere seinen Namen („Meine Ebene“) und wähle „weiß“ in der Liste.
3. Herunterladen, die alte Datei in GIMP ersetzen, neu starten und ausprobieren.

### 4. Dem Nutzer eine Frage stellen

🎯 **Beim Start nach einer Zahl fragen und sie verwenden.**

Wenn ein Plug-in **Einstellungen** hat, öffnet GIMP vor dem Start ein kleines Fenster: Der Nutzer wählt eine Zahl, einen Text, eine Farbe…

Einstellungen kommen in den Teil „zuerst fragen“ des ▶-Blocks. Danach liefert der Block „🎛️ Wert der Einstellung“ (Kategorie ▶ Start), was der Nutzer gewählt hat.

**Deine Mission**

1. Öffne die Kategorie **▶ Start & Einstellungen** und ziehe eine Einstellung „🔢 ganze Zahl“ in „zuerst fragen“. Gib ihr einen Namen, zum Beispiel `opacity`.
2. Füge den Block „Deckkraft von …“ unten hinzu.
3. Lege in sein Prozentfeld den 🎛️-Block der Einstellung (er erscheint in der Kategorie ▶ Start, sobald die Einstellung existiert).

## 🌿 Stufe 2 — Grundlagen des Programmierens

*Variablen, Schleifen, Bedingungen: die 3 Ideen hinter jedem Programm.*

### 5. Variablen: Kisten, die sich etwas merken

🎯 **Einen Wert in einer Variablen speichern und wiederverwenden.**

Eine **Variable** ist eine Kiste mit einem Namen. Du legst einen Wert hinein (eine Zahl, einen Text, eine Ebene…), um ihn später wieder zu benutzen.

„setze `x` auf 5“ legt 5 in die Kiste `x`. Danach ist jeder `x`-Block 5 wert. Legst du etwas anderes in `x`, wird der alte Wert ersetzt.

Blöcke, die etwas erstellen (Ebene, Text, Bild), haben oft einen Pfeil **→ in**: Das Ergebnis wird in einer Variablen gespeichert, damit du es danach ändern kannst.

**Deine Mission**

1. Öffne **📦 Variablen & Listen** und klicke auf „➕ Variable erstellen“. Nenne sie `name`.
2. Füge „setze … auf …“ hinzu und trage einen Text ein, zum Beispiel „Hallo“.
3. Füge „💬 zeige die Meldung“ hinzu und lege den Block deiner Variablen hinein.

### 6. Wiederholen: Schleifen

🎯 **5 Ebenen auf einmal erstellen.**

Ein Computer wird nie müde: Eine **Schleife** führt dieselben Blöcke so oft aus, wie du willst.

„wiederhole 10 mal“ ist die einfachste. „zähle mit `i` von 1 bis 10“ macht dasselbe, aber die Variable `i` ist 1, dann 2, dann 3…: praktisch zum Nummerieren.

**C**-förmige Blöcke enthalten andere Blöcke: Alles darin wird wiederholt.

**Deine Mission**

1. Füge den Block „zähle mit …“ unten hinzu und setze das Ende auf 5.
2. Ziehe einen Block „neue Ebene“ **in** das C.
3. Extra: Nutze im Ebenennamen „verbinde … und …“ (🧮 Rechnen & Text), um „Ebene“ + `i` zu schreiben.

### 7. Entscheiden: Bedingungen

🎯 **Etwas nur tun, wenn das Bild breiter als hoch ist.**

„**wenn** … **dann** …“ führt die Blöcke darin nur aus, wenn die Bedingung wahr ist.

Eine Bedingung ist ein **sechseckiger** Block (auf beiden Seiten spitz): ein Vergleich wie „… > …“, „… enthält …“, „… und …“.

Mit „wenn … dann … sonst …“ wählst du zwischen zwei Wegen.

**Deine Mission**

1. Füge „wenn … dann“ hinzu.
2. Lege in sein spitzes Feld einen Vergleich „… > …“.
3. Links kommt „Breite von aktuelles Bild“, rechts „Höhe von aktuelles Bild“.
4. Lege in das C eine Meldung „Querformat!“.

### 8. Alle Ebenen durchgehen

🎯 **Mit jeder Ebene des Bildes dasselbe tun.**

„für jede Ebene `layer` von aktuelles Bild“ ist eine besondere Schleife: In jeder Runde enthält die Variable `layer` **eine** Ebene des Bildes, dann die nächste…

So benennt, versteckt oder ändert man 200 Ebenen mit einem Klick. Mit dem Kästchen „auch in Gruppen suchen“ werden auch Ebenen in Ordnern besucht.

**Deine Mission**

1. Füge „für jede Ebene“ hinzu.
2. Lege darin „Deckkraft von …“ ab und ziehe die Variable `layer` in sein erstes Feld.
3. Wähle 50 %: Alle deine Ebenen werden halb durchsichtig.

## 🌳 Stufe 3 — Echte Arbeit mit GIMP

*Auswahlen, Text, mehrere Bilder, ganze Ordner.*

### 9. Auswählen und malen

🎯 **Ein Rechteck mit Farbe füllen.**

Die **Auswahl** (die gestrichelten Linien) beschränkt Aktionen auf einen Bereich. In GIMP wirken fast alle Filter und Füllungen nur auf die Auswahl.

Positionen werden in Pixeln von der **oberen linken Ecke** aus gezählt: x nach rechts, y nach unten.

Denk daran, am Ende nichts mehr auszuwählen, um dem Nutzer alles sauber zu übergeben.

**Deine Mission**

1. Füge „Vordergrundfarbe“ hinzu und wähle eine Farbe.
2. Füge „wähle ein Rechteck aus“ hinzu (x 0, y 0, 200 × 100).
3. Füge „fülle die Auswahl von … mit Vordergrundfarbe“ hinzu.
4. Beende mit „nichts auswählen“.

### 10. Text schreiben

🎯 **Eine Textebene auf dem Bild hinzufügen.**

Der Block „schreibe …“ erstellt eine **Textebene**: Schrift, Größe, Farbe und Position werden im Block eingestellt.

Die Textebene wird in einer Variablen gespeichert (→ in `text`): Du kannst sie danach verschieben, ihre Deckkraft ändern usw.

**Deine Mission**

1. Füge den Block „schreibe“ hinzu.
2. Tippe deinen Text, eine Größe von 60 px und eine Farbe ein.
3. Extra: Nutze eine Einstellung „kurzer Text“, damit der Nutzer den Text wählt.

### 11. Mit allen offenen Bildern arbeiten

🎯 **Eine Aktion auf jedes offene Bild anwenden, mit sauberem Rückgängig.**

Ein Plug-in muss nicht nur mit dem aktuellen Bild arbeiten. „für jedes offene Bild“ geht durch **alle** in GIMP offenen Bilder.

Normalerweise zählt jede Aktion als ein Rückgängig-Schritt. Die ⚡-Abkürzung fasst alles, was das Plug-in mit einem Bild macht, zu **einem einzigen Strg+Z** zusammen.

Nutze in der Schleife die Variable `img` statt „aktuelles Bild“.

**Deine Mission**

1. Füge „für jedes offene Bild (ein Rückgängig-Schritt pro Bild)“ hinzu.
2. Lege darin „zusammenfügen …“ ab und ziehe `img` in sein Feld.
3. Öffne 3 Bilder in GIMP und starte dein Plug-in.

### 12. Einen ganzen Ordner verarbeiten (Stapel)

🎯 **Jedes Bild eines Ordners öffnen, ändern und als PNG exportieren.**

Die **Stapelverarbeitung** ist die echte Superkraft von Skripten: 500 Dateien werden bearbeitet, während du einen Kaffee trinkst.

Die Abkürzung „für jede Bilddatei des Ordners“ öffnet jede Datei ohne Fenster, führt deine Blöcke aus und gibt dann den Speicher frei.

Tipp: Füge eine Einstellung „📁 Ordner zum Auswählen“ hinzu, damit der Nutzer den Ordner in GIMP wählt.

**Deine Mission**

1. Füge den Stapel-Block unten hinzu, mit der Endung `.jpg`.
2. Lege darin „exportiere … als PNG nach …“ mit `img` ab.
3. Verbinde für den Pfad den Dateinamen und „.png“ (🧮 Rechnen & Text).

## 🚀 Stufe 4 — Hin zum Code (Profi)

*Python lesen und schreiben, die 857 GIMP-Funktionen nutzen, Fehler suchen.*

### 13. Den gebauten Python-Code lesen

🎯 **Den Zusammenhang zwischen einem Block und seinen Codezeilen verstehen.**

Jeder Block entspricht einer oder mehreren Zeilen **Python 2.7**, der Sprache der Plug-ins von GIMP 2.10.

Im Tab 🐍 Code: **Klicke auf einen Block**, seine Zeilen leuchten auf. **Klicke auf eine Zeile**, ihr Block wird ausgewählt. So lernt man am besten, Code zu lesen.

Merke: In Python ist, was **nach rechts eingerückt** ist, „innen“ — genau wie Blöcke in einem C.
- `pdb.gimp_...(...)`: ein Aufruf einer GIMP-Funktion
- `x = ...`: ein Wert wird in der Variablen `x` gespeichert
- `for ... in ...:`: eine Schleife; `if ...:`: eine Bedingung

**Deine Mission**

1. Öffne den Tab 🐍 Code.
2. Klicke auf drei verschiedene Blöcke und beobachte, welche Zeilen aufleuchten.

### 14. Zu Python-Blöcken wechseln

🎯 **Dein Plug-in in Python-Blöcke verwandeln, eine Zeile = ein Block.**

Einfache Blöcke sind bequem, aber **Python**-Blöcke zeigen dir den ganzen Code, Zeile für Zeile, und lassen dich alles ändern.

In Python-Blöcken helfen dir die Farben:
- **orange** Pille: eine Variable (`image`, `layer`, `x`)
- **violette** Pille: eine GIMP-Konstante (`FILL_WHITE`, `NORMAL_MODE`)
- **gelbe** Pille: eine GIMP-Funktion (`pdb.…`)
- grüne Blöcke: Rechnungen und Vergleiche (`+`, `==`, `and`…)

Klicke auf eine Pille und tippe ein paar Buchstaben: Eine Liste mit Vorschlägen öffnet sich.

**Deine Mission**

1. Klicke auf die Schaltfläche unten (oder Datei ▸ Dieses Plug-in als Python-Blöcke ansehen).
2. Erkunde: Klicke auf eine orange Pille und sieh dir die vorgeschlagenen Variablen an.

### 15. Die 857 GIMP-Funktionen

🎯 **Eine PDB-Funktion mit den richtigen Argumenten aufrufen.**

Die **PDB** (Procedure DataBase) ist die Liste von allem, was GIMP kann: 857 Funktionen. Alles, was du in GIMP mit der Maus machst, hat seine Funktion.

Klicke in einem Block „rufe auf …“ auf den Funktionsnamen und tippe ein Wort, auf Englisch oder Französisch: **blur**, **layer**, **text**… Die Liste zeigt jede Funktion mit ihren Argumenten und einer Erklärung. Wähle eine: Die Felder füllen sich von selbst.

Die 🔍 des Blocks öffnet die vollständige Liste, nach Gruppen sortiert.

Goldene Regel: Der `run_mode` wird **nie** übergeben — pygimp fügt ihn selbst hinzu.

**Deine Mission**

1. Füge einen Block „rufe auf …“ hinzu (Kategorie 🐍 Python).
2. Klicke auf seinen Namen, tippe „blur“ und wähle `plug_in_gauss`.
3. Ersetze die Werte 0.0 durch 5.0 für eine Unschärfe von 5 Pixeln.

### 16. Fehlersuche wie ein Profi

🎯 **Einen Fehler finden und verstehen.**

Jeder macht Fehler, auch Profis. Der Unterschied: Sie wissen, **wo sie nachsehen** müssen.
- Der Tab **✅ Prüfung** findet viele Fehler **bevor** GIMP es tut: leeres Feld, falsche Anzahl von Argumenten, unbekannte Funktion… Klicke auf ein Problem, um den Block zu sehen.
- In GIMP werden Fehler in **Fenster ▸ Andockbare Dialoge ▸ Fehlerkonsole** angezeigt.
- Um zu sehen, was eine Variable während des Laufs enthält, zeige sie an: `pdb.gimp_message(str(x))`.
- Mit **Filter ▸ Python-Fu ▸ Konsole** kannst du eine Python-Zeile direkt in GIMP ausprobieren.

Lies Fehlermeldungen **von unten nach oben**: Die letzte Zeile sagt, was falsch ist, die darüber, wo.

**Deine Mission**

1. Öffne den Tab ✅ Prüfung.
2. Füge ein „rufe auf …“ für `pdb.gimp_message` hinzu und lege eine Variable hinein, zum Beispiel `str(image.width)`.

### 17. Eigene Funktionen schreiben

🎯 **Ein Stück Code in eine Funktion packen und sie aufrufen.**

Wenn du dieselben Zeilen an mehreren Stellen wiederholst, packe sie in eine **Funktion**: „definiere `my_function(layer)`“. Danach erledigt ein einziger Block „rufe auf `my_function(...)`“ alles.

**Parameter** (in Klammern) sind Variablen, die beim Aufruf gefüllt werden. „gib zurück …“ liefert ein Ergebnis.

Ein guter Funktionsname sagt, was sie tut: `make_grey`, `number_layers`… Deine Funktionen erscheinen auch in den Vorschlägen.

**Deine Mission**

1. Füge „definiere …“ mit dem Namen `griser` und dem Parameter `calque` hinzu.
2. Rufe darin `pdb.gimp_drawable_desaturate(calque, DESATURATE_LUMINANCE)` auf.
3. Rufe woanders `griser(drawable)` auf.

### 18. Importieren, ändern, teilen

🎯 **Ein echtes bestehendes Skript öffnen und ändern, ohne es kaputtzumachen.**

Ein Plug-in im Internet gefunden? **Datei ▸ Python-Skript importieren**: Jede Zeile wird zu einem Block, und der Download gibt **genau dieselbe Datei** zurück, solange du nichts änderst. Änderst du einen Block, ändern sich nur seine Zeilen.

Der **KI-Assistent** (Tab 🤖) kann eine Funktion schreiben, ein Skript erklären oder einen Fehler beheben. Seine Antworten werden geprüft (Python 2.7, echte GIMP-Funktionen, richtige Anzahl von Argumenten), bevor sie zu Blöcken werden.

Du kannst jetzt GIMP-Plug-ins lesen, schreiben und reparieren. Als Nächstes: Öffne Skripte anderer Leute, lies sie Block für Block und baue deine eigenen. **Gut gemacht!**

**Deine Mission**

1. Importiere ein `.py`-Skript (oder ein Beispiel: Datei ▸ Beispiele, dann umwandeln).
2. Ändere einen Wert und sieh im Tab 🐍 Code nach, welche Zeilen sich geändert haben.
3. Wenn du fertig bist, klicke auf „Geschafft“.

