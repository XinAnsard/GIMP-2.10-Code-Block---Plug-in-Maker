/* Atelier — import de scripts Python en blocs, export fidèle, empreinte des blocs */
(function (root) {
'use strict';
var GA = root.GA;
var PY = GA.py;
var C = function (s) { return PY.clean(s); };

/* ================= code → états de blocs ================= */
function hasCall(x) {
  if (!x || typeof x !== 'object') return false;
  if (Array.isArray(x)) { for (var i = 0; i < x.length; i++) if (hasCall(x[i])) return true; return false; }
  if (x.type === 'Call') return true;
  for (var k in x) if (x[k] && typeof x[k] === 'object' && hasCall(x[k])) return true;
  return false;
}
/* une expression qui lit une variable ou fait un calcul devient des blocs (variable = pastille ronde, + - == et… = blocs) ;
   les valeurs simples (nombres, textes, True/False/None, -1, (0, 0, 0)) restent une seule case */
var CONST_NAMES = { True: 1, False: 1, None: 1 };
function hasName(x) {
  if (!x || typeof x !== 'object') return false;
  if (Array.isArray(x)) { for (var i = 0; i < x.length; i++) if (hasName(x[i])) return true; return false; }
  if (x.type === 'Name') return !CONST_NAMES[x.id];
  if (/^(BinOp|Compare|BoolOp|IfExp)$/.test(x.type) || (x.type === 'UnaryOp' && x.op === 'not')) return true;
  if (/^(Lambda|ListComp|SetComp|DictComp|GeneratorExp)$/.test(x.type)) return false;
  for (var k in x) if (x[k] && typeof x[k] === 'object' && hasName(x[k])) return true;
  return false;
}
function S(type, fields, inputs, extra) {
  var st = { type: type };
  if (fields) st.fields = fields;
  if (inputs && Object.keys(inputs).length) st.inputs = inputs;
  if (extra && Object.keys(extra).length) st.extraState = extra;
  return st;
}
function B(st) { return { block: st }; }
function leaf(e) { return S('py_leaf', { CODE: C(PY.raw(e)) }); }
function shapeOf(ex, e) { if (e.ml !== undefined) ex.w = e.ml ? 1 : 0; if (e.tc) ex.tc = 1; return ex; }
function callState(e, stmt) {
  var ex = shapeOf({ a: e.args.map(function (x) { return x.kind === 'k' ? 'k:' + x.name : x.kind; }) }, e);
  var fields = {}, inputs = {};
  if (hasCall(e.func)) { ex.f = true; inputs.F = B(val(e.func)); }
  else fields.FUNC = C(PY.px(e.func, 16));
  e.args.forEach(function (x, i) { inputs['A' + i] = B(val(x.value)); });
  return S(stmt ? 'py_callst' : 'py_call', ex.f ? null : fields, inputs, ex);
}
function val(e) {
  if (!hasCall(e) && !hasName(e)) return leaf(e);
  var inputs = {}, i;
  if (e.paren && !(e.type === 'Tuple')) return S('py_paren', null, { V: B(val(PY.stripParen(e))) });
  switch (e.type) {
    case 'Name': return CONST_NAMES[e.id] ? leaf(e) : S('py_var', { NAME: e.id });
    case 'Call': return callState(e, false);
    case 'BinOp': return S('py_binop', { OP: e.op }, { A: B(val(e.left)), B: B(val(e.right)) });
    case 'UnaryOp': return S('py_unary', { OP: e.op }, { A: B(val(e.operand)) });
    case 'BoolOp':
      e.values.forEach(function (v, j) { inputs['V' + j] = B(val(v)); });
      return S('py_boolop', null, inputs, { op: e.op, n: e.values.length });
    case 'Compare':
      var f = {};
      inputs.V0 = B(val(e.left));
      e.ops.forEach(function (o, j) { f['OP' + (j + 1)] = o === '<>' ? '!=' : o; inputs['V' + (j + 1)] = B(val(e.comparators[j])); });
      return S('py_compare', f, inputs, { n: e.ops.length });
    case 'IfExp': return S('py_ifexp', null, { A: B(val(e.body)), C: B(val(e.test)), B: B(val(e.orelse)) });
    case 'Attribute': return S('py_attr', { NAME: e.attr }, { V: B(val(e.value)) });
    case 'Subscript':
      if (e.slice.type === 'Index') return S('py_index', null, { V: B(val(e.value)), I: B(val(e.slice.value)) });
      if (e.slice.type === 'Slice') {
        var si = {};
        if (e.slice.lower) si.L = B(val(e.slice.lower));
        if (e.slice.upper) si.U = B(val(e.slice.upper));
        if (e.slice.step) si.S = B(val(e.slice.step));
        return S('py_index', null, { V: B(val(e.value)), I: B(S('py_slice', null, si, { s: !!e.slice.stepColon })) });
      }
      return leaf(e);
    case 'List':
      e.elts.forEach(function (v, j) { inputs['E' + j] = B(val(v)); });
      return S('py_list', null, inputs, shapeOf({ k: 'list', n: e.elts.length }, e));
    case 'Tuple':
      if (!e.elts.length) return leaf(e);
      e.elts.forEach(function (v, j) { inputs['E' + j] = B(val(v)); });
      return S('py_list', null, inputs, e.paren ? shapeOf({ k: 'ptuple', n: e.elts.length }, e) : { k: 'tuple', n: e.elts.length });
    case 'Dict':
      var d = [];
      for (i = 0; i < e.keys.length; i++) {
        if (e.keys[i] === null) d.push(i); else inputs['K' + i] = B(val(e.keys[i]));
        inputs['V' + i] = B(val(e.values[i]));
      }
      return S('py_dict', null, inputs, shapeOf({ n: e.keys.length, d: d }, e));
  }
  return leaf(e);
}
function chain(states) {
  var first = null, prev = null;
  states.forEach(function (s) { if (prev) prev.next = { block: s }; else first = s; prev = s; });
  return first;
}
var IND = '    ', FORCE_IND = false;
/* mise en forme d'origine -> extraState (seulement ce qui diffère de la forme standard) */
function fmt(ex, info, depth, norm) {
  if (info.bl && info.bl.length) { if (info.bl.some(function (x) { return x !== ''; })) ex.bl = info.bl; else ex.sp = info.bl.length; }
  else if (info.blank) ex.sp = info.blank;
  if (info.ind !== undefined && (FORCE_IND || info.ind !== IND.repeat(depth))) ex.i = info.ind;
  if (info.sc !== undefined) ex.sc = info.sc;
  if (info.t) ex.t = info.t;
  if (info.ic && info.ic.length) ex.ic = info.ic;
  if (norm !== null && norm !== undefined && info.src !== undefined && info.src !== norm) { ex.o = info.src; ex.oh = PY.fnv(norm); }
  if (typeof info.inline === 'string' && info.gap !== undefined && info.gap !== '  ') ex.g = info.gap;
  if (info.sl !== undefined) ex.sl = info.sl;
  return ex;
}
function withFmt(st, info, depth, norm) {
  var ex = fmt(st.extraState || {}, info, depth, norm);
  if (Object.keys(ex).length) st.extraState = ex; else delete st.extraState;
  if (typeof info.inline === 'string') st.icons = { comment: { text: info.inline, pinned: false, height: 60, width: 260 } };
  return st;
}
function clauseFmt(meta, depth, norm) {
  var m = fmt({}, meta || {}, depth, norm);
  if (meta && typeof meta.inline === 'string') m.c = meta.inline;
  return m;
}
function bodyIn(list, depth) { var c = chain(stmtsStates(list, depth)); return c ? { block: c } : undefined; }
function stmtsStates(list, depth) { var out = []; list.forEach(function (n) { out = out.concat(stmtStates(n, depth || 0)); }); return out; }
function stmtStates(n, depth) {
  var main, inputs = {}, d1 = depth + 1, cm = {}, ex;
  function head() { var h = PY.headText(n); return h === null ? null : C(h); }
  switch (n.type) {
    case 'Comment': return [withFmt(S('py_comment', { TEXT: n.text }), n, depth, null)];
    case 'Raw': return [withFmt(S('py_raw', { CODE: n.text }), { bl: n.bl, blank: n.blank }, depth, null)];
    case 'FunctionDef': case 'ClassDef':
      var out = [], dm = n.decoMeta || [];
      n.decorators.forEach(function (d, k) {
        var code = C(PY.px(d, 16)), m = dm[k] || {};
        var info = { ind: m.ind, src: m.src, t: m.t, ic: m.ic, inline: m.inline, gap: m.gap,
          bl: k === 0 ? n.bl : (dm[k - 1] || {}).nbl, blank: k === 0 ? n.blank : (dm[k - 1] || {}).nblank };
        out.push(withFmt(S('py_decorator', { CODE: code }), info, depth, '@' + code));
      });
      if (n.type === 'FunctionDef') main = S('py_def', { NAME: n.name, ARGS: C(PY.paramsText(n.args)) }, { DO: bodyIn(n.body, d1) }, n.returns ? { ret: C(PY.px(n.returns, 1)) } : null);
      else main = S('py_class', { NAME: n.name, BASES: n.bases && n.bases.length ? C(n.bases.map(PY.argText).join(', ')) : '' }, { DO: bodyIn(n.body, d1) });
      var dinfo = n;
      if (n.decorators.length) {
        var last = dm[dm.length - 1] || {};
        dinfo = { ind: n.kwInd, bl: last.nbl, blank: last.nblank, src: n.src, t: n.t, ic: n.ic, inline: n.inline, gap: n.gap, sl: n.sl };
      }
      out.push(withFmt(main, dinfo, depth, head()));
      return out;
    case 'If':
      var conds = [n.test], bodies = [n.body], metas = [null], o = n.orelse, tail = n;
      while (o && o.length === 1 && o[0].type === 'If' && o[0].elif) { conds.push(o[0].test); bodies.push(o[0].body); metas.push(o[0].meta); tail = o[0]; o = o[0].orelse; }
      conds.forEach(function (c, j) {
        inputs['C' + j] = B(val(c)); inputs['DO' + j] = bodyIn(bodies[j], d1);
        if (j) cm['e' + j] = clauseFmt(metas[j], depth, 'elif ' + C(PY.px(c, 0)) + ':');
      });
      ex = {};
      if (conds.length > 1) ex.n = conds.length - 1;
      if (o && o.length) { ex.e = true; inputs.ELSE = bodyIn(o, d1); cm.el = clauseFmt(tail.elseMeta, depth, 'else:'); }
      main = S('py_if', null, inputs, ex); break;
    case 'While': case 'For':
      inputs.DO = bodyIn(n.body, d1);
      if (n.type === 'While') inputs.C = B(val(n.test)); else inputs.ITER = B(val(n.iter));
      if (n.orelse) { inputs.ELSE = bodyIn(n.orelse, d1); cm.el = clauseFmt(n.elseMeta, depth, 'else:'); }
      main = n.type === 'While' ? S('py_while', null, inputs, n.orelse ? { e: true } : null)
        : S('py_for', { T: C(PY.targetText(n.target)) }, inputs, n.orelse ? { e: true } : null);
      break;
    case 'Try':
      var tf = {};
      inputs.DO = bodyIn(n.body, d1);
      n.handlers.forEach(function (h, j) {
        tf['T' + j] = h.htype ? C(PY.px(h.htype, 1)) : '';
        tf['N' + j] = h.name ? C(PY.px(h.name, 7)) : '';
        inputs['H' + j] = bodyIn(h.body, d1);
        cm['h' + j] = clauseFmt(h.meta, depth, C(PY.handlerHead(h)) + ':');
      });
      if (n.orelse) { inputs.ELSE = bodyIn(n.orelse, d1); cm.el = clauseFmt(n.elseMeta, depth, 'else:'); }
      if (n.finalbody) { inputs.FIN = bodyIn(n.finalbody, d1); cm.fi = clauseFmt(n.finMeta, depth, 'finally:'); }
      ex = { n: n.handlers.length };
      if (n.orelse) ex.e = true;
      if (n.finalbody) ex.f = true;
      main = S('py_try', tf, inputs, ex); break;
    case 'With':
      var wf = {};
      n.items.forEach(function (it, j) { inputs['E' + j] = B(val(it.ctx)); wf['V' + j] = it.vars ? C(PY.px(it.vars, 7)) : ''; });
      inputs.DO = bodyIn(n.body, d1);
      main = S('py_with', wf, inputs, { n: n.items.length }); break;
    case 'Return': main = S('py_return', null, n.value ? { V: B(val(n.value)) } : null); break;
    case 'Assign': main = S('py_assign', { T: C(n.targets.map(function (t) { return PY.px(t, 0); }).join(' = ')) }, { V: B(val(n.value)) }); break;
    case 'AugAssign': main = S('py_augassign', { T: C(PY.px(n.target, 0)), OP: n.op + '=' }, { V: B(val(n.value)) }); break;
    case 'Expr': main = n.value.type === 'Call' ? callState(n.value, true) : S('py_exprstmt', null, { V: B(val(n.value)) }); break;
    case 'Pass': main = S('py_pass'); break;
    case 'Break': main = S('py_break'); break;
    case 'Continue': main = S('py_continue'); break;
    case 'Raise':
      if (n.args.length <= 1 && !n.cause) { main = S('py_raise', null, n.args.length ? { V: B(val(n.args[0])) } : null); break; }
      main = S('py_stmt', { CODE: C(PY.simpleText(n)) }); break;
    default: main = S('py_stmt', { CODE: C(PY.simpleText(n)) });
  }
  if (Object.keys(cm).length) { main.extraState = main.extraState || {}; main.extraState.cm = cm; }
  var norm = head();
  if (norm === null) norm = C(PY.simpleText(n));
  return [withFmt(main, n, depth, norm)];
}
function countBlocks(st) {
  var n = 0;
  (function walk(x) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (x.type && (x.fields || x.inputs || x.extraState || x.next || /^py_|^g_/.test(x.type))) n++;
    for (var k in x) if (typeof x[k] === 'object') walk(x[k]);
  })(st);
  return n;
}
GA.pyToState = function (mod, name) {
  // fichier qui contient des tabulations dans ses retraits : on mémorise le retrait exact de chaque ligne
  FORCE_IND = !!(mod.fmt && mod.fmt.tabs);
  var states;
  try { states = stmtsStates(mod.body); } finally { FORCE_IND = false; }
  var total = countBlocks(states);
  if (total > 1500) states.forEach(function (s) { if (s.type === 'py_def' || s.type === 'py_class') s.collapsed = true; });
  var hx = {};
  if (mod.py3) hx.py3 = true;
  if (mod.fmt) { if (mod.fmt.bom) hx.bom = 1; if (mod.fmt.eol) hx.eol = mod.fmt.eol; if (mod.fmt.end !== '\n') hx.end = mod.fmt.end; }
  var hat = S('py_file', { NAME: name || 'script' }, states.length ? { DO: { block: chain(states) } } : null, hx);
  hat.x = 30; hat.y = 30;
  return { blocks: { languageVersion: 0, blocks: [hat] }, _count: total + 1 };
};

/* petit morceau de Python → une pile de blocs (raccourcis de la boîte à outils) ; les « pass » de remplissage sont retirés */
GA.pySnippet = function (code) {
  var states = stmtsStates(PY.parse(code + '\n', {}).body);
  (function strip(x) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(strip); return; }
    if (x.inputs) for (var k in x.inputs) { var t = x.inputs[k] && x.inputs[k].block; if (t && t.type === 'py_pass' && !t.next) delete x.inputs[k]; }
    for (var j in x) if (x[j] && typeof x[j] === 'object') strip(x[j]);
  })(states);
  return chain(states);
};

/* ================= import tolérant (fichiers avec erreur de syntaxe) ================= */
function segmentStarts(lines) {
  var starts = [], depth = 0, inStr = null, cont = false, afterDeco = false;
  for (var i = 0; i < lines.length; i++) {
    var L = lines[i];
    if (!inStr && depth === 0 && !cont && /^[^\s#]/.test(L) && !/^(else|elif|except|finally)\b/.test(L)) {
      if (!afterDeco) starts.push(i);
      afterDeco = /^@/.test(L);
    }
    if (i === 0 && starts[0] !== 0) starts.unshift(0);
    // mise à jour de l'état (chaînes, parenthèses, continuation)
    var j = 0;
    cont = false;
    while (j < L.length) {
      var c = L[j];
      if (inStr) {
        if (c === '\\') { j += 2; continue; }
        if (L.substr(j, inStr.length) === inStr) { j += inStr.length; inStr = null; continue; }
        j++; continue;
      }
      if (c === '#') break;
      if (c === '"' || c === "'") { inStr = L.substr(j, 3) === c + c + c ? c + c + c : c; j += inStr.length; continue; }
      if ('([{'.indexOf(c) >= 0) depth++;
      else if (')]}'.indexOf(c) >= 0) depth = Math.max(0, depth - 1);
      j++;
    }
    if (inStr && inStr.length === 1) { if (/\\$/.test(L)) { /* suite */ } else inStr = null; }
    if (!inStr && /\\$/.test(L)) cont = true;
  }
  if (!starts.length || starts[0] !== 0) starts.unshift(0);
  return starts;
}
GA.segmentImport = function (src, py3) {
  var lines = src.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  var starts = segmentStarts(lines);
  var body = [], raws = [], errors = [];
  function blanksBefore(i) { var k = 0; while (i - 1 - k >= 0 && lines[i - 1 - k].trim() === '') k++; return i - k > 0 ? k : 0; }
  function blankLines(i) { var k = blanksBefore(i); return lines.slice(i - k, i); }
  var pendingRaw = null;
  function flushRaw() {
    if (!pendingRaw) return;
    var seg = lines.slice(pendingRaw.from, pendingRaw.to);
    while (seg.length && seg[seg.length - 1].trim() === '') seg.pop();
    body.push({ type: 'Raw', text: seg.join('\n'), blank: blanksBefore(pendingRaw.from), bl: blankLines(pendingRaw.from) });
    raws.push({ from: pendingRaw.from + 1, to: pendingRaw.from + seg.length });
    pendingRaw = null;
  }
  for (var k = 0; k < starts.length; k++) {
    var from = starts[k], to = k + 1 < starts.length ? starts[k + 1] : lines.length;
    var text = lines.slice(from, to).join('\n');
    var mod = null;
    try { mod = PY.parse(text + '\n', { py3: py3 }); }
    catch (e) { if (!e.isPy) throw e; errors.push({ line: from + (e.pyLine || 1), msg: e.message }); }
    if (mod) {
      flushRaw();
      if (mod.body.length) { mod.body[0].blank = blanksBefore(from); mod.body[0].bl = blankLines(from); }
      mod.body.forEach(function (n) { body.push(n); });
    } else {
      if (pendingRaw) pendingRaw.to = to; else pendingRaw = { from: from, to: to };
    }
  }
  flushRaw();
  return { mod: { type: 'Module', body: body, py3: !!py3 }, raws: raws, errors: errors };
};

/* ================= empreinte des blocs (réimport à l'identique) ================= */
var TR_HEAD = '# ==== Atelier de plug-ins GIMP : blocs de ce fichier (ne pas modifier) ====';
var TR_END = '# ==== fin des blocs ====';
function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
function normBody(t) { return t.replace(/\r\n?/g, '\n').split('\n').map(function (l) { return l.replace(/[ \t]+$/, ''); }).join('\n').replace(/\n+$/, ''); }
GA.codeHash = function (code) { return fnv(normBody(code)); };
function b64(bytes) { var s = ''; for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(str) { var s = atob(str), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function streamBytes(bytes, t) { return new Response(new Blob([bytes]).stream().pipeThrough(t)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
GA.withTrailer = function (code, obj) {
  var bytes = new TextEncoder().encode(JSON.stringify(obj));
  var hash = GA.codeHash(code);
  var p = typeof CompressionStream !== 'undefined'
    ? streamBytes(bytes, new CompressionStream('deflate')).then(function (z) { return { f: 'z', d: b64(z) }; })
    : Promise.resolve({ f: 'j', d: b64(bytes) });
  return p.then(function (r) {
    var lines = [TR_HEAD, '# atelier-blocs 1 ' + r.f + ' ' + hash];
    for (var i = 0; i < r.d.length; i += 76) lines.push('# ' + r.d.slice(i, i + 76));
    lines.push(TR_END);
    return code.replace(/\n*$/, '\n') + '\n\n' + lines.join('\n') + '\n';
  });
};
GA.readTrailer = function (text) {
  var lines = text.replace(/\r\n?/g, '\n').split('\n');
  var h = -1;
  for (var i = lines.length - 1; i >= 0; i--) if (lines[i].trim() === TR_HEAD) { h = i; break; }
  if (h < 0) return Promise.resolve({ body: text, found: false });
  var body = lines.slice(0, h).join('\n').replace(/\n+$/, '') + '\n';
  var m = /^# atelier-blocs (\d+) ([zj]) ([0-9a-f]{8})\s*$/.exec(lines[h + 1] || '');
  if (!m) return Promise.resolve({ body: body, found: true, valid: false });
  var data = '';
  for (var j = h + 2; j < lines.length && lines[j].trim() !== TR_END; j++) data += lines[j].replace(/^#\s?/, '').trim();
  var valid = GA.codeHash(body) === m[3];
  if (!valid) return Promise.resolve({ body: body, found: true, valid: false });
  var raw;
  try { raw = unb64(data); } catch (e) { return Promise.resolve({ body: body, found: true, valid: false }); }
  var p = m[2] === 'z' ? streamBytes(raw, new DecompressionStream('deflate')) : Promise.resolve(raw);
  return p.then(function (u) { return { body: body, found: true, valid: true, state: JSON.parse(new TextDecoder().decode(u)) }; },
    function () { return { body: body, found: true, valid: false }; });
};

/* ================= import principal ================= */
function fileFormat(text) {
  var f = { bom: /^\uFEFF/.test(text), eol: /\r\n/.test(text) ? 'crlf' : 'lf' };
  var t = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  f.tabs = /^[ \t]*\t/m.test(t);
  var m = /\S[^\n]*(\n[\s]*)?$/.exec(t);
  f.end = m && m[1] !== undefined ? m[1] : '';
  return f;
}
GA.importPython = function (text, name) {
  var ff = fileFormat(String(text));
  text = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  name = String(name || 'script').replace(/\.(py|txt)$/i, '');
  return GA.readTrailer(text).then(function (tr) {
    if (tr.valid && tr.state && tr.state.ws) return { via: 'blocs', state: tr.state.ws, opts: tr.state.opts || null, name: name };
    var body = tr.body, mod = null, err = null;
    try { mod = PY.parseAuto(body); } catch (e) { if (!e.isPy) throw e; err = e; }
    var res = { via: mod ? 'code' : 'partiel', edited: tr.found && !tr.valid, name: name, lines: body.split('\n').length };
    if (!mod) {
      var seg = GA.segmentImport(body, PY.isPy3(body));
      mod = seg.mod; res.raws = seg.raws; res.error = err;
    }
    res.mod = mod;
    mod.fmt = ff;
    var st = GA.pyToState(mod, name);
    res.count = st._count; delete st._count;
    res.state = st;
    return res;
  });
};

/* ================= export (mode fichier) ================= */
GA.getFileHat = function (ws) { return ws.getBlocksByType('py_file', false)[0] || null; };
GA.getHat = function (ws) { return GA.getFileHat(ws) || GA.getStart(ws); };
GA.isFileMode = function (ws) { return !!GA.getFileHat(ws); };
function colOf(s) { var c = 0; for (var i = 0; i < s.length; i++) { if (s[i] === '\t') c = (Math.floor(c / 8) + 1) * 8; else c++; } return c; }
/* lignes générées -> lignes finales : correspondance ligne->bloc + indentation d'origine quand elle est cohérente */
function lineMap(code) {
  var raw = code.split('\n');
  if (raw.length && raw[raw.length - 1] === '') raw.pop();
  // 1re passe : analyse des lignes
  var recs = [], idStack = [], expect = false, starts0 = [];
  raw.forEach(function (line) {
    var mm = line.match(/^(\s*)#@@'(.*)'$/);
    if (mm) {
      var mi = mm[1].length;
      while (idStack.length && idStack[idStack.length - 1].ind >= mi) idStack.pop();
      idStack.push({ ind: mi, id: mm[2] });
      expect = true;
      return;
    }
    var id = idStack.length ? idStack[idStack.length - 1].id : null;
    if (line.charAt(0) === '\u0000' || line === '') { recs.push({ verb: line.replace(/\u0000/g, ''), id: id }); return; }
    var n = line.length - line.replace(/^ +/, '').length, content = line.slice(n);
    while (idStack.length > 1 && idStack[idStack.length - 1].ind > n) idStack.pop();
    id = idStack.length ? idStack[idStack.length - 1].id : null;
    var hm = /^\u0001([SCH])([^\u0002]*)\u0002/.exec(content), kind = null, hint;
    var jm = /^\u0006([^\u0007]*)\u0007/.exec(content);
    if (jm) { recs.push({ join: jm[1] + content.slice(jm[0].length), id: id }); expect = false; return; }
    if (hm) { content = content.slice(hm[0].length); kind = hm[1]; hint = hm[2] === '\u0005' ? undefined : hm[2]; }
    else if (expect) kind = 'S';
    else {
      while (starts0.length && starts0[starts0.length - 1] > n) starts0.pop();
      if (starts0.length && starts0[starts0.length - 1] === n) kind = 'H';
    }
    if (kind === 'S' || kind === 'H') { while (starts0.length && starts0[starts0.length - 1] >= n) starts0.pop(); starts0.push(n); }
    expect = false;
    recs.push({ n: n, content: content, kind: kind, hint: hint, id: id });
  });
  // indentation d'un nouveau corps : celle de sa 1re instruction d'origine (repère), sinon la forme standard
  function bodyHint(k, n) {
    for (var j = k; j < recs.length; j++) {
      var r = recs[j];
      if (r.verb !== undefined || r.join !== undefined || r.kind === null || r.kind === 'C') continue;
      if (r.n < n) return undefined;
      if (r.n === n && r.kind === 'S' && r.hint !== undefined) return r.hint;
    }
    return undefined;
  }
  // 2e passe : indentation finale
  var out = [], I = [''], starts = [];
  recs.forEach(function (r, k) {
    if (r.verb !== undefined) { out.push({ t: r.verb, id: r.id }); return; }
    if (r.join !== undefined) { if (out.length) out[out.length - 1].t += r.join.replace(/\u0000/g, ''); else out.push({ t: r.join, id: r.id }); return; }
    var n = r.n, D = Math.round(n / 4), ind;
    if (r.kind === 'C') {
      ind = r.hint !== undefined ? r.hint : (I[D] !== undefined ? I[D] : IND.repeat(D));
    } else if (r.kind === 'S' || r.kind === 'H') {
      I.length = Math.min(I.length, D + 1);
      if (I[D] === undefined) {
        var h = r.hint !== undefined ? r.hint : bodyHint(k, n);
        var cand = h !== undefined ? h : IND.repeat(D);
        if (D === 0) cand = '';
        else if (colOf(cand) <= colOf(I[D - 1] || '')) cand = (I[D - 1] || '') + IND;
        I[D] = cand;
      }
      ind = r.hint !== undefined && colOf(r.hint) === colOf(I[D]) ? r.hint : I[D];
      while (starts.length && starts[starts.length - 1].n >= n) starts.pop();
      starts.push({ n: n, ind: ind });
    } else {
      while (starts.length && starts[starts.length - 1].n > n) starts.pop();
      var own = starts[starts.length - 1];
      ind = own ? own.ind + ' '.repeat(Math.max(0, n - own.n)) : ' '.repeat(n);
    }
    out.push({ t: (ind + r.content).replace(/\u0000/g, ''), id: r.id });
  });
  return out;
}
GA.lineMap = lineMap;
GA.buildFile = function (ws, opts) {
  var hat = GA.getFileHat(ws), G = GA.G, ctx = GA.ctx;
  ctx.reset(ws);
  G.isInitialized = true;
  G.STATEMENT_PREFIX = '#@@%1\n';
  var code = '';
  try { var first = hat.getInputTargetBlock('DO'); code = first ? G.blockToCode(first) : ''; }
  finally { G.STATEMENT_PREFIX = null; }
  var L = lineMap(code);
  // fonctions d'aide nécessaires aux blocs « faciles » glissés dans un script
  var helpers = [];
  (function visit() {
    var order = [];
    function v(h) { if (order.indexOf(h) >= 0) return; GA.HELPERS[h].deps.forEach(v); order.push(h); }
    Object.keys(GA.HELPERS).forEach(function (h) { if (ctx.helpers[h]) v(h); });
    helpers = order;
  })();
  var imports = Object.keys(ctx.imports).sort();
  if (helpers.length || imports.length) {
    var text = L.map(function (l) { return l.t; }).join('\n');
    var extra = [];
    imports.forEach(function (m) { if (!new RegExp('^import ' + m + '\\b', 'm').test(text)) extra.push({ t: 'import ' + m, id: null }); });
    helpers.forEach(function (h) { if (text.indexOf('def ' + h + '(') < 0) { extra.push({ t: '', id: null }); extra.push({ t: '', id: null }); GA.HELPERS[h].code.forEach(function (t) { extra.push({ t: t, id: null }); }); } });
    if (extra.length) {
      var at = 0;
      for (var i = 0; i < L.length; i++) { if (/^(import |from )/.test(L[i].t)) at = i + 1; if (/^(def |class )/.test(L[i].t)) break; }
      if (!at) { while (at < L.length && (L[at].t === '' || /^#/.test(L[at].t))) at++; }
      extra.push({ t: '', id: null });
      L = L.slice(0, at).concat(extra, L.slice(at));
    }
  }
  var out = L.map(function (l) { return l.t; }).join('\n') + (L.length ? '\n' : '');
  if (hat.end_ !== undefined && L.length) out = out.replace(/\n$/, '') + hat.end_;
  return { lines: L, code: out, label: hat.getFieldValue('NAME'), menu: '', procName: '', needsImage: false, settings: [],
    helpers: helpers, imports: imports, mode: 'file', py3: !!hat.py3_, bom: !!hat.bom_, eol: hat.eol_ || null };
};
GA.build = function (ws, opts) { return GA.isFileMode(ws) ? GA.buildFile(ws, opts) : GA.buildPython(ws, opts); };

/* ================= vérifications des blocs Python ================= */
var okCache = new Map();
function tryParse(kind, text, py3) {
  var key = kind + '|' + (py3 ? 3 : 2) + '|' + text;
  if (okCache.has(key)) return okCache.get(key);
  var err = null;
  try {
    if (kind === 'expr') PY.parseExpr(text, true);
    else if (kind === 'params') { if (text.trim()) PY.parseParams(text); }
    else if (kind === 'stmt') { var m = PY.parse(text + '\n', { py3: py3 }); if (!m.body.some(function (s) { return s.type !== 'Comment'; })) throw PY.PyError('Instruction vide', 1, 0); }
    else if (kind === 'name') { if (!/^[A-Za-z_\u00C0-\uFFFF][A-Za-z0-9_\u00C0-\uFFFF]*$/.test(text)) throw PY.PyError('Nom invalide (lettres, chiffres, _)', 1, 0); }
  } catch (e) { err = e.isPy ? e.message : String(e.message || e); }
  if (okCache.size > 20000) okCache.clear();
  okCache.set(key, err);
  return err;
}
var REQ = { py_assign: ['V'], py_augassign: ['V'], py_while: ['C'], py_for: ['ITER'], py_binop: ['A', 'B'], py_unary: ['A'], py_ifexp: ['A', 'C', 'B'], py_attr: ['V'], py_index: ['V', 'I'] };
GA.pyChecks = function (ws, add, py3) {
  var hasRaw = false;
  ws.getAllBlocks(false).forEach(function (b) {
    if (!b.isEnabled() || b.isInFlyout || !/^py_/.test(b.type)) return;
    var e;
    function f(kind, field, what) { var v = String(b.getFieldValue(field) || ''); if (kind !== 'expr' || v.trim()) { e = tryParse(kind, v, py3); if (e) add('error', what + ' : ' + e, b.id); } else add('error', what + ' est vide.', b.id); }
    switch (b.type) {
      case 'py_leaf': f('expr', 'CODE', 'Valeur Python invalide'); break;
      case 'py_stmt': f('stmt', 'CODE', 'Instruction Python invalide'); break;
      case 'py_assign': case 'py_augassign': f('expr', 'T', 'Nom de variable invalide'); break;
      case 'py_for': f('expr', 'T', 'Variable de boucle invalide'); break;
      case 'py_def': f('name', 'NAME', 'Nom de fonction'); e = tryParse('params', String(b.getFieldValue('ARGS') || ''), py3); if (e) add('error', 'Paramètres invalides : ' + e, b.id); break;
      case 'py_class': f('name', 'NAME', 'Nom de classe'); break;
      case 'py_attr': f('name', 'NAME', 'Nom d\'attribut'); break;
      case 'py_var': f('name', 'NAME', 'Nom de variable'); break;
      case 'py_decorator': f('expr', 'CODE', 'Décorateur invalide'); break;
      case 'py_callst': case 'py_call': if (!b.f_) f('expr', 'FUNC', 'Nom de fonction invalide'); break;
      case 'py_raw': hasRaw = true; add('warn', 'Code brut : il contient une erreur de syntaxe (déjà présente dans le fichier d\'origine). GIMP ne chargera pas le script tant qu\'elle n\'est pas corrigée.', b.id); break;
      case 'py_try':
        for (var i = 0; i < b.n_; i++) {
          var t = String(b.getFieldValue('T' + i) || '').trim(), nm = String(b.getFieldValue('N' + i) || '').trim();
          if (t) { e = tryParse('expr', t, py3); if (e) add('error', 'Type d\'erreur invalide : ' + e, b.id); }
          if (nm && !t) add('warn', 'Un nom d\'erreur sans type d\'erreur est ignoré.', b.id);
        }
        break;
    }
    (REQ[b.type] || []).forEach(function (n) { if (!b.getInputTargetBlock(n)) add('error', 'Case vide dans ce bloc (elle vaudrait None).', b.id); });
    if (b.type === 'py_if') for (var k = 0; k <= b.n_; k++) if (!b.getInputTargetBlock('C' + k)) add('error', 'Condition vide.', b.id);
    if ((b.type === 'py_callst' || b.type === 'py_call') && b.a_) b.a_.forEach(function (a, j) { if (!b.getInputTargetBlock('A' + j)) add('error', 'Argument vide (vaudrait None).', b.id); });
  });
  return hasRaw;
};
GA.checkFile = function (ws, opts, built) {
  var issues = [];
  function add(level, msg, id) { issues.push({ level: level, msg: msg, id: id || null }); }
  var hat = GA.getFileHat(ws);
  ws.getTopBlocks(false).forEach(function (b) {
    if (b === hat || b.isShadow() || !b.isEnabled()) return;
    add('warn', 'Ce bloc n\'est accroché à rien : il ne sera pas dans le fichier. Glisse-le dans le script.', b.id);
  });
  if (!String(hat.getFieldValue('NAME') || '').trim()) add('error', 'Donne un nom au fichier (en haut du bloc 📄).', hat.id);
  if (!hat.getInputTargetBlock('DO')) add('info', 'Le script est vide : glisse des blocs dans 📄.', hat.id);
  var hasRaw = GA.pyChecks(ws, add, !!hat.py3_);
  hat.getDescendants(false).forEach(function (b) {
    if (b.type === 'g_setting_get' || b.type === 'g_setting_choice') add('error', 'Les réglages 🎛️ n\'existent que dans un plug-in « ▶ Quand je lance ».', b.id);
    if ((b.type === 'g_cur_image' || b.type === 'g_cur_drawable') && !b.isShadow()) add('info', 'Ce bloc utilise la variable « ' + (b.type === 'g_cur_image' ? 'image' : 'drawable') + ' » : elle doit exister à cet endroit du script.', b.id);
  });
  if (built && !hasRaw && !issues.some(function (i) { return i.level === 'error'; })) {
    try { PY.parse(built.code, { py3: !!hat.py3_ }); }
    catch (e) {
      if (e.isPy) { var l = built.lines[(e.pyLine || 1) - 1]; add('error', 'Le code produit est invalide ligne ' + e.pyLine + ' : ' + e.message, l ? l.id : null); }
    }
  }
  return issues;
};
GA.check = function (ws, opts, built) {
  if (GA.isFileMode(ws)) return GA.checkFile(ws, opts, built);
  var issues = GA.checkProgram(ws, opts);
  GA.pyChecks(ws, function (level, msg, id) { issues.push({ level: level, msg: msg, id: id }); }, false);
  return issues;
};

/* vérification d'un aller-retour : même structure Python, mêmes commentaires */
GA.verifyRoundTrip = function (mod, code) {
  var mod2;
  try { mod2 = PY.parse(code, { py3: !!mod.py3 }); } catch (e) { return { ok: false, why: 'le code produit ne s\'analyse pas : ' + e.message }; }
  var same = PY.dump(mod) === PY.dump(mod2);
  var c1 = PY.comments(mod).slice().sort().join('\n'), c2 = PY.comments(mod2).slice().sort().join('\n');
  var stmts = 0;
  (function walk(x) { if (Array.isArray(x)) { x.forEach(walk); return; } if (x && typeof x === 'object') { if (x.type && /^[A-Z]/.test(x.type) && x.type !== 'Comment' && ('body' in x || /^(Assign|AugAssign|Expr|Return|Pass|Break|Continue|Raise|Import|ImportFrom|Global|Nonlocal|Delete|Assert|Exec|Print)$/.test(x.type))) stmts++; for (var k in x) if (typeof x[k] === 'object') walk(x[k]); } })(mod.body);
  return { ok: same && c1 === c2, sameCode: same, sameComments: c1 === c2, statements: stmts, comments: PY.comments(mod).length };
};
})(typeof window !== 'undefined' ? window : globalThis);
