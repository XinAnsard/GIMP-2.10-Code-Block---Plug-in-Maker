// Listes de script : détectées, et les blocs « façon Scratch » redonnent exactement leur Python
'use strict';
const { loadBlockly, loadGA } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
globalThis.Blockly = Blockly;
require('../src/pyvars.js');
let fail = 0;
function ok(cond, what) { console.log((cond ? '✔ ' : '✘ ') + what); if (!cond) fail++; }
const txt = b => { const r = GA.G.blockToCode(b); return String(Array.isArray(r) ? r[0] : r).replace(/[\u0000-\u0007]S?/g, '').trim(); };
(async () => {
  const src = 'from gimpfu import *\n\ndef run(image, drawable):\n    noms = []\n    calques = image.layers\n    for layer in calques:\n        noms.append(layer.name)\n    tous = list(calques)\n    mots = "a b".split(" ")\n    n = 3\n    gros.extend(tous)\n';
  const r = await GA.importPython(src, 'listes');
  const ws = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r.state, ws);
  const names = GA.pyListNames(ws);
  ok(JSON.stringify(names) === JSON.stringify(['calques', 'gros', 'mots', 'noms', 'tous']), 'listes détectées : ' + names.join(', '));
  const fl = GA.pyListFlyout(ws, GA.pyVarNames(ws)).filter(x => x.kind === 'block' && x.type !== 'py_var');
  ok(fl.length >= 18, fl.length + ' blocs de liste');
  const tmp = new Blockly.Workspace();
  const codes = fl.map(st => { const s = JSON.parse(JSON.stringify(st)); delete s.kind; return txt(Blockly.serialization.blocks.append(s, tmp)); });
  ['calques = []', 'calques.append(layer)', 'del calques[:]', 'len(calques)', 'layer in calques', '", ".join(calques)', 'calques[-1]', 'for i, layer in enumerate(calques):']
    .forEach(c => ok(codes.some(x => x.indexOf(c) === 0), 'bloc : ' + c));
  const bad = codes.filter(c => !c || /pass\s*$/.test(c) && !/^for /.test(c));
  ok(!bad.length, 'aucun bloc vide ' + JSON.stringify(bad));
  GA.renameScriptVar(ws, 'noms', 'liste_noms');
  const code = GA.build(ws, GA.defaultOpts()).code;
  ok(code.indexOf('liste_noms.append(layer.name)') >= 0 && code.indexOf('liste_noms = []') >= 0, 'renommer une liste change aussi liste.append(…)');
  console.log(fail ? '\n' + fail + ' ÉCHEC(S)' : '\nTOUT OK');
  process.exit(fail ? 1 : 0);
})();
