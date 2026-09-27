/* Atelier — l'IA écrit du code, l'atelier le vérifie et le transforme en blocs */
(function () {
'use strict';
var GA = window.GA;
var PY = GA.py;
var T = function (s) { return GA.T ? GA.T(s) : s; };
var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ws() { return GA.ws; }
var EN = function () { return GA.lang === 'en'; };

/* ================= fournisseurs ================= */
var PROVIDERS = [
  { id: 'claude', name: 'Claude (intégré à cette page, sans clé)', kind: 'claude', model: '', url: '' },
  { id: 'manual', name: 'Copier-coller (n\'importe quelle IA, sans connexion)', kind: 'manual' },
  { id: 'openai', name: 'OpenAI (ChatGPT)', kind: 'openai', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', key: true },
  { id: 'anthropic', name: 'Anthropic (Claude, clé API)', kind: 'anthropic', url: 'https://api.anthropic.com/v1', model: 'claude-sonnet-5', key: true },
  { id: 'gemini', name: 'Google Gemini', kind: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-flash', key: true },
  { id: 'mistral', name: 'Mistral', kind: 'openai', url: 'https://api.mistral.ai/v1', model: 'mistral-large-latest', key: true },
  { id: 'openrouter', name: 'OpenRouter (des centaines de modèles)', kind: 'openai', url: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', key: true },
  { id: 'deepseek', name: 'DeepSeek', kind: 'openai', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat', key: true },
  { id: 'groq', name: 'Groq', kind: 'openai', url: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', key: true },
  { id: 'ollama', name: 'Ollama (local, sur ton PC)', kind: 'openai', url: 'http://localhost:11434/v1', model: 'qwen2.5-coder:7b', key: false },
  { id: 'lmstudio', name: 'LM Studio (local, sur ton PC)', kind: 'openai', url: 'http://localhost:1234/v1', model: 'local-model', key: false },
  { id: 'custom', name: 'N\'importe quelle autre IA (en ligne ou locale) — à toi de régler', kind: 'libre', url: '', model: '', key: false, free: true }
];
var CFG_KEY = 'atelier-gimp-ia';
var cfg = Object.assign({ provider: 'claude', url: '', model: '', temperature: 0.2, remember: false, key: '', dialect: 'openai', auth: 'bearer', authName: 'Authorization', authPrefix: 'Bearer ', headers: '', path: '/chat/completions', body: '', respPath: '' }, (function () { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) { return {}; } })());
if (!cfg.key) { try { cfg.key = sessionStorage.getItem(CFG_KEY + '-cle') || ''; } catch (e) { /* ok */ } }
function prov() { return PROVIDERS.filter(function (p) { return p.id === cfg.provider; })[0] || PROVIDERS[0]; }
function saveCfg() {
  var c = Object.assign({}, cfg);
  if (!c.remember) { try { sessionStorage.setItem(CFG_KEY + '-cle', c.key || ''); } catch (e) { /* ok */ } c.key = ''; }
  try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) { /* ok */ }
}
var inViewer = !!window.claude;
var samplePromise = null;
function sampleFn() {
  if (!samplePromise) samplePromise = window.claude && typeof window.claude.use === 'function' ? Promise.resolve().then(function () { return window.claude.use('sample'); }).catch(function () { return null; }) : Promise.resolve(null);
  return samplePromise;
}

/* ================= contexte et prompt ================= */
var KW = { calque: 'layer', calques: 'layer', texte: 'text', textes: 'text', police: 'font', selection: 'select selection', chemin: 'vectors stroke', chemins: 'vectors', couleur: 'color foreground background', couleurs: 'color', flou: 'blur gauss', remplir: 'fill bucket', enregistrer: 'save file', sauvegarder: 'save file', exporter: 'save file png jpeg export', ouvrir: 'load file', charger: 'load file', image: 'image', groupe: 'group', visible: 'visible', visibilite: 'visible', opacite: 'opacity', masque: 'mask', canal: 'channel', guide: 'guide', guides: 'guide', pivoter: 'rotate', rotation: 'rotate', tourner: 'rotate', redimensionner: 'scale resize', taille: 'size scale resize', dupliquer: 'duplicate copy', copier: 'copy', coller: 'paste', supprimer: 'remove delete', effacer: 'clear erase', nom: 'name', renommer: 'name', pixel: 'pixel', pinceau: 'paintbrush brush', gomme: 'eraser', dessiner: 'paintbrush stroke pencil', contour: 'stroke border', recadrer: 'crop', decouper: 'crop', aplatir: 'flatten', fusionner: 'merge', progression: 'progress', annuler: 'undo', bulle: 'select fill', luminosite: 'brightness', contraste: 'contrast', niveaux: 'levels', courbes: 'curves', desaturer: 'desaturate', gris: 'desaturate grayscale', inverser: 'invert', seuil: 'threshold', ombre: 'shadow', transparence: 'alpha', alpha: 'alpha', agrandir: 'grow resize', reduire: 'shrink scale', position: 'offsets', deplacer: 'offsets translate', aligner: 'offsets', affichage: 'display', ecran: 'display', fichier: 'file', dossier: 'file', police_taille: 'font size' };
function norm(s) { return GA.translit(String(s || '')).toLowerCase(); }
function sigLine(n) {
  var s = GA.SIGS[n]; if (!s) return '';
  var args = s[4].map(function (a) { return a[0]; }).join(', '), outs = s[5].map(function (o) { return o[0]; }).join(', ');
  return 'pdb.' + n + '(' + args + ')' + (outs ? ' -> ' + (s[5].length > 1 ? '(' + outs + ')' : outs) : '') + (s[1] ? '   # ' + String(s[1]).slice(0, 90) : '');
}
function relevantSigs(request, code) {
  var names = Object.keys(GA.SIGS), want = {}, out = [];
  (String(code || '').match(/\bpdb\.([a-z0-9_]+)/g) || []).forEach(function (m) { want[m.slice(4)] = 50; });
  var terms = [];
  norm(request).split(/[^a-z0-9_]+/).forEach(function (w) {
    if (w.length < 3) return;
    if (KW[w]) terms = terms.concat(KW[w].split(' ')); else terms.push(w);
  });
  if (terms.length) names.forEach(function (n) {
    var s = GA.SIGS[n]; if (s[2]) return;
    var hay = n.split('_'), bl = norm(s[1]), sc = 0;
    terms.forEach(function (t) { if (hay.indexOf(t) >= 0) sc += 3; else if (n.indexOf(t) >= 0) sc += 2; else if (bl.indexOf(t) >= 0) sc += 1; });
    if (sc >= 2) want[n] = (want[n] || 0) + sc;
  });
  (GA.POPULAR || []).slice(0, 30).forEach(function (n, i) { if (GA.SIGS[n]) want[n] = (want[n] || 0) + 1 + (30 - i) / 100; });
  Object.keys(want).sort(function (a, b) { return want[b] - want[a]; }).slice(0, 90).forEach(function (n) { var l = sigLine(n); if (l) out.push(l); });
  return out;
}
function outline(code) {
  return code.split('\n').filter(function (l) { return /^\s*(def |class |import |from |@)/.test(l) || /^[A-Za-z_][A-Za-z0-9_, ]*=/.test(l) || /^register\(/.test(l); }).join('\n');
}
var MODES = {
  fn: 'Écrire une nouvelle fonction', stmt: 'Ajouter des instructions', plugin: 'Écrire un plug-in complet (nouveau projet)',
  modify: 'Modifier la sélection', explain: 'Expliquer la sélection (sans modifier)'
};
GA.aiPrompt = function (mode, request, sel) {
  var built = GA.app.getBuilt(), fileMode = built && built.mode === 'file';
  var code = built ? built.code : '';
  var lang = EN() ? 'English' : 'French';
  var sys = [
    'You are an expert in GIMP 2.10 Python-Fu plug-ins (module gimpfu, Python 2.7, the Python bundled with GIMP 2.10 on Windows).',
    'Your code is automatically parsed and turned into visual blocks by "GIMP Code Block - Plug-in Maker", then run inside GIMP 2.10. A validator checks your answer; if it fails you will be asked to fix it.',
    '',
    'OUTPUT FORMAT (mandatory)',
    mode === 'explain' ? '- Answer in ' + lang + ' prose, clear and short, for a beginner. You may quote short code lines. Do not rewrite the code.'
      : '- Reply with EXACTLY ONE fenced code block: ```python ... ```. Inside it: only valid Python 2.7 code, starting at column 0.\n- After the block you may add at most 3 short sentences in ' + lang + '. Never put explanations inside the block except as # comments.\n- Write code comments in ' + lang + '.',
    '',
    'PYTHON 2.7 RULES (GIMP 2.10 embeds Python 2.7)',
    '- Indentation: 4 spaces, never tabs.',
    '- FORBIDDEN: f-strings, the print statement or print(), the conditional expression "a if c else b" (write a normal if/else on several lines), break (use a flag variable or a while condition), nonlocal, async/await, walrus :=, type annotations, "yield from", keyword-only arguments, super() without arguments.',
    '- Use "%" or .format() for string formatting. Strings with accents are UTF-8: add "# -*- coding: utf-8 -*-" at the top of a complete file; convert unicode to bytes with .encode("utf-8") before passing text to the PDB.',
    '- Text files: codecs.open(path, "r", encoding="utf-8-sig") to read (removes the BOM), encoding="utf-8" to write; normalise line endings ("\\r\\n" -> "\\n").',
    '- Basic error handling: wrap risky operations in try/except Exception and report with pdb.gimp_message("..."). Use traceback.format_exc() for details.',
    '',
    'GIMP / PDB RULES',
    '- NEVER invent a PDB procedure. Only use procedures that exist in GIMP 2.10 (exact signatures below). If a feature needs a procedure that is not listed, prefer a listed one or plain Python.',
    '- Call style: pdb.procedure_name_with_underscores(args...). NEVER pass the run-mode argument: pygimp adds it automatically (do not pass RUN_NONINTERACTIVE / RUN_INTERACTIVE).',
    '- The number of arguments must match the signature exactly. Array parameters are preceded by their length: pdb.gimp_paintbrush_default(drawable, len(strokes), strokes).',
    '- Procedures returning several values return a tuple: num_layers, layer_ids = pdb.gimp_image_get_layers(image).',
    '- IDs returned as integers (layers, vectors, strokes) must be converted: gimp._id2drawable(layer_id), gimp._id2vectors(vectors_id).',
    '- Use gimpfu constants (RGB, RGBA_IMAGE, NORMAL_MODE, CHANNEL_OP_REPLACE, FILL_TRANSPARENT, FILL_WHITE, CLIP_TO_IMAGE, UNIT_PIXEL...). For text sizes use UNIT_PIXEL (in gimp_text_layer_new the constant POINTS means inches).',
    '- Progress bar: gimp.progress_init("text") then gimp.progress_update(fraction). Refresh the display with gimp.displays_flush().',
    '- Group modifications: pdb.gimp_image_undo_group_start(image) ... pdb.gimp_image_undo_group_end(image), using try/finally so the group is always closed.',
    '- Layers: pdb.gimp_layer_new(image, width, height, RGBA_IMAGE, "name", 100, NORMAL_MODE) then pdb.gimp_image_insert_layer(image, layer, None, 0). Groups contain layers in group.layers; recurse into them when "all layers" are needed.',
    '- A complete plug-in: shebang, coding line, "from gimpfu import *", a main function (image, drawable, then one argument per setting), register("python_fu_name_without_spaces_or_accents", blurb, help, author, copyright, date, "Menu label", "*", [(PF_IMAGE, "image", "Image", None), (PF_DRAWABLE, "drawable", "Layer", None), ...settings], [], function, menu="<Image>/Filters/My scripts"), then main().',
    '- Setting types: PF_INT, PF_FLOAT, PF_STRING, PF_TEXT, PF_TOGGLE, PF_SPINNER (default, (min, max, step)), PF_SLIDER, PF_OPTION (index, ("a", "b")), PF_COLOR, PF_FONT, PF_FILE, PF_DIRNAME, PF_LAYER, PF_VECTORS.'
  ].join('\n');
  var ctx = ['PROJECT CONTEXT'];
  if (fileMode) {
    ctx.push('- The user is editing an existing Python script: ' + built.label + '.py (' + built.lines.length + ' lines).');
  } else if (built) {
    var sets = (built.settings || []).map(function (s) { return s.py + ' (' + s.spec.type.replace('set_', '') + ')'; });
    ctx.push('- The user builds a plug-in with beginner blocks. Its menu label is "' + built.label + '" in ' + built.menu + '.');
    ctx.push('- Inside the action function these variables exist: image, drawable' + (sets.length ? ', and the settings ' + sets.join(', ') : '') + '. Its generated file is shown below; helper functions starting with "_" already exist in it.');
  }
  if (code) {
    if (code.length <= 24000) ctx.push('- Current complete code:\n```python\n' + code.replace(/\n+$/, '') + '\n```');
    else ctx.push('- The script is long; here is its outline (functions, imports, globals):\n```python\n' + outline(code) + '\n```');
  }
  if (sel && sel.trim()) ctx.push('- SELECTED CODE (' + (mode === 'modify' ? 'to rewrite' : mode === 'explain' ? 'to explain' : 'for reference') + '):\n```python\n' + sel.replace(/\n+$/, '') + '\n```');
  var task = { fn: 'Write the requested function(s) only (def ...), with the imports they need at the top of the block. No register() and no main(): the functions are inserted into the existing file, before register().',
    stmt: fileMode ? 'Write only the statements to insert (they are inserted after the selected block, or at the end of the script). Reuse existing functions and variables.' : 'Write only the statements to insert inside the plug-in action (they are inserted after the selected block, or at the end of the actions). Use image, drawable and the settings directly. Do not write register() or main().',
    plugin: 'Write a COMPLETE new GIMP 2.10 plug-in file (it replaces the current project).',
    modify: 'Rewrite ONLY the selected code according to the request. Return the complete replacement for the selected part, starting at column 0; it replaces the selection exactly.',
    explain: 'Explain what the selected code does, step by step, for a beginner.' }[mode];
  var sigs = relevantSigs(request, (sel || '') + '\n' + (code.length <= 24000 ? code : ''));
  var user = ctx.join('\n') + '\n\nTASK (' + (MODES[mode] ? MODES[mode] : mode) + ')\n' + task + '\n\nUSER REQUEST\n' + request + '\n\nRELEVANT GIMP 2.10 PDB PROCEDURES (exact signatures, run-mode already removed)\n' + sigs.join('\n');
  return { system: sys, user: user };
};

/* ================= vérification de la réponse ================= */
GA.aiExtract = function (text) {
  var m = /```(?:python|py)?[ \t]*\n([\s\S]*?)```/i.exec(text);
  if (m) return GA.dedent(m[1]);
  var t = String(text).trim();
  try { PY.parse(t + '\n', { py3: false }); return GA.dedent(t); } catch (e) { return null; }
};
function M(fr, en) { return { fr: fr, en: en }; }
GA.aiValidate = function (code) {
  var errors = [], warnings = [], mod;
  try { mod = PY.parse(code, { py3: false }); }
  catch (e) {
    var py3 = false; try { PY.parse(code, { py3: true }); py3 = true; } catch (e2) { /* non */ }
    errors.push(py3 ? M('Syntaxe Python 3 (invalide en Python 2.7) : ' + e.message + ' ligne ' + e.pyLine, 'Python 3 syntax, invalid in Python 2.7: ' + e.message + ' at line ' + e.pyLine)
      : M('Erreur de syntaxe ligne ' + e.pyLine + ' : ' + e.message, 'Syntax error at line ' + e.pyLine + ': ' + e.message));
    return { errors: errors, warnings: warnings };
  }
  (function walk(x) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    switch (x.type) {
      case 'Print': errors.push(M('print est interdit : utilise pdb.gimp_message(...)', 'print is forbidden: use pdb.gimp_message(...)')); break;
      case 'IfExp': errors.push(M('Expression « a if c else b » interdite : écris un if/else sur plusieurs lignes', 'The conditional expression "a if c else b" is forbidden: write a normal multi-line if/else')); break;
      case 'Break': errors.push(M('break est interdit : utilise une variable ou la condition du while', 'break is forbidden: use a flag variable or the while condition')); break;
      case 'Nonlocal': errors.push(M('nonlocal n\'existe pas en Python 2.7', 'nonlocal does not exist in Python 2.7')); break;
      case 'Str': if (x.raws.some(function (r) { return /^[a-zA-Z]*[fF]/.test(r); })) errors.push(M('f-string interdite : utilise % ou .format()', 'f-strings are forbidden: use % or .format()')); break;
      case 'Call':
        if (x.func.type === 'Attribute' && x.func.value.type === 'Name' && x.func.value.id === 'pdb') {
          var n = x.func.attr, s = GA.SIGS[n];
          var pos = x.args.filter(function (a) { return a.kind === 'p'; });
          if (pos.length && pos[0].value.type === 'Name' && /^RUN_/.test(pos[0].value.id)) errors.push(M('pdb.' + n + ' : ne passe pas le run-mode (' + pos[0].value.id + '), pygimp l\'ajoute tout seul', 'pdb.' + n + ': do not pass the run-mode (' + pos[0].value.id + '), pygimp adds it automatically'));
          else if (!s) warnings.push(M('pdb.' + n + ' ne fait pas partie de la liste officielle de GIMP 2.10 (plug-in externe ? à vérifier)', 'pdb.' + n + ' is not in the official GIMP 2.10 list (external plug-in? check it)'));
          else if (x.args.some(function (a) { return a.kind !== 'p'; })) warnings.push(M('pdb.' + n + ' : arguments nommés ou étoilés, impossible de compter les arguments', 'pdb.' + n + ': keyword or star arguments, cannot count arguments'));
          else if (pos.length !== s[4].length) errors.push(M('pdb.' + n + ' attend ' + s[4].length + ' argument(s) et en reçoit ' + pos.length + ' : ' + sigLine(n).split('   #')[0], 'pdb.' + n + ' expects ' + s[4].length + ' argument(s) but receives ' + pos.length + ': ' + sigLine(n).split('   #')[0]));
          if (s && s[2]) warnings.push(M('pdb.' + n + ' est ancienne (dépréciée) dans GIMP 2.10', 'pdb.' + n + ' is deprecated in GIMP 2.10'));
        }
        break;
    }
    for (var k in x) if (x[k] && typeof x[k] === 'object' && k !== 'meta' && k !== 'elseMeta') walk(x[k]);
  })(mod.body);
  return { mod: mod, errors: errors, warnings: warnings };
};

/* ================= appels aux fournisseurs ================= */
var ctrl = null;
function jsonPath(obj, path) {
  var cur = obj;
  String(path).split('.').forEach(function (k) { if (cur === undefined || cur === null) return; cur = cur[/^\d+$/.test(k) ? Number(k) : k]; });
  return cur;
}
/* retrouve le texte de la réponse même quand on ne connaît pas la forme du serveur */
function pickText(j, path) {
  if (path) {
    var v = jsonPath(j, path);
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.map(function (x) { return typeof x === 'string' ? x : (x && (x.text || x.content)) || ''; }).join('');
    if (v && typeof v === 'object' && typeof v.text === 'string') return v.text;
  }
  var tries = ['choices.0.message.content', 'choices.0.text', 'choices.0.delta.content', 'message.content', 'content.0.text',
    'candidates.0.content.parts.0.text', 'output.0.content.0.text', 'output_text', 'response', 'results.0.text', 'text', 'generated_text', 'data.0.content'];
  for (var i = 0; i < tries.length; i++) { var t = jsonPath(j, tries[i]); if (typeof t === 'string' && t) return t; }
  if (Array.isArray(j && j.content)) { var c = j.content.map(function (x) { return x && x.text || ''; }).join(''); if (c) return c; }
  return '';
}
function extraHeaders() {
  var h = {};
  var raw = String(cfg.headers || '').trim();
  if (!raw) return h;
  try {
    var o = JSON.parse(raw);
    Object.keys(o).forEach(function (k) { h[k] = String(o[k]); });
    return h;
  } catch (e) { /* sinon, une ligne = "Nom: valeur" */ }
  raw.split('\n').forEach(function (l) { var i = l.indexOf(':'); if (i > 0) h[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  return h;
}
function applyAuth(headers, urlObj, key, dialect) {
  var mode = cfg.auth || 'bearer';
  if (prov().id !== 'custom') mode = dialect === 'anthropic' ? 'x-api-key' : dialect === 'gemini' ? 'query' : (key ? 'bearer' : 'none');
  if (!key && mode !== 'none') return;
  if (mode === 'bearer') headers.Authorization = 'Bearer ' + key;
  else if (mode === 'x-api-key') headers['x-api-key'] = key;
  else if (mode === 'query') urlObj.q = key;
  else if (mode === 'header') headers[cfg.authName || 'Authorization'] = (cfg.authPrefix || '') + key;
}
function fillTemplate(tpl, vals) {
  return String(tpl).replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, function (m, k) {
    if (!(k in vals)) return m;
    var v = vals[k];
    return typeof v === 'string' ? JSON.stringify(v).slice(1, -1) : JSON.stringify(v);
  });
}
GA.aiDefaultBody = function (dialect) {
  if (dialect === 'anthropic') return '{\n  "model": "{{model}}",\n  "max_tokens": 8192,\n  "temperature": {{temperature}},\n  "system": "{{system}}",\n  "messages": {{messages}}\n}';
  if (dialect === 'gemini') return '{\n  "systemInstruction": { "parts": [ { "text": "{{system}}" } ] },\n  "contents": {{contents}},\n  "generationConfig": { "temperature": {{temperature}} }\n}';
  if (dialect === 'ollama') return '{\n  "model": "{{model}}",\n  "stream": false,\n  "options": { "temperature": {{temperature}} },\n  "messages": {{messages_with_system}}\n}';
  return '{\n  "model": "{{model}}",\n  "temperature": {{temperature}},\n  "messages": {{messages_with_system}}\n}';
};
GA.aiDefaultPath = function (dialect) {
  return dialect === 'anthropic' ? '/messages' : dialect === 'gemini' ? '/models/{{model}}:generateContent' : dialect === 'ollama' ? '/api/chat' : '/chat/completions';
};
function callAI(turns, onText) {
  var p = prov(), url = (cfg.url || p.url || '').replace(/\/+$/, ''), model = cfg.model || p.model || '', key = cfg.key;
  var dialect = p.id === 'custom' ? (cfg.dialect || 'openai') : p.kind;
  ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var sig = ctrl ? ctrl.signal : undefined;
  function http(u, opts) {
    return fetch(u, opts).then(function (r) {
      return r.text().then(function (body) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' : ' + body.slice(0, 300));
        try { return JSON.parse(body); } catch (e) { return { text: body }; }
      });
    }, function (err) {
      if (err && err.name === 'AbortError') throw err;
      throw new Error(T(inViewer ? 'Connexion bloquée : cette page publiée ne peut pas contacter d\'autres sites. Utilise « Claude intégré », le mode copier-coller, ou télécharge l\'atelier pour l\'ouvrir chez toi (Fichier ▸ Télécharger l\'atelier).' : 'Impossible de joindre le serveur (adresse, réseau ou autorisation CORS). Pour Ollama, lance-le avec la variable OLLAMA_ORIGINS=*. Pour LM Studio, active « CORS » dans les réglages du serveur.'));
    });
  }
  if (dialect === 'claude') {
    return sampleFn().then(function (sample) {
      if (!sample) throw new Error(T('Claude intégré n\'est pas disponible ici (il ne marche que dans la page publiée sur claude.ai). Choisis un autre fournisseur dans ⚙️ Réglages IA.'));
      var input = turns.map(function (t, i) { return { role: t.role, content: i === 0 ? t.sys + '\n\n' + t.content : t.content }; });
      return sample(input, { onText: onText ? function (o) { onText(o.text); } : undefined, signal: sig }).then(function (r) { return r.text; }, function (e) {
        if (e && e.code === 'not_granted') throw new Error(T('Tu as refusé l\'utilisation de Claude pour cette page. Recharge la page pour la réautoriser, ou choisis un autre fournisseur.'));
        throw new Error((e && e.message) || String(e));
      });
    });
  }
  if (!url) return Promise.reject(new Error(T('Il manque l\'adresse de l\'API : ⚙️ Réglages IA.')));
  var sys = turns[0].sys;
  var msgs = turns.map(function (t) { return { role: t.role, content: t.content }; });
  var vals = {
    model: model, temperature: cfg.temperature, system: sys, prompt: msgs[msgs.length - 1].content,
    messages: msgs, messages_with_system: [{ role: 'system', content: sys }].concat(msgs),
    contents: msgs.map(function (m) { return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }; })
  };
  var path = (p.id === 'custom' ? (cfg.path || GA.aiDefaultPath(dialect)) : GA.aiDefaultPath(dialect));
  var tpl = (p.id === 'custom' && cfg.body && cfg.body.trim()) ? cfg.body : GA.aiDefaultBody(dialect);
  var bodyText = fillTemplate(tpl, vals);
  try { JSON.parse(bodyText); } catch (e) { return Promise.reject(new Error(T('Le corps de la requête n\'est pas du JSON valide (⚙️ Réglages IA).') + ' ' + e.message)); }
  var headers = Object.assign({ 'content-type': 'application/json' }, extraHeaders());
  if (dialect === 'anthropic') { headers['anthropic-version'] = headers['anthropic-version'] || '2023-06-01'; headers['anthropic-dangerous-direct-browser-access'] = 'true'; }
  var u = { q: null };
  applyAuth(headers, u, key, dialect);
  var full = url + fillTemplate(path, vals).replace(/"/g, '');
  if (u.q) full += (full.indexOf('?') >= 0 ? '&' : '?') + 'key=' + encodeURIComponent(u.q);
  return http(full, { method: 'POST', signal: sig, headers: headers, body: bodyText })
    .then(function (j) {
      var txt = pickText(j, p.id === 'custom' ? cfg.respPath : '');
      if (!txt) throw new Error(T('Le serveur a répondu, mais l\'atelier n\'a pas trouvé le texte dedans. Indique le chemin de la réponse dans ⚙️ Réglages IA.') + ' — ' + JSON.stringify(j).slice(0, 200));
      return txt;
    });
}
/* ================= panneau IA ================= */
var AI = GA.ai = {};
var busy = false;
AI.show = function () { var t = $('#t-ai'); if (t) t.click(); if (window.innerWidth < 900 && $('#side')) { $('#side').classList.add('open'); document.body.classList.add('sheet-open'); } };
AI.render = function () {
  var el = $('#p-ai'); if (!el) return;
  var p = prov();
  var note = '';
  if (inViewer && p.kind !== 'claude' && p.kind !== 'manual') note = '<div class="status warn">' + T('Sur cette page publiée, les connexions vers d\'autres sites sont bloquées. Utilise « Claude intégré » ou le copier-coller, ou ouvre l\'atelier chez toi :') + ' <button class="btn" data-act="downloadAtelier">⬇ ' + T('Télécharger l\'atelier') + '</button></div>';
  el.innerHTML = '<div class="aiHead"><span>🤖 <b>' + esc(T(p.name)) + '</b>' + (p.model || cfg.model ? ' · <span class="muted">' + esc(cfg.model || p.model) + '</span>' : '') + '</span><button class="btn" id="aiSet">⚙️ ' + T('Réglages IA') + '</button></div>' + note +
    '<div class="field"><label for="aiMode">' + T('Que doit faire l\'IA ?') + '</label><select id="aiMode">' + Object.keys(MODES).map(function (k) { return '<option value="' + k + '">' + esc(T(MODES[k])) + '</option>'; }).join('') + '</select></div>' +
    '<div id="aiSelBox" hidden><div class="muted" id="aiSelInfo" style="font-size:13px;margin-bottom:4px"></div><div class="snippet" id="aiSelCode" style="max-height:160px;overflow:auto"></div></div>' +
    '<div class="field"><textarea id="aiQ" rows="4" placeholder="' + esc(T('Ex. : une fonction qui renomme chaque calque texte avec les premiers mots de son texte')) + '"></textarea></div>' +
    '<div class="dlrow"><button class="btn primary" id="aiGo">' + T('Envoyer') + ' ▸</button><button class="btn" id="aiStop" hidden>■ Stop</button><button class="btn" id="aiShow">' + T('Voir le prompt') + '</button><span class="muted" style="font-size:12.5px">Ctrl+' + T('Entrée') + '</span></div>' +
    '<div id="aiLog"></div>';
  el.querySelector('#aiSet').onclick = AI.openSettings;
  el.querySelector('#aiGo').onclick = AI.send;
  el.querySelector('#aiStop').onclick = function () { if (ctrl) ctrl.abort(); };
  el.querySelector('#aiShow').onclick = function () { var q = el.querySelector('#aiQ').value.trim() || '…'; var pr = GA.aiPrompt(el.querySelector('#aiMode').value, q, AI.selCode()); showPrompt(pr, false); };
  el.querySelector('#aiQ').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); AI.send(); } });
  el.querySelector('#aiMode').onchange = AI.syncSel;
  var dl = el.querySelector('[data-act=downloadAtelier]'); if (dl) dl.onclick = AI.downloadAtelier;
  AI.syncSel();
};
AI.selCode = function () { var runs = GA.selRuns ? GA.selRuns() : []; return runs.length ? GA.codeOfRuns(runs) : ''; };
AI.syncSel = function () {
  var el = $('#p-ai'); if (!el || !el.querySelector('#aiMode')) return;
  var mode = el.querySelector('#aiMode').value, box = el.querySelector('#aiSelBox');
  var needSel = mode === 'modify' || mode === 'explain', code = AI.selCode();
  box.hidden = !code;
  if (code) { el.querySelector('#aiSelCode').textContent = code; el.querySelector('#aiSelInfo').textContent = T('Code sélectionné envoyé à l\'IA') + ' (' + code.split('\n').length + ' ' + T('lignes') + ')'; }
  if (needSel && !code) el.querySelector('#aiSelInfo').textContent = '';
};
AI.openForSelection = function () {
  AI.show();
  var m = $('#aiMode'); if (m) { m.value = 'modify'; AI.syncSel(); }
  var q = $('#aiQ'); if (q) setTimeout(function () { q.focus(); }, 80);
};
function logItem(cls, html) { var d = document.createElement('div'); d.className = 'aiMsg ' + cls; d.innerHTML = html; var log = $('#aiLog'); log.insertBefore(d, log.firstChild); return d; }
function showPrompt(pr, manual, done) {
  var full = '=== SYSTEM ===\n' + pr.system + '\n\n=== USER ===\n' + pr.user;
  var d = GA.app.openDialog('<h2>' + (manual ? '📋 ' + T('Mode copier-coller') : '🔎 ' + T('Le prompt envoyé à l\'IA')) + '</h2>' +
    (manual ? '<p class="sub">' + T('1. Copie ce texte et colle-le dans n\'importe quelle IA (ChatGPT, Le Chat, une IA locale…). 2. Colle sa réponse en dessous.') + '</p>' : '<p class="sub">' + T('Tout le contexte est envoyé : règles de GIMP 2.10 et Python 2.7, ton code, et les signatures exactes des fonctions utiles.') + '</p>') +
    '<textarea class="copyzone" readonly id="prT"></textarea><div class="dlrow" style="margin:8px 0"><button class="btn" id="prCopy">📋 ' + T('Copier le prompt') + '</button></div>' +
    (manual ? '<div class="field"><label for="prA">' + T('Réponse de l\'IA') + '</label><textarea class="copyzone" id="prA" style="min-height:160px"></textarea></div>' : '') +
    '<div class="foot"><button class="btn" id="prClose">' + T('Fermer') + '</button>' + (manual ? '<button class="btn primary" id="prGo">' + T('Transformer en blocs') + '</button>' : '') + '</div>', 'wide');
  d.querySelector('#prT').value = full;
  d.querySelector('#prCopy').onclick = function () { var t = d.querySelector('#prT'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(full) : Promise.reject()).then(function () { GA.toast('Prompt copié'); }, function () { document.execCommand && document.execCommand('copy'); }); };
  d.querySelector('#prClose').onclick = GA.app.closeDialog;
  if (manual) d.querySelector('#prGo').onclick = function () { var a = d.querySelector('#prA').value; GA.app.closeDialog(); done(a); };
}
AI.send = function () {
  if (busy) return;
  var el = $('#p-ai'), q = el.querySelector('#aiQ').value.trim(), mode = el.querySelector('#aiMode').value;
  if (!q) { el.querySelector('#aiQ').focus(); return; }
  var sel = AI.selCode();
  if ((mode === 'modify' || mode === 'explain') && !sel) { GA.toast('Sélectionne d\'abord des blocs (Ctrl + clic), puis relance.'); return; }
  var pr = GA.aiPrompt(mode, q, sel);
  var turns = [{ role: 'user', sys: pr.system, content: pr.user }];
  logItem('user', esc(q) + '<div class="muted" style="font-size:12px;margin-top:4px">' + esc(T(MODES[mode])) + (sel ? ' · ' + sel.split('\n').length + ' ' + T('lignes sélectionnées') : '') + '</div>');
  var item = logItem('bot', '<div class="st">⏳ ' + T('L\'IA réfléchit…') + '</div><pre class="live"></pre>');
  var runs = GA.selRuns ? GA.selRuns() : [];
  var ctx = { mode: mode, runs: runs, item: item, turns: turns, tries: 0, q: q };
  if (prov().kind === 'manual') {
    item.querySelector('.st').textContent = T('En attente de ta réponse (copier-coller)…');
    showPrompt(pr, true, function (answer) { handleAnswer(ctx, answer || ''); });
    return;
  }
  round(ctx);
};
function setBusy(b) { busy = b; var go = $('#aiGo'), st = $('#aiStop'); if (go) go.disabled = b; if (st) st.hidden = !b; }
function round(ctx) {
  setBusy(true);
  var live = ctx.item.querySelector('.live');
  callAI(ctx.turns, function (t) { if (live) live.textContent = t.slice(-1500); })
    .then(function (text) { setBusy(false); handleAnswer(ctx, text); },
      function (err) {
        setBusy(false);
        ctx.item.querySelector('.st').innerHTML = (err && err.name === 'AbortError') ? '■ ' + T('Arrêté.') : '⚠️ ' + esc(err && err.message ? err.message : String(err));
        if (live) live.remove();
      });
}
function handleAnswer(ctx, text) {
  var item = ctx.item, live = item.querySelector('.live');
  if (live) live.remove();
  ctx.turns.push({ role: 'assistant', content: text });
  if (ctx.mode === 'explain') { item.querySelector('.st').innerHTML = '💬 ' + T('Explication :'); var dv = document.createElement('div'); dv.className = 'aiText'; dv.textContent = text; item.appendChild(dv); return; }
  var code = GA.aiExtract(text);
  if (!code) {
    if (ctx.tries < 2 && prov().kind !== 'manual') return repair(ctx, 'Your answer does not contain a ```python code block. Reply again with exactly one ```python block containing the complete code.');
    item.querySelector('.st').innerHTML = '⚠️ ' + T('Pas de code Python trouvé dans la réponse.');
    var raw = document.createElement('pre'); raw.className = 'snippet'; raw.textContent = text; item.appendChild(raw);
    return;
  }
  var v = GA.aiValidate(code);
  if (v.errors.length && ctx.tries < 2 && prov().kind !== 'manual') {
    return repair(ctx, 'The atelier validator found problems in your code:\n- ' + v.errors.map(function (e) { return e.en; }).join('\n- ') + '\nFix every problem and return the COMPLETE corrected code in exactly one ```python block.');
  }
  showResult(ctx, code, v, text);
}
function repair(ctx, msg) {
  ctx.tries++;
  ctx.item.querySelector('.st').innerHTML = '🔧 ' + T('Correction automatique demandée à l\'IA') + ' (' + ctx.tries + '/2)…';
  var pre = document.createElement('pre'); pre.className = 'live'; ctx.item.appendChild(pre);
  ctx.turns.push({ role: 'user', content: msg });
  round(ctx);
}
function showResult(ctx, code, v, text) {
  var item = ctx.item, ok = !v.errors.length;
  var after = text.split(/```[\s\S]*?```/).join(' ').trim();
  var html = '<div class="st">' + (ok ? '✅ ' + T('Code vérifié') : '⚠️ ' + T('Le code a encore des problèmes')) + (ctx.tries ? ' <span class="muted">(' + ctx.tries + ' ' + T('correction(s) automatique(s)') + ')</span>' : '') + '</div>' +
    '<ul class="aiChecks">' + v.errors.map(function (e) { return '<li class="err">🛑 ' + esc(EN() ? e.en : e.fr) + '</li>'; }).join('') + v.warnings.map(function (e) { return '<li class="warn">⚠️ ' + esc(EN() ? e.en : e.fr) + '</li>'; }).join('') +
    (ok ? '<li>✔ ' + T('Syntaxe Python 2.7, fonctions de GIMP 2.10 et nombre d\'arguments vérifiés') + '</li>' : '') + '</ul>' +
    '<div class="snippet aiCode"></div>' + (after ? '<div class="aiText"></div>' : '') +
    '<div class="dlrow" style="margin-top:8px">' +
    (ctx.mode === 'modify' && ctx.runs.length ? '<button class="btn primary" data-a="replace">🔁 ' + T('Remplacer la sélection') + '</button>' : '') +
    (ctx.mode === 'plugin' ? '<button class="btn primary" data-a="project">📄 ' + T('Ouvrir comme nouveau projet') + '</button>' : '<button class="btn ' + (ctx.mode === 'modify' ? '' : 'primary') + '" data-a="insert">➕ ' + T('Insérer les blocs') + '</button>') +
    '<button class="btn" data-a="copy">📋 ' + T('Copier le code') + '</button>' +
    (prov().kind !== 'manual' ? '<button class="btn" data-a="again">🔧 ' + T('Redemander une correction') + '</button>' : '') + '</div>';
  item.innerHTML = html;
  item.querySelector('.aiCode').textContent = code;
  if (after) item.querySelector('.aiText').textContent = after;
  item.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'copy') { if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { GA.toast('Code copié'); }); }
    else if (a === 'again') { ctx.item = logItem('bot', '<div class="st">⏳</div>'); repair(ctx, 'Please review your code again against every rule (Python 2.7, no print, no ternary, no break, exact PDB signatures, run-mode never passed) and return the corrected complete code in one ```python block.' + (v.errors.length ? '\nKnown problems:\n- ' + v.errors.map(function (x) { return x.en; }).join('\n- ') : '')); }
    else if (a === 'project') { GA.app.importText(code, 'plugin_ia'); }
    else insertCode(code, a === 'replace' ? ctx.runs[0] : null).then(function (n) { if (n) { b.disabled = true; b.textContent = '✔ ' + n + ' ' + T('bloc(s) ajouté(s)'); } });
  });
}

/* ================= insertion des blocs ================= */
function lastOf(b) { while (b.getNextBlock()) b = b.getNextBlock(); return b; }
function insertCode(code, replaceRun) {
  return GA.importPython(code, 'ia').then(function (r) {
    var hat = r.state.blocks.blocks[0], first = hat.inputs && hat.inputs.DO && hat.inputs.DO.block;
    if (!first) { GA.toast('Le code ne contient aucune instruction.'); return 0; }
    var w = ws(), n = 0;
    Blockly.Events.setGroup(true);
    try {
      var nb = Blockly.serialization.blocks.append(first, w), last = lastOf(nb);
      var cnt = function (b) { var k = 0; while (b) { k += b.getDescendants(false).length; b = null; } return k; };
      n = r.count - 1;
      var conn = null, after = null;
      if (replaceRun && replaceRun.length && !replaceRun[0].disposed) {
        var f0 = replaceRun[0], l0 = replaceRun[replaceRun.length - 1];
        conn = f0.previousConnection && f0.previousConnection.targetConnection;
        after = l0.getNextBlock();
        var xy = f0.getRelativeToSurfaceXY();
        if (after) after.unplug(false);
        f0.unplug(false);
        f0.dispose(false);
        if (!conn) nb.moveBy(xy.x, xy.y);
        GA.selClear();
      } else {
        var sel = Blockly.common.getSelected && Blockly.common.getSelected();
        if (sel && sel.workspace === w && sel.nextConnection && sel.type !== 'g_start' && sel.type !== 'py_file' && !sel.isShadow()) { conn = sel.nextConnection; after = sel.getNextBlock(); if (after) after.unplug(false); }
        else {
          var hatB = GA.getHat(w), isDef = first.type === 'py_def' || first.type === 'py_class' || first.type === 'py_decorator';
          var target = null, b = hatB && hatB.getInputTargetBlock('DO');
          if (isDef) while (b) { if (b.type === 'py_callst' && /^(register|main)$/.test(b.getFieldValue && b.getFieldValue('FUNC') || '')) break; target = b; b = b.getNextBlock(); }
          else { target = b ? lastOf(b) : null; }
          if (target) { conn = target.nextConnection; after = target.getNextBlock(); if (after) after.unplug(false); }
          else if (hatB) { conn = hatB.getInput('DO').connection; after = hatB.getInputTargetBlock('DO'); if (after) after.unplug(false); }
        }
      }
      if (conn) conn.connect(nb.previousConnection);
      if (after) last.nextConnection.connect(after.previousConnection);
      var sel2 = [], x = nb; while (x) { sel2.push(x); if (x === last) break; x = x.getNextBlock(); }
      setTimeout(function () { GA.selectBlocks(sel2); GA.reveal(nb); }, 30);
    } finally { Blockly.Events.setGroup(false); }
    GA.toast(n + ' ' + T('bloc(s) ajouté(s) par l\'IA — Ctrl+Z pour annuler'));
    return n;
  });
}
AI.insertCode = insertCode;

/* ================= réglages IA ================= */
AI.openSettings = function () {
  var d = GA.app.openDialog('<h2>🤖 ' + T('Réglages IA') + '</h2><p class="sub">' + T('N\'importe quelle IA peut être utilisée : en ligne ou sur ton PC. La liste ci-dessous ne sert qu\'à pré-remplir l\'adresse et le modèle — tout reste modifiable, et « N\'importe quelle autre IA » te laisse tout définir toi-même.') + '</p>' +
    '<div class="field"><label for="iaP">' + T('Raccourci (facultatif)') + '</label><select id="iaP">' + PROVIDERS.map(function (p) { return '<option value="' + p.id + '">' + esc(T(p.name)) + '</option>'; }).join('') + '</select></div>' +
    '<div id="iaApi"><div class="row2"><div class="field"><label for="iaU">' + T('Adresse de l\'API') + '</label><input type="text" id="iaU" placeholder="http://localhost:11434/v1"></div><div class="field"><label for="iaM">' + T('Modèle') + '</label><input type="text" id="iaM" placeholder="mon-modele"></div></div>' +
    '<div class="field" id="iaKeyF"><label for="iaK">' + T('Clé API (laisse vide si ton IA n\'en demande pas)') + '</label><input type="password" id="iaK" autocomplete="off"><div class="checks"><label><input type="checkbox" id="iaR"><span>' + T('Mémoriser la clé dans ce navigateur') + '<small>' + T('Sinon, elle est oubliée à la fermeture de l\'onglet.') + '</small></span></label></div></div>' +
    '<div class="field"><label>' + T('Créativité') + ' : <span id="iaTV"></span></label><input type="range" id="iaT" min="0" max="1" step="0.1"></div>' +
    '<details id="iaAdv"><summary>' + T('Réglages avancés : dialecte, authentification, en-têtes, format de la requête') + '</summary>' +
    '<div class="row2"><div class="field"><label for="iaD">' + T('Format des messages (dialecte)') + '</label><select id="iaD"><option value="openai">' + T('Compatible OpenAI (le plus courant)') + '</option><option value="ollama">' + T('Ollama natif (/api/chat)') + '</option><option value="anthropic">' + T('Anthropic (Claude)') + '</option><option value="gemini">' + T('Google Gemini') + '</option></select></div>' +
    '<div class="field"><label for="iaPath">' + T('Chemin de la requête') + '</label><input type="text" id="iaPath" placeholder="/chat/completions"></div></div>' +
    '<div class="row2"><div class="field"><label for="iaAuth">' + T('Authentification') + '</label><select id="iaAuth"><option value="none">' + T('Aucune (IA locale)') + '</option><option value="bearer">Authorization: Bearer …</option><option value="x-api-key">x-api-key: …</option><option value="query">' + T('Dans l\'adresse (?key=…)') + '</option><option value="header">' + T('En-tête personnalisé') + '</option></select></div>' +
    '<div class="field" id="iaAuthF"><label for="iaAuthName">' + T('Nom de l\'en-tête / préfixe') + '</label><div class="row2"><input type="text" id="iaAuthName" placeholder="X-Ma-Cle"><input type="text" id="iaAuthPre" placeholder="Bearer "></div></div></div>' +
    '<div class="field"><label for="iaH">' + T('En-têtes supplémentaires (JSON, ou une ligne « Nom: valeur »)') + '</label><textarea id="iaH" rows="2" class="copyzone" style="min-height:0"></textarea></div>' +
    '<div class="field"><label for="iaB">' + T('Corps de la requête (vide = automatique). Variables : {{model}} {{system}} {{prompt}} {{messages}} {{messages_with_system}} {{contents}} {{temperature}}') + '</label><textarea id="iaB" rows="6" class="copyzone"></textarea></div>' +
    '<div class="field"><label for="iaRp">' + T('Où lire le texte dans la réponse (ex. choices.0.message.content). Vide = détection automatique.') + '</label><input type="text" id="iaRp" placeholder="choices.0.message.content"></div></details></div>' +
    '<div class="tip" id="iaNote"></div>' +
    '<div class="foot"><button class="btn" id="iaTest">🔌 ' + T('Tester') + '</button><button class="btn" id="iaDl">⬇ ' + T('Télécharger l\'atelier') + '</button><button class="btn primary" id="iaOk">' + T('Enregistrer') + '</button></div>', 'wide');
  function v(s) { return d.querySelector(s); }
  function cur() { return PROVIDERS.filter(function (x) { return x.id === v('#iaP').value; })[0]; }
  function sync(fromSelect) {
    var p = cur(), custom = p.id === 'custom';
    v('#iaApi').style.display = p.kind === 'claude' || p.kind === 'manual' ? 'none' : '';
    v('#iaAdv').style.display = p.kind === 'claude' || p.kind === 'manual' ? 'none' : '';
    if (custom) v('#iaAdv').open = true;
    if (fromSelect) {
      v('#iaU').value = p.url || ''; v('#iaM').value = p.model || '';
      if (custom) { v('#iaD').value = cfg.dialect || 'openai'; }
      else { v('#iaD').value = p.kind === 'anthropic' ? 'anthropic' : p.kind === 'gemini' ? 'gemini' : 'openai'; v('#iaAuth').value = p.kind === 'anthropic' ? 'x-api-key' : p.kind === 'gemini' ? 'query' : (p.key ? 'bearer' : 'none'); }
      v('#iaPath').value = custom ? (cfg.path || GA.aiDefaultPath(v('#iaD').value)) : GA.aiDefaultPath(v('#iaD').value);
      v('#iaB').placeholder = GA.aiDefaultBody(v('#iaD').value);
    }
    v('#iaAuthF').style.display = v('#iaAuth').value === 'header' ? '' : 'none';
    ['#iaD', '#iaPath', '#iaAuth', '#iaH', '#iaB', '#iaRp', '#iaAuthName', '#iaAuthPre'].forEach(function (sel) { v(sel).disabled = !custom; });
    var notes = {
      claude: 'Utilise ton compte Claude, sans clé. La première demande te demandera ton accord. Marche uniquement dans la page publiée sur claude.ai.',
      manual: 'Aucune connexion : l\'atelier te donne le prompt complet à coller dans n\'importe quelle IA, puis tu colles sa réponse. Marche partout.',
      custom: 'Mode libre : mets l\'adresse de ton serveur, choisis le format des messages, l\'authentification (ou aucune), et au besoin écris toi-même le corps de la requête. Tout serveur qui répond du JSON peut marcher.',
      local: 'L\'IA tourne sur ton PC. Ouvre l\'atelier chez toi (bouton « Télécharger l\'atelier ») : la page publiée sur claude.ai bloque les connexions vers d\'autres sites.',
      api: 'Les clés API se créent sur le site du fournisseur. Depuis la page publiée sur claude.ai, les connexions directes sont bloquées : télécharge l\'atelier et ouvre-le dans ton navigateur.'
    };
    v('#iaNote').textContent = T(p.id === 'custom' ? notes.custom : p.kind === 'claude' ? notes.claude : p.kind === 'manual' ? notes.manual : p.key ? notes.api : notes.local);
    v('#iaTV').textContent = v('#iaT').value;
  }
  v('#iaP').value = cfg.provider; v('#iaU').value = cfg.url || prov().url || ''; v('#iaM').value = cfg.model || prov().model || '';
  v('#iaK').value = cfg.key || ''; v('#iaR').checked = !!cfg.remember; v('#iaT').value = cfg.temperature;
  v('#iaD').value = cfg.dialect || 'openai'; v('#iaAuth').value = cfg.auth || 'bearer'; v('#iaAuthName').value = cfg.authName || ''; v('#iaAuthPre').value = cfg.authPrefix || '';
  v('#iaH').value = cfg.headers || ''; v('#iaB').value = cfg.body || ''; v('#iaRp').value = cfg.respPath || ''; v('#iaPath').value = cfg.path || '';
  v('#iaP').onchange = function () { sync(true); };
  v('#iaD').onchange = function () { v('#iaPath').value = GA.aiDefaultPath(this.value); v('#iaB').placeholder = GA.aiDefaultBody(this.value); sync(false); };
  v('#iaAuth').onchange = function () { sync(false); };
  v('#iaT').oninput = function () { v('#iaTV').textContent = this.value; };
  function take() {
    cfg.provider = v('#iaP').value; cfg.url = v('#iaU').value.trim(); cfg.model = v('#iaM').value.trim(); cfg.key = v('#iaK').value.trim();
    cfg.remember = v('#iaR').checked; cfg.temperature = Number(v('#iaT').value);
    cfg.dialect = v('#iaD').value; cfg.path = v('#iaPath').value.trim(); cfg.auth = v('#iaAuth').value;
    cfg.authName = v('#iaAuthName').value.trim(); cfg.authPrefix = v('#iaAuthPre').value;
    cfg.headers = v('#iaH').value.trim(); cfg.body = v('#iaB').value.trim(); cfg.respPath = v('#iaRp').value.trim();
    saveCfg();
  }
  v('#iaOk').onclick = function () { take(); GA.app.closeDialog(); AI.render(); GA.toast('Réglages IA enregistrés'); };
  v('#iaDl').onclick = AI.downloadAtelier;
  v('#iaTest').onclick = function () {
    take();
    if (prov().kind === 'manual') { GA.toast('Le mode copier-coller n\'a rien à tester.'); return; }
    var b = v('#iaTest'); b.disabled = true; b.textContent = '⏳';
    callAI([{ role: 'user', sys: 'You are a connection test.', content: 'Reply with the single word: OK' }]).then(function (t) { GA.toast(T('Connexion réussie') + ' : « ' + String(t).trim().slice(0, 40) + ' »'); }, function (e) { GA.toast(e.message.slice(0, 180)); })
      .then(function () { b.disabled = false; b.textContent = '🔌 ' + T('Tester'); });
  };
  sync(false);
};

/* ================= l'atelier en fichier, pour l'ouvrir chez soi ================= */
AI.downloadAtelier = function () {
  var html = GA.snapshot;
  if (!html) { GA.toast('Copie de l\'atelier indisponible.'); return; }
  var enc = new TextEncoder();
  var readme = (EN() ? ['GIMP Code Block - Plug-in Maker - offline copy', '', '1. Unzip this folder.', '2. Double-click gimp-code-block.html: it opens in your web browser.', '3. An internet connection is needed to load the blocks library and to reach online AIs.', '4. AI settings: choose your provider (OpenAI, Gemini, Mistral, Ollama...).', '   Ollama: start it with the environment variable OLLAMA_ORIGINS=*', '   LM Studio: enable CORS in the server settings.']
    : ['GIMP Code Block - Plug-in Maker - copie à ouvrir chez toi', '', '1. Décompresse ce dossier.', '2. Double-clique sur gimp-code-block.html : il s\'ouvre dans ton navigateur.', '3. Une connexion internet est nécessaire pour charger la bibliothèque de blocs et pour les IA en ligne.', '4. Réglages IA : choisis ton fournisseur (OpenAI, Gemini, Mistral, Ollama...).', '   Ollama : lance-le avec la variable d\'environnement OLLAMA_ORIGINS=*', '   LM Studio : active CORS dans les réglages du serveur.']).join('\r\n');
  var zip = GA.makeZip([{ name: 'gimp-code-block.html', bytes: enc.encode(html) }, { name: EN() ? 'README.txt' : 'LISEZ-MOI.txt', bytes: enc.encode(readme) }]);
  GA.app.saveFile('gimp-code-block.zip', zip).then(function (ok) { if (ok) GA.toast('Atelier téléchargé : décompresse-le et ouvre gimp-code-block.html'); });
};
AI.init = function () { AI.render(); };
})();
