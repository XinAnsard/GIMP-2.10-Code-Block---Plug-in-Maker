# Architecture

One HTML file, no framework, no bundler, no build step for the JavaScript itself:
`tools/build.py` concatenates the sources into `<script>` tags, in a fixed order, and
inlines the PDB data as JSON. Every source file is an IIFE that extends a single global
namespace, `GA`.

```
index.html  ── markup + CSS, with <!--SCRIPTS--> replaced at build time
    │
    ├─ core.js        GA namespace, categories, the block DSL, the Python helper library
    ├─ i18n.js        language selection, GA.T(), DOM translation (MutationObserver)
    ├─ i18n_en.js     English strings for the interface (exact map + regex patterns)
    ├─ i18n_blocks.js English strings for blocks, categories, dropdowns, examples
    ├─ pyparse.js     Python 2/3 tokenizer, parser, exact-format printer
    ├─ specs_a/b/c.js the ~200 friendly block specs, written in the DSL
    ├─ pyblocks.js    the 33 faithful py_* blocks
    ├─ gen.js         Blockly setup, themes, generator, checks, toolbox, PDB blocks
    ├─ pyimport.js    AST → block states, tolerant import, fingerprint trailer
    ├─ examples.js    built-in example projects
    ├─ tools.js       menus, selection, clipboard, drag outline, folding, shortcuts
    ├─ tools2.js      appearance, find/replace, function list, tutorial, menu actions
    ├─ ai.js          providers, prompt, validation, repair, insertion
    └─ app.js         boot, dialogs, import/export, autosave, side panel
```

## The two block families

**Friendly blocks** (`specs_*.js`) are written in a small DSL and describe *intent*:
"for each layer of image", "export as PNG". One block usually generates several lines of
Python, and may pull in a helper function from `GA.HELPERS` (emitted only if used).

**Faithful blocks** (`pyblocks.js`) describe *Python itself*: one block per construct
(`py_def`, `py_if`, `py_call`, `py_binop`…). They exist so that an arbitrary script can be
shown as blocks and printed back unchanged.

Both families live in the same workspace and generate through the same Blockly generator.

## Exact round trip

This is the part that makes the tool trustworthy, and the part to be careful with.

1. **Parse** — `pyparse.js` produces an AST where each statement keeps its `src` (the
   exact original text), trailing whitespace, blank lines before it, indentation string,
   inline and internal comments, `;` separators, and clause metadata for
   `elif`/`else`/`except`/`finally`.
2. **Blocks** — `pyimport.js` turns the AST into block states, storing that formatting in
   a `fm_` field on each block (and clause metadata in `cm_`).
3. **Print** — each block prints its original text again *as long as the normalised hash
   of its current content still matches* (`pickM`). Edit a block and it falls back to a
   standard, correct rendering — so only touched lines change.
4. **Re-assemble** — indentation is resolved in two passes over marker characters
   (`\u0001…\u0002` for indent hints, `\u0006…\u0007` for `;` joins), which lets a block
   inside a C-shaped input know its real depth.
5. **Fingerprint** — on export, a trailing comment can carry the deflate+base64 block
   state plus a hash. Re-importing that file restores the exact same blocks; if the file
   was edited by hand, the hash no longer matches and the blocks are rebuilt from the code.

Files that do not parse (there are real ones in the wild) are imported segment by segment:
whatever parses becomes blocks, the rest goes into verbatim `py_raw` blocks.

## Checks

`gen.js` walks the workspace and reports problems by block id: empty sockets, stray
blocks, unknown or deprecated PDB procedures, wrong argument counts, reserved names,
duplicate setting names, `while true`, settings used but not declared, variables read but
never written. The generated file is also re-parsed as Python 2.7 as a final sanity check.

## AI

`ai.js` builds a prompt containing the rules (Python 2.7 restrictions, PDB conventions,
plug-in skeleton), the project context (full code if short, an outline otherwise), the
selected code, and ~90 relevant PDB signatures chosen by keyword matching plus the most
used procedures. The answer is extracted, validated (`GA.aiValidate`) and, on failure,
sent back to the model with the list of problems — up to twice — before being converted
into blocks through the normal import path.

Transport is fully configurable: dialect, path, authentication, extra headers, request
body template and response path. See [AI-PROVIDERS.md](AI-PROVIDERS.md).
