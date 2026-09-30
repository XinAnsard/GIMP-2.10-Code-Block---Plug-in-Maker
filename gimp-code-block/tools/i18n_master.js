#!/usr/bin/env node
// Writes i18n/master.json: every translatable text of the app, keyed by the id the language packs use.
// Usage: node tools/i18n_master.js            (then translate the "en" values into src/lang/<code>.js)
//        node tools/i18n_master.js --missing es   (only what es.js still lacks)
const fs = require('fs');
const path = require('path');
const { ROOT, load, units } = require('./i18n_lib');
const GA = load();
const all = units(GA);
const miss = process.argv.indexOf('--missing') >= 0 ? process.argv[process.argv.indexOf('--missing') + 1] : null;
const pack = miss ? (GA.I18N[miss] || {}) : null;
const out = {};
all.forEach(u => { if (!pack || pack[u.id] === undefined) out[u.id] = { key: u.key, en: u.en }; });
const file = miss ? path.join(ROOT, 'i18n', 'missing-' + miss + '.json') : path.join(ROOT, 'i18n', 'master.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
const ids = new Set(all.map(u => u.id));
console.log(file + ': ' + Object.keys(out).length + ' texts' + (ids.size !== all.length ? ' (WARNING: ' + (all.length - ids.size) + ' duplicate ids)' : ''));
