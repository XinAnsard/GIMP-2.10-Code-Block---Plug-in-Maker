/* Atelier — apparence, recherche, liste des fonctions, tutoriel, actions des menus */
(function () {
'use strict';
var GA = window.GA;
var T = function (s) { return GA.T ? GA.T(s) : s; };
var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ws() { return GA.ws; }
function store() { return GA.store; }

/* ================= préférences d'apparence ================= */
var PKEY = 'atelier-gimp-apparence';
var PRESETS = {
  atelier: { renderer: 'zelos', palette: 'atelier', font: 11.5, family: 'nunito', icons: true, bg: 'dots' },
  minimal: { renderer: 'thrasos', palette: 'mono', font: 11, family: 'system', icons: false, bg: 'plain' },
  classique: { renderer: 'geras', palette: 'vive', font: 11, family: 'system', icons: true, bg: 'grid' },
  contraste: { renderer: 'zelos', palette: 'contraste', font: 13, family: 'nunito', icons: true, bg: 'plain' }
};
var PALETTES = {
  vive: { start: '#E6A100', control: '#FF8C1A', ops: '#40A840', vars: '#F2621D', image: '#4C97FF', layer: '#9966FF', sel: '#0FAF84', paint: '#CF63CF', text: '#FF5C82', path: '#3FA3CF', file: '#B7823B', msg: '#7A8499', py: '#3776AB', adv: '#5B6275' },
  contraste: { start: '#8A5E00', control: '#A34400', ops: '#1B6E2E', vars: '#A61F18', image: '#0A4FB0', layer: '#4527B0', sel: '#006A5C', paint: '#7C1D92', text: '#9C1A50', path: '#00648A', file: '#5E3C1C', msg: '#35445E', py: '#1C4775', adv: '#222838' },
  mono: {}
};
var DEFAULT_PREFS = { preset: 'atelier', theme: 'auto', renderer: 'zelos', palette: 'atelier', colors: {}, font: 11.5, family: 'nunito', zoom: 85, bg: 'dots', icons: true, drag: 'auto', dragN: 60 };
GA.prefs = Object.assign({}, DEFAULT_PREFS, (function () { try { return JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) { return {}; } })());
GA.savePrefs = function () { try { localStorage.setItem(PKEY, JSON.stringify(GA.prefs)); } catch (e) { /* ok */ } };
var ORIG = null;
/* à appeler AVANT GA.setup : couleurs, police, icônes des catégories */
GA.applyPrefsEarly = function () {
  var p = GA.prefs;
  if (!ORIG) ORIG = { cats: GA.CATS.map(function (c) { return { id: c.id, colour: c.colour, name: c.name }; }), py: Object.assign({}, GA.PY_STYLES) };
  GA.CATS.forEach(function (c, i) {
    var o = ORIG.cats[i], col = o.colour;
    if (p.palette === 'vive' || p.palette === 'contraste') col = PALETTES[p.palette][c.id] || col;
    else if (p.palette === 'mono') col = GA.shade ? GA.shade('#5E6A84', (i % 3) * 0.06 - 0.06) : '#5E6A84';
    else if (p.palette === 'pastel') col = GA.shade ? GA.shade(o.colour, 0.22) : col;
    else if (p.palette === 'perso' && p.colors[c.id]) col = p.colors[c.id];
    c.colour = col;
    c.name = p.icons ? o.name : o.name.replace(/^[^\wÀ-ÿ]+\s*/, '');
  });
  var py = Object.assign({}, ORIG.py);
  if (p.palette === 'mono') Object.keys(py).forEach(function (k) { py[k] = k === 'cat_pyraw' ? '#8C5A4E' : '#6B7489'; });
  if (p.palette === 'contraste') { py.cat_pycall = '#0B665D'; py.cat_pyleaf = '#3D4A5E'; py.cat_pyexpr = '#1B6E2E'; }
  Object.keys(py).forEach(function (k) { GA.PY_STYLES[k] = py[k]; });
  GA.FONT_SIZE = p.font;
  GA.FONT_FAMILY = p.family === 'system' ? '"Segoe UI", system-ui, -apple-system, sans-serif' : p.family === 'mono' ? '"JetBrains Mono", Consolas, monospace' : '"Nunito", "Segoe UI", system-ui, sans-serif';
};
GA.isDark = function () { var t = GA.prefs.theme; if (t === 'dark') return true; if (t === 'light') return false; return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); };
/* à chaud : thème clair/sombre, fond, couleurs, police */
GA.applyLivePrefs = function () {
  var p = GA.prefs, root = document.documentElement;
  if (p.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', p.theme);
  var wrap = $('#wsWrap');
  if (wrap) { wrap.classList.toggle('bgGrid', p.bg === 'grid'); wrap.classList.toggle('bgPlain', p.bg === 'plain'); }
  if (!ws() || !GA.makeTheme) return;
  GA.applyPrefsEarly();
  GA.rebuildStyles();
  ws().setTheme(GA.makeTheme(GA.isDark()));
  ws().updateToolbox(GA.buildToolbox());
};
GA.openAppearance = function () {
  var p = Object.assign({}, GA.prefs), cats = GA.CATS;
  var sw = cats.map(function (c) { return '<label class="swatch"><input type="color" data-cat="' + c.id + '" value="' + (p.colors[c.id] || c.colour) + '"><span>' + esc(c.name) + '</span></label>'; }).join('');
  var d = GA.app.openDialog('<h2>🎨 ' + T('Apparence') + '</h2><p class="sub">' + T('Du plus sobre au plus personnalisé. Les changements s\'appliquent tout de suite (la forme des blocs recharge la page).') + '</p>' +
    '<div class="presetRow">' + ['atelier', 'minimal', 'classique', 'contraste'].map(function (k) { return '<button class="card preset" data-p="' + k + '"><b>' + T({ atelier: 'Atelier (par défaut)', minimal: 'Minimal', classique: 'Classique', contraste: 'Contraste élevé' }[k]) + '</b><span>' + T({ atelier: 'Blocs arrondis, couleurs vives et douces', minimal: 'Blocs fins, gris, sans icônes', classique: 'Blocs à l\'ancienne, style Blockly', contraste: 'Gros texte, couleurs foncées' }[k]) + '</span></button>'; }).join('') + '</div>' +
    '<div class="row2"><div class="field"><label>' + T('Thème de l\'interface') + '</label><select id="apTheme"><option value="auto">' + T('Automatique (comme le système)') + '</option><option value="light">' + T('Clair') + '</option><option value="dark">' + T('Sombre') + '</option></select></div>' +
    '<div class="field"><label>' + T('Forme des blocs') + '</label><select id="apRend"><option value="zelos">' + T('Arrondie (style Scratch)') + '</option><option value="geras">' + T('Classique (style Blockly)') + '</option><option value="thrasos">' + T('Compacte') + '</option></select></div></div>' +
    '<div class="row2"><div class="field"><label>' + T('Couleurs des catégories') + '</label><select id="apPal"><option value="atelier">' + T('Atelier') + '</option><option value="vive">' + T('Vives') + '</option><option value="pastel">' + T('Pastel') + '</option><option value="mono">' + T('Monochrome') + '</option><option value="contraste">' + T('Contraste élevé') + '</option><option value="perso">' + T('Personnalisées') + '</option></select></div>' +
    '<div class="field"><label>' + T('Fond de la zone de travail') + '</label><select id="apBg"><option value="dots">' + T('Trame de points') + '</option><option value="grid">' + T('Quadrillage') + '</option><option value="plain">' + T('Uni') + '</option></select></div></div>' +
    '<div class="row2"><div class="field"><label>' + T('Texte des blocs') + ' : <span id="apFontV"></span> px</label><input type="range" id="apFont" min="9" max="16" step="0.5"></div>' +
    '<div class="field"><label>' + T('Police des blocs') + '</label><select id="apFam"><option value="nunito">Nunito</option><option value="system">' + T('Police du système') + '</option><option value="mono">' + T('Machine à écrire (code)') + '</option></select></div></div>' +
    '<div class="row2"><div class="field"><label>' + T('Zoom au démarrage') + ' : <span id="apZoomV"></span> %</label><input type="range" id="apZoom" min="50" max="130" step="5"></div>' +
    '<div class="field"><label>' + T('Silhouette pendant les déplacements') + '</label><select id="apDrag"><option value="auto">' + T('Auto : dès 60 blocs déplacés') + '</option><option value="always">' + T('Toujours (le plus fluide)') + '</option><option value="never">' + T('Jamais (déplacement réel)') + '</option></select></div></div>' +
    '<div class="checks"><label><input type="checkbox" id="apIcons"><span>' + T('Icônes dans les noms de catégories') + '</span></label></div>' +
    '<div id="apPerso"><h3>' + T('Couleurs personnalisées') + '</h3><div class="swatches">' + sw + '</div></div>' +
    '<div class="foot"><button class="btn" id="apReset">' + T('Tout réinitialiser') + '</button><button class="btn primary" id="apOk">' + T('Fermer') + '</button></div>', 'wide');
  function v(id) { return d.querySelector(id); }
  function fill() {
    v('#apTheme').value = p.theme; v('#apRend').value = p.renderer; v('#apPal').value = p.palette; v('#apBg').value = p.bg;
    v('#apFont').value = p.font; v('#apFontV').textContent = p.font; v('#apFam').value = p.family;
    v('#apZoom').value = p.zoom; v('#apZoomV').textContent = p.zoom; v('#apDrag').value = p.drag; v('#apIcons').checked = !!p.icons;
    v('#apPerso').style.display = p.palette === 'perso' ? '' : 'none';
    d.querySelectorAll('.preset').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-p') === p.preset); });
  }
  var needReload = false;
  function apply() {
    needReload = needReload || p.renderer !== GA.prefs.renderer;
    GA.prefs = Object.assign({}, p);
    GA.savePrefs();
    GA.applyLivePrefs();
    fill();
  }
  d.querySelectorAll('.preset').forEach(function (b) {
    b.onclick = function () { var k = b.getAttribute('data-p'); Object.assign(p, PRESETS[k]); p.preset = k; if (k === 'contraste') p.theme = 'dark'; apply(); };
  });
  [['#apTheme', 'theme'], ['#apRend', 'renderer'], ['#apPal', 'palette'], ['#apBg', 'bg'], ['#apFam', 'family'], ['#apDrag', 'drag']].forEach(function (x) {
    v(x[0]).onchange = function () { p[x[1]] = this.value; p.preset = 'perso'; apply(); };
  });
  v('#apFont').oninput = function () { p.font = Number(this.value); v('#apFontV').textContent = p.font; };
  v('#apFont').onchange = function () { p.preset = 'perso'; apply(); };
  v('#apZoom').oninput = function () { p.zoom = Number(this.value); v('#apZoomV').textContent = p.zoom; };
  v('#apZoom').onchange = function () { apply(); ws().setScale(p.zoom / 100); };
  v('#apIcons').onchange = function () { p.icons = this.checked; p.preset = 'perso'; apply(); };
  d.querySelectorAll('.swatch input').forEach(function (inp) { inp.onchange = function () { p.colors = Object.assign({}, p.colors); p.colors[inp.getAttribute('data-cat')] = inp.value; p.palette = 'perso'; p.preset = 'perso'; apply(); }; });
  v('#apReset').onclick = function () { p = Object.assign({}, DEFAULT_PREFS, { colors: {} }); apply(); };
  v('#apOk').onclick = function () {
    GA.app.closeDialog();
    if (needReload) GA.app.confirmBox(T('Recharger l\'atelier ?'), T('La nouvelle forme des blocs s\'applique après un rechargement (ton projet est gardé).'), T('Recharger'), function (ok) { if (ok) location.reload(); });
  };
  fill();
};

/* ================= rechercher / remplacer ================= */
GA.find = (function () {
  var hits = [], cur = -1, bar;
  function fieldsOf(b) {
    var out = [];
    b.inputList.forEach(function (inp) { inp.fieldRow.forEach(function (f) { if (f.name && f.EDITABLE !== undefined && (f instanceof Blockly.FieldTextInput || f instanceof Blockly.FieldDropdown || f instanceof Blockly.FieldLabelSerializable)) out.push(f); }); });
    return out;
  }
  function editable(f) { return f instanceof Blockly.FieldTextInput && !(f instanceof Blockly.FieldNumber) || (Blockly.FieldMultilineInput && f instanceof Blockly.FieldMultilineInput); }
  function rx() {
    var q = bar.querySelector('#fQ').value;
    if (!q) return null;
    var e = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (bar.querySelector('#fW').checked) e = '\\b' + e + '\\b';
    return new RegExp(e, bar.querySelector('#fC').checked ? 'g' : 'gi');
  }
  function search() {
    hits = []; cur = -1;
    var re = rx();
    if (re) {
      var hat = GA.getHat(ws()), all = [];
      ws().getTopBlocks(true).forEach(function (t) { all = all.concat(t.getDescendants(true)); });
      all.forEach(function (b) {
        if (b.isShadow() && !b.getParent()) return;
        fieldsOf(b).forEach(function (f) { var txt = String(f.getText ? f.getText() : f.getValue()); re.lastIndex = 0; if (re.test(txt)) hits.push({ b: b, f: f }); });
      });
    }
    bar.querySelector('#fN').textContent = hits.length ? '0/' + hits.length : (rx() ? T('aucun résultat') : '');
  }
  function go(dir) {
    if (!hits.length) search();
    if (!hits.length) return;
    cur = (cur + dir + hits.length) % hits.length;
    var h = hits[cur], b = h.b;
    while (b.isShadow() && b.getParent()) b = b.getParent();
    GA.reveal(b);
    bar.querySelector('#fN').textContent = (cur + 1) + '/' + hits.length;
  }
  function replaceOne(all) {
    var re = rx();
    if (!re) return;
    var rep = bar.querySelector('#fR').value, n = 0;
    if (!hits.length) search();
    var list = all ? hits : (cur >= 0 ? [hits[cur]] : hits.slice(0, 1));
    Blockly.Events.setGroup(true);
    try {
      list.forEach(function (h) {
        if (!editable(h.f)) return;
        var v = String(h.f.getValue()), nv = v.replace(re, rep);
        if (nv !== v) { h.f.setValue(nv); n++; }
      });
    } finally { Blockly.Events.setGroup(false); }
    GA.toast(n + ' ' + T('remplacement(s)') + (n < list.length ? ' — ' + T('les étiquettes et menus ne sont pas modifiables') : ''));
    search(); if (!all) go(1);
  }
  return {
    init: function () {
      bar = $('#findBar');
      if (!bar) return;
      bar.querySelector('#fQ').addEventListener('input', search);
      bar.querySelector('#fQ').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(e.shiftKey ? -1 : 1); } if (e.key === 'Escape') GA.find.close(); });
      bar.querySelector('#fR').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); replaceOne(false); } if (e.key === 'Escape') GA.find.close(); });
      ['#fC', '#fW'].forEach(function (s) { bar.querySelector(s).addEventListener('change', search); });
      bar.querySelector('#fNext').onclick = function () { go(1); };
      bar.querySelector('#fPrev').onclick = function () { go(-1); };
      bar.querySelector('#fRep').onclick = function () { replaceOne(false); };
      bar.querySelector('#fRepAll').onclick = function () { replaceOne(true); };
      bar.querySelector('#fClose').onclick = function () { GA.find.close(); };
    },
    open: function (withReplace) {
      bar.hidden = false;
      bar.classList.toggle('rep', !!withReplace);
      var q = bar.querySelector('#fQ'); q.focus(); q.select();
      search();
    },
    close: function () { bar.hidden = true; }
  };
})();

/* ================= liste des fonctions (aller à…) ================= */
GA.openFunctions = function () {
  var built = GA.app.getBuilt(), items = [];
  ws().getAllBlocks(true).forEach(function (b) {
    if (!/^(py_def|py_class|g_start)$/.test(b.type)) return;
    var ln = built ? built.lines.findIndex(function (l) { return l.id === b.id; }) + 1 : 0;
    var label = b.type === 'g_start' ? '▶ ' + b.getFieldValue('LABEL') : (b.type === 'py_class' ? 'class ' : 'def ') + b.getFieldValue('NAME') + (b.type === 'py_def' ? '(' + b.getFieldValue('ARGS') + ')' : '');
    var depth = 0, p = b.getSurroundParent(); while (p) { depth++; p = p.getSurroundParent(); }
    items.push({ b: b, ln: ln || 1e9, label: label, depth: depth, folded: b.isCollapsed() });
  });
  items.sort(function (a, b) { return a.ln - b.ln; });
  var d = GA.app.openDialog('<h2>📋 ' + T('Liste des fonctions') + '</h2><p class="sub">' + items.length + ' ' + T('fonction(s) — clique pour y aller') + '</p>' +
    '<div class="pickHead"><input id="fnQ" type="search" placeholder="' + T('Filtrer…') + '" autofocus></div><div class="pickList" id="fnL"></div>' +
    '<div class="foot"><button class="btn" id="fnC">' + T('Fermer') + '</button></div>', 'wide');
  function render() {
    var q = d.querySelector('#fnQ').value.toLowerCase();
    d.querySelector('#fnL').innerHTML = items.filter(function (it) { return !q || it.label.toLowerCase().indexOf(q) >= 0; }).map(function (it, i) {
      return '<button class="pick" data-i="' + items.indexOf(it) + '" style="margin-left:' + it.depth * 18 + 'px"><code>' + esc(it.label) + '</code><span class="bl">' + (it.ln < 1e9 ? T('ligne') + ' ' + it.ln : '') + (it.folded ? ' · ' + T('repliée') : '') + '</span></button>';
    }).join('');
  }
  d.querySelector('#fnQ').oninput = render;
  d.querySelector('#fnL').onclick = function (e) { var p = e.target.closest('.pick'); if (!p) return; GA.app.closeDialog(); var it = items[+p.getAttribute('data-i')]; GA.reveal(it.b); };
  d.querySelector('#fnC').onclick = GA.app.closeDialog;
  render();
};

/* ================= tutoriel guidé ================= */
GA.tour = (function () {
  var steps = [
    { t: 'Bienvenue dans l\'Atelier 👋', x: 'Ici, tu crées des <b>plug-ins pour GIMP 2.10</b> (des commandes qui s\'ajoutent aux menus de GIMP) en emboîtant des blocs. L\'atelier écrit le vrai code Python à ta place.<br><br>Ce tutoriel dure 2 minutes. Tu peux le relancer avec <b>Aide ▸ Tutoriel</b> ou <b>F1</b>.' },
    { t: 'Dans quoi tu t\'embarques', x: '<b>Il te faut GIMP 2.10</b> avec Python (l\'installeur Windows l\'inclut). GIMP 3 utilise un autre système : les plug-ins de l\'atelier ne marchent pas dans GIMP 3.<br><br>Un plug-in est un vrai programme : <b>essaie-le d\'abord sur une copie</b> de tes images. L\'atelier vérifie énormément de choses (fonctions de GIMP, cases vides, syntaxe…), mais seul GIMP exécute vraiment le plug-in.' },
    { s: '.blocklyToolboxDiv', t: 'Les catégories de blocs', x: 'Chaque couleur est une famille : calques, sélection, texte, fichiers… Clique une catégorie, puis glisse un bloc dans la zone de travail. La catégorie <b>🐍 Python</b> contient les blocs des scripts importés.' },
    { s: 'hat', t: 'Le bloc de départ', x: 'Tout part d\'ici : le nom de ton plug-in dans le menu de GIMP, les réglages demandés à l\'utilisateur (<i>d\'abord, demander</i>) et les actions (<i>puis faire</i>), exécutées de haut en bas.' },
    { s: '#side', t: 'L\'aide qui explique tout', x: 'Clique sur n\'importe quel bloc : son rôle, le code Python qu\'il produit et les fonctions de GIMP qu\'il utilise s\'affichent ici.' },
    { s: '#t-code', t: 'Le vrai code', x: 'L\'onglet Code montre le fichier Python complet. Clique une ligne : son bloc est sélectionné. Clique un bloc : ses lignes s\'allument.' },
    { s: '#t-check', t: 'La vérification', x: 'Si quelque chose cloche (case vide, bloc isolé, fonction inconnue…), c\'est signalé ici en français, avec un lien vers le bloc concerné.' },
    { s: '.menubar', t: 'Les menus, comme dans Notepad++', x: '<b>Fichier</b> : ouvrir, importer un script Python existant (il devient des blocs, et redevient exactement le même fichier). <b>Édition</b> : sélection multiple (Ctrl + clic), copier-coller. <b>Recherche</b> : Ctrl+F. <b>Affichage</b> : tout déplier (Alt+Maj+0). <b>Paramètres</b> : apparence, langue.' },
    { s: '#t-ai', t: 'L\'IA qui écrit pour toi', x: 'Décris ce que tu veux (« une fonction qui renomme tous les calques texte… ») : l\'IA écrit le code, l\'atelier le vérifie (fonctions de GIMP 2.10, nombre d\'arguments, règles Python 2.7) puis le transforme en blocs.' },
    { s: '#bDownload', t: 'Installer ton plug-in', x: 'Télécharge le .zip, copie le fichier .py dans <b>C:\\Users\\TON_NOM\\AppData\\Roaming\\GIMP\\2.10\\plug-ins</b>, puis redémarre GIMP. Ton plug-in apparaît dans le menu choisi.' },
    { t: 'À toi de jouer ! 🎨', x: 'Commence par un exemple (<b>Fichier ▸ Exemples</b>) et modifie-le, ou importe un de tes scripts. Ton travail est enregistré automatiquement dans ce navigateur ; pense à <b>Fichier ▸ Sauvegarder le projet</b> pour le garder ailleurs.' }
  ];
  var k = 0, root;
  function target(s) {
    if (!s) return null;
    if (s === 'hat') { var h = GA.getHat(ws()); return h ? h.getSvgRoot() : null; }
    return $(s);
  }
  function show() {
    var st = steps[k], el = target(st.s), card = root.querySelector('.tourCard'), hole = root.querySelector('.tourHole');
    card.querySelector('h3').textContent = T(st.t);
    card.querySelector('.tx').innerHTML = GA.T ? GA.T(st.x) : st.x;
    card.querySelector('.n').textContent = (k + 1) + ' / ' + steps.length;
    card.querySelector('.prev').disabled = k === 0;
    card.querySelector('.next').textContent = k === steps.length - 1 ? T('Terminer') : T('Suivant');
    var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    if (r && r.width && r.height) {
      var pad = 6, W = window.innerWidth, H = window.innerHeight;
      var x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad), w = Math.min(W - x - 4, r.width + pad * 2), h = Math.min(H - y - 4, r.height + pad * 2);
      hole.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px';
      hole.hidden = false;
      var cw = Math.min(380, W - 24), ch = card.offsetHeight || 220, cx, cy;
      if (x + w + cw + 16 < W) { cx = x + w + 12; cy = Math.min(Math.max(12, y), H - ch - 12); }
      else if (x - cw - 16 > 0) { cx = x - cw - 12; cy = Math.min(Math.max(12, y), H - ch - 12); }
      else { cx = Math.max(12, Math.min(W - cw - 12, x)); cy = y + h + 12 + ch < H ? y + h + 12 : Math.max(12, y - ch - 12); }
      card.style.left = cx + 'px'; card.style.top = cy + 'px'; card.classList.remove('center');
    } else {
      hole.hidden = true;
      card.style.left = ''; card.style.top = ''; card.classList.add('center');
    }
  }
  return {
    start: function () {
      GA.closeMenus && GA.closeMenus();
      root = $('#tour');
      if (!root) return;
      k = 0; root.hidden = false;
      root.querySelector('.prev').onclick = function () { if (k > 0) { k--; show(); } };
      root.querySelector('.next').onclick = function () { if (k < steps.length - 1) { k++; show(); } else GA.tour.stop(); };
      root.querySelector('.skip').onclick = function () { GA.tour.stop(); };
      show();
    },
    stop: function () { if (root) root.hidden = true; try { localStorage.setItem('atelier-gimp-tuto', '1'); } catch (e) { /* ok */ } },
    steps: steps
  };
})();

/* ================= raccourcis & à propos ================= */
GA.openShortcuts = function () {
  var rows = [['Ctrl + clic / Ctrl + clic droit', 'Ajouter / retirer un bloc de la sélection'], ['Maj + glisser dans le vide', 'Sélection au lasso'], ['Ctrl + A', 'Tout sélectionner'], ['Ctrl + C / X / V', 'Copier / couper / coller (blocs et code Python)'], ['Ctrl + D', 'Dupliquer la sélection'], ['Suppr', 'Supprimer la sélection'], ['Échap', 'Vider la sélection'], ['Ctrl + Z / Ctrl + Y', 'Annuler / rétablir'], ['Ctrl + F / Ctrl + H', 'Rechercher / remplacer'], ['Ctrl + G', 'Aller à une fonction'], ['Alt + 0 / Alt + Maj + 0', 'Replier toutes les fonctions / tout déplier'], ['Ctrl + S / Ctrl + O', 'Sauvegarder le projet / importer un fichier'], ['/', 'Chercher un bloc dans la boîte à outils'], ['Ctrl + Entrée', 'Envoyer la demande à l\'IA'], ['F1', 'Tutoriel']];
  var d = GA.app.openDialog('<h2>⌨️ ' + T('Raccourcis clavier') + '</h2><table class="keys">' + rows.map(function (r) { return '<tr><td><kbd>' + esc(r[0]) + '</kbd></td><td>' + esc(T(r[1])) + '</td></tr>'; }).join('') + '</table><div class="foot"><button class="btn primary" id="kOk">OK</button></div>');
  d.querySelector('#kOk').onclick = GA.app.closeDialog;
};
GA.openAbout = function () {
  var d = GA.app.openDialog('<h2>🧩 ' + T('GIMP Code Block — Plug-in Maker') + '</h2><p class="sub">' + T('Crée des plug-ins Python pour GIMP 2.10 avec des blocs, importe tes scripts existants et fais-toi aider par l\'IA.') + '</p>' +
    '<ul class="report"><li>' + T('Version 1.0 — import / export fidèles, testés sur 819 scripts réels (767 de GitHub + 52 privés), tous identiques octet pour octet après aller-retour.') + '</li><li>' + T('857 fonctions de la PDB officielle de GIMP 2.10, Python 2.7, gimpfu.') + '</li><li>' + T('Blockly 10 (Google, licence Apache 2.0).') + '</li></ul><div class="foot"><button class="btn primary" id="abOk">OK</button></div>');
  d.querySelector('#abOk').onclick = GA.app.closeDialog;
};
GA.setLang = function (lang) {
  try { localStorage.setItem('atelier-gimp-lang', lang); } catch (e) { /* ok */ }
  location.reload();
};

/* ================= actions des menus ================= */
GA.actions = {
  undo: function () { ws().undo(false); }, redo: function () { ws().undo(true); },
  copy: function () { GA.copySel(false); }, cut: function () { GA.copySel(true); }, paste: function () { GA.pasteInternal(); },
  duplicate: function () { GA.duplicateSel(); }, del: function () { GA.deleteSel(); }, selectAll: function () { GA.selectAll(); }, selectNone: function () { GA.selClear(); },
  tidy: function () { ws().cleanUp(); },
  find: function () { GA.find.open(false); }, replace: function () { GA.find.open(true); }, functions: function () { GA.openFunctions(); },
  blockSearch: function () { var q = $('#q'); if (q) q.focus(); },
  expandAll: function () { GA.expandAll(); }, collapseAll: function () { GA.collapseFunctions(); },
  expandSel: function () { var l = GA.selBlocks(); if (!l.length) { GA.toast('Sélectionne d\'abord des blocs (Ctrl + clic).'); return; } l.forEach(function (b) { if (b.isCollapsed()) b.setCollapsed(false); GA.expandAll(b); }); },
  collapseSel: function () { GA.selBlocks().forEach(function (b) { GA.collapseDeep(b); }); },
  zoomIn: function () { ws().zoomCenter(1); }, zoomOut: function () { ws().zoomCenter(-1); }, zoom100: function () { ws().setScale(1); ws().scrollCenter(); },
  zoomFit: function () { ws().zoomToFit(); },
  toggleSide: function () { document.body.classList.toggle('noSide'); setTimeout(function () { Blockly.svgResize(ws()); }, 60); },
  appearance: function () { GA.openAppearance(); },
  theme: function () { var t = GA.prefs.theme; GA.prefs.theme = t === 'auto' ? (GA.isDark() ? 'light' : 'dark') : (t === 'dark' ? 'light' : 'dark'); GA.savePrefs(); GA.applyLivePrefs(); },
  langFr: function () { GA.setLang('fr'); }, langEn: function () { GA.setLang('en'); },   // anciens noms (raccourcis enregistrés)
  tour: function () { GA.tour.start(); }, shortcuts: function () { GA.openShortcuts(); }, about: function () { GA.openAbout(); },
  saveProject: function () { GA.app.saveProject(); }, importFile: function () { var f = $('#fileOpen'); f.value = ''; f.click(); },
  aiPanel: function () { if (GA.ai) GA.ai.show(); }, aiSettings: function () { if (GA.ai) GA.ai.openSettings(); },
  downloadAtelier: function () { if (GA.ai) GA.ai.downloadAtelier(); }
};
(GA.LANGS || []).forEach(function (l) { GA.actions['lang_' + l.code] = function () { GA.setLang(l.code); }; });
})();
