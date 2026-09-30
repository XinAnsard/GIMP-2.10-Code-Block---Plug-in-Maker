// Lists the French texts of the course and the guide (src/learn.js), in a stable order.
// Used to write src/i18n_learn_en.js: node tools/learn_strings.js > /tmp/fr.json
const path = require('path');
globalThis.GA = { T: s => s };
require(path.join(__dirname, '..', 'src', 'learn.js'));
const GA = globalThis.GA, out = [];
function add(s) { if (s && out.indexOf(s) < 0) out.push(s); }
GA.LEARN_LEVELS.forEach(l => { add(l.t); add(l.d); });
GA.LEARN.forEach(l => { add(l.t); add(l.goal); l.p.forEach(add); l.steps.forEach(add); add(l.hint); add(l.tip); (l.acts || []).forEach(a => add(a.l)); });
GA.GUIDE.forEach(g => { add(g.t); g.p.forEach(add); });
// interface strings used by learn.js
const fs = require('fs');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'learn.js'), 'utf8');
(src.match(/T\('((?:[^'\\]|\\.)*)'\)/g) || []).forEach(m => add(eval(m.slice(2, -1))));
module.exports = out;
if (require.main === module) console.log(JSON.stringify(out, null, 1));
