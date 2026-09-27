// Test headless : construit des programmes, génère le Python, vérifie statiquement
const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, corpusFiles, corpusDir, outDir, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
const DATA = GA.DATA;
const out = outDir();
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
let errors = 0;
function fail(m) { errors++; console.log('ERREUR: ' + m); }

console.log('API: EndRow=', !!(Blockly.inputs && Blockly.inputs.EndRowInput), ' FieldColour=', !!Blockly.FieldColour, ' CodeGenerator=', !!Blockly.CodeGenerator);
console.log('Specs:', GA.SPECS.length, ' visibles:', GA.SPECS.filter(s => !s.hidden && !s.custom).length);

// 1. fonctions PDB citées par les blocs
GA.SPECS.forEach(s => (s.pdb || []).forEach(p => {
  const py = p.replace(/-/g, '_');
  if (!GA.SIGS[py]) fail('bloc ' + s.type + ' cite ' + p + ' absent de la PDB 2.10');
  else if (GA.SIGS[py][2]) console.log('  info: ' + s.type + ' utilise ' + p + ' (dépréciée -> ' + GA.SIGS[py][2] + ')');
}));

// 2. vérif statique du code
const PYC = new Set(DATA.pyconst.concat(['UNIT_PIXEL', 'UNIT_POINT', 'TRUE', 'FALSE']));
function staticCheck(code, name) {
  const noStr = code.replace(/"(?:[^"\\\n]|\\.)*"/g, '""').replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/#.*$/gm, '');
  let m, re = /\bpdb\.([a-z0-9_]+)\s*\(/g;
  while ((m = re.exec(noStr))) if (!GA.SIGS[m[1]]) fail(name + ': pdb.' + m[1] + ' inconnue');
  re = /\b([A-Z][A-Z0-9_]{2,})\b/g;
  while ((m = re.exec(noStr))) if (!PYC.has(m[1]) && !/^CHOIX_/.test(m[1]) && !/^PF_/.test(m[1])) fail(name + ': constante ' + m[1] + ' inconnue');
  if (/RUN_NONINTERACTIVE/.test(noStr)) fail(name + ': run_mode passé');
}
function gen(state, name, opts) {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(state, ws);
  const res = GA.buildPython(ws, opts || GA.defaultOpts());
  const issues = GA.checkProgram(ws, opts || GA.defaultOpts());
  staticCheck(res.code, name);
  fs.writeFileSync(path.join(out, name + '.py'), res.code.replace(/\n/g, '\r\n'));
  // round-trip sérialisation
  const again = Blockly.serialization.workspaces.save(ws);
  const ws2 = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(again, ws2);
  const res2 = GA.buildPython(ws2, opts || GA.defaultOpts());
  if (res2.code !== res.code) fail(name + ': code différent après sauvegarde/rechargement');
  ws.dispose(); ws2.dispose();
  return { res, issues };
}

// 3. exemples
GA.exampleDefs.forEach(ex => {
  const { res, issues } = gen(ex.build(), 'exemple_' + ex.id);
  const errs = issues.filter(i => i.level === 'error');
  if (errs.length) fail('exemple ' + ex.id + ' : ' + JSON.stringify(errs));
  console.log('exemple ' + ex.id + ': ' + res.code.split('\n').length + ' lignes, avertissements=' + issues.filter(i => i.level === 'warn').length);
});
// 4. projet vide
gen(GA.emptyProject(), 'vide');

// 5. un programme par bloc
const e = { b: (t, f, i) => GA.blockState(t, f, i), s: n => ({ type: 'g_setting_get', fields: { NAME: n } }) };
const b = e.b, s = e.s;
const pathActive = () => b('path_active');
const textLayer = () => b('img_layer_by_name', null, { NAME: 'text #1' });
function fillers(type) {
  const f = {};
  const sp = GA.SPEC[type];
  for (const k in sp.args) {
    const a = sp.args[k];
    if (a.k === 'st') f[k] = [b('msg_show', null, { T: 'dedans' })];
    if (a.k !== 'v') continue;
    const chk = a.check ? a.check.join(',') : '';
    if (a.req) {
      if (chk === 'Vectors') f[k] = pathActive();
      else if (chk === 'Boolean') f[k] = b('op_bool', { V: type === 'c_while' ? 'FALSE' : 'TRUE' });
      else if (chk === 'Array') f[k] = type === 'path_add' ? b('path_points', null, { V: pathActive() }) : b('op_split', null, { T: 'a;b', SEP: ';' });
      else if (chk === 'Layer' && type.startsWith('txt_')) f[k] = textLayer();
      else if (chk === 'Layer') f[k] = b('img_layer_by_name', null, { NAME: 'Groupe' });
      else if (k === 'P' && type === 'path_px') f[k] = b('g_list_get', null, { N: 1, L: b('path_points', null, { V: pathActive() }) });
      else f[k] = b('g_value', { TEXT: 'x' });
    }
  }
  const file = s('fichier'), dir = s('dossier');
  if (['file_read', 'file_lines', 'file_open', 'lyr_import'].includes(type)) f.P = file;
  if (['file_exists', 'file_part'].includes(type)) f.P = file;
  if (['file_save_xcf', 'file_png', 'file_jpg', 'file_layer_png', 'file_write', 'file_mkdir'].includes(type)) f.P = b('file_join', null, { D: dir, N: 'sortie.png' });
  if (['file_join', 'file_list'].includes(type)) f.D = dir;
  if (type === 'c_foreach_file') f.DIR = dir;
  if (type === 'op_to_number') f.T = '12,5';
  if (type === 'lyr_to_group') f.L = b('img_layer_by_name', null, { NAME: 'Bulle' });
  return f;
}
const settings = [b('set_file', { NAME: 'fichier', LABEL: 'Fichier' }), b('set_dir', { NAME: 'dossier', LABEL: 'Dossier' }),
  b('set_option', { NAME: 'choix', LABEL: 'Choix', OPTS: 'Un; Deux', DEF: 2 })];
const pre = [b('g_var_set', { VAR: 'ma_variable' }, { X: 0 }), b('g_list_empty', { VAR: 'ma_liste' })];
let count = 0;
GA.SPECS.forEach(sp => {
  if (sp.custom || sp.kind === 'hat' || sp.kind === 'setting') return;
  let blk;
  const fields = sp.type.startsWith('g_setting') ? { NAME: 'choix' } : null;
  blk = b(sp.type, fields, fillers(sp.type));
  let action = sp.out !== undefined ? b('g_var_set', { VAR: 'resultat' }, { X: blk }) : blk;
  const st = { type: 'g_start', x: 0, y: 0, fields: { LABEL: 'Test ' + sp.type, MENU: '<Image>/Filters/Mes scripts', NEEDS: true },
    inputs: { SETTINGS: { block: GA.chain(JSON.parse(JSON.stringify(settings))) }, DO: { block: GA.chain(JSON.parse(JSON.stringify(pre)).concat([action])) } } };
  const { issues } = gen({ blocks: { languageVersion: 0, blocks: [st] } }, 'bloc_' + sp.type);
  issues.filter(i => i.level === 'error').forEach(i => fail('bloc ' + sp.type + ' : ' + i.msg));
  count++;
});
// réglages : un programme avec tous les types
const allSettings = GA.SPECS.filter(sp => sp.kind === 'setting').map(sp => b(sp.type, { NAME: sp.type.replace('set_', 'r_'), LABEL: 'Réglage ' + sp.type }));
const useAll = GA.SPECS.filter(sp => sp.kind === 'setting').map(sp => b('g_var_set', { VAR: 'v_' + sp.type }, { X: s(sp.type.replace('set_', 'r_')) }));
useAll.push(b('g_var_set', { VAR: 'texte_choix' }, { X: { type: 'g_setting_choice', fields: { NAME: 'r_option' } } }));
gen({ blocks: { languageVersion: 0, blocks: [{ type: 'g_start', x: 0, y: 0, fields: { LABEL: 'Tous les réglages', MENU: 'CUSTOM', NEEDS: false },
  inputs: { SETTINGS: { block: GA.chain(allSettings) }, DO: { block: GA.chain(useAll) } } }] } }, 'tous_les_reglages',
  Object.assign(GA.defaultOpts(), { menuCustom: '<Image>/Filters/Test', extraImports: ['sys', 're'] }));
// fonctions avancées
[['g_pdb_call', 'gimp_drawable_fill'], ['g_pdb_value', 'gimp_image_width'], ['g_pdb_call', 'gimp_paintbrush_default'], ['g_pdb_value', 'gimp_selection_bounds'], ['g_pdb_call', 'plug_in_gauss']].forEach(([t, p], i) => {
  const blk = GA.pdbBlockState(t, p);
  const act = t === 'g_pdb_value' ? b('g_var_set', { VAR: 'resultat' }, { X: blk }) : blk;
  const st = { type: 'g_start', x: 0, y: 0, fields: { LABEL: 'PDB ' + p, MENU: '<Image>/Python-Fu', NEEDS: true }, inputs: { DO: { block: act } } };
  gen({ blocks: { languageVersion: 0, blocks: [st] } }, 'pdb_' + p);
});
// options désactivées
gen(GA.exampleDefs[0].build(), 'options_off', Object.assign(GA.defaultOpts(), { undo: false, errors: false, context: false, flush: false }));

// 6. boîte à outils & recherche
const tb = GA.buildToolbox();
console.log('Toolbox:', tb.contents.length, 'catégories');
['calque', 'bulle', 'breaker', 'gauss', 'enregistrer xcf', 'texte'].forEach(q => console.log('  recherche "' + q + '":', GA.search(q).length - 1, 'résultats'));
const ws = new Blockly.Workspace();
Blockly.serialization.workspaces.load(GA.exampleDefs[1].build(), ws);
console.log('flyout réglages:', GA.startFlyout(ws).length, 'éléments ; flyout variables:', GA.varsFlyout(ws).length);
console.log('Programmes par bloc:', count, ' | erreurs:', errors);
process.exit(errors ? 1 : 0);
