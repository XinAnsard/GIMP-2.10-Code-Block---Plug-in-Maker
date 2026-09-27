# Contributing

Thanks for taking a look. This project has one hard rule and a few soft ones.

## The hard rule: the round trip must stay exact

Importing a `.py` file and exporting it again must give **the same bytes**, for every
file that parses. If a change breaks that, it is a bug, however nice the change is.

```bash
npm install
npm run test:roundtrip                        # fixtures shipped with the repo
CORPUS=/path/to/your/plugins npm run test:corpus
```

The single most useful contribution is a **plug-in that does not survive the round trip**.
Open an issue and attach the `.py`; no explanation needed.

## Code style

The app runs inside GIMP users' browsers and generates code for **Python 2.7**, so:

- **Generated Python**: 4-space indentation, no f-strings, no `print`, no ternary
  expressions, no `break`, PDB procedures that exist in GIMP 2.10, run-mode never passed
  by hand, errors reported through `pdb.gimp_message`.
- **JavaScript sources**: ES5-flavoured, no build step, no framework, no bundler. Each
  file is an IIFE extending the `GA` namespace. Keep functions small and named.
- **Comments and identifiers**: code comments explain *why*, not *what*. The source is
  historically French-commented in places; new comments in English are welcome, and
  mixed files are fine — do not rewrite a whole file just to translate it.
- **User-visible strings** always go through `GA.T()` and must be added to
  `src/i18n_en.js` (interface) or `src/i18n_blocks.js` (blocks).

## Adding a block

See [docs/ADDING-BLOCKS.md](docs/ADDING-BLOCKS.md). A block needs: a spec in
`src/specs_*.js`, an English entry in `src/i18n_blocks.js`, and it must generate code that
passes `npm run test:gen` (which parses every generated file with Python 2.7 when it is
available).

## Pull requests

1. `npm test` passes.
2. New behaviour comes with a test, or with a fixture in `test/fixtures/`.
3. One topic per PR.
4. Describe what a user sees, not only what the code does.

## Reporting bugs

Include: what you did, what you expected, what happened, the browser, and — if it involves
a script — the `.py` itself. For a generated plug-in that misbehaves inside GIMP, include
the message from *Filters ▸ Python-Fu ▸ Console* or GIMP's error console.
