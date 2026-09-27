const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, corpusFiles, corpusDir, outDir, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
const PY = GA.py;
const files = corpusFiles();
function decode(buf) { let s; try { s = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { s = new TextDecoder('windows-1252').decode(buf); } return s.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'); }
let ok = 0, fail = [], warnings = [], t0 = Date.now();
const manifest = [];
files.forEach(f => {
  const src = decode(fs.readFileSync(f));
  const name = path.basename(f);
  try {
    const m1 = PY.parseAuto(src);
    const out1 = PY.printFile(m1);
    const m2 = PY.parse(out1, { py3: m1.py3 });
    const out2 = PY.printFile(m2);
    const probs = [], warn = [];
    if (out1 !== out2) probs.push('impression non stable');
    if (PY.dump(m1) !== PY.dump(m2)) probs.push('structure JS différente');
    const c1 = PY.comments(m1).slice().sort().join('\n'), c2 = PY.comments(m2).slice().sort().join('\n');
    // A comment sitting inside the arguments of a multi-line call is kept in the
    // statement's raw text, not as a comment node, so the collector sees one less on
    // the second pass. The printed bytes are identical, so this is a warning.
    if (c1 !== c2) (out1 === out2 ? warn : probs).push('commentaires comptés différemment (texte identique)');
    fs.writeFileSync(outDir('parse') + '/' + name.replace(/ /g, '_') + (name.endsWith('.py') ? '' : '.py'), out1);
    manifest.push([f, outDir('parse') + '/' + name.replace(/ /g, '_') + (name.endsWith('.py') ? '' : '.py'), m1.py3 ? 3 : 2]);
    if (warn.length) warnings.push(name + ' : ' + warn.join(', '));
    if (probs.length) fail.push(name + ' : ' + probs.join(', ')); else ok++;
  } catch (e) {
    if (!e.isPy) { console.log(name, e.stack); }
    fail.push(name + ' : ERREUR ' + e.message + ' ligne ' + e.pyLine);
  }
});
fs.writeFileSync(outDir('parse') + '/manifest.json', JSON.stringify(manifest));
console.log('OK', ok, '/', files.length, 'en', Date.now() - t0, 'ms');
fail.forEach(x => console.log('  ✘ ' + x));
warnings.forEach(x => console.log('  ⚠ ' + x));
if (fail.length) process.exit(1);
