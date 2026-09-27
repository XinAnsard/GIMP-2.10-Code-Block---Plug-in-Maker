// Cycle complet : fichier -> blocs -> code -> blocs -> code, pour les 52 scripts
const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, corpusFiles, corpusDir, outDir, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
const files = corpusFiles();
function decode(buf) { try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return new TextDecoder('windows-1252').decode(buf); } }
function strip(st) { return JSON.stringify(st, (k, v) => (k === 'id' || k === 'x' || k === 'y') ? undefined : v); }
function load(state) { const ws = new Blockly.Workspace(); Blockly.serialization.workspaces.load(state, ws); return ws; }
const man = [];
(async () => {
  let ok = 0, problems = [], totalBlocks = 0;
  for (const f of files) {
    const name = path.basename(f).replace(/\.py$/, '');
    const src = decode(fs.readFileSync(f));
    const t0 = Date.now();
    const r1 = await GA.importPython(src, name);
    const ws1 = load(r1.state);
    const b1 = GA.build(ws1, GA.defaultOpts());
    const st1 = strip(Blockly.serialization.workspaces.save(ws1));
    const probs = [];
    // le code des blocs doit être exactement celui de l'imprimeur de référence
    if (false) {
      const ref = PY.printFile(r1.mod);
      if (ref !== b1.code) { const i = [...ref].findIndex((c, k) => c !== b1.code[k]); probs.push('blocs ≠ référence @' + i + ' «' + ref.slice(i - 40, i + 40).replace(/\n/g, '⏎') + '» vs «' + b1.code.slice(i - 40, i + 40).replace(/\n/g, '⏎') + '»'); }
    }
    if (r1.via === 'code') {
      const v = GA.verifyRoundTrip(r1.mod, b1.code);
      if (!v.ok) probs.push('aller-retour : ' + JSON.stringify(v));
    }
    const issues = GA.check(ws1, GA.defaultOpts(), b1).filter(i => i.level === 'error');
    if (issues.length && r1.via === 'code') probs.push('erreurs de vérification : ' + issues.slice(0, 3).map(i => i.msg).join(' | '));
    // deuxième cycle : le code exporté redonne exactement les mêmes blocs et le même code
    const r2 = await GA.importPython((b1.bom ? '\uFEFF' : '') + (b1.eol === 'crlf' ? b1.code.replace(/\n/g, '\r\n') : b1.code), name);
    const ws2 = load(r2.state);
    const b2 = GA.build(ws2, GA.defaultOpts());
    const st2 = strip(Blockly.serialization.workspaces.save(ws2));
    if (st1 !== st2) probs.push('blocs différents au 2e cycle');
    if (b1.code !== b2.code) probs.push('code différent au 2e cycle');
    // empreinte : blocs -> .py avec empreinte -> blocs identiques
    const withTr = await GA.withTrailer(b1.code, { ws: Blockly.serialization.workspaces.save(ws1), opts: {} });
    const r3 = await GA.importPython(withTr, name);
    if (r3.via !== 'blocs' || strip(r3.state) !== strip(Blockly.serialization.workspaces.save(ws1))) probs.push('empreinte non restaurée');
    const out = outDir('import') + '/' + name.replace(/ /g, '_') + '.py';
    fs.writeFileSync(out, withTr);
    man.push([f, out, r1.mod.py3 ? 3 : 2, r1.via]);
    totalBlocks += r1.count;
    const line = (r1.via === 'code' ? '✔' : '⚠') + ' ' + name + ' : ' + r1.lines + ' lignes → ' + r1.count + ' blocs (' + (Date.now() - t0) + ' ms)' + (r1.via === 'partiel' ? ' | code brut lignes ' + r1.raws.map(x => x.from + '-' + x.to).join(', ') : '');
    if (probs.length) problems.push(line + '\n     ' + probs.join('\n     ')); else ok++;
    if (r1.lines > 300 || r1.via !== 'code') console.log(line);
    ws1.dispose(); ws2.dispose();
  }
  fs.writeFileSync(outDir('import') + '/manifest.json', JSON.stringify(man));
  console.log('\nSANS PROBLÈME :', ok, '/', files.length, '| blocs au total :', totalBlocks);
  problems.forEach(p => console.log('✘ ' + p));
})().catch(e => { console.log(e.stack); process.exit(1); });
