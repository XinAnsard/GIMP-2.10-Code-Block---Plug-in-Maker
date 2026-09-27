/* Exemples inspirés des plug-ins de l'utilisateur */
(function (root) {
'use strict';
var GA = root.GA;
function E() {
  var b = function (type, fields, inputs) { return GA.blockState(type, fields, inputs); };
  return {
    b: b,
    s: function (name) { return { type: 'g_setting_get', fields: { NAME: name } }; },
    v: function (name) { return { type: 'g_var_get', fields: { VAR: { name: name } } }; },
    start: function (label, menu, needs, settings, actions) {
      var st = { type: 'g_start', x: 40, y: 40, fields: { LABEL: label, MENU: menu, NEEDS: needs }, inputs: {} };
      if (settings.length) st.inputs.SETTINGS = { block: GA.chain(settings) };
      if (actions.length) st.inputs.DO = { block: GA.chain(actions) };
      return { blocks: { languageVersion: 0, blocks: [st] } };
    }
  };
}

GA.exampleDefs = [
  { id: 'calques', title: 'Créer plusieurs calques numérotés', from: 'Create multiple layers.py', icon: '📑',
    desc: 'Demande combien de calques créer et leur début de nom, puis les crée : Calque_1, Calque_2…',
    build: function () {
      var e = E(), b = e.b, s = e.s, v = e.v;
      return e.start('Créer plusieurs calques', '<Image>/Layer/Tools', true, [
        b('set_spinner', { NAME: 'nombre', LABEL: 'Nombre de calques', MIN: 1, MAX: 100, STEP: 1, DEF: 3 }),
        b('set_string', { NAME: 'prefixe', LABEL: 'Début du nom', DEF: 'Calque_' }),
        b('set_toggle', { NAME: 'numeroter', LABEL: 'Ajouter un numéro', DEF: true })
      ], [
        b('c_for', { VAR: 'i' }, { A: 1, B: s('nombre'), S: 1, DO: [
          b('c_ifelse', null, { C: s('numeroter'),
            DO: [b('g_var_set', { VAR: 'nom' }, { X: b('op_join', null, { A: s('prefixe'), B: v('i') }) })],
            ELSE: [b('g_var_set', { VAR: 'nom' }, { X: s('prefixe') })] }),
          b('lyr_new', { FILL: 'FILL_TRANSPARENT', POS: 'TOP', VAR: 'calque' }, { NAME: v('nom') })
        ] }),
        b('msg_show', null, { T: b('op_join', null, { A: s('nombre'), B: ' calque(s) créé(s) !' }) })
      ]);
    } },
  { id: 'manga', title: 'Remplacer les textes depuis un fichier', from: 'manga-text.py', icon: '💬',
    desc: 'Lit un fichier texte (bulles séparées par [breaker]) et met chaque texte dans les calques « text #1 », « text #2 »…',
    build: function () {
      var e = E(), b = e.b, s = e.s, v = e.v;
      return e.start('Remplacer les textes (manga)', '<Image>/Python-Fu', true, [
        b('set_file', { NAME: 'fichier', LABEL: 'Fichier texte (bulles séparées par [breaker])' }),
        b('set_font', { NAME: 'police', LABEL: 'Police', DEF: 'Sans' }),
        b('set_int', { NAME: 'taille', LABEL: 'Taille (px)', DEF: 20 }),
        b('set_color', { NAME: 'couleur', LABEL: 'Couleur du texte', DEF: '#000000' })
      ], [
        b('g_var_set', { VAR: 'textes' }, { X: b('op_split', null, { T: b('file_read', null, { P: s('fichier') }), SEP: '[breaker]' }) }),
        b('c_for', { VAR: 'i' }, { A: 1, B: b('g_list_len', null, { L: v('textes') }), S: 1, DO: [
          b('g_var_set', { VAR: 'calque' }, { X: b('img_layer_by_name', null, { NAME: b('op_join', null, { A: 'text #', B: v('i') }) }) }),
          b('c_if', null, { C: b('op_exists', null, { X: v('calque') }), DO: [
            b('txt_set', null, { L: v('calque'), T: b('op_strip', null, { T: b('g_list_get', null, { N: v('i'), L: v('textes') }) }) }),
            b('txt_font', null, { L: v('calque'), F: s('police') }),
            b('txt_size', null, { L: v('calque'), S: s('taille') }),
            b('txt_color', null, { L: v('calque'), C: s('couleur') })
          ] })
        ] }),
        b('msg_show', null, { T: 'Textes remplacés !' })
      ]);
    } },
  { id: 'sauver', title: 'Enregistrer toutes les images ouvertes', from: 'Plugin_ChangeFont.py', icon: '💾',
    desc: 'Enregistre chaque image ouverte en .xcf à côté de son fichier, et en option une copie .jpg.',
    build: function () {
      var e = E(), b = e.b, s = e.s, v = e.v;
      return e.start('Enregistrer toutes les images', '<Image>/File/Export', false, [
        b('set_toggle', { NAME: 'jpg', LABEL: 'Exporter aussi en JPEG', DEF: true }),
        b('set_slider', { NAME: 'qualite', LABEL: 'Qualité JPEG', MIN: 0, MAX: 100, STEP: 1, DEF: 95 })
      ], [
        b('msg_pstart', null, { T: 'Enregistrement des images…' }),
        b('c_foreach_image', { VAR: 'img' }, { DO: [
          b('c_ifelse', null, { C: b('img_has_file', null, { IMG: v('img') }),
            DO: [
              b('file_save_next', null, { IMG: v('img') }),
              b('c_if', null, { C: s('jpg'), DO: [
                b('file_jpg', null, { IMG: v('img'), Q: s('qualite'),
                  P: b('op_join', null, { A: b('file_part', { K: '_sans_extension' }, { P: b('img_file', null, { IMG: v('img') }) }), B: '.jpg' }) })
              ] })
            ],
            ELSE: [b('msg_show', null, { T: b('op_join', null, { A: 'Jamais enregistrée, ignorée : ', B: b('img_name', null, { IMG: v('img') }) }) })] }),
          b('msg_ppulse')
        ] }),
        b('msg_pend'),
        b('msg_show', null, { T: 'Toutes les images sont enregistrées !' })
      ]);
    } },
  { id: 'bulle', title: 'Bulle blanche sous la sélection', from: 'couverture_bulle_image.py', icon: '🫧',
    desc: 'Bouche les trous de la sélection, l\'agrandit un peu et la remplit de blanc sur un nouveau calque « Bulle ».',
    build: function () {
      var e = E(), b = e.b, s = e.s, v = e.v;
      return e.start('Bulle blanche', '<Image>/Filters/Mes scripts', true, [
        b('set_color', { NAME: 'couleur', LABEL: 'Couleur de la bulle', DEF: '#ffffff' }),
        b('set_int', { NAME: 'marge', LABEL: 'Marge autour (px)', DEF: 2 })
      ], [
        b('c_if', null, { C: b('sel_empty'), DO: [
          b('msg_show', null, { T: 'Fais d\'abord une sélection autour de la bulle.' }),
          b('c_stop')
        ] }),
        b('sel_flood'),
        b('sel_modify', { OP: 'grow' }, { N: s('marge') }),
        b('lyr_new', { FILL: 'FILL_TRANSPARENT', POS: 'ACTIVE', VAR: 'bulle' }, { NAME: 'Bulle' }),
        b('paint_fill_color', null, { L: v('bulle'), C: s('couleur') }),
        b('sel_none')
      ]);
    } },
  { id: 'visibles', title: 'Afficher / cacher des calques par nom', from: 'Plugin_ShowLayer.py', icon: '👁️',
    desc: 'Rend visibles (ou cache) tous les calques dont le nom contient un mot, même dans les groupes.',
    build: function () {
      var e = E(), b = e.b, s = e.s, v = e.v;
      return e.start('Afficher ou cacher par nom', '<Image>/Layer/Tools', true, [
        b('set_string', { NAME: 'recherche', LABEL: 'Le nom contient', DEF: 'text' }),
        b('set_toggle', { NAME: 'visible', LABEL: 'Rendre visibles (sinon cacher)', DEF: true })
      ], [
        b('g_var_set', { VAR: 'compte' }, { X: 0 }),
        b('c_foreach_layer', { VAR: 'calque', REC: true, GRP: false }, { DO: [
          b('c_if', null, { C: b('op_contains', { CASE: true }, { A: b('lyr_name', null, { L: v('calque') }), B: s('recherche') }), DO: [
            b('lyr_visible', null, { L: v('calque'), V: s('visible') }),
            b('g_var_change', { VAR: 'compte' }, { X: 1 })
          ] })
        ] }),
        b('msg_show', null, { T: b('op_join', null, { A: 'Calques modifiés : ', B: v('compte') }) })
      ]);
    } },
  { id: 'credits', title: 'Crédits : ajouter un nombre aux textes', from: 'Credit count.py', icon: '🔢',
    desc: 'Tous les calques texte qui contiennent seulement un nombre sont augmentés (41 → 42).',
    build: function () {
      var e = E(), b = e.b, s = e.s, v = e.v;
      return e.start('Crédits +1', '<Image>/Python-Fu', true, [
        b('set_int', { NAME: 'ajout', LABEL: 'Nombre à ajouter', DEF: 1 })
      ], [
        b('c_foreach_layer', { VAR: 'calque', REC: true, GRP: false }, { DO: [
          b('c_if', null, { C: b('op_logic', { OP: 'and' }, { A: b('lyr_is_text', null, { L: v('calque') }), B: b('op_isdigit', null, { T: b('txt_get', null, { L: v('calque') }) }) }), DO: [
            b('txt_set', null, { L: v('calque'), T: b('op_to_text', null, { X: b('op_arith', { OP: 'ADD' }, { A: b('op_to_number', null, { T: b('txt_get', null, { L: v('calque') }) }), B: s('ajout') }) }) })
          ] })
        ] })
      ]);
    } },
  { id: 'points', title: 'Placer les textes sur les points d\'un chemin', from: 'manhwa_text_point.py', icon: '📍',
    desc: 'Crée un calque texte par bulle du fichier, posé sur chaque point du chemin actif.',
    build: function () {
      var e = E(), b = e.b, s = e.s, v = e.v;
      return e.start('Textes sur les points du chemin', '<Image>/Python-Fu', true, [
        b('set_file', { NAME: 'fichier', LABEL: 'Fichier texte (bulles séparées par [breaker])' }),
        b('set_font', { NAME: 'police', LABEL: 'Police', DEF: 'Sans' }),
        b('set_int', { NAME: 'taille', LABEL: 'Taille (px)', DEF: 20 }),
        b('set_color', { NAME: 'couleur', LABEL: 'Couleur', DEF: '#000000' })
      ], [
        b('g_var_set', { VAR: 'chemin' }, { X: b('path_active') }),
        b('c_if', null, { C: b('op_not', null, { A: b('op_exists', null, { X: v('chemin') }) }), DO: [
          b('msg_show', null, { T: 'Choisis d\'abord un chemin dans l\'onglet Chemins.' }),
          b('c_stop')
        ] }),
        b('g_var_set', { VAR: 'points' }, { X: b('path_points', null, { V: v('chemin') }) }),
        b('g_var_set', { VAR: 'textes' }, { X: b('op_split', null, { T: b('file_read', null, { P: s('fichier') }), SEP: '[breaker]' }) }),
        b('c_for', { VAR: 'i' }, { A: 1, B: b('g_list_len', null, { L: v('textes') }), S: 1, DO: [
          b('g_var_set', { VAR: 'x' }, { X: 10 }),
          b('g_var_set', { VAR: 'y' }, { X: 10 }),
          b('c_if', null, { C: b('op_compare', { OP: '<=' }, { A: v('i'), B: b('g_list_len', null, { L: v('points') }) }), DO: [
            b('g_var_set', { VAR: 'x' }, { X: b('path_px', { K: '0' }, { P: b('g_list_get', null, { N: v('i'), L: v('points') }) }) }),
            b('g_var_set', { VAR: 'y' }, { X: b('path_px', { K: '1' }, { P: b('g_list_get', null, { N: v('i'), L: v('points') }) }) })
          ] }),
          b('txt_new', { VAR: 'calque_texte' }, { T: b('op_strip', null, { T: b('g_list_get', null, { N: v('i'), L: v('textes') }) }),
            F: s('police'), S: s('taille'), C: s('couleur'), X: v('x'), Y: v('y') }),
          b('lyr_rename', null, { L: v('calque_texte'), NAME: b('op_join', null, { A: 'text #', B: v('i') }) })
        ] })
      ]);
    } }
];
GA.emptyProject = function () {
  return { blocks: { languageVersion: 0, blocks: [{ type: 'g_start', x: 40, y: 40, fields: { LABEL: 'Mon script', MENU: '<Image>/Filters/Mes scripts', NEEDS: true } }] } };
};
})(typeof window !== 'undefined' ? window : globalThis);
