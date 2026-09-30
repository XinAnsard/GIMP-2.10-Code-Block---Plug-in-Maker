// Variables en pastilles et choix d'une fonction PDB dans un bloc d'appel
const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
let fail = 0;
function ok(cond, what) { console.log((cond ? '✔ ' : '✘ ') + what); if (!cond) fail++; }
function exportText(ws) { return GA.build(ws, GA.defaultOpts()).code; }
(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'test/fixtures/edge_names.py'), 'utf8');
  const r = await GA.importPython(src, 'edge_names');
  const ws = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r.state, ws);
  const vars = ws.getAllBlocks(false).filter(b => b.type === 'py_var');
  ok(vars.length > 40, 'les noms lus deviennent des blocs variable (' + vars.length + ')');
  ok(!ws.getAllBlocks(false).some(b => b.type === 'py_leaf' && /^[A-Za-z_]\w*$/.test(b.getFieldValue('CODE')) && !/^(True|False|None)$/.test(b.getFieldValue('CODE'))),
    'aucune variable seule ne reste en texte brut');
  ok(ws.getAllBlocks(false).some(b => b.type === 'py_leaf' && b.getFieldValue('CODE') === 'None'), 'None reste une valeur');

  // renommer une variable : seule sa ligne change
  const before = exportText(ws).split('\n');
  const target = vars.find(b => b.getFieldValue('NAME') === 'drawable');
  target.setFieldValue('calque', 'NAME');
  const after = exportText(ws).split('\n');
  const diff = before.map((l, i) => l !== after[i] ? i : -1).filter(i => i >= 0);
  ok(before.length === after.length && diff.length === 1 && /image\.width\*2 \/\/ calque\.height|image\.width \* 2 \/\/ calque\.height/.test(after[diff[0]]),
    'renommer une variable ne change que sa ligne : ' + JSON.stringify(after[diff[0]]));

  // choisir une fonction PDB dans un bloc d'appel
  const ws2 = new Blockly.Workspace();
  const call = Blockly.serialization.blocks.append({ type: 'py_callst', extraState: { a: [] }, fields: { FUNC: 'x' } }, ws2);
  GA.pyApplyProc(call, 'plug_in_gauss');
  const code = GA.G.blockToCode(call).replace(/[\u0000-\u0007][^\u0002]*?\u0002|[\u0000-\u0007]/g, '');
  ok(/^pdb\.plug_in_gauss\(image, drawable, 0\.0, 0\.0, 0\)/.test(code.trim()), 'plug_in_gauss rempli : ' + code.trim());
  const ws3 = new Blockly.Workspace();
  const c3 = Blockly.serialization.blocks.append({ type: 'py_call', extraState: { a: ['p'] }, fields: { FUNC: 'x' }, inputs: { A0: { block: { type: 'py_var', fields: { NAME: 'img' } } } } }, ws3);
  GA.pyApplyProc(c3, 'gimp_image_insert_layer');
  const out3 = GA.G.blockToCode(c3)[0];
  ok(out3 === 'pdb.gimp_image_insert_layer(img, drawable, None, 0)', 'arguments existants gardés : ' + out3);
  // raccourcis Python : chaque morceau redonne son code
  const fl = GA.pyFlyout(ws);
  const blocks = fl.filter(x => x.kind === 'block');
  ok(blocks.some(x => x.type === 'py_var' && x.fields.NAME === 'image'), 'le flyout Python montre les variables du script');
  const ws4 = new Blockly.Workspace();
  const shortcuts = GA.pyShortcuts().filter(x => x.kind === 'block');
  let shortOk = shortcuts.length >= 8;
  shortcuts.forEach(st => { const s2 = Object.assign({}, st); delete s2.kind; const blk = Blockly.serialization.blocks.append(s2, ws4); const code = GA.G.blockToCode(blk); if (!/pdb\.|gimp\.|for /.test(code)) shortOk = false; });
  ok(shortOk, 'raccourcis Python : ' + shortcuts.length + ' piles de blocs');
  // opérations entre valeurs simples : des blocs aussi
  const r5 = await GA.importPython('x = 1 + 2\ny = "a" + "b"\nz = -1\nc = (0, 0, 0)\n', 'ops');
  const ws5 = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r5.state, ws5);
  ok(ws5.getBlocksByType('py_binop').length === 2 && ws5.getAllBlocks(false).some(b => b.type === 'py_leaf' && b.getFieldValue('CODE') === '-1'), '1 + 2 devient un bloc « + », -1 reste une valeur');
  ok(exportText(ws5).indexOf('x = 1 + 2\ny = "a" + "b"\nz = -1\nc = (0, 0, 0)\n') === 0, 'et le code ressort pareil');
  // recherche PDB (suggest.js) : français et fautes
  require(path.join(ROOT, 'src/suggest.js'));
  const top = q => GA.pdbSearch(q, null, 5).list;
  ok(top('flou').indexOf('plug_in_gauss') >= 0, 'flou → ' + top('flou').join(', '));
  ok(top('insert layer')[0] === 'gimp_image_insert_layer', 'insert layer → ' + top('insert layer')[0]);
  ok(top('calque nouveau').indexOf('gimp_layer_new') >= 0, 'calque nouveau → ' + top('calque nouveau').join(', '));
  ok(top('pdb.gimp_mess')[0] === 'gimp_message', 'pdb.gimp_mess → ' + top('pdb.gimp_mess')[0]);
  console.log(fail ? '\n' + fail + ' ÉCHEC(S)' : '\nTOUT OK');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log(e.stack); process.exit(1); });
