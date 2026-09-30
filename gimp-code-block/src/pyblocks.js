/* Atelier — blocs « Python fidèle » : chaque instruction du code devient un bloc, et redevient exactement le même code */
(function (root) {
'use strict';
var GA = root.GA;
var PY = GA.py;
var T = function (x) { return GA.T ? GA.T(x) : x; };
var IND = '    ';
var PREC_BIN = { '|': 7, '^': 8, '&': 9, '<<': 10, '>>': 10, '+': 11, '-': 11, '*': 12, '/': 12, '//': 12, '%': 12, '@': 12, '**': 14 };
var PICK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#fff" fill-opacity=".92"/>' +
  '<circle cx="10.5" cy="10.5" r="5" fill="none" stroke="#2B3346" stroke-width="2.4"/>' +
  '<path d="M14.2 14.2l4.3 4.3" stroke="#2B3346" stroke-width="2.6" stroke-linecap="round"/></svg>');
var REGISTER_ARGS = ['nom', 'description', 'aide', 'auteur', 'copyright', 'date', 'libellé', 'types d\'image', 'paramètres', 'résultats', 'fonction'];

GA.CATS.splice(GA.CATS.length - 1, 0, { id: 'py', name: '🐍 Python', colour: '#3776AB', intro: 'Chaque ligne de Python en bloc (scripts importés)' });
GA.CAT.py = GA.CATS.filter(function (c) { return c.id === 'py'; })[0];
GA.PY_STYLES = { cat_pycom: '#8A8FA3', cat_pyraw: '#B5533C', cat_pycall: '#0E8A7E', cat_pypdb: '#414B60', cat_pyexpr: '#3E9E4E', cat_pyleaf: '#5A6A82', cat_pyvar: '#FF8C1A', cat_pyconst: '#8E5CC7' };

/* ---------- aide & boîte à outils (specs « custom ») ---------- */
function leafBox(code) { return { block: { type: 'py_leaf', fields: { CODE: code } } }; }
GA.defs.push(function () {
  function sp(type, msg, help, box, extra) {
    var s = { type: type, cat: 'py', custom: true, args: {}, msg: msg, help: help, box: box || { type: type } };
    if (extra) for (var k in extra) s[k] = extra[k];
    return s;
  }
  return [
    sp('py_file', '📄 script Python …', 'Le fichier Python entier. Les blocs à l\'intérieur sont les lignes du script, dans l\'ordre, exactement comme dans le fichier.', null, { hidden: true, tip: 'Le téléchargement produit le même script. Tu peux le réimporter : les blocs reviennent à l\'identique.' }),
    sp('py_def', 'définir …(…)', 'Définit une fonction : un groupe d\'instructions qu\'on lance par son nom. Les paramètres s\'écrivent séparés par des virgules.',
      { type: 'py_def', fields: { NAME: 'ma_fonction', ARGS: 'image, drawable' } }, { kw: 'def fonction' }),
    sp('py_return', 'retourner …', 'Termine la fonction et renvoie une valeur (ou rien si la case est vide).', null, { kw: 'return' }),
    sp('py_assign', '… = …', 'Range une valeur dans une ou plusieurs variables (ex. « a, b »).', { type: 'py_assign', fields: { T: 'x' }, inputs: { V: leafBox('0') } }, { kw: 'variable affectation' }),
    sp('py_augassign', '… += …', 'Modifie une variable à partir de sa valeur actuelle (+=, -=, *=…).', { type: 'py_augassign', fields: { T: 'x', OP: '+=' }, inputs: { V: leafBox('1') } }),
    sp('py_callst', 'appeler …(…)', 'Lance une fonction (de GIMP, de Python ou la tienne). Clic droit pour ajouter ou retirer des arguments.',
      { type: 'py_callst', extraState: { a: ['p'] }, fields: { FUNC: 'pdb.gimp_message' }, inputs: { A0: leafBox('"Bonjour"') } }, { kw: 'fonction appel pdb' }),
    sp('py_if', 'si … alors …', 'Fait les blocs seulement si la condition est vraie. Clic droit : ajouter « sinon si » ou « sinon ».', null, { kw: 'if elif else condition' }),
    sp('py_for', 'pour … dans …', 'Répète les blocs pour chaque élément (d\'une liste, d\'un range()…).', { type: 'py_for', fields: { T: 'i' }, inputs: { ITER: leafBox('range(10)') } }, { kw: 'for boucle' }),
    sp('py_while', 'tant que …', 'Répète tant que la condition est vraie.', null, { kw: 'while boucle' }),
    sp('py_try', 'essayer … si erreur …', 'Essaie des instructions et réagit si une erreur arrive. Clic droit : ajouter un cas d\'erreur, « sinon », « à la fin ».', null, { kw: 'try except finally erreur' }),
    sp('py_with', 'avec … comme …', 'Ouvre une ressource (souvent un fichier) le temps des instructions à l\'intérieur, puis la referme.', { type: 'py_with', extraState: { n: 1 }, fields: { V0: 'f' }, inputs: { E0: leafBox('open("fichier.txt")') } }, { kw: 'with open fichier' }),
    sp('py_pass', 'ne rien faire (pass)', 'Une instruction vide, utile quand Python exige au moins une ligne.'),
    sp('py_break', 'sortir de la boucle (break)', 'Quitte immédiatement la boucle en cours.'),
    sp('py_continue', 'tour suivant (continue)', 'Passe directement au tour suivant de la boucle.'),
    sp('py_raise', 'lever l\'erreur …', 'Déclenche une erreur (vide : relance l\'erreur en cours).', null, { kw: 'raise exception' }),
    sp('py_comment', '# commentaire', 'Une ligne de commentaire : elle ne fait rien, elle explique.', { type: 'py_comment', fields: { TEXT: ' explication' } }),
    sp('py_stmt', 'instruction Python', 'Une instruction écrite telle quelle : import, global, del, print, assert…', { type: 'py_stmt', fields: { CODE: 'import os' } }, { kw: 'import global print' }),
    sp('py_decorator', '@décorateur', 'Un décorateur, placé juste au-dessus d\'une définition de fonction ou de classe.', { type: 'py_decorator', fields: { CODE: 'staticmethod' } }),
    sp('py_class', 'classe …', 'Définit une classe (un modèle d\'objet).', { type: 'py_class', fields: { NAME: 'MaClasse', BASES: 'object' } }),
    sp('py_exprstmt', '▸ valeur seule', 'Une valeur utilisée seule comme instruction (par exemple le texte d\'explication d\'une fonction).', { type: 'py_exprstmt', inputs: { V: leafBox('"""Explication."""') } }),
    sp('py_raw', '🧱 code brut', 'Du code gardé caractère pour caractère, parce qu\'il contient une erreur de syntaxe (déjà présente dans le fichier d\'origine). Corrige-le puis réimporte le script pour le transformer en blocs.', { type: 'py_raw', fields: { CODE: '# code brut' } }),
    sp('py_var', 'variable', 'Une variable : un nom qui garde une valeur (image, calque, nombre, texte…). Clique dessus pour choisir parmi les variables de ton script.', { type: 'py_var', fields: { NAME: 'image' } }, { sep: 'Valeurs', kw: 'variable nom' }),
    sp('py_leaf', 'valeur Python', 'Une valeur écrite en Python : nombre, texte entre guillemets, nom de variable, liste…', { type: 'py_leaf', fields: { CODE: '0' } }),
    sp('py_call', 'résultat de …(…)', 'Le résultat d\'une fonction. Clic droit pour ajouter ou retirer des arguments.', { type: 'py_call', extraState: { a: ['p'] }, fields: { FUNC: 'len' }, inputs: { A0: leafBox('liste') } }),
    sp('py_binop', '… + …', 'Un calcul entre deux valeurs (+, -, *, /, //, %, **…).', { type: 'py_binop', fields: { OP: '+' }, inputs: { A: leafBox('1'), B: leafBox('2') } }),
    sp('py_compare', '… == …', 'Une comparaison (==, !=, <, >, dans, est…).', { type: 'py_compare', extraState: { n: 1 }, fields: { OP1: '==' }, inputs: { V0: leafBox('x'), V1: leafBox('0') } }),
    sp('py_boolop', '… et …', 'Combine des conditions avec « et » / « ou ».', { type: 'py_boolop', extraState: { op: 'and', n: 2 } }),
    sp('py_unary', 'non …', '« non » inverse une condition ; « − » change le signe.', { type: 'py_unary', fields: { OP: 'not' } }),
    sp('py_ifexp', '… si … sinon …', 'Choisit une valeur selon une condition, sur une seule ligne.'),
    sp('py_attr', '… . nom', 'Un attribut d\'un objet (ex. calque.name).'),
    sp('py_index', '… [ … ]', 'Un élément d\'une liste ou d\'un tuple (le premier est [0]).'),
    sp('py_slice', 'début : fin', 'Une tranche, à mettre dans « … [ … ] » (ex. 0:3).', { type: 'py_slice', extraState: { s: false } }),
    sp('py_list', '[ …, … ]', 'Une liste ou un tuple de valeurs. Clic droit pour ajouter des éléments.', { type: 'py_list', extraState: { k: 'list', n: 2 } }),
    sp('py_paren', '( … )', 'Des parenthèses autour d\'une valeur, comme dans ton code d\'origine.', null),
    sp('py_dict', '{ clé: valeur }', 'Un dictionnaire (des valeurs rangées par clé).', { type: 'py_dict', extraState: { n: 1, d: [] } })
  ];
});

/* ---------- définitions Blockly + générateurs ---------- */
GA.pyInit = function (Blockly, G) {
  var leafOrdCache = new Map();
  function leafOrd(text) {
    if (leafOrdCache.has(text)) return leafOrdCache.get(text);
    var o;
    try { o = PY.ordOf(PY.prec(PY.parseExpr(text, true))); } catch (e) { o = 99; }
    if (leafOrdCache.size > 20000) leafOrdCache.clear();
    leafOrdCache.set(text, o);
    return o;
  }
  GA.leafOrd = leafOrd;
  function tx(s) { return PY.markStrings(String(s == null ? '' : s)); }
  /* Mise en forme exacte. Chaque ligne d'instruction porte un repère \u0001 + genre + indentation d'origine + \u0002
     (genre S = instruction, H = clause else/elif/except/finally, C = commentaire), résolu à l'assemblage du fichier. */
  var FM = ['sp', 'bl', 'i', 't', 'g', 'o', 'oh', 'ic', 'sl', 'sc'];
  var SIMPLE = { py_assign: 1, py_augassign: 1, py_callst: 1, py_return: 1, py_raise: 1, py_pass: 1, py_break: 1, py_continue: 1, py_exprstmt: 1, py_stmt: 1 };
  function hint(k, i) { return '\u0001' + k + (i === undefined || i === null ? '\u0005' : i) + '\u0002'; }
  function blk(m) { if (m.bl) return m.bl.map(function (x) { return '\u0000' + x + '\n'; }).join(''); return new Array((m.sp || 0) + 1).join('\n'); }
  function endOf(m, c) { if (c !== null && c !== undefined) return (m.g !== undefined ? m.g : '  ') + '#' + String(c).replace(/[\r\n]+/g, ' '); return m.t || ''; }
  function pickM(m, norm) { if (m.o !== undefined && m.oh === PY.fnv(PY.clean(norm))) return { txt: m.o.replace(/\n/g, '\n\u0000'), orig: true }; return { txt: norm, orig: false }; }
  function icLines(m, orig) { if (orig || !m.ic) return ''; return m.ic.map(function (c) { return hint('C', m.i) + '#' + c + '\n'; }).join(''); }
  function com(b) { return b.getCommentText ? b.getCommentText() : null; }
  // « a = 1; b = 2 » : la 2e instruction se recolle à la précédente si celle-ci est une instruction simple sans commentaire
  function joinable(b) {
    var m = b.fm_, pv = b.getPreviousBlock();
    if (m.sc === undefined || !pv || pv.getNextBlock() !== b || !SIMPLE[pv.type] || !pv.isEnabled()) return false;
    if (com(pv) !== null && com(pv) !== undefined) return false;
    if (pv.fm_ && pv.fm_.t) return false;
    return !m.bl && !m.sp;
  }
  function stmtLine(b, norm) {
    var m = b.fm_, p = pickM(m, norm);
    if (joinable(b)) return '\u0006' + m.sc + '\u0007' + p.txt + endOf(m, com(b)) + '\n';
    return blk(m) + icLines(m, p.orig) + hint('S', m.i) + p.txt + endOf(m, com(b)) + '\n';
  }
  function sameLine(b, name, sl, c) {
    if (sl === undefined || sl === null || (c !== null && c !== undefined)) return null;
    var ch = b.getInputTargetBlock(name);
    if (!ch || ch.getNextBlock() || !SIMPLE[ch.type] || !ch.isEnabled()) return null;
    var code = G.blockToCode(ch);
    code = code.replace(/^[ \t]*#@@'[^\n]*'\n/, '').replace(/\u0001[^\u0002]*\u0002/g, '');
    if (code.charAt(0) === '\n' || code.charAt(0) === '\u0000') return null;
    code = code.replace(/\n$/, '');
    if (/\n(?!\u0000)/.test(code)) return null;
    return sl + code;
  }
  function headLine(b, norm, bodyName) {
    var m = b.fm_, p = pickM(m, norm), c = com(b);
    var same = sameLine(b, bodyName, m.sl, c);
    if (same !== null) return blk(m) + icLines(m, p.orig) + hint('S', m.i) + p.txt + same + '\n';
    return blk(m) + icLines(m, p.orig) + hint('S', m.i) + p.txt + endOf(m, c) + '\n' + body(b, bodyName);
  }
  function clauseLine(b, key, norm, bodyName) {
    var m = (b.cm_ && b.cm_[key]) || {}, p = pickM(m, norm);
    var same = sameLine(b, bodyName, m.sl, m.c);
    if (same !== null) return blk(m) + hint('H', m.i) + p.txt + same + '\n';
    return blk(m) + icLines(m, p.orig) + hint('H', m.i) + p.txt + endOf(m, m.c) + '\n' + body(b, bodyName);
  }
  function val(b, name, p) { var c = G.valueToCode(b, name, p ? PY.need(p) : 99); return c || 'None'; }
  function has(b, name) { return !!b.getInputTargetBlock(name); }
  function body(b, name) {
    var code = G.statementToCode(b, name) || '';
    var t = b.getInputTargetBlock(name), ok = false;
    while (t) { if (t.type !== 'py_comment' && t.isEnabled()) { ok = true; break; } t = t.getNextBlock(); }
    if (!ok) code += IND + hint('S') + 'pass\n';
    return code;
  }
  function txt(v) { return new Blockly.FieldTextInput(v); }
  /* champ « pastille » : variable, fonction ou attribut, avec suggestions pendant la frappe (GA.suggest) */
  class PillField extends Blockly.FieldTextInput {
    constructor(v, kind) { super(v); this.kind_ = kind; }
    initView() {
      super.initView();
      if (!this.fieldGroup_) return;
      Blockly.utils.dom.addClass(this.fieldGroup_, 'gcbPill gcbPill-' + this.kind_);
      var src = this.getSourceBlock();
      if (src && src.type === 'py_var') Blockly.utils.dom.addClass(this.fieldGroup_, 'gcbPill-solo');   // le bloc entier est la pastille
      if (this.kind_ === 'func' && /^pdb\./.test(this.getValue() || '')) Blockly.utils.dom.addClass(this.fieldGroup_, 'gcbPill-pdb');
    }
    isFullBlockField() { return false; }   // sinon Zelos repeint tout le bloc en blanc
    render_() {
      super.render_();
      var r = this.borderRect_;
      if (r) { var h = this.size_.height; r.setAttribute('rx', h / 2); r.setAttribute('ry', h / 2); }
    }
    showEditor_(e, quiet) {
      // variable : par défaut un menu de choix (comme Scratch) ; la saisie au clavier est une option de l'apparence
      if (this.kind_ === 'var' && !this.forceText_ && GA.varMenu && !(GA.prefs && GA.prefs.varText)) { GA.varMenu.open(this); return; }
      super.showEditor_(e, quiet);
      if (GA.suggest && this.htmlInput_) GA.suggest.open(this, this.kind_, this.htmlInput_);
    }
  }
  function pill(v, kind) { return new PillField(v, kind); }
  GA.PillField = PillField;
  function mtxt(v) { return new Blockly.FieldMultilineInput(v); }
  /* case valeur : en l'ouvrant, l'atelier propose les valeurs habituelles à cet endroit (register, PF_…, pdb) */
  class LeafField extends Blockly.FieldMultilineInput {
    showEditor_(e, quiet) {
      super.showEditor_(e, quiet);
      var h = GA.valueHints && this.htmlInput_ ? GA.valueHints(this.getSourceBlock()) : null;
      if (h && h.items.length && GA.suggest) GA.suggest.open(this, 'val', this.htmlInput_, h);
    }
  }
  function mutate(block, fn) {
    var before = JSON.stringify(block.saveExtraState() || {});
    Blockly.Events.setGroup(true);
    try {
      fn();
      var after = JSON.stringify(block.saveExtraState() || {});
      if (block.rendered) { try { block.initSvg(); } catch (e) { /* ok */ } if (block.queueRender) block.queueRender(); else block.render(); }
      var BC = Blockly.Events.BlockChange || Blockly.Events.get(Blockly.Events.BLOCK_CHANGE);
      Blockly.Events.fire(new BC(block, 'mutation', null, before, after));
    } finally { Blockly.Events.setGroup(false); }
  }
  function rm(block, name) { if (block.getInput(name)) block.removeInput(name); }
  function item(text, fn, enabled) { return { text: text, enabled: enabled !== false, callback: fn }; }

  /* instruction : bloc avec lignes vides avant (sp) et commentaire de fin de ligne (icône) */
  function defStmt(type, o) {
    Blockly.Blocks[type] = {
      init: function () {
        this.fm_ = {}; this.cm_ = null;
        o.init.call(this);
        this.setPreviousStatement(true, 'Action'); this.setNextStatement(true, 'Action');
        this.setStyle(o.style || 'cat_py');
        this.setTooltip(GA.SPEC[type] ? GA.SPEC[type].help : '');
      },
      saveExtraState: function () {
        var st = o.save ? o.save.call(this) : {}, fm = this.fm_ || {};
        FM.forEach(function (k) { if (fm[k] !== undefined) st[k] = fm[k]; });
        if (this.cm_) st.cm = this.cm_;
        return Object.keys(st).length ? st : null;
      },
      loadExtraState: function (st) {
        st = st || {}; var fm = this.fm_ = {};
        FM.forEach(function (k) { if (st[k] !== undefined) fm[k] = st[k]; });
        this.cm_ = st.cm || null;
        if (o.load) o.load.call(this, st);
      },
      customContextMenu: o.menu ? function (opts) { o.menu.call(this, opts); } : undefined
    };
    G.forBlock[type] = function (b) { return o.gen.call(b, b); };
  }
  function defVal(type, o) {
    var def = {
      init: function () { o.init.call(this); this.setOutput(true, null); this.setStyle(o.style || 'cat_pyexpr'); this.setInputsInline(true); this.setTooltip(GA.SPEC[type] ? GA.SPEC[type].help : ''); }
    };
    if (o.save) { def.saveExtraState = function () { return o.save.call(this); }; def.loadExtraState = function (st) { o.load.call(this, st || {}); }; }
    if (o.menu) def.customContextMenu = function (opts) { o.menu.call(this, opts); };
    Blockly.Blocks[type] = def;
    G.forBlock[type] = function (b) { return o.gen.call(b, b); };
  }

  /* ----- fichier ----- */
  Blockly.Blocks.py_file = {
    init: function () {
      this.py3_ = false;
      this.appendDummyInput().appendField(T('📄 script Python')).appendField(txt('mon_script'), 'NAME').appendField(T('.py'));
      this.appendStatementInput('DO').setCheck('Action');
      this.setStyle('cat_py'); this.setDeletable(false);
      this.setTooltip(GA.SPEC.py_file.help);
    },
    saveExtraState: function () {
      var s = {};
      if (this.py3_) s.py3 = true;
      if (this.bom_) s.bom = 1;
      if (this.eol_) s.eol = this.eol_;
      if (this.end_ !== undefined) s.end = this.end_;
      if (this.vars_ && this.vars_.length) s.vars = this.vars_.slice();
      if (this.lists_ && this.lists_.length) s.lists = this.lists_.slice();   // variables créées à la main (pas encore utilisées)
      return Object.keys(s).length ? s : null;
    },
    loadExtraState: function (s) { s = s || {}; this.py3_ = !!s.py3; this.bom_ = !!s.bom; this.eol_ = s.eol || null; this.end_ = s.end; this.vars_ = (s.vars || []).slice(); this.lists_ = (s.lists || []).slice(); }
  };

  /* ----- instructions simples ----- */
  defStmt('py_comment', { style: 'cat_pycom', init: function () { this.appendDummyInput().appendField('#').appendField(txt(' commentaire'), 'TEXT'); },
    gen: function (b) { return blk(b.fm_) + hint('C', b.fm_.i) + '#' + String(b.getFieldValue('TEXT')).replace(/[\r\n]+/g, ' ') + '\n'; } });
  defStmt('py_raw', { style: 'cat_pyraw', init: function () { this.appendDummyInput().appendField(T('🧱 code brut (erreur de syntaxe à corriger)')); this.appendDummyInput('B').appendField(mtxt(''), 'CODE'); },
    gen: function (b) { return blk(b.fm_) + '\u0000' + String(b.getFieldValue('CODE')).replace(/\n/g, '\n\u0000') + '\n'; } });
  defStmt('py_stmt', { init: function () { this.appendDummyInput().appendField(mtxt('pass'), 'CODE'); },
    gen: function (b) { return stmtLine(b, tx(b.getFieldValue('CODE'))); } });
  defStmt('py_decorator', { init: function () { this.appendDummyInput().appendField('@').appendField(txt('decorateur'), 'CODE'); },
    gen: function (b) { return stmtLine(b, '@' + tx(b.getFieldValue('CODE'))); } });
  defStmt('py_pass', { init: function () { this.appendDummyInput().appendField(T('ne rien faire (pass)')); }, gen: function (b) { return stmtLine(b, 'pass'); } });
  defStmt('py_break', { init: function () { this.appendDummyInput().appendField(T('sortir de la boucle (break)')); }, gen: function (b) { return stmtLine(b, 'break'); } });
  defStmt('py_continue', { init: function () { this.appendDummyInput().appendField(T('tour suivant (continue)')); }, gen: function (b) { return stmtLine(b, 'continue'); } });
  defStmt('py_return', { init: function () { this.appendValueInput('V').appendField(T('retourner')); },
    gen: function (b) { return stmtLine(b, 'return' + (has(b, 'V') ? ' ' + val(b, 'V', 0) : '')); } });
  defStmt('py_raise', { init: function () { this.appendValueInput('V').appendField(T('lever l\'erreur')); },
    gen: function (b) { return stmtLine(b, 'raise' + (has(b, 'V') ? ' ' + val(b, 'V', 1) : '')); } });
  defStmt('py_assign', { init: function () { this.appendValueInput('V').appendField(pill('x', 'var'), 'T').appendField('='); this.setInputsInline(true); },
    gen: function (b) { return stmtLine(b, tx(b.getFieldValue('T')) + ' = ' + val(b, 'V', 0)); } });
  var AUGS = ['+=', '-=', '*=', '/=', '//=', '%=', '**=', '>>=', '<<=', '&=', '|=', '^=', '@='];
  defStmt('py_augassign', { init: function () { this.appendValueInput('V').appendField(pill('x', 'var'), 'T').appendField(new Blockly.FieldDropdown(AUGS.map(function (o) { return [o, o]; })), 'OP'); this.setInputsInline(true); },
    gen: function (b) { return stmtLine(b, tx(b.getFieldValue('T')) + ' ' + b.getFieldValue('OP') + ' ' + val(b, 'V', 0)); } });
  defStmt('py_exprstmt', { init: function () { this.appendValueInput('V').appendField('▸'); },
    gen: function (b) { return stmtLine(b, has(b, 'V') ? val(b, 'V', 0) : 'pass'); } });

  /* ----- définitions ----- */
  defStmt('py_def', {
    init: function () {
      this.ret_ = null;
      this.appendDummyInput('HEAD').appendField(T('définir')).appendField(txt('ma_fonction'), 'NAME').appendField('(').appendField(txt(''), 'ARGS').appendField(')');
      this.appendStatementInput('DO').setCheck('Action');
    },
    save: function () { return this.ret_ !== null ? { ret: this.ret_ } : {}; },
    load: function (st) {
      this.ret_ = st.ret === undefined ? null : st.ret;
      if (this.getField('RET')) this.getInput('HEAD').removeField('RET');
      if (this.ret_ !== null) this.getInput('HEAD').appendField('→ ' + this.ret_, 'RET');
    },
    gen: function (b) {
      return headLine(b, 'def ' + b.getFieldValue('NAME') + '(' + tx(b.getFieldValue('ARGS')) + ')' + (b.ret_ !== null ? ' -> ' + tx(b.ret_) : '') + ':', 'DO');
    }
  });
  defStmt('py_class', {
    init: function () {
      this.appendDummyInput().appendField(T('classe')).appendField(txt('MaClasse'), 'NAME').appendField('(').appendField(txt(''), 'BASES').appendField(')');
      this.appendStatementInput('DO').setCheck('Action');
    },
    gen: function (b) { var bs = String(b.getFieldValue('BASES')).trim(); return headLine(b, 'class ' + b.getFieldValue('NAME') + (bs ? '(' + tx(bs) + ')' : '') + ':', 'DO'); }
  });

  /* ----- si / sinon si / sinon ----- */
  defStmt('py_if', {
    init: function () { this.n_ = 0; this.e_ = false; this.appendValueInput('C0').appendField(T('si')); this.appendStatementInput('DO0').setCheck('Action').appendField(T('alors')); },
    save: function () { var s = {}; if (this.n_) s.n = this.n_; if (this.e_) s.e = true; return s; },
    load: function (st) { this.setShape_(st.n || 0, !!st.e); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter « sinon si »', function () { mutate(b, function () { b.setShape_(b.n_ + 1, b.e_); }); }));
      if (!b.e_) opts.push(item('➕ Ajouter « sinon »', function () { mutate(b, function () { b.setShape_(b.n_, true); }); }));
      if (b.n_) opts.push(item('➖ Retirer le dernier « sinon si »', function () { mutate(b, function () { b.setShape_(b.n_ - 1, b.e_); }); }));
      if (b.e_) opts.push(item('➖ Retirer « sinon »', function () { mutate(b, function () { b.setShape_(b.n_, false); }); }));
    },
    gen: function (b) {
      var code = headLine(b, 'if ' + val(b, 'C0', 0) + ':', 'DO0');
      for (var i = 1; i <= b.n_; i++) code += clauseLine(b, 'e' + i, 'elif ' + val(b, 'C' + i, 0) + ':', 'DO' + i);
      if (b.e_) code += clauseLine(b, 'el', 'else:', 'ELSE');
      return code;
    }
  });
  Blockly.Blocks.py_if.setShape_ = function (n, e) {
    var i;
    for (i = n + 1; this.getInput('C' + i); i++) { rm(this, 'C' + i); rm(this, 'DO' + i); }
    if (!e) rm(this, 'ELSE');
    for (i = 1; i <= n; i++) {
      if (!this.getInput('C' + i)) {
        this.appendValueInput('C' + i).appendField(T('sinon si'));
        this.appendStatementInput('DO' + i).setCheck('Action').appendField(T('alors'));
        if (this.getInput('ELSE')) { this.moveInputBefore('C' + i, 'ELSE'); this.moveInputBefore('DO' + i, 'ELSE'); }
      }
    }
    if (e && !this.getInput('ELSE')) this.appendStatementInput('ELSE').setCheck('Action').appendField(T('sinon'));
    this.n_ = n; this.e_ = e;
  };

  /* ----- boucles ----- */
  function elseShape(b, e) { if (e && !b.getInput('ELSE')) b.appendStatementInput('ELSE').setCheck('Action').appendField(T('sinon (boucle finie)')); if (!e) rm(b, 'ELSE'); b.e_ = e; }
  function elseMenu(opts) { var b = this; opts.push(item(b.e_ ? '➖ Retirer « sinon »' : '➕ Ajouter « sinon » (rare)', function () { mutate(b, function () { elseShape(b, !b.e_); }); })); }
  defStmt('py_for', {
    init: function () { this.e_ = false; this.appendValueInput('ITER').appendField(T('pour')).appendField(pill('x', 'var'), 'T').appendField(T('dans')); this.appendStatementInput('DO').setCheck('Action').appendField(T('faire')); },
    save: function () { return this.e_ ? { e: true } : {}; }, load: function (st) { elseShape(this, !!st.e); }, menu: elseMenu,
    gen: function (b) { return headLine(b, 'for ' + tx(b.getFieldValue('T')) + ' in ' + val(b, 'ITER', 0) + ':', 'DO') + (b.e_ ? clauseLine(b, 'el', 'else:', 'ELSE') : ''); }
  });
  defStmt('py_while', {
    init: function () { this.e_ = false; this.appendValueInput('C').appendField(T('tant que')); this.appendStatementInput('DO').setCheck('Action').appendField(T('faire')); },
    save: function () { return this.e_ ? { e: true } : {}; }, load: function (st) { elseShape(this, !!st.e); }, menu: elseMenu,
    gen: function (b) { return headLine(b, 'while ' + val(b, 'C', 0) + ':', 'DO') + (b.e_ ? clauseLine(b, 'el', 'else:', 'ELSE') : ''); }
  });

  /* ----- essayer ----- */
  defStmt('py_try', {
    init: function () { this.n_ = 0; this.e_ = false; this.f_ = false; this.appendStatementInput('DO').setCheck('Action').appendField(T('essayer')); this.setShape_(1, false, false); },
    save: function () { var s = { n: this.n_ }; if (this.e_) s.e = true; if (this.f_) s.f = true; return s; },
    load: function (st) { this.setShape_(st.n === undefined ? 1 : st.n, !!st.e, !!st.f); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter un cas d\'erreur', function () { mutate(b, function () { b.setShape_(b.n_ + 1, b.e_, b.f_); }); }));
      if (b.n_) opts.push(item('➖ Retirer le dernier cas d\'erreur', function () { mutate(b, function () { b.setShape_(b.n_ - 1, b.e_, b.f_); }); }));
      opts.push(item(b.e_ ? '➖ Retirer « sinon »' : '➕ Ajouter « sinon (aucune erreur) »', function () { mutate(b, function () { b.setShape_(b.n_, !b.e_, b.f_); }); }));
      opts.push(item(b.f_ ? '➖ Retirer « à la fin »' : '➕ Ajouter « à la fin (toujours) »', function () { mutate(b, function () { b.setShape_(b.n_, b.e_, !b.f_); }); }));
    },
    gen: function (b) {
      var code = headLine(b, 'try:', 'DO');
      for (var i = 0; i < b.n_; i++) {
        var t = String(b.getFieldValue('T' + i) || '').trim(), nm = String(b.getFieldValue('N' + i) || '').trim();
        code += clauseLine(b, 'h' + i, 'except' + (t ? ' ' + tx(t) + (nm ? ' as ' + nm : '') : '') + ':', 'H' + i);
      }
      if (!b.n_ && !b.f_) code += hint('H') + 'except Exception:\n' + IND + hint('S') + 'pass\n';
      if (b.e_) code += clauseLine(b, 'el', 'else:', 'ELSE');
      if (b.f_) code += clauseLine(b, 'fi', 'finally:', 'FIN');
      return code;
    }
  });
  Blockly.Blocks.py_try.setShape_ = function (n, e, f) {
    var i;
    for (i = n; this.getInput('R' + i); i++) { rm(this, 'R' + i); rm(this, 'H' + i); }
    if (!e) rm(this, 'ELSE');
    if (!f) rm(this, 'FIN');
    for (i = 0; i < n; i++) {
      if (!this.getInput('R' + i)) {
        this.appendDummyInput('R' + i).appendField(T('si erreur')).appendField(txt(i === 0 && !this.n_ && !this.getInput('H0') ? 'Exception' : ''), 'T' + i).appendField(T('nommée')).appendField(txt(''), 'N' + i);
        this.appendStatementInput('H' + i).setCheck('Action');
      }
    }
    if (e && !this.getInput('ELSE')) this.appendStatementInput('ELSE').setCheck('Action').appendField(T('sinon (aucune erreur)'));
    if (f && !this.getInput('FIN')) this.appendStatementInput('FIN').setCheck('Action').appendField(T('à la fin (toujours)'));
    var ref = this.getInput('ELSE') ? 'ELSE' : (this.getInput('FIN') ? 'FIN' : null);
    if (ref) for (i = 0; i < n; i++) { this.moveInputBefore('R' + i, ref); this.moveInputBefore('H' + i, ref); }
    if (this.getInput('ELSE') && this.getInput('FIN')) this.moveInputBefore('ELSE', 'FIN');
    this.n_ = n; this.e_ = e; this.f_ = f;
  };

  /* ----- avec ----- */
  defStmt('py_with', {
    init: function () { this.n_ = 0; this.appendStatementInput('DO').setCheck('Action'); this.setShape_(1); this.setInputsInline(true); },
    save: function () { return { n: this.n_ }; },
    load: function (st) { this.setShape_(st.n || 1); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter une ressource', function () { mutate(b, function () { b.setShape_(b.n_ + 1); }); }));
      if (b.n_ > 1) opts.push(item('➖ Retirer la dernière ressource', function () { mutate(b, function () { b.setShape_(b.n_ - 1); }); }));
    },
    gen: function (b) {
      var items = [];
      for (var i = 0; i < b.n_; i++) { var v = String(b.getFieldValue('V' + i) || '').trim(); items.push(val(b, 'E' + i, 1) + (v ? ' as ' + tx(v) : '')); }
      return headLine(b, 'with ' + items.join(', ') + ':', 'DO');
    }
  });
  Blockly.Blocks.py_with.setShape_ = function (n) {
    var i;
    for (i = n; this.getInput('E' + i); i++) { rm(this, 'E' + i); rm(this, 'AS' + i); }
    for (i = 0; i < n; i++) {
      if (!this.getInput('E' + i)) {
        this.appendValueInput('E' + i).appendField(i === 0 ? 'avec' : ',');
        this.appendDummyInput('AS' + i).appendField(T('comme')).appendField(pill('', 'var'), 'V' + i);
        this.moveInputBefore('E' + i, 'DO'); this.moveInputBefore('AS' + i, 'DO');
      }
    }
    this.n_ = n;
  };

  /* ----- appels de fonction ----- */
  function callLook(b, func) {
    var isPdb = /^pdb\./.test(func || '');
    var sig = isPdb ? GA.SIGS && GA.SIGS[func.slice(4)] : null;
    var ext = b.a_.length > 3;
    b.setInputsInline(!ext);
    if (b.f_) b.setStyle('cat_pycall'); else b.setStyle(isPdb ? 'cat_pypdb' : 'cat_pycall');
    b.a_.forEach(function (k, i) {
      var f = b.getField('L' + i);
      if (!f) return;
      var lab = '';
      if (k.indexOf('k:') === 0) lab = (!ext && i ? ', ' : '') + k.slice(2) + ' =';
      else if (k === '*' || k === '**') lab = (!ext && i ? ', ' : '') + k;
      else if (ext && sig && sig[4][i]) lab = sig[4][i][0];
      else if (ext && func === 'register' && REGISTER_ARGS[i]) lab = T(REGISTER_ARGS[i]);
      else if (!ext && i) lab = ',';
      f.setValue(lab);
    });
    var ff = b.getField('FUNC');
    if (ff && ff.fieldGroup_) Blockly.utils.dom[isPdb ? 'addClass' : 'removeClass'](ff.fieldGroup_, 'gcbPill-pdb');
  }
  function funcHead(b) {
    var ff = pill('fonction', 'func');
    ff.setValidator(function (v) { callLookSoon(b, v); return v; });
    b.appendDummyInput('HEAD')
      .appendField(new Blockly.FieldImage(PICK_SVG, 18, 18, T('choisir une fonction'), function () { if (GA.onPickProc) GA.onPickProc(b); }), 'ICON')
      .appendField(ff, 'FUNC').appendField('(');
  }
  var callDef = {
    init: function () {
      this.a_ = []; this.f_ = false;
      funcHead(this);
      this.appendDummyInput('END').appendField(')');
      this.setInputsInline(true);
    },
    save: function () { var s = { a: this.a_.slice() }; if (this.f_) s.f = true; if (this.w_ !== undefined) s.w = this.w_; if (this.t_) s.tc = 1; return s; },
    load: function (st) { this.w_ = st.w; this.t_ = st.tc ? 1 : 0; this.setShape_(st.a || [], !!st.f); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter un argument', function () { mutate(b, function () { b.setShape_(b.a_.concat(['p']), b.f_); }); }));
      opts.push(item('➕ Ajouter un argument nommé…', function () {
        Blockly.dialog.prompt('Nom de l\'argument (ex. menu)', '', function (name) {
          name = String(name || '').trim();
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return;
          mutate(b, function () { b.setShape_(b.a_.concat(['k:' + name]), b.f_); });
        });
      }));
      if (b.a_.length) opts.push(item('➖ Retirer le dernier argument', function () { mutate(b, function () { b.setShape_(b.a_.slice(0, -1), b.f_); }); }));
    }
  };
  function callLookSoon(b, v) { b.func_ = v; if (b.a_) callLook(b, v); }
  function setCallShape(a, f) {
    var i;
    if (f !== this.f_) {
      if (f) { rm(this, 'HEAD'); this.appendValueInput('F'); this.appendDummyInput('OPEN').appendField('('); }
      else {
        rm(this, 'F'); rm(this, 'OPEN');
        funcHead(this);
      }
    }
    for (i = a.length; this.getInput('A' + i); i++) rm(this, 'A' + i);
    for (i = 0; i < a.length; i++) if (!this.getInput('A' + i)) this.appendValueInput('A' + i).appendField('', 'L' + i);
    rm(this, 'END');
    this.appendDummyInput('END').appendField(')');
    this.a_ = a.slice(); this.f_ = f;
    callLook(this, f ? '' : this.getFieldValue('FUNC'));
  }
  function callCode(b) {
    var func = b.f_ ? val(b, 'F', 16) : tx(b.getFieldValue('FUNC'));
    var args = b.a_.map(function (k, i) {
      var c = val(b, 'A' + i, 1);
      if (k.indexOf('k:') === 0) return k.slice(2) + '=' + c;
      if (k === '*' || k === '**') return k + c;
      return c;
    });
    return func + PY.seq('(', args, ')', false, b.w_ === undefined ? undefined : !!b.w_, !!b.t_);
  }
  defStmt('py_callst', { style: 'cat_pycall', init: callDef.init, save: callDef.save, load: callDef.load, menu: callDef.menu, gen: function (b) { return stmtLine(b, callCode(b)); } });
  defVal('py_call', { style: 'cat_pycall', init: callDef.init, save: callDef.save, load: callDef.load, menu: callDef.menu, gen: function (b) { return [callCode(b), PY.ordOf(16)]; } });
  Blockly.Blocks.py_callst.setShape_ = setCallShape;
  Blockly.Blocks.py_call.setShape_ = setCallShape;

  /* choisir une fonction de la PDB dans un bloc d'appel : les cases manquantes sont ajoutées et pré-remplies */
  function argDefault(a) {
    var k = a[1];
    if (a[4]) return { type: 'py_leaf', fields: { CODE: 'None' } };   // argument facultatif (ex. parent)
    if (k === 'image') return { type: 'py_var', fields: { NAME: 'image' } };
    if (k === 'drawable' || k === 'layer' || k === 'item') return { type: 'py_var', fields: { NAME: 'drawable' } };
    var code = 'None';
    if (/^(int32|int16|int8|count|unit)$/.test(k)) code = '0';
    else if (k === 'float') code = '0.0';
    else if (k === 'string') code = '""';
    else if (k === 'boolean') code = 'False';
    else if (k === 'color') code = '(0, 0, 0)';
    else if (/array$/.test(k)) code = '[]';
    else if (k === 'enum') { var o = GA.enumOptions ? GA.enumOptions(a) : []; code = o.length ? o[0][1] : '0'; }
    return { type: 'py_leaf', fields: { CODE: code } };
  }
  GA.pyApplyProc = function (b, py) {
    var sig = GA.SIGS && GA.SIGS[py];
    if (!sig || b.f_) return;
    Blockly.Events.setGroup(true);
    try {
      b.setFieldValue('pdb.' + py, 'FUNC');
      if (b.a_.some(function (k) { return k !== 'p'; })) return;   // arguments nommés ou * : on ne touche à rien
      var n = sig[4].length, keep = b.a_.length;
      while (keep > n && !b.getInputTargetBlock('A' + (keep - 1))) keep--;
      var shape = []; for (var i = 0; i < Math.max(n, keep); i++) shape.push('p');
      if (shape.length !== b.a_.length) mutate(b, function () { b.setShape_(shape, false); });
      sig[4].forEach(function (a, j) {
        var inp = b.getInput('A' + j);
        if (!inp || inp.connection.targetBlock()) return;
        var child = Blockly.serialization.blocks.append(argDefault(a), b.workspace);
        inp.connection.connect(child.outputConnection);
      });
    } finally { Blockly.Events.setGroup(false); }
  };

  /* ----- valeurs ----- */
  /* NOM_EN_MAJUSCULES (FILL_WHITE, NORMAL_MODE…) = constante de GIMP : pastille violette */
  GA.isPyConst = function (n) { return /^[A-Z][A-Z0-9_]*$/.test(n || '') && /[A-Z]{2}/.test(n); };
  defVal('py_var', { style: 'cat_pyvar', init: function () {
      var self = this, f = pill('x', 'var');
      f.setValidator(function (v) { self.setStyle(GA.isPyConst(v) ? 'cat_pyconst' : 'cat_pyvar'); return v; });
      this.appendDummyInput().appendField(f, 'NAME');
    },
    gen: function (b) { return [String(b.getFieldValue('NAME')), 0]; } });
  defVal('py_leaf', { style: 'cat_pyleaf', init: function () { this.appendDummyInput().appendField(new LeafField('0'), 'CODE'); },
    gen: function (b) { var t = String(b.getFieldValue('CODE')); return [tx(t), leafOrd(t)]; } });
  var BINOPS = ['+', '-', '*', '/', '//', '%', '**', '<<', '>>', '|', '^', '&', '@'];
  defVal('py_binop', { init: function () { this.appendValueInput('A'); this.appendValueInput('B').appendField(new Blockly.FieldDropdown(BINOPS.map(function (o) { return [o, o]; })), 'OP'); },
    gen: function (b) {
      var op = b.getFieldValue('OP'), p = PREC_BIN[op];
      if (op === '**') return [val(b, 'A', 15) + ' ** ' + val(b, 'B', 13), PY.ordOf(14)];
      return [val(b, 'A', p) + ' ' + op + ' ' + val(b, 'B', p + 1), PY.ordOf(p)];
    } });
  defVal('py_unary', { init: function () { this.appendValueInput('A').appendField(new Blockly.FieldDropdown([[T('non'), 'not'], ['−', '-'], ['+', '+'], ['~', '~']]), 'OP'); },
    gen: function (b) { var op = b.getFieldValue('OP'); return op === 'not' ? ['not ' + val(b, 'A', 5), PY.ordOf(5)] : [op + val(b, 'A', 13), PY.ordOf(13)]; } });
  defVal('py_boolop', {
    init: function () { this.op_ = 'and'; this.n_ = 0; this.setShape_('and', 2); },
    save: function () { return { op: this.op_, n: this.n_ }; },
    load: function (st) { this.setShape_(st.op || 'and', st.n || 2); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter une condition', function () { mutate(b, function () { b.setShape_(b.op_, b.n_ + 1); }); }));
      if (b.n_ > 2) opts.push(item('➖ Retirer la dernière condition', function () { mutate(b, function () { b.setShape_(b.op_, b.n_ - 1); }); }));
      opts.push(item(b.op_ === 'and' ? 'Changer en « ou »' : 'Changer en « et »', function () { mutate(b, function () { b.setShape_(b.op_ === 'and' ? 'or' : 'and', b.n_); }); }));
    },
    gen: function (b) {
      var p = b.op_ === 'and' ? 5 : 4, vs = [];
      for (var i = 0; i < b.n_; i++) vs.push(val(b, 'V' + i, p));
      return [vs.join(' ' + b.op_ + ' '), PY.ordOf(b.op_ === 'and' ? 4 : 3)];
    }
  });
  Blockly.Blocks.py_boolop.setShape_ = function (op, n) {
    var i;
    for (i = n; this.getInput('V' + i); i++) rm(this, 'V' + i);
    for (i = 0; i < n; i++) if (!this.getInput('V' + i)) this.appendValueInput('V' + i).appendField(i ? '' : '', 'W' + i);
    for (i = 1; i < n; i++) this.getField('W' + i).setValue(T(op === 'and' ? 'et' : 'ou'));
    this.op_ = op; this.n_ = n;
  };
  var CMPS = [['==', '=='], ['!=', '!='], ['<', '<'], ['<=', '<='], ['>', '>'], ['>=', '>='], [T('dans'), 'in'], [T('pas dans'), 'not in'], [T('est'), 'is'], [T('n\'est pas'), 'is not']];
  defVal('py_compare', {
    init: function () { this.n_ = 0; this.appendValueInput('V0'); this.setShape_(1); },
    save: function () { return { n: this.n_ }; },
    load: function (st) { this.setShape_(st.n || 1); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter une comparaison enchaînée', function () { mutate(b, function () { b.setShape_(b.n_ + 1); }); }));
      if (b.n_ > 1) opts.push(item('➖ Retirer la dernière comparaison', function () { mutate(b, function () { b.setShape_(b.n_ - 1); }); }));
    },
    gen: function (b) {
      var code = val(b, 'V0', 7);
      for (var i = 1; i <= b.n_; i++) code += ' ' + b.getFieldValue('OP' + i) + ' ' + val(b, 'V' + i, 7);
      return [code, PY.ordOf(6)];
    }
  });
  Blockly.Blocks.py_compare.setShape_ = function (n) {
    var i;
    for (i = n + 1; this.getInput('V' + i); i++) rm(this, 'V' + i);
    for (i = 1; i <= n; i++) if (!this.getInput('V' + i)) this.appendValueInput('V' + i).appendField(new Blockly.FieldDropdown(CMPS), 'OP' + i);
    this.n_ = n;
  };
  defVal('py_paren', { init: function () { this.appendValueInput('V').appendField('('); this.appendDummyInput().appendField(')'); },
    gen: function (b) { return ['(' + (G.valueToCode(b, 'V', 99) || 'None') + ')', 0]; } });
  defVal('py_ifexp', { init: function () { this.appendValueInput('A'); this.appendValueInput('C').appendField(T('si')); this.appendValueInput('B').appendField(T('sinon')); },
    gen: function (b) { return [val(b, 'A', 3) + ' if ' + val(b, 'C', 3) + ' else ' + val(b, 'B', 2), PY.ordOf(2)]; } });
  defVal('py_attr', { init: function () { this.appendValueInput('V'); this.appendDummyInput().appendField('.').appendField(pill('attribut', 'attr'), 'NAME'); },
    gen: function (b) { return [val(b, 'V', 16) + '.' + b.getFieldValue('NAME'), PY.ordOf(16)]; } });
  defVal('py_index', { init: function () { this.appendValueInput('V'); this.appendValueInput('I').appendField('['); this.appendDummyInput().appendField(']'); },
    gen: function (b) { return [val(b, 'V', 16) + '[' + (has(b, 'I') ? G.valueToCode(b, 'I', 99) : '0') + ']', PY.ordOf(16)]; } });
  defVal('py_slice', {
    init: function () { this.s_ = false; this.appendValueInput('L'); this.appendValueInput('U').appendField(':'); },
    save: function () { return { s: this.s_ }; },
    load: function (st) { this.s_ = !!st.s; if (this.s_ && !this.getInput('S')) this.appendValueInput('S').appendField(':'); if (!this.s_) rm(this, 'S'); },
    menu: function (opts) { var b = this; opts.push(item(b.s_ ? '➖ Retirer le pas' : '➕ Ajouter un pas', function () { mutate(b, function () { b.loadExtraState({ s: !b.s_ }); }); })); },
    gen: function (b) {
      function part(n) { return has(b, n) ? val(b, n, 1) : ''; }
      return [part('L') + ':' + part('U') + (b.s_ ? ':' + part('S') : ''), 99];
    }
  });
  defVal('py_list', {
    init: function () { this.k_ = 'list'; this.n_ = 0; this.appendDummyInput('OPEN').appendField('[', 'O'); this.appendDummyInput('END').appendField(']', 'C'); this.setShape_('list', 2); },
    save: function () { var s = { k: this.k_, n: this.n_ }; if (this.w_ !== undefined) s.w = this.w_; if (this.t_) s.tc = 1; return s; },
    load: function (st) { this.w_ = st.w; this.t_ = st.tc ? 1 : 0; this.setShape_(st.k || 'list', st.n === undefined ? 2 : st.n); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter un élément', function () { mutate(b, function () { b.setShape_(b.k_, b.n_ + 1); }); }));
      if (b.n_) opts.push(item('➖ Retirer le dernier élément', function () { mutate(b, function () { b.setShape_(b.k_, b.n_ - 1); }); }));
      opts.push(item(b.k_ === 'list' ? 'Changer en tuple ( )' : 'Changer en liste [ ]', function () { mutate(b, function () { b.setShape_(b.k_ === 'list' ? 'ptuple' : 'list', b.n_); }); }));
    },
    gen: function (b) {
      var items = [];
      for (var i = 0; i < b.n_; i++) items.push(val(b, 'E' + i, 1));
      var w = b.w_ === undefined ? undefined : !!b.w_;
      if (b.k_ === 'list') return [PY.seq('[', items, ']', false, w, !!b.t_), 0];
      if (b.k_ === 'ptuple') return [items.length ? PY.seq('(', items, ')', items.length === 1, w, !!b.t_) : '()', 0];
      if (!items.length) return ['()', 0];
      return [items.join(', ') + (items.length === 1 ? ',' : ''), 17];
    }
  });
  Blockly.Blocks.py_list.setShape_ = function (k, n) {
    var i;
    for (i = n; this.getInput('E' + i); i++) rm(this, 'E' + i);
    for (i = 0; i < n; i++) if (!this.getInput('E' + i)) { this.appendValueInput('E' + i).appendField(i ? ',' : ''); this.moveInputBefore('E' + i, 'END'); }
    this.getField('O').setValue(k === 'list' ? '[' : (k === 'ptuple' ? '(' : ''));
    this.getField('C').setValue(k === 'list' ? ']' : (k === 'ptuple' ? ')' : (n === 1 ? ',' : '')));
    this.k_ = k; this.n_ = n;
  };
  defVal('py_dict', {
    init: function () { this.n_ = 0; this.d_ = []; this.appendDummyInput('OPEN').appendField('{'); this.appendDummyInput('END').appendField('}'); this.setShape_(1, []); },
    save: function () { var s = { n: this.n_, d: this.d_.slice() }; if (this.w_ !== undefined) s.w = this.w_; if (this.t_) s.tc = 1; return s; },
    load: function (st) { this.w_ = st.w; this.t_ = st.tc ? 1 : 0; this.setShape_(st.n === undefined ? 1 : st.n, st.d || []); },
    menu: function (opts) {
      var b = this;
      opts.push(item('➕ Ajouter une paire clé : valeur', function () { mutate(b, function () { b.setShape_(b.n_ + 1, b.d_); }); }));
      if (b.n_) opts.push(item('➖ Retirer la dernière paire', function () { mutate(b, function () { b.setShape_(b.n_ - 1, b.d_.filter(function (x) { return x < b.n_ - 1; })); }); }));
    },
    gen: function (b) {
      var items = [];
      for (var i = 0; i < b.n_; i++) items.push(b.d_.indexOf(i) >= 0 ? '**' + val(b, 'V' + i, 7) : val(b, 'K' + i, 1) + ': ' + val(b, 'V' + i, 1));
      return [PY.seq('{', items, '}', false, this.w_ === undefined ? undefined : !!this.w_, !!this.t_), 0];
    }
  });
  Blockly.Blocks.py_dict.setShape_ = function (n, d) {
    var i;
    for (i = n; this.getInput('V' + i); i++) { rm(this, 'K' + i); rm(this, 'V' + i); }
    for (i = 0; i < n; i++) {
      if (this.getInput('V' + i)) continue;
      if (d.indexOf(i) >= 0) this.appendValueInput('V' + i).appendField((i ? ', ' : '') + '**');
      else { this.appendValueInput('K' + i).appendField(i ? ',' : ''); this.appendValueInput('V' + i).appendField(':'); this.moveInputBefore('K' + i, 'END'); }
      this.moveInputBefore('V' + i, 'END');
    }
    this.n_ = n; this.d_ = d.slice();
  };
  if (GA.pyVarsInit) GA.pyVarsInit();
};
})(typeof window !== 'undefined' ? window : globalThis);
