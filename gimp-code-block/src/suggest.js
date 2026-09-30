/* Atelier — suggestions pendant la frappe : fonctions de GIMP (PDB), fonctions Python, variables, attributs */
(function (root) {
'use strict';
var GA = root.GA;
var T = function (x) { return GA.T ? GA.T(x) : x; };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]; }); }
function norm(s) { return GA.translit(String(s || '')).toLowerCase(); }

/* mots français → mots des noms de fonctions GIMP (tous en anglais) */
var FR = {
  flou: 'blur gauss', flouter: 'blur gauss', calque: 'layer', calques: 'layer', selection: 'select selection', selectionner: 'select', texte: 'text', couleur: 'color colour',
  remplir: 'fill', remplissage: 'fill', chemin: 'vectors path', chemins: 'vectors path', trace: 'vectors stroke', pinceau: 'brush', brosse: 'brush', ombre: 'shadow',
  tourner: 'rotate', rotation: 'rotate', redimensionner: 'scale resize', taille: 'size scale resize', agrandir: 'scale resize', copier: 'copy', coller: 'paste', couper: 'cut',
  sauver: 'save', enregistrer: 'save', exporter: 'save export', ouvrir: 'load open', charger: 'load', fichier: 'file', nouveau: 'new', nouvelle: 'new', creer: 'new create',
  supprimer: 'delete remove', effacer: 'clear erase', opacite: 'opacity', masque: 'mask', canal: 'channel', canaux: 'channel', grille: 'grid', police: 'font', degrade: 'gradient blend',
  motif: 'pattern', annuler: 'undo', afficher: 'display flush', rafraichir: 'flush', recadrer: 'crop', largeur: 'width', hauteur: 'height', dupliquer: 'copy duplicate',
  fusionner: 'merge', aplatir: 'flatten', inverser: 'invert', nettete: 'sharpen unsharp', bruit: 'noise', contour: 'stroke border outline', gomme: 'eraser', visible: 'visible',
  nom: 'name', actif: 'active', active: 'active', premier: 'foreground', avant: 'foreground', arriere: 'background', fond: 'background', luminosite: 'brightness', contraste: 'contrast',
  teinte: 'hue', saturation: 'saturation', niveaux: 'levels', courbes: 'curves', desaturer: 'desaturate', seuil: 'threshold', miroir: 'flip', retourner: 'flip', deplacer: 'offset translate',
  position: 'offsets position', image: 'image', guide: 'guide', rectangle: 'rect rectangle', ellipse: 'ellipse', rond: 'ellipse', cercle: 'ellipse', progression: 'progress', message: 'message',
  pixel: 'pixel', groupe: 'group', lier: 'link', verrouiller: 'lock', filtre: 'plug_in', filtres: 'plug_in', encre: 'ink', crayon: 'pencil', aerographe: 'airbrush', dessiner: 'paint'
};
function expand(tok) {
  var alts = [tok];
  if (FR[tok]) alts = alts.concat(FR[tok].split(' '));
  return alts;
}
function wordStart(hay, w) { var i = hay.indexOf(w); return i === 0 || (i > 0 && /[_.\s]/.test(hay.charAt(i - 1))); }
/* score d'un nom pour une requête : 0 = ne correspond pas */
function scoreText(name, desc, q) {
  var n = norm(name), d = norm(desc || ''), qs = q.replace(/\s+/g, '_');
  var s = 0;
  if (!q) return 1;
  if (n === qs) s += 1000;
  else if (n.indexOf(qs) === 0) s += 500;
  else if (wordStart(n, qs)) s += 300;
  else if (n.indexOf(qs) >= 0) s += 200;
  var toks = q.split(/[\s_]+/).filter(Boolean), all = true;
  toks.forEach(function (t) {
    var best = 0;
    expand(t).forEach(function (w) {
      if (wordStart(n, w)) best = Math.max(best, 40);
      else if (n.indexOf(w) >= 0) best = Math.max(best, 25);
      else if (d.indexOf(w) >= 0) best = Math.max(best, 6);
    });
    if (!best) all = false;
    s += best;
  });
  if (!all && s < 200) {
    // lettres dans l'ordre (ex. « insrtlay » → gimp_image_insert_layer)
    var j = 0, flat = qs.replace(/_/g, '');
    for (var i = 0; i < n.length && j < flat.length; i++) if (n.charAt(i) === flat.charAt(j)) j++;
    return j === flat.length && flat.length >= 3 ? 3 : 0;
  }
  return s;
}

/* ---------- fonctions de la PDB ---------- */
var popRank = null;
GA.pdbSearch = function (q, group, limit) {
  var SIGS = GA.SIGS || {};
  if (!popRank) { popRank = {}; (GA.POPULAR || []).forEach(function (p, i) { popRank[p] = i; }); }
  q = norm(q).replace(/^pdb\./, '').replace(/-/g, '_').trim();
  var hits = [];
  Object.keys(SIGS).forEach(function (n) {
    var s = SIGS[n];
    if (group && s[0] !== group) return;
    var sc = scoreText(n, s[1], q);
    if (!sc) return;
    if (popRank[n] !== undefined) sc += 30 - Math.min(29, popRank[n] * 0.3);
    if (s[2]) sc -= 60;
    hits.push({ n: n, sc: sc });
  });
  hits.sort(function (a, b) { return b.sc - a.sc || a.n.localeCompare(b.n); });
  return { total: hits.length, list: hits.slice(0, limit || 60).map(function (h) { return h.n; }) };
};
GA.pdbArgs = function (py) {
  var s = GA.SIGS[py];
  if (!s) return '';
  return '(' + s[4].map(function (a) { return a[0]; }).join(', ') + ')' + (s[5].length ? ' → ' + s[5].map(function (o) { return o[0]; }).join(', ') : '');
};
/* groupe → couleur de pastille (pour s'y retrouver d'un coup d'œil) */
var GROUP_COL = { image: '#3A7BD5', image_select: '#1E88A8', selection: '#1E88A8', layer: '#7A5AF8', item: '#6C63C9', text_layer: '#A0527A', text_tool: '#A0527A',
  context: '#D08A1C', drawable_edit: '#2E9E6A', edit: '#2E9E6A', vectors: '#B5533C', fileops: '#5F6B7A', plug_in_compat: '#C0417A', message: '#2F8F5B', progress: '#2F8F5B',
  channel: '#4E7A8E', image_undo: '#6B7385', display: '#6B7385', drawable: '#3F8F8A', drawable_color: '#C77A12', external: '#8A5A2B' };
GA.pdbColour = function (py) { var s = GA.SIGS[py]; return (s && GROUP_COL[s[0]]) || '#414B60'; };

/* ---------- sources par genre de champ ---------- */
var PY_FUNCS = [
  ['len', 'Nombre d\'éléments d\'une liste ou de lettres d\'un texte.'], ['range', 'Une suite de nombres : range(10) → 0…9.'], ['str', 'Transforme en texte.'],
  ['int', 'Transforme en nombre entier.'], ['float', 'Transforme en nombre à virgule.'], ['min', 'La plus petite valeur.'], ['max', 'La plus grande valeur.'],
  ['abs', 'Valeur sans le signe moins.'], ['round', 'Arrondit un nombre.'], ['open', 'Ouvre un fichier.'], ['list', 'Fabrique une liste.'], ['sorted', 'Une copie triée.'],
  ['enumerate', 'Chaque élément avec son numéro.'], ['zip', 'Assemble plusieurs listes deux à deux.'], ['isinstance', 'Vérifie le type d\'une valeur.'],
  ['gimp.message', 'Affiche un message dans GIMP.'], ['gimp.image_list', 'La liste des images ouvertes.'], ['gimp.displays_flush', 'Rafraîchit l\'affichage des images.'],
  ['gimp.Layer', 'Crée un calque (image, nom, largeur, hauteur, type, opacité, mode).'], ['gimp.Image', 'Crée une image (largeur, hauteur, type).'], ['gimp.Display', 'Ouvre une fenêtre pour une image.'],
  ['gimp.progress_init', 'Démarre la barre de progression.'], ['gimp.progress_update', 'Avance la barre de progression (0.0 à 1.0).'],
  ['gimp.get_foreground', 'Couleur de premier plan.'], ['gimp.set_foreground', 'Change la couleur de premier plan.'], ['gimp.get_background', 'Couleur d\'arrière-plan.'],
  ['gimp.set_background', 'Change la couleur d\'arrière-plan.'], ['gimp.delete', 'Supprime un objet GIMP.'], ['register', 'Déclare le plug-in à GIMP (nom, menu, réglages…).'], ['main', 'Lance le plug-in.'],
  ['os.path.join', 'Assemble des morceaux de chemin de fichier.'], ['os.path.exists', 'Le fichier existe-t-il ?'], ['os.listdir', 'Les fichiers d\'un dossier.']
];
var ATTRS = [
  ['name', 'Le nom (calque, image…).'], ['width', 'La largeur en pixels.'], ['height', 'La hauteur en pixels.'], ['layers', 'Les calques de l\'image.'],
  ['active_layer', 'Le calque actif.'], ['active_drawable', 'Le calque ou masque actif.'], ['visible', 'Visible ou caché.'], ['opacity', 'L\'opacité (0 à 100).'],
  ['offsets', 'La position (x, y) du calque.'], ['mode', 'Le mode de fusion.'], ['filename', 'Le fichier de l\'image.'], ['children', 'Les calques d\'un groupe.'],
  ['parent', 'Le groupe qui contient le calque.'], ['mask', 'Le masque du calque.'], ['linked', 'Lié ou non.'], ['lock_alpha', 'Transparence verrouillée.'],
  ['vectors', 'Les chemins de l\'image.'], ['channels', 'Les canaux.'], ['selection', 'La sélection.'], ['base_type', 'RGB, niveaux de gris ou indexé.'],
  ['ID', 'Le numéro interne.'], ['copy', 'Fait une copie (calque).'], ['resize', 'Change la taille du calque.'], ['translate', 'Déplace le calque.'],
  ['set_offsets', 'Place le calque en (x, y).'], ['add_alpha', 'Ajoute la transparence.'], ['fill', 'Remplit le calque.'], ['append', 'Ajoute à la fin d\'une liste.'],
  ['split', 'Coupe un texte en morceaux.'], ['strip', 'Enlève les espaces autour.'], ['replace', 'Remplace dans un texte.'], ['lower', 'En minuscules.'], ['upper', 'En majuscules.'],
  ['format', 'Remplit un texte modèle.'], ['join', 'Assemble une liste de textes.'], ['startswith', 'Commence par… ?'], ['endswith', 'Finit par… ?']
];
function wsOf(field) { var b = field.getSourceBlock(); return b && b.workspace; }
function namesInWorkspace(ws, self, noDefaults) {
  var seen = {}, out = [];
  function add(n, why) {
    n = String(n || '').trim();
    if (!/^[A-Za-z_]\w*$/.test(n) || seen[n] || /^(True|False|None|self)$/.test(n) || (GA.isPyConst(n) && why !== 'variable')) return;
    seen[n] = 1; out.push([n, why]);
  }
  function split(t, why) { String(t || '').split(/[,()\s*=]+/).forEach(function (x) { if (x && !/^['"\d]/.test(x)) add(x, why); }); }
  if (!ws) return out;
  var hat = GA.getFileHat && GA.getFileHat(ws);
  ((hat && hat.vars_) || []).forEach(function (n) { add(n, 'variable créée'); });
  ws.getAllBlocks(false).forEach(function (b) {
    if (b.isInFlyout || b === self) return;
    if (b.type === 'py_assign' || b.type === 'py_augassign') split(b.getFieldValue('T'), 'variable remplie par « = »');
    else if (b.type === 'py_for') split(b.getFieldValue('T'), 'variable de boucle');
    else if (b.type === 'py_def') String(b.getFieldValue('ARGS') || '').split(',').forEach(function (p) { add(p.replace(/[=*].*$/, '').replace(/^\*+/, ''), 'paramètre de ' + b.getFieldValue('NAME')); });
    else if (b.type === 'py_with') for (var i = 0; b.getField('V' + i); i++) split(b.getFieldValue('V' + i), 'ressource « avec »');
    else if (b.type === 'py_var') add(b.getFieldValue('NAME'), 'variable');
  });
  if (noDefaults) return out;
  add('image', 'l\'image sur laquelle le plug-in est lancé');
  add('drawable', 'le calque (ou masque) actif');
  return out;
}
/* les variables d'un script : [[nom, d'où elle vient], …] */
GA.scriptVars = function (ws, self, noDefaults) { return namesInWorkspace(ws, self, noDefaults); };
function defsInWorkspace(ws) {
  var out = [];
  if (ws) ws.getBlocksByType('py_def', false).forEach(function (b) { out.push([b.getFieldValue('NAME'), 'ta fonction (' + b.getFieldValue('ARGS') + ')']); });
  return out;
}
var constList = null;
function rank(pairs, q, max) {
  var hits = [];
  pairs.forEach(function (p) { var sc = scoreText(p[0], p[1], q); if (sc) hits.push({ p: p, sc: sc }); });
  hits.sort(function (a, b) { return b.sc - a.sc; });
  return hits.slice(0, max);
}
/* liste de suggestions : { v: valeur à écrire, chip: texte de la pastille, cls, col, sub, desc } */
function itemsFor(kind, q, field) {
  var qn = norm(q).trim(), out = [];
  if (kind === 'var') {
    rank(namesInWorkspace(wsOf(field), field.getSourceBlock()), qn, 40).forEach(function (h) {
      var c = GA.isPyConst(h.p[0]);
      out.push({ v: h.p[0], chip: h.p[0], cls: c ? 'const' : 'var', desc: c ? T('constante de GIMP') : T(h.p[1]) });
    });
    // constantes de GIMP (FILL_WHITE, NORMAL_MODE…) dès qu'on tape 2 lettres
    if (qn.length >= 2) {
      if (!constList) constList = Object.keys(GA.RESERVED || {}).filter(GA.isPyConst).sort();
      var have = {}; out.forEach(function (o) { have[o.v] = 1; });
      rank(constList.filter(function (n) { return !have[n]; }).map(function (n) { return [n, '']; }), qn, 25).forEach(function (h) { out.push({ v: h.p[0], chip: h.p[0], cls: 'const', desc: T('constante de GIMP') }); });
    }
    return out;
  }
  if (kind === 'attr') {
    rank(ATTRS, qn, 40).forEach(function (h) { out.push({ v: h.p[0], chip: '.' + h.p[0], cls: 'attr', desc: T(h.p[1]) }); });
    return out;
  }
  // fonctions : les tiennes, celles de Python/gimp, puis la PDB
  var isPdb = /^pdb\./.test(qn);
  if (!isPdb) {
    rank(defsInWorkspace(wsOf(field)), qn, 6).forEach(function (h) { out.push({ v: h.p[0], chip: h.p[0], cls: 'def', desc: T(h.p[1]) }); });
    rank(PY_FUNCS, qn, qn ? 6 : 4).forEach(function (h) { out.push({ v: h.p[0], chip: h.p[0], cls: 'fn', desc: T(h.p[1]) }); });
  }
  GA.pdbSearch(qn, null, 50).list.forEach(function (n) {
    var s = GA.SIGS[n];
    out.push({ v: 'pdb.' + n, chip: n, cls: 'pdb', col: GA.pdbColour(n), sub: GA.pdbArgs(n), desc: s[1], old: !!s[2], pdb: n });
  });
  return out;
}

/* ---------- la fenêtre de suggestions ---------- */
var box = null, cur = null;
function close() {
  if (box && box.parentNode) box.parentNode.removeChild(box);
  box = null; cur = null;
}
function place() {
  if (!box || !cur) return;
  var r = cur.input.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
  var w = Math.min(460, vw - 16);
  box.style.width = w + 'px';
  box.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + 'px';
  var below = vh - r.bottom - 12, above = r.top - 12;
  if (below >= 220 || below >= above) { box.style.top = (r.bottom + 4) + 'px'; box.style.bottom = ''; box.style.maxHeight = Math.max(140, below) + 'px'; }
  else { box.style.top = ''; box.style.bottom = (vh - r.top + 4) + 'px'; box.style.maxHeight = Math.max(140, above) + 'px'; }
}
function render() {
  if (!cur) return;
  var items = cur.items = itemsFor(cur.kind, cur.input.value, cur.field);
  // pré-sélection seulement si le début correspond : écrire un nouveau nom puis Entrée ne le remplace pas
  var qn = norm(cur.input.value).trim();
  cur.active = items.length && qn && (norm(items[0].v).indexOf(qn) === 0 || norm(items[0].chip).indexOf(qn) === 0) ? 0 : -1;
  var head = cur.kind === 'var' ? T('Variables de ton script') : cur.kind === 'attr' ? T('Attributs courants') : T('Fonctions — tape un mot (en français ou en anglais)');
  var h = '<div class="sgHead">' + esc(head) + (cur.kind === 'func' ? '<button type="button" class="sgAll">🔍 ' + esc(T('Parcourir tout')) + '</button>' : '') + '</div>';
  if (!items.length) h += '<div class="sgNone">' + esc(T('Rien ne correspond. Tu peux quand même écrire ce que tu veux.')) + '</div>';
  items.forEach(function (it, i) {
    h += '<div class="sgRow' + (i === cur.active ? ' on' : '') + '" data-i="' + i + '">' +
      '<span class="sgChip sg-' + it.cls + '"' + (it.col ? ' style="background:' + it.col + '"' : '') + '>' + (it.cls === 'pdb' ? '⚙️ ' : '') + esc(it.chip) + '</span>' +
      (it.old ? '<span class="tag">' + esc(T('ancienne')) + '</span>' : '') +
      (it.sub ? '<span class="sgSub">' + esc(it.sub) + '</span>' : '') +
      (it.desc ? '<div class="sgDesc">' + esc(it.desc) + '</div>' : '') + '</div>';
  });
  box.innerHTML = h;
  place();
}
function setActive(i) {
  if (!cur || !cur.items.length) return;
  if (i < -1) i = cur.items.length - 1;
  cur.active = (i + cur.items.length) % cur.items.length;
  box.querySelectorAll('.sgRow').forEach(function (r) { r.classList.toggle('on', +r.getAttribute('data-i') === cur.active); });
  var on = box.querySelector('.sgRow.on');
  if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
}
function choose(i) {
  if (!cur || !cur.items[i]) return;
  var it = cur.items[i], c = cur, block = c.field.getSourceBlock();
  c.input.value = it.v;
  c.input.dispatchEvent(new Event('input', { bubbles: true }));
  close();
  root.Blockly.WidgetDiv.hide();
  if (it.pdb && block && GA.pyApplyProc) GA.pyApplyProc(block, it.pdb);
  if (GA.afterSuggest) GA.afterSuggest(block);
}
GA.suggest = {
  open: function (field, kind, input) {
    close();
    if (!input || !root.document) return;
    cur = { field: field, kind: kind, input: input, items: [], active: -1 };
    box = document.createElement('div');
    box.className = 'sgBox';
    box.setAttribute('role', 'listbox');
    document.body.appendChild(box);
    box.addEventListener('mousedown', function (e) { e.preventDefault(); });   // garde le focus dans la case
    box.addEventListener('click', function (e) {
      if (e.target.closest('.sgAll')) {
        var b = cur && cur.field.getSourceBlock();
        close(); root.Blockly.WidgetDiv.hide();
        if (b && GA.onPickProc) GA.onPickProc(b);
        return;
      }
      var row = e.target.closest('.sgRow');
      if (row) choose(+row.getAttribute('data-i'));
    });
    box.addEventListener('mousemove', function (e) { var row = e.target.closest('.sgRow'); if (row && +row.getAttribute('data-i') !== cur.active) setActive(+row.getAttribute('data-i')); });
    var c = cur;
    input.addEventListener('input', function () { if (cur === c) render(); });
    input.addEventListener('blur', function () { setTimeout(function () { if (cur === c) close(); }, 0); });
    input.addEventListener('keydown', function (e) {
      if (cur !== c || !c.items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); setActive(c.active + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if ((e.key === 'Enter' || e.key === 'Tab') && c.active >= 0 && c.items[c.active].v !== input.value) { e.preventDefault(); e.stopImmediatePropagation(); choose(c.active); }
      else if (e.key === 'Escape') { close(); }
    }, true);
    render();
  },
  close: close
};
if (root.addEventListener) {
  root.addEventListener('resize', place);
  root.addEventListener('wheel', function () { if (cur && !document.body.contains(cur.input)) close(); else place(); }, { passive: true });
}
})(typeof window !== 'undefined' ? window : globalThis);
