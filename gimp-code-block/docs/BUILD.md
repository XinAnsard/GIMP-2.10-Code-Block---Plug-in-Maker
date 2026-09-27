# Building

```bash
python3 tools/build.py                       # dist/gimp-code-block.html
python3 tools/build.py -o /tmp/app.html      # somewhere else
```

Python 3.8+ is the only requirement. The script:

1. loads `data/sigs.json`, `data/pyconst.json` and `data/popular.json` and inlines them
   as a single JSON `<script>`;
2. adds Blockly from the jsDelivr CDN, snapshots its English messages, then loads the
   French ones (so the app can switch language without another request);
3. inlines every file of `src/` in the order listed in `tools/build.py`;
4. substitutes all of it into `<!--SCRIPTS-->` in `src/index.html`.

## Fully offline build

By default Blockly comes from a CDN, so the very first load needs internet. To inline it:

```bash
npm install                                  # puts Blockly in node_modules/
python3 tools/build.py --offline node_modules/blockly
```

The result is bigger (~1.6 MB) but works with no network at all — handy for a workshop
room, a USB stick, or an air-gapped machine. Note that the AI providers still need
network unless you run a local model.

## Regenerating the PDB data

`data/sigs.json` holds the 857 GIMP 2.10 procedures with their arguments, return values
and deprecation flags. It is generated from GIMP's own documentation by
`tools/build_sigs.py`; you only need to re-run it if you target another GIMP version.

`data/popular.json` is the list of the most frequently used procedures, computed from a
corpus of real plug-ins. It feeds the AI prompt and the procedure picker. Regenerate it
with your own corpus if you like — the file is just a JSON array of procedure names.
