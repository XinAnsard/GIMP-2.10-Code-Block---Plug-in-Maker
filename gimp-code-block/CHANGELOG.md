# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
