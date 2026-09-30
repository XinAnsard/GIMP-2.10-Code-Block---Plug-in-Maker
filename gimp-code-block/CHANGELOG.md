# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
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
