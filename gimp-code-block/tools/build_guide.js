#!/usr/bin/env node
// Writes the user guide and the course as Markdown, one file per language: docs/guide/<lang>.md
// The source is src/learn.js (French) plus the translation tables; run it after changing either.
const fs = require('fs');
const path = require('path');
const { ROOT, load } = require('./i18n_lib');
const LANGS = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'hi', 'ar'];
function mdOf(GA, list) {
  return list.map(x => GA.T(x)).join('\n\n').replace(/\n\n- /g, '\n- ');
}
const TITLES = {};
for (const code of LANGS) {
  const GA = load();
  const lp = path.join(ROOT, 'src', 'learn.js');
  delete require.cache[require.resolve(lp)];
  require(lp);
  GA.lang = code;
  if (code !== 'fr' && code !== 'en') GA.applyLangPack(code);
  const T = GA.T;
  let md = '# ' + T('Guide d\'utilisation') + ' — GIMP Code Block\n\n';
  GA.GUIDE.forEach(s => { md += '## ' + T(s.t) + '\n\n' + mdOf(GA, s.p) + '\n\n'; });
  md += '---\n\n# ' + T('Cours : de débutant complet à pro') + '\n\n' + T('Chaque leçon explique une idée, puis te donne une mission. L\'atelier vérifie tout seul quand tu as réussi.') + '\n\n';
  GA.LEARN_LEVELS.forEach(lv => {
    md += '## ' + T(lv.t) + '\n\n*' + T(lv.d) + '*\n\n';
    GA.LEARN.filter(l => l.lvl === lv.n).forEach(l => {
      md += '### ' + (GA.LEARN.indexOf(l) + 1) + '. ' + T(l.t) + '\n\n🎯 **' + T(l.goal) + '**\n\n' + mdOf(GA, l.p) + '\n\n**' + T('Ta mission') + '**\n\n' +
        l.steps.map((s, i) => (i + 1) + '. ' + T(s)).join('\n') + '\n\n' + (l.tip ? '> 💡 ' + T(l.tip) + '\n\n' : '');
    });
  });
  const file = path.join(ROOT, 'docs', 'guide', code + '.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, md);
  TITLES[code] = T('Guide d\'utilisation');
  console.log(file);
}
