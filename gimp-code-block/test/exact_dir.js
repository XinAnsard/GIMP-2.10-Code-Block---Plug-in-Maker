// LE test : chaque fichier envoyé -> import -> export -> doit être IDENTIQUE octet pour octet
const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, corpusFiles, corpusDir, outDir, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
const DIR = process.argv[2] || corpusDir();
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.py')).map(f => path.join(DIR, f));
function strip(st) { return JSON.stringify(st, (k, v) => (k === 'id' || k === 'x' || k === 'y') ? undefined : v); }
function exportText(ws) {
  const b = GA.build(ws, GA.defaultOpts());
  let code = b.code;
  if (b.eol === 'crlf') code = code.replace(/\n/g, '\r\n');
  if (b.bom) code = '\uFEFF' + code;
  return code;
}
(async () => {
  let same = 0, rows = [];
  outDir('exact');
  for (const f of files) {
    fs.appendFileSync(path.join(outDir(), 'corpus_progress.txt'), f + '\n');
    const bytes = fs.readFileSync(f);
    let text; try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); } catch (e) { rows.push('~ IGNORÉ (pas en UTF-8) ' + path.basename(f)); continue; }
    const name = path.basename(f).replace(/\.py$/, '');
    let r1; try { r1 = await GA.importPython(text, name); } catch (e) { rows.push('✘ PLANTAGE ' + path.basename(f) + ' : ' + e.message); continue; }
    const ws1 = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r1.state, ws1);
    const out1 = exportText(ws1);
    const outBytes = Buffer.from(out1, 'utf8');
    const identical = Buffer.compare(bytes, outBytes) === 0;
    // 2e cycle : export -> import -> mêmes blocs, même fichier
    const r2 = await GA.importPython(out1, name);
    const ws2 = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r2.state, ws2);
    const stable = strip(Blockly.serialization.workspaces.save(ws1)) === strip(Blockly.serialization.workspaces.save(ws2)) && exportText(ws2) === out1;
    fs.writeFileSync(outDir('exact') + '/' + path.basename(f), outBytes);
    ws1.dispose(); ws2.dispose();
    if (identical && stable) same++;
    let where = '';
    if (!identical) {
      const a = text.replace(/\r\n/g, '\n').split('\n'), b = out1.replace(/\r\n/g, '\n').split('\n');
      const k = a.findIndex((l, i) => l !== b[i]);
      where = ' | 1re différence ligne ' + (k + 1) + ' : ' + JSON.stringify((a[k] || '').slice(0, 70)) + ' → ' + JSON.stringify((b[k] || '<fin>').slice(0, 70));
    }
    rows.push((identical ? '✔ IDENTIQUE ' : '✘ DIFFÉRENT ') + (stable ? '' : '(instable) ') + path.basename(f) + ' (' + bytes.length + ' octets, ' + r1.count + ' blocs, ' + r1.via + ')' + where);
  }
  rows.filter(r => !r.startsWith('✔')).slice(0, 40).forEach(r => console.log(r)); fs.writeFileSync(path.join(outDir(), 'corpus_rows.txt'), rows.join('\n'));
  console.log('\n==> ' + same + ' / ' + files.length + ' fichiers ressortent IDENTIQUES octet pour octet (et stables au 2e cycle)');
})().catch(e => { console.log(e.stack); process.exit(1); });
