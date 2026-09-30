/* Atelier de plug-ins GIMP — interface */
(function () {
'use strict';
var GA = window.GA;
var $ = function (s) { return document.querySelector(s); };
var T = function (s) { return GA.T ? GA.T(s) : s; };
/* copie propre de la page (avant toute modification), pour « Télécharger l'atelier » */
(function () {
  try {
    var c = document.documentElement.cloneNode(true);
    c.querySelectorAll('script:not([data-ga]), meta[http-equiv]').forEach(function (n) { n.remove(); });
    GA.snapshot = '<!DOCTYPE html>\n' + c.outerHTML;
  } catch (e) { GA.snapshot = null; }
})();
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var KEY = 'atelier-gimp-v2-projet', KEY_SEEN = 'atelier-gimp-v2-vu';
var store = {
  get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
};
var ws = null, opts = null, built = null, issues = [], selectedId = null, warned = {}, refreshTimer = null;
var DATA = JSON.parse(document.getElementById('ga-data').textContent);

/* ---------- petits outils ---------- */
var toastTimer;
function toast(msg) {
  var t = $('#toast'); t.textContent = T(msg); t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2600);
}
var dlgClose = null;
function openDialog(html, cls, onClose) {
  var d = $('#dialog'); d.className = 'dialog' + (cls ? ' ' + cls : ''); d.innerHTML = html;
  $('#overlay').classList.add('open'); dlgClose = onClose || null;
  var f = d.querySelector('[autofocus]') || d.querySelector('input,button,select,textarea');
  if (f) setTimeout(function () { f.focus(); }, 30);
  return d;
}
function closeDialog() {
  if (!$('#overlay').classList.contains('open')) return;
  $('#overlay').classList.remove('open'); $('#dialog').innerHTML = '';
  var c = dlgClose; dlgClose = null; if (c) c();
}
$('#overlay').addEventListener('mousedown', function (e) { if (e.target.id === 'overlay') closeDialog(); });
function confirmBox(title, text, okLabel, cb) {
  var d = openDialog('<h2>' + esc(title) + '</h2><p class="sub">' + esc(text) + '</p><div class="foot"><button class="btn" data-a="no">Annuler</button><button class="btn primary" data-a="ok" autofocus>' + esc(okLabel || 'OK') + '</button></div>', '', function () { cb(false); });
  d.querySelector('[data-a=ok]').onclick = function () { dlgClose = null; closeDialog(); cb(true); };
  d.querySelector('[data-a=no]').onclick = closeDialog;
}
function promptBox(title, def, cb) {
  var d = openDialog('<h2>' + esc(title) + '</h2><div class="field" style="margin-top:12px"><input type="text" id="pIn" autofocus></div><div class="foot"><button class="btn" data-a="no">Annuler</button><button class="btn primary" data-a="ok">OK</button></div>', '', function () { cb(null); });
  var inp = d.querySelector('#pIn'); inp.value = def || '';
  setTimeout(function () { inp.select(); }, 40);
  function ok() { var v = inp.value; dlgClose = null; closeDialog(); cb(v); }
  d.querySelector('[data-a=ok]').onclick = ok;
  d.querySelector('[data-a=no]').onclick = closeDialog;
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok(); });
}
function setupDialogs() {
  var dlg = Blockly.dialog;
  if (!dlg) return;
  dlg.setAlert(function (msg, cb) { openDialog('<h2>Info</h2><p class="sub">' + esc(msg) + '</p><div class="foot"><button class="btn primary" autofocus onclick="document.getElementById(\'overlay\').click()">OK</button></div>', '', cb); $('#dialog button').onclick = closeDialog; });
  dlg.setConfirm(function (msg, cb) { confirmBox('Confirmer', msg, 'Oui', cb); });
  dlg.setPrompt(function (msg, def, cb) {
    var title = /variable/i.test(msg) ? 'Nom de la nouvelle variable' : msg;
    promptBox(title, def, cb);
  });
}

/* ---------- espace de travail ---------- */
function ensureStart() {
  if (!GA.getHat(ws)) Blockly.serialization.blocks.append(GA.emptyProject().blocks.blocks[0], ws);
}
function loadState(state) {
  try {
    ws.clear();
    Blockly.serialization.workspaces.load(state, ws);
  } catch (err) {
    console.error(err);
    ws.clear();
    Blockly.serialization.workspaces.load(GA.emptyProject(), ws);
    toast('Projet illisible : un projet vide a été ouvert.');
  }
  ensureStart();
  ws.clearUndo();
  selectedId = null;
  refresh();
  setTimeout(showAll, 30);
}
function showAll() {
  if (!ws) return;
  Blockly.svgResize(ws);
  var st = GA.getHat(ws);
  if (!st) return;
  ws.setScale(window.innerWidth < 900 ? Math.min(0.72, (GA.prefs ? GA.prefs.zoom : 85) / 100) : (GA.prefs ? GA.prefs.zoom : 85) / 100);
  var r = ws.getBlocksBoundingBox();
  var vm = ws.getMetricsManager().getViewMetrics(true);
  if (r.right - r.left > vm.width * 0.95 || r.bottom - r.top > vm.height * 0.95) {
    ws.zoomToFit();
    if (ws.scale < 0.62) ws.setScale(0.62);
    if (ws.scale > 0.85) ws.setScale(0.85);
  }
  var xy = st.getRelativeToSurfaceXY();
  ws.scroll(-(xy.x * ws.scale) + 28, -(xy.y * ws.scale) + 24);
}
function save() {
  if (!ws) return;
  store.set(KEY, JSON.stringify({ v: 2, ws: Blockly.serialization.workspaces.save(ws), opts: opts }));
}
function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, ws && ws.getAllBlocks(false).length > 2500 ? 700 : 180); }
function refresh() {
  try { built = GA.build(ws, opts); }
  catch (err) { console.error(err); built = null; }
  try { issues = GA.check(ws, opts, built); }
  catch (err2) { console.error(err2); issues = []; }
  renderCode(); renderChecks(); applyWarnings(); updateBadges(); renderHelp(); save();
  if (GA.learn) GA.learn.check();
}
function applyWarnings() {
  var by = {};
  issues.forEach(function (i) { if (i.id && i.level !== 'info') (by[i.id] = by[i.id] || []).push(i.msg); });
  Object.keys(warned).forEach(function (id) {
    if (!by[id]) { var b = ws.getBlockById(id); if (b && !b.disposed) b.setWarningText(null); }
  });
  var next = {};
  Object.keys(by).forEach(function (id) {
    var b = ws.getBlockById(id), txt = by[id].join('\n');
    if (!b) return;
    if (warned[id] !== txt) b.setWarningText(by[id].map(T).join('\n'));
    next[id] = txt;
  });
  warned = next;
}
function counts() {
  var c = { error: 0, warn: 0, info: 0 };
  issues.forEach(function (i) { c[i.level]++; });
  return c;
}
function updateBadges() {
  var c = counts(), b = $('#chkBadge'), d = $('#dlBadge');
  var lab = $('#bDownload span:not(.badge)');
  if (lab) lab.textContent = T(built && built.mode === 'file' ? 'Télécharger le script' : 'Télécharger le plug-in');
  b.textContent = c.error + c.warn;
  b.hidden = !(c.error + c.warn);
  b.className = 'badge' + (c.error ? ' err' : c.warn ? ' warn' : '');
  d.hidden = !c.error;
  d.className = 'badge err';
  d.textContent = '!';
  $('#bDownload').title = c.error ? c.error + ' problème(s) à corriger (onglet Vérification)' : 'Télécharger le fichier .py prêt pour GIMP';
}

/* ---------- code ---------- */
var KW = /^(def|if|elif|else|for|in|while|return|try|except|import|from|not|and|or|is|None|True|False|with|as|pass|lambda|global)$/;
function hl(t) {
  var re = /(#.*$)|([ur]?"(?:[^"\\]|\\.)*")|([ur]?'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\bpdb\.[a-z0-9_]+|\bgimp\.[a-zA-Z0-9_]+)|(\b[A-Z][A-Z0-9_]{2,}\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g;
  var out = '', last = 0, m;
  while ((m = re.exec(t))) {
    out += esc(t.slice(last, m.index));
    var cls = m[1] ? 'k-com' : (m[2] || m[3]) ? 'k-str' : m[4] ? 'k-num' : m[5] ? 'k-fn' : m[6] ? 'k-const' : (KW.test(m[7]) ? 'k-kw' : '');
    out += cls ? '<span class="' + cls + '">' + esc(m[0]) + '</span>' : esc(m[0]);
    last = re.lastIndex;
  }
  return out + esc(t.slice(last));
}
function renderCode() {
  var el = $('#code');
  if (!built) { el.innerHTML = '<div class="ln"><span class="tx">  (le code n\'a pas pu être généré)</span></div>'; return; }
  el.innerHTML = built.lines.map(function (l, i) {
    return '<div class="ln"' + (l.id ? ' data-id="' + esc(l.id) + '"' : '') + '><span class="no">' + (i + 1) + '</span><span class="tx">' + hl(l.t) + '</span></div>';
  }).join('');
  highlightCode(false);
}
function idsOf(block) {
  var set = {};
  block.getDescendants(false).forEach(function (d) { set[d.id] = true; });
  return set;
}
function lineOwner(block) {
  var b = block, lines = built ? built.lines : [];
  while (b) {
    var id = b.id;
    if (lines.some(function (l) { return l.id === id; })) return b;
    b = b.getParent();
  }
  return null;
}
function highlightCode(scroll) {
  var el = $('#code');
  el.querySelectorAll('.ln.hl').forEach(function (n) { n.classList.remove('hl'); });
  var b = selectedId && ws.getBlockById(selectedId);
  if (!b) return;
  var owner = lineOwner(b);
  if (!owner) return;
  var set = (owner === b) ? idsOf(b) : (function () { var s = {}; s[owner.id] = true; return s; })();
  var first = null;
  el.querySelectorAll('.ln[data-id]').forEach(function (n) {
    if (set[n.getAttribute('data-id')]) { n.classList.add('hl'); if (!first) first = n; }
  });
  if (first && scroll !== false && $('#p-code').classList.contains('on')) first.scrollIntoView({ block: 'nearest' });
}
$('#code').addEventListener('click', function (e) {
  var ln = e.target.closest('.ln[data-id]');
  if (ln) selectBlock(ln.getAttribute('data-id'));
});
function selectBlock(id) {
  var b = ws.getBlockById(id);
  if (!b) return;
  if (b.isShadow() && b.getParent()) b = b.getParent();
  b.select();
  ws.centerOnBlock(b.id);
  if (window.innerWidth < 900) sheet(false);
}

/* ---------- aide ---------- */
function fnCard(py) {
  var sig = GA.SIGS[py];
  if (!sig) return '';
  var args = sig[4].filter(function (a) { return a[1] !== 'count'; }).map(function (a) { return a[0]; }).join(', ');
  var outs = sig[5].map(function (o) { return o[0]; }).join(', ');
  return '<div class="fn"><code>pdb.' + esc(py) + '</code>' + (sig[2] ? '<span class="tag">ancienne</span>' : '') +
    '<div class="sig">(' + esc(args) + ')' + (outs ? ' → ' + esc(outs) : '') + '</div>' +
    (sig[1] ? '<div class="bl">' + esc(sig[1]) + '</div>' : '') + '</div>';
}
function snippetFor(block) {
  if (!built) return '';
  var owner = lineOwner(block);
  if (!owner) return '';
  var set = owner === block ? idsOf(block) : (function () { var s = {}; s[owner.id] = true; return s; })();
  var lines = built.lines.filter(function (l) { return l.id && set[l.id]; }).map(function (l) { return l.t; });
  if (!lines.length) return '';
  var ind = Math.min.apply(null, lines.map(function (t) { return t.length - t.replace(/^\s+/, '').length; }));
  var more = lines.length > 14;
  lines = lines.slice(0, 14).map(function (t) { return t.slice(ind); });
  return '<h3>' + (owner === block ? 'Le code Python produit' : 'Utilisé dans cette ligne') + '</h3><div class="snippet">' + lines.map(hl).join('\n') + (more ? '\n<span class="k-com">…</span>' : '') + '</div>';
}
function renderHelp() {
  var el = $('#p-help');
  var b = selectedId && ws.getBlockById(selectedId);
  if (b && b.isShadow() && b.getParent()) b = b.getParent();
  var info = b && GA.helpFor(b);
  if (!info) { el.innerHTML = defaultHelp(); return; }
  var cat = info.cat;
  var h = '<span class="chip" style="background:' + cat.colour + '">' + esc(cat.name) + '</span>';
  h += '<h2>' + esc(info.title) + '</h2>';
  h += '<p>' + esc(info.help || '') + '</p>';
  if (info.tip) h += '<div class="tip">💡 ' + esc(info.tip) + '</div>';
  if (b.type === 'g_start') {
    h += '<div class="tip">📍 Dans GIMP, ton plug-in sera ici : <b>' + esc((built ? built.menu : '').replace(/^<Image>\//, '').replace(/\//g, ' ▸ ')) + ' ▸ ' + esc(b.getFieldValue('LABEL')) + '</b></div>';
  }
  if (b.type === 'py_file') {
    h += '<div class="tip">📄 Ce script sera téléchargé sous le nom <b>' + esc(baseName()) + '.py</b>. Réimporte-le quand tu veux : les blocs reviennent à l\'identique.</div>';
  }
  if (b.isCollapsed && b.isCollapsed()) h += '<div class="tip">📦 Bloc replié : clic droit ▸ « Déplier le bloc » pour voir son contenu.</div>';
  var own = issues.filter(function (i) { return i.id === b.id; });
  own.forEach(function (i) { h += '<div class="issue ' + i.level + '"><span class="lv">' + icon(i.level) + '</span><span>' + esc(i.msg) + '</span></div>'; });
  h += snippetFor(b);
  if ((b.type === 'py_call' || b.type === 'py_callst') && !b.f_ && /^pdb\./.test(b.getFieldValue('FUNC') || '')) info.pdb = [b.getFieldValue('FUNC').slice(4)];
  if (info.pdb && info.pdb.length) {
    h += '<h3>Fonctions de GIMP utilisées</h3><div class="fnlist">' + info.pdb.map(function (p) { return fnCard(p.replace(/-/g, '_')); }).join('') + '</div>';
  }
  if (b.type === 'g_pdb_call' || b.type === 'g_pdb_value') {
    h += '<p style="margin-top:14px"><button class="btn primary" id="hPick">🔍 Choisir une autre fonction</button></p>';
  }
  if ((b.type === 'py_call' || b.type === 'py_callst') && !b.f_) {
    h += '<p style="margin-top:14px"><button class="btn primary" id="hPick">🔍 Choisir une fonction de GIMP</button></p>' +
      '<div class="tip">💡 Clique sur le nom de la fonction dans le bloc et tape un mot (flou, calque, texte…) : la liste des fonctions qui correspondent s\'affiche.</div>';
  }
  if (b.type === 'py_var') {
    var vn = b.getFieldValue('NAME'), uses = ws.getAllBlocks(false).filter(function (x) { return x.type === 'py_var' && x.getFieldValue('NAME') === vn; }).length;
    h += '<div class="tip">🟠 « ' + esc(vn) + ' » est utilisée ' + uses + ' fois dans ce script. Clique sur la pastille pour choisir une autre variable.</div>';
  }
  el.innerHTML = h;
  var pk = el.querySelector('#hPick');
  if (pk) pk.onclick = function () { openPicker(b); };
}
function defaultHelp() {
  return '<h2>Comment ça marche ?</h2>' +
    '<p class="muted">Tu construis ton plug-in comme un puzzle. L\'atelier écrit le code Python pour toi.</p>' +
    '<ol class="steps">' +
    '<li><b>Prends des blocs</b> dans les catégories à gauche (ou tape un mot dans la recherche).</li>' +
    '<li><b>Emboîte-les</b> sous « ▶ puis faire » dans le bloc jaune. Ils s\'exécutent de haut en bas.</li>' +
    '<li><b>Clique « Télécharger le plug-in »</b> et range le fichier dans le dossier plug-ins de GIMP.</li></ol>' +
    '<div class="tip">💡 Clique sur n\'importe quel bloc : son explication et son code apparaissent ici.</div>' +
    '<div class="tip">🎓 Nouveau ici ? Suis le <b>cours</b> (onglet 🎓 Cours), ou ouvre le <b>guide</b> : menu Aide ▸ 📘 Guide d\'utilisation.</div>' +
    '<div class="tip">🐍 Tu as déjà un script ? <b>📂 Projet ▸ Importer un script Python</b> (ou glisse le fichier ici) : chaque ligne devient un bloc, et le téléchargement redonne le même script.</div>' +
    '<h3>Les formes des blocs</h3><dl class="gloss">' +
    '<dt>🧩 Bloc à encoche</dt><dd>Une action. Il s\'empile sous un autre bloc.</dd>' +
    '<dt>⬭ Bloc arrondi</dt><dd>Une valeur (nombre, texte, calque…). Il se glisse dans un trou.</dd>' +
    '<dt>⬡ Bloc pointu</dt><dd>Une condition vrai/faux, pour « si » et « tant que ».</dd>' +
    '<dt>⊏ Bloc en C</dt><dd>Il contient d\'autres blocs : répéter, si, pour chaque…</dd></dl>' +
    '<h3>Les mots de GIMP</h3><dl class="gloss">' +
    '<dt>Calque</dt><dd>Une feuille transparente de l\'image. Une image en contient plusieurs, empilées.</dd>' +
    '<dt>Sélection</dt><dd>La zone entourée de pointillés : les actions ne touchent qu\'elle.</dd>' +
    '<dt>Chemin</dt><dd>Un tracé fait de points (outil Chemins).</dd>' +
    '<dt>Réglages</dt><dd>La petite fenêtre qui s\'ouvre quand on lance ton plug-in, pour choisir des options.</dd>' +
    '<dt>PDB</dt><dd>La liste des 857 fonctions que GIMP met à disposition des plug-ins (catégorie 🧰 Avancé).</dd></dl>';
}

/* ---------- vérification ---------- */
function icon(l) { return l === 'error' ? '🛑' : l === 'warn' ? '⚠️' : 'ℹ️'; }
function renderChecks() {
  var el = $('#p-check'), c = counts(), h = '';
  if (c.error) h += '<div class="summary err"><span class="big">🛑</span><div>' + c.error + ' problème' + (c.error > 1 ? 's' : '') + ' à corriger<small>Le plug-in ne marcherait pas tel quel. Clique sur un problème pour voir le bloc.</small></div></div>';
  else if (c.warn) h += '<div class="summary warn"><span class="big">⚠️</span><div>Ça marchera, mais ' + c.warn + ' point' + (c.warn > 1 ? 's' : '') + ' à regarder<small>Ce ne sont pas des erreurs bloquantes.</small></div></div>';
  else h += '<div class="summary ok"><span class="big">✅</span><div>Tout est bon !<small>Ton plug-in est prêt à être téléchargé.</small></div></div>';
  issues.forEach(function (i, n) {
    h += '<button class="issue ' + i.level + '" data-n="' + n + '"><span class="lv">' + icon(i.level) + '</span><span>' + esc(i.msg) + '</span>' + (i.id ? '<span class="go">Voir</span>' : '') + '</button>';
  });
  if (built && built.mode === 'file') {
    h += '<h3>Ce que contient ton fichier</h3><dl class="gloss">';
    h += '<dt>Nom du fichier</dt><dd><span class="path">' + esc(baseName()) + '.py</span></dd>';
    h += '<dt>Lignes de Python</dt><dd>' + built.lines.length + '</dd>';
    h += '<dt>Version de Python</dt><dd>' + (built.py3 ? 'Python 3' : 'Python 2.7 (GIMP 2.10)') + '</dd>';
    h += '<dt>Blocs</dt><dd>' + ws.getAllBlocks(false).length + '</dd></dl>';
    h += '<p class="muted" style="margin-top:12px">Garanties : chaque bloc redonne exactement sa ligne de Python. Le fichier téléchargé contient aussi l\'empreinte des blocs : en le réimportant, tu retrouves tes blocs à l\'identique.</p>';
  } else if (built) {
    h += '<h3>Ce que contient ton fichier</h3><dl class="gloss">';
    h += '<dt>Menu dans GIMP</dt><dd>' + esc(built.menu.replace(/^<Image>\//, '').replace(/\//g, ' ▸ ') + ' ▸ ' + built.label) + '</dd>';
    h += '<dt>Nom technique</dt><dd><span class="path">' + esc(built.procName) + '</span></dd>';
    h += '<dt>Réglages demandés</dt><dd>' + (built.settings.length ? built.settings.map(function (s) { return esc(s.py); }).join(', ') : 'aucun (le plug-in se lance directement)') + '</dd>';
    h += '<dt>Modules importés</dt><dd>gimpfu' + (built.imports.length ? ', ' + esc(built.imports.join(', ')) : '') + '</dd>';
    h += '<dt>Fonctions d\'aide ajoutées</dt><dd>' + (built.helpers.length ? esc(built.helpers.join(', ')) : 'aucune') + '</dd></dl>';
    h += '<p class="muted" style="margin-top:12px">Garanties : Python 2.7, indentation de 4 espaces, pas de f-string ni de print, fonctions de la PDB officielle de GIMP 2.10 uniquement, run_mode jamais passé à la main, erreurs affichées dans GIMP.</p>';
  }
  el.innerHTML = h;
  el.querySelectorAll('.issue[data-n]').forEach(function (btn) {
    btn.onclick = function () { var i = issues[+btn.getAttribute('data-n')]; if (i && i.id) selectBlock(i.id); };
  });
}

/* ---------- onglets ---------- */
function showTab(name) {
  document.querySelectorAll('.tab[data-pane]').forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-pane') === name ? 'true' : 'false'); });
  document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + name); });
  if (name === 'code') highlightCode(true);
  if (GA.learn) { GA.learn.flag('tab_' + name); if (name === 'learn') GA.learn.render(); }
}
function sheet(open) { $('#side').classList.toggle('open', open); document.body.classList.toggle('sheet-open', open); }
$('#sheetClose').onclick = function () { sheet(false); };
document.querySelectorAll('.tab[data-pane]').forEach(function (t) { t.onclick = function () { showTab(t.getAttribute('data-pane')); }; });
$('#sideToggle').onclick = function () { sheet(!$('#side').classList.contains('open')); };

/* ---------- recherche ---------- */
var searchTimer;
$('#q').addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 160); });
$('#q').addEventListener('keydown', function (e) { if (e.key === 'Escape') { $('#q').value = ''; runSearch(); $('#q').blur(); } });
function runSearch() {
  if (!ws) return;
  var v = $('#q').value.trim(), tb = ws.getToolbox(), fl = tb && tb.getFlyout();
  if (!fl) return;
  if (!v) { fl.hide(); return; }
  tb.clearSelection();
  var items = GA.search(v);
  if (items.length <= 1) items.push({ kind: 'label', text: 'Essaie un autre mot : calque, texte, couleur, fichier…', 'web-class': 'gaHint' });
  fl.show(items);
}

/* ---------- choisir une fonction GIMP ---------- */
var GROUPS = { brush: 'Pinceaux', brushes: 'Pinceaux', channel: 'Canaux', context: 'Contexte (couleurs, outils)', display: 'Affichage', drawable: 'Pixels (drawable)',
  drawable_color: 'Couleurs du calque', drawable_edit: 'Remplir / tracer', drawable_transform: 'Transformations (anciennes)', edit: 'Édition', fileops: 'Fichiers',
  floating_sel: 'Sélection flottante', fonts: 'Polices', gimp: 'GIMP', gimprc: 'Préférences', gradient: 'Dégradés', image: 'Image', image_convert: 'Conversion d\'image',
  image_grid: 'Grille', image_guides: 'Guides', image_select: 'Outils de sélection', image_transform: 'Transformer l\'image', image_undo: 'Annulation', item: 'Éléments (calques, chemins…)',
  item_transform: 'Transformer un élément', layer: 'Calques', message: 'Messages', paint_tools: 'Outils de peinture', palette: 'Palettes', pattern: 'Motifs',
  plug_in_compat: 'Filtres (plug-in-…)', progress: 'Progression', selection: 'Sélection', text_layer: 'Calques texte', text_tool: 'Texte (outil)', vectors: 'Chemins', external: 'Autres plug-ins' };
function groupName(g) { return GROUPS[g] || g; }
GA.onPickProc = function (block) { openPicker(block); };
function openPicker(block) {
  var names = Object.keys(GA.SIGS).sort();
  var groups = {};
  names.forEach(function (n) { groups[GA.SIGS[n][0]] = true; });
  var gl = Object.keys(groups).sort(function (a, b) { return groupName(a).localeCompare(groupName(b)); });
  var d = openDialog('<h2>🔍 Choisir une fonction de GIMP</h2><p class="sub">Les ' + names.length + ' fonctions de la PDB officielle de GIMP 2.10. Les cases à remplir apparaîtront dans le bloc.</p>' +
    '<div class="pickHead"><input id="pq" type="search" placeholder="ex. blur, text, layer, select…" autofocus><select id="pg"><option value="">Tous les groupes</option>' +
    gl.map(function (g) { return '<option value="' + esc(g) + '">' + esc(groupName(g)) + '</option>'; }).join('') + '</select></div>' +
    '<div class="pickList" id="pl"></div><div class="foot"><button class="btn" id="pc">Annuler</button></div>', 'wide');
  d.querySelector('#pc').onclick = closeDialog;
  function render() {
    var q = d.querySelector('#pq').value, g = d.querySelector('#pg').value;
    var res = GA.pdbSearch(q, g, 150), shown = res.list;
    d.querySelector('#pl').innerHTML = (q.trim() || g ? '' : '<p class="muted">⭐ Les plus utilisées d\'abord. Tape un mot, en français ou en anglais (flou, calque, texte, sélection…).</p>') +
      (shown.length ? '' : '<p class="muted">Aucune fonction ne correspond.</p>') + shown.map(function (n) {
      var s = GA.SIGS[n];
      var args = s[4].filter(function (a) { return a[1] !== 'count'; }).map(function (a) { return a[0]; }).join(', ');
      return '<button class="pick" data-p="' + esc(n) + '"><span class="sgChip sg-pdb" style="background:' + GA.pdbColour(n) + '">⚙️ ' + esc(n) + '</span>' + (s[2] ? '<span class="tag">ancienne</span>' : '') +
        '<span class="gname">' + esc(groupName(s[0])) + '</span>' +
        '<span class="bl">' + esc(s[1]) + '</span><span class="ar">(' + esc(args) + ')' + (s[5].length ? ' → ' + esc(s[5].map(function (o) { return o[0]; }).join(', ')) : '') + '</span></button>';
    }).join('') + (res.total > shown.length ? '<p class="muted">… et ' + (res.total - shown.length) + ' autres : précise ta recherche.</p>' : '');
  }
  d.querySelector('#pq').addEventListener('input', render);
  d.querySelector('#pg').addEventListener('change', render);
  d.querySelector('#pl').addEventListener('click', function (e) {
    var p = e.target.closest('.pick');
    if (!p) return;
    choose(p.getAttribute('data-p'));
  });
  function choose(py) {
    closeDialog();
    if (block && !block.disposed && block.workspace === ws && block.setProc) setProc(block, py);
    else if (block && !block.disposed && block.workspace === ws && GA.pyApplyProc && (block.type === 'py_call' || block.type === 'py_callst')) {
      GA.pyApplyProc(block, py); block.select(); scheduleRefresh(); renderHelp();
    }
    else insertBlock(GA.pdbBlockState(GA.SIGS[py][5].length ? 'g_pdb_value' : 'g_pdb_call', py));
  }
  render();
}
function setProc(block, py) {
  Blockly.Events.setGroup(true);
  try {
    var before = JSON.stringify(block.saveExtraState() || {});
    block.setProc(py, true);
    var after = JSON.stringify(block.saveExtraState() || {});
    try { block.initSvg(); } catch (e) { /* déjà initialisé */ }
    if (block.queueRender) block.queueRender(); else block.render();
    var BC = Blockly.Events.BlockChange || Blockly.Events.get(Blockly.Events.BLOCK_CHANGE);
    Blockly.Events.fire(new BC(block, 'mutation', null, before, after));
  } finally { Blockly.Events.setGroup(false); }
  block.select();
  scheduleRefresh();
}
function insertBlock(state) {
  var blk = Blockly.serialization.blocks.append(state, ws);
  var vm = ws.getMetricsManager().getViewMetrics(true);
  blk.moveBy(vm.left + vm.width * 0.3, vm.top + 40);
  blk.select();
  return blk;
}

/* ---------- réglages du plug-in ---------- */
var IMPORTS = ['os', 're', 'sys', 'math', 'random', 'time', 'codecs', 'glob', 'json', 'shutil', 'subprocess', 'datetime', 'ConfigParser', 'inspect', 'threading', 'tempfile'];
function openFileSettings() {
  var hat = GA.getFileHat(ws);
  var d = openDialog('<h2>⚙️ Mon script</h2><p class="sub">Réglages du fichier Python importé.</p>' +
    '<div class="field"><label for="fName">Nom du fichier</label><div class="dlrow"><input type="text" id="fName" style="flex:1 1 200px" autofocus><span class="muted" style="font-weight:800">.py</span></div></div>' +
    '<div class="checks"><label><input type="checkbox" id="oKeep"><span>Garder les blocs dans le fichier .py<small>Une empreinte en commentaire à la fin du fichier : le réimport redonne tes blocs à l\'identique.</small></span></label>' +
    '<label><input type="checkbox" id="oCrlf"><span>Fins de ligne Windows (CRLF)<small>Conseillé sous Windows.</small></span></label></div>' +
    '<div class="foot"><button class="btn" id="sCancel">Annuler</button><button class="btn primary" id="sOk">Enregistrer</button></div>');
  d.querySelector('#fName').value = hat.getFieldValue('NAME');
  d.querySelector('#oKeep').checked = opts.keepBlocks !== false;
  d.querySelector('#oCrlf').checked = opts.crlf;
  d.querySelector('#sCancel').onclick = closeDialog;
  d.querySelector('#sOk').onclick = function () {
    var n = d.querySelector('#fName').value.trim().replace(/\.py$/i, '').replace(/[\\/:*?"<>|]+/g, '_') || 'script';
    hat.setFieldValue(n, 'NAME');
    opts.keepBlocks = d.querySelector('#oKeep').checked; opts.crlf = d.querySelector('#oCrlf').checked;
    closeDialog(); refresh(); toast('Réglages du script enregistrés');
  };
}
function openSettings() {
  if (GA.isFileMode(ws)) { openFileSettings(); return; }
  var st = GA.getStart(ws);
  var menu = st.getFieldValue('MENU');
  var d = openDialog('<h2>⚙️ Mon plug-in</h2><p class="sub">Ces informations apparaissent dans GIMP : menu, bulle d\'aide et navigateur de procédures.</p>' +
    '<div class="field"><label for="sLabel">Nom dans le menu</label><input type="text" id="sLabel" autofocus></div>' +
    '<div class="row2"><div class="field"><label for="sMenu">Menu de GIMP</label><select id="sMenu">' + GA.MENUS.map(function (m) { return '<option value="' + esc(m[1]) + '">' + esc(m[0]) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" id="sCustomWrap"><label for="sCustom">Chemin du menu personnalisé</label><input type="text" id="sCustom" placeholder="<Image>/Filters/Mes scripts"><div class="hint">Commence toujours par &lt;Image&gt;/</div></div></div>' +
    '<div class="checks"><label><input type="checkbox" id="sNeeds"><span>Il faut une image ouverte<small>Décoche si ton plug-in ouvre lui-même ses fichiers.</small></span></label></div>' +
    '<div class="field"><label for="sBlurb">Description courte</label><input type="text" id="sBlurb" placeholder="Ce que fait le plug-in, en une phrase"></div>' +
    '<div class="field"><label for="sHelp">Aide détaillée</label><textarea id="sHelp" rows="2"></textarea></div>' +
    '<div class="row2"><div class="field"><label for="sAuthor">Auteur</label><input type="text" id="sAuthor"></div><div class="field"><label for="sCopy">Copyright</label><input type="text" id="sCopy"></div></div>' +
    '<div class="row2"><div class="field"><label for="sDate">Date</label><input type="text" id="sDate"></div><div class="field"><label for="sProc">Nom technique</label><input type="text" id="sProc"><div class="hint">Vide = automatique : ' + esc(GA.procNameFor(ws, Object.assign({}, opts, { procName: '' }))) + '</div></div></div>' +
    '<h3>Confort et sécurité</h3><div class="checks">' +
    '<label><input type="checkbox" id="oUndo"><span>Un seul Ctrl+Z annule tout le plug-in<small>Groupe d\'annulation autour des actions.</small></span></label>' +
    '<label><input type="checkbox" id="oErrors"><span>Montrer les erreurs dans un message<small>Au lieu d\'échouer en silence : le message dit quelle ligne pose problème.</small></span></label>' +
    '<label><input type="checkbox" id="oContext"><span>Remettre couleurs et outils comme avant<small>Les couleurs choisies par le plug-in ne restent pas dans GIMP.</small></span></label>' +
    '<label><input type="checkbox" id="oFlush"><span>Rafraîchir l\'affichage à la fin</span></label>' +
    '<label><input type="checkbox" id="oCrlf"><span>Fins de ligne Windows (CRLF)<small>Conseillé sous Windows.</small></span></label>' +
    '<label><input type="checkbox" id="oKeep"><span>Garder les blocs dans le fichier .py<small>Une empreinte en commentaire : réimporter le .py redonne tes blocs à l\'identique.</small></span></label></div>' +
    '<h3>Imports en plus</h3><p class="muted" style="margin:0 0 8px;font-size:13.5px">Les modules nécessaires sont ajoutés tout seuls. Coche ceux dont tu as besoin pour tes blocs 🐍 Python libre.</p>' +
    '<div class="imports">' + IMPORTS.map(function (m) { return '<label><input type="checkbox" value="' + m + '">' + m + '</label>'; }).join('') + '</div>' +
    '<div class="foot"><button class="btn" id="sCancel">Annuler</button><button class="btn primary" id="sOk">Enregistrer</button></div>');
  function v(id) { return d.querySelector(id); }
  v('#sLabel').value = st.getFieldValue('LABEL');
  v('#sMenu').value = menu;
  v('#sCustom').value = opts.menuCustom || '';
  v('#sNeeds').checked = st.getFieldValue('NEEDS') === 'TRUE';
  v('#sBlurb').value = opts.blurb; v('#sHelp').value = opts.help; v('#sAuthor').value = opts.author; v('#sCopy').value = opts.copyright;
  v('#sDate').value = opts.date; v('#sProc').value = opts.procName;
  v('#oKeep').checked = opts.keepBlocks !== false;
  v('#oUndo').checked = opts.undo; v('#oErrors').checked = opts.errors; v('#oContext').checked = opts.context; v('#oFlush').checked = opts.flush; v('#oCrlf').checked = opts.crlf;
  d.querySelectorAll('.imports input').forEach(function (c) { c.checked = opts.extraImports.indexOf(c.value) >= 0; });
  function syncCustom() { v('#sCustomWrap').style.visibility = v('#sMenu').value === 'CUSTOM' ? 'visible' : 'hidden'; }
  v('#sMenu').onchange = syncCustom; syncCustom();
  v('#sCancel').onclick = closeDialog;
  v('#sOk').onclick = function () {
    Blockly.Events.setGroup(true);
    st.setFieldValue(v('#sLabel').value.trim() || 'Mon script', 'LABEL');
    st.setFieldValue(v('#sMenu').value, 'MENU');
    st.setFieldValue(v('#sNeeds').checked ? 'TRUE' : 'FALSE', 'NEEDS');
    Blockly.Events.setGroup(false);
    opts.menuCustom = v('#sCustom').value.trim() || '<Image>/Filters/Mes scripts';
    opts.blurb = v('#sBlurb').value.trim(); opts.help = v('#sHelp').value.trim(); opts.author = v('#sAuthor').value.trim() || 'Moi';
    opts.copyright = v('#sCopy').value.trim() || opts.author; opts.date = v('#sDate').value.trim() || String(new Date().getFullYear());
    opts.procName = v('#sProc').value.trim();
    opts.keepBlocks = v('#oKeep').checked;
    opts.undo = v('#oUndo').checked; opts.errors = v('#oErrors').checked; opts.context = v('#oContext').checked; opts.flush = v('#oFlush').checked; opts.crlf = v('#oCrlf').checked;
    opts.extraImports = [].slice.call(d.querySelectorAll('.imports input:checked')).map(function (c) { return c.value; });
    closeDialog(); refresh(); toast('Réglages du plug-in enregistrés');
  };
}

/* ---------- exemples, projet, accueil ---------- */
function isEmptyProject() { return ws.getAllBlocks(false).filter(function (b) { return !b.isShadow(); }).length <= 1; }
function openExamples() {
  var d = openDialog('<h2>✨ Exemples</h2><p class="sub">Des plug-ins prêts à l\'emploi, inspirés de tes propres scripts. Ouvre-en un, puis modifie-le à ta façon.</p><div class="cards">' +
    GA.exampleDefs.map(function (ex) {
      return '<button class="card" data-ex="' + ex.id + '"><span class="em">' + ex.icon + '</span><b>' + esc(ex.title) + '</b><span>' + esc(ex.desc) + '</span><small>d\'après ' + esc(ex.from) + '</small></button>';
    }).join('') + '</div><div class="foot"><button class="btn" id="exClose">Fermer</button></div>', 'wide');
  d.querySelector('#exClose').onclick = closeDialog;
  d.querySelectorAll('.card').forEach(function (c) {
    c.onclick = function () {
      var ex = GA.exampleDefs.filter(function (x) { return x.id === c.getAttribute('data-ex'); })[0];
      function go() { closeDialog(); opts.blurb = ex.desc; loadState(ex.build()); toast('Exemple « ' + ex.title + ' » ouvert'); }
      if (isEmptyProject()) go();
      else { dlgClose = null; closeDialog(); confirmBox('Remplacer ton projet ?', 'Ton projet actuel sera remplacé par l\'exemple. Pense à le sauvegarder avant si tu veux le garder (📂 Projet ▸ Sauvegarder).', 'Ouvrir l\'exemple', function (ok) { if (ok) { opts.blurb = ex.desc; loadState(ex.build()); toast('Exemple « ' + ex.title + ' » ouvert'); } }); }
    };
  });
}
function projectMenu() { if (GA.closeMenus) GA.closeMenus(); }
$('#bDl3').onclick = function () { openExport(); };
$('#mNew').onclick = function () {
  projectMenu(false);
  confirmBox('Nouveau plug-in ?', 'Tous les blocs actuels seront effacés.', 'Tout effacer', function (ok) {
    if (!ok) return;
    opts = GA.defaultOpts();
    loadState(GA.emptyProject());
  });
};
$('#mSave').onclick = function () { projectMenu(false); saveProject(); };
$('#mOpen').onclick = function () { projectMenu(false); $('#fileOpen').value = ''; $('#fileOpen').click(); };
$('#mWelcome').onclick = function () { projectMenu(false); openWelcome(); };
$('#fileOpen').addEventListener('change', function () {
  var f = this.files && this.files[0];
  if (f) handleFile(f);
});
$('#mImport').onclick = function () { projectMenu(false); $('#fileOpen').value = ''; $('#fileOpen').click(); };
$('#mPaste').onclick = function () { projectMenu(false); openPaste(); };
$('#mConvert').onclick = function () { projectMenu(false); convertToPython(); };

/* ---------- import de scripts ---------- */
function decodeBytes(u8) {
  var s;
  try { s = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(u8); }
  catch (e) { s = new TextDecoder('windows-1252').decode(u8); }
  return s;
}
function readZip(buf) {
  var dv = new DataView(buf), u8 = new Uint8Array(buf), eocd = -1;
  for (var i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return Promise.reject(new Error('zip illisible'));
  var count = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true), entries = [];
  for (var k = 0; k < count; k++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break;
    var method = dv.getUint16(off + 10, true), csize = dv.getUint32(off + 20, true), nlen = dv.getUint16(off + 28, true);
    var elen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true), local = dv.getUint32(off + 42, true);
    var name = decodeBytes(u8.subarray(off + 46, off + 46 + nlen));
    entries.push({ name: name, method: method, csize: csize, local: local });
    off += 46 + nlen + elen + clen;
  }
  var e = entries.filter(function (x) { return /\.py$/i.test(x.name) && !/(^|\/)__MACOSX\//.test(x.name); })[0];
  if (!e) return Promise.reject(new Error('aucun fichier .py dans ce zip'));
  var lh = e.local, start = lh + 30 + dv.getUint16(lh + 26, true) + dv.getUint16(lh + 28, true);
  var data = u8.subarray(start, start + e.csize);
  if (e.method === 0) return Promise.resolve({ name: e.name.split('/').pop(), bytes: data });
  if (e.method === 8 && typeof DecompressionStream !== 'undefined') {
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()
      .then(function (b) { return { name: e.name.split('/').pop(), bytes: new Uint8Array(b) }; });
  }
  return Promise.reject(new Error('compression du zip non gérée'));
}
function handleFile(f) {
  var name = f.name || 'script.py';
  var r = new FileReader();
  r.onload = function () {
    var buf = r.result;
    if (/\.json$/i.test(name)) {
      try {
        var p = JSON.parse(decodeBytes(new Uint8Array(buf)));
        if (!p || !p.ws) throw new Error('format');
        opts = Object.assign(GA.defaultOpts(), p.opts || {});
        loadState(p.ws); toast('Projet ouvert');
      } catch (e) { toast('Ce fichier n\'est pas un projet de l\'atelier.'); }
      return;
    }
    if (/\.zip$/i.test(name)) {
      readZip(buf).then(function (z) { importText(decodeBytes(z.bytes), z.name, false, z.bytes); }, function (err) { toast('Zip : ' + err.message); });
      return;
    }
    importText(decodeBytes(new Uint8Array(buf)), name, false, new Uint8Array(buf));
  };
  r.readAsArrayBuffer(f);
}
function importText(text, name, replaceOk, bytes) {
  if (!replaceOk && !isEmptyProject()) {
    confirmBox('Remplacer ton projet ?', 'Le script importé va remplacer les blocs actuels. Sauvegarde ton projet avant si tu veux le garder (📂 Projet ▸ Sauvegarder).', 'Importer', function (ok) { if (ok) importText(text, name, true, bytes); });
    return;
  }
  var nlines = text.split('\n').length;
  openDialog('<h2>🐍 Import en cours…</h2><p class="sub">' + esc(name) + ' · ' + nlines + ' lignes. Les gros scripts prennent quelques secondes.</p>');
  setTimeout(function () {
    GA.importPython(text, name.replace(/\.(py|txt)$/i, '')).then(function (res) {
      if (res.opts) opts = Object.assign(GA.defaultOpts(), res.opts);
      else opts = Object.assign(GA.defaultOpts(), { crlf: opts.crlf });
      loadState(res.state);
      if (GA.learnFromWorkspace) GA.learnFromWorkspace(ws);
      dlgClose = null; closeDialog();
      res.origText = text; res.origBytes = bytes || null;
      importReport(res);
    }).catch(function (err) {
      console.error(err);
      dlgClose = null; closeDialog();
      toast('Import impossible : ' + (err.message || err));
    });
  }, 60);
}
function importReport(res) {
  var h = '<h2>✅ Script importé</h2><p class="sub">' + esc(res.name) + '.py</p>';
  var nb = ws.getAllBlocks(false).length;
  // LE test d'identité : le fichier que l'atelier exporterait est-il exactement l'original ?
  var identical = null, nbytes = 0;
  if (built && built.mode === 'file' && res.via !== 'blocs') {
    var outText = fileText(built);
    var enc = new TextEncoder().encode(outText);
    if (res.origBytes) { nbytes = res.origBytes.length; identical = enc.length === res.origBytes.length && enc.every(function (x, i) { return x === res.origBytes[i]; }); }
    else { identical = outText === res.origText; nbytes = enc.length; }
  }
  if (identical === true) h += '<div class="okline">🧊 ⇄ 💧 Test d\'identité réussi : le fichier que l\'atelier exporte est <b>identique octet pour octet</b> à ton fichier (' + nbytes.toLocaleString('fr-FR') + ' octets).</div>';
  else if (identical === false) h += '<div class="status warn">⚠️ Le fichier exporté ne serait pas identique octet pour octet à l\'original (la structure Python, elle, est vérifiée ci-dessous).</div>';
  if (res.via === 'blocs') {
    h += '<div class="okline">♻️ Blocs restaurés à l\'identique grâce à l\'empreinte du fichier (' + nb + ' blocs).</div>';
  } else {
    var v = res.via === 'code' && built ? GA.verifyRoundTrip(res.mod, built.code) : null;
    h += '<ul class="report">';
    h += '<li><b>' + res.lines + '</b> lignes de Python → <b>' + nb + '</b> blocs.</li>';
    if (v && v.ok) h += '<li>✔ <b>Aller-retour vérifié</b> : le code produit par les blocs a exactement la même structure Python que ton fichier (' + v.statements + ' instructions, ' + v.comments + ' commentaires conservés).</li>';
    else if (v) h += '<li>⚠️ Vérification incomplète : ' + esc(v.why || (v.sameCode ? 'commentaires déplacés' : 'structure différente')) + '.</li>';
    if (res.edited) h += '<li>ℹ️ Ce fichier venait de l\'atelier mais a été modifié à la main : les blocs ont été reconstruits depuis le code.</li>';
    if (res.via === 'partiel') {
      h += '<li>🧱 <b>Erreur de syntaxe dans le fichier d\'origine</b>' + (res.error ? ' (ligne ' + res.error.pyLine + ' : ' + esc(res.error.message) + ')' : '') + '. GIMP ne pouvait déjà pas le charger. Les lignes ' +
        res.raws.map(function (x) { return x.from + (x.to > x.from ? '-' + x.to : ''); }).join(', ') + ' sont gardées telles quelles dans un bloc 🧱 code brut ; tout le reste est en blocs.</li>';
    }
    if (ws.getAllBlocks(false).some(function (b) { return b.isCollapsed(); })) h += '<li>📦 Gros script : les fonctions sont repliées. Clic droit sur une fonction ▸ « Déplier le bloc ».</li>';
    h += '<li>⬇ Tant que tu ne changes rien, le téléchargement redonne exactement ce fichier. Si tu modifies des blocs, seules les lignes touchées changent (réécrites en forme standard).</li></ul>';
  }
  var d = openDialog(h + '<div class="foot"><button class="btn" id="rCode">🐍 Voir le code</button><button class="btn primary" id="rOk" autofocus>OK</button></div>');
  d.querySelector('#rOk').onclick = closeDialog;
  d.querySelector('#rCode').onclick = function () { closeDialog(); showTab('code'); if (window.innerWidth < 900) sheet(true); };
}
function openPaste() {
  var d = openDialog('<h2>📋 Coller du code Python</h2><p class="sub">Colle un script entier (ou un morceau) : il sera transformé en blocs.</p>' +
    '<div class="field"><label for="pName">Nom du fichier</label><input type="text" id="pName" value="mon_script"></div>' +
    '<textarea class="copyzone" id="pCode" placeholder="from gimpfu import *" autofocus></textarea>' +
    '<div class="foot"><button class="btn" id="pCancel">Annuler</button><button class="btn primary" id="pGo">Transformer en blocs</button></div>', 'wide');
  d.querySelector('#pCancel').onclick = closeDialog;
  d.querySelector('#pGo').onclick = function () {
    var code = d.querySelector('#pCode').value, nm = d.querySelector('#pName').value.trim() || 'mon_script';
    if (!code.trim()) { toast('Colle d\'abord du code.'); return; }
    dlgClose = null; closeDialog(); importText(code, nm);
  };
}
function convertToPython() {
  if (GA.isFileMode(ws)) { toast('C\'est déjà un script en blocs Python.'); return; }
  confirmBox('Voir ce plug-in en blocs Python ?', 'Chaque ligne du code deviendra un bloc Python (y compris les fonctions d\'aide). C\'est plus détaillé, mais on ne peut plus revenir aux blocs simples : sauvegarde ton projet avant si tu veux le garder.', 'Transformer', function (ok) {
    if (!ok) return;
    var code = GA.buildPython(ws, opts).code;
    importText(code, baseName(), true);
  });
}
var dragDepth = 0;
document.addEventListener('dragenter', function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { dragDepth++; $('#dropHint').hidden = false; } });
document.addEventListener('dragleave', function () { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#dropHint').hidden = true; });
document.addEventListener('dragover', function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) e.preventDefault(); });
document.addEventListener('drop', function (e) {
  dragDepth = 0; $('#dropHint').hidden = true;
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) { e.preventDefault(); handleFile(f); }
});
function baseName() {
  if (ws && GA.isFileMode(ws)) return String(GA.getFileHat(ws).getFieldValue('NAME') || 'script').replace(/[\\/:*?"<>|]+/g, '_');
  return built ? GA.pyIdent(built.label, 'mon_plugin').toLowerCase() : 'mon_plugin';
}
function saveProject() {
  var data = JSON.stringify({ v: 2, app: 'atelier-gimp', ws: Blockly.serialization.workspaces.save(ws), opts: opts }, null, 1);
  saveFile(baseName() + '.atelier.json', new Blob([data], { type: 'application/json' })).then(function (how) {
    if (how) toast('Projet sauvegardé');
  });
}
function openWelcome() {
  var d = openDialog('<div class="hero"><div><h2>Crée tes plug-ins GIMP en emboîtant des blocs</h2>' +
    '<p class="sub">Pas besoin de savoir programmer : l\'atelier écrit pour toi un vrai fichier Python pour GIMP 2.10, prêt à installer.</p>' +
    '<ol class="steps"><li><b>Prends des blocs</b> dans les catégories de gauche.</li><li><b>Emboîte-les</b> sous « ▶ puis faire ».</li><li><b>Télécharge</b> ton plug-in et range-le dans le dossier plug-ins de GIMP.</li></ol></div>' +
    '<div class="stack" aria-hidden="true"><div class="pb hat" style="background:#C8930A">▶ Quand je lance « Crédits +1 »</div><div class="pb in" style="background:#E0701A">pour chaque calque</div>' +
    '<div class="pb in" style="background:#D43F7C;margin-left:44px">changer le texte</div><div class="pb in" style="background:#5E6F8A">💬 afficher « Terminé ! »</div></div></div>' +
    '<div class="tip">🎓 Tu débutes ? Le <b>cours</b> t\'emmène pas à pas de ton premier plug-in jusqu\'au vrai code Python, avec des missions vérifiées automatiquement.</div>' +
    '<div class="foot">' + (GA.sessions && GA.sessions.list().length ? '<button class="btn" id="wSes">💼 ' + T('Mes sessions') + '</button>' : '') + '<button class="btn" id="wEx">✨ Voir un exemple</button><button class="btn" id="wGuide">📘 Guide d\'utilisation</button><button class="btn" id="wGo">Commencer seul</button><button class="btn primary" id="wLearn" autofocus>🎓 Suivre le cours</button></div>', 'wide', function () { store.set(KEY_SEEN, '1'); });
  d.querySelector('#wGo').onclick = closeDialog;
  d.querySelector('#wLearn').onclick = function () { closeDialog(); if (GA.learn) GA.learn.open(); };
  if (d.querySelector('#wSes')) d.querySelector('#wSes').onclick = function () { closeDialog(); GA.sessions.open(); };
  d.querySelector('#wGuide').onclick = function () { closeDialog(); if (GA.openGuide) GA.openGuide(); };
  d.querySelector('#wEx').onclick = function () { closeDialog(); openExamples(); };
}

/* ---------- téléchargement ---------- */
var dlCap = null;
function downloads() {
  if (!dlCap) {
    dlCap = (window.claude && typeof window.claude.use === 'function')
      ? Promise.resolve().then(function () { return window.claude.use('downloads'); }).catch(function () { return null; })
      : Promise.resolve(null);
  }
  return dlCap;
}
function saveFile(filename, blob) {
  return downloads().then(function (dl) {
    if (dl && typeof dl.save === 'function') {
      return dl.save({ filename: filename, data: blob }).then(function () { return 'ok'; }, function (err) {
        var code = err && err.code;
        if (code === 'declined') return null;
        if (code === 'rate_limited') { toast('Une fenêtre d\'enregistrement est déjà ouverte.'); return null; }
        if (code === 'extension_not_enabled' || code === 'rejected_extension') { toast('Ce format de fichier n\'est pas disponible ici : utilise « Copier le code ».'); return null; }
        toast('Téléchargement impossible ici : utilise « Copier le code ».'); return null;
      });
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    return 'ok';
  });
}
var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  var enc = new TextEncoder(), parts = [], central = [], offset = 0, now = new Date();
  var time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  var date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  files.forEach(function (f) {
    var name = enc.encode(f.name), data = f.bytes, crc = crc32(data);
    var h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true);
    h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    var c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 0x0314, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true);
    c.setUint32(38, (f.mode || 0o100644) * 65536 >>> 0, true); c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + data.length;
  });
  var size = central.reduce(function (a, p) { return a + p.length; }, 0);
  var e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, size, true); e.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
}
GA.makeZip = makeZip;
function pluginCode() {
  var code = built ? built.code : '';
  return opts.crlf ? code.replace(/\r?\n/g, '\r\n') : code;
}
/* texte final du fichier : fins de ligne et BOM d'origine en mode script, réglage ⚙️ sinon */
function fileText(b, code) {
  var c = code === undefined ? b.code : code;
  var crlf = b.mode === 'file' && b.eol ? b.eol === 'crlf' : opts.crlf;
  if (crlf) c = c.replace(/\r?\n/g, '\r\n');
  if (b.mode === 'file' && b.bom) c = '\uFEFF' + c;
  return c;
}
function stripState(st) { return JSON.stringify(st, function (k, v) { return /^(id|x|y|collapsed|height|width|pinned)$/.test(k) ? undefined : v; }); }
/* « Installer dans GIMP » : le navigateur ne peut pas écrire dans AppData, alors le .py part dans
   Téléchargements sous le nom <nom>.gimp-install.py ; le lanceur Windows le range aussitôt dans
   %APPDATA%\GIMP\2.10\plug-ins (en gardant une copie de l'ancienne version). */
function installGimp(name) {
  refresh();
  if (!built) { toast('Le code n\'a pas pu être généré.'); return Promise.resolve(false); }
  name = name || ((ws && GA.isFileMode(ws) ? baseName() : (GA.pyIdent(baseName(), 'mon_plugin') || 'mon_plugin')) + '.py');
  var file = name.replace(/\.py$/i, '') + '.gimp-install.py';
  return exportCode().then(function (code) {
    return saveFile(file, new Blob([code], { type: 'text/x-python' }));
  }).then(function (ok) {
    if (ok) toast(T('Envoyé à GIMP : ') + name);
    return !!ok;
  });
}
function exportCode() {
  if (!built) return Promise.resolve('');
  var b = built, code = b.code;
  var state = Blockly.serialization.workspaces.save(ws);
  function trailer() { return GA.withTrailer(code, { v: 2, app: 'atelier-gimp', ws: state, opts: opts }).then(function (c) { return fileText(b, c); }, function () { return fileText(b); }); }
  if (opts.keepBlocks === false) return Promise.resolve(fileText(b));
  if (b.mode === 'file') {
    // l'empreinte n'est ajoutée que si le code seul ne suffit pas à retrouver ces blocs : sinon le fichier reste identique à l'original
    return GA.importPython(fileText(b), baseName()).then(function (r) {
      var tmp = new Blockly.Workspace(), same = false;
      try { Blockly.serialization.workspaces.load(r.state, tmp); same = stripState(Blockly.serialization.workspaces.save(tmp)) === stripState(state); }
      finally { tmp.dispose(); }
      return same ? fileText(b) : trailer();
    }, trailer);
  }
  return trailer();
}
function readme(pyName) {
  if (built.mode === 'file') {
    return ['Script « ' + pyName + ' »', '', 'Si c\'est un plug-in GIMP 2.10, copie ' + pyName + ' dans le dossier des plug-ins :',
      '   Windows : C:\\Users\\TON_NOM\\AppData\\Roaming\\GIMP\\2.10\\plug-ins', '   Linux   : ~/.config/GIMP/2.10/plug-ins  (puis : chmod +x ' + pyName + ')',
      'puis redémarre GIMP. Le menu est celui indiqué dans son register(...).', '',
      'Pour retrouver tes blocs : GIMP Code Block > Fichier > Importer un script Python.', ''].join('\r\n');
  }
  var menu = built.menu.replace(/^<Image>\//, '').replace(/\//g, ' > ') + ' > ' + built.label;
  return ['Plug-in « ' + built.label + ' » pour GIMP 2.10', '', 'INSTALLATION', '1. Copier ' + pyName + ' dans le dossier des plug-ins de GIMP :',
    '   Windows : C:\\Users\\TON_NOM\\AppData\\Roaming\\GIMP\\2.10\\plug-ins', '   Linux   : ~/.config/GIMP/2.10/plug-ins  (puis : chmod +x ' + pyName + ')',
    '   macOS   : ~/Library/Application Support/GIMP/2.10/plug-ins  (puis : chmod +x ' + pyName + ')',
    '   (GIMP montre ce dossier dans Édition > Préférences > Dossiers > Greffons)', '2. Redémarrer GIMP.', '3. Menu : ' + menu, '',
    'Cree avec GIMP Code Block - Plug-in Maker.', ''].join('\r\n');
}
function copyCode() {
  exportCode().then(copyText);
}
function copyText(text) {
  function fallback() {
    var d = openDialog('<h2>📋 Copier le code</h2><p class="sub">Sélectionne tout (Ctrl+A) puis copie (Ctrl+C), et colle dans un fichier texte que tu nommes <b>' + esc(baseName()) + '.py</b>.</p><textarea class="copyzone" readonly></textarea><div class="foot"><button class="btn primary" id="cz">Fermer</button></div>', 'wide');
    var ta = d.querySelector('textarea'); ta.value = text; ta.focus(); ta.select();
    d.querySelector('#cz').onclick = closeDialog;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('Code copié ! Colle-le dans un fichier ' + baseName() + '.py'); }, fallback);
  } else fallback();
}
function openExport() {
  refresh();
  if (!built) { toast('Le code n\'a pas pu être généré.'); return; }
  var c = counts();
  var status = c.error ? '<div class="status err">🛑 Il reste ' + c.error + ' problème' + (c.error > 1 ? 's' : '') + ' : le plug-in risque de ne pas marcher. Regarde l\'onglet ✅ Vérification.</div>'
    : c.warn ? '<div class="status warn">⚠️ Prêt, avec ' + c.warn + ' point' + (c.warn > 1 ? 's' : '') + ' à regarder dans l\'onglet ✅ Vérification.</div>'
      : '<div class="status ok">✅ ' + (built.mode === 'file' ? 'Ton script est prêt : chaque bloc redonne exactement sa ligne de Python.' : 'Ton plug-in est prêt : vérifié pour GIMP 2.10 et Python 2.7.') + '</div>';
  var fileMode = built.mode === 'file';
  var menu = fileMode ? 'indiqué dans son register(...)' : built.menu.replace(/^<Image>\//, '').replace(/\//g, ' ▸ ') + ' ▸ ' + built.label;
  var d = openDialog('<h2>⬇ Télécharger ' + (fileMode ? 'le script' : 'le plug-in') + '</h2><p class="sub">« ' + esc(built.label) + ' » · ' + built.lines.length + ' lignes de Python</p>' + status +
    '<div class="field"><label for="eName">Nom du fichier</label><div class="dlrow"><input type="text" id="eName" style="flex:1 1 200px"><span class="muted" style="font-weight:800">.py</span></div></div>' +
    '<div class="gimpBox"><button class="btn go" id="eGimp">🧩 Installer dans GIMP</button><div><b>Directement dans le dossier plug-ins de GIMP.</b><br><span class="muted">Garde ouverte la fenêtre de « Lancer GIMP Code Block.bat » : elle range le fichier tout de suite dans GIMP. Puis redémarre GIMP.</span></div></div>' +
    '<div id="eGimpMsg"></div>' +
    '<div class="dlrow"><button class="btn" id="eZip">⬇ Télécharger (.zip)</button><button class="btn" id="eCopy">📋 Copier le code</button><button class="btn" id="eProj">💾 Sauvegarder le projet</button></div>' +
    '<p class="muted" style="font-size:13px;margin-top:8px">Le .py est rangé dans un .zip, avec une notice.' + (opts.keepBlocks !== false ? ' Il contient aussi l\'empreinte de tes blocs : <b>réimporte ce .py (ou ce .zip) pour retrouver tes blocs à l\'identique.</b>' : ' (Empreinte des blocs désactivée dans ⚙️.)') + '</p>' +
    '<h3>Ou installer à la main</h3><ol class="steps">' +
    '<li>Ouvre le .zip et copie <b id="ePy"></b> dans le dossier des plug-ins :<br><span class="path">C:\\Users\\TON_NOM\\AppData\\Roaming\\GIMP\\2.10\\plug-ins</span><br><span class="muted" style="font-size:13px">GIMP te montre ce dossier : Édition ▸ Préférences ▸ Dossiers ▸ Greffons.</span></li>' +
    '<li>Redémarre GIMP.</li><li>Lance-le depuis le menu ' + (fileMode ? esc(menu) : '<b>' + esc(menu) + '</b>') + '.</li></ol>' +
    '<p class="muted" style="font-size:13px">Sous Linux ou macOS, rends le fichier exécutable : <span class="path">chmod +x fichier.py</span></p>' +
    '<div class="foot"><button class="btn" id="eClose">Fermer</button></div>');
  var nm = d.querySelector('#eName');
  nm.value = baseName();
  function py() { return (fileMode ? (nm.value.trim().replace(/\.py$/i, '').replace(/[\\/:*?"<>|]+/g, '_') || 'script') : (GA.pyIdent(nm.value, 'mon_plugin') || 'mon_plugin')) + '.py'; }
  function upd() { d.querySelector('#ePy').textContent = py(); }
  nm.addEventListener('input', upd); upd();
  d.querySelector('#eClose').onclick = closeDialog;
  d.querySelector('#eCopy').onclick = function () { copyCode(); };
  d.querySelector('#eProj').onclick = saveProject;
  d.querySelector('#eGimp').onclick = function () {
    installGimp(py()).then(function (ok) {
      if (!ok) return;
      d.querySelector('#eGimpMsg').innerHTML = '<div class="status ok">✅ <b>' + esc(py()) + '</b> ' + esc(T('est envoyé à GIMP.')) + '</div>' +
        '<p class="muted" style="font-size:13px">' + esc(T('Rien ne se passe ? Lance « Lancer GIMP Code Block.bat » : il installe au démarrage les plug-ins en attente dans tes Téléchargements (choix 3 du menu).')) + '</p>';
    });
  };
  d.querySelector('#eZip').onclick = function () {
    var enc = new TextEncoder(), name = py();
    Promise.all([downloads(), exportCode()]).then(function (r) {
      var dl = r[0], code = r[1];
      if (!dl) {
        // aperçu dans la conversation : téléchargement direct du .py
        return saveFile(name, new Blob([code], { type: 'text/x-python' })).then(function (ok) { if (ok) toast(name + ' téléchargé'); });
      }
      var zip = makeZip([{ name: name, bytes: enc.encode(code), mode: 0o100755 }, { name: 'LISEZ-MOI.txt', bytes: enc.encode(readme(name)) }]);
      return saveFile(name.replace(/\.py$/, '') + '.zip', zip).then(function (ok) { if (ok) toast('Téléchargé : ' + name); });
    });
  };
}
$('#bDownload').onclick = openExport;
$('#bDl2').onclick = openExport;
$('#bCopy').onclick = copyCode;
$('#bExamples').onclick = openExamples;
$('#bSettings').onclick = openSettings;
$('#bUndo').onclick = function () { ws.undo(false); };
$('#bRedo').onclick = function () { ws.undo(true); };
$('#zIn').onclick = function () { ws.zoomCenter(1); };
$('#zOut').onclick = function () { ws.zoomCenter(-1); };
$('#zFit').onclick = function () { ws.zoomToFit(); if (ws.scale > 1.1) ws.setScale(1.1); };
$('#zTidy').onclick = function () { ws.cleanUp(); };
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { if ($('#overlay').classList.contains('open')) closeDialog(); projectMenu(false); }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && !$('#overlay').classList.contains('open') && !document.querySelector('.blocklyHtmlInput')) {
    e.preventDefault(); $('#q').focus();
  }
});

/* ---------- démarrage ---------- */
function renameSetting(e) {
  var blk = ws.getBlockById(e.blockId);
  if (!blk || !GA.SPEC[blk.type] || GA.SPEC[blk.type].kind !== 'setting' || e.oldValue === e.newValue) return;
  var old = Blockly.Events.getGroup();
  Blockly.Events.setGroup(e.group || true);
  ws.getAllBlocks(false).forEach(function (b) {
    if ((b.type === 'g_setting_get' || b.type === 'g_setting_choice') && b.getFieldValue('NAME') === e.oldValue) b.setFieldValue(e.newValue, 'NAME');
  });
  Blockly.Events.setGroup(old);
}
function init() {
  if (GA.i18nEarly) GA.i18nEarly(Blockly);
  if (GA.applyPrefsEarly) GA.applyPrefsEarly();
  GA.setup(Blockly, DATA);
  setupDialogs();
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  var P = GA.prefs || {};
  ws = Blockly.inject('blockly', {
    toolbox: GA.buildToolbox(),
    renderer: P.renderer || 'zelos',
    rtl: !!GA.RTL,
    theme: (GA.isDark ? GA.isDark() : mq.matches) ? GA.themes.dark : GA.themes.light,
    media: 'https://cdn.jsdelivr.net/npm/blockly@10.4.3/media/',
    trashcan: false, sounds: false, oneBasedIndex: true,
    zoom: { controls: false, wheel: true, startScale: (P.zoom || 85) / 100, maxScale: 2, minScale: 0.2, scaleSpeed: 1.15 },
    move: { scrollbars: true, drag: true, wheel: true },
    maxInstances: { g_start: 1, py_file: 1 }
  });
  GA.ws = ws;
  if (mq.addEventListener) mq.addEventListener('change', function () { if (!GA.prefs || GA.prefs.theme === 'auto') ws.setTheme(GA.makeTheme(mq.matches)); });
  ws.registerToolboxCategoryCallback('GA_START', function (w) { return GA.startFlyout(w); });
  ws.registerToolboxCategoryCallback('GA_VARS', function (w) { return GA.varsFlyout(w); });
  ws.registerToolboxCategoryCallback('GA_PY', function (w) { return GA.pyFlyout(w); });
  GA.afterSuggest = function (b) { if (b && !b.disposed) { scheduleRefresh(); if (b.id === selectedId) renderHelp(); } };
  ws.registerButtonCallback('GA_CREATE_VAR', function (btn) { var w = btn.getTargetWorkspace(); if (GA.isFileMode(w) && GA.createScriptVar) GA.createScriptVar(w); else Blockly.Variables.createVariableButtonHandler(w, null, ''); });
  ws.addChangeListener(function (e) {
    if (e.type === Blockly.Events.SELECTED) {
      selectedId = e.newElementId || null;
      renderHelp(); highlightCode(true);
      if (selectedId && window.innerWidth >= 900 && !$('#p-learn').classList.contains('on')) showTab($('#p-check').classList.contains('on') ? 'check' : ($('#p-code').classList.contains('on') ? 'code' : 'help'));
      return;
    }
    if (e.type === Blockly.Events.TOOLBOX_ITEM_SELECT && e.newItem && $('#q').value) { $('#q').value = ''; }
    if (e.isUiEvent) return;
    if (e.type === Blockly.Events.BLOCK_CHANGE && e.element === 'field' && e.name === 'NAME') renameSetting(e);
    scheduleRefresh();
  });
  var proj = null;
  try { proj = JSON.parse(store.get(KEY) || 'null'); } catch (err) { proj = null; }
  opts = Object.assign(GA.defaultOpts(), (proj && proj.opts) || {});
  $('#loading').remove();
  loadState(proj && proj.ws ? proj.ws : GA.emptyProject());
  if (GA.toolsInit) GA.toolsInit();
  if (GA.ai) GA.ai.init();
  if (!store.get(KEY_SEEN)) openWelcome();
  window.addEventListener('resize', function () { Blockly.svgResize(ws); });
  GA.ws = ws; GA.app = { openDialog: openDialog, closeDialog: closeDialog, confirmBox: confirmBox, saveFile: saveFile, openExamples: openExamples, openSettings: openSettings, saveProject: saveProject, openPaste: openPaste, convertToPython: convertToPython, openWelcome: openWelcome, importText: importText, handleFile: handleFile, readZip: readZip, exportCode: exportCode, refresh: refresh, openExport: openExport, openExamples: openExamples, openSettings: openSettings, openPicker: openPicker, installGimp: installGimp, showTab: showTab, loadState: loadState, getBuilt: function () { return built; }, getIssues: function () { return issues; }, getOpts: function () { return opts; } };
  GA.app.flush = save;
  if (GA.sessions) GA.sessions.init();
}
function start() {
  if (!window.Blockly) { $('#loading').textContent = 'Impossible de charger Blockly (connexion ?). Recharge la page.'; return; }
  var fontsReady = document.fonts && document.fonts.load
    ? Promise.all(['800 12px Nunito', '900 12px Nunito', '700 12px Nunito'].map(function (f) { return document.fonts.load(f); }))
    : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(init, init).catch(function (err) {
    console.error(err);
    $('#loading').textContent = 'Erreur au démarrage : ' + err.message;
  });
}
start();
})();
