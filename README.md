# GIMP-Plugin-Workshop V1 - 2.10 Version 
Create GIMP plugins visually, using Scratch-like blocks. Export ready-to-run Python code. Visual, Block-Based Plugin Creator.

# GIMP Code Block — Plug-in Maker

Build **GIMP 2.10 Python-Fu plug-ins by snapping blocks together** — and go the other
way round: drop an existing `.py` plug-in in, and every line becomes a block you can
read, search, fold and edit.

The whole thing is **one HTML file**. No install, no server, no account: open it in a
browser and download a plug-in ready to drop into GIMP's `plug-ins` folder.

*(Français : voir [la section en français](#en-français) plus bas.)*

---

## What it does

- **Visual editor** — ~200 beginner-friendly blocks (layers, selection, text, paths,
  files, messages, loops, maths) plus the **857 procedures of the official GIMP 2.10 PDB**,
  with their exact signatures.
- **Faithful Python import/export** — a real Python 2/3 tokenizer, parser and printer.
  Import a script, export it again, and you get **the same bytes back**: comments, blank
  lines, indentation (spaces *or* tabs), `;` on one line, line continuations, CRLF, BOM.
  Change one block and only the touched lines change.
- **Round trip guarantee, measured** — tested on **819 real plug-ins** (767 collected from
  406 public GitHub repositories + 52 from a user's own collection):
  **819 / 819 identical byte for byte**, and stable on a second pass.
- **Static checks** — empty slots, stray blocks, unknown or deprecated PDB procedures,
  wrong argument counts, reserved names, `while true`, missing settings… reported in
  plain language with a link to the block.
- **AI assistant, provider-agnostic** — ask for a function, a set of statements, a whole
  plug-in, a rewrite or an explanation. The answer is validated (Python 2.7 syntax, no
  `print`/ternary/`break`/f-string, PDB procedures that actually exist, exact argument
  counts, run-mode never passed) and automatically sent back for repair before being
  turned into blocks. Works with **any** OpenAI-compatible, Anthropic, Gemini or Ollama
  endpoint, **any local model**, or a completely custom HTTP API you describe yourself —
  and with no network at all, through copy-and-paste mode.
- **Notepad++-style workbench** — menu bar, multi-selection (Ctrl+click, lasso),
  clipboard that carries both blocks and Python code, find/replace, function list,
  fold/unfold, drag outline for huge stacks, keyboard shortcuts.
- **Customisable look** — 4 presets from minimal to fully custom: theme, block shape,
  palettes (including per-category colours), fonts, sizes, background, zoom.
- **8 languages** — French, English, Spanish, German, Brazilian Portuguese, Russian, Hindi
  and Arabic (right to left): every menu, block, help text, check message, the course and the
  guide. Adding a language: [docs/TRANSLATING.md](gimp-code-block/docs/TRANSLATING.md).
- **Never alone** — a built-in 🎓 course takes complete beginners to real Python in 18
  lessons with automatically checked missions, and a 📘 user guide covers everything else
  ([docs/guide/](gimp-code-block/docs/guide/)).

## Quick start

**Windows :** double-clique sur **`Lancer GIMP Code Block.bat`** à la racine du projet — un petit menu s'ouvre et lance l'atelier dans ton navigateur (il peut aussi ouvrir le dossier plug-ins de GIMP).

**Installer un plug-in dans GIMP en un clic :** lance l'atelier avec le `.bat` et laisse sa fenêtre ouverte. Dans l'atelier, clique **🧩 Installer dans GIMP** (ou `Ctrl+Maj+G`) : le fichier est rangé tout seul dans `%APPDATA%\GIMP\2.10\plug-ins` (l'ancienne version est gardée dans `gimp-code-block-sauvegardes`). Redémarre GIMP et le plug-in est dans son menu.

```bash
git clone https://github.com/USER/gimp-code-block.git
cd gimp-code-block
python3 tools/build.py          # writes dist/gimp-code-block.html
```

Open `dist/gimp-code-block.html` in any modern browser. That's it.

Prebuilt file: see the [Releases](../../releases) page.

### Using a plug-in you made

1. Click **Download the plug-in** — you get a `.zip` with the `.py` and a readme.
2. Copy the `.py` into GIMP's plug-ins folder:
   - Windows: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
   - Linux: `~/.config/GIMP/2.10/plug-ins` (make it executable: `chmod +x file.py`)
   - macOS: `~/Library/Application Support/GIMP/2.10/plug-ins`
   - GIMP shows the exact path in *Edit ▸ Preferences ▸ Folders ▸ Plug-ins*
3. Restart GIMP. Your plug-in is in the menu you chose.

> **GIMP 2.10 only.** GIMP 3 replaced Python-Fu with a different API; plug-ins made here
> do not run there. See [docs/GIMP3.md](docs/GIMP3.md).

## Requirements

| To do this | You need |
| --- | --- |
| Use the app | A modern browser. Internet on first load (Blockly comes from a CDN — see [docs/BUILD.md](docs/BUILD.md) for a fully offline build) |
| Run the generated plug-ins | GIMP 2.10 with Python-Fu (bundled in the Windows and macOS installers; `gimp-python` package on some Linux distros) |
| Build from source | Python 3.8+ |
| Run the test suite | Node.js 18+, `npm install` (Blockly), optionally Python 2.7 for the syntax checks and Playwright for the UI tests |

## Repository layout

```
src/            application sources, loaded in this order by the build
  core.js         namespace, categories, DSL, Python helper library
  i18n*.js        language engine + English strings (UI, blocks, examples)
  pyparse.js      Python 2/3 tokenizer, parser and exact-format printer
  specs_*.js      the ~215 friendly block definitions (specs_d: all images + ⚡ GIMP shortcuts)
  pyblocks.js     the 33 faithful py_* blocks (one per Python construct)
  gen.js          Blockly setup, code generator, checks, toolbox
  pyimport.js     AST → blocks, tolerant import, block fingerprint trailer
  examples.js     the built-in example projects
  tools.js        menus, multi-selection, clipboard, drag outline, folding
  tools2.js       appearance, find/replace, function list, tutorial, actions
  suggest.js      type-ahead suggestions (PDB procedures, variables, attributes)
  ai.js           AI providers, prompt building, validation, insertion
  app.js          UI wiring, dialogs, import/export, autosave
  index.html      markup and styles (scripts are injected by the build)
data/           GIMP 2.10 PDB signatures, Python constants, popular procedures
tools/build.py  bundles everything into one HTML file
test/           headless tests, fixtures and browser tests
docs/           architecture, build, tests, AI providers, contributing
```

## Tests

```bash
npm install                 # Blockly, used by the headless tests
npm test                    # generation, import, round trip, cycles
npm run test:roundtrip      # byte-for-byte identity on test/fixtures
CORPUS=/path/to/plugins npm run test:corpus     # same, on your own collection
npm run test:ui             # browser tests (needs Playwright)
```

See [docs/TESTS.md](docs/TESTS.md) for what each test proves and how to run the
819-script corpus check.

## Contributing

Issues and pull requests are welcome — especially new blocks, translations and
real-world plug-ins that do **not** survive the round trip (that is the most useful bug
report there is: attach the `.py`). See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE). Bundles [Blockly](https://github.com/google/blockly) (Google, Apache 2.0)
from a CDN. GIMP and the GIMP logo belong to the GIMP project; this is an independent
tool, not affiliated with it.

---

## En français

**GIMP Code Block — Plug-in Maker** permet de créer des plug-ins Python pour **GIMP 2.10**
en emboîtant des blocs, sans savoir programmer — et inversement : importe un script `.py`
existant, chaque ligne devient un bloc, et le téléchargement redonne **exactement le même
fichier**, à l'octet près (commentaires, lignes vides, tabulations, `;`, CRLF, BOM).

Tout tient dans **un seul fichier HTML** : aucune installation, aucun serveur, aucun compte.

Pour construire :

```bash
python3 tools/build.py      # produit dist/gimp-code-block.html
```

Puis ouvre `dist/gimp-code-block.html` dans ton navigateur.

L'interface est entièrement bilingue (menu **🌐 Langue**), l'assistant IA fonctionne avec
n'importe quel fournisseur — en ligne, local (Ollama, LM Studio, llama.cpp…), une API
maison que tu décris toi-même, ou en copier-coller sans aucune connexion.

La documentation détaillée est dans [`docs/`](docs/) :
[architecture](docs/ARCHITECTURE.md), [construction](docs/BUILD.md),
[tests](docs/TESTS.md), [fournisseurs IA](docs/AI-PROVIDERS.md),
[écrire un bloc](docs/ADDING-BLOCKS.md).
