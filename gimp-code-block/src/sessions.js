/* Sessions : on enregistre sous un nom tout ce qui fait « son » atelier
   (le projet, l'apparence, la langue, la disposition de l'écran, les progrès du cours, les auteurs retenus)
   pour le retrouver plus tard, ou le passer à un autre ordinateur en fichier .json. */
(function () {
'use strict';
var GA = window.GA;
var T = function (x) { return GA.T ? GA.T(x) : x; };
var PREFIX = 'atelier-gimp-', SKEY = 'atelier-gimp-sessions', UKEY = 'atelier-gimp-ui', VKEY = 'atelier-gimp-restore-view';
var SKIP = { 'atelier-gimp-sessions': 1, 'atelier-gimp-ia': 1, 'atelier-gimp-restore-view': 1 };   // jamais la clé de l'IA
var PROJECT_KEYS = { 'atelier-gimp-v2-projet': 1 };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]; }); }
function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function list() { try { return JSON.parse(get(SKEY) || '[]'); } catch (e) { return []; } }
function ws() { return GA.ws; }

/* ---------- l'état de l'écran (panneau, onglet, zoom, position) ---------- */
function uiState() {
  var w = ws(), tab = document.querySelector('.tab[aria-selected="true"]');
  var m = w && w.getMetrics ? w.getMetrics() : null;
  return { noSide: document.body.classList.contains('noSide'), tab: tab ? tab.getAttribute('data-pane') : 'help',
    scale: w ? w.scale : 1, sx: m ? m.viewLeft : 0, sy: m ? m.viewTop : 0 };
}
var restoring = false;
function saveUi() { if (!restoring) set(UKEY, JSON.stringify(uiState())); }
function applyUi(view) {
  var u; try { u = JSON.parse(get(UKEY) || 'null'); } catch (e) { u = null; }
  if (!u) return;
  document.body.classList.toggle('noSide', !!u.noSide);
  if (u.tab && GA.app.showTab && document.getElementById('p-' + u.tab)) GA.app.showTab(u.tab);
  if (view && ws()) setTimeout(function () {
    var w = ws();
    Blockly.svgResize(w);
    if (u.scale) w.setScale(u.scale);
    w.scroll(-(u.sx || 0), -(u.sy || 0));
  }, 250);
}

/* ---------- instantané / restauration ---------- */
function snapshot(name) {
  if (GA.app.flush) GA.app.flush();
  saveUi();
  var data = {};
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.indexOf(PREFIX) === 0 && !SKIP[k]) data[k] = localStorage.getItem(k);
  }
  var hat = ws() && GA.getHat ? GA.getHat(ws()) : null;
  return { app: 'gimp-code-block', kind: 'session', v: 1, name: name, date: new Date().toISOString(),
    script: hat ? String(hat.getFieldValue('NAME') || hat.getFieldValue('LABEL') || '') : '', blocks: ws() ? ws().getAllBlocks(false).length : 0,
    lang: GA.lang || get('atelier-gimp-lang') || 'fr', data: data };
}
function restore(s, withProject) {
  Object.keys(s.data || {}).forEach(function (k) {
    if (k.indexOf(PREFIX) !== 0 || SKIP[k]) return;
    if (!withProject && PROJECT_KEYS[k]) return;
    set(k, s.data[k]);
  });
  set(VKEY, withProject ? '1' : '');
  restoring = true;   // ne pas réécrire l'écran actuel par-dessus celui de la session en quittant
  location.reload();   // langue, forme des blocs, thème : tout repart proprement
}
function store(s) {
  var l = list().filter(function (x) { return x.name !== s.name; });
  l.unshift(s);
  if (!set(SKEY, JSON.stringify(l))) { GA.toast(T('Plus de place pour les sessions : supprime-en une ou exporte-la en fichier.')); return false; }
  return true;
}
function download(s) {
  var blob = new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' });
  var fn = 'session-' + String(s.name || 'atelier').replace(/[\\/:*?"<>|\s]+/g, '_') + '.json';
  GA.app.saveFile(fn, blob);
}
function when(iso) { try { return new Date(iso).toLocaleString(GA.lang || undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; } }
function size(s) { var n = JSON.stringify(s).length; return n > 1e6 ? (n / 1e6).toFixed(1) + ' Mo' : Math.max(1, Math.round(n / 1e3)) + ' ko'; }

GA.sessions = {
  init: function () {
    var view = get(VKEY) === '1';
    set(VKEY, '');
    applyUi(view);
    window.addEventListener('beforeunload', saveUi);
    document.addEventListener('visibilitychange', function () { if (document.hidden) saveUi(); });
  },
  save: function (name) { var s = snapshot(name); return store(s) ? s : null; },
  list: list,
  open: function () {
    var l = list();
    var def = (ws() && GA.getHat && GA.getHat(ws()) ? String(GA.getHat(ws()).getFieldValue('NAME') || '') : '') || T('Ma session');
    var rows = l.length ? l.map(function (s, i) {
      return '<div class="sesRow"><div class="sesInfo"><b>' + esc(s.name) + '</b><span>' + esc(when(s.date)) + ' · ' + esc(s.script || '—') + ' · ' + s.blocks + ' ' + esc(T('blocs')) + ' · ' + esc(String(s.lang).toUpperCase()) + ' · ' + size(s) + '</span></div>' +
        '<div class="sesBtns"><button class="btn primary" data-o="' + i + '">' + esc(T('Ouvrir')) + '</button><button class="btn" data-u="' + i + '" title="' + esc(T('Garder mon projet actuel, reprendre seulement l\'interface')) + '">🎨 ' + esc(T('Interface seule')) + '</button>' +
        '<button class="btn" data-x="' + i + '" title="' + esc(T('Exporter en fichier')) + '">⬇</button><button class="btn" data-d="' + i + '" title="' + esc(T('Supprimer')) + '">🗑</button></div></div>';
    }).join('') : '<p class="sub">' + esc(T('Aucune session enregistrée pour l\'instant.')) + '</p>';
    var d = GA.app.openDialog('<h2>💼 ' + esc(T('Sessions')) + '</h2><p class="sub">' + esc(T('Une session garde ton projet, l\'apparence, la langue, la disposition de l\'écran, tes progrès dans le cours et les auteurs retenus. Ta clé d\'IA n\'est jamais incluse.')) + '</p>' +
      '<div class="sesNew"><input id="sesName" type="text" maxlength="60" value="' + esc(def) + '"><button class="btn primary" id="sesSave">💾 ' + esc(T('Enregistrer la session actuelle')) + '</button></div>' +
      '<div class="sesList">' + rows + '</div>' +
      '<div class="foot"><button class="btn" id="sesImport">📂 ' + esc(T('Importer une session (.json)')) + '</button><button class="btn" id="sesClose">' + esc(T('Fermer')) + '</button></div>', 'wide');
    function q(s) { return d.querySelector(s); }
    q('#sesSave').onclick = function () {
      var n = q('#sesName').value.trim() || T('Ma session');
      var exists = l.some(function (s) { return s.name === n; });
      function go() { if (GA.sessions.save(n)) { GA.toast(T('Session enregistrée.')); GA.sessions.open(); } }
      if (exists) GA.app.confirmBox(T('Remplacer la session ?'), T('Une session porte déjà ce nom. La remplacer par l\'état actuel ?'), T('Remplacer'), function (ok) { if (ok) go(); else GA.sessions.open(); });
      else go();
    };
    q('#sesName').onkeydown = function (e) { if (e.key === 'Enter') q('#sesSave').click(); };
    q('#sesClose').onclick = function () { GA.app.closeDialog(); };
    q('#sesImport').onclick = function () {
      var f = document.createElement('input'); f.type = 'file'; f.accept = '.json,application/json';
      f.onchange = function () {
        var file = f.files[0]; if (!file) return;
        file.text().then(function (txt) {
          var s; try { s = JSON.parse(txt); } catch (e) { s = null; }
          if (!s || s.kind !== 'session' || !s.data) { GA.toast(T('Ce fichier n\'est pas une session de l\'atelier.')); return; }
          if (store(s)) { GA.toast(T('Session importée.')); GA.sessions.open(); }
        });
      };
      f.click();
    };
    d.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () {
      var s = l[+b.getAttribute('data-o')];
      GA.app.confirmBox(T('Ouvrir la session ?'), T('Ton projet actuel sera remplacé par celui de la session (enregistre d\'abord ta session actuelle si tu veux la garder).'), T('Ouvrir'), function (ok) { if (ok) restore(s, true); else GA.sessions.open(); });
    }; });
    d.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () { restore(l[+b.getAttribute('data-u')], false); }; });
    d.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () { download(l[+b.getAttribute('data-x')]); }; });
    d.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () {
      var s = l[+b.getAttribute('data-d')];
      GA.app.confirmBox(T('Supprimer la session ?'), '« ' + s.name + ' »', T('Supprimer'), function (ok) {
        if (ok) set(SKEY, JSON.stringify(list().filter(function (x) { return x.name !== s.name; })));
        GA.sessions.open();
      });
    }; });
  }
};
})();
