# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Lists are back in 📦 Variables & lists for Python scripts**, Scratch style: « ➕ Make a list »,
  the lists of the script (anything filled with `[…]`, `list()`, `sorted()`, `.split()`, `image.layers`…
  or used with `.append()`/`.extend()`), and ready blocks on the first one: add at the end, add
  another list, insert, replace/delete item #, delete this item, delete all, sort/reverse, for each
  item (with its number), item #, last item, length, contains, position, part, joined text,
  sorted/reversed copy. « Rename everywhere » now also renames `liste.append(…)`.
- **🧩 Install in GIMP** (export dialog, File menu, `Ctrl+Shift+G`): the plug-in goes straight
  into `%APPDATA%\GIMP\2.10\plug-ins`. The page drops `<name>.gimp-install.py` in Downloads and the
  Windows launcher (`Lancer GIMP Code Block.bat`, new `tools/gimp-install.ps1`) moves it into GIMP at
  once, keeping the previous version in `gimp-code-block-sauvegardes`. Launcher menu choice 3 installs
  the plug-ins still waiting in Downloads.
- **Script variables in 📦 Variables & lists**: after an import, every variable of the script
  (parameters, `=` targets, loop variables…) is listed there as a draggable pill, with ready-made
  `x = …` and `x += …` blocks. « Create a variable » also works in a Python script.
- **Pick a variable, don't type it**: clicking a variable pill opens a menu of the script's
  variables; right-click offers « rename everywhere » (safe: texts, attributes and keyword
  arguments are left alone) and « use another variable ». Typing the name stays available as
  an option in 🎨 Appearance.
- **Predicted values**: clicking a box of `register(...)` proposes the usual values (unique name,
  the remembered author, this year, menu paths, image types, your function). Picking a `PF_…`
  type completes the whole setting tuple (default value, min/max/step, options). Arguments of
  GIMP functions propose their options (fill types, modes…), `True`/`False`, `image`,
  `drawable`, sizes. A pre-filled `register(...)` + `main()` block and the common `PF_…`
  settings are in the 🐍 Python category.
- **💼 Sessions** (File menu): save under a name your project, appearance, language, screen
  layout, course progress and remembered authors; reopen it, take back only the interface,
  or export/import it as a `.json` file. The AI key is never included.
- **🎓 Course, from complete beginner to pro**: 18 lessons in 4 levels (first plug-in,
  installing it, layers, settings → variables, loops, conditions, layer loops → selections,
  text, all open images, batch folders → reading the Python, Python blocks, the PDB, debugging,
  your own functions, importing real scripts). Each lesson has a mission that the workshop
  checks automatically, one-click blocks, hints, and remembers your progress.
- **📘 User guide** in the app (12 sections, from the screen layout to common problems), also
  generated as Markdown in `docs/guide/<lang>.md`.
- **8 languages**: French, English, Spanish, German, Brazilian Portuguese, Russian, Hindi and
  Arabic (right to left), for the whole interface, every block, the course and the guide;
  the AI assistant answers in the chosen language. Language packs live in `src/lang/`; see
  `docs/TRANSLATING.md`.
- **Variables as round orange pills**, like Scratch: every variable read in an imported script
  (`image`, `layer`, `x`…) is now its own round block instead of plain text. GIMP constants
  (`FILL_WHITE`, `NORMAL_MODE`…) are violet pills. The 🐍 Python category lists the variables of
  the current script.
- **Operations as blocks**: `a + 1`, `x == 0`, `not a`, `a and b`, `a if b else c`, `layer.name`… are
  split into blocks even when they contain no function call (plain values such as `-1`, `"text"`,
  `(0, 0, 0)` stay a single slot).
- **Type-ahead suggestions** in the Python blocks: clicking a function name, a variable or an
  attribute opens a list of matching entries as coloured pills with their arguments and a short
  description. Function search covers the 857 PDB procedures, understands French words
  (flou → blur, calque → layer…), tolerates missing letters, and puts the most used first.
  Choosing a PDB procedure fills in the missing arguments with sensible defaults.
- 🔍 button on every Python call block and in the help panel to browse all PDB procedures.
- **⚡ GIMP shortcuts** category: blocks that replace the patterns every GIMP script repeats —
  one undo step per image across all open images, every layer of every open image, batch-open
  the files of a folder, single undo step / restore colours & tools / restore selection / restore
  active layer / no-undo fast mode wrappers (all `try/finally`), new layer the size of the image,
  copy a layer to another image.
- **All open images**: `all open images` (list), `number of open images`, `open image named …`,
  `image of the layer`, `most recently opened image`.
- The same shortcuts as ready-made Python block stacks in the 🐍 Python category, for imported
  scripts.

### Verified
- Byte-for-byte round trip unchanged: fixtures (now including `edge_names.py`, variables in
  tricky expressions) and 34 public plug-ins, identical and stable on a second pass.

## [1.0.0] — 2026-09-27

First public release.

### Added
- Visual editor with ~200 beginner blocks covering layers, selection, painting, text,
  paths, files, messages, control flow, maths and variables.
- The 857 procedures of the GIMP 2.10 PDB as blocks, with exact signatures, a searchable
  picker and automatic array-length arguments.
- Faithful Python import/export: tokenizer, parser and exact-format printer, 33 `py_*`
  blocks (one per Python construct), tolerant import with raw-code fallback for files
  that do not parse, and a block fingerprint written as a trailing comment so a `.py`
  can be re-imported into the exact same blocks.
- Static checks with plain-language messages and links to the offending block.
- AI assistant: any OpenAI-compatible, Anthropic, Gemini or Ollama endpoint, any local
  model, a fully custom HTTP API (path, headers, authentication, request body, response
  path), or offline copy-and-paste mode. Answers are validated and auto-repaired before
  being inserted as blocks.
- Workbench: menu bar, multi-selection (Ctrl+click, lasso), clipboard carrying blocks and
  Python code, find/replace, function list, fold/unfold, drag outline for large stacks,
  keyboard shortcuts.
- Appearance settings: 4 presets, themes, block shapes, palettes including per-category
  colours, fonts, sizes, background, zoom.
- Guided 11-step tutorial, including an honest "what you are getting into" step.
- Full French and English interface.
- Test suite: block generation, Python 2.7 syntax check of generated files, import,
  cycles, edit locality and byte-for-byte round trip; browser tests with Playwright.

### Verified
- Byte-for-byte round trip on 819 real plug-ins (767 from 406 public GitHub repositories,
  52 from a private collection): 819/819 identical and stable on a second pass.
