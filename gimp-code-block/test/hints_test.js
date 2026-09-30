// Valeurs prédites : register(...), réglages PF_…, arguments des fonctions GIMP
'use strict';
const store = {};
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } };
const { loadBlockly, loadGA } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
globalThis.Blockly = Blockly;
require('../src/hints.js');
require('../src/pyvars.js');
let fail = 0;
function ok(cond, what) { console.log((cond ? '✔ ' : '✘ ') + what); if (!cond) fail++; }
const strip = s => String(Array.isArray(s) ? s[0] : s).replace(/[\u0000-\u0007][^\u0002]*?\u0002|[\u0000-\u0007]/g, '');
(async () => {
  const src = 'from gimpfu import *\n\ndef flou_doux(image, drawable, amount):\n    pdb.gimp_drawable_fill(drawable, FILL_WHITE)\n\n' +
    'register(\n    "python_fu_flou_doux",\n    "Flou",\n    "Flou",\n    "Alice",\n    "Alice",\n    "2024",\n    "<Image>/Filters/Flou...",\n    "*",\n' +
    '    [\n        (PF_IMAGE, "image", "Input image", None),\n        (PF_DRAWABLE, "drawable", "Input drawable", None),\n        (PF_INT, "amount", "Amount", 3)\n    ],\n    [],\n    flou_doux)\n\nmain()\n';
  const r = await GA.importPython(src, 'flou_doux');
  const ws = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r.state, ws);
  GA.learnFromWorkspace(ws);
  ok(JSON.parse(store['atelier-gimp-authors'])[0] === 'Alice', 'l\'auteur est retenu à l\'import');
  const reg = ws.getAllBlocks(false).find(b => /^py_call/.test(b.type) && b.getFieldValue('FUNC') === 'register');
  const h = i => (GA.valueHints(reg.getInputTargetBlock('A' + i)) || { items: [] }).items.map(x => x.v);
  ok(h(0)[0] === '"python_fu_flou_doux"', 'nom : ' + h(0)[0]);
  ok(h(3).indexOf('"Alice"') >= 0, 'auteur proposé');
  ok(h(5)[0] === JSON.stringify(String(new Date().getFullYear())), 'date = cette année');
  ok(h(6).some(v => v === '"<Image>/Filters/Flou doux..."'), 'chemins de menu');
  ok(h(7).slice(0, 2).join(' ') === '"*" "RGB*, GRAY*"', 'types d\'image');
  ok(h(10)[0] === 'flou_doux', 'fonction proposée');
  // choisir PF_SLIDER : le tuple entier se complète
  const tup = reg.getInputTargetBlock('A8').getInputTargetBlock('E2');
  ok(GA.valueHints(tup.getInputTargetBlock('E0')).items.some(x => x.v === 'PF_SLIDER'), 'types PF_ proposés');
  GA.pickHint(tup.getInputTargetBlock('E0'), { v: 'PF_SLIDER', pf: true });
  const code = GA.build(ws, GA.defaultOpts()).code;
  ok(code.indexOf('(PF_SLIDER, "amount", "Amount", 50, (0, 100, 1))') >= 0, 'PF_SLIDER complété avec min/max/pas');
  // argument d'une fonction GIMP : les options de l'énumération
  const fill = ws.getAllBlocks(false).find(b => /^py_call/.test(b.type) && b.getFieldValue('FUNC') === 'pdb.gimp_drawable_fill');
  const eh = GA.valueHints(fill.getInputTargetBlock('A1')).items.map(x => x.v);
  ok(eh.indexOf('FILL_TRANSPARENT') >= 0, 'options de remplissage : ' + eh.slice(0, 3).join(', '));
  // modèle register : redonne exactement son code
  const tpl = GA.registerTemplate(ws);
  const b = Blockly.serialization.blocks.append(GA.pySnippet(tpl), new Blockly.Workspace());
  let all = String(GA.G.blockToCode(b)).replace(/[\u0000-\u0007]/g, '');
  ok(/flou_doux\)\s+S?main\(\)/.test(all) && all.indexOf('"Alice"') >= 0, 'modèle register rempli (auteur, fonction, main())');
  // renommer partout
  GA.renameScriptVar(ws, 'amount', 'force');
  const c2 = GA.build(ws, GA.defaultOpts()).code;
  ok(/def flou_doux\(image, drawable, force\)/.test(c2) && c2.indexOf('"amount"') >= 0, 'renommer : paramètre changé, texte "amount" intact');
  console.log(fail ? '\n' + fail + ' ÉCHEC(S)' : '\nTOUT OK');
  process.exit(fail ? 1 : 0);
})();
