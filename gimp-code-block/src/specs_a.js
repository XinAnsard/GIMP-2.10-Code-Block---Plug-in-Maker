/* Blocs : démarrer, réglages, contrôle, calculs, variables */
(function (root) {
'use strict';
root.GA.defs.push(function (D, GA) {
  var O = GA.ORD, S = GA.pyStr;
  function fmtFloat(n) { var s = String(Number(n) || 0); if (!/[.e]/.test(s)) s += '.0'; return s; }
  function fmtInt(n) { return String(Math.round(Number(n) || 0)); }
  function nameField(block) {
    var f = block.getField('NAME');
    if (f) f.setValidator(function (v) { return GA.pyIdent(v, 'reglage'); });
  }
  function setting(type, icon, what, extraMsg, extraArgs, pf, help, check) {
    var args = { NAME: D.TXT(type.replace('set_', '')), LABEL: D.TXT('') };
    for (var k in extraArgs) args[k] = extraArgs[k];
    return { type: type, cat: 'start', kind: 'setting', msg: icon + ' ' + what + ' nommé %NAME %BR question %LABEL ' + extraMsg,
      args: args, pf: pf, help: help, check: check, init: function () { nameField(this); },
      tip: 'Dans tes actions, utilise ce réglage avec le bloc « 🎛️ nom » (catégorie ▶ Démarrer & réglages).' };
  }
  function lbl(b, py) { return S(b.getFieldValue('LABEL') || py); }

  return [
    /* ===== bloc de départ ===== */
    { type: 'g_start', cat: 'start', kind: 'hat', hidden: true, inline: true,
      msg: '▶ Quand je lance %LABEL %BR depuis le menu %MENU %BR %NEEDS il faut une image ouverte %BR 🎛️ d\'abord, demander : %SETTINGS ▶ puis faire : %DO',
      args: { LABEL: D.TXT('Mon script'), MENU: D.DD(GA.MENUS), NEEDS: D.CB(true), SETTINGS: D.ST('Setting'), DO: D.ST() },
      title: '▶ Quand je lance…',
      help: 'Le point de départ de ton plug-in. Le nom apparaîtra dans le menu de GIMP. Mets les réglages (la petite fenêtre qui s\'ouvre au lancement) dans « d\'abord, demander », et tes actions dans « puis faire ».',
      tip: 'Décoche « il faut une image ouverte » si ton plug-in ouvre lui-même ses fichiers (il sera alors utilisable sans image).',
      init: function () { this.setDeletable(false); } },

    /* ===== réglages (fenêtre de GIMP) ===== */
    setting('set_int', '🔢', 'nombre entier', 'par défaut %DEF', { DEF: D.NUMF(10, null, null, 1) },
      function (b, c, py) { return { tuple: '(PF_INT, ' + S(py) + ', ' + lbl(b, py) + ', ' + fmtInt(b.getFieldValue('DEF')) + ')' }; },
      'Demande un nombre entier (sans virgule) à l\'utilisateur.'),
    setting('set_float', '🔢', 'nombre à virgule', 'par défaut %DEF', { DEF: D.NUMF(1.5) },
      function (b, c, py) { return { tuple: '(PF_FLOAT, ' + S(py) + ', ' + lbl(b, py) + ', ' + fmtFloat(b.getFieldValue('DEF')) + ')' }; },
      'Demande un nombre décimal (ex. 1.5).'),
    setting('set_spinner', '🔼', 'nombre avec flèches', '%BR de %MIN à %MAX pas %STEP par défaut %DEF',
      { MIN: D.NUMF(1, null, null, 1), MAX: D.NUMF(100, null, null, 1), STEP: D.NUMF(1, 1, null, 1), DEF: D.NUMF(5, null, null, 1) },
      function (b, c, py) {
        return { tuple: '(PF_SPINNER, ' + S(py) + ', ' + lbl(b, py) + ', ' + fmtInt(b.getFieldValue('DEF')) + ', (' +
          fmtInt(b.getFieldValue('MIN')) + ', ' + fmtInt(b.getFieldValue('MAX')) + ', ' + fmtInt(b.getFieldValue('STEP')) + '))' };
      },
      'Un nombre entier avec des petites flèches ▲▼, entre un minimum et un maximum.',
      function (b) {
        var mi = Number(b.getFieldValue('MIN')), ma = Number(b.getFieldValue('MAX')), d = Number(b.getFieldValue('DEF'));
        if (mi >= ma) return 'Le minimum doit être plus petit que le maximum.';
        if (d < mi || d > ma) return 'La valeur par défaut doit être entre le minimum et le maximum.';
        return '';
      }),
    setting('set_slider', '🎚️', 'curseur', '%BR de %MIN à %MAX pas %STEP par défaut %DEF',
      { MIN: D.NUMF(0), MAX: D.NUMF(100), STEP: D.NUMF(1, 0.001), DEF: D.NUMF(50) },
      function (b, c, py) {
        return { tuple: '(PF_SLIDER, ' + S(py) + ', ' + lbl(b, py) + ', ' + fmtFloat(b.getFieldValue('DEF')) + ', (' +
          fmtFloat(b.getFieldValue('MIN')) + ', ' + fmtFloat(b.getFieldValue('MAX')) + ', ' + fmtFloat(b.getFieldValue('STEP')) + '))' };
      },
      'Un curseur qu\'on fait glisser. Il accepte les nombres à virgule.',
      function (b) {
        var mi = Number(b.getFieldValue('MIN')), ma = Number(b.getFieldValue('MAX')), d = Number(b.getFieldValue('DEF'));
        if (mi >= ma) return 'Le minimum doit être plus petit que le maximum.';
        if (d < mi || d > ma) return 'La valeur par défaut doit être entre le minimum et le maximum.';
        return '';
      }),
    setting('set_toggle', '☑️', 'case à cocher', 'cochée au départ %DEF', { DEF: D.CB(true) },
      function (b, c, py) { return { tuple: '(PF_TOGGLE, ' + S(py) + ', ' + lbl(b, py) + ', ' + (b.getFieldValue('DEF') === 'TRUE' ? 'True' : 'False') + ')' }; },
      'Une case oui/non. Dans tes actions elle vaut vrai ou faux : parfait pour un bloc « si ».'),
    setting('set_string', '🔤', 'texte court', 'par défaut %DEF', { DEF: D.TXT('Bonjour') },
      function (b, c, py) { return { tuple: '(PF_STRING, ' + S(py) + ', ' + lbl(b, py) + ', ' + S(b.getFieldValue('DEF')) + ')' }; },
      'Demande une ligne de texte (un nom de calque, un préfixe…).'),
    setting('set_text', '📝', 'texte long', 'par défaut %DEF', { DEF: D.TXT('') },
      function (b, c, py) { return { tuple: '(PF_TEXT, ' + S(py) + ', ' + lbl(b, py) + ', ' + S(b.getFieldValue('DEF')) + ')' }; },
      'Une grande zone de texte sur plusieurs lignes.'),
    setting('set_option', '📋', 'liste de choix', '%BR choix (séparés par ;) %OPTS choisi au départ n° %DEF',
      { OPTS: D.TXT('Choix 1; Choix 2; Choix 3'), DEF: D.NUMF(1, 1, null, 1) },
      function (b, c, py) {
        var opts = String(b.getFieldValue('OPTS') || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!opts.length) opts = ['Choix 1'];
        var idx = Math.max(0, Math.min(opts.length - 1, Math.round(Number(b.getFieldValue('DEF')) || 1) - 1));
        var cn = 'CHOIX_' + py.toUpperCase();
        return { tuple: '(PF_OPTION, ' + S(py) + ', ' + lbl(b, py) + ', ' + idx + ', ' + cn + ')', constName: cn,
          constValue: '(' + opts.map(S).join(', ') + (opts.length === 1 ? ',' : '') + ')' };
      },
      'Un menu déroulant. Dans tes actions, le réglage vaut le NUMÉRO du choix (0 pour le premier) ; le bloc « texte choisi dans » donne le texte.',
      function (b) {
        var opts = String(b.getFieldValue('OPTS') || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!opts.length) return 'Écris au moins un choix (séparés par des ;).';
        var d = Number(b.getFieldValue('DEF'));
        if (d < 1 || d > opts.length) return 'Le choix de départ doit être entre 1 et ' + opts.length + '.';
        return '';
      }),
    setting('set_color', '🎨', 'couleur', 'par défaut %DEF', { DEF: D.COLF('#000000') },
      function (b, c, py) { return { tuple: '(PF_COLOR, ' + S(py) + ', ' + lbl(b, py) + ', ' + GA.hexToTuple(b.getFieldValue('DEF')) + ')' }; },
      'Un bouton de couleur. Le réglage s\'utilise partout où un bloc attend une couleur.'),
    setting('set_font', '🅰️', 'police', 'par défaut %DEF', { DEF: D.TXT('Sans') },
      function (b, c, py) { return { tuple: '(PF_FONT, ' + S(py) + ', ' + lbl(b, py) + ', ' + S(b.getFieldValue('DEF')) + ')' }; },
      'Un sélecteur de police de caractères.'),
    setting('set_file', '📄', 'fichier à choisir', '', {},
      function (b, c, py) { return { tuple: '(PF_FILE, ' + S(py) + ', ' + lbl(b, py) + ', "")' }; },
      'Un bouton pour choisir un fichier (texte, image…). Le réglage vaut le chemin complet du fichier.'),
    setting('set_dir', '📁', 'dossier à choisir', '', {},
      function (b, c, py) { return { tuple: '(PF_DIRNAME, ' + S(py) + ', ' + lbl(b, py) + ', "")' }; },
      'Un bouton pour choisir un dossier.'),
    setting('set_layer', '📑', 'calque à choisir', '', {},
      function (b, c, py) { return { tuple: '(PF_LAYER, ' + S(py) + ', ' + lbl(b, py) + ', None)' }; },
      'Une liste des calques de l\'image, pour en choisir un.'),
    setting('set_vectors', '〰️', 'chemin à choisir', '', {},
      function (b, c, py) { return { tuple: '(PF_VECTORS, ' + S(py) + ', ' + lbl(b, py) + ', None)' }; },
      'Une liste des chemins de l\'image, pour en choisir un.'),
    { type: 'g_setting_get', txtOut: function (b, c) { var s = c.settings[b.getFieldValue('NAME')]; return !!s && ['set_string', 'set_text', 'set_font', 'set_file', 'set_dir'].indexOf(s.spec.type) >= 0; }, cat: 'start', hidden: true, out: null, msg: '🎛️ %NAME', args: { NAME: D.LBL('reglage') },
      help: 'La valeur que l\'utilisateur a choisie dans la fenêtre de réglages.',
      gen: function (b, c) { var raw = b.getFieldValue('NAME'); var s = c.settings[raw] || c.settings[GA.pyIdent(raw, 'reglage')]; return [s ? s.py : GA.pyIdent(raw, 'reglage'), O.ATOMIC]; } },
    { type: 'g_setting_choice', txtOut: true, cat: 'start', hidden: true, out: ['String'], msg: 'texte choisi dans 🎛️ %NAME', args: { NAME: D.LBL('reglage') },
      help: 'Le texte du choix sélectionné dans une liste de choix (au lieu de son numéro).',
      gen: function (b, c) { var raw = b.getFieldValue('NAME'); var s = c.settings[raw] || c.settings[GA.pyIdent(raw, 'reglage')]; var py = s ? s.py : GA.pyIdent(raw, 'reglage'); return ['CHOIX_' + py.toUpperCase() + '[' + py + ']', O.MEMBER]; } },

    /* ===== contrôle ===== */
    { type: 'c_repeat', cat: 'control', msg: 'répéter %N fois %DO', args: { N: D.NUM(10), DO: D.ST() },
      help: 'Refait les blocs placés à l\'intérieur, le nombre de fois indiqué.', kw: 'boucle repeter fois',
      gen: function (b, c) { return 'for ' + c.uid('tour') + ' in range(' + c.int(b, 'N') + '):\n' + c.body(b, 'DO'); } },
    { type: 'c_for', cat: 'control', msg: 'compter avec %VAR de %A à %B par pas de %S %DO', args: { VAR: D.VAR('i'), A: D.NUM(1), B: D.NUM(10), S: D.NUM(1), DO: D.ST() },
      help: 'Comme « répéter », mais la variable prend chaque valeur : 1, 2, 3… Pratique pour numéroter.', kw: 'boucle pour numero compteur',
      gen: function (b, c) { c.need('_compter'); return 'for ' + c.var(b, 'VAR') + ' in _compter(' + c.num(b, 'A') + ', ' + c.num(b, 'B') + ', ' + c.num(b, 'S') + '):\n' + c.body(b, 'DO'); } },
    { type: 'c_foreach_layer', cat: 'control', sep: 'Parcourir', msg: 'pour chaque calque %VAR de %IMG %BR %REC chercher aussi dans les groupes %GRP compter aussi les groupes %DO',
      args: { VAR: D.VAR('calque'), IMG: D.IMGL(), REC: D.CB(true), GRP: D.CB(false), DO: D.ST() },
      help: 'Passe sur tous les calques de l\'image (ou d\'un groupe), un par un. À chaque tour, la variable contient le calque en cours.', kw: 'boucle tous les calques groupe recursif',
      gen: function (b, c) { c.need('_liste_calques'); return 'for ' + c.var(b, 'VAR') + ' in _liste_calques(' + c.obj(b, 'IMG') + ', ' + (c.f(b, 'REC') === 'TRUE' ? 'True' : 'False') + ', ' + (c.f(b, 'GRP') === 'TRUE' ? 'True' : 'False') + '):\n' + c.body(b, 'DO'); } },
    { type: 'c_foreach_image', cat: 'control', msg: 'pour chaque image ouverte %VAR %BR (dans l\'ordre d\'ouverture) %DO', args: { VAR: D.VAR('img'), DO: D.ST() },
      help: 'Passe sur toutes les images ouvertes dans GIMP, de la première ouverte à la dernière.', kw: 'toutes les images ouvertes lot',
      tip: 'GIMP range sa liste d\'images à l\'envers : le bloc la remet dans l\'ordre d\'ouverture, comme dans tes plug-ins.',
      gen: function (b, c) { return 'for ' + c.var(b, 'VAR') + ' in list(reversed(gimp.image_list())):\n' + c.body(b, 'DO'); } },
    { type: 'c_foreach_path', cat: 'control', msg: 'pour chaque chemin %VAR de %IMG %DO', args: { VAR: D.VAR('chemin'), IMG: D.IMG(), DO: D.ST() },
      help: 'Passe sur tous les chemins (tracés) de l\'image.', tip: 'GIMP renvoie des numéros (ID entiers) : le bloc les transforme en vrais chemins avec gimp._id2vectors.', pdb: ['gimp-image-get-vectors'],
      gen: function (b, c) { var id = c.uid('id'); return 'for ' + id + ' in pdb.gimp_image_get_vectors(' + c.obj(b, 'IMG') + ')[1]:\n' + GA.G.INDENT + c.var(b, 'VAR') + ' = gimp._id2vectors(' + id + ')\n' + c.body(b, 'DO'); } },
    { type: 'c_foreach_point', cat: 'control', msg: 'pour chaque point %VAR du chemin %V %DO', args: { VAR: D.VAR('point'), V: D.VEC(), DO: D.ST() },
      help: 'Passe sur chaque point d\'ancrage d\'un chemin. Utilise « x du point » et « y du point » (catégorie Chemins).', pdb: ['gimp-vectors-get-strokes', 'gimp-vectors-stroke-get-points'],
      gen: function (b, c) { c.need('_points_du_chemin'); return 'for ' + c.var(b, 'VAR') + ' in _points_du_chemin(' + c.obj(b, 'V') + '):\n' + c.body(b, 'DO'); } },
    { type: 'c_foreach_list', cat: 'control', msg: 'pour chaque élément %VAR de la liste %L %DO', args: { VAR: D.VAR('element'), L: D.LIST(), DO: D.ST() },
      help: 'Passe sur chaque élément d\'une liste (lignes d\'un fichier, textes découpés, calques…).',
      gen: function (b, c) { return 'for ' + c.var(b, 'VAR') + ' in ' + c.list(b, 'L') + ':\n' + c.body(b, 'DO'); } },
    { type: 'c_foreach_file', cat: 'control', msg: 'pour chaque fichier %VAR du dossier %DIR %BR se terminant par %EXT %DO', args: { VAR: D.VAR('fichier'), DIR: D.STR(''), EXT: D.STR('.png'), DO: D.ST() },
      help: 'Passe sur les fichiers d\'un dossier (triés par nom). Laisse la fin vide pour prendre tous les fichiers.', kw: 'dossier fichiers lot',
      gen: function (b, c) { c.need('_fichiers_du_dossier'); return 'for ' + c.var(b, 'VAR') + ' in _fichiers_du_dossier(' + c.txt(b, 'DIR') + ', ' + c.txt(b, 'EXT') + '):\n' + c.body(b, 'DO'); } },
    { type: 'c_if', cat: 'control', sep: 'Choisir', msg: 'si %C alors %DO', args: { C: D.BOOL(), DO: D.ST() },
      help: 'Fait les blocs à l\'intérieur seulement si la condition (bloc hexagonal) est vraie.', kw: 'condition test',
      gen: function (b, c) { return 'if ' + c.bool(b, 'C') + ':\n' + c.body(b, 'DO'); } },
    { type: 'c_ifelse', cat: 'control', msg: 'si %C alors %DO sinon %ELSE', args: { C: D.BOOL(), DO: D.ST(), ELSE: D.ST() },
      help: 'Si la condition est vraie, fait la première partie ; sinon, fait la seconde.', kw: 'condition test sinon',
      gen: function (b, c) { return 'if ' + c.bool(b, 'C') + ':\n' + c.body(b, 'DO') + 'else:\n' + c.body(b, 'ELSE'); } },
    { type: 'c_while', cat: 'control', msg: 'tant que %C %DO', args: { C: D.BOOL(), DO: D.ST() },
      help: 'Recommence tant que la condition est vraie.', tip: 'Attention : si la condition reste toujours vraie, GIMP reste bloqué.', kw: 'boucle tant que',
      gen: function (b, c) { return 'while ' + c.bool(b, 'C') + ':\n' + c.body(b, 'DO'); } },
    { type: 'c_try', cat: 'control', msg: 'essayer %DO si ça échoue %ERR', args: { DO: D.ST(), ERR: D.ST() },
      help: 'Essaie les blocs du haut ; si GIMP signale une erreur, fait ceux du bas au lieu d\'arrêter le plug-in.', kw: 'erreur exception',
      gen: function (b, c) { return 'try:\n' + c.body(b, 'DO') + 'except Exception:\n' + c.body(b, 'ERR'); } },
    { type: 'c_stop', cat: 'control', cap: true, msg: '⏹ arrêter le plug-in ici', args: {},
      help: 'Arrête tout de suite les actions. Rien après ce bloc ne sera fait (l\'annulation et les couleurs sont quand même remises en ordre).', kw: 'stop fin quitter',
      gen: function () { return 'return\n'; } },
    { type: 'c_wait', cat: 'control', msg: 'attendre %S secondes', args: { S: D.NUM(0.5) },
      help: 'Fait une pause.', gen: function (b, c) { c.imp('time'); return 'time.sleep(' + c.num(b, 'S') + ')\n'; } },
    { type: 'c_comment', cat: 'control', msg: '📝 note : %TXT', args: { TXT: D.TXT('explication') },
      help: 'Une note pour toi : elle devient un commentaire # dans le code et ne fait rien.', kw: 'commentaire',
      gen: function (b) { return '# ' + String(b.getFieldValue('TXT') || '').replace(/[\r\n]+/g, ' ') + '\n'; } },

    /* ===== calculs & texte ===== */
    { type: 'g_value', cat: 'ops', hidden: true, out: null, msg: '%TEXT', args: { TEXT: D.TXT('') },
      help: 'Une valeur : un nombre si tu tapes un nombre, sinon du texte.',
      gen: function (b) { var t = b.getFieldValue('TEXT'); if (/^-?\d+(\.\d+)?$/.test(t)) return [t, t.charAt(0) === '-' ? O.UNARY : O.ATOMIC]; return [S(t), O.ATOMIC]; } },
    { type: 'g_text', txtOut: true, cat: 'ops', hidden: true, out: ['String'], msg: '%TEXT', args: { TEXT: D.TXT('') },
      help: 'Un texte.', gen: function (b) { return [S(b.getFieldValue('TEXT')), O.ATOMIC]; } },
    { type: 'math_number', cat: 'ops', custom: true, hidden: true, args: {}, msg: 'nombre', help: 'Un nombre. Clique dessus pour le changer.' },
    { type: 'colour_picker', cat: 'paint', custom: true, hidden: true, args: {}, msg: 'couleur', help: 'Une couleur. Clique dessus pour en choisir une autre.' },
    { type: 'op_arith', cat: 'ops', out: ['Number'], sep: 'Nombres', msg: '%A %OP %B',
      args: { A: D.NUM(1), OP: D.DD([['+', 'ADD'], ['−', 'SUB'], ['×', 'MUL'], ['÷', 'DIV'], ['reste de la division par', 'MOD'], ['puissance', 'POW']]), B: D.NUM(1) },
      help: 'Un calcul entre deux nombres. La division ÷ donne toujours un résultat à virgule (5 ÷ 2 = 2.5).', kw: 'plus moins fois divise calcul addition',
      gen: function (b, c) {
        var op = c.f(b, 'OP');
        if (op === 'DIV') return ['float(' + c.num(b, 'A') + ') / ' + c.num(b, 'B', O.MUL), O.MUL];
        if (op === 'POW') return [c.num(b, 'A', O.EXP) + ' ** ' + c.num(b, 'B', O.EXP), O.EXP];
        var m = { ADD: [' + ', O.ADD], SUB: [' - ', O.ADD], MUL: [' * ', O.MUL], MOD: [' % ', O.MUL] }[op];
        return [c.num(b, 'A', m[1]) + m[0] + c.num(b, 'B', m[1] - 0.5), m[1]];
      } },
    { type: 'op_round', cat: 'ops', out: ['Number'], msg: '%OP de %X', args: { OP: D.DD([['arrondi', 'ROUND'], ['arrondi au-dessus', 'CEIL'], ['arrondi au-dessous', 'FLOOR'], ['valeur absolue', 'ABS'], ['racine carrée', 'SQRT']]), X: D.NUM(2.5) },
      help: 'Arrondit un nombre, ou calcule sa valeur absolue / sa racine carrée.',
      gen: function (b, c) {
        var op = c.f(b, 'OP'), x = c.num(b, 'X');
        if (op === 'ROUND') return ['int(round(' + x + '))', O.CALL];
        if (op === 'ABS') return ['abs(' + x + ')', O.CALL];
        c.imp('math');
        if (op === 'SQRT') return ['math.sqrt(' + x + ')', O.CALL];
        return ['int(math.' + (op === 'CEIL' ? 'ceil' : 'floor') + '(' + x + '))', O.CALL];
      } },
    { type: 'op_random', cat: 'ops', out: ['Number'], msg: 'nombre au hasard entre %A et %B', args: { A: D.NUM(1), B: D.NUM(10) },
      help: 'Un nombre entier tiré au hasard (bornes comprises).', gen: function (b, c) { c.imp('random'); return ['random.randint(' + c.int(b, 'A') + ', ' + c.int(b, 'B') + ')', O.CALL]; } },
    { type: 'op_compare', cat: 'ops', out: ['Boolean'], sep: 'Conditions', msg: '%A %OP %B',
      args: { A: D.ANY(''), OP: D.DD([['=', '=='], ['≠', '!='], ['<', '<'], ['≤', '<='], ['>', '>'], ['≥', '>=']]), B: D.ANY('50') },
      help: 'Compare deux valeurs. Vrai ou faux.', kw: 'egal plus grand plus petit comparaison',
      gen: function (b, c) { return [c.obj(b, 'A', O.REL - 0.5) + ' ' + c.f(b, 'OP') + ' ' + c.obj(b, 'B', O.REL - 0.5), O.REL]; } },
    { type: 'op_logic', cat: 'ops', out: ['Boolean'], msg: '%A %OP %B', args: { A: D.BOOL(), OP: D.DD([['et', 'and'], ['ou', 'or']]), B: D.BOOL() },
      help: '« et » : vrai si les deux sont vrais. « ou » : vrai si au moins un est vrai.',
      gen: function (b, c) { var op = c.f(b, 'OP'); var o = op === 'and' ? O.AND : O.OR; return [c.bool(b, 'A', o) + ' ' + op + ' ' + c.bool(b, 'B', o), o]; } },
    { type: 'op_not', cat: 'ops', out: ['Boolean'], msg: 'non %A', args: { A: D.BOOL() },
      help: 'Inverse une condition : vrai devient faux, faux devient vrai.', gen: function (b, c) { return ['not ' + c.bool(b, 'A', O.NOT), O.NOT]; } },
    { type: 'op_bool', cat: 'ops', out: ['Boolean'], msg: '%V', args: { V: D.DD([['vrai', 'TRUE'], ['faux', 'FALSE']]) },
      help: 'La valeur vrai ou faux.', gen: function (b) { return [b.getFieldValue('V') === 'TRUE' ? 'True' : 'False', O.ATOMIC]; } },
    { type: 'op_exists', cat: 'ops', out: ['Boolean'], msg: '%X existe', args: { X: D.OBJ() },
      help: 'Vrai si la valeur existe vraiment. Par exemple « calque nommé … » renvoie « rien » quand le calque n\'existe pas.', kw: 'none vide trouve',
      gen: function (b, c) { return ['(' + c.obj(b, 'X') + ' is not None)', O.ATOMIC]; } },
    { type: 'op_join', txtOut: true, cat: 'ops', out: ['String'], sep: 'Texte', msg: 'regrouper %A et %B', args: { A: D.ANY('Calque '), B: D.ANY('1') },
      help: 'Colle deux morceaux de texte (ou un texte et un nombre) : « Calque » + 1 → « Calque 1 ».', kw: 'joindre concatener coller',
      gen: function (b, c) { return [c.txt(b, 'A') + ' + ' + c.txt(b, 'B'), O.ADD]; } },
    { type: 'op_contains', cat: 'ops', out: ['Boolean'], msg: '%A contient %B %BR %CASE sans tenir compte des majuscules', args: { A: D.ANY('Bonjour'), B: D.ANY('jour'), CASE: D.CB(true) },
      help: 'Vrai si le texte contient le morceau cherché.', kw: 'chercher trouver dans nom',
      gen: function (b, c) { c.need('_contient'); return ['_contient(' + c.obj(b, 'A') + ', ' + c.obj(b, 'B') + ', ' + (c.f(b, 'CASE') === 'TRUE' ? 'True' : 'False') + ')', O.CALL]; } },
    { type: 'op_length', cat: 'ops', out: ['Number'], msg: 'longueur de %A', args: { A: D.ANY('Bonjour') },
      help: 'Le nombre de lettres d\'un texte.', gen: function (b, c) { return ['len(' + c.txt(b, 'A') + '.decode("utf-8"))', O.CALL]; } },
    { type: 'op_case', txtOut: true, cat: 'ops', out: ['String'], msg: '%A en %OP', args: { A: D.ANY('Bonjour'), OP: D.DD([['MAJUSCULES', 'upper'], ['minuscules', 'lower'], ['Chaque Mot Avec Majuscule', 'title'], ['Première lettre en majuscule', 'capitalize']]) },
      help: 'Change les majuscules/minuscules d\'un texte (les accents sont bien gérés).', kw: 'majuscule minuscule casse',
      gen: function (b, c) { return [c.txt(b, 'A') + '.decode("utf-8").' + c.f(b, 'OP') + '().encode("utf-8")', O.MEMBER]; } },
    { type: 'op_replace', txtOut: true, cat: 'ops', out: ['String'], msg: 'remplacer %A par %B dans %T', args: { A: D.ANY('a'), B: D.ANY('b'), T: D.ANY('texte') },
      help: 'Remplace chaque morceau de texte par un autre.', gen: function (b, c) { return [c.txt(b, 'T') + '.replace(' + c.txt(b, 'A') + ', ' + c.txt(b, 'B') + ')', O.MEMBER]; } },
    { type: 'op_strip', txtOut: true, cat: 'ops', out: ['String'], msg: '%T sans les espaces autour', args: { T: D.ANY(' texte ') },
      help: 'Retire les espaces et retours à la ligne au début et à la fin.', gen: function (b, c) { return [c.txt(b, 'T') + '.strip()', O.MEMBER]; } },
    { type: 'op_split', cat: 'ops', out: ['Array'], msg: 'découper %T à chaque %SEP', args: { T: D.ANY('a;b;c'), SEP: D.STR('[breaker]') },
      help: 'Coupe un texte en morceaux et donne la liste des morceaux (ex. les bulles séparées par [breaker]).', kw: 'separer liste breaker',
      gen: function (b, c) { return [c.txt(b, 'T') + '.split(' + c.txt(b, 'SEP') + ')', O.MEMBER]; } },
    { type: 'op_isdigit', cat: 'ops', out: ['Boolean'], msg: '%T est un nombre entier', args: { T: D.ANY('42') },
      help: 'Vrai si le texte ne contient que des chiffres (ex. « 42 »).', gen: function (b, c) { return [c.txt(b, 'T') + '.strip().isdigit()', O.MEMBER]; } },
    { type: 'op_to_number', cat: 'ops', out: ['Number'], msg: 'nombre écrit dans %T', args: { T: D.ANY('12') },
      help: 'Transforme un texte comme « 12 » ou « 3,5 » en vrai nombre pour faire des calculs.', gen: function (b, c) { c.need('_nombre'); return ['_nombre(' + c.obj(b, 'T') + ')', O.CALL]; } },
    { type: 'op_to_text', txtOut: true, cat: 'ops', out: ['String'], msg: 'texte de %X', args: { X: D.ANY('12') },
      help: 'Transforme n\'importe quelle valeur en texte.', gen: function (b, c) { c.need('_texte'); return ['_texte(' + c.obj(b, 'X') + ')', O.CALL]; } },
    { type: 'op_regex', cat: 'ops', out: ['Boolean'], msg: '%T correspond au motif %P', args: { T: D.ANY('page_12'), P: D.STR('\\d+') },
      help: 'Recherche par motif (expression régulière). Ex. \\d+ = un ou plusieurs chiffres.', kw: 'regex expression reguliere',
      gen: function (b, c) { c.imp('re'); return ['(re.search(' + c.txt(b, 'P') + ', ' + c.txt(b, 'T') + ') is not None)', O.ATOMIC]; } },
    { type: 'op_regex_sub', txtOut: true, cat: 'ops', out: ['String'], msg: 'remplacer le motif %P par %R dans %T', args: { P: D.STR('\\d+'), R: D.STR(''), T: D.ANY('page_12') },
      help: 'Remplace tout ce qui correspond au motif.', kw: 'regex', gen: function (b, c) { c.imp('re'); return ['re.sub(' + c.txt(b, 'P') + ', ' + c.txt(b, 'R') + ', ' + c.txt(b, 'T') + ')', O.CALL]; } },
    { type: 'op_newline', cat: 'ops', out: ['String'], msg: '↵ retour à la ligne', args: {},
      help: 'Un saut de ligne, à coller dans un texte.', gen: function () { return ['"\\n"', O.ATOMIC]; } },

    /* ===== variables & listes ===== */
    { type: 'g_var_set', cat: 'vars', hidden: true, msg: 'mettre %VAR à %X', args: { VAR: D.VAR('ma_variable'), X: D.ANY('0') },
      help: 'Range une valeur dans une variable (une boîte avec un nom) pour la réutiliser plus tard.',
      gen: function (b, c) { return c.var(b, 'VAR') + ' = ' + c.obj(b, 'X') + '\n'; } },
    { type: 'g_var_change', cat: 'vars', hidden: true, assigns: false, msg: 'ajouter %X à %VAR', args: { X: D.NUM(1), VAR: D.VAR('ma_variable') },
      help: 'Augmente la variable (ex. un compteur).', gen: function (b, c) { var v = c.var(b, 'VAR'); return v + ' = ' + v + ' + ' + c.num(b, 'X', GA.ORD.ADD) + '\n'; } },
    { type: 'g_var_get', cat: 'vars', hidden: true, out: null, msg: '%VAR', args: { VAR: D.VAR('ma_variable') },
      help: 'La valeur rangée dans la variable.', gen: function (b, c) { return [c.var(b, 'VAR'), O.ATOMIC]; } },
    { type: 'g_list_empty', cat: 'vars', list: true, hidden: true, msg: 'mettre %VAR à une liste vide', args: { VAR: D.VAR('ma_liste') },
      help: 'Prépare une liste vide, à remplir ensuite avec « ajouter … à la fin de la liste ».', gen: function (b, c) { return c.var(b, 'VAR') + ' = []\n'; } },
    { type: 'g_list_append', cat: 'vars', list: true, hidden: true, assigns: false, msg: 'ajouter %X à la fin de la liste %VAR', args: { X: D.ANY('texte'), VAR: D.VAR('ma_liste') },
      help: 'Ajoute un élément à la fin d\'une liste.', gen: function (b, c) { return c.var(b, 'VAR') + '.append(' + c.obj(b, 'X') + ')\n'; } },
    { type: 'g_list_len', cat: 'vars', list: true, hidden: true, out: ['Number'], msg: 'nombre d\'éléments de %L', args: { L: D.LIST() },
      help: 'Combien il y a d\'éléments dans la liste.', gen: function (b, c) { return ['len(' + c.list(b, 'L') + ')', O.CALL]; } },
    { type: 'g_list_get', cat: 'vars', list: true, hidden: true, out: null, msg: 'élément n° %N de %L', args: { N: D.NUM(1), L: D.LIST() },
      help: 'Un élément de la liste. Le premier est le n° 1.', gen: function (b, c) { return [c.list(b, 'L') + '[' + c.int(b, 'N') + ' - 1]', O.MEMBER]; } },
    { type: 'g_list_contains', cat: 'vars', list: true, hidden: true, out: ['Boolean'], msg: '%L contient l\'élément %X', args: { L: D.LIST(), X: D.ANY('texte') },
      help: 'Vrai si l\'élément est dans la liste.', gen: function (b, c) { return ['(' + c.obj(b, 'X') + ' in ' + c.list(b, 'L') + ')', O.ATOMIC]; } }
  ];
});
})(typeof window !== 'undefined' ? window : globalThis);
