# Tests

```bash
npm install     # Blockly (dev dependency, used by the headless tests)
npm test
```

| Command | What it proves |
| --- | --- |
| `npm run test:gen` | Builds 199 block programs, generates Python for each, checks every PDB name and argument count, and — if `python2.7` is on the PATH — compiles each generated file |
| `node test/import_test.js` | Imports each fixture, rebuilds the blocks, compares the Python structure (AST) and comment count |
| `node test/cycle_test.js` | friendly blocks → `.py` → Python blocks → `.py`, and the fingerprint path |
| `node test/edit_test.js` | Editing one block changes only the lines it should |
| `node test/pill_test.js` | Variables become round blocks, renaming one changes only its line, choosing a PDB procedure fills its arguments, Python shortcuts generate code, PDB search (French words, prefixes) |
| `npm run test:roundtrip` | **Byte-for-byte identity** on `test/fixtures/`, twice (stability) |
| `npm run test:corpus` | Same, on a folder you point at |
| `npm run test:ui` | Browser tests: menus, multi-selection, clipboard, find/replace, appearance, tutorial, AI panel, English mode, no JS errors |

## Testing against your own plug-ins

```bash
CORPUS=/path/to/a/folder/of/plugins npm run test:corpus
```

Each file is imported and exported; the report lists any file whose bytes differ, with the
first differing line. Very large collections are best run in batches of ~60 files
(`node --max-old-space-size=4096`), since each run holds full workspaces in memory.

This is how the 819-script result quoted in the README was obtained: 767 plug-ins
collected from 406 public GitHub repositories plus 52 private ones, all identical
byte for byte and stable on a second pass. Three real bugs were found and fixed that way:
`;`-joined statements, tab-indented files, and blank lines inside line continuations.

## Browser tests

`test/ui2.py` and `test/ui_ia.py` use Playwright:

```bash
pip install playwright && playwright install chromium
python3 tools/build.py
npm run test:ui
```

`test/ui_ia.py` starts three fake AI servers (native Ollama, a custom API with a
hand-written request body and an exotic auth header, and an OpenAI-compatible one) and
checks that each answer is validated and inserted as blocks.

## Python 2.7

`test/run_plugin.py` compiles generated plug-ins with Python 2.7 when it is available.
Python 2.7 is not required to develop; it only strengthens `test:gen`.

## Known limitations

- A comment placed **inside the arguments of a multi-line call** is preserved in the
  statement's raw text, so the file still round-trips byte for byte, but the comment
  collector does not report it as a separate comment on a second parse. `parse_test.js`
  reports this as a warning, not a failure (`test/fixtures/edge_comments.py` covers it).
- Files with a **syntax error** cannot be turned into blocks; the parts that parse become
  blocks and the rest is kept verbatim in raw-code blocks. Exporting still reproduces the
  file exactly, error included.
- Editing a block **inside** a line that was kept verbatim (a raw-code block) rewrites
  that whole segment in standard form.
