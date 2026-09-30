/* Atelier — langues : le texte source est en français ; l'anglais sert de base aux autres langues
   (GA.EN… contient l'anglais, et pour es/de/pt/ru/hi/ar il est remplacé par le paquet de langue : voir i18n_apply.js) */
(function (root) {
'use strict';
var GA = root.GA;
GA.LANGS = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', ai: 'French' }, { code: 'en', name: 'English', flag: '🇬🇧', ai: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', ai: 'Spanish' }, { code: 'de', name: 'Deutsch', flag: '🇩🇪', ai: 'German' },
  { code: 'pt', name: 'Português (Brasil)', flag: '🇧🇷', ai: 'Brazilian Portuguese', blockly: 'pt-br', html: 'pt-BR' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', ai: 'Russian' }, { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', ai: 'Hindi' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', ai: 'Arabic', rtl: true }
];
function langInfo(c) { for (var i = 0; i < GA.LANGS.length; i++) if (GA.LANGS[i].code === c) return GA.LANGS[i]; return null; }
GA.langInfo = langInfo;
var lang = null;
try { lang = root.localStorage && localStorage.getItem('atelier-gimp-lang'); } catch (e) { lang = null; }
if (!langInfo(lang)) {
  var nav = typeof navigator !== 'undefined' ? String(navigator.language || 'fr').toLowerCase() : 'fr';
  lang = langInfo(nav.slice(0, 2)) ? nav.slice(0, 2) : 'en';
  if (typeof navigator === 'undefined') lang = 'fr';
}
GA.lang = lang;
GA.RTL = !!langInfo(lang).rtl;
GA.I18N = GA.I18N || {};   // paquets de langue : GA.I18N.es = { identifiant: texte }
/* identifiant stable d'un texte à traduire (FNV-1a 32 bits, base 36) */
GA.i18nId = function (s) {
  var h = 0x811c9dc5;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
};
GA.EN = GA.EN || {};        // texte français exact -> anglais
GA.EN_RX = GA.EN_RX || [];  // [expression régulière, remplacement] pour les textes avec des parties variables
GA.T = function (s) {
  if (GA.lang === 'fr' || s === null || s === undefined) return s;
  var str = String(s), k = str.replace(/\s+/g, ' ').trim();
  if (!k) return str;
  var t = GA.EN[k];
  if (t === undefined) {
    for (var i = 0; i < GA.EN_RX.length; i++) { var r = GA.EN_RX[i]; if (r[0].test(k)) { t = k.replace(r[0], r[1]); break; } }
  }
  if (t === undefined) return str;
  var lead = /^\s*/.exec(str)[0], trail = /\s*$/.exec(str)[0];
  return lead + t + trail;
};
/* traduction automatique de tout ce qui apparaît dans la page (hors code et blocs) */
var SKIP = '#code, .snippet, .aiCode, .copyzone, #blockly, .blocklyWidgetDiv, .blocklyDropDownDiv, .blocklyTooltipDiv, pre, textarea, code, .path, .aiText, .aiMsg.user, script, style, .sgChip, .sgSub';
function trNode(n) {
  if (!n) return;
  if (n.nodeType === 3) {
    var p = n.parentNode;
    if (!p || (p.closest && p.closest(SKIP))) return;
    var v = n.nodeValue;
    if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) return;
    var t = GA.T(v);
    if (t !== v) n.nodeValue = t;
    return;
  }
  if (n.nodeType !== 1 || (n.closest && n.closest(SKIP))) return;
  ['placeholder', 'title', 'aria-label'].forEach(function (a) {
    var v = n.getAttribute(a);
    if (v) { var t = GA.T(v); if (t !== v) n.setAttribute(a, t); }
  });
  for (var c = n.firstChild; c; c = c.nextSibling) trNode(c);
}
GA.trDom = trNode;
var domDone = false;
GA.i18nDom = function () {
  if (GA.lang === 'fr' || typeof document === 'undefined' || !document.body) return;
  trNode(document.body);
  if (domDone) return;
  domDone = true;
  var li = langInfo(GA.lang);
  document.documentElement.lang = li.html || li.code;
  if (li.rtl) document.documentElement.dir = 'rtl';
  document.title = 'GIMP Code Block — Plug-in Maker';
  if (typeof MutationObserver === 'undefined') return;
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      if (m.type === 'characterData') trNode(m.target);
      else m.addedNodes.forEach(trNode);
      if (m.type === 'attributes') trNode(m.target);
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
};
/* avant la création des blocs : Blockly, catégories, menus, aides Python, exemples */
GA.i18nEarly = function (Blockly) {
  if (GA.lang === 'fr') return;
  var msgs = root.__BLOCKLY_MSG || {};
  var bl = msgs[langInfo(GA.lang).blockly || GA.lang] || root.__BLOCKLY_EN;
  if (Blockly && bl) Blockly.setLocale(bl);
  var C = GA.EN_CATS || {};
  GA.CATS.forEach(function (c) { if (C[c.id]) { c.name = C[c.id][0]; c.intro = C[c.id][1]; } });
  GA.MENUS.forEach(function (m) { if (GA.EN_DD && GA.EN_DD[m[0]]) m[0] = GA.EN_DD[m[0]]; });
  var h = GA.HELPERS && GA.HELPERS._enregistrer_xcf_a_cote;
  if (h) h.code = h.code.map(function (l) { return l.replace('Image jamais enregistrée : impossible de savoir où mettre le .xcf', 'Image never saved: cannot know where to put the .xcf'); });
  (GA.exampleDefs || []).forEach(function (ex) {
    var E = (GA.EN_EXAMPLES || {})[ex.id];
    if (E) { ex.title = E[0]; ex.desc = E[1]; }
    var build = ex.build;
    ex.build = function () { return GA.trState(build()); };
  });
  var eg = GA.emptyProject;
  GA.emptyProject = function () { return GA.trState(eg()); };
  GA.i18nDom();
};
/* textes contenus dans un état de blocs (exemples, projet vide) */
GA.trState = function (st) {
  if (GA.lang === 'fr') return st;
  var M = GA.EN_STATE || {};
  (function walk(x) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (x.fields) for (var k in x.fields) { var v = x.fields[k]; if (typeof v === 'string' && M[v] !== undefined) x.fields[k] = M[v]; }
    for (var j in x) if (j !== 'fields' && x[j] && typeof x[j] === 'object') walk(x[j]);
  })(st);
  return st;
};
/* textes des blocs : message, aide, astuce, séparateurs, menus déroulants, valeurs par défaut */
GA.translateSpecs = function (SPECS) {
  if (GA.lang === 'fr') return;
  var B = GA.EN_BLOCKS || {}, DD = GA.EN_DD || {}, ST = GA.EN_STATE || {}, SEP = GA.EN_SEP || {};
  SPECS.forEach(function (s) {
    var e = B[s.type];
    if (e) {
      if (e[0]) s.msg = e[0];
      if (e[1]) s.help = e[1];
      if (e[2] !== undefined) s.tip = e[2] || undefined;
      if (s.title && e[3]) s.title = e[3];
      else if (s.title) delete s.title;
    }
    if (s.sep && SEP[s.sep]) s.sep = SEP[s.sep];
    for (var k in s.args || {}) {
      var a = s.args[k];
      if (a.k === 'dd') a.options = a.options.map(function (o) { return [DD[o[0]] !== undefined ? DD[o[0]] : o[0], o[1]]; });
      if (a.k === 'text' && ST[a.value] !== undefined) a.value = ST[a.value];
      if (a.sh && a.sh.fields && typeof a.sh.fields.TEXT === 'string' && ST[a.sh.fields.TEXT] !== undefined) a.sh = JSON.parse(JSON.stringify(a.sh)), a.sh.fields.TEXT = ST[a.sh.fields.TEXT];
    }
    if (s.box) s.box = GA.trState(JSON.parse(JSON.stringify(s.box)));
  });
};
})(typeof window !== 'undefined' ? window : globalThis);
