# Translating GIMP Code Block

The source texts are French (in the code). English lives in `src/i18n_en.js`,
`src/i18n_blocks.js` and `src/i18n_learn_en.js`. Every other language is a **pack**
in `src/lang/<code>.js` that replaces the English texts; anything a pack lacks
stays in English.

| Code | Language | Pack |
| --- | --- | --- |
| `es` | Español | `src/lang/es.js` |
| `de` | Deutsch | `src/lang/de.js` |
| `pt` | Português (Brasil) | `src/lang/pt.js` |
| `ru` | Русский | `src/lang/ru.js` |
| `hi` | हिन्दी | `src/lang/hi.js` |
| `ar` | العربية (right to left) | `src/lang/ar.js` |

## Workflow

```bash
node tools/i18n_master.js              # i18n/master.json: every text, its id and its English value
node tools/i18n_master.js --missing es # i18n/missing-es.json: what es.js still lacks
node test/i18n_test.js                 # checks every pack
node tools/build_guide.js              # docs/guide/<lang>.md from the course and guide
```

A pack maps an **id** (FNV-1a hash of the text's key, shown in `master.json`) to the
translated text. Translate the `en` value. Keep unchanged:

- `%NAME`-style slots (they are the holes of the block), `$1`-style parts, HTML tags;
- anything between backticks (`` `code` ``): Python code, file paths and names;
- `**bold**` markers may move, but keep them paired.

`test/i18n_test.js` fails when an id is unknown, when one of the kept parts is lost,
or when a pack covers less than 100 % of the texts.

To add a language: add it to `GA.LANGS` in `src/i18n.js`, create `src/lang/<code>.js`,
list it in `tools/build.py` (`SCRIPTS` and `BLOCKLY_LANGS`) and in `tools/i18n_lib.js`,
and add a menu entry in `src/index.html`.
