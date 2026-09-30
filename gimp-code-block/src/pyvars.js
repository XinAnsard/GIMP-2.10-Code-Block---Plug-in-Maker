/* Variables d'un script Python, comme dans Scratch :
   - un clic sur une pastille de variable ouvre un menu de choix (pas besoin de taper) ;
   - clic droit : « renommer partout », « utiliser une autre variable » ;
   - « Créer une variable » marche aussi dans un script importé. */
(function (root) {
'use strict';
var GA = root.GA = root.GA || {};
var T = function (x) { return GA.T ? GA.T(x) : x; };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]; }); }
var IDENT = /^[A-Za-z_]\w*$/;
var KEYWORDS = ('and as assert async await break class continue def del elif else except exec finally for from global if import in is lambda ' +
  'nonlocal not or pass print raise return try while with yield True False None').split(' ');
GA.isPyIdent = function (n) { return IDENT.test(n || '') && KEYWORDS.indexOf(n) < 0; };

/* renomme un identifiant dans du code Python, sans toucher aux textes, aux commentaires,
   aux attributs (obj.x) ni aux noms d'arguments nommés (f(x=1)) */
GA.renameInCode = function (code, from, to) {
  code = String(code || '');
  var out = '', i = 0, n = code.length, depth = 0;
  while (i < n) {
    var c = code[i];
    if (c === '#') { var e = code.indexOf('\n', i); if (e < 0) e = n; out += code.slice(i, e); i = e; continue; }
    if (c === '"' || c === '\'') {
      var q = code.substr(i, 3) === c + c + c ? c + c + c : c, j = i + q.length;
      while (j < n && code.substr(j, q.length) !== q) { if (code[j] === '\\') j++; j++; }
      j = Math.min(n, j + q.length); out += code.slice(i, j); i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      var k = i; while (k < n && /\w/.test(code[k])) k++;
      var w = code.slice(i, k);
      // préfixe de texte (u'', r"", b'') : on laisse la boucle traiter le texte ensuite
      if (w === from && !/\.\s*$/.test(out) && !(depth > 0 && /^\s*=(?!=)/.test(code.slice(k)))) out += to; else out += w;
      i = k; continue;
    }
    if (/[0-9]/.test(c)) { var m = i; while (m < n && /[\w.]/.test(code[m])) m++; out += code.slice(i, m); i = m; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if ((c === ')' || c === ']' || c === '}') && depth) depth--;
    out += c; i++;
  }
  return out;
};

var CODE_FIELDS = { py_leaf: ['CODE'], py_stmt: ['CODE'], py_decorator: ['CODE'], py_def: ['ARGS'], py_assign: ['T'], py_augassign: ['T'], py_for: ['T'] };
function mainWs(b) { var ws = b && b.workspace; return ws && (ws.targetWorkspace || ws); }
/* renomme la variable dans tout le script (une seule étape d'annulation) */
GA.renameScriptVar = function (ws, from, to) {
  if (!ws || !from || !to || from === to) return 0;
  var count = 0;
  Blockly.Events.setGroup(true);
  try {
    ws.getAllBlocks(false).forEach(function (b) {
      function set(name, v) { if (b.getField(name) && b.getFieldValue(name) !== v) { b.setFieldValue(v, name); count++; } }
      if (b.type === 'py_var') { if (b.getFieldValue('NAME') === from) set('NAME', to); return; }
      (CODE_FIELDS[b.type] || []).forEach(function (f) { if (b.getField(f)) set(f, GA.renameInCode(b.getFieldValue(f), from, to)); });
      if (b.type === 'py_with') for (var i = 0; b.getField('V' + i); i++) set('V' + i, GA.renameInCode(b.getFieldValue('V' + i), from, to));
      if (b.type === 'py_try') for (var t = 0; b.getField('N' + t); t++) if (b.getFieldValue('N' + t) === from) set('N' + t, to);
    });
    var hat = GA.getFileHat && GA.getFileHat(ws);
    if (hat && hat.vars_) hat.vars_ = hat.vars_.map(function (v) { return v === from ? to : v; });
  } finally { Blockly.Events.setGroup(false); }
  return count;
};
function askName(title, def, cb) {
  Blockly.dialog.prompt(title, def || '', function (v) {
    if (v == null) return;
    v = String(v).trim();
    if (!GA.isPyIdent(v)) { Blockly.dialog.alert(T('Un nom de variable : des lettres (sans accent), des chiffres et _, sans commencer par un chiffre. Exemple : mon_calque'), function () {}); return; }
    cb(v);
  });
}
GA.askRenameVar = function (ws, from) {
  askName(T('Nouveau nom pour « %1 » (changé partout dans le script) :').replace('%1', from), from, function (to) {
    GA.renameScriptVar(ws, from, to);
    if (ws.refreshToolboxSelection) ws.refreshToolboxSelection();
  });
};
/* « Créer une variable » dans un script : on la garde dans le bloc 📄 pour qu'elle apparaisse tout de suite */
GA.createScriptVar = function (ws, cb) {
  askName(T('Nom de la nouvelle variable :'), '', function (n) {
    var hat = GA.getFileHat(ws);
    if (hat) {
      var before = JSON.stringify(hat.saveExtraState() || {});
      hat.vars_ = (hat.vars_ || []).filter(function (x) { return x !== n; }).concat([n]);
      var BC = Blockly.Events.BlockChange || Blockly.Events.get(Blockly.Events.BLOCK_CHANGE);
      Blockly.Events.fire(new BC(hat, 'mutation', null, before, JSON.stringify(hat.saveExtraState() || {})));
    }
    if (ws.refreshToolboxSelection) ws.refreshToolboxSelection();
    if (cb) cb(n);
  });
};
/* nom de variable « simple » porté par un bloc (pour le clic droit) */
function varFieldOf(b) {
  if (!b) return null;
  if (b.type === 'py_var') return b.getField('NAME');
  if (b.type === 'py_assign' || b.type === 'py_augassign' || b.type === 'py_for') return b.getField('T');
  return null;
}

/* variables proposées : pas les noms de fonctions (def), triées */
function varList(ws) {
  var defs = {};
  ws.getBlocksByType('py_def', false).forEach(function (b) { defs[b.getFieldValue('NAME')] = 1; });
  return (GA.scriptVars ? GA.scriptVars(ws, null) : []).filter(function (p) { return !defs[p[0]]; })
    .sort(function (a, b) { return a[0].toLowerCase().localeCompare(b[0].toLowerCase()); });
}
GA.scriptVarList = varList;
/* ---------- le menu de choix (clic sur la pastille) ---------- */
var box = null, cur = null;
function close() {
  if (box && box.parentNode) box.parentNode.removeChild(box);
  box = null; cur = null;
  document.removeEventListener('mousedown', outside, true);
  document.removeEventListener('keydown', keys, true);
}
function outside(e) { if (box && !box.contains(e.target)) close(); }
function keys(e) {
  if (!cur) return;
  var rows = box.querySelectorAll('.sgRow');
  if (e.key === 'Escape') { e.preventDefault(); close(); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); e.stopPropagation();
    cur.active = (cur.active + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
    rows.forEach(function (r, i) { r.classList.toggle('on', i === cur.active); });
    if (rows[cur.active].scrollIntoView) rows[cur.active].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && cur.active >= 0 && rows[cur.active]) { e.preventDefault(); e.stopPropagation(); rows[cur.active].click(); }
}
function place(field) {
  var el = field.getSvgRoot ? field.getSvgRoot() : null;
  var r = el ? el.getBoundingClientRect() : { left: 100, bottom: 100, top: 100 }, vh = window.innerHeight, vw = window.innerWidth;
  var w = Math.min(340, vw - 16);
  box.style.width = w + 'px';
  box.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + 'px';
  var below = vh - r.bottom - 12, above = r.top - 12;
  if (below >= 220 || below >= above) { box.style.top = (r.bottom + 4) + 'px'; box.style.maxHeight = Math.max(140, below) + 'px'; }
  else { box.style.bottom = (vh - r.top + 4) + 'px'; box.style.maxHeight = Math.max(140, above) + 'px'; }
}
function setValue(field, v) {
  Blockly.Events.setGroup(true);
  try { field.setValue(v); } finally { Blockly.Events.setGroup(false); }
  if (GA.afterSuggest) GA.afterSuggest(field.getSourceBlock());
}
function typeByHand(field) {
  field.forceText_ = true;
  try { field.showEditor(); } finally { field.forceText_ = false; }
}
GA.varMenu = {
  open: function (field) {
    close();
    var block = field.getSourceBlock(), ws = mainWs(block);
    if (!ws || !root.document) return;
    var curName = String(field.getValue() || '');
    var hints = GA.valueHints ? GA.valueHints(block) : null;
    var isC = GA.isPyConst(curName);
    var list = varList(ws).filter(function (p) { return isC ? GA.isPyConst(p[0]) : !GA.isPyConst(p[0]); });
    cur = { field: field, active: -1, filter: '' };
    box = document.createElement('div');
    box.className = 'sgBox vmBox';
    box.setAttribute('role', 'listbox');
    document.body.appendChild(box);
    function draw() {
      var q = cur.filter.toLowerCase();
      var shown = list.filter(function (p) { return !q || p[0].toLowerCase().indexOf(q) >= 0; });
      var h = '';
      if (hints && hints.items.length && !q) {
        h += '<div class="sgHead">' + esc(hints.head) + ' — ' + esc(T('valeurs habituelles')) + '</div>';
        hints.items.forEach(function (it, i) {
          h += '<div class="sgRow" data-h="' + i + '"><span class="sgChip sg-' + it.cls + '">' + esc(it.chip) + '</span>' + (it.desc ? '<div class="sgDesc">' + esc(T(it.desc)) + '</div>' : '') + '</div>';
        });
      }
      h += '<div class="sgHead">' + esc(T('Variables de ton script')) + '</div>';
      if (list.length > 8) h += '<input class="vmFilter" type="search" placeholder="' + esc(T('filtrer…')) + '" value="' + esc(cur.filter) + '">';
      h += '<div class="vmList">';
      shown.forEach(function (p) {
        var c = GA.isPyConst(p[0]);
        h += '<div class="sgRow' + (p[0] === curName ? ' cur' : '') + '" data-v="' + esc(p[0]) + '"><span class="sgChip sg-' + (c ? 'const' : 'var') + '">' + esc(p[0]) + '</span>' +
          (p[0] === curName ? ' <span class="sgSub">✓</span>' : '') + (p[1] ? '<div class="sgDesc">' + esc(T(p[1])) + '</div>' : '') + '</div>';
      });
      if (!shown.length) h += '<div class="sgNone">' + esc(T('Aucune variable pour l\'instant.')) + '</div>';
      h += '</div><div class="vmActs">';
      if (GA.isPyIdent(curName)) h += '<div class="sgRow" data-a="rename">✏️ ' + esc(T('Renommer « %1 » partout…').replace('%1', curName)) + '</div>';
      h += '<div class="sgRow" data-a="new">➕ ' + esc(T('Nouvelle variable…')) + '</div>';
      h += '<div class="sgRow" data-a="type">⌨️ ' + esc(T('Écrire le nom au clavier')) + '</div></div>';
      box.innerHTML = h;
      var f = box.querySelector('.vmFilter');
      if (f) {
        f.oninput = function () { cur.filter = f.value; cur.active = -1; draw(); var g = box.querySelector('.vmFilter'); g.focus(); g.setSelectionRange(g.value.length, g.value.length); };
      }
      place(field);
    }
    box.addEventListener('click', function (e) {
      var row = e.target.closest('.sgRow');
      if (!row) return;
      var v = row.getAttribute('data-v'), a = row.getAttribute('data-a'), hi = row.getAttribute('data-h');
      close();
      if (hi != null) { GA.pickHint(block, hints.items[+hi]); if (GA.afterSuggest) GA.afterSuggest(block); }
      else if (v != null) setValue(field, v);
      else if (a === 'rename') GA.askRenameVar(ws, curName);
      else if (a === 'new') GA.createScriptVar(ws, function (n) { setValue(field, n); });
      else if (a === 'type') typeByHand(field);
    });
    draw();
    setTimeout(function () {
      document.addEventListener('mousedown', outside, true);
      document.addEventListener('keydown', keys, true);
      var f = box && box.querySelector('.vmFilter'); if (f) f.focus();
    }, 0);
  },
  close: close
};

/* ---------- clic droit sur un bloc de variable ---------- */
function addVarMenu(type) {
  var def = Blockly.Blocks[type];
  if (!def || def.gaVarMenu_) return;
  def.gaVarMenu_ = true;
  var prev = def.customContextMenu;
  def.customContextMenu = function (opts) {
    if (prev) prev.call(this, opts);
    if (this.isInFlyout) return;
    var f = varFieldOf(this), ws = mainWs(this), name = f ? String(f.getValue() || '') : '';
    if (!f || !ws) return;
    var extra = [];
    if (GA.isPyIdent(name)) extra.push({ text: '✏️ ' + T('Renommer « %1 » partout…').replace('%1', name), enabled: true, callback: function () { GA.askRenameVar(ws, name); } });
    var others = varList(ws).map(function (p) { return p[0]; }).filter(function (n) { return n !== name && !GA.isPyConst(n); });
    others.slice(0, 10).forEach(function (n) { extra.push({ text: '↔ ' + T('utiliser « %1 »').replace('%1', n), enabled: true, callback: function () { setValue(f, n); } }); });
    extra.push({ text: '📋 ' + T('Choisir une autre variable…'), enabled: true, callback: function () { GA.varMenu.open(f); } });
    extra.push({ text: '⌨️ ' + T('Écrire le nom au clavier'), enabled: true, callback: function () { typeByHand(f); } });
    // en tête du menu : c'est ce qu'on cherche en faisant un clic droit sur une variable
    opts.unshift.apply(opts, extra);
  };
}
GA.pyVarsInit = function () { ['py_var', 'py_assign', 'py_augassign', 'py_for'].forEach(addVarMenu); };
if (root.Blockly && root.Blockly.Blocks && root.Blockly.Blocks.py_var) GA.pyVarsInit();
if (root.addEventListener) root.addEventListener('resize', function () { if (cur) place(cur.field); });
})(typeof window !== 'undefined' ? window : globalThis);
