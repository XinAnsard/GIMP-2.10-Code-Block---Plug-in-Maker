/* Atelier — applique le paquet de la langue choisie par-dessus les tables anglaises (ce qui manque reste en anglais) */
(function (root) {
'use strict';
var GA = root.GA;
/* chaque texte traduisible a un identifiant : genre|clé (voir tools/i18n_master.js) */
GA.i18nUnits = function () {
  var out = [];
  function add(key, en) { if (typeof en === 'string' && en) out.push({ key: key, en: en }); }
  Object.keys(GA.EN || {}).forEach(function (k) { add('ui|' + k, GA.EN[k]); });
  (GA.EN_RX || []).forEach(function (r) { add('rx|' + r[0].source, r[1]); });
  Object.keys(GA.EN_CATS || {}).forEach(function (k) { GA.EN_CATS[k].forEach(function (v, i) { add('cat|' + k + '|' + i, v); }); });
  Object.keys(GA.EN_SEP || {}).forEach(function (k) { add('sep|' + k, GA.EN_SEP[k]); });
  Object.keys(GA.EN_DD || {}).forEach(function (k) { add('dd|' + k, GA.EN_DD[k]); });
  Object.keys(GA.EN_STATE || {}).forEach(function (k) { add('state|' + k, GA.EN_STATE[k]); });
  Object.keys(GA.EN_EXAMPLES || {}).forEach(function (k) { GA.EN_EXAMPLES[k].forEach(function (v, i) { add('ex|' + k + '|' + i, v); }); });
  Object.keys(GA.EN_BLOCKS || {}).forEach(function (k) { GA.EN_BLOCKS[k].forEach(function (v, i) { add('blk|' + k + '|' + i, v); }); });
  return out;
};
GA.applyLangPack = function (code) {
  var P = GA.I18N[code];
  if (!P) return 0;
  var n = 0;
  function tr(key, v) { var t = P[GA.i18nId(key)]; if (t === undefined) return v; n++; return t; }
  Object.keys(GA.EN).forEach(function (k) { GA.EN[k] = tr('ui|' + k, GA.EN[k]); });
  GA.EN_RX.forEach(function (r) { r[1] = tr('rx|' + r[0].source, r[1]); });
  Object.keys(GA.EN_CATS).forEach(function (k) { GA.EN_CATS[k] = GA.EN_CATS[k].map(function (v, i) { return tr('cat|' + k + '|' + i, v); }); });
  [['sep', GA.EN_SEP], ['dd', GA.EN_DD], ['state', GA.EN_STATE]].forEach(function (x) { Object.keys(x[1]).forEach(function (k) { x[1][k] = tr(x[0] + '|' + k, x[1][k]); }); });
  Object.keys(GA.EN_EXAMPLES).forEach(function (k) { GA.EN_EXAMPLES[k] = GA.EN_EXAMPLES[k].map(function (v, i) { return tr('ex|' + k + '|' + i, v); }); });
  Object.keys(GA.EN_BLOCKS).forEach(function (k) { GA.EN_BLOCKS[k] = GA.EN_BLOCKS[k].map(function (v, i) { return v ? tr('blk|' + k + '|' + i, v) : v; }); });
  return n;
};
if (GA.lang !== 'fr' && GA.lang !== 'en') GA.applyLangPack(GA.lang);
})(typeof window !== 'undefined' ? window : globalThis);
