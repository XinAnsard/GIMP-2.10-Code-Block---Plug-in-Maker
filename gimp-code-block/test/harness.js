// Shared loader for the headless tests: resolves paths from the repo root,
// loads Blockly, the source files and the PDB data, and returns the GA namespace.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DATA = path.join(ROOT, 'data');

// Source files needed for code generation and import (no DOM, so no app.js/tools).
const HEADLESS = ['core.js', 'pyparse.js', 'specs_a.js', 'specs_b.js', 'specs_c.js', 'specs_d.js',
  'pyblocks.js', 'gen.js', 'pyimport.js', 'examples.js'];

function loadBlockly(locale) {
  const Blockly = require('blockly');
  if (locale !== false) Blockly.setLocale(require('blockly/msg/' + (locale || 'fr')));
  return Blockly;
}

function loadGA(Blockly, files) {
  globalThis.GA = undefined;
  (files || HEADLESS).forEach(f => {
    delete require.cache[require.resolve(path.join(SRC, f))];
    require(path.join(SRC, f));
  });
  const GA = globalThis.GA;
  const data = JSON.parse(fs.readFileSync(path.join(DATA, 'sigs.json'), 'utf8'));
  data.pyconst = JSON.parse(fs.readFileSync(path.join(DATA, 'pyconst.json'), 'utf8'));
  try { data.popular = JSON.parse(fs.readFileSync(path.join(DATA, 'popular.json'), 'utf8')); } catch (e) { data.popular = []; }
  GA.setup(Blockly, data);
  GA.DATA = data;   // raw PDB payload, handy for the tests
  return GA;
}

// Scripts used by the round-trip tests. Defaults to the fixtures shipped with the
// repo; point CORPUS at your own folder of .py plug-ins (see docs/TESTS.md).
function corpusDir() {
  return process.env.CORPUS || path.join(ROOT, 'test', 'fixtures');
}

function corpusFiles(dir) {
  const d = dir || corpusDir();
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith('.py')).sort().map(f => path.join(d, f));
}

// test/out/<sub>/ ; created on demand so tests never fail on a missing folder
function outDir(sub) {
  const d = sub ? path.join(ROOT, 'test', 'out', sub) : path.join(ROOT, 'test', 'out');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

module.exports = { ROOT, SRC, DATA, HEADLESS, loadBlockly, loadGA, corpusDir, corpusFiles, outDir };
