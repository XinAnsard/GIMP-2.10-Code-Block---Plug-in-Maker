// Language packs: every id exists, placeholders are kept, coverage is complete.
const { PACKS, load, units, marks } = require('../tools/i18n_lib');
const GA = load();
const all = units(GA);
const byId = new Map(all.map(u => [u.id, u]));
let fail = 0;
const MIN = Number(process.env.I18N_MIN || 100);
if (byId.size !== all.length) { console.log('✘ duplicate ids'); fail++; }
for (const code of PACKS) {
  const P = GA.I18N[code] || {};
  let unknown = 0, bad = [], have = 0;
  for (const id of Object.keys(P)) {
    const u = byId.get(id);
    if (!u) { unknown++; continue; }
    have++;
    if (typeof P[id] !== 'string' || !P[id].trim()) bad.push(id + ' (vide)');
    else if (marks(P[id]) !== marks(u.en)) bad.push(id + ' ' + JSON.stringify(u.en.slice(0, 50)) + ' → ' + JSON.stringify(P[id].slice(0, 50)));
  }
  const pct = Math.floor(1000 * have / all.length) / 10;
  const ok = !unknown && !bad.length && pct >= MIN;
  console.log((ok ? '✔ ' : '✘ ') + code + ' : ' + have + ' / ' + all.length + ' (' + pct + ' %)' + (unknown ? ', ' + unknown + ' id(s) inconnu(s)' : '') + (bad.length ? ', ' + bad.length + ' marque(s) perdue(s)' : ''));
  bad.slice(0, 8).forEach(b => console.log('    ' + b));
  if (!ok) fail++;
}
console.log(fail ? '\n' + fail + ' ÉCHEC(S)' : '\nTOUT OK');
process.exit(fail ? 1 : 0);
