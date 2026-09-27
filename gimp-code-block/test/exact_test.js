// LE test : chaque fichier envoyé -> import -> export -> doit être IDENTIQUE octet pour octet
const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, corpusFiles, corpusDir, outDir, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
const files = corpusFiles();
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
    const bytes = fs.readFileSync(f);
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
    const name = path.basename(f).replace(/\.py$/, '');
    const r1 = await GA.importPython(text, name);
    const ws1 = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r1.state, ws1);
    const out1 = exportText(ws1);
    const outBytes = Buffer.from(out1, 'utf8');
    const identical = Buffer.compare(bytes, outBytes) === 0;
    // 2e cycle : export -> import -> mêmes blocs, même fichier
    const r2 = await GA.importPython(out1, name);
    const ws2 = new Blockly.Workspace(); Blockly.serialization.workspaces.load(r2.state, ws2);
    const stable = strip(Blockly.serialization.workspaces.save(ws1)) === strip(Blockly.serialization.workspaces.save(ws2)) && exportText(ws2) === out1;
    fs.writeFileSync(path.join(outDir('exact'), path.basename(f)), outBytes);
    if (identical && stable) same++;
    let where = '';
    if (!identical) {
      const a = text.replace(/\r\n/g, '\n').split('\n'), b = out1.replace(/\r\n/g, '\n').split('\n');
      const k = a.findIndex((l, i) => l !== b[i]);
      where = ' | 1re différence ligne ' + (k + 1) + ' : ' + JSON.stringify((a[k] || '').slice(0, 70)) + ' → ' + JSON.stringify((b[k] || '<fin>').slice(0, 70));
    }
    rows.push((identical ? '✔ IDENTIQUE ' : '✘ DIFFÉRENT ') + (stable ? '' : '(instable) ') + path.basename(f) + ' (' + bytes.length + ' octets, ' + r1.count + ' blocs, ' + r1.via + ')' + where);
  }
  rows.forEach(r => console.log(r));
  console.log('\n==> ' + same + ' / ' + files.length + ' fichiers ressortent IDENTIQUES octet pour octet (et stables au 2e cycle)');
})().catch(e => { console.log(e.stack); process.exit(1); });
