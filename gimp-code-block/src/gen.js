/* Atelier de plug-ins GIMP — générateur, vérifications, boîte à outils */
(function (root) {
'use strict';
var GA = root.GA;
var ORD = GA.ORD;

var SEARCH_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#fff"/>' +
  '<circle cx="10.5" cy="10.5" r="5" fill="none" stroke="#414B60" stroke-width="2.4"/>' +
  '<path d="M14.2 14.2l4.3 4.3" stroke="#414B60" stroke-width="2.6" stroke-linecap="round"/></svg>');

function shade(hex, amt) {
  var h = hex.replace('#', '');
  var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  function f(c) { var v = amt < 0 ? c * (1 + amt) : c + (255 - c) * amt; return Math.max(0, Math.min(255, Math.round(v))); }
  return '#' + [f(r), f(g), f(b)].map(function (c) { return ('0' + c.toString(16)).slice(-2); }).join('');
}
GA.shade = shade;

GA.setup = function (Blockly, DATA) {
  var SIGS = GA.SIGS = DATA.sigs;
  var ENUMS = GA.ENUMS = DATA.enums;
  if (DATA.pyconst) GA.addReserved(DATA.pyconst);
  GA.POPULAR = DATA.popular || [];
  GA.addReserved(['UNIT_PIXEL', 'UNIT_INCH', 'UNIT_MM', 'UNIT_POINT', 'UNIT_PICA', 'TRUE', 'FALSE']);

  /* ----- spécifications ----- */
  var SPECS = GA.SPECS = [];
  GA.defs.forEach(function (fn) {
    fn(GA.D, GA).forEach(function (s) {
      s.args = s.args || {};
      SPECS.push(s);
      GA.SPEC[s.type] = s;
    });
  });
  if (GA.translateSpecs) GA.translateSpecs(SPECS);

  /* ----- thèmes (reconstructibles à chaud : couleurs, police) ----- */
  var themeN = 0;
  GA.rebuildStyles = function () {
    var blockStyles = {}, categoryStyles = {};
    GA.CATS.forEach(function (c) {
      blockStyles['cat_' + c.id] = { colourPrimary: c.colour, colourSecondary: shade(c.colour, 0.35), colourTertiary: shade(c.colour, -0.25) };
      categoryStyles['cat_' + c.id] = { colour: c.colour };
    });
    Object.keys(GA.PY_STYLES || {}).forEach(function (k) {
      var c = GA.PY_STYLES[k];
      blockStyles[k] = { colourPrimary: c, colourSecondary: shade(c, 0.35), colourTertiary: shade(c, -0.25) };
    });
    ['math_blocks', 'text_blocks', 'logic_blocks', 'colour_blocks', 'loop_blocks', 'list_blocks', 'variable_blocks', 'procedure_blocks'].forEach(function (k) {
      blockStyles[k] = blockStyles.cat_ops;
    });
    GA._bs = blockStyles; GA._cs = categoryStyles;
  };
  GA.makeTheme = function (dark) {
    themeN++;
    return Blockly.Theme.defineTheme('atelier-' + themeN, {
      base: Blockly.Themes.Classic,
      blockStyles: GA._bs,
      categoryStyles: GA._cs,
      componentStyles: {
        workspaceBackgroundColour: dark ? '#141626' : '#F5F6FB',
        toolboxBackgroundColour: dark ? '#1B1E31' : '#FFFFFF',
        toolboxForegroundColour: dark ? '#E6E8F5' : '#1E2140',
        flyoutBackgroundColour: dark ? '#23273E' : '#EDEFF8',
        flyoutForegroundColour: dark ? '#C9CDE6' : '#3A3F63',
        flyoutOpacity: 0.97,
        scrollbarColour: dark ? '#5A6090' : '#B7BCD6',
        scrollbarOpacity: 0.6,
        insertionMarkerColour: dark ? '#FFFFFF' : '#1E2140',
        insertionMarkerOpacity: 0.25,
        selectedGlowColour: '#FFC933',
        selectedGlowSize: 0.6,
        replacementGlowColour: '#FFC933',
        cursorColour: '#FFC933'
      },
      fontStyle: { family: GA.FONT_FAMILY || '"Nunito", "Segoe UI", system-ui, sans-serif', weight: '800', size: GA.FONT_SIZE || 11.5 },
      startHats: true
    });
  };
  GA.rebuildStyles();
  GA.themes = { light: GA.makeTheme(false), dark: GA.makeTheme(true) };

  /* ----- définition des blocs Blockly ----- */
  SPECS.forEach(function (spec) {
    if (spec.custom) return;
    var json = GA.specToJson(spec);
    Blockly.Blocks[spec.type] = {
      init: function () {
        this.jsonInit(json);
        if (spec.init) spec.init.call(this, Blockly);
      }
    };
  });
  definePdbBlock(Blockly, 'g_pdb_call', false);
  definePdbBlock(Blockly, 'g_pdb_value', true);

  function shadowForKind(k) {
    if (k === 'image') return { type: 'g_cur_image' };
    if (k === 'drawable' || k === 'layer' || k === 'item' || k === 'layer_mask') return { type: 'g_cur_drawable' };
    if (/^(int32|int16|int8|float|unit)$/.test(k)) return { type: 'math_number', fields: { NUM: 0 } };
    if (k === 'boolean') return { type: 'op_bool', fields: { V: 'TRUE' } };
    if (k === 'string') return { type: 'g_text', fields: { TEXT: '' } };
    if (k === 'color') return { type: 'colour_picker', fields: { COLOUR: '#000000' } };
    return null;
  }
  GA.pdbBlockState = function (type, py) {
    var st = { type: type, extraState: { proc: py } };
    var sig = SIGS[py];
    if (!sig) return st;
    var ins = {};
    sig[4].forEach(function (a, idx) {
      if (a[1] === 'count' || (a[1] === 'enum' && ENUMS[a[5]])) return;
      var sh = shadowForKind(a[1]);
      if (sh) ins['A' + idx] = { shadow: sh };
    });
    if (Object.keys(ins).length) st.inputs = ins;
    return st;
  };
  GA.enumOptions = function (a) {
    var vals = ENUMS[a[5]] || [];
    var out = [];
    vals.forEach(function (v) {
      if (a[6] && a[6].indexOf(v[0]) >= 0) return;
      out.push([(v[0] || String(v[1])) + ' (' + v[1] + ')', v[0] || String(v[1])]);
    });
    return out.length ? out : [['0', '0']];
  };
  function definePdbBlock(Blockly, type, isValue) {
    GA.SPEC[type] = { type: type, cat: 'adv', custom: true, args: {}, out: isValue ? null : undefined,
      msg: isValue ? '⚙️ résultat de la fonction GIMP …' : '⚙️ fonction GIMP …',
      help: isValue
        ? 'Appelle n\'importe laquelle des 857 fonctions de GIMP 2.10 et utilise ce qu\'elle renvoie. Clique sur la loupe pour choisir la fonction.'
        : 'Lance n\'importe laquelle des 857 fonctions de GIMP 2.10. Clique sur la loupe pour choisir : les cases à remplir apparaissent toutes seules.',
      tip: 'Le run_mode n\'est jamais à fournir : GIMP (pygimp) l\'ajoute lui-même. Les compteurs de tableaux sont calculés automatiquement.' };
    Blockly.Blocks[type] = {
      init: function () {
        var self = this;
        this.proc_ = '';
        this.argInputs_ = [];
        this.appendDummyInput('HEAD')
          .appendField(GA.T(isValue ? '⚙️ résultat de' : '⚙️ fonction GIMP'))
          .appendField(new Blockly.FieldImage(SEARCH_SVG, 22, 22, 'choisir', function () { if (GA.onPickProc) GA.onPickProc(self); }))
          .appendField(new Blockly.FieldLabel(GA.T('choisir…')), 'PROC_LBL');
        if (isValue) this.setOutput(true, null);
        else { this.setPreviousStatement(true, 'Action'); this.setNextStatement(true, 'Action'); }
        this.setStyle('cat_adv');
        this.setInputsInline(false);
        this.setTooltip(GA.SPEC[type].help);
      },
      saveExtraState: function () { return this.proc_ ? { proc: this.proc_ } : null; },
      loadExtraState: function (s) { this.setProc((s && s.proc) || '', false); },
      setProc: function (py, withShadows) {
        var self = this;
        this.argInputs_.forEach(function (n) { if (self.getInput(n)) self.removeInput(n); });
        this.argInputs_ = [];
        this.proc_ = SIGS[py] ? py : '';
        this.setFieldValue(this.proc_ || GA.T('choisir…'), 'PROC_LBL');
        var sig = SIGS[this.proc_];
        if (!sig) return;
        sig[4].forEach(function (a, idx) {
          if (a[1] === 'count') return;
          var name = 'A' + idx;
          if (a[1] === 'enum' && ENUMS[a[5]]) {
            self.appendDummyInput(name).appendField(a[0]).appendField(new Blockly.FieldDropdown(GA.enumOptions(a)), 'F' + idx);
          } else {
            var inp = self.appendValueInput(name).appendField(a[0]);
            if (withShadows) {
              var sh = shadowForKind(a[1]);
              if (sh) inp.connection.setShadowState(sh);
            }
          }
          self.argInputs_.push(name);
        });
        this.setTooltip(sig[1] || GA.SPEC[type].help);
      }
    };
  }

  var TEXT_FUNCS = ['_texte(', '_lire_texte(', '_texte_du_calque(', '_joindre_chemin(', '_dossier_de(', '_nom_de_fichier(', '_sans_extension('];
  GA.returnsText = function (c) {
    var ok = TEXT_FUNCS.some(function (f) { return c.indexOf(f) === 0; });
    if (!ok || c.charAt(c.length - 1) !== ')') return false;
    var depth = 0, str = null;
    for (var i = c.indexOf('('); i < c.length; i++) {
      var ch = c.charAt(i);
      if (str) { if (ch === '\\') { i++; continue; } if (ch === str) str = null; continue; }
      if (ch === '"' || ch === "'") { str = ch; continue; }
      if (ch === '(') depth++;
      else if (ch === ')') { depth--; if (depth === 0 && i !== c.length - 1) return false; }
    }
    return depth === 0;
  };

  /* ----- générateur ----- */
  var CG = Blockly.CodeGenerator || Blockly.Generator;
  var G = GA.G = new CG('GimpPy');
  G.INDENT = '    ';
  // indentation : jamais à l'intérieur d'une chaîne multiligne (\u0000), jamais sur une ligne vide
  G.prefixLines = function (text, prefix) {
    return text.split('\n').map(function (l) { return l === '' || l.charAt(0) === '\u0000' ? l : prefix + l; }).join('\n');
  };
  G.scrub_ = function (block, code, thisOnly) {
    var next = block.nextConnection && block.nextConnection.targetBlock();
    var nextCode = thisOnly ? '' : this.blockToCode(next);
    return code + nextCode;
  };
  var ctx = GA.ctx = {
    reset: function (ws) {
      this.ws = ws; this.helpers = {}; this.imports = {}; this.uids = {}; this.varNames = {}; this.usedNames = {};
      this.varOrder = []; this.consts = []; this.settings = {};
    },
    v: function (b, name, order) { return G.valueToCode(b, name, order === undefined ? ORD.NONE : order); },
    obj: function (b, name, order) { return this.v(b, name, order) || 'None'; },
    num: function (b, name, order) { return this.v(b, name, order) || '0'; },
    int: function (b, name) {
      var c = this.v(b, name, ORD.NONE) || '0';
      if (/^-?\d+$/.test(c)) return c;
      return 'int(' + c + ')';
    },
    bool: function (b, name, order) { return this.v(b, name, order) || 'False'; },
    col: function (b, name) { return this.v(b, name, ORD.NONE) || '(0, 0, 0)'; },
    txt: function (b, name) {
      var c = this.v(b, name, ORD.NONE);
      if (!c) return '""';
      if (GA.isPyStrLiteral(c)) return c;
      if (GA.returnsText(c)) return c;
      var tb = b.getInputTargetBlock(name);
      var tsp = tb && GA.SPEC[tb.type];
      if (tsp && tsp.txtOut && (tsp.txtOut === true || tsp.txtOut(tb, this))) return c;
      this.need('_texte');
      return '_texte(' + c + ')';
    },
    list: function (b, name) { return this.v(b, name, ORD.NONE) || '[]'; },
    f: function (b, name) { return b.getFieldValue(name); },
    body: function (b, name) { return G.statementToCode(b, name) || G.INDENT + 'pass\n'; },
    need: function (h) {
      if (this.helpers[h]) return;
      var def = GA.HELPERS[h];
      if (!def) throw new Error('aide inconnue ' + h);
      this.helpers[h] = true;
      var self = this;
      def.deps.forEach(function (d) { self.need(d); });
      def.imports.forEach(function (m) { self.imp(m); });
    },
    imp: function (m) { this.imports[m] = true; },
    uid: function (p) { this.uids[p] = (this.uids[p] || 0) + 1; return '_' + p + this.uids[p]; },
    reserveName: function (n) { this.usedNames[n] = true; },
    var: function (b, name) {
      var id = b.getFieldValue(name);
      var model = this.ws.getVariableById(id);
      var label = model ? model.name : String(id);
      if (this.varNames[id]) return this.varNames[id];
      var base = GA.pyIdent(label, 'variable');
      var n = base;
      if (GA.RESERVED[n] || this.usedNames[n]) {
        var i = 2;
        n = base + '_' + i;
        while (GA.RESERVED[n] || this.usedNames[n]) { i++; n = base + '_' + i; }
      }
      this.usedNames[n] = true;
      this.varNames[id] = n;
      this.varOrder.push(n);
      return n;
    },
    ind: function (code) { return code.split('\n').map(function (l) { return l ? G.INDENT + l : l; }).join('\n'); }
  };

  if (GA.pyInit) GA.pyInit(Blockly, G);
  SPECS.forEach(function (spec) {
    if (!spec.gen) return;
    G.forBlock[spec.type] = function (block) { return spec.gen(block, ctx); };
  });
  G.forBlock.math_number = function (b) {
    var n = Number(b.getFieldValue('NUM'));
    if (!isFinite(n)) n = 0;
    var s = String(n);
    return [s, n < 0 ? ORD.UNARY : ORD.ATOMIC];
  };
  G.forBlock.colour_picker = function (b) { return [GA.hexToTuple(b.getFieldValue('COLOUR')), ORD.ATOMIC]; };
  function pdbGen(b, isValue) {
    var sig = SIGS[b.proc_];
    if (!sig) return isValue ? ['None', ORD.ATOMIC] : '# (fonction GIMP pas encore choisie)\n';
    var codes = [];
    sig[4].forEach(function (a, idx) {
      if (a[1] === 'count') { codes.push(null); return; }
      if (a[1] === 'enum' && ENUMS[a[5]]) { codes.push(b.getFieldValue('F' + idx) || '0'); return; }
      var name = 'A' + idx;
      var c = G.valueToCode(b, name, ORD.NONE);
      if (!c) {
        if (/image|drawable|layer|channel|vectors|item|display|selection|parasite/.test(a[1])) c = 'None';
        else if (a[1] === 'string') c = '""';
        else if (a[1] === 'color') c = '(0, 0, 0)';
        else if (/array/.test(a[1])) c = '[]';
        else c = '0';
      } else if (a[1] === 'string' && !GA.isPyStrLiteral(c)) {
        ctx.need('_texte');
        c = '_texte(' + c + ')';
      }
      codes.push(c);
    });
    for (var i = 0; i < codes.length; i++) if (codes[i] === null) codes[i] = 'len(' + (codes[i + 1] || '[]') + ')';
    var call = 'pdb.' + b.proc_ + '(' + codes.join(', ') + ')';
    return isValue ? [call, ORD.CALL] : call + '\n';
  }
  G.forBlock.g_pdb_call = function (b) { return pdbGen(b, false); };
  G.forBlock.g_pdb_value = function (b) { return pdbGen(b, true); };

  /* ----- lecture du bloc de départ ----- */
  GA.getStart = function (ws) { return ws.getBlocksByType('g_start', false)[0] || null; };
  GA.getSettings = function (ws) {
    var out = [];
    var start = GA.getStart(ws);
    if (!start) return out;
    var b = start.getInputTargetBlock('SETTINGS');
    while (b) {
      if (b.isEnabled() && GA.SPEC[b.type] && GA.SPEC[b.type].kind === 'setting') {
        out.push({ block: b, spec: GA.SPEC[b.type], name: GA.pyIdent(b.getFieldValue('NAME'), 'reglage'), raw: b.getFieldValue('NAME') });
      }
      b = b.getNextBlock();
    }
    return out;
  };

  /* ----- assemblage du fichier Python ----- */
  GA.defaultOpts = function () {
    return { blurb: '', help: '', author: 'Moi', copyright: 'Moi', date: String(new Date().getFullYear()), procName: '',
      menuCustom: '<Image>/Filters/Mes scripts', undo: true, errors: true, context: true, flush: true, extraImports: [], crlf: true, keepBlocks: true };
  };
  GA.procNameFor = function (ws, opts) {
    var start = GA.getStart(ws);
    var label = start ? start.getFieldValue('LABEL') : 'mon script';
    var n = (opts.procName || '').trim();
    if (n) {
      n = GA.translit(n).replace(/[^A-Za-z0-9_-]+/g, '_');
      if (!/^(python[-_]|plug[-_]in[-_]|file[-_]|extension[-_])/.test(n)) n = 'python_fu_' + n;
      return n;
    }
    return 'python_fu_' + GA.pyIdent(label, 'mon_script').toLowerCase();
  };
  GA.menuFor = function (ws, opts) {
    var start = GA.getStart(ws);
    var m = start ? start.getFieldValue('MENU') : '<Image>/Filters/Mes scripts';
    if (m === 'CUSTOM') m = (opts.menuCustom || '<Image>/Filters/Mes scripts').trim();
    return m;
  };

  GA.buildPython = function (ws, opts) {
    opts = opts || GA.defaultOpts();
    var start = GA.getStart(ws);
    ctx.reset(ws);
    G.isInitialized = true;
    var label = start ? (start.getFieldValue('LABEL') || GA.L('Mon script', 'My script')) : GA.L('Mon script', 'My script');
    var needsImage = start ? start.getFieldValue('NEEDS') === 'TRUE' : true;
    var settings = GA.getSettings(ws);
    var params = needsImage ? ['image', 'drawable'] : [];
    params.forEach(function (p) { ctx.reserveName(p); });
    settings.forEach(function (s) {
      var n = s.name;
      if (GA.RESERVED[n]) n = n + '_reglage';
      s.py = n;
      ctx.settings[s.raw] = s;
      ctx.settings[s.name] = s;
      ctx.reserveName(n);
      params.push(n);
    });
    // corps
    G.STATEMENT_PREFIX = '#@@%1\n';
    var body = '';
    try { body = start ? G.statementToCode(start, 'DO') : ''; } finally { G.STATEMENT_PREFIX = null; }
    var bodyLines = [];
    var stack = [];
    body.split('\n').forEach(function (line, bi, barr) {
      if (line === '' && bi === barr.length - 1) return;
      line = line.replace(/\u0001[^\u0002]*\u0002/g, '').replace(/\u0006[^\u0007]*\u0007/g, '').replace(/\u0000/g, '');
      var mm = line.match(/^(\s*)#@@'(.*)'$/);
      if (mm) {
        var ind = mm[1].length;
        while (stack.length && stack[stack.length - 1].ind >= ind) stack.pop();
        stack.push({ ind: ind, id: mm[2] });
        return;
      }
      if (line.trim() !== '') {
        var li = line.length - line.replace(/^\s+/, '').length;
        while (stack.length > 1 && stack[stack.length - 1].ind > li) stack.pop();
      }
      bodyLines.push({ t: line, id: stack.length ? stack[stack.length - 1].id : null });
    });
    // réglages (constantes CHOIX_ + tuples PF_)
    var pfLines = [];
    settings.forEach(function (s) {
      var res = s.spec.pf(s.block, ctx, s.py);
      pfLines.push({ t: '        ' + res.tuple + ',', id: s.block.id });
      if (res.constName) ctx.consts.push({ t: res.constName + ' = ' + res.constValue, id: s.block.id });
    });
    if (opts.errors) ctx.imp('traceback');
    (opts.extraImports || []).forEach(function (m) { ctx.imp(m); });

    var L = [];
    function add(t, id) { L.push({ t: t, id: id || null }); }
    var menu = GA.menuFor(ws, opts);
    var fn = GA.procNameFor(ws, opts).replace(/-/g, '_');
    add('#!/usr/bin/env python');
    add('# -*- coding: utf-8 -*-');
    add('#');
    add('# ' + label + (opts.blurb ? ' - ' + opts.blurb.replace(/\n/g, ' ') : ''));
    add(GA.L('# Plug-in pour GIMP 2.10 (Python 2.7), cree avec GIMP Code Block - Plug-in Maker.', '# Plug-in for GIMP 2.10 (Python 2.7), made with GIMP Code Block - Plug-in Maker.'));
    add(GA.L('# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.', '# Install: copy this file into the GIMP plug-ins folder, then restart GIMP.'));
    add('# Menu : ' + menu.replace(/^<Image>\//, '').replace(/\//g, ' > ') + ' > ' + label);
    add('#');
    add('from gimpfu import *');
    Object.keys(ctx.imports).sort().forEach(function (m) { add('import ' + m); });
    if (ctx.consts.length) {
      add('');
      ctx.consts.forEach(function (c) { add(c.t, c.id); });
    }
    // aides, dans un ordre stable (dépendances d'abord)
    var order = [];
    function visit(h) {
      if (order.indexOf(h) >= 0) return;
      GA.HELPERS[h].deps.forEach(visit);
      order.push(h);
    }
    Object.keys(GA.HELPERS).forEach(function (h) { if (ctx.helpers[h]) visit(h); });
    order.forEach(function (h) {
      add(''); add('');
      GA.HELPERS[h].code.forEach(function (t) { add(t); });
    });
    add(''); add('');
    add('def _actions(' + params.join(', ') + '):');
    add(GA.L('    """Ce que fait le plug-in (genere a partir des blocs)."""', '    """What the plug-in does (generated from the blocks)."""'));
    var seen = {};
    ctx.varOrder.forEach(function (v) { if (!seen[v]) { seen[v] = true; add('    ' + v + ' = None'); } });
    if (bodyLines.length) bodyLines.forEach(function (l) { L.push(l); });
    else add('    pass');
    add(''); add('');
    add('def ' + fn + '(' + params.join(', ') + '):');
    var inner = '_actions(' + params.join(', ') + ')';
    if (needsImage && opts.undo) add('    pdb.gimp_image_undo_group_start(image)');
    if (opts.context) add('    pdb.gimp_context_push()');
    if (opts.errors) {
      add('    try:');
      add('        ' + inner);
      add('    except Exception:');
      add('        pdb.gimp_message(' + GA.pyStr(GA.L('Erreur dans le plug-in « ' + label + ' » :\n', 'Error in the plug-in "' + label + '":\n')) + ' + traceback.format_exc())');
    } else add('    ' + inner);
    if (opts.context) add('    pdb.gimp_context_pop()');
    if (needsImage && opts.undo) add('    pdb.gimp_image_undo_group_end(image)');
    if (opts.flush) add('    gimp.displays_flush()');
    add(''); add('');
    add('register(');
    add('    ' + GA.pyStr(GA.procNameFor(ws, opts)) + ',');
    add('    ' + GA.pyStr(opts.blurb || label) + ',');
    add('    ' + GA.pyStr(opts.help || opts.blurb || label) + ',');
    add('    ' + GA.pyStr(opts.author || 'Moi') + ',');
    add('    ' + GA.pyStr(opts.copyright || opts.author || 'Moi') + ',');
    add('    ' + GA.pyStr(opts.date || '2026') + ',');
    add('    ' + GA.pyStr(label) + ',');
    add('    ' + GA.pyStr(needsImage ? '*' : '') + ',');
    add('    [');
    if (needsImage) {
      add('        (PF_IMAGE, "image", "Image", None),');
      add('        (PF_DRAWABLE, "drawable", ' + GA.pyStr(GA.L('Calque actif', 'Active layer')) + ', None),');
    }
    pfLines.forEach(function (l) { L.push(l); });
    add('    ],');
    add('    [],');
    add('    ' + fn + ',');
    add('    menu=' + GA.pyStr(menu));
    add(')');
    add('');
    add('main()');
    return { lines: L, code: L.map(function (l) { return l.t; }).join('\n') + '\n', label: label, menu: menu,
      procName: GA.procNameFor(ws, opts), needsImage: needsImage, settings: settings, helpers: order,
      imports: Object.keys(ctx.imports).sort() };
  };

  /* ----- vérifications ----- */
  function descendants(block) { return block.getDescendants(false); }
  GA.checkProgram = function (ws, opts) {
    var issues = [];
    function add(level, msg, id) { issues.push({ level: level, msg: msg, id: id || null }); }
    var start = GA.getStart(ws);
    if (!start) { add('error', 'Le bloc « ▶ Quand je lance » a disparu : clique sur « Nouveau » pour repartir.'); return issues; }
    var label = (start.getFieldValue('LABEL') || '').trim();
    if (!label) add('error', 'Donne un nom à ton plug-in dans le bloc ▶ (c\'est le texte affiché dans le menu de GIMP).', start.id);
    var needsImage = start.getFieldValue('NEEDS') === 'TRUE';
    if (start.getFieldValue('MENU') === 'CUSTOM' && !/^<Image>\//.test((opts && opts.menuCustom) || '')) {
      add('error', 'Le menu personnalisé doit commencer par <Image>/ (voir ⚙️ Mon plug-in).', start.id);
    }
    // blocs isolés
    ws.getTopBlocks(false).forEach(function (b) {
      if (b === start || b.isShadow() || !b.isEnabled()) return;
      var sp = GA.SPEC[b.type];
      if (sp && sp.kind === 'setting') add('warn', 'Ce réglage n\'est pas dans « d\'abord, demander » : il sera ignoré.', b.id);
      else add('warn', 'Ce bloc n\'est accroché à rien : il sera ignoré. Glisse-le sous « puis faire ».', b.id);
    });
    // réglages
    var settings = GA.getSettings(ws);
    var names = {};
    settings.forEach(function (s) {
      var raw = (s.raw || '').trim();
      if (!raw) add('error', 'Ce réglage n\'a pas de nom.', s.block.id);
      else if (GA.RESERVED[s.name]) add('error', 'Le nom « ' + s.name + ' » est réservé par Python ou GIMP : choisis-en un autre.', s.block.id);
      if (names[s.name]) add('error', 'Deux réglages portent le même nom « ' + s.name + ' ».', s.block.id);
      names[s.name] = s;
      if (s.spec.check) { var m = s.spec.check(s.block); if (m) add('error', m, s.block.id); }
    });
    var doBlocks = [];
    var first = start.getInputTargetBlock('DO');
    var b0 = first;
    while (b0) { doBlocks = doBlocks.concat(descendants(b0)); b0 = b0.getNextBlock(); }
    var seenIds = {};
    doBlocks = doBlocks.filter(function (b) { if (seenIds[b.id]) return false; seenIds[b.id] = true; return true; });
    if (!first) add('info', 'Ton plug-in ne fait encore rien : glisse des blocs sous « ▶ puis faire ».', start.id);
    var assigned = {}, read = [];
    doBlocks.forEach(function (b) {
      if (!b.isEnabled()) return;
      var sp = GA.SPEC[b.type];
      var target = b.isShadow() ? (b.getParent() || b) : b;
      if ((b.type === 'g_cur_image' || b.type === 'g_cur_drawable') && !needsImage) {
        add('error', 'Ce bloc utilise l\'image ouverte, mais la case « il faut une image ouverte » du bloc ▶ est décochée.', target.id);
      }
      if (b.isShadow() || !sp) return;
      if (b.type === 'g_setting_get' || b.type === 'g_setting_choice') {
        var n = GA.pyIdent(b.getFieldValue('NAME'), 'reglage');
        if (!names[n]) add('error', 'Le réglage « ' + b.getFieldValue('NAME') + ' » n\'existe plus dans « d\'abord, demander ».', b.id);
        else if (b.type === 'g_setting_choice' && names[n].spec.type !== 'set_option') add('error', 'Ce réglage n\'est pas une liste de choix.', b.id);
      }
      if ((b.type === 'g_pdb_call' || b.type === 'g_pdb_value')) {
        if (!b.proc_) add('error', 'Choisis une fonction GIMP en cliquant sur la loupe 🔍.', b.id);
        else if (SIGS[b.proc_]) {
          SIGS[b.proc_][4].forEach(function (a, idx) {
            if (/^(image|drawable|layer|channel|vectors|item|layer_mask)$/.test(a[1]) && !a[4] && !b.getInputTargetBlock('A' + idx)) {
              add('error', 'La case « ' + a[0] + ' » de ' + b.proc_ + ' est vide : GIMP refusera.', b.id);
            }
          });
        }
        if (SIGS[b.proc_] && SIGS[b.proc_][2]) add('info', 'La fonction ' + b.proc_ + ' est ancienne (dépréciée) : elle marche en 2.10' + (SIGS[b.proc_][2] !== '?' ? ', mais ' + SIGS[b.proc_][2] + ' est conseillée.' : '.'), b.id);
      }
      if (b.type === 'adv_py_line' || b.type === 'adv_py_expr') add('info', 'Code Python libre : l\'atelier ne peut pas le vérifier.', b.id);
      if (b.type === 'c_while') {
        var c = b.getInputTargetBlock('C');
        if (c && c.type === 'op_bool' && c.getFieldValue('V') === 'TRUE') add('warn', '« tant que vrai » ne s\'arrête jamais : GIMP resterait bloqué.', b.id);
      }
      for (var k in sp.args) {
        var a = sp.args[k];
        if (a.k === 'v' && a.req && !b.getInputTargetBlock(k)) add('error', 'Il manque quelque chose dans une case vide de ce bloc.', b.id);
        if (a.k === 'var') {
          var vid = b.getFieldValue(k);
          if (b.type === 'g_var_get') read.push({ id: vid, block: b });
          else if (sp.assigns !== false) assigned[vid] = true;
        }
      }
    });
    read.forEach(function (r) {
      if (!assigned[r.id]) {
        var m = ws.getVariableById(r.id);
        add('warn', 'La variable « ' + (m ? m.name : '?') + ' » est lue mais jamais remplie (elle vaudra None).', r.block.id);
      }
    });
    return issues;
  };

  /* ----- boîte à outils ----- */
  GA.toolboxEntry = function (spec) {
    if (spec.box) { var bx = JSON.parse(JSON.stringify(spec.box)); bx.kind = 'block'; return bx; }
    var st = GA.blockState(spec.type);
    st.kind = 'block';
    return st;
  };
  GA.flyoutFor = function (catId) {
    var out = [{ kind: 'label', text: GA.CAT[catId].intro, 'web-class': 'gaIntro' }];
    if (catId === 'adv') {
      out.push({ kind: 'label', text: 'Clique sur 🔍 dans le bloc pour choisir la fonction', 'web-class': 'gaHint' });
      out.push({ kind: 'block', type: 'g_pdb_call' });
      out.push({ kind: 'block', type: 'g_pdb_value' });
    }
    var also = (GA.ALSO && GA.ALSO[catId]) || [], borrowed = [];
    SPECS.forEach(function (s) {
      if (s.hidden || (s.custom && !s.box)) return;
      if (s.cat !== catId) { if ((s.also || []).indexOf(catId) >= 0 || also.indexOf(s.type) >= 0) borrowed.push(GA.toolboxEntry(s)); return; }
      if (s.sep) out.push({ kind: 'label', text: s.sep, 'web-class': 'gaSep' });
      out.push(GA.toolboxEntry(s));
    });
    if (borrowed.length) out = out.concat([{ kind: 'label', text: GA.T('Aussi utiles ici :'), 'web-class': 'gaSep' }], borrowed);
    return out;
  };
  GA.buildToolbox = function () {
    return { kind: 'categoryToolbox', contents: GA.CATS.map(function (c) {
      var cat = { kind: 'category', name: c.name, colour: c.colour, toolboxitemid: 'cat_' + c.id };
      if (c.id === 'start') cat.custom = 'GA_START';
      else if (c.id === 'vars') cat.custom = 'GA_VARS';
      else if (c.id === 'py') cat.custom = 'GA_PY';
      else cat.contents = GA.flyoutFor(c.id);
      return cat;
    }) };
  };
  GA.startFlyout = function (ws) {
    var out = GA.flyoutFor('start');
    var main = ws.targetWorkspace || ws;
    var settings = GA.getSettings(main);
    out.push({ kind: 'label', text: 'Utiliser un réglage dans les actions :', 'web-class': 'gaSep' });
    if (!settings.length) out.push({ kind: 'label', text: '(ajoute d\'abord un réglage dans le bloc ▶)', 'web-class': 'gaHint' });
    settings.forEach(function (s) {
      out.push({ kind: 'block', type: 'g_setting_get', fields: { NAME: s.raw } });
      if (s.spec.type === 'set_option') out.push({ kind: 'block', type: 'g_setting_choice', fields: { NAME: s.raw } });
    });
    return out;
  };
  GA.varsFlyout = function (ws) {
    var main = ws.targetWorkspace || ws;
    var out = [{ kind: 'label', text: GA.CAT.vars.intro, 'web-class': 'gaIntro' },
      { kind: 'button', text: '➕ Créer une variable', callbackkey: 'GA_CREATE_VAR' }];
    var vars = main.getAllVariables().sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (vars.length) {
      var v0 = { id: vars[0].getId() };
      out.push(GA.withVar(GA.toolboxEntry(GA.SPEC.g_var_set), v0));
      out.push(GA.withVar(GA.toolboxEntry(GA.SPEC.g_var_change), v0));
      out.push({ kind: 'label', text: 'Tes variables :', 'web-class': 'gaSep' });
      vars.forEach(function (v) { out.push({ kind: 'block', type: 'g_var_get', fields: { VAR: { id: v.getId() } } }); });
    } else {
      out.push({ kind: 'label', text: '(crée une variable pour voir ses blocs)', 'web-class': 'gaHint' });
    }
    out.push({ kind: 'label', text: 'Listes :', 'web-class': 'gaSep' });
    SPECS.forEach(function (s) {
      if (s.cat === 'vars' && s.list) {
        var e = GA.toolboxEntry(s);
        if (vars.length && s.args.VAR) GA.withVar(e, { id: vars[0].getId() });
        out.push(e);
      }
    });
    return out;
  };
  /* Python : d'abord les variables du script (pastilles orange, comme dans Scratch), puis les blocs */
  GA.pyFlyout = function (ws) {
    var main = ws.targetWorkspace || ws, seen = {}, names = [];
    main.getBlocksByType('py_var', false).forEach(function (b) { var n = b.getFieldValue('NAME'); if (!seen[n]) { seen[n] = 1; names.push(n); } });
    main.getAllBlocks(false).forEach(function (b) {
      if (b.type !== 'py_assign' && b.type !== 'py_for') return;
      String(b.getFieldValue('T') || '').split(/[,()\s]+/).forEach(function (n) { if (/^[A-Za-z_]\w*$/.test(n) && !seen[n]) { seen[n] = 1; names.push(n); } });
    });
    names = names.filter(function (n) { return !GA.isPyConst(n); });
    var out = GA.flyoutFor('py');
    var vars = [{ kind: 'label', text: GA.T('Variables de ton script :'), 'web-class': 'gaSep' }];
    if (!names.length) vars.push({ kind: 'label', text: GA.T('(importe ou écris un script pour voir ses variables)'), 'web-class': 'gaHint' });
    names.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); }).slice(0, 80).forEach(function (n) { vars.push({ kind: 'block', type: 'py_var', fields: { NAME: n } }); });
    return out.slice(0, 1).concat(vars, GA.pyShortcuts(), out.slice(1));
  };
  /* raccourcis GIMP en blocs Python : ce que presque tous les scripts écrivent */
  var PY_SHORTCUTS = [
    ['Tout faire en une seule annulation', 'pdb.gimp_image_undo_group_start(image)\ntry:\n    pass\nfinally:\n    pdb.gimp_image_undo_group_end(image)'],
    ['Remettre couleurs et outils à la fin', 'pdb.gimp_context_push()\ntry:\n    pass\nfinally:\n    pdb.gimp_context_pop()'],
    ['Pour chaque image ouverte (une annulation chacune)', 'for img in reversed(gimp.image_list()):\n    pdb.gimp_image_undo_group_start(img)\n    try:\n        pass\n    finally:\n        pdb.gimp_image_undo_group_end(img)\ngimp.displays_flush()'],
    ['Pour chaque calque de l\'image', 'for layer in image.layers:\n    pass'],
    ['Pour chaque calque de toutes les images', 'for img in reversed(gimp.image_list()):\n    for layer in img.layers:\n        pass'],
    ['Le calque actif', 'layer = pdb.gimp_image_get_active_layer(image)'],
    ['Nouveau calque de la taille de l\'image', 'layer = pdb.gimp_layer_new(image, image.width, image.height, RGBA_IMAGE, "Calque", 100, NORMAL_MODE)\npdb.gimp_image_insert_layer(image, layer, None, 0)'],
    ['Enregistrer la sélection puis la remettre', 'saved = pdb.gimp_selection_save(image)\ntry:\n    pass\nfinally:\n    pdb.gimp_image_select_item(image, CHANNEL_OP_REPLACE, saved)\n    pdb.gimp_image_remove_channel(image, saved)'],
    ['Afficher un message', 'pdb.gimp_message("Bonjour")'],
    ['Rafraîchir l\'affichage', 'gimp.displays_flush()']
  ];
  var pyShortcutCache = null;
  GA.pyShortcuts = function () {
    if (pyShortcutCache) return JSON.parse(JSON.stringify(pyShortcutCache));
    var out = [{ kind: 'label', text: GA.T('⚡ Raccourcis GIMP :'), 'web-class': 'gaSep' }];
    PY_SHORTCUTS.forEach(function (sc) {
      out.push({ kind: 'label', text: GA.T(sc[0]), 'web-class': 'gaHint' });
      var st = GA.pySnippet(sc[1]); st.kind = 'block'; out.push(st);
    });
    pyShortcutCache = out;
    return JSON.parse(JSON.stringify(out));
  };
  GA.withVar = function (entry, v) { entry.fields = entry.fields || {}; entry.fields.VAR = v; return entry; };

  /* ----- recherche ----- */
  function norm(s) { return GA.translit(s).toLowerCase(); }
  GA.search = function (q) {
    q = norm(q).trim();
    if (!q) return [];
    var words = q.split(/\s+/);
    var hits = [];
    SPECS.forEach(function (s) {
      if (s.hidden || (s.custom && !s.box) || s.kind === 'hat') return;
      var hay = norm(GA.titleOf(s) + ' ' + (s.help || '') + ' ' + (s.kw || '') + ' ' + (s.pdb || []).join(' ') + ' ' + GA.CAT[s.cat].name);
      var score = 0;
      var ok = words.every(function (w) { var i = hay.indexOf(w); if (i < 0) return false; score += i < 40 ? 3 : 1; return true; });
      if (ok) hits.push({ s: s, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    var out = [{ kind: 'label', text: hits.length + ' bloc(s) trouvé(s) pour « ' + q + ' »', 'web-class': 'gaIntro' }];
    hits.slice(0, 40).forEach(function (h) { out.push(GA.toolboxEntry(h.s)); });
    var pdbHits = Object.keys(SIGS).filter(function (k) {
      var hay = norm(k + ' ' + SIGS[k][1]);
      return words.every(function (w) { return hay.indexOf(w.replace(/-/g, '_')) >= 0; });
    }).slice(0, 8);
    if (pdbHits.length) {
      out.push({ kind: 'label', text: 'Fonctions GIMP (avancé) :', 'web-class': 'gaSep' });
      pdbHits.forEach(function (k) {
        var st = GA.pdbBlockState(SIGS[k][5].length ? 'g_pdb_value' : 'g_pdb_call', k);
        st.kind = 'block';
        out.push(st);
      });
    }
    return out;
  };

  GA.helpFor = function (block) {
    var sp = GA.SPEC[block.type];
    if (!sp) return null;
    var title = sp.title || GA.titleOf(sp);
    var pdbList = (sp.pdb || []).slice();
    if (block.proc_) { title = block.proc_; pdbList = [block.proc_]; }
    return { title: title, cat: GA.CAT[sp.cat], help: sp.help, tip: sp.tip, pdb: pdbList, spec: sp };
  };
  return GA;
};
})(typeof window !== 'undefined' ? window : globalThis);
