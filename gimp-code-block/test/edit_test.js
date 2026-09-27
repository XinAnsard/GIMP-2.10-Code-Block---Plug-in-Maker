const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, corpusFiles, corpusDir, outDir, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
function diffCount(a, b) { const x = a.split('\n'), y = b.split('\n'); let d = Math.abs(x.length - y.length); for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) d++; return d; }
(async () => {
  // files that contain at least one function definition
  const picks = corpusFiles().slice(0, 6);
  for (const file of picks) {
    const name = path.basename(file, '.py');
    const src = fs.readFileSync(file, 'utf8');
    const r = await GA.importPython(src, name);
    const ws = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r.state, ws);
    const base = GA.build(ws).code;
    // 1. modifier une valeur
    // a numeric literal if the file has one, otherwise any literal
    const leaf = ws.getAllBlocks(true).find(b => b.type === 'py_leaf' && /^\d+$/.test(b.getFieldValue('CODE')))
      || ws.getAllBlocks(true).find(b => b.type === 'py_leaf' && b.getFieldValue('CODE'));
    if (leaf) leaf.setFieldValue(/^\d+$/.test(leaf.getFieldValue('CODE')) ? '12345' : '"edited"', 'CODE');
    const c1 = GA.build(ws).code;
    fs.writeFileSync(outDir('edit') + '/' + name + '_1_valeur.py', c1);
    // 2. déplacer le dernier bloc d'un corps imbriqué (profondeur >= 2) en tête de fichier… dans la 1re fonction
    const defs = ws.getAllBlocks(true).filter(b => b.type === 'py_def');
    const deep = ws.getAllBlocks(true).find(b => b.type === 'py_assign' && b.getSurroundParent() && b.getSurroundParent().getSurroundParent() && b.getSurroundParent().getSurroundParent().type !== 'py_file');
    const target = defs[0];
    if (deep && target) { deep.unplug(true); target.getInput('DO').connection.connect(deep.previousConnection); }
    const c2 = GA.build(ws).code;
    fs.writeFileSync(outDir('edit') + '/' + name + '_2_deplace.py', c2);
    // 3. ajouter un bloc neuf (appel GIMP) au début de la dernière fonction
    const nb = Blockly.serialization.blocks.append({ type: 'py_callst', extraState: { a: ['p'] }, fields: { FUNC: 'pdb.gimp_message' }, inputs: { A0: { block: { type: 'py_leaf', fields: { CODE: '"ajouté"' } } } } }, ws);
    const last = defs[defs.length - 1];
    if (last) last.getInput('DO').connection.connect(nb.previousConnection);
    const c3 = GA.build(ws).code;
    fs.writeFileSync(outDir('edit') + '/' + name + '_3_ajout.py', c3);
    console.log(name + ' : valeur modifiée → ' + diffCount(base, c1) + ' ligne(s) changée(s) ; déplacement → ' + diffCount(c1, c2) + ' ; ajout → ' + diffCount(c2, c3));
  }
})().catch(e => { console.log(e.stack); process.exit(1); });
