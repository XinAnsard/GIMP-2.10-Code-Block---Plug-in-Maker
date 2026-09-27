const fs = require('fs');
const path = require('path');
const { loadBlockly, loadGA, corpusFiles, corpusDir, outDir, ROOT } = require('./harness');
const Blockly = loadBlockly();
const GA = loadGA(Blockly);
function strip(st) { return JSON.stringify(st, (k, v) => (k === 'id' || k === 'x' || k === 'y') ? undefined : v); }
function load(state) { const ws = new Blockly.Workspace(); Blockly.serialization.workspaces.load(state, ws); return ws; }
(async () => {
  let bad = 0;
  outDir('cycle');
  for (const ex of GA.exampleDefs) {
    const ws = load(ex.build()), opts = GA.defaultOpts();
    const code = GA.build(ws, opts).code;
    const saved = Blockly.serialization.workspaces.save(ws);
    // 1. blocs simples -> .py avec empreinte -> mêmes blocs simples
    const withTr = await GA.withTrailer(code, { ws: saved, opts });
    const r1 = await GA.importPython(withTr.replace(/\n/g, '\r\n'), ex.id);
    const ok1 = r1.via === 'blocs' && strip(r1.state) === strip(saved);
    // 2. .py modifié à la main -> reconstruit en blocs Python
    const edited = withTr.replace('"""Ce que fait', '"""(modifié) Ce que fait');
    const r2 = await GA.importPython(edited, ex.id);
    const ok2 = r2.via === 'code' && r2.edited;
    // 3. conversion en blocs Python : même code, et stable
    const r3 = await GA.importPython(code, ex.id);
    const ws3 = load(r3.state), code3 = GA.build(ws3, opts).code;
    const ok3 = r3.via === 'code' && code3 === code;
    const v = GA.verifyRoundTrip(r3.mod, code3);
    fs.writeFileSync(outDir('cycle') + '/' + ex.id + '.py', code3);
    const line = ex.id + ' : empreinte=' + (ok1 ? 'OK' : 'ÉCHEC') + ' | modifié→blocs Python=' + (ok2 ? 'OK' : 'ÉCHEC') + ' | conversion même code=' + (ok3 ? 'OK' : 'ÉCHEC') + ' | vérif=' + (v.ok ? 'OK' : JSON.stringify(v));
    if (!(ok1 && ok2 && ok3 && v.ok)) { bad++; if (!ok3) { const i = [...code].findIndex((c, k) => c !== code3[k]); console.log('   diff @' + i, JSON.stringify(code.slice(i - 60, i + 40)), '\n   vs', JSON.stringify(code3.slice(i - 60, i + 40))); } }
    console.log(line);
  }
  console.log(bad ? bad + ' ÉCHEC(S)' : 'TOUT OK');
})().catch(e => { console.log(e.stack); process.exit(1); });
