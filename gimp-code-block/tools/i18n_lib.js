// Loads the translation tables in Node (no DOM) and lists every translatable unit with its id.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TABLES = ['core.js', 'i18n.js', 'i18n_en.js', 'i18n_blocks.js', 'i18n_learn_en.js'];
const PACKS = ['es', 'de', 'pt', 'ru', 'hi', 'ar'];

function load() {
  globalThis.GA = undefined;
  for (const f of TABLES.concat(PACKS.map(l => 'lang/' + l + '.js'), ['i18n_apply.js'])) {
    const p = path.join(SRC, f);
    delete require.cache[require.resolve(p)];
    require(p);
  }
  return globalThis.GA;
}
function units(GA) { return GA.i18nUnits().map(u => Object.assign({ id: GA.i18nId(u.key) }, u)); }
// what must survive translation unchanged: %ARGS, $1, <tags>, {placeholders}, `code`
function marks(s) {
  const m = [].concat(s.match(/%[A-Z0-9_]+/g) || [], s.match(/\$\d/g) || [], (s.match(/<\/?(?:b|i|br|code|kbd|small|span|div|p|ul|ol|li|h\d)\b/g) || []), s.match(/\{[a-z0-9_]+\}/g) || [], s.match(/`[^`]+`/g) || []);
  return m.sort().join(' ');
}
module.exports = { ROOT, SRC, PACKS, load, units, marks };
