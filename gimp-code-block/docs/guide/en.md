# User guide — GIMP Code Block

## 🗺️ The workshop screen

- On the **left**, the block categories. Click a category to see its blocks, then drag a block into the building area.
- In the **centre**, the building area. Wheel: scroll; Ctrl + wheel: zoom; drag on empty space: move around.
- On the **right**, the panel: 💡 Help (about the selected block), 🐍 Code (the Python produced), ✅ Check, 🤖 AI and 🎓 Course.
- At the **top**, the menus, the block search (/ key) and the ⬇ Download button.

## 🧩 The shapes of the blocks

- **Notched block**: an action. It stacks under another one.
- **Rounded block**: a value (number, text, layer, variable). It slots into a hole.
- **Pointed (hexagonal) block**: a true/false condition, for "if" and "while".
- **C block**: it holds other blocks (loops, conditions, shortcuts).

A greyed-out block is disabled: it is not in the code. Right-click a block: duplicate, comment, disable, collapse, help.

## ▶ The start block

The yellow **▶ When I run** block describes your plug-in: its name in the menu, the menu where it appears, whether it needs an open image, and its settings ("first, ask").

Settings become the window GIMP shows before running the plug-in. Use their value with the 🎛️ blocks of the ▶ Start category.

**Settings ▸ My plug-in** sets the rest: author, grouped undo, error handling, imported modules.

## ⬇ Download and install

Click **⬇ Download**: you get a `.py` file. Put it in GIMP's plug-ins folder and restart GIMP.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins`, then `chmod +x file.py`
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

The exact folder is in **Edit ▸ Preferences ▸ Folders ▸ Plug-ins**. Plug-ins made here work in **GIMP 2.10** (not in GIMP 3, which has a different API).

## 🐍 Import a Python script

**File ▸ Import a Python script**, or drop the `.py` file on the page. Each line becomes a Python block.

Guarantee: as long as you change nothing, the download gives back **the same file, byte for byte** (comments, spaces and tabs included). If you change a block, only its lines are rewritten.

A script with a syntax error still imports: the faulty part becomes a 🧱 "raw code" block to fix.

## 🟠 Python blocks and their pills

- **orange**: variable; **violet**: GIMP constant; **yellow**: GIMP function; **dark green**: other function; green blocks: calculations and comparisons; white slots: values written as is.

Click a pill and type: a list of suggestions opens (arrows ↑↓ then Enter, or click). For a GIMP function, the missing slots fill themselves.

Right-click a function call: add or remove an argument. Right-click "if": add "else if" or "else".

The 🐍 Python category lists your script's variables and ready-made **GIMP shortcuts** (grouped undo, loop over images, over layers…).

## ⚙️ The 857 GIMP functions (PDB)

Two ways to use them: the "⚙️ GIMP function" block (🧰 Advanced) in a simple-blocks plug-in, or the "call …" block in Python blocks.

Search: type a word in English or French (blur, layer, selection, text…). The most used functions come first; "old" marks a deprecated function that has a replacement.

The `run_mode` is never provided: pygimp adds it. Arrays often have a counter just before them (e.g. `num_points` then `points`).

## ⚡ GIMP shortcuts

Blocks that replace what every script writes by hand:
- "as a single undo step": everything counts as one Ctrl+Z, even if an error happens;
- "then restore…" the colours and tools, the selection or the active layer;
- "for each open image", "for each layer of all images", "for each file of the folder";
- "new layer the size of the image", "copy the layer into another image".

## ✅ Check and errors

The **✅ Check** tab rereads your plug-in after every change: 🛑 error (it would not work), ⚠️ worth a look, ℹ️ information. Click a line to go to the block.

In GIMP: **Windows ▸ Dockable Dialogs ▸ Error Console** shows Python errors. Plug-ins made here also show the full error in a message.

**Filters ▸ Python-Fu ▸ Console**: to try a line of Python directly in GIMP.

## 🤖 The AI assistant

**AI ▸ Choose the AI**: any compatible service (OpenAI, Anthropic, Gemini, Mistral…), a local AI (Ollama, LM Studio) or copy-and-paste mode, with no connection.

Ask for a function, a whole plug-in, a fix or an explanation. The answer is checked and repaired automatically before it becomes blocks.

## 💾 Save your work

The workshop automatically keeps your work in this browser.

To keep it elsewhere or share it: **File ▸ Save the project** (`.json` file). The downloaded `.py` also contains the blocks' fingerprint: re-import it and you get your blocks back exactly.

## ❓ Common problems

- **The plug-in does not show up**: wrong folder, GIMP not restarted, file not executable (Linux), or Python-Fu missing (Linux: `gimp-python` package).
- **The menu is greyed out**: the plug-in needs an open image (checkbox of the ▶ block).
- **"argument count" / "wrong type"**: look at the ✅ Check tab, it tells the expected number of arguments.
- **Strange accents**: use the workshop's text blocks, they handle UTF-8 for you.

---

# Course: from complete beginner to pro

Each lesson explains one idea, then gives you a mission. The workshop checks by itself when you have succeeded.

## 🌱 Level 1 — First steps

*Never programmed before? Perfect, we start here.*

### 1. Your first plug-in

🎯 **Make GIMP say "Hello".**

A **plug-in** is a small program that adds a command to GIMP's menus. Here you build it by snapping blocks together, like a puzzle: the workshop writes the real Python code for you.

Every plug-in starts with the yellow block **▶ When I run**. The blocks placed under "then do" run **from top to bottom**, one by one.

**Your mission**

1. Click the block below to add it: it attaches itself under "then do".
2. Click the white slot of the message and type your text.
3. Look at the 🐍 Code tab: the line `pdb.gimp_message(...)` has appeared.

### 2. Install your plug-in in GIMP

🎯 **See your plug-in in GIMP's menus and run it.**

GIMP loads plug-ins at startup, from a special folder called **plug-ins**.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins` (then make the file executable: `chmod +x file.py`)
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

The exact path is written in GIMP: **Edit ▸ Preferences ▸ Folders ▸ Plug-ins**.

**Your mission**

1. In the ▶ block, give your plug-in a name and choose its menu.
2. Click **⬇ Download** at the top right.
3. Put the `.py` file in the plug-ins folder, then **restart GIMP**.
4. Open an image and look for your plug-in in the menu you chose. Click it: your message appears!
5. When it works, click "I did it".

> 💡 The plug-in does not show up? Check that the file really is in the plug-ins folder (not in an extra sub-folder), that it ends with .py, and that GIMP was restarted. On Linux you also need the gimp-python package.

### 3. Act on the image: a new layer

🎯 **Create a layer filled with white in the image.**

A **layer** is a transparent sheet laid on the image. The purple blocks (📑 Layers) create and change them.

The "new layer" block of the ⚡ Shortcuts category does at once what programmers write in 3 lines: create the layer, add it to the image, fill it.

Notice the blue ovals "🖼️ current image": they are **values**. They stand for the image you ran the plug-in on.

**Your mission**

1. Add the block below.
2. Change its name ("My layer") and choose "white" in the list.
3. Download, replace the old file in GIMP, restart and try.

### 4. Ask the user a question

🎯 **Ask for a number at launch and use it.**

When a plug-in has **settings**, GIMP opens a small window before running it: the user chooses a number, a text, a colour…

Settings go in the "first, ask" part of the ▶ block. Then the "🎛️ setting value" block (▶ Start category) gives what the user chose.

**Your mission**

1. Open the **▶ Start & settings** category and drag a "🔢 whole number" setting into "first, ask". Give it a name, for example `opacity`.
2. Add the "opacity of …" block below.
3. In its percentage slot, drop the 🎛️ block of the setting (it appears in the ▶ Start category once the setting exists).

## 🌿 Level 2 — Programming basics

*Variables, loops, conditions: the 3 ideas behind every program.*

### 5. Variables: boxes that remember

🎯 **Store a value in a variable, then use it again.**

A **variable** is a box with a name. You store a value in it (a number, a text, a layer…) to use it again later.

"set `x` to 5" puts 5 in the box `x`. After that, every `x` block is worth 5. If you put something else in `x`, the old value is replaced.

Blocks that create something (layer, text, image) often have an arrow **→ in**: the result is stored in a variable, so you can change it afterwards.

**Your mission**

1. Open **📦 Variables & lists** and click "➕ Create a variable". Call it `name`.
2. Add "set … to …" and put a text in it, for example "Hello".
3. Add "💬 show the message" and drop your variable's block in it.

### 6. Repeat: loops

🎯 **Create 5 layers at once.**

A computer never gets bored: a **loop** runs the same blocks as many times as you want.

"repeat 10 times" is the simplest. "count with `i` from 1 to 10" does the same, but the variable `i` is 1, then 2, then 3…: handy for numbering.

**C**-shaped blocks hold other blocks: everything inside is repeated.

**Your mission**

1. Add the "count with …" block below and set the end to 5.
2. Drag a "new layer" block **inside** the C.
3. Bonus: in the layer name, use "join … and …" (🧮 Maths & text) to write "Layer" + `i`.

### 7. Choose: conditions

🎯 **Do something only if the image is wider than it is tall.**

"**if** … **then** …" runs the blocks inside only if the condition is true.

A condition is a **hexagonal** block (pointed on both sides): a comparison like "… > …", "… contains …", "… and …".

With "if … then … else …", you choose between two paths.

**Your mission**

1. Add "if … then".
2. In its pointed slot, drop a "… > …" comparison.
3. On the left put "width of current image"; on the right, "height of current image".
4. Inside the C, put a message "Landscape image!".

### 8. Go through all the layers

🎯 **Do the same thing to every layer of the image.**

"for each layer `layer` of current image" is a special loop: on each round, the variable `layer` holds **one** layer of the image, then the next one…

This is how you rename, hide or change 200 layers in one click. With the "also look inside groups" box, layers stored in folders are visited too.

**Your mission**

1. Add "for each layer".
2. Inside, put "opacity of …" and drop the `layer` variable in its first slot.
3. Choose 50%: all your layers become half transparent.

## 🌳 Level 3 — Real GIMP work

*Selections, text, several images, whole folders.*

### 9. Select and paint

🎯 **Fill a rectangle with colour.**

The **selection** (the dotted lines) limits actions to an area. In GIMP, almost all filters and fills only touch the selection.

Positions are counted in pixels from the **top-left corner**: x to the right, y downwards.

Remember to select nothing at the end, to hand things back cleanly to the user.

**Your mission**

1. Add "foreground colour" and pick a colour.
2. Add "select a rectangle" (x 0, y 0, 200 × 100).
3. Add "fill the selection of … with foreground colour".
4. Finish with "select none".

### 10. Write text

🎯 **Add a text layer on the image.**

The "write …" block creates a **text layer**: font, size, colour and position are set in the block.

The text layer is stored in a variable (→ in `text`): you can then move it, change its opacity, etc.

**Your mission**

1. Add the "write" block.
2. Type your text, a size of 60 px, a colour.
3. Bonus: use a "short text" setting so the user chooses the text.

### 11. Work on all open images

🎯 **Apply an action to each open image, with a clean undo.**

A plug-in does not have to work only on the current image. "for each open image" goes through **all** the images open in GIMP.

Each action normally counts as one undo step. The ⚡ shortcut groups everything the plug-in does to an image into **a single Ctrl+Z**.

In the loop, use the `img` variable instead of "current image".

**Your mission**

1. Add "for each open image (one undo step per image)".
2. Inside, put "flatten …" and drop `img` in its slot.
3. Open 3 images in GIMP and run your plug-in.

### 12. Process a whole folder (batch)

🎯 **Open each image of a folder, change it and export it as PNG.**

**Batch processing** is the real superpower of scripts: 500 files processed while you have a coffee.

The "for each image file of the folder" shortcut opens each file without a window, runs your blocks, then frees the memory.

Tip: add a "📁 folder to choose" setting so the user picks the folder in GIMP.

**Your mission**

1. Add the batch block below, with the extension `.jpg`.
2. Inside, put "export … as PNG to …" with `img`.
3. For the path, join the file name and ".png" (🧮 Maths & text).

## 🚀 Level 4 — Towards code (pro)

*Read and write Python, use the 857 GIMP functions, debug.*

### 13. Read the Python you built

🎯 **Understand the link between a block and its lines of code.**

Each block matches one or more lines of **Python 2.7**, the language of GIMP 2.10 plug-ins.

In the 🐍 Code tab, **click a block**: its lines light up. **Click a line**: its block gets selected. It is the best way to learn to read code.

Remember: in Python, what is **shifted to the right** (the indentation) is "inside" — exactly like blocks inside a C.
- `pdb.gimp_...(...)`: a call to a GIMP function
- `x = ...`: a value is stored in the variable `x`
- `for ... in ...:`: a loop; `if ...:`: a condition

**Your mission**

1. Open the 🐍 Code tab.
2. Click three different blocks and watch the lines that light up.

### 14. Switch to Python blocks

🎯 **Turn your plug-in into Python blocks, one line = one block.**

Simple blocks are comfortable, but **Python** blocks show you all the code, line by line, and let you change everything.

In Python blocks, colours help you:
- **orange** pill: a variable (`image`, `layer`, `x`)
- **violet** pill: a GIMP constant (`FILL_WHITE`, `NORMAL_MODE`)
- **yellow** pill: a GIMP function (`pdb.…`)
- green blocks: calculations and comparisons (`+`, `==`, `and`…)

Click a pill and type a few letters: a list of suggestions opens.

**Your mission**

1. Click the button below (or File ▸ See this plug-in as Python blocks).
2. Explore: click an orange pill and look at the suggested variables.

### 15. The 857 GIMP functions

🎯 **Call a PDB function with the right arguments.**

The **PDB** (Procedure DataBase) is the list of everything GIMP can do: 857 functions. Everything you do with the mouse in GIMP has its function.

In a "call …" block, click the function name and type a word, in English or French: **blur**, **layer**, **text**… The list shows each function with its arguments and an explanation. Choose one: the slots fill themselves.

The block's 🔍 opens the full list, sorted by group.

Golden rule: the `run_mode` is **never** passed — pygimp adds it itself.

**Your mission**

1. Add a "call …" block (🐍 Python category).
2. Click its name, type "blur" and choose `plug_in_gauss`.
3. Replace the 0.0 values with 5.0 for a 5-pixel blur.

### 16. Debug like a pro

🎯 **Find and understand an error.**

Everybody makes mistakes, even pros. The difference: they know **where to look**.
- The **✅ Check** tab finds many errors **before** GIMP does: empty slot, wrong number of arguments, unknown function… Click a problem to see the block.
- In GIMP, errors are shown in **Windows ▸ Dockable Dialogs ▸ Error Console**.
- To see what a variable holds while the plug-in runs, show it: `pdb.gimp_message(str(x))`.
- **Filters ▸ Python-Fu ▸ Console** lets you try a line of Python directly in GIMP.

Read errors **from the bottom up**: the last line says what is wrong, the one above says where.

**Your mission**

1. Open the ✅ Check tab.
2. Add a "call …" to `pdb.gimp_message` and put a variable in it, for example `str(image.width)`.

### 17. Write your own functions

🎯 **Put a piece of code in a function and call it.**

When you repeat the same lines in several places, put them in a **function**: "define `my_function(layer)`". Then a single "call `my_function(...)`" block does it all.

**Parameters** (in brackets) are variables filled at the moment of the call. "return …" sends back a result.

A good function name says what it does: `make_grey`, `number_layers`… Your functions also appear in the suggestions.

**Your mission**

1. Add "define …" with the name `griser` and the parameter `calque`.
2. Inside, call `pdb.gimp_drawable_desaturate(calque, DESATURATE_LUMINANCE)`.
3. Somewhere else, call `griser(drawable)`.

### 18. Import, change, share

🎯 **Open a real existing script and change it without breaking it.**

Found a plug-in on the Internet? **File ▸ Import a Python script**: each line becomes a block, and the download gives back **exactly the same file** as long as you change nothing. If you change a block, only its lines change.

The **AI assistant** (🤖 tab) can write a function, explain a script or fix an error. Its answers are checked (Python 2.7, real GIMP functions, right number of arguments) before they become blocks.

You can now read, write and fix GIMP plug-ins. Next: open other people's scripts, read them block by block, and build your own. **Well done!**

**Your mission**

1. Import a `.py` script (or an example: File ▸ Examples, then convert it).
2. Change a value and look in the 🐍 Code tab at which lines changed.
3. When you are done, click "I did it".

