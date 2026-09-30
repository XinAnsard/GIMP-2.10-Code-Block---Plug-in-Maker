/* Valeurs prédites : quand on clique une case, l'atelier propose ce qu'on écrit presque toujours à cet endroit
   (register(...), paramètres PF_…, arguments des fonctions GIMP). */
(function (root) {
'use strict';
var GA = root.GA = root.GA || {};
var T = function (x) { return GA.T ? GA.T(x) : x; };
var IDENT = /^[A-Za-z_]\w*$/;
function q(s) { return JSON.stringify(String(s)); }
function unq(code) { var m = /^[urUR]?(["'])(.*)\1$/.exec(String(code || '').trim()); return m ? m[2] : null; }

/* ---------- mémoire des auteurs (retenus à chaque import / modification) ---------- */
var AKEY = 'atelier-gimp-authors';
function authors() { try { return JSON.parse(localStorage.getItem(AKEY) || '[]'); } catch (e) { return []; } }
GA.rememberAuthor = function (name) {
  name = String(name || '').trim();
  if (!name || name.length > 60) return;
  var a = authors().filter(function (x) { return x !== name; });
  a.unshift(name);
  try { localStorage.setItem(AKEY, JSON.stringify(a.slice(0, 8))); } catch (e) { /* ok */ }
};

/* ---------- ce que contient register(...) ---------- */
var PF = {
  PF_IMAGE: ['None', null, 'l\'image', 'image'], PF_DRAWABLE: ['None', null, 'le calque actif', 'drawable'],
  PF_LAYER: ['None', null, 'un calque', 'layer'], PF_CHANNEL: ['None', null, 'un canal', 'channel'], PF_VECTORS: ['None', null, 'un chemin', 'path'],
  PF_TOGGLE: ['True', null, 'une case à cocher', 'option'], PF_BOOL: ['True', null, 'oui / non', 'option'],
  PF_INT: ['0', null, 'un nombre entier', 'number'], PF_FLOAT: ['0.0', null, 'un nombre à virgule', 'value'],
  PF_SLIDER: ['50', '(0, 100, 1)', 'un curseur (min, max, pas)', 'amount'], PF_SPINNER: ['10', '(1, 100, 1)', 'un nombre avec flèches (min, max, pas)', 'size'],
  PF_ADJUSTMENT: ['10', '(1, 100, 1)', 'comme PF_SPINNER', 'size'],
  PF_STRING: ['""', null, 'un texte sur une ligne', 'text'], PF_TEXT: ['""', null, 'un texte sur plusieurs lignes', 'text'],
  PF_COLOR: ['(0, 0, 0)', null, 'une couleur', 'color'], PF_OPTION: ['0', '["Option 1", "Option 2"]', 'une liste déroulante', 'choice'],
  PF_RADIO: ['"a"', '(("Choix A", "a"), ("Choix B", "b"))', 'des boutons radio', 'choice'],
  PF_FONT: ['"Sans-serif"', null, 'une police', 'font'], PF_BRUSH: ['None', null, 'une brosse', 'brush'], PF_PATTERN: ['None', null, 'un motif', 'pattern'],
  PF_GRADIENT: ['None', null, 'un dégradé', 'gradient'], PF_PALETTE: ['None', null, 'une palette', 'palette'],
  PF_FILE: ['""', null, 'un fichier', 'filename'], PF_FILENAME: ['""', null, 'un fichier', 'filename'], PF_DIRNAME: ['""', null, 'un dossier', 'folder']
};
var PF_ORDER = ['PF_IMAGE', 'PF_DRAWABLE', 'PF_TOGGLE', 'PF_INT', 'PF_STRING', 'PF_OPTION', 'PF_SPINNER', 'PF_SLIDER', 'PF_COLOR', 'PF_FONT', 'PF_FLOAT',
  'PF_TEXT', 'PF_RADIO', 'PF_BOOL', 'PF_LAYER', 'PF_CHANNEL', 'PF_VECTORS', 'PF_FILE', 'PF_DIRNAME', 'PF_BRUSH', 'PF_PATTERN', 'PF_GRADIENT', 'PF_PALETTE', 'PF_ADJUSTMENT', 'PF_FILENAME'];
GA.PF_INFO = PF; GA.PF_ORDER = PF_ORDER;
GA.pfTuple = function (type, name, desc) {
  var p = PF[type] || PF.PF_INT;
  name = name || p[3];
  return '(' + [type, q(name), q(desc || name.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); })), p[0]].concat(p[1] ? [p[1]] : []).join(', ') + ')';
};
var MENUS = [['<Image>/Filters', 'menu Filtres'], ['<Image>/Layer', 'menu Calque'], ['<Image>/Python-Fu', 'son propre menu Python-Fu'], ['<Image>/Image', 'menu Image'],
  ['<Image>/Colors', 'menu Couleurs'], ['<Image>/Select', 'menu Sélection'], ['<Image>/Edit', 'menu Édition'], ['<Image>/File', 'menu Fichier'], ['<Image>/Tools', 'menu Outils'],
  ['<Image>/Filters/Artistic', 'Filtres ▸ Artistiques'], ['<Image>/Filters/Light and Shadow', 'Filtres ▸ Ombres et lumières'], ['<Image>/Filters/Decor', 'Filtres ▸ Décor'],
  ['<Layers>', 'clic droit dans la fenêtre Calques'], ['<Toolbox>/Xtns', 'sans image ouverte (menu Fichier ▸ Créer)']];
var IMAGETYPES = [['"*"', 'toutes les images'], ['"RGB*, GRAY*"', 'couleur et niveaux de gris'], ['"RGB*"', 'images couleur'], ['""', 'aucune image nécessaire (menu <Toolbox>)'],
  ['"RGBA"', 'couleur avec transparence'], ['"GRAY*"', 'niveaux de gris'], ['"INDEXED*"', 'images indexées']];

function wsOf(b) { var ws = b && b.workspace; return ws && (ws.targetWorkspace || ws); }
function codeOf(b) {
  if (!b) return '';
  if (b.type === 'py_var') return String(b.getFieldValue('NAME'));
  if (b.type === 'py_leaf') return String(b.getFieldValue('CODE'));
  try { var r = GA.G.blockToCode(b); return String(Array.isArray(r) ? r[0] : r).replace(/[\u0000-\u0007][^\u0002]*?\u0002|[\u0000-\u0007]/g, ''); } catch (e) { return ''; }
}
function argBlock(call, i) { var inp = call.getInput('A' + i); return inp && inp.connection && inp.connection.targetBlock(); }
/* le nom du script : fonction passée à register, sinon première fonction, sinon nom du fichier */
function scriptSlug(ws, call) {
  var f = call && argBlock(call, 10);
  if (f && f.type === 'py_var') return f.getFieldValue('NAME');
  var d = ws && ws.getBlocksByType('py_def', false)[0];
  if (d) return d.getFieldValue('NAME');
  var hat = ws && GA.getFileHat && GA.getFileHat(ws);
  return (hat && GA.pyIdent ? GA.pyIdent(hat.getFieldValue('NAME'), 'mon_script') : 'mon_script');
}
function human(slug) { return String(slug).replace(/^python_fu_|^plug_in_|^script_fu_/, '').replace(/_+/g, ' ').trim().replace(/^./, function (c) { return c.toUpperCase(); }); }
function year() { return String(new Date().getFullYear()); }
function today() { return new Date().toISOString().slice(0, 10); }

/* où se trouve ce bloc ? */
function context(b) {
  var parent = b && b.getParent && b.getParent();
  if (!parent) return null;
  var inp = parent.getInputWithBlock(b);
  if (!inp) return null;
  var m = /^([AE])(\d+)$/.exec(inp.name);
  if (!m) return null;
  var i = +m[2];
  if (m[1] === 'A' && (parent.type === 'py_call' || parent.type === 'py_callst')) {
    return { kind: 'call', call: parent, i: i, func: String(parent.getFieldValue('FUNC') || ''), arg: (parent.a_ || [])[i] || 'p' };
  }
  if (m[1] === 'E' && parent.type === 'py_list' && parent.k_ === 'ptuple') return { kind: 'pf', tuple: parent, i: i };
  if (m[1] === 'E' && parent.type === 'py_list') {
    var gp = parent.getParent && parent.getParent(), gi = gp && gp.getInputWithBlock(parent);
    if (gp && /^py_call/.test(gp.type) && gp.getFieldValue('FUNC') === 'register' && gi && (gi.name === 'A8' || gi.name === 'A9')) return { kind: 'params', list: parent, i: i };
  }
  return null;
}
function item(v, desc, cls) { return { v: v, chip: v, desc: desc || '', cls: cls || (IDENT.test(v) ? (GA.isPyConst && GA.isPyConst(v) ? 'const' : 'var') : 'val') }; }

function registerHints(ctx, cur) {
  var ws = wsOf(ctx.call), slug = scriptSlug(ws, ctx.call), lab = human(slug), out = [];
  var idx = ctx.arg === 'p' ? ctx.i : { 'k:proc_name': 0, 'k:blurb': 1, 'k:help': 2, 'k:author': 3, 'k:copyright': 4, 'k:date': 5, 'k:label': 6, 'k:imagetypes': 7, 'k:params': 8, 'k:results': 9, 'k:function': 10, 'k:menu': 11 }[ctx.arg];
  if (idx === undefined) return null;
  var who = authors(), cv = unq(cur);
  if (idx === 0) { out.push(item(q('python_fu_' + slug.replace(/^python_fu_/, '')), 'nom unique habituel')); out.push(item(q(slug), 'le nom de la fonction')); }
  if (idx === 1 || idx === 2) { out.push(item(q(lab), 'le nom lisible')); out.push(item(q(lab + '…'), '')); }
  if (idx === 3 || idx === 4) {
    who.forEach(function (a) { out.push(item(q(a), 'déjà utilisé')); });
    if (idx === 4) { out.push(item(q(year()), 'l\'année')); if (who[0]) out.push(item(q('Copyright ' + year() + ' ' + who[0]), '')); out.push(item('"GPL v3"', 'licence libre')); out.push(item('"MIT"', 'licence libre')); }
  }
  if (idx === 5) { out.push(item(q(year()), 'cette année')); out.push(item(q(today()), 'aujourd\'hui')); }
  if (idx === 6) {
    // avec menu="…" à part, le libellé est court ; sinon c'est le chemin complet
    var hasMenu = (ctx.call.a_ || []).indexOf('k:menu') >= 0;
    if (hasMenu) out.push(item(q(lab + '...'), 'le nom dans le menu'));
    MENUS.forEach(function (m) { if (!hasMenu && m[0].indexOf('<Image>') === 0) out.push(item(q(m[0] + '/' + lab + '...'), m[1])); });
    if (!hasMenu) out.push(item(q(lab + '...'), 'le nom seul (avec menu="…")'));
  }
  if (idx === 11) MENUS.forEach(function (m) { out.push(item(q(m[0]), m[1])); });
  if (idx === 7) IMAGETYPES.forEach(function (t) { out.push(item(t[0], t[1])); });
  if (idx === 8) { out.push(item('[' + GA.pfTuple('PF_IMAGE') + ', ' + GA.pfTuple('PF_DRAWABLE') + ']', 'image + calque actif (le plus courant)')); out.push(item('[]', 'aucun réglage')); }
  if (idx === 9) out.push(item('[]', 'rien (le plus courant)'));
  if (idx === 10 && ws) ws.getBlocksByType('py_def', false).forEach(function (d) { out.push(item(d.getFieldValue('NAME'), 'ta fonction (' + d.getFieldValue('ARGS') + ')', 'def')); });
  if (cv !== null && idx >= 3 && idx <= 4 && cv) GA.rememberAuthor(cv);
  return { head: T('register') + ' · ' + T(['nom', 'description', 'aide', 'auteur', 'copyright', 'date', 'libellé', 'types d\'image', 'paramètres', 'résultats', 'fonction', 'menu'][idx]), items: out };
}
function pfHints(ctx) {
  var t0 = ctx.tuple.getInput('E0'), tb = t0 && t0.connection.targetBlock(), type = tb ? codeOf(tb) : '', p = PF[type], out = [];
  if (ctx.i === 0) {
    PF_ORDER.forEach(function (k) { var x = item(k, PF[k][2], 'const'); x.pf = true; out.push(x); });
    return { head: T('Type de réglage (la case s\'adapte toute seule)'), items: out };
  }
  if (ctx.i === 1 && p) { out.push(item(q(p[3]), '')); if (type === 'PF_IMAGE') out.push(item('"img"', '')); if (type === 'PF_DRAWABLE') out.push(item('"layer"', '')); }
  if (ctx.i === 2 && p) { var nb = ctx.tuple.getInput('E1'), nm = unq(codeOf(nb && nb.connection.targetBlock())) || p[3]; out.push(item(q(human(nm)), '')); if (type === 'PF_IMAGE') out.push(item('"Input image"', '')); if (type === 'PF_DRAWABLE') out.push(item('"Input drawable"', '')); }
  if (ctx.i === 3 && p) {
    out.push(item(p[0], 'valeur de départ habituelle'));
    if (/TOGGLE|BOOL/.test(type)) out.push(item(p[0] === 'True' ? 'False' : 'True', ''));
    if (type === 'PF_COLOR') { out.push(item('(255, 255, 255)', 'blanc')); out.push(item('(255, 0, 0)', 'rouge')); }
    if (/SLIDER|SPINNER|ADJUSTMENT|INT/.test(type)) ['0', '1', '10', '100'].forEach(function (v) { if (v !== p[0]) out.push(item(v, '')); });
  }
  if (ctx.i === 4 && p && p[1]) {
    out.push(item(p[1], 'habituel'));
    if (/SLIDER|SPINNER|ADJUSTMENT/.test(type)) { out.push(item('(0, 255, 1)', '0 à 255')); out.push(item('(1, 1000, 1)', '1 à 1000 pixels')); out.push(item('(0, 1, 0.01)', '0 à 1, précis')); }
  }
  return out.length ? { head: T('Réglage') + ' ' + type, items: out } : null;
}
/* arguments des fonctions GIMP (pdb.…) d'après leur type */
function pdbHints(ctx, blk) {
  var sig = GA.SIGS && GA.SIGS[ctx.func.slice(4)];
  if (!sig || ctx.arg !== 'p') return null;
  var a = sig[4][ctx.i];
  if (!a) return null;
  var k = a[1], out = [], ws = wsOf(blk), vars = (GA.scriptVarList ? GA.scriptVarList(ws) : []).map(function (p) { return p[0]; });
  function like(re) { return vars.filter(function (n) { return re.test(n); }); }
  if (a[4]) out.push(item('None', 'rien (facultatif)'));
  if (k === 'enum') (GA.enumOptions ? GA.enumOptions(a) : []).forEach(function (o) { out.push(item(o[1], o[0].replace(/ \(.*\)$/, '') === o[1] ? '' : o[0], 'const')); });
  else if (k === 'boolean') { out.push(item('True', 'oui')); out.push(item('False', 'non')); }
  else if (k === 'image') { ['image'].concat(like(/im(a?g|age)/i)).forEach(function (n, i, arr) { if (arr.indexOf(n) === i) out.push(item(n, '')); }); out.push(item('gimp.image_list()[0]', 'la dernière image ouverte')); }
  else if (k === 'drawable' || k === 'layer' || k === 'item') {
    ['drawable'].concat(like(/layer|calque|drawable|lyr/i)).forEach(function (n, i, arr) { if (arr.indexOf(n) === i) out.push(item(n, '')); });
    out.push(item('pdb.gimp_image_get_active_drawable(image)', 'le calque actif'));
  } else if (k === 'color') { out.push(item('(0, 0, 0)', 'noir')); out.push(item('(255, 255, 255)', 'blanc')); out.push(item('gimp.get_foreground()', 'couleur de premier plan')); out.push(item('gimp.get_background()', 'couleur d\'arrière-plan')); }
  else if (/^(int32|int16|int8|float)$/.test(k)) {
    var r = /(-?[\d.]+)\s*<=\s*\w+\s*<=\s*(-?[\d.]+)/.exec(a[2] || '');
    if (/width/i.test(a[0])) out.push(item('image.width', 'largeur de l\'image'));
    if (/height/i.test(a[0])) out.push(item('image.height', 'hauteur de l\'image'));
    if (/opacity/i.test(a[0])) out.push(item('100', 'opaque'));
    if (r) { out.push(item(r[1], 'minimum')); out.push(item(r[2], 'maximum')); }
  } else if (k === 'string') { if (/name/i.test(a[0])) out.push(item('"Calque"', '')); out.push(item('""', 'texte vide')); }
  return out.length ? { head: a[0] + ' — ' + (a[3] || k), items: out } : null;
}
GA.valueHints = function (blk) {
  var ctx = context(blk);
  if (!ctx) return null;
  var cur = codeOf(blk);
  if (ctx.kind === 'call' && ctx.func === 'register') return registerHints(ctx, cur);
  if (ctx.kind === 'call' && /^pdb\./.test(ctx.func)) return pdbHints(ctx, blk);
  if (ctx.kind === 'pf') return pfHints(ctx);
  if (ctx.kind === 'params') return { head: T('Ajouter un réglage'), items: PF_ORDER.slice(0, 12).map(function (k) { var x = item(GA.pfTuple(k), PF[k][2], 'val'); return x; }) };
  return null;
};

/* ---------- appliquer un choix ---------- */
/* remplace un bloc valeur par le code donné (en blocs) ; renvoie le nouveau bloc */
GA.replaceValue = function (blk, code) {
  var parent = blk.getParent(), inp = parent && parent.getInputWithBlock(blk);
  if (!inp || !GA.pySnippet) return null;
  var st = GA.pySnippet('_ = ' + code), v = st && st.type === 'py_assign' && st.inputs && st.inputs.V && st.inputs.V.block;
  if (!v) return null;
  var nb = null;
  Blockly.Events.setGroup(true);
  try {
    blk.dispose(false);
    nb = Blockly.serialization.blocks.append(v, wsOf(parent));
    inp.connection.connect(nb.outputConnection);
  } finally { Blockly.Events.setGroup(false); }
  return nb;
};
/* choisir un type PF_… : le tuple entier se complète (valeur de départ, min/max, options) */
GA.applyPfType = function (blk, type) {
  var ctx = context(blk);
  if (!ctx || ctx.kind !== 'pf' || !PF[type]) return false;
  var t = ctx.tuple, p = PF[type];
  function at(i) { var inp = t.getInput('E' + i); return inp && inp.connection.targetBlock(); }
  var name = at(1) ? codeOf(at(1)) : q(p[3]), desc = at(2) ? codeOf(at(2)) : q(human(p[3]));
  var code = '(' + [type, name, desc, p[0]].concat(p[1] ? [p[1]] : []).join(', ') + ')';
  return !!GA.replaceValue(t, code);
};
/* après un choix dans les suggestions d'une case valeur */
GA.pickHint = function (blk, it) {
  if (!blk) return;
  if (it.pf) { GA.applyPfType(blk, it.v); return; }
  var isName = IDENT.test(it.v) && !/^(True|False|None)$/.test(it.v);
  if (blk.type === 'py_var' && isName) { blk.setFieldValue(it.v, 'NAME'); return; }
  if (blk.type === 'py_leaf' && !isName && !/[[(,{]/.test(it.v)) { blk.setFieldValue(it.v, 'CODE'); return; }
  GA.replaceValue(blk, it.v);
};
/* un script importé ou modifié : on retient son auteur pour le proposer la prochaine fois */
GA.learnFromWorkspace = function (ws) {
  if (!ws) return;
  ws.getAllBlocks(false).forEach(function (b) {
    if (!/^py_call/.test(b.type) || b.getFieldValue('FUNC') !== 'register') return;
    var a = argBlock(b, 3), v = a && a.type === 'py_leaf' ? unq(a.getFieldValue('CODE')) : null;
    if (v) GA.rememberAuthor(v);
  });
};

/* ---------- modèles à glisser (catégorie Python) ---------- */
GA.registerTemplate = function (ws) {
  var slug = scriptSlug(ws, null), lab = human(slug), who = authors()[0] || 'Moi';
  return 'register(\n    ' + [q('python_fu_' + slug.replace(/^python_fu_/, '')), q(lab), q(lab), q(who), q(who), q(year()), q('<Image>/Filters/' + lab + '...'), '"*"',
    '[\n        ' + GA.pfTuple('PF_IMAGE', 'image', 'Input image') + ',\n        ' + GA.pfTuple('PF_DRAWABLE', 'drawable', 'Input drawable') + '\n    ]', '[]', slug].join(',\n    ') + ')\n\nmain()';
};
GA.registerFlyout = function (ws) {
  var out = [{ kind: 'label', text: T('📋 Déclarer le plug-in (register) :'), 'web-class': 'gaSep' },
    { kind: 'label', text: T('Déjà rempli avec ton nom, l\'année et ta fonction : clique une case pour d\'autres choix.'), 'web-class': 'gaHint' }];
  var st = GA.pySnippet && GA.pySnippet(GA.registerTemplate(ws));
  if (st) { st.kind = 'block'; out.push(st); }
  out.push({ kind: 'label', text: T('Réglages à glisser dans la liste des paramètres :'), 'web-class': 'gaHint' });
  PF_ORDER.slice(0, 13).forEach(function (k) {
    var s = GA.pySnippet && GA.pySnippet('_ = ' + GA.pfTuple(k)), v = s && s.inputs && s.inputs.V && s.inputs.V.block;
    if (v) { v.kind = 'block'; out.push(v); }
  });
  return out;
};
})(typeof window !== 'undefined' ? window : globalThis);
