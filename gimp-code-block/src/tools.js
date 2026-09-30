/* Atelier — outils façon Notepad++ : menus, sélection multiple, presse-papiers, silhouette, plier/déplier */
(function () {
'use strict';
var GA = window.GA;
var T = function (s) { return GA.T ? GA.T(s) : s; };
var $ = function (s) { return document.querySelector(s); };
var store = {
  get: function (k, d) { try { var v = window.localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
};
GA.store = store;
function ws() { return GA.ws; }
function toast(m) { var t = $('#toast'); if (!t) return; t.textContent = T(m); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, 2600); }
GA.toast = toast;
function inField(e) { var el = e.target; return el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable || el.closest && el.closest('.blocklyHtmlInput,.blocklyWidgetDiv')); }
function dialogOpen() { var o = $('#overlay'); return o && o.classList.contains('open'); }

/* ================= barre de menus ================= */
GA.closeMenus = function () {
  document.querySelectorAll('.mb.open').forEach(function (m) { m.classList.remove('open'); var b = m.querySelector('.mbBtn'); if (b) b.setAttribute('aria-expanded', 'false'); });
};
function setupMenubar() {
  document.querySelectorAll('.mb').forEach(function (m) {
    var btn = m.querySelector('.mbBtn');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var was = m.classList.contains('open');
      GA.closeMenus();
      if (!was) { m.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
    btn.addEventListener('mouseenter', function () {
      if (document.querySelector('.mb.open') && !m.classList.contains('open')) { GA.closeMenus(); m.classList.add('open'); }
    });
    m.querySelector('.menu').addEventListener('click', function (e) { if (e.target.closest('button')) setTimeout(GA.closeMenus, 0); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.mb')) GA.closeMenus(); });
  var A = GA.actions;
  document.querySelectorAll('[data-act]').forEach(function (b) {
    b.addEventListener('click', function () { var f = A[b.getAttribute('data-act')]; if (f) f(); });
  });
}

/* ================= sélection multiple ================= */
var SEL = new Set();
GA.sel = SEL;
function blockOf(el) {
  var g = el && el.closest && el.closest('[data-id]');
  if (!g || g.closest('.blocklyFlyout')) return null;
  var b = ws().getBlockById(g.getAttribute('data-id'));
  while (b && b.isShadow() && b.getParent()) b = b.getParent();
  return b;
}
function mark(b, on) { var r = b && b.getSvgRoot && b.getSvgRoot(); if (r) r.classList.toggle('gaMulti', on); }
function refreshBar() {
  var bar = $('#selBar');
  prune();
  var n = SEL.size;
  if (!bar) return;
  bar.hidden = !n;
  if (n) bar.querySelector('.selN').textContent = n + ' ' + T(n > 1 ? 'blocs sélectionnés' : 'bloc sélectionné');
}
function prune() { SEL.forEach(function (id) { var b = ws().getBlockById(id); if (!b) SEL.delete(id); }); }
GA.selToggle = function (b, on) {
  if (!b || !b.isDeletable || (b.type === 'g_start' || b.type === 'py_file')) return;
  var has = SEL.has(b.id);
  var want = on === undefined ? !has : on;
  if (want) SEL.add(b.id); else SEL.delete(b.id);
  mark(b, want);
  refreshBar();
};
GA.selClear = function () { SEL.forEach(function (id) { mark(ws().getBlockById(id), false); }); SEL.clear(); refreshBar(); };
GA.selBlocks = function () {
  prune();
  var list = [];
  SEL.forEach(function (id) { var b = ws().getBlockById(id); if (b) list.push(b); });
  if (!list.length) { var s = Blockly.common.getSelected && Blockly.common.getSelected(); if (s && s.type && s.workspace === ws() && s.type !== 'g_start' && s.type !== 'py_file') list.push(s); }
  // retirer les blocs déjà contenus dans un autre bloc sélectionné (via ses entrées)
  var ids = {};
  list.forEach(function (b) { ids[b.id] = true; });
  list = list.filter(function (b) { var p = b.getSurroundParent(); while (p) { if (ids[p.id]) return false; p = p.getSurroundParent(); } return true; });
  // ordre du document
  var order = {}, k = 0;
  ws().getTopBlocks(true).forEach(function (t) { t.getDescendants(true).forEach(function (d) { order[d.id] = k++; }); });
  list.sort(function (a, b) { return order[a.id] - order[b.id]; });
  return list;
};
/* suites d'instructions consécutives */
GA.selRuns = function () {
  var list = GA.selBlocks(), inSel = {}, runs = [];
  list.forEach(function (b) { inSel[b.id] = true; });
  list.forEach(function (b) {
    var pv = b.previousConnection ? b.getPreviousBlock() : null;
    if (pv && inSel[pv.id] && pv.getNextBlock() === b) return;
    var run = [b], n = b.nextConnection ? b.getNextBlock() : null;
    while (n && inSel[n.id]) { run.push(n); n = n.getNextBlock(); }
    runs.push(run);
  });
  return runs;
};
GA.selectBlocks = function (blocks) { GA.selClear(); blocks.forEach(function (b) { GA.selToggle(b, true); }); };

/* code Python d'une liste de blocs (sans repères internes) */
GA.codeOfRuns = function (runs) {
  var G = GA.G, ctx = GA.ctx;
  ctx.reset(ws()); G.isInitialized = true;
  var old = G.STATEMENT_PREFIX; G.STATEMENT_PREFIX = null;
  var parts = [];
  try {
    runs.forEach(function (run) {
      var code = '';
      run.forEach(function (b) {
        var c = G.blockToCode(b, true);
        if (Array.isArray(c)) c = c[0] + '\n';
        code += c;
      });
      parts.push(code);
    });
  } finally { G.STATEMENT_PREFIX = old; }
  var text = parts.join('\n').replace(/\u0006([^\u0007]*)\u0007/g, '$1').replace(/\u0001[^\u0002]*\u0002/g, '').replace(/\u0000/g, '');
  // retirer l'indentation commune
  var lines = text.split('\n'), min = 1e9;
  lines.forEach(function (l) { if (l.trim()) min = Math.min(min, l.length - l.replace(/^\s+/, '').length); });
  if (min < 1e9 && min > 0) text = lines.map(function (l) { return l.slice(Math.min(min, l.length - l.replace(/^\s+/, '').length)); }).join('\n');
  return text.replace(/\n+$/, '\n');
};

/* ================= presse-papiers ================= */
var CLIP = null, lastText = null;
function stateOf(b) { return Blockly.serialization.blocks.save(b, { addCoordinates: false, addNextBlocks: false, saveIds: false }); }
GA.copySel = function (cut) {
  var runs = GA.selRuns();
  if (!runs.length) { toast('Sélectionne d\'abord des blocs (Ctrl + clic).'); return false; }
  CLIP = runs.map(function (run) {
    var first = null, prev = null;
    run.forEach(function (b) { var st = stateOf(b); if (prev) prev.next = { block: st }; else first = st; prev = st; });
    return first;
  });
  var text = '';
  try { text = GA.codeOfRuns(runs); } catch (e) { text = ''; }
  lastText = text;
  if (navigator.clipboard && navigator.clipboard.writeText && text) navigator.clipboard.writeText(text).catch(function () { /* refusé : presse-papiers interne seulement */ });
  var n = runs.reduce(function (a, r) { return a + r.length; }, 0);
  if (cut) { GA.deleteSel(true); toast(n + ' ' + T('bloc(s) coupé(s)')); }
  else toast(n + ' ' + T('bloc(s) copié(s) (blocs + code Python)'));
  return true;
};
function placeAt(blocks, dx, dy) {
  var vm = ws().getMetricsManager().getViewMetrics(true);
  blocks.forEach(function (b, i) { b.moveBy(vm.left + vm.width * 0.25 + (dx || 0) + i * 24, vm.top + 60 + (dy || 0) + i * 24); });
}
GA.pasteStates = function (states, at) {
  if (!states || !states.length) return [];
  Blockly.Events.setGroup(true);
  var out = [];
  try {
    states.forEach(function (st) { out.push(Blockly.serialization.blocks.append(JSON.parse(JSON.stringify(st)), ws())); });
    if (at) out.forEach(function (b, i) { b.moveBy(at.x + i * 24, at.y + i * 24); }); else placeAt(out);
  } finally { Blockly.Events.setGroup(false); }
  var all = [];
  out.forEach(function (b) { var x = b; while (x) { all.push(x); x = x.getNextBlock(); } });
  GA.selectBlocks(all);
  return out;
};
GA.pasteInternal = function () { if (!CLIP) { toast('Presse-papiers vide.'); return; } var bl = GA.pasteStates(CLIP); toast(bl.length + ' ' + T('bloc(s) collé(s)')); };
GA.duplicateSel = function () {
  var runs = GA.selRuns();
  if (!runs.length) return;
  var states = runs.map(function (run) { var first = null, prev = null; run.forEach(function (b) { var st = stateOf(b); if (prev) prev.next = { block: st }; else first = st; prev = st; }); return first; });
  var xy = runs[0][0].getRelativeToSurfaceXY();
  GA.pasteStates(states, { x: xy.x + 40, y: xy.y + 40 });
  toast('Copie créée à côté de l\'original.');
};
GA.deleteSel = function (quiet) {
  var list = GA.selBlocks().filter(function (b) { return b.isDeletable(); });
  if (!list.length) return;
  Blockly.Events.setGroup(true);
  try { list.forEach(function (b) { if (!b.disposed) b.dispose(true, false); }); }
  finally { Blockly.Events.setGroup(false); }
  GA.selClear();
  if (!quiet) toast(list.length + ' ' + T('bloc(s) supprimé(s) — Ctrl+Z pour annuler'));
};
GA.selectAll = function () {
  var hat = GA.getHat(ws()), list = [];
  var b = hat && hat.getInputTargetBlock('DO');
  while (b) { list.push(b); b = b.getNextBlock(); }
  ws().getTopBlocks(false).forEach(function (t) { if (t !== hat && !t.isShadow()) list.push(t); });
  GA.selectBlocks(list);
};
/* coller du code Python venu d'ailleurs : il devient des blocs */
GA.pasteCode = function (text) {
  var code = GA.dedent(text);
  return GA.importPython(code, 'colle').then(function (r) {
    if (r.via === 'partiel') { toast('Ce texte n\'est pas du Python valide : collé dans un bloc de code brut.'); }
    var hat = r.state.blocks.blocks[0], first = hat.inputs && hat.inputs.DO && hat.inputs.DO.block;
    if (!first) return;
    var bl = GA.pasteStates([first]);
    toast(T('Code Python collé en blocs') + ' (' + (r.count - 1) + ')');
    return bl;
  });
};
GA.dedent = function (text) {
  var lines = String(text).replace(/\r\n?/g, '\n').replace(/^\n+/, '').split('\n'), min = 1e9;
  lines.forEach(function (l) { if (l.trim()) min = Math.min(min, l.length - l.replace(/^[ \t]+/, '').length); });
  if (min > 0 && min < 1e9) lines = lines.map(function (l) { return l.trim() ? l.slice(min) : l.replace(/^[ \t]+$/, ''); });
  return lines.join('\n').replace(/\s+$/, '') + '\n';
};

/* ================= silhouette pendant les gros déplacements ================= */
var ptr = { x: 0, y: 0 }, sil = null;
document.addEventListener('pointerdown', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; }, true);
function silThreshold() { var m = GA.prefs.drag || 'auto'; return m === 'always' ? 1 : m === 'never' ? Infinity : (GA.prefs.dragN || 60); }
function silStart(id) {
  var b = ws().getBlockById(id);
  if (!b) return;
  var n = b.getDescendants(false).length;
  if (n < silThreshold()) return;
  var root = b.getSvgRoot(), r = root.getBoundingClientRect();
  var d = document.createElement('div');
  d.className = 'gaSil';
  d.style.left = r.left + 'px'; d.style.top = r.top + 'px'; d.style.width = Math.max(40, r.width) + 'px'; d.style.height = Math.max(24, Math.min(r.height, 6000)) + 'px';
  d.innerHTML = '<span>' + n + ' ' + T('blocs') + '</span>';
  document.body.appendChild(d);
  root.style.visibility = 'hidden';
  var ox = ptr.x, oy = ptr.y;
  function mv(e) { d.style.transform = 'translate(' + (e.clientX - ox) + 'px,' + (e.clientY - oy) + 'px)'; }
  document.addEventListener('pointermove', mv, true);
  sil = { id: id, div: d, root: root, mv: mv };
}
function silEnd() {
  if (!sil) return;
  document.removeEventListener('pointermove', sil.mv, true);
  sil.div.remove();
  sil.root.style.visibility = '';
  sil = null;
}

/* ================= plier / déplier ================= */
var FOLDABLE = /^(py_def|py_class|py_if|py_for|py_while|py_try|py_with|c_|g_start)/;
function batch(fn) {
  var w = ws();
  Blockly.Events.setGroup(true);
  w.setResizesEnabled(false);
  try { fn(); } finally { w.setResizesEnabled(true); Blockly.Events.setGroup(false); }
}
GA.expandAll = function (root) {
  var list = (root ? root.getDescendants(false) : ws().getAllBlocks(false)).filter(function (b) { return b.isCollapsed(); });
  if (!list.length) { toast('Rien à déplier.'); return; }
  if (list.length > 20) toast('Dépliage en cours…');
  setTimeout(function () { batch(function () { list.forEach(function (b) { b.setCollapsed(false); }); }); toast(list.length + ' ' + T('bloc(s) déplié(s)')); }, 30);
};
GA.collapseFunctions = function () {
  var list = ws().getAllBlocks(false).filter(function (b) { return (b.type === 'py_def' || b.type === 'py_class') && !b.isCollapsed(); });
  if (!list.length) { toast('Aucune fonction à replier.'); return; }
  batch(function () { list.forEach(function (b) { b.setCollapsed(true); }); });
  toast(list.length + ' ' + T('fonction(s) repliée(s)'));
};
GA.collapseDeep = function (root) {
  var list = root.getDescendants(false).filter(function (b) { return FOLDABLE.test(b.type) && !b.isCollapsed() && b !== root; }).reverse();
  batch(function () { list.forEach(function (b) { b.setCollapsed(true); }); if (root.type !== 'g_start' && root.type !== 'py_file') root.setCollapsed(true); });
};
GA.reveal = function (b) {
  if (!b) return;
  var p = b.getSurroundParent(), chain = [];
  while (p) { if (p.isCollapsed()) chain.push(p); p = p.getSurroundParent(); }
  if (b.isCollapsed && b.isCollapsed() && FOLDABLE.test(b.type)) { /* laisser la fonction repliée si c'est elle qu'on vise */ }
  if (chain.length) batch(function () { chain.forEach(function (x) { x.setCollapsed(false); }); });
  setTimeout(function () { b.select(); ws().centerOnBlock(b.id); }, chain.length ? 60 : 0);
};
function registerContextItems() {
  var R = Blockly.ContextMenuRegistry.registry;
  function reg(id, text, pre, cb, w) {
    try { R.unregister(id); } catch (e) { /* absent */ }
    R.register({ id: id, weight: w, scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
      displayText: function () { return T(text); }, preconditionFn: pre, callback: cb });
  }
  reg('gaExpandDeep', '📂 Déplier tout le contenu', function (s) { return s.block.getDescendants(false).some(function (b) { return b.isCollapsed(); }) ? 'enabled' : 'hidden'; },
    function (s) { GA.expandAll(s.block); }, 20);
  reg('gaCollapseDeep', '📁 Replier tout le contenu', function (s) { return FOLDABLE.test(s.block.type) || s.block.getChildren(false).length ? 'enabled' : 'hidden'; },
    function (s) { GA.collapseDeep(s.block); }, 21);
  reg('gaSelect', '☑️ Ajouter à la sélection (Ctrl + clic)', function (s) { return s.block.type === 'g_start' || s.block.type === 'py_file' ? 'hidden' : 'enabled'; },
    function (s) { GA.selToggle(s.block, true); }, 22);
  reg('gaAskAI', '🤖 Demander à l\'IA sur ce bloc…', function (s) { return s.block.type === 'g_start' || s.block.type === 'py_file' ? 'hidden' : 'enabled'; },
    function (s) { if (!SEL.has(s.block.id)) GA.selectBlocks([s.block]); if (GA.ai) GA.ai.openForSelection(); }, 23);
}

/* ================= raccourcis clavier (façon Notepad++) ================= */
var pendingPaste = null;
function keys(e) {
  var k = e.key, c = e.ctrlKey || e.metaKey;
  if (dialogOpen()) return;
  if (k === 'F1') { e.preventDefault(); GA.actions.tour(); return; }
  if (c && !e.shiftKey && (k === 'f' || k === 'F')) { e.preventDefault(); GA.find.open(false); return; }
  if (c && (k === 'h' || k === 'H')) { e.preventDefault(); GA.find.open(true); return; }
  if (c && e.shiftKey && (k === 'g' || k === 'G')) { e.preventDefault(); GA.actions.installGimp(); return; }   // G comme GIMP
  if (c && (k === 'g' || k === 'G')) { e.preventDefault(); GA.actions.functions(); return; }
  if (c && (k === 's' || k === 'S')) { e.preventDefault(); GA.actions.saveProject(); return; }
  if (c && (k === 'o' || k === 'O')) { e.preventDefault(); GA.actions.importFile(); return; }
  if (e.altKey && k === '0') { e.preventDefault(); if (e.shiftKey) GA.expandAll(); else GA.collapseFunctions(); return; }
  if (e.altKey && e.code === 'Digit0') { e.preventDefault(); if (e.shiftKey) GA.expandAll(); else GA.collapseFunctions(); return; }
  if (inField(e)) return;
  if (c && (k === 'a' || k === 'A')) { e.preventDefault(); GA.selectAll(); return; }
  if (c && (k === 'c' || k === 'C')) { if (GA.selBlocks().length) { e.preventDefault(); e.stopPropagation(); GA.copySel(false); } return; }
  if (c && (k === 'x' || k === 'X')) { if (GA.selBlocks().length) { e.preventDefault(); e.stopPropagation(); GA.copySel(true); } return; }
  if (c && (k === 'd' || k === 'D')) { e.preventDefault(); e.stopPropagation(); GA.duplicateSel(); return; }
  if (c && (k === 'v' || k === 'V')) { e.stopPropagation(); clearTimeout(pendingPaste); pendingPaste = setTimeout(function () { if (CLIP) GA.pasteInternal(); }, 180); return; }
  if ((k === 'Delete' || k === 'Backspace') && SEL.size) { e.preventDefault(); e.stopPropagation(); GA.deleteSel(); return; }
  if (k === 'Escape' && SEL.size) { GA.selClear(); }
}
function onPaste(e) {
  if (inField(e) || dialogOpen()) return;
  var text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
  clearTimeout(pendingPaste);
  e.preventDefault();
  if (CLIP && (!text || text === lastText)) { GA.pasteInternal(); return; }
  if (text && text.trim()) { GA.pasteCode(text); return; }
  if (CLIP) GA.pasteInternal();
}

/* ================= installation ================= */
GA.toolsInit = function () {
  var w = ws(), host = $('#blockly');
  setupMenubar();
  registerContextItems();
  // Blockly ne gère plus copier / couper / coller : l'atelier s'en charge (sélection multiple + code Python)
  ['copy', 'cut', 'paste'].forEach(function (n) { try { Blockly.ShortcutRegistry.registry.unregister(n); } catch (e) { /* absent */ } });
  document.addEventListener('keydown', keys, true);
  document.addEventListener('paste', onPaste);
  // Ctrl + clic (gauche ou droit) : ajouter / retirer un bloc de la sélection ; Maj + glisser dans le vide : lasso
  host.addEventListener('pointerdown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.button === 0 || e.button === 2)) {
      var b = blockOf(e.target);
      if (b) { e.preventDefault(); e.stopPropagation(); GA.selToggle(b); }
      return;
    }
    if (e.shiftKey && e.button === 0 && !blockOf(e.target) && e.target.closest('.blocklySvg') && !e.target.closest('.blocklyFlyout,.blocklyScrollbarHandle,.blocklyToolboxDiv')) {
      e.preventDefault(); e.stopPropagation(); lasso(e);
    }
  }, true);
  host.addEventListener('contextmenu', function (e) { if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation(); } }, true);
  w.addChangeListener(function (e) {
    if (e.type === Blockly.Events.BLOCK_DRAG) { if (e.isStart) silStart(e.blockId); else silEnd(); }
    if (e.type === Blockly.Events.BLOCK_DELETE) refreshBar();
    if (e.type === Blockly.Events.CLICK && e.targetType === 'workspace' && SEL.size) GA.selClear();
  });
  // remarquer les blocs sélectionnés après un nouveau rendu
  w.addChangeListener(function (e) { if (e.type === Blockly.Events.FINISHED_LOADING) SEL.clear(); });
  var bar = $('#selBar');
  if (bar) bar.addEventListener('click', function (e) {
    var a = e.target.closest('[data-sel]');
    if (!a) return;
    var act = a.getAttribute('data-sel');
    if (act === 'copy') GA.copySel(false); else if (act === 'cut') GA.copySel(true); else if (act === 'dup') GA.duplicateSel();
    else if (act === 'del') GA.deleteSel(); else if (act === 'ai') { if (GA.ai) GA.ai.openForSelection(); } else if (act === 'clear') GA.selClear();
    else if (act === 'unfold') GA.selBlocks().forEach(function (b) { GA.expandAll(b); });
  });
  if (GA.find) GA.find.init();
  if (GA.applyLivePrefs) GA.applyLivePrefs();
};
function lasso(e0) {
  var d = document.createElement('div'); d.className = 'gaLasso'; document.body.appendChild(d);
  var x0 = e0.clientX, y0 = e0.clientY, rect = null;
  function mv(e) {
    var l = Math.min(x0, e.clientX), t = Math.min(y0, e.clientY), r = Math.max(x0, e.clientX), b = Math.max(y0, e.clientY);
    rect = { l: l, t: t, r: r, b: b };
    d.style.left = l + 'px'; d.style.top = t + 'px'; d.style.width = (r - l) + 'px'; d.style.height = (b - t) + 'px';
  }
  function up() {
    document.removeEventListener('pointermove', mv, true); document.removeEventListener('pointerup', up, true);
    d.remove();
    if (!rect || rect.r - rect.l < 6) return;
    var hits = ws().getAllBlocks(false).filter(function (b) {
      if (b.isShadow() || b.type === 'g_start' || b.type === 'py_file') return false;
      var r = b.getSvgRoot().getBoundingClientRect();
      return r.width > 0 && r.left >= rect.l && r.right <= rect.r && r.top >= rect.t && r.bottom <= rect.b;
    });
    var ids = {}; hits.forEach(function (b) { ids[b.id] = true; });
    hits = hits.filter(function (b) { var p = b.getSurroundParent(); while (p) { if (ids[p.id]) return false; p = p.getSurroundParent(); } return true; });
    hits.forEach(function (b) { GA.selToggle(b, true); });
    if (hits.length) toast(hits.length + ' ' + T('bloc(s) ajouté(s) à la sélection'));
  }
  document.addEventListener('pointermove', mv, true); document.addEventListener('pointerup', up, true);
}
})();
