# Adding a block

Friendly blocks are declared with a small DSL in `src/specs_a.js`, `specs_b.js`,
`specs_c.js`. A minimal statement block:

```js
D.stmt('lyr_rename', {
  cat: 'layer',                                   // category id, see core.js
  msg: 'renommer %L en %NAME',                    // %X refer to the args below
  args: {
    L: D.val('layer'),                            // an input socket
    NAME: D.text('Nouveau nom')                   // a text field
  },
  pdb: ['gimp-item-set-name'],                    // procedures used (checked by tests)
  help: 'Changes the name of a layer, a group or a path.',
  py: (a) => 'pdb.gimp_item_set_name(' + a.L + ', ' + a.NAME + ')'
});
```

Value blocks use `D.value(...)` and return `[code, order]`; C-shaped blocks use
`D.loop(...)` with a `%DO` statement input.

Then:

1. **Add the English text** in `src/i18n_blocks.js` under `GA.EN_BLOCKS`:
   `lyr_rename: b('rename %L to %NAME', 'Changes the name…')`. The `%…` placeholders must
   match the French message exactly, in any order.
2. **Never invent a PDB procedure.** `npm run test:gen` fails if a block references a
   procedure that is not in `data/sigs.json`, and warns on deprecated ones.
3. **Respect the generated-Python rules**: 4 spaces, no f-strings, no `print`, no ternary,
   no `break`, never pass the run-mode, convert integer IDs with `gimp._id2drawable` /
   `gimp._id2vectors`.
4. If your block needs a shared Python function, add it to `GA.HELPERS` in `core.js` and
   reference it with `a.use('_my_helper')`; helpers are emitted only when used.
5. Run `npm test`.

## Faithful Python blocks

Do not add blocks to `pyblocks.js` unless Python itself gained a construct. Those 33
blocks are paired with the parser and the printer; changing them risks the byte-for-byte
round trip, which is the project's hard rule.
