/* Atelier de plug-ins GIMP — noyau (catégories, DSL, générateur Python 2.7) */
(function (root) {
'use strict';
var GA = root.GA = root.GA || { defs: [], exampleDefs: [] };
if (!GA.lang) GA.lang = 'fr';
if (!GA.T) GA.T = function (s) { return s; };
GA.L = function (fr, en) { return GA.lang === 'en' ? en : fr; };

/* ---------- catégories ---------- */
GA.CATS = [
  { id: 'start', name: '▶ Démarrer & réglages', colour: '#C8930A', intro: 'La fenêtre de réglages de ton plug-in' },
  { id: 'control', name: '🔁 Contrôle', colour: '#E0701A', intro: 'Répéter, choisir, boucler' },
  { id: 'ops', name: '🧮 Calculs & texte', colour: '#3E9E4E', intro: 'Nombres, comparaisons, mots' },
  { id: 'vars', name: '📦 Variables & listes', colour: '#DD4A3F', intro: 'Des boîtes pour retenir des valeurs' },
  { id: 'image', name: '🖼️ Image', colour: '#2F7DE0', intro: 'Le document entier' },
  { id: 'layer', name: '📑 Calques', colour: '#7556E0', intro: 'Les feuilles empilées de l\'image' },
  { id: 'sel', name: '✂️ Sélection', colour: '#139E90', intro: 'La zone en pointillés' },
  { id: 'paint', name: '🎨 Couleurs & peinture', colour: '#AE47C2', intro: 'Remplir, colorer, filtrer' },
  { id: 'text', name: '🔤 Texte', colour: '#D43F7C', intro: 'Les calques de texte' },
  { id: 'path', name: '〰️ Chemins', colour: '#1C97C2', intro: 'Les tracés (outil Chemins)' },
  { id: 'file', name: '📁 Fichiers & dossiers', colour: '#8A6240', intro: 'Ouvrir, enregistrer, lire' },
  { id: 'msg', name: '💬 Messages', colour: '#5E6F8A', intro: 'Parler à l\'utilisateur' },
  { id: 'adv', name: '🧰 Avancé', colour: '#414B60', intro: 'Les 857 fonctions de GIMP 2.10' }
];
GA.CAT = {};
GA.CATS.forEach(function (c) { GA.CAT[c.id] = c; });

GA.MENUS = [
  ['Filtres ▸ Mes scripts', '<Image>/Filters/Mes scripts'],
  ['Calque ▸ Outils', '<Image>/Layer/Tools'],
  ['Calque', '<Image>/Layer'],
  ['Image', '<Image>/Image'],
  ['Sélection', '<Image>/Select'],
  ['Couleurs', '<Image>/Colors'],
  ['Édition', '<Image>/Edit'],
  ['Fichier ▸ Exporter', '<Image>/File/Export'],
  ['Python-Fu', '<Image>/Python-Fu'],
  ['Personnalisé (⚙️ Mon plug-in)', 'CUSTOM']
];

/* ---------- ordre des opérations Python ---------- */
var ORD = GA.ORD = {
  ATOMIC: 0, MEMBER: 2.1, CALL: 2.2, EXP: 3, UNARY: 4, MUL: 5, ADD: 6, REL: 11, NOT: 12, AND: 13, OR: 14, NONE: 99
};

/* ---------- utilitaires texte ---------- */
function translit(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
}
GA.translit = translit;
GA.pyIdent = function (s, fallback) {
  var t = translit(s).trim().replace(/[^A-Za-z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_+/, '').replace(/_+$/, '');
  if (!t) t = fallback || 'valeur';
  if (/^[0-9]/.test(t)) t = 'v_' + t;
  return t;
};
GA.pyStr = function (s) {
  s = String(s == null ? '' : s);
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"';
};
GA.isPyStrLiteral = function (c) { return /^"(?:[^"\\]|\\.)*"$/.test(c); };
GA.hexToTuple = function (hex) {
  var h = String(hex || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  var r = parseInt(h.substr(0, 2), 16) || 0, g = parseInt(h.substr(2, 2), 16) || 0, b = parseInt(h.substr(4, 2), 16) || 0;
  return '(' + r + ', ' + g + ', ' + b + ')';
};

var PY_RESERVED = ('and as assert break class continue def del elif else except exec finally for from global if import in is ' +
  'lambda not or pass print raise return try while with yield None True False abs all any bool chr cmp dict dir divmod ' +
  'enumerate eval file filter float format hash hex id input int isinstance iter len list long map max min next object ' +
  'oct open ord pow range raw_input reduce repr reversed round set sorted str sum super tuple type unichr unicode vars ' +
  'xrange zip gimp pdb gimpfu gimpenums gimpcolor gimpui main register os re codecs math random time traceback glob sys ' +
  'inspect subprocess ConfigParser threading datetime tempfile shutil json image drawable').split(' ');
GA.RESERVED = {};
PY_RESERVED.forEach(function (w) { GA.RESERVED[w] = true; });
GA.addReserved = function (list) { list.forEach(function (w) { GA.RESERVED[w] = true; }); };

/* ---------- bibliothèque de fonctions d'aide Python (ajoutées seulement si utilisées) ---------- */
GA.HELPERS = {
  _texte: { deps: [], imports: [], code: [
    'def _texte(valeur):',
    '    # Convertit n\'importe quelle valeur en texte UTF-8 accepte par la PDB de GIMP',
    '    if valeur is None:',
    '        return ""',
    '    if isinstance(valeur, unicode):',
    '        return valeur.encode("utf-8")',
    '    return str(valeur)'] },
  _chemin: { deps: ['_texte'], imports: [], code: [
    'def _chemin(valeur):',
    '    # Chemin en unicode pour os / codecs (accents Windows)',
    '    if isinstance(valeur, unicode):',
    '        return valeur',
    '    return _texte(valeur).decode("utf-8")'] },
  _compter: { deps: [], imports: [], code: [
    'def _compter(debut, fin, pas):',
    '    valeurs = []',
    '    if pas == 0:',
    '        return valeurs',
    '    valeur = debut',
    '    if pas > 0:',
    '        while valeur <= fin:',
    '            valeurs.append(valeur)',
    '            valeur = valeur + pas',
    '    else:',
    '        while valeur >= fin:',
    '            valeurs.append(valeur)',
    '            valeur = valeur + pas',
    '    return valeurs'] },
  _liste_calques: { deps: [], imports: [], code: [
    'def _liste_calques(parent, dans_groupes, avec_groupes):',
    '    resultat = []',
    '    for calque in parent.layers:',
    '        if pdb.gimp_item_is_group(calque):',
    '            if avec_groupes:',
    '                resultat.append(calque)',
    '            if dans_groupes:',
    '                resultat.extend(_liste_calques(calque, dans_groupes, avec_groupes))',
    '        else:',
    '            resultat.append(calque)',
    '    return resultat'] },
  _texte_du_calque: { deps: [], imports: ['re'], code: [
    'def _texte_du_calque(calque):',
    '    # get_text renvoie None quand le texte a une mise en forme : on lit alors le balisage',
    '    texte = pdb.gimp_text_layer_get_text(calque)',
    '    if texte is None:',
    '        balisage = pdb.gimp_text_layer_get_markup(calque)',
    '        if balisage is None:',
    '            texte = ""',
    '        else:',
    '            texte = re.sub(r"<.*?>", "", balisage)',
    '    return texte'] },
  _contient: { deps: ['_texte'], imports: [], code: [
    'def _contient(texte, morceau, ignorer_casse):',
    '    texte = _texte(texte).decode("utf-8")',
    '    morceau = _texte(morceau).decode("utf-8")',
    '    if ignorer_casse:',
    '        texte = texte.lower()',
    '        morceau = morceau.lower()',
    '    return morceau in texte'] },
  _nombre: { deps: ['_texte'], imports: [], code: [
    'def _nombre(valeur):',
    '    texte = _texte(valeur).strip().replace(",", ".")',
    '    if texte.lstrip("-").isdigit():',
    '        return int(texte)',
    '    return float(texte)'] },
  _mesure_selection: { deps: [], imports: [], code: [
    'def _mesure_selection(image, quoi):',
    '    non_vide, x1, y1, x2, y2 = pdb.gimp_selection_bounds(image)',
    '    if quoi == "x":',
    '        return x1',
    '    elif quoi == "y":',
    '        return y1',
    '    elif quoi == "droite":',
    '        return x2',
    '    elif quoi == "bas":',
    '        return y2',
    '    elif quoi == "largeur":',
    '        return x2 - x1',
    '    else:',
    '        return y2 - y1'] },
  _couleur_pixel: { deps: [], imports: [], code: [
    'def _couleur_pixel(calque, x, y):',
    '    nombre, pixel = pdb.gimp_drawable_get_pixel(calque, int(x), int(y))',
    '    if nombre >= 3:',
    '        return (pixel[0], pixel[1], pixel[2])',
    '    else:',
    '        return (pixel[0], pixel[0], pixel[0])'] },
  _points_du_chemin: { deps: [], imports: [], code: [
    'def _points_du_chemin(chemin):',
    '    # Les ID de traces sont des entiers ; chaque point d\'ancrage = 6 nombres (poignee, ancre, poignee)',
    '    points = []',
    '    nombre, traces = pdb.gimp_vectors_get_strokes(chemin)',
    '    for trace in traces:',
    '        genre, nb, controle, ferme = pdb.gimp_vectors_stroke_get_points(chemin, trace)',
    '        index = 0',
    '        while index + 3 < len(controle):',
    '            points.append((controle[index + 2], controle[index + 3]))',
    '            index = index + 6',
    '    return points'] },
  _ajouter_trace: { deps: [], imports: [], code: [
    'def _ajouter_trace(chemin, points, ferme):',
    '    controle = []',
    '    for point in points:',
    '        controle.extend([point[0], point[1], point[0], point[1], point[0], point[1]])',
    '    if len(controle) > 0:',
    '        pdb.gimp_vectors_stroke_new_from_points(chemin, 0, len(controle), controle, ferme)'] },
  _calque_pour_export: { deps: [], imports: [], code: [
    'def _calque_pour_export(img):',
    '    calque = pdb.gimp_image_get_active_drawable(img)',
    '    if calque is None:',
    '        calque = img.layers[0]',
    '    return calque'] },
  _enregistrer_xcf: { deps: ['_texte', '_calque_pour_export'], imports: [], code: [
    'def _enregistrer_xcf(img, chemin):',
    '    chemin = _texte(chemin)',
    '    if not chemin.lower().endswith(".xcf"):',
    '        chemin = chemin + ".xcf"',
    '    pdb.gimp_file_save(img, _calque_pour_export(img), chemin, chemin)'] },
  _enregistrer_xcf_a_cote: { deps: ['_calque_pour_export'], imports: [], code: [
    'def _enregistrer_xcf_a_cote(img):',
    '    nom = pdb.gimp_image_get_filename(img)',
    '    if nom:',
    '        chemin = nom.rsplit(".", 1)[0] + ".xcf"',
    '        pdb.gimp_file_save(img, _calque_pour_export(img), chemin, chemin)',
    '    else:',
    '        pdb.gimp_message("Image jamais enregistrée : impossible de savoir où mettre le .xcf")'] },
  _exporter_png: { deps: ['_texte'], imports: [], code: [
    'def _exporter_png(img, chemin):',
    '    # On exporte une copie fusionnee : l\'image d\'origine n\'est pas modifiee',
    '    copie = pdb.gimp_image_duplicate(img)',
    '    calque = pdb.gimp_image_merge_visible_layers(copie, CLIP_TO_IMAGE)',
    '    pdb.file_png_save_defaults(copie, calque, _texte(chemin), _texte(chemin))',
    '    pdb.gimp_image_delete(copie)'] },
  _exporter_jpg: { deps: ['_texte'], imports: [], code: [
    'def _exporter_jpg(img, chemin, qualite):',
    '    copie = pdb.gimp_image_duplicate(img)',
    '    if pdb.gimp_image_base_type(copie) != RGB:',
    '        pdb.gimp_image_convert_rgb(copie)',
    '    calque = pdb.gimp_image_flatten(copie)',
    '    pdb.file_jpeg_save(copie, calque, _texte(chemin), _texte(chemin), qualite / 100.0, 0.0, 1, 0, "", 2, 1, 0, 0)',
    '    pdb.gimp_image_delete(copie)'] },
  _joindre_chemin: { deps: ['_texte', '_chemin'], imports: ['os'], code: [
    'def _joindre_chemin(dossier, nom):',
    '    return _texte(os.path.join(_chemin(dossier), _chemin(nom)))'] },
  _dossier_de: { deps: ['_texte', '_chemin'], imports: ['os'], code: [
    'def _dossier_de(chemin):',
    '    return _texte(os.path.dirname(_chemin(chemin)))'] },
  _nom_de_fichier: { deps: ['_texte', '_chemin'], imports: ['os'], code: [
    'def _nom_de_fichier(chemin):',
    '    return _texte(os.path.basename(_chemin(chemin)))'] },
  _sans_extension: { deps: ['_texte', '_chemin'], imports: ['os'], code: [
    'def _sans_extension(chemin):',
    '    return _texte(os.path.splitext(_chemin(chemin))[0])'] },
  _existe: { deps: ['_chemin'], imports: ['os'], code: [
    'def _existe(chemin):',
    '    return os.path.exists(_chemin(chemin))'] },
  _lire_texte: { deps: ['_chemin'], imports: ['codecs'], code: [
    'def _lire_texte(chemin):',
    '    # utf-8-sig retire le BOM ; les fins de ligne Windows sont normalisees',
    '    with codecs.open(_chemin(chemin), "r", encoding="utf-8-sig") as fichier:',
    '        contenu = fichier.read()',
    '    return contenu.replace(u"\\r\\n", u"\\n").encode("utf-8")'] },
  _lire_lignes: { deps: ['_lire_texte'], imports: [], code: [
    'def _lire_lignes(chemin):',
    '    lignes = []',
    '    for ligne in _lire_texte(chemin).split("\\n"):',
    '        if ligne.strip() != "":',
    '            lignes.append(ligne)',
    '    return lignes'] },
  _ecrire_texte: { deps: ['_texte', '_chemin'], imports: ['codecs'], code: [
    'def _ecrire_texte(chemin, texte, ajouter):',
    '    if ajouter:',
    '        mode = "a"',
    '    else:',
    '        mode = "w"',
    '    contenu = _texte(texte).decode("utf-8")',
    '    with codecs.open(_chemin(chemin), mode, encoding="utf-8") as fichier:',
    '        fichier.write(contenu)'] },
  _creer_dossier: { deps: ['_chemin'], imports: ['os'], code: [
    'def _creer_dossier(chemin):',
    '    if not os.path.isdir(_chemin(chemin)):',
    '        os.makedirs(_chemin(chemin))'] },
  _fichiers_du_dossier: { deps: ['_texte', '_chemin'], imports: ['os'], code: [
    'def _fichiers_du_dossier(dossier, extension):',
    '    resultat = []',
    '    dossier = _chemin(dossier)',
    '    fin = _chemin(extension).lower()',
    '    if os.path.isdir(dossier):',
    '        for nom in sorted(os.listdir(dossier)):',
    '            complet = os.path.join(dossier, nom)',
    '            if os.path.isfile(complet) and nom.lower().endswith(fin):',
    '                resultat.append(_texte(complet))',
    '    return resultat'] }
};

/* ---------- DSL de définition des blocs ---------- */
var D = GA.D = {
  SH: function (type, fields, inputs) { var s = { type: type }; if (fields) s.fields = fields; if (inputs) s.inputs = inputs; return s; },
  IMG: function () { return { k: 'v', check: ['Image'], sh: { type: 'g_cur_image' } }; },
  IMGL: function () { return { k: 'v', check: ['Image', 'Layer'], sh: { type: 'g_cur_image' } }; },
  LAY: function () { return { k: 'v', check: ['Layer'], sh: { type: 'g_cur_drawable' } }; },
  GRP: function () { return { k: 'v', check: ['Layer'], req: true }; },
  ITEM: function () { return { k: 'v', check: ['Layer', 'Vectors', 'Channel'], sh: { type: 'g_cur_drawable' } }; },
  ITEMR: function () { return { k: 'v', check: ['Layer', 'Vectors', 'Channel'], req: true }; },
  VEC: function () { return { k: 'v', check: ['Vectors'], req: true }; },
  NUM: function (n) { return { k: 'v', check: ['Number'], sh: { type: 'math_number', fields: { NUM: n } } }; },
  STR: function (s) { return { k: 'v', check: ['String', 'Number'], sh: { type: 'g_text', fields: { TEXT: s } } }; },
  ANY: function (s) { return { k: 'v', check: null, sh: { type: 'g_value', fields: { TEXT: s } } }; },
  OBJ: function () { return { k: 'v', check: null, req: true }; },
  LIST: function () { return { k: 'v', check: ['Array'], req: true }; },
  BOOL: function () { return { k: 'v', check: ['Boolean'], req: true }; },
  BOOLS: function (v) { return { k: 'v', check: ['Boolean'], sh: { type: 'op_bool', fields: { V: v ? 'TRUE' : 'FALSE' } } }; },
  COL: function (c) { return { k: 'v', check: ['Colour'], sh: { type: 'colour_picker', fields: { COLOUR: c } } }; },
  DD: function (opts) { return { k: 'dd', options: opts }; },
  CB: function (v) { return { k: 'cb', value: !!v }; },
  VAR: function (name) { return { k: 'var', name: name }; },
  TXT: function (s) { return { k: 'text', value: s }; },
  NUMF: function (n, min, max, prec) { return { k: 'num', value: n, min: min, max: max, precision: prec }; },
  COLF: function (c) { return { k: 'col', value: c }; },
  LBL: function (t) { return { k: 'lbl', value: t }; },
  ST: function (check) { return { k: 'st', check: check || 'Action' }; }
};
D.W = function () { return { k: 'v', check: ['Number'], sh: { type: 'img_width', inputs: { IMG: { shadow: { type: 'g_cur_image' } } } } }; };
D.H = function () { return { k: 'v', check: ['Number'], sh: { type: 'img_height', inputs: { IMG: { shadow: { type: 'g_cur_image' } } } } }; };

GA.OPT = {
  CHANNELOP: [['remplacer', 'CHANNEL_OP_REPLACE'], ['ajouter', 'CHANNEL_OP_ADD'], ['retirer', 'CHANNEL_OP_SUBTRACT'], ['garder le commun', 'CHANNEL_OP_INTERSECT']],
  FILL: [['transparent', 'FILL_TRANSPARENT'], ['blanc', 'FILL_WHITE'], ['couleur de premier plan', 'FILL_FOREGROUND'], ['couleur d\'arrière-plan', 'FILL_BACKGROUND'], ['motif actif', 'FILL_PATTERN']],
  MODE: [['Normal', 'NORMAL_MODE'], ['Multiplier', 'MULTIPLY_MODE'], ['Écran', 'SCREEN_MODE'], ['Superposer', 'OVERLAY_MODE'],
    ['Lumière douce', 'SOFTLIGHT_MODE'], ['Lumière dure', 'HARDLIGHT_MODE'], ['Différence', 'DIFFERENCE_MODE'], ['Addition', 'ADDITION_MODE'],
    ['Soustraction', 'SUBTRACT_MODE'], ['Obscurcir seulement', 'DARKEN_ONLY_MODE'], ['Éclaircir seulement', 'LIGHTEN_ONLY_MODE'],
    ['Éclaircir (densité -)', 'DODGE_MODE'], ['Assombrir (densité +)', 'BURN_MODE'], ['Teinte', 'HUE_MODE'], ['Saturation', 'SATURATION_MODE'],
    ['Couleur', 'COLOR_MODE'], ['Valeur', 'VALUE_MODE'], ['Diviser', 'DIVIDE_MODE'], ['Extraction de grain', 'GRAIN_EXTRACT_MODE'],
    ['Fusion de grain', 'GRAIN_MERGE_MODE'], ['Effacer (gomme)', 'LAYER_MODE_ERASE']]
};

/* ---------- construction d'états de blocs (boîte à outils, exemples, recherche) ---------- */
GA.SPEC = {};
function primitiveShadow(sh, val) {
  var s = JSON.parse(JSON.stringify(sh));
  s.fields = s.fields || {};
  if (s.type === 'math_number') s.fields.NUM = Number(val);
  else if (s.type === 'g_text' || s.type === 'g_value') s.fields.TEXT = String(val);
  else if (s.type === 'op_bool') s.fields.V = val ? 'TRUE' : 'FALSE';
  else if (s.type === 'colour_picker') s.fields.COLOUR = String(val);
  return s;
}
function primitiveBlock(val) {
  if (typeof val === 'number') return { type: 'math_number', fields: { NUM: val } };
  if (typeof val === 'boolean') return { type: 'op_bool', fields: { V: val ? 'TRUE' : 'FALSE' } };
  return { type: 'g_text', fields: { TEXT: String(val) } };
}
function expandShadow(sh) {
  var st = GA.blockState(sh.type, sh.fields, null, true);
  if (sh.inputs) {
    st.inputs = st.inputs || {};
    for (var k in sh.inputs) st.inputs[k] = sh.inputs[k];
  }
  return st;
}
function chain(list) {
  var first = null, prev = null;
  list.forEach(function (b) {
    if (!b) return;
    var copy = b;
    if (!first) first = copy;
    else prev.next = { block: copy };
    prev = copy;
  });
  return first;
}
GA.chain = chain;
GA.blockState = function (type, fields, inputs, asShadow, extra) {
  var spec = GA.SPEC[type];
  var st = { type: type };
  if (fields) {
    st.fields = {};
    for (var f in fields) {
      var a = spec && spec.args[f];
      if (a && a.k === 'var') st.fields[f] = { name: fields[f] };
      else st.fields[f] = fields[f];
    }
  }
  var ins = {};
  var has = false;
  if (spec) {
    for (var k in spec.args) {
      var arg = spec.args[k];
      var given = inputs ? inputs[k] : undefined;
      if (arg.k === 'v') {
        var sh = arg.sh ? expandShadow(arg.sh) : null;
        if (given !== undefined && given !== null && typeof given === 'object') {
          ins[k] = { block: given };
          if (sh) ins[k].shadow = sh;
          has = true;
        } else if (given !== undefined && given !== null) {
          if (sh) { ins[k] = { shadow: primitiveShadow(arg.sh.type ? expandShadow(arg.sh) : sh, given) }; }
          else ins[k] = { block: primitiveBlock(given) };
          has = true;
        } else if (sh) { ins[k] = { shadow: sh }; has = true; }
      } else if (arg.k === 'st' && given && given.length) {
        ins[k] = { block: chain(given) };
        has = true;
      }
    }
  } else if (inputs) {
    for (var k2 in inputs) { ins[k2] = inputs[k2]; has = true; }
  }
  if (has) st.inputs = ins;
  if (extra) for (var e in extra) st[e] = extra[e];
  return st;
};

/* ---------- JSON Blockly à partir d'une spécification ---------- */
function argJson(name, a) {
  switch (a.k) {
    case 'v': return a.check ? { type: 'input_value', name: name, check: a.check } : { type: 'input_value', name: name };
    case 'st': return { type: 'input_statement', name: name, check: a.check };
    case 'dd': return { type: 'field_dropdown', name: name, options: a.options };
    case 'cb': return { type: 'field_checkbox', name: name, checked: a.value };
    case 'var': return { type: 'field_variable', name: name, variable: a.name };
    case 'text': return { type: 'field_input', name: name, text: a.value };
    case 'num': return { type: 'field_number', name: name, value: a.value, min: a.min, max: a.max, precision: a.precision };
    case 'col': return { type: 'field_colour', name: name, colour: a.value };
    case 'lbl': return { type: 'field_label_serializable', name: name, text: a.value };
  }
  throw new Error('type d\'argument inconnu ' + a.k);
}
GA.specToJson = function (spec) {
  var parts = spec.msg.split(/(%[A-Z][A-Z0-9_]*)/);
  var message = '', args = [], n = 0;
  parts.forEach(function (t) {
    var m = t.match(/^%([A-Z][A-Z0-9_]*)$/);
    if (!m) { message += t.replace(/%/g, '%%'); return; }
    n++;
    message += '%' + n;
    if (m[1] === 'BR') { args.push({ type: 'input_end_row' }); return; }
    var a = spec.args[m[1]];
    if (!a) throw new Error('argument manquant ' + m[1] + ' dans ' + spec.type);
    args.push(argJson(m[1], a));
  });
  var json = { type: spec.type, message0: message.trim(), args0: args, style: 'cat_' + spec.cat, tooltip: spec.help,
    inputsInline: spec.inline !== false };
  if (spec.out !== undefined) json.output = spec.out;
  else if (spec.kind === 'setting') { json.previousStatement = 'Setting'; json.nextStatement = 'Setting'; }
  else if (spec.kind !== 'hat') { json.previousStatement = 'Action'; if (!spec.cap) json.nextStatement = 'Action'; }
  return json;
};

GA.titleOf = function (spec) {
  return spec.msg.split('%BR')[0].replace(/%[A-Z][A-Z0-9_]*/g, '…').replace(/\s+/g, ' ').replace(/(… )+…/g, '…').trim();
};
})(typeof window !== 'undefined' ? window : globalThis);
