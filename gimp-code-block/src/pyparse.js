/* Atelier — analyseur et imprimeur Python 2.7 (+ Python 3 courant), fidèles au code d'origine */
(function (root) {
'use strict';
var GA = root.GA = root.GA || { defs: [], exampleDefs: [] };
var PY = GA.py = {};
var IND = '    ';
var NL = '\n\u0000';            // retour à la ligne À L'INTÉRIEUR d'une chaîne : ne jamais indenter la suite
PY.MAXW = 88;

function PyError(msg, line, col) { var e = new Error(msg); e.pyLine = line; e.pyCol = col; e.isPy = true; return e; }
PY.PyError = PyError;

/* ================= LEXER ================= */
var OPS3 = ['**=', '//=', '>>=', '<<=', '...'];
var OPS2 = ['**', '//', '<<', '>>', '<=', '>=', '==', '!=', '<>', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '->', '@=', ':='];
var OPS1 = '+-*/%&|^~<>()[]{},:.;@=`';
var STRPFX = /^(?:[uUbBfF]?[rR]?|[rR][bBfF]|[uU][rR]|[bB][rR]|[fF][rR])$/;
var NUMRE = /^(?:0[xX][0-9a-fA-F_]+[lL]?|0[oO][0-7_]+[lL]?|0[bB][01_]+[lL]?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?[jJlL]?)/;
var IDRE = /^[A-Za-z_\u00C0-\uFFFF][A-Za-z0-9_\u00C0-\uFFFF]*/;

PY.tokenize = function (src) {
  var toks = [], stack = [0], depth = 0, pend = [], blank = 0, blankL = [];
  var pos = 0, line = 1, n = src.length, lineStart = 0, atLineStart = true, lineHasTok = false, cont = false;
  function push(t, v, l, c, extra) { var tk = { t: t, v: v, line: l, col: c }; if (extra) for (var k in extra) tk[k] = extra[k]; toks.push(tk); return tk; }
  function colOf(s) { var c = 0; for (var i = 0; i < s.length; i++) { var ch = s[i]; if (ch === ' ') c++; else if (ch === '\t') c = (Math.floor(c / 8) + 1) * 8; else if (ch === '\f') c = 0; } return c; }
  function flushComments(col) {
    pend.forEach(function (c) {
      while (stack[stack.length - 1] > col && stack[stack.length - 1] > c.col) { stack.pop(); push('DEDENT', '', c.line, 0); }
      push('CLINE', c.text, c.line, c.col, { blank: c.blank, bl: c.bl, ind: c.ind });
    });
    pend = [];
  }
  while (pos <= n) {
    if (atLineStart && depth === 0 && !cont) {
      var m = /^[ \t\f]*/.exec(src.slice(pos, pos + 400));
      var ws = m[0], p2 = pos + ws.length, ch0 = src[p2];
      if (p2 >= n) break;
      if (ch0 === '\n' || ch0 === '\r') { blank++; blankL.push(ws); pos = p2 + 1; line++; lineStart = pos; continue; }
      if (ch0 === '#') {
        var e = src.indexOf('\n', p2); if (e < 0) e = n;
        pend.push({ text: src.slice(p2 + 1, e).replace(/\r$/, ''), col: colOf(ws), blank: blank, bl: blankL, ind: ws, line: line });
        blank = 0; blankL = []; pos = e + 1; line++; lineStart = pos; continue;
      }
      var col = colOf(ws);
      if (col > stack[stack.length - 1]) { stack.push(col); push('INDENT', '', line, col); pend.forEach(function (c) { push('CLINE', c.text, c.line, c.col, { blank: c.blank, bl: c.bl, ind: c.ind }); }); pend = []; }
      else {
        flushComments(col);
        while (stack[stack.length - 1] > col) { stack.pop(); push('DEDENT', '', line, col); }
        if (stack[stack.length - 1] !== col) throw PyError('Indentation incohérente (le retrait ne correspond à aucun niveau au-dessus)', line, col);
      }
      pos = p2; atLineStart = false; lineHasTok = false;
      toks.firstBlank = blank;
      var startBlank = blank, startBL = blankL; blank = 0; blankL = [];
      // marquer le premier jeton de la ligne logique
      var mark = toks.length;
      scanLine();
      if (toks[mark]) { toks[mark].blank = startBlank; toks[mark].bl = startBL; toks[mark].ind = ws; }
      continue;
    }
    if (pos >= n) break;
    scanLine();
  }
  if (lineHasTok || (toks.length && toks[toks.length - 1].t !== 'NEWLINE' && toks[toks.length - 1].t !== 'DEDENT' && toks[toks.length - 1].t !== 'INDENT' && toks[toks.length - 1].t !== 'CLINE')) {
    if (depth > 0) throw PyError('Parenthèse, crochet ou accolade jamais refermé', line, 0);
    if (toks.length && toks[toks.length - 1].t !== 'NEWLINE') push('NEWLINE', '', line, 0);
  }
  flushComments(0);
  while (stack.length > 1) { stack.pop(); push('DEDENT', '', line, 0); }
  push('EOF', '', line, 0);
  return toks;

  function scanLine() {
    cont = false;
    while (pos < n) {
      var c = src[pos];
      if (c === ' ' || c === '\t' || c === '\f' || c === '\r') { pos++; continue; }
      var col = pos - lineStart;
      if (c === '\n') {
        pos++; line++; lineStart = pos;
        if (depth === 0) { if (lineHasTok) push('NEWLINE', '', line - 1, col); lineHasTok = false; atLineStart = true; cont = false; return; }
        continue;
      }
      if (c === '\\' && (src[pos + 1] === '\n' || (src[pos + 1] === '\r' && src[pos + 2] === '\n'))) {
        pos += src[pos + 1] === '\r' ? 3 : 2; line++; lineStart = pos; cont = true; continue;
      }
      if (c === '#') {
        var e = src.indexOf('\n', pos); if (e < 0) e = n;
        push('COMMENT', src.slice(pos + 1, e).replace(/\r$/, ''), line, col, { p: pos, e: e });
        pos = e; continue;
      }
      var rest = src.slice(pos, pos + 3);
      var id = IDRE.exec(src.slice(pos, pos + 200));
      if (id) {
        var w = id[0], q = src[pos + w.length];
        if ((q === '"' || q === "'") && STRPFX.test(w)) { scanString(pos, pos + w.length, col); continue; }
        push('NAME', w, line, col, { p: pos, e: pos + w.length }); pos += w.length; lineHasTok = true; continue;
      }
      if (c === '"' || c === "'") { scanString(pos, pos, col); continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[pos + 1] || ''))) {
        var nm = NUMRE.exec(src.slice(pos, pos + 100));
        push('NUMBER', nm[0], line, col, { p: pos, e: pos + nm[0].length }); pos += nm[0].length; lineHasTok = true; continue;
      }
      var op = null;
      if (OPS3.indexOf(rest) >= 0) op = rest;
      else if (OPS2.indexOf(rest.slice(0, 2)) >= 0) op = rest.slice(0, 2);
      else if (OPS1.indexOf(c) >= 0) op = c;
      if (op) {
        if ('([{'.indexOf(op) >= 0) depth++;
        if (')]}'.indexOf(op) >= 0) { depth--; if (depth < 0) throw PyError('Fermeture « ' + op + ' » sans ouverture', line, col); }
        push('OP', op, line, col, { p: pos, e: pos + op.length }); pos += op.length; lineHasTok = true; continue;
      }
      throw PyError('Caractère inattendu « ' + c + ' »', line, col);
    }
  }
  function scanString(start, qpos, col) {
    var q = src[qpos], triple = src.substr(qpos, 3) === q + q + q, i = qpos + (triple ? 3 : 1), sl = line;
    for (;;) {
      if (i >= n) throw PyError('Texte entre guillemets jamais refermé', sl, col);
      var ch = src[i];
      if (ch === '\\') { if (src[i + 1] === '\n') { line++; lineStart = i + 2; } i += 2; continue; }
      if (ch === '\n') { if (!triple) throw PyError('Texte entre guillemets non refermé en fin de ligne', line, col); line++; lineStart = i + 1; i++; continue; }
      if (triple ? src.substr(i, 3) === q + q + q : ch === q) { i += triple ? 3 : 1; break; }
      i++;
    }
    push('STRING', src.slice(start, i).replace(/\r\n/g, '\n'), sl, col, { p: start, e: i });
    pos = i; lineHasTok = true;
  }
};

/* ================= PARSEUR ================= */
var KW2 = 'and as assert break class continue def del elif else except exec finally for from global if import in is lambda not or pass print raise return try while with yield'.split(' ');
var KW3 = 'and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' ');
var AUG = ['+=', '-=', '*=', '/=', '//=', '%=', '**=', '>>=', '<<=', '&=', '|=', '^=', '@='];
var CMP = ['<', '>', '==', '>=', '<=', '<>', '!=', 'in', 'not in', 'is', 'is not'];

function Parser(toks, py3, src) { this.src = src || ''; this.lastTok = null; this.t = toks; this.i = 0; this.py3 = !!py3; this.kw = {}; var s = this; (py3 ? KW3 : KW2).forEach(function (k) { s.kw[k] = true; }); this.com = []; }
var P = Parser.prototype;
P.cur = function () { while (this.t[this.i].t === 'COMMENT') { this.com.push(this.t[this.i]); this.i++; } return this.t[this.i]; };
P.next = function () { var t = this.cur(); this.i++; this.lastTok = t; return t; };
P.isOp = function (v) { var t = this.cur(); return t.t === 'OP' && t.v === v; };
P.isKw = function (v) { var t = this.cur(); return t.t === 'NAME' && t.v === v && this.kw[v]; };
P.acceptOp = function (v) { if (this.isOp(v)) { return this.next(); } return null; };
P.acceptKw = function (v) { if (this.isKw(v)) { return this.next(); } return null; };
P.err = function (msg, t) { t = t || this.cur(); return PyError(msg + (t.t === 'EOF' ? ' (fin du fichier)' : t.v ? ' près de « ' + t.v + ' »' : ''), t.line, t.col); };
P.expectOp = function (v) { if (!this.isOp(v)) throw this.err('« ' + v + ' » attendu'); return this.next(); };
P.expectKw = function (v) { if (!this.isKw(v)) throw this.err('« ' + v + ' » attendu'); return this.next(); };
P.name = function () { var t = this.cur(); if (t.t !== 'NAME' || this.kw[t.v]) throw this.err('Nom attendu'); this.i++; this.lastTok = t; return t.v; };
P.takeComments = function (lastLine) {
  var cs = this.com; this.com = [];
  var inTok = null;
  if (cs.length && cs[cs.length - 1].line === lastLine) inTok = cs.pop();
  return { inline: inTok ? inTok.v : null, inTok: inTok, strayToks: cs };
};
/* mémorise le texte exact d'une ligne (ou d'un en-tête) : espaces, commentaires internes, fin de ligne */
P.keepSource = function (node, startTok, endTok, cm) {
  var src = this.src;
  if (!src || !startTok || !endTok || startTok.p === undefined || endTok.e === undefined) return;
  node.src = src.slice(startTok.p, endTok.e);
  var ic = (cm.strayToks || []).map(function (c) { return c.v; });
  if (ic.length) node.ic = ic;
  if (cm.inTok && cm.inTok.p !== undefined) {
    node.inline = cm.inTok.v;
    var gap = src.slice(endTok.e, cm.inTok.p);
    if (/^[ \t]*$/.test(gap)) node.gap = gap;
  } else {
    var eol = src.indexOf('\n', endTok.e); if (eol < 0) eol = src.length;
    var tr = src.slice(endTok.e, eol);
    if (tr && /^[ \t]+$/.test(tr)) node.t = tr;
  }
};
P.endLine = function () {
  var t = this.cur();
  if (t.t !== 'NEWLINE') throw this.err('Fin de ligne attendue');
  this.i++;
  return t.line;
};
P.file = function () {
  var body = [];
  this.stmts(body, 'EOF');
  return { type: 'Module', body: body };
};
P.stmts = function (body, until) {
  for (;;) {
    var t = this.cur();
    if (t.t === until) return;
    if (t.t === 'EOF') throw this.err('Fin de fichier inattendue');
    this.stmt(body);
  }
};
function cnode(t) { var c = { type: 'Comment', text: t.v, blank: t.blank || 0 }; if (t.bl && t.bl.length) c.bl = t.bl; if (t.ind !== undefined) c.ind = t.ind; return c; }
P.stmt = function (body) {
  var t = this.cur();
  if (t.t === 'CLINE') { this.i++; body.push(cnode(t)); return; }
  if (t.t === 'NEWLINE') { this.i++; return; }
  if (t.t === 'INDENT') throw this.err('Retrait inattendu', t);
  var start = body.length;
  if (t.t === 'NAME' && this.kw[t.v] && /^(if|while|for|try|with|def|class)$/.test(t.v)) this.compound(body);
  else if (t.t === 'OP' && t.v === '@') this.compound(body);
  else if (t.t === 'NAME' && t.v === 'async' && this.py3) throw this.err('async non géré');
  else this.simpleLine(body);
  var f = body[start];
  if (f) {
    f.blank = (f.blank || 0) + (t.blank || 0);
    if (t.bl && t.bl.length) f.bl = t.bl;
    if (t.ind !== undefined) f.ind = t.ind;
  }
};
P.simpleLine = function (body) {
  var spans = [];
  var s0 = this.cur(), nodes = [this.small()];
  spans.push([s0, this.lastTok]);
  for (;;) {
    var semi = this.acceptOp(';');
    if (!semi) break;
    if (this.cur().t === 'NEWLINE') { spans[spans.length - 1][1] = semi; break; }
    s0 = this.cur(); nodes.push(this.small()); spans.push([s0, this.lastTok]);
  }
  var ln = this.endLine();
  var cm = this.takeComments(ln);
  var self = this, last = nodes.length - 1;
  nodes.forEach(function (nd, k) {
    self.keepSource(nd, spans[k][0], spans[k][1], k === last ? cm : {});
    // instruction qui suit un « ; » sur la même ligne : mémoriser le séparateur exact
    if (k > 0 && self.src && spans[k - 1][1].e !== undefined && spans[k][0].p !== undefined) {
      var sep = self.src.slice(spans[k - 1][1].e, spans[k][0].p);
      if (/^[ \t]*;[ \t]*$/.test(sep)) nd.sc = sep;
    }
  });
  nodes.forEach(function (x) { body.push(x); });
};
/* corps d'une instruction composée ; this.sl = séparateur si le corps est sur la même ligne (« if x: return ») */
P.suite = function () {
  var body = [];
  this.sl = undefined;
  if (this.cur().t === 'NEWLINE') {
    this.i++;
    var t = this.cur();
    while (t.t === 'CLINE') { this.i++; body.push(cnode(t)); t = this.cur(); }
    if (t.t !== 'INDENT') throw this.err('Bloc indenté attendu après « : »');
    this.i++;
    this.stmts(body, 'DEDENT');
    this.i++;
  } else {
    var colon = this.lastTok, first = this.cur();
    var sep = this.src && colon && first.p !== undefined ? this.src.slice(colon.e, first.p) : ' ';
    this.simpleLine(body);
    this.sl = /^[ \t]*$/.test(sep) ? sep : ' ';
  }
  return body;
};
/* en-tête principal (if/for/def…) : texte exact + commentaire de fin de ligne */
P.header = function (body, node) {
  var t = this.cur();
  var cm = this.takeComments(t.t === 'NEWLINE' ? t.line : -1);
  this.keepSource(node, this.kwTok, this.lastTok, cm);
  body.push(node);
};
/* en-tête de clause (elif/else/except/finally) */
P.clauseMeta = function (kw) {
  var t = this.cur();
  var meta = {};
  if (kw.blank) meta.blank = kw.blank;
  if (kw.bl && kw.bl.length) meta.bl = kw.bl;
  if (kw.ind !== undefined) meta.ind = kw.ind;
  var cm = this.takeComments(t.t === 'NEWLINE' ? t.line : -1);
  this.keepSource(meta, kw, this.lastTok, cm);
  return meta;
};
/* commentaires placés juste avant une clause : ils restent à la fin du corps précédent */
P.peekClause = function (kws) {
  var j = this.i, cl = [];
  while (this.t[j].t === 'CLINE') { cl.push(this.t[j]); j++; }
  var t = this.t[j];
  if (!cl.length || !(t.t === 'NAME' && kws.indexOf(t.v) >= 0)) return null;
  this.i = j;
  return cl.map(cnode);
};
P.compound = function (body) {
  var decos = [], dmeta = [];
  while (this.isOp('@')) {
    var at = this.next();
    decos.push(this.test());
    var dm = {}; if (at.ind !== undefined) dm.ind = at.ind;
    var ln = this.endLine();
    this.keepSource(dm, at, this.lastTok, this.takeComments(ln));
    dmeta.push(dm);
    var nt = this.cur();
    if (nt.t === 'CLINE') throw this.err('Commentaire entre un décorateur et sa fonction : non géré');
    if (dmeta.length > 1 || true) { if (nt.bl && nt.bl.length) dm.nbl = nt.bl; if (nt.blank) dm.nblank = nt.blank; }
  }
  var t = this.cur(), node;
  this.kwTok = t;
  if (decos.length && !(this.isKw('def') || this.isKw('class'))) throw this.err('« def » ou « class » attendu après un décorateur');
  var self = this;
  function elseInto(owner, key, prevBody) {
    var pre = self.peekClause([key]);
    if (pre) pre.forEach(function (c) { prevBody.push(c); });
    return pre;
  }
  if (this.acceptKw('if')) {
    node = { type: 'If', test: this.namedTest() };
    this.expectOp(':');
    this.header(body, node);
    node.body = this.suite(); node.sl = this.sl;
    var tail = node, tailBody = node.body;
    for (;;) {
      var pre = this.peekClause(['elif', 'else']);
      if (pre) pre.forEach(function (c) { tailBody.push(c); });
      if (this.isKw('elif')) {
        var kw = this.next();
        var el = { type: 'If', test: this.namedTest(), elif: true };
        this.expectOp(':');
        el.meta = this.clauseMeta(kw);
        el.body = this.suite(); el.meta.sl = this.sl;
        tail.orelse = [el]; tail = el; tailBody = el.body;
        continue;
      }
      if (this.isKw('else')) {
        var kw2 = this.next(); this.expectOp(':');
        tail.elseMeta = this.clauseMeta(kw2);
        tail.orelse = this.suite(); tail.elseMeta.sl = this.sl;
      }
      break;
    }
    return;
  }
  if (this.isKw('while') || this.isKw('for')) {
    if (this.acceptKw('while')) node = { type: 'While', test: this.namedTest() };
    else { this.next(); node = { type: 'For', target: this.exprlist() }; this.expectKw('in'); node.iter = this.testlist(); }
    this.expectOp(':'); this.header(body, node); node.body = this.suite(); node.sl = this.sl;
    elseInto(node, 'else', node.body);
    if (this.isKw('else')) { var k3 = this.next(); this.expectOp(':'); node.elseMeta = this.clauseMeta(k3); node.orelse = this.suite(); node.elseMeta.sl = this.sl; }
    return;
  }
  if (this.acceptKw('try')) {
    node = { type: 'Try', handlers: [] }; this.expectOp(':'); this.header(body, node); node.body = this.suite(); node.sl = this.sl;
    var prev = node.body;
    var bt = this.peekClause(['except', 'else', 'finally']); if (bt) bt.forEach(function (c) { prev.push(c); });
    while (this.isKw('except')) {
      var hk = this.next();
      var h = { type: 'Handler', htype: null, name: null };
      if (!this.isOp(':')) {
        h.htype = this.test();
        if (this.acceptKw('as') || this.acceptOp(',')) h.name = this.test();
      }
      this.expectOp(':');
      h.meta = this.clauseMeta(hk);
      h.body = this.suite(); h.meta.sl = this.sl;
      node.handlers.push(h);
      prev = h.body;
      bt = this.peekClause(['except', 'else', 'finally']); if (bt) bt.forEach(function (c) { prev.push(c); });
    }
    if (this.isKw('else')) {
      var ek = this.next(); this.expectOp(':'); node.elseMeta = this.clauseMeta(ek); node.orelse = this.suite(); node.elseMeta.sl = this.sl;
      prev = node.orelse; bt = this.peekClause(['finally']); if (bt) bt.forEach(function (c) { prev.push(c); });
    }
    if (this.isKw('finally')) { var fk = this.next(); this.expectOp(':'); node.finMeta = this.clauseMeta(fk); node.finalbody = this.suite(); node.finMeta.sl = this.sl; }
    if (!node.handlers.length && !node.finalbody) throw this.err('« except » ou « finally » attendu');
    return;
  }
  if (this.acceptKw('with')) {
    node = { type: 'With', items: [] };
    do { var it = { ctx: this.test(), vars: null }; if (this.acceptKw('as')) it.vars = this.expr(); node.items.push(it); } while (this.acceptOp(','));
    this.expectOp(':'); this.header(body, node); node.body = this.suite(); node.sl = this.sl;
    return;
  }
  if (this.acceptKw('def')) {
    node = { type: 'FunctionDef', decorators: decos, decoMeta: dmeta, name: this.name() };
    this.expectOp('('); node.args = this.params(')', true); this.expectOp(')');
    if (this.acceptOp('->')) node.returns = this.test();
    this.expectOp(':'); this.header(body, node); node.body = this.suite(); node.sl = this.sl;
    if (decos.length) { node.kwInd = t.ind; }
    return;
  }
  if (this.acceptKw('class')) {
    node = { type: 'ClassDef', decorators: decos, decoMeta: dmeta, name: this.name(), bases: null };
    if (this.acceptOp('(')) { node.bases = this.isOp(')') ? [] : this.arglist(); this.expectOp(')'); }
    this.expectOp(':'); this.header(body, node); node.body = this.suite(); node.sl = this.sl;
    if (decos.length) { node.kwInd = t.ind; }
    return;
  }
  throw this.err('Instruction inattendue', t);
};
P.params = function (close, allowAnn) {
  var items = [];
  while (!this.isOp(close)) {
    if (this.acceptOp('**')) { var k = { kind: '**', name: this.name() }; if (allowAnn && this.acceptOp(':')) k.ann = this.test(); items.push(k); }
    else if (this.acceptOp('*')) {
      var s = { kind: '*', name: null };
      if (this.cur().t === 'NAME' && !this.kw[this.cur().v]) { s.name = this.name(); if (allowAnn && this.acceptOp(':')) s.ann = this.test(); }
      items.push(s);
    } else {
      var p = { kind: 'p', target: this.fpdef() };
      if (allowAnn && this.acceptOp(':')) p.ann = this.test();
      if (this.acceptOp('=')) p.def = this.test();
      items.push(p);
    }
    if (!this.acceptOp(',')) break;
  }
  return items;
};
P.fpdef = function () {
  if (this.acceptOp('(')) {
    var elts = [this.fpdef()];
    while (this.acceptOp(',')) { if (this.isOp(')')) break; elts.push(this.fpdef()); }
    this.expectOp(')');
    return { type: 'Tuple', elts: elts, one: elts.length === 1 };
  }
  return { type: 'Name', id: this.name() };
};
P.small = function () {
  var t = this.cur();
  if (t.t === 'NAME' && this.kw[t.v]) {
    switch (t.v) {
      case 'pass': this.next(); return { type: 'Pass' };
      case 'break': this.next(); return { type: 'Break' };
      case 'continue': this.next(); return { type: 'Continue' };
      case 'return': this.next(); return { type: 'Return', value: this.endsSmall() ? null : this.testlistStar() };
      case 'global': case 'nonlocal':
        this.next(); var ns = [this.name()]; while (this.acceptOp(',')) ns.push(this.name());
        return { type: t.v === 'global' ? 'Global' : 'Nonlocal', names: ns };
      case 'del': this.next(); return { type: 'Delete', targets: this.exprlistItems() };
      case 'assert': this.next(); var a = { type: 'Assert', test: this.test(), msg: null }; if (this.acceptOp(',')) a.msg = this.test(); return a;
      case 'raise':
        this.next(); var r = { type: 'Raise', args: [], cause: null };
        if (!this.endsSmall()) { r.args.push(this.test()); if (this.acceptKw('from')) r.cause = this.test(); else while (this.acceptOp(',')) r.args.push(this.test()); }
        return r;
      case 'import':
        this.next(); var names = [];
        do { var dn = this.dotted(), al = { name: dn, asname: null }; if (this.acceptKw('as')) al.asname = this.name(); names.push(al); } while (this.acceptOp(','));
        return { type: 'Import', names: names };
      case 'from':
        this.next(); var lvl = 0, mod = null;
        for (;;) { if (this.acceptOp('.')) lvl++; else if (this.acceptOp('...')) lvl += 3; else break; }
        if (!this.isKw('import')) mod = this.dotted();
        this.expectKw('import');
        var fn = [], par = false;
        if (this.acceptOp('*')) fn = [{ name: '*', asname: null }];
        else {
          par = !!this.acceptOp('(');
          do { if (par && this.isOp(')')) break; var al2 = { name: this.name(), asname: null }; if (this.acceptKw('as')) al2.asname = this.name(); fn.push(al2); } while (this.acceptOp(','));
          if (par) this.expectOp(')');
        }
        return { type: 'ImportFrom', module: mod, level: lvl, names: fn };
      case 'print':
        this.next(); var pr = { type: 'Print', dest: null, values: [], nl: true };
        if (this.acceptOp('>>')) { pr.dest = this.test(); if (!this.acceptOp(',')) return pr; }
        while (!this.endsSmall()) { pr.values.push(this.test()); if (!this.acceptOp(',')) break; if (this.endsSmall()) pr.nl = false; }
        return pr;
      case 'exec':
        this.next(); var ex = { type: 'Exec', body: this.expr(), globals: null, locals: null };
        if (this.acceptKw('in')) { ex.globals = this.test(); if (this.acceptOp(',')) ex.locals = this.test(); }
        return ex;
    }
  }
  var first = this.testlistStar(true);
  var tt = this.cur();
  if (tt.t === 'OP' && AUG.indexOf(tt.v) >= 0) { this.next(); return { type: 'AugAssign', target: first, op: tt.v.slice(0, -1), value: this.isKw('yield') ? this.yieldExpr() : this.testlist() }; }
  if (tt.t === 'OP' && tt.v === ':' && this.py3) throw this.err('Annotation de variable non gérée');
  if (this.isOp('=')) {
    var targets = [first], value;
    while (this.acceptOp('=')) { value = this.isKw('yield') ? this.yieldExpr() : this.testlistStar(true); targets.push(value); }
    targets.pop();
    return { type: 'Assign', targets: targets, value: value };
  }
  return { type: 'Expr', value: first };
};
P.endsSmall = function () { var t = this.cur(); return t.t === 'NEWLINE' || (t.t === 'OP' && t.v === ';') || t.t === 'EOF'; };
P.dotted = function () { var s = this.name(); while (this.acceptOp('.')) s += '.' + this.name(); return s; };

/* ----- expressions ----- */
P.testlist = function () { return this.listOf(this.test, false); };
P.testlistStar = function (allowYield) { if (allowYield && this.isKw('yield')) return this.yieldExpr(); return this.listOf(this.testOrStar, false); };
P.exprlist = function () { return this.listOf(this.exprOrStar, true); };
P.exprlistItems = function () { var items = [this.exprOrStar()]; while (this.acceptOp(',')) { if (this.endsTuple()) break; items.push(this.exprOrStar()); } return items; };
P.testOrStar = function () { if (this.isOp('*')) { this.next(); return { type: 'Starred', value: this.expr() }; } return this.test(); };
P.exprOrStar = function () { if (this.isOp('*')) { this.next(); return { type: 'Starred', value: this.expr() }; } return this.expr(); };
P.endsTuple = function () {
  var t = this.cur();
  if (t.t === 'NEWLINE' || t.t === 'EOF') return true;
  if (t.t === 'OP' && /^(=|\)|\]|\}|:|;|\+=|-=|\*=|\/=|\/\/=|%=|\*\*=|>>=|<<=|&=|\|=|\^=|@=)$/.test(t.v)) return true;
  if (t.t === 'NAME' && (t.v === 'in' || t.v === 'for' || t.v === 'if')) return true;
  return false;
};
P.listOf = function (fn, isTarget) {
  var first = fn.call(this);
  if (!this.isOp(',')) return first;
  var elts = [first];
  while (this.acceptOp(',')) { if (this.endsTuple()) break; elts.push(fn.call(this)); }
  return { type: 'Tuple', elts: elts, one: elts.length === 1 };
};
P.namedTest = function () { return this.test(); };
P.test = function () {
  if (this.isKw('lambda')) return this.lambdef(false);
  var body = this.orTest();
  if (this.isKw('if')) {
    // ne pas confondre avec « for ... if » d'une compréhension : ici un else doit suivre
    var save = this.i;
    this.next();
    var cond = this.orTest();
    if (this.acceptKw('else')) return { type: 'IfExp', body: body, test: cond, orelse: this.test() };
    this.i = save;
  }
  return body;
};
P.oldTest = function () { if (this.isKw('lambda')) return this.lambdef(true); return this.orTest(); };
P.lambdef = function (old) {
  this.expectKw('lambda');
  var args = this.params(':', false);
  this.expectOp(':');
  return { type: 'Lambda', args: args, body: old ? this.oldTest() : this.test() };
};
P.orTest = function () { var v = [this.andTest()]; while (this.acceptKw('or')) v.push(this.andTest()); return v.length > 1 ? { type: 'BoolOp', op: 'or', values: v } : v[0]; };
P.andTest = function () { var v = [this.notTest()]; while (this.acceptKw('and')) v.push(this.notTest()); return v.length > 1 ? { type: 'BoolOp', op: 'and', values: v } : v[0]; };
P.notTest = function () { if (this.acceptKw('not')) return { type: 'UnaryOp', op: 'not', operand: this.notTest() }; return this.comparison(); };
P.comparison = function () {
  var left = this.expr(), ops = [], comps = [];
  for (;;) {
    var t = this.cur(), op = null;
    if (t.t === 'OP' && CMP.indexOf(t.v) >= 0) { op = t.v; this.next(); }
    else if (this.isKw('in')) { op = 'in'; this.next(); }
    else if (this.isKw('not')) { var s = this.i; this.next(); if (this.acceptKw('in')) op = 'not in'; else { this.i = s; break; } }
    else if (this.isKw('is')) { this.next(); op = this.acceptKw('not') ? 'is not' : 'is'; }
    else break;
    ops.push(op); comps.push(this.expr());
  }
  return ops.length ? { type: 'Compare', left: left, ops: ops, comparators: comps } : left;
};
function binLevel(ops, nextFn) {
  return function () {
    var left = nextFn.call(this);
    for (;;) {
      var t = this.cur();
      if (t.t === 'OP' && ops.indexOf(t.v) >= 0) { this.next(); left = { type: 'BinOp', left: left, op: t.v, right: nextFn.call(this) }; }
      else return left;
    }
  };
}
P.factor = function () {
  var t = this.cur();
  if (t.t === 'OP' && (t.v === '-' || t.v === '+' || t.v === '~')) { this.next(); return { type: 'UnaryOp', op: t.v, operand: this.factor() }; }
  return this.power();
};
P.term = binLevel(['*', '/', '%', '//', '@'], P.factor);
P.arith = binLevel(['+', '-'], P.term);
P.shift = binLevel(['<<', '>>'], P.arith);
P.band = binLevel(['&'], P.shift);
P.bxor = binLevel(['^'], P.band);
P.expr = binLevel(['|'], P.bxor);
P.power = function () {
  var e = this.atomTrailers();
  if (this.acceptOp('**')) return { type: 'BinOp', left: e, op: '**', right: this.factor() };
  return e;
};
P.atomTrailers = function () {
  var e = this.atom();
  for (;;) {
    var op = this.acceptOp('(');
    if (op) { this.tc = false; e = { type: 'Call', func: e, args: this.isOp(')') ? [] : this.arglist() }; var tc = this.tc; var cl = this.expectOp(')'); e.ml = cl.line > op.line; if (tc) e.tc = true; }
    else if (this.acceptOp('[')) { e = { type: 'Subscript', value: e, slice: this.subscriptlist() }; this.expectOp(']'); }
    else if (this.isOp('.')) { this.next(); e = { type: 'Attribute', value: e, attr: this.nameAny() }; }
    else return e;
  }
};
P.nameAny = function () { var t = this.cur(); if (t.t !== 'NAME') throw this.err('Nom attendu'); this.i++; this.lastTok = t; return t.v; };
P.arglist = function () {
  var args = [];
  while (!this.isOp(')')) {
    if (this.acceptOp('**')) args.push({ kind: '**', value: this.test() });
    else if (this.acceptOp('*')) args.push({ kind: '*', value: this.test() });
    else {
      var t = this.cur(), n2 = this.t[this.i + 1];
      if (t.t === 'NAME' && !this.kw[t.v] && n2 && n2.t === 'OP' && n2.v === '=') { this.i += 2; args.push({ kind: 'k', name: t.v, value: this.test() }); }
      else {
        var v = this.test();
        if (this.isKw('for')) v = { type: 'GeneratorExp', elt: v, generators: this.compFor(false) };
        args.push({ kind: 'p', value: v });
      }
    }
    if (!this.acceptOp(',')) break;
    if (this.isOp(')')) this.tc = true;
  }
  return args;
};
P.subscriptlist = function () {
  var dims = [this.subscript()], trailing = false;
  while (this.acceptOp(',')) { if (this.isOp(']')) { trailing = true; break; } dims.push(this.subscript()); }
  if (dims.length === 1 && !trailing) return dims[0];
  var simple = dims.every(function (d) { return d.type === 'Index'; });
  if (simple) return { type: 'Index', value: { type: 'Tuple', elts: dims.map(function (d) { return d.value; }), one: dims.length === 1 } };
  return { type: 'ExtSlice', dims: dims };
};
P.subscript = function () {
  if (this.acceptOp('...')) return { type: 'Ellipsis' };
  if (this.isOp('.') && this.t[this.i + 1].v === '.' ) { this.i += 3; return { type: 'Ellipsis' }; }
  var lower = null;
  if (!this.isOp(':')) { lower = this.testOrStar(); if (!this.isOp(':')) return { type: 'Index', value: lower }; }
  this.expectOp(':');
  var s = { type: 'Slice', lower: lower, upper: null, step: null, stepColon: false };
  if (!this.isOp(']') && !this.isOp(',') && !this.isOp(':')) s.upper = this.test();
  if (this.acceptOp(':')) { s.stepColon = true; if (!this.isOp(']') && !this.isOp(',')) s.step = this.test(); }
  return s;
};
P.compFor = function (listcomp) {
  var gens = [];
  while (this.isKw('for')) {
    this.next();
    var g = { target: this.exprlist() };
    this.expectKw('in');
    if (listcomp) { var it = this.oldTest(); if (this.isOp(',')) { var el = [it]; while (this.acceptOp(',')) { if (this.isOp(']') || this.isKw('for') || this.isKw('if')) break; el.push(this.oldTest()); } it = { type: 'Tuple', elts: el, one: el.length === 1 }; } g.iter = it; }
    else g.iter = this.orTest();
    g.ifs = [];
    while (this.isKw('if')) { this.next(); g.ifs.push(this.oldTest()); }
    gens.push(g);
  }
  return gens;
};
P.yieldExpr = function () {
  this.expectKw('yield');
  if (this.py3 && this.acceptKw('from')) return { type: 'YieldFrom', value: this.test() };
  var t = this.cur();
  if (t.t === 'NEWLINE' || (t.t === 'OP' && /^[)\];=]$/.test(t.v))) return { type: 'Yield', value: null };
  return { type: 'Yield', value: this.testlist() };
};
P.atom = function () {
  var t = this.cur();
  if (t.t === 'OP') {
    if (t.v === '(') {
      var o1 = this.next();
      if (this.acceptOp(')')) return { type: 'Tuple', elts: [], paren: true };
      if (this.isKw('yield')) { var y = this.yieldExpr(); this.expectOp(')'); y.paren = true; return y; }
      var first = this.testOrStar();
      if (this.isKw('for')) { var g = { type: 'GeneratorExp', elt: first, generators: this.compFor(false) }; this.expectOp(')'); return g; }
      if (!this.isOp(',')) { this.expectOp(')'); return wrapParen(first); }
      var elts = [first], ttc = false;
      while (this.acceptOp(',')) { if (this.isOp(')')) { ttc = true; break; } elts.push(this.testOrStar()); }
      var c1 = this.expectOp(')');
      return mark({ type: 'Tuple', elts: elts, one: elts.length === 1, paren: true }, o1, c1, ttc && elts.length > 1);
    }
    if (t.v === '[') {
      var o2 = this.next();
      if (this.acceptOp(']')) return { type: 'List', elts: [] };
      var f = this.testOrStar();
      if (this.isKw('for')) { var lc = { type: 'ListComp', elt: f, generators: this.compFor(!this.py3) }; this.expectOp(']'); return lc; }
      var le = [f], ltc = false;
      while (this.acceptOp(',')) { if (this.isOp(']')) { ltc = true; break; } le.push(this.testOrStar()); }
      var c2 = this.expectOp(']');
      return mark({ type: 'List', elts: le }, o2, c2, ltc);
    }
    if (t.v === '{') {
      var o3 = this.next();
      if (this.acceptOp('}')) return { type: 'Dict', keys: [], values: [] };
      var k;
      if (this.acceptOp('**')) { var dv = this.expr(); return this.dictRest(null, dv, o3); }
      k = this.testOrStar();
      if (this.acceptOp(':')) {
        var v = this.test();
        if (this.isKw('for')) { var dc = { type: 'DictComp', key: k, value: v, generators: this.compFor(false) }; this.expectOp('}'); return dc; }
        return this.dictRest(k, v, o3);
      }
      if (this.isKw('for')) { var sc = { type: 'SetComp', elt: k, generators: this.compFor(false) }; this.expectOp('}'); return sc; }
      var se = [k], stc = false;
      while (this.acceptOp(',')) { if (this.isOp('}')) { stc = true; break; } se.push(this.testOrStar()); }
      var c3 = this.expectOp('}');
      return mark({ type: 'Set', elts: se }, o3, c3, stc);
    }
    if (t.v === '`') { this.next(); var r = { type: 'Repr', value: this.testlist() }; this.expectOp('`'); return r; }
    if (t.v === '...') { this.next(); return { type: 'Ellipsis' }; }
  }
  if (t.t === 'NUMBER') { this.next(); return { type: 'Num', raw: t.v }; }
  if (t.t === 'STRING') { var raws = []; while (this.cur().t === 'STRING') raws.push(this.next().v); return { type: 'Str', raws: raws }; }
  if (t.t === 'NAME' && (!this.kw[t.v] || t.v === 'None' || t.v === 'True' || t.v === 'False')) { this.next(); return { type: 'Name', id: t.v }; }
  throw this.err('Expression attendue');
};
function wrapParen(e) { if (e.paren) return e; e.paren = true; return e; }
function mark(node, open, close, tc) { node.ml = close.line > open.line; if (tc) node.tc = true; return node; }
P.dictRest = function (k, v, open) {
  var keys = [k], vals = [v], dtc = false;
  while (this.acceptOp(',')) {
    if (this.isOp('}')) { dtc = true; break; }
    if (this.acceptOp('**')) { keys.push(null); vals.push(this.expr()); continue; }
    keys.push(this.test()); this.expectOp(':'); vals.push(this.test());
  }
  var cl = this.expectOp('}');
  return mark({ type: 'Dict', keys: keys, values: vals }, open, cl, dtc);
};

PY.parse = function (src, opts) {
  opts = opts || {};
  var toks = PY.tokenize(src);
  var p = new Parser(toks, opts.py3, src);
  var mod = p.file();
  mod.py3 = !!opts.py3;
  return mod;
};
PY.parseExpr = function (src, py3) {
  var toks = PY.tokenize(src);
  var p = new Parser(toks, py3);
  var e = p.testlistStar(true);
  p.cur();
  while (p.cur().t === 'NEWLINE') p.i++;
  if (p.cur().t !== 'EOF') throw p.err('Texte en trop');
  return e;
};
PY.parseParams = function (src) {
  var toks = PY.tokenize('(' + src + ')');
  var p = new Parser(toks, true);
  p.expectOp('(');
  var r = p.params(')', true);
  p.expectOp(')');
  return r;
};
/* choix automatique Python 2 / Python 3 */
PY.isPy3 = function (src) {
  if (/^\s*from\s+__future__\s+import\s+[^\n]*print_function/m.test(src)) return true;
  try { return PY.tokenize(src).some(function (t) { return t.t === 'STRING' && /^[a-zA-Z]*[fF]/.test(t.v); }); } catch (e) { return false; }
};
PY.parseAuto = function (src) {
  var py3First = PY.isPy3(src);
  var order = py3First ? [true, false] : [false, true];
  try { return PY.parse(src, { py3: order[0] }); }
  catch (e1) {
    if (!e1.isPy) throw e1;
    try { return PY.parse(src, { py3: order[1] }); }
    catch (e2) { if (!e2.isPy) throw e2; throw (order[0] ? e2 : e1); }
  }
};

/* ================= IMPRIMEUR ================= */
var PREC_BIN = { '|': 7, '^': 8, '&': 9, '<<': 10, '>>': 10, '+': 11, '-': 11, '*': 12, '/': 12, '//': 12, '%': 12, '@': 12, '**': 14 };
function prec(e) {
  if (e.paren) return 17;
  switch (e.type) {
    case 'Lambda': return 1;
    case 'IfExp': return 2;
    case 'BoolOp': return e.op === 'or' ? 3 : 4;
    case 'UnaryOp': return e.op === 'not' ? 5 : 13;
    case 'Compare': return 6;
    case 'BinOp': return PREC_BIN[e.op];
    case 'Call': case 'Attribute': case 'Subscript': return 16;
    case 'Tuple': return e.elts.length ? 0 : 17;
    case 'Yield': case 'YieldFrom': return 0;
    case 'Starred': return 1;
    default: return 17;
  }
}
PY.prec = prec;
var ORD_OF_PREC = { 0: 17, 1: 16, 2: 15, 3: 14, 4: 13, 5: 12, 6: 11, 7: 10, 8: 9, 9: 8, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 2, 17: 0 };
PY.ordOf = function (p) { return ORD_OF_PREC[p]; };
PY.need = function (p) { return ORD_OF_PREC[p] + 1; };   // Blockly compare des classes entières : parenthèses si ordre intérieur >= ordre(p) + 1

function indentMore(code, pad) { return code.replace(/\n(?!\u0000)/g, '\n' + pad); }
PY.indentMore = indentMore;
function strRaw(r) { return r.indexOf('\n') >= 0 ? r.replace(/\n/g, NL) : r; }
PY.seq = function (open, items, close, single, ml, tc) {
  var comma = single || tc ? ',' : '';
  var flat = open + items.join(', ') + comma + close;
  if (!items.length) return open + close;
  var wrap = ml === undefined || ml === null ? (flat.length > PY.MAXW || flat.replace(/\n\u0000/g, '').indexOf('\n') >= 0) : !!ml;
  if (!wrap) return flat;
  return open + '\n' + items.map(function (s) { return IND + indentMore(s, IND); }).join(',\n') + comma + '\n' + close;
};
function px(e, min) {
  var s = raw(e);
  return prec(e) < min ? '(' + s + ')' : s;
}
PY.px = px;
function raw(e) {
  if (e.paren && !(e.type === 'Tuple' && e.elts.length)) return e.type === 'Tuple' ? '()' : '(' + rawIn(e) + ')';
  return rawIn(e);
}
function rawIn(e) {
  switch (e.type) {
    case 'Name': return e.id;
    case 'Num': return e.raw;
    case 'Str': return e.raws.map(strRaw).join(' ');
    case 'Ellipsis': return '...';
    case 'Tuple':
      if (!e.elts.length) return '()';
      if (e.paren) return PY.seq('(', e.elts.map(function (x) { return px(x, 1); }), ')', e.elts.length === 1, e.ml, e.tc);
      return e.elts.map(function (x) { return px(x, 1); }).join(', ') + (e.elts.length === 1 ? ',' : '');
    case 'List': return PY.seq('[', e.elts.map(function (x) { return px(x, 1); }), ']', false, e.ml, e.tc);
    case 'Set': return PY.seq('{', e.elts.map(function (x) { return px(x, 1); }), '}', false, e.ml, e.tc);
    case 'Dict': return PY.seq('{', e.keys.map(function (k, i) { return k === null ? '**' + px(e.values[i], 7) : px(k, 1) + ': ' + px(e.values[i], 1); }), '}', false, e.ml, e.tc);
    case 'Call': return px(e.func, 16) + PY.seq('(', e.args.map(argText), ')', false, e.ml, e.tc);
    case 'Attribute': return (e.value.type === 'Num' && /^\d+[lL]?$/.test(e.value.raw) ? '(' + e.value.raw + ')' : px(e.value, 16)) + '.' + e.attr;
    case 'Subscript': return px(e.value, 16) + '[' + sliceText(e.slice) + ']';
    case 'Compare': return px(e.left, 7) + e.ops.map(function (o, i) { return ' ' + (o === '<>' ? '!=' : o) + ' ' + px(e.comparators[i], 7); }).join('');
    case 'BinOp':
      if (e.op === '**') return px(e.left, 15) + ' ** ' + px(e.right, 13);
      var p = PREC_BIN[e.op];
      return px(e.left, p) + ' ' + e.op + ' ' + px(e.right, p + 1);
    case 'UnaryOp': return e.op === 'not' ? 'not ' + px(e.operand, 5) : e.op + px(e.operand, 13);
    case 'BoolOp': return e.values.map(function (v) { return px(v, e.op === 'and' ? 5 : 4); }).join(' ' + e.op + ' ');
    case 'IfExp': return px(e.body, 3) + ' if ' + px(e.test, 3) + ' else ' + px(e.orelse, 2);
    case 'Lambda': return 'lambda' + (e.args.length ? ' ' + paramsText(e.args) : '') + ': ' + px(e.body, 1);
    case 'ListComp': return '[' + px(e.elt, 1) + gensText(e.generators) + ']';
    case 'GeneratorExp': return '(' + px(e.elt, 1) + gensText(e.generators) + ')';
    case 'SetComp': return '{' + px(e.elt, 1) + gensText(e.generators) + '}';
    case 'DictComp': return '{' + px(e.key, 1) + ': ' + px(e.value, 1) + gensText(e.generators) + '}';
    case 'Yield': return 'yield' + (e.value ? ' ' + px(e.value, 0) : '');
    case 'YieldFrom': return 'yield from ' + px(e.value, 1);
    case 'Repr': return '`' + px(e.value, 0) + '`';
    case 'Starred': return '*' + px(e.value, 7);
  }
  throw new Error('noeud inconnu ' + e.type);
}
PY.raw = raw;
function argText(a) {
  if (a.kind === 'k') return a.name + '=' + px(a.value, 1);
  if (a.kind === '*') return '*' + px(a.value, 1);
  if (a.kind === '**') return '**' + px(a.value, 1);
  return px(a.value, a.value.type === 'GeneratorExp' ? 17 : 1);
}
PY.argText = argText;
function sliceText(s) {
  switch (s.type) {
    case 'Index': return px(s.value, 0);
    case 'Slice': return (s.lower ? px(s.lower, 1) : '') + ':' + (s.upper ? px(s.upper, 1) : '') + (s.stepColon ? ':' + (s.step ? px(s.step, 1) : '') : '');
    case 'ExtSlice': return s.dims.map(sliceText).join(', ') + (s.dims.length === 1 ? ',' : '');
    case 'Ellipsis': return '...';
  }
  return px(s, 0);
}
PY.sliceText = sliceText;
function targetText(t) { return t.type === 'Tuple' && t.elts.length && !t.paren ? t.elts.map(function (x) { return px(x, 7); }).join(', ') + (t.elts.length === 1 ? ',' : '') : px(t, 7); }
PY.stripParen = function (e) { var c = {}; for (var k in e) c[k] = e[k]; delete c.paren; return c; };
PY.targetText = targetText;
function gensText(gens) {
  return gens.map(function (g) {
    return ' for ' + targetText(g.target) + ' in ' + px(g.iter, 3) + g.ifs.map(function (c) { return ' if ' + px(c, 3); }).join('');
  }).join('');
}
function fpText(t) { return t.type === 'Tuple' ? '(' + t.elts.map(fpText).join(', ') + (t.elts.length === 1 ? ',' : '') + ')' : t.id; }
function paramsText(items) {
  return items.map(function (p) {
    if (p.kind === '*') return '*' + (p.name || '') + (p.ann ? ': ' + px(p.ann, 1) : '');
    if (p.kind === '**') return '**' + p.name + (p.ann ? ': ' + px(p.ann, 1) : '');
    var s = fpText(p.target);
    if (p.ann) s += ': ' + px(p.ann, 1);
    if (p.def) s += (p.ann ? ' = ' : '=') + px(p.def, 1);
    return s;
  }).join(', ');
}
PY.paramsText = paramsText;
PY.exprText = function (e) { return raw(e); };
function aliasText(a) { return a.name + (a.asname ? ' as ' + a.asname : ''); }
/* texte d'une instruction simple (import, print, del…) */
PY.simpleText = function (s) {
  switch (s.type) {
    case 'Import': return 'import ' + s.names.map(aliasText).join(', ');
    case 'ImportFrom':
      var head = 'from ' + '.'.repeat(s.level) + (s.module || '') + ' import ';
      var list = s.names.map(aliasText);
      if (list.length === 1 && list[0] === '*') return head + '*';
      return head + (head.length + list.join(', ').length > PY.MAXW ? PY.seq('(', list, ')') : list.join(', '));
    case 'Global': return 'global ' + s.names.join(', ');
    case 'Nonlocal': return 'nonlocal ' + s.names.join(', ');
    case 'Delete': return 'del ' + s.targets.map(function (t) { return px(t, 7); }).join(', ');
    case 'Assert': return 'assert ' + px(s.test, 1) + (s.msg ? ', ' + px(s.msg, 1) : '');
    case 'Exec':
      if (!s.globals) return 'exec' + (s.body.paren ? '' : ' ') + px(s.body, 0);
      return 'exec ' + px(s.body, 7) + ' in ' + px(s.globals, 1) + (s.locals ? ', ' + px(s.locals, 1) : '');
    case 'Print':
      if (!s.dest && s.nl && s.values.length === 1 && s.values[0].paren) return 'print' + px(s.values[0], 0);
      var parts = [];
      if (s.dest) parts.push('>>' + px(s.dest, 1));
      s.values.forEach(function (v) { parts.push(px(v, 1)); });
      return 'print' + (parts.length ? ' ' + parts.join(', ') : '') + (s.nl ? '' : ',');
    case 'Raise':
      return 'raise' + (s.args.length ? ' ' + s.args.map(function (a) { return px(a, 1); }).join(', ') : '') + (s.cause ? ' from ' + px(s.cause, 1) : '');
    case 'Return': return 'return' + (s.value ? ' ' + px(s.value, 0) : '');
    case 'Assign': return s.targets.map(function (t) { return px(t, 0); }).join(' = ') + ' = ' + px(s.value, 0);
    case 'AugAssign': return px(s.target, 0) + ' ' + s.op + '= ' + px(s.value, 0);
    case 'Expr': return px(s.value, 0);
    case 'Pass': return 'pass';
    case 'Break': return 'break';
    case 'Continue': return 'continue';
  }
  throw new Error('instruction inconnue ' + s.type);
};
PY.headText = function (s) {
  switch (s.type) {
    case 'If': return 'if ' + px(s.test, 0) + ':';
    case 'While': return 'while ' + px(s.test, 0) + ':';
    case 'For': return 'for ' + targetText(s.target) + ' in ' + px(s.iter, 0) + ':';
    case 'Try': return 'try:';
    case 'With': return 'with ' + s.items.map(PY.withItemText).join(', ') + ':';
    case 'FunctionDef': return 'def ' + s.name + '(' + paramsText(s.args) + ')' + (s.returns ? ' -> ' + px(s.returns, 1) : '') + ':';
    case 'ClassDef': return 'class ' + s.name + PY.basesText(s.bases) + ':';
  }
  return null;
};
PY.fnv = function (s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
PY.withItemText = function (it) { return px(it.ctx, 1) + (it.vars ? ' as ' + px(it.vars, 7) : ''); };
PY.handlerHead = function (h) { return 'except' + (h.htype ? ' ' + px(h.htype, 1) + (h.name ? ' as ' + px(h.name, 7) : '') : ''); };
PY.basesText = function (bases) { return bases && bases.length ? '(' + bases.map(argText).join(', ') + ')' : ''; };

/* impression d'un fichier entier (référence pour les tests : les blocs doivent produire exactement ce texte) */
function hasCode(body) { return body.some(function (s) { return s.type !== 'Comment'; }); }
PY.printFile = function (mod) {
  var out = [];
  function inl(s) { return s.inline !== undefined && s.inline !== null ? '  #' + s.inline : ''; }
  function emit(text, lvl) { out.push(indentMore(IND.repeat(lvl) + text, IND.repeat(lvl))); }
  function body(stmts, lvl) {
    stmts.forEach(function (s) { stmt(s, lvl); });
    if (!hasCode(stmts)) emit('pass', lvl);
  }
  function blank(s) { for (var i = 0; i < (s.blank || 0); i++) out.push(''); }
  function stmt(s, lvl) {
    blank(s);
    switch (s.type) {
      case 'Comment': emit('#' + s.text, lvl); return;
      case 'If':
        emit('if ' + px(s.test, 0) + ':' + inl(s), lvl); body(s.body, lvl + 1);
        var o = s.orelse;
        while (o && o.length === 1 && o[0].type === 'If' && !o[0].blank && !o[0].inline) { emit('elif ' + px(o[0].test, 0) + ':', lvl); body(o[0].body, lvl + 1); o = o[0].orelse; }
        if (o && o.length) { emit('else:', lvl); body(o, lvl + 1); }
        return;
      case 'While': emit('while ' + px(s.test, 0) + ':' + inl(s), lvl); body(s.body, lvl + 1); if (s.orelse) { emit('else:', lvl); body(s.orelse, lvl + 1); } return;
      case 'For': emit('for ' + targetText(s.target) + ' in ' + px(s.iter, 0) + ':' + inl(s), lvl); body(s.body, lvl + 1); if (s.orelse) { emit('else:', lvl); body(s.orelse, lvl + 1); } return;
      case 'Try':
        emit('try:' + inl(s), lvl); body(s.body, lvl + 1);
        s.handlers.forEach(function (h) { emit(PY.handlerHead(h) + ':', lvl); body(h.body, lvl + 1); });
        if (s.orelse) { emit('else:', lvl); body(s.orelse, lvl + 1); }
        if (s.finalbody) { emit('finally:', lvl); body(s.finalbody, lvl + 1); }
        return;
      case 'With': emit('with ' + s.items.map(PY.withItemText).join(', ') + ':' + inl(s), lvl); body(s.body, lvl + 1); return;
      case 'FunctionDef':
        s.decorators.forEach(function (d) { emit('@' + px(d, 16), lvl); });
        emit('def ' + s.name + '(' + paramsText(s.args) + ')' + (s.returns ? ' -> ' + px(s.returns, 1) : '') + ':' + inl(s), lvl); body(s.body, lvl + 1); return;
      case 'ClassDef':
        s.decorators.forEach(function (d) { emit('@' + px(d, 16), lvl); });
        emit('class ' + s.name + PY.basesText(s.bases) + ':' + inl(s), lvl); body(s.body, lvl + 1); return;
    }
    emit(PY.simpleText(s) + inl(s), lvl);
  }
  mod.body.forEach(function (s) { stmt(s, 0); });
  return PY.clean(out.join('\n') + '\n');
};
PY.clean = function (code) { return code.replace(/\u0000/g, ''); };

/* marquer les retours à la ligne internes aux chaînes d'un texte déjà écrit */
PY.markStrings = function (text) {
  if (text.indexOf('\n') < 0) return text;
  var out = '', i = 0, n = text.length;
  while (i < n) {
    var c = text[i];
    if (c === '#') { var e = text.indexOf('\n', i); if (e < 0) e = n; out += text.slice(i, e); i = e; continue; }
    if (c === '"' || c === "'") {
      var triple = text.substr(i, 3) === c + c + c, j = i + (triple ? 3 : 1);
      while (j < n) {
        if (text[j] === '\\') { j += 2; continue; }
        if (triple ? text.substr(j, 3) === c + c + c : text[j] === c) { j += triple ? 3 : 1; break; }
        if (!triple && text[j] === '\n') break;
        j++;
      }
      out += text.slice(i, j).replace(/\n/g, NL); i = j; continue;
    }
    out += c; i++;
  }
  return out;
};

/* empreinte structurelle (pour vérifier qu'un aller-retour ne perd rien) */
PY.dump = function (node) {
  return JSON.stringify(node, function (k, v) {
    if (/^(blank|inline|paren|elif|line|ml|tc|src|gap|bl|ind|t|ic|sl|meta|elseMeta|finMeta|decoMeta|kwInd|fmt|sc)$/.test(k)) return undefined;
    return v;
  });
};
PY.comments = function (mod) {
  var out = [];
  (function walk(x) {
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (!x || typeof x !== 'object') return;
    if (x.type === 'Comment') out.push(x.text);
    if (typeof x.inline === 'string') out.push(x.inline);
    if (x.ic) x.ic.forEach(function (c) { out.push(c); });
    for (var k in x) if (k !== 'ic' && x[k] && typeof x[k] === 'object') walk(x[k]);
  })(mod.body);
  return out;
};
})(typeof window !== 'undefined' ? window : globalThis);
