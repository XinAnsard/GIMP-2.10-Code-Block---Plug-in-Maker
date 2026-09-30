/* Blocs : toutes les images ouvertes, et raccourcis pour les motifs qui reviennent dans tous les scripts GIMP */
(function (root) {
'use strict';
var GA = root.GA;
GA.CATS.splice(GA.CATS.length - 1, 0, { id: 'fast', name: '⚡ Raccourcis GIMP', colour: '#D9480F', intro: 'Ce que tous les scripts GIMP répètent, en un seul bloc' });
GA.CAT.fast = GA.CATS.filter(function (c) { return c.id === 'fast'; })[0];

/* blocs déjà existants montrés aussi dans d'autres catégories (là où on les cherche) */
GA.ALSO = { image: ['c_foreach_image'], layer: ['c_foreach_layer'],
  fast: ['c_foreach_image', 'c_foreach_layer', 'c_foreach_file', 'img_duplicate', 'file_png', 'file_jpg', 'file_save_xcf', 'msg_pstart', 'msg_pset', 'msg_pend'] };

GA.defs.push(function (D, GA) {
  var O = GA.ORD;
  var IND = '    ';
  // une valeur utilisée plusieurs fois est d'abord rangée dans une variable (sauf si c'est déjà un nom)
  function once(c, code, p) { if (/^[A-Za-z_]\w*$/.test(code)) return { pre: '', v: code }; var v = c.uid(p); return { pre: v + ' = ' + code + '\n', v: v }; }
  function images() { return 'list(reversed(gimp.image_list()))'; }
  return [
    /* ===== toutes les images ===== */
    { type: 'img_all', cat: 'image', also: ['fast'], sep: 'Toutes les images ouvertes', out: ['Array'], msg: '🖼️ toutes les images ouvertes', args: {},
      help: 'La liste de toutes les images ouvertes dans GIMP, dans l\'ordre d\'ouverture. À utiliser avec « pour chaque élément de la liste » ou « nombre d\'éléments ».', kw: 'images ouvertes liste lot toutes',
      gen: function () { return [images(), O.CALL]; } },
    { type: 'img_count', cat: 'image', out: ['Number'], msg: 'nombre d\'images ouvertes', args: {},
      help: 'Combien d\'images sont ouvertes dans GIMP.', kw: 'combien images',
      gen: function () { return ['len(gimp.image_list())', O.CALL]; } },
    { type: 'img_by_name', cat: 'image', out: ['Image'], msg: 'image ouverte nommée %NAME', args: { NAME: D.STR('page_01.png') },
      help: 'Trouve une image ouverte par son nom (celui de l\'onglet, ex. page_01.png). Vérifie avec « … existe » : si aucune image n\'a ce nom, le résultat est vide.', kw: 'chercher trouver image nom',
      gen: function (b, c) { c.need('_image_nommee'); return ['_image_nommee(' + c.txt(b, 'NAME') + ')', O.CALL]; } },
    { type: 'img_of_layer', cat: 'image', also: ['layer'], out: ['Image'], msg: 'image du calque %L', args: { L: D.LAY() }, pdb: ['gimp-item-get-image'],
      help: 'L\'image qui contient ce calque. Pratique dans une boucle sur plusieurs images.',
      gen: function (b, c) { return ['pdb.gimp_item_get_image(' + c.obj(b, 'L') + ')', O.CALL]; } },
    { type: 'img_first', cat: 'image', out: ['Image'], msg: 'dernière image ouverte', args: {},
      help: 'L\'image ouverte le plus récemment (vide si aucune image n\'est ouverte).',
      gen: function () { return ['(gimp.image_list() or [None])[0]', O.MEMBER]; } },

    /* ===== raccourcis : boucles ===== */
    { type: 'c_each_image_undo', cat: 'fast', sep: 'Travailler sur plusieurs images', msg: 'pour chaque image ouverte %VAR %BR une annulation par image %UNDO %BR rafraîchir l\'affichage à la fin %FLUSH %DO',
      args: { VAR: D.VAR('img'), UNDO: D.CB(true), FLUSH: D.CB(true), DO: D.ST() }, pdb: ['gimp-image-undo-group-start', 'gimp-image-undo-group-end', 'gimp-displays-flush'],
      help: 'Passe sur toutes les images ouvertes. Chaque image garde une seule étape d\'annulation (Ctrl+Z annule tout ce que le plug-in a fait sur elle), même en cas d\'erreur.', kw: 'toutes les images lot annulation',
      gen: function (b, c) {
        var v = c.var(b, 'VAR'), body = c.body(b, 'DO'), s = 'for ' + v + ' in ' + images() + ':\n';
        if (c.f(b, 'UNDO') === 'TRUE') s += IND + 'pdb.gimp_image_undo_group_start(' + v + ')\n' + IND + 'try:\n' + c.ind(body) + IND + 'finally:\n' + IND + IND + 'pdb.gimp_image_undo_group_end(' + v + ')\n';
        else s += body;
        if (c.f(b, 'FLUSH') === 'TRUE') s += 'gimp.displays_flush()\n';
        return s;
      } },
    { type: 'c_each_layer_all', cat: 'fast', msg: 'pour chaque calque %VAR de toutes les images ouvertes %BR %REC chercher aussi dans les groupes %DO',
      args: { VAR: D.VAR('calque'), REC: D.CB(true), DO: D.ST() },
      help: 'Passe sur tous les calques de toutes les images ouvertes. Utilise « image du calque » pour savoir dans quelle image tu es.', kw: 'tous les calques toutes les images lot',
      gen: function (b, c) {
        c.need('_liste_calques');
        var i = c.uid('img');
        return 'for ' + i + ' in ' + images() + ':\n' + IND + 'for ' + c.var(b, 'VAR') + ' in _liste_calques(' + i + ', ' + (c.f(b, 'REC') === 'TRUE' ? 'True' : 'False') + ', False):\n' + c.ind(c.body(b, 'DO'));
      } },
    { type: 'c_each_file_open', cat: 'fast', msg: 'pour chaque fichier image du dossier %DIR %BR se terminant par %EXT : l\'ouvrir dans %VAR %BR puis le fermer %CLOSE %DO',
      args: { DIR: D.STR(''), EXT: D.STR('.png'), VAR: D.VAR('img'), CLOSE: D.CB(true), DO: D.ST() }, pdb: ['gimp-file-load', 'gimp-image-delete'],
      help: 'Traitement par lot : ouvre chaque fichier du dossier (sans fenêtre), fait les blocs, puis libère l\'image. Enregistre-la dans les blocs si tu veux garder le résultat.', kw: 'lot dossier batch ouvrir fichiers',
      gen: function (b, c) {
        c.need('_fichiers_du_dossier');
        var f = c.uid('fichier'), v = c.var(b, 'VAR');
        var s = 'for ' + f + ' in _fichiers_du_dossier(' + c.txt(b, 'DIR') + ', ' + c.txt(b, 'EXT') + '):\n' + IND + v + ' = pdb.gimp_file_load(' + f + ', ' + f + ')\n';
        if (c.f(b, 'CLOSE') === 'TRUE') s += IND + 'try:\n' + c.ind(c.body(b, 'DO')) + IND + 'finally:\n' + IND + IND + 'pdb.gimp_image_delete(' + v + ')\n';
        else s += c.body(b, 'DO');
        return s;
      } },

    /* ===== raccourcis : enveloppes « faire …, puis toujours remettre en place » ===== */
    { type: 'c_undo_group', cat: 'fast', sep: 'Envelopper des actions', msg: 'en une seule annulation dans %IMG %DO', args: { IMG: D.IMG(), DO: D.ST() },
      pdb: ['gimp-image-undo-group-start', 'gimp-image-undo-group-end'],
      help: 'Tout ce qui est à l\'intérieur ne compte que pour un seul Ctrl+Z. L\'annulation est refermée même en cas d\'erreur.', kw: 'undo annuler groupe',
      gen: function (b, c) { var o = once(c, c.obj(b, 'IMG'), 'img'); return o.pre + 'pdb.gimp_image_undo_group_start(' + o.v + ')\ntry:\n' + c.body(b, 'DO') + 'finally:\n' + IND + 'pdb.gimp_image_undo_group_end(' + o.v + ')\n'; } },
    { type: 'c_context', cat: 'fast', msg: 'en remettant ensuite les couleurs, pinceau et réglages d\'outils %DO', args: { DO: D.ST() },
      pdb: ['gimp-context-push', 'gimp-context-pop'],
      help: 'Tu peux changer la couleur, le pinceau, la police… à l\'intérieur : à la fin, l\'utilisateur retrouve les siens.', kw: 'contexte couleur premier plan sauvegarder restaurer push pop',
      gen: function (b, c) { return 'pdb.gimp_context_push()\ntry:\n' + c.body(b, 'DO') + 'finally:\n' + IND + 'pdb.gimp_context_pop()\n'; } },
    { type: 'c_keep_selection', cat: 'fast', msg: 'en remettant ensuite la sélection de %IMG %DO', args: { IMG: D.IMG(), DO: D.ST() },
      pdb: ['gimp-selection-save', 'gimp-image-select-item', 'gimp-image-remove-channel'],
      help: 'Tu peux changer la sélection à l\'intérieur : à la fin, la sélection d\'origine revient.', kw: 'sauvegarder selection restaurer',
      gen: function (b, c) {
        var o = once(c, c.obj(b, 'IMG'), 'img'), s = c.uid('selection');
        return o.pre + s + ' = pdb.gimp_selection_save(' + o.v + ')\ntry:\n' + c.body(b, 'DO') + 'finally:\n' +
          IND + 'pdb.gimp_image_select_item(' + o.v + ', CHANNEL_OP_REPLACE, ' + s + ')\n' + IND + 'pdb.gimp_image_remove_channel(' + o.v + ', ' + s + ')\n';
      } },
    { type: 'c_keep_active', cat: 'fast', msg: 'en remettant ensuite le calque actif de %IMG %DO', args: { IMG: D.IMG(), DO: D.ST() },
      pdb: ['gimp-image-get-active-layer', 'gimp-image-set-active-layer'],
      help: 'Tu peux activer d\'autres calques à l\'intérieur : à la fin, le calque qui était actif le redevient.', kw: 'calque actif restaurer',
      gen: function (b, c) {
        var o = once(c, c.obj(b, 'IMG'), 'img'), a = c.uid('actif');
        return o.pre + a + ' = pdb.gimp_image_get_active_layer(' + o.v + ')\ntry:\n' + c.body(b, 'DO') + 'finally:\n' +
          IND + 'if ' + a + ' is not None and pdb.gimp_item_is_valid(' + a + '):\n' + IND + IND + 'pdb.gimp_image_set_active_layer(' + o.v + ', ' + a + ')\n';
      } },
    { type: 'c_fast', cat: 'fast', msg: 'sans historique d\'annulation (plus rapide) dans %IMG %DO', args: { IMG: D.IMG(), DO: D.ST() },
      pdb: ['gimp-image-undo-disable', 'gimp-image-undo-enable'],
      help: 'Pour les traitements lourds (des centaines de calques) : GIMP ne mémorise pas les étapes, c\'est beaucoup plus rapide. Ctrl+Z ne pourra pas annuler ces actions.', kw: 'rapide vitesse undo desactiver',
      gen: function (b, c) { var o = once(c, c.obj(b, 'IMG'), 'img'); return o.pre + 'pdb.gimp_image_undo_disable(' + o.v + ')\ntry:\n' + c.body(b, 'DO') + 'finally:\n' + IND + 'pdb.gimp_image_undo_enable(' + o.v + ')\n'; } },

    /* ===== raccourcis : actions en un bloc ===== */
    { type: 'fast_layer_new', cat: 'fast', sep: 'En un seul bloc', msg: 'nouveau calque %NAME dans %IMG %BR taille de l\'image, rempli de %FILL, tout en haut → dans %VAR',
      args: { NAME: D.STR('Nouveau calque'), IMG: D.IMG(), FILL: D.DD(GA.OPT.FILL), VAR: D.VAR('nouveau_calque') },
      pdb: ['gimp-layer-new', 'gimp-image-insert-layer', 'gimp-drawable-fill'],
      help: 'Crée un calque de la taille de l\'image, l\'ajoute tout en haut et le remplit : les 3 lignes qu\'on écrit à chaque fois.', kw: 'creer calque ajouter',
      gen: function (b, c) {
        var o = once(c, c.obj(b, 'IMG'), 'img'), v = c.var(b, 'VAR');
        return o.pre + v + ' = pdb.gimp_layer_new(' + o.v + ', ' + o.v + '.width, ' + o.v + '.height, RGBA_IMAGE, ' + c.txt(b, 'NAME') + ', 100, NORMAL_MODE)\n' +
          'pdb.gimp_image_insert_layer(' + o.v + ', ' + v + ', None, 0)\n' + 'pdb.gimp_drawable_fill(' + v + ', ' + c.f(b, 'FILL') + ')\n';
      } },
    { type: 'fast_layer_copy_to', cat: 'fast', msg: 'copier le calque %L dans l\'image %IMG %BR tout en haut → dans %VAR', args: { L: D.LAY(), IMG: D.IMG(), VAR: D.VAR('calque_copie') },
      pdb: ['gimp-layer-new-from-drawable', 'gimp-image-insert-layer'],
      help: 'Copie un calque d\'une image vers une autre (ou la même) en une étape.', kw: 'copier calque autre image dupliquer',
      gen: function (b, c) {
        var o = once(c, c.obj(b, 'IMG'), 'img'), v = c.var(b, 'VAR');
        return o.pre + v + ' = pdb.gimp_layer_new_from_drawable(' + c.obj(b, 'L') + ', ' + o.v + ')\npdb.gimp_image_insert_layer(' + o.v + ', ' + v + ', None, 0)\n';
      } },
    { type: 'fast_flush', cat: 'fast', msg: 'rafraîchir l\'affichage de toutes les images', args: {}, pdb: ['gimp-displays-flush'],
      help: 'Met à jour les fenêtres des images tout de suite (utile dans une longue boucle).', kw: 'flush afficher actualiser',
      gen: function () { return 'gimp.displays_flush()\n'; } }
  ];
});

GA.HELPERS._image_nommee = { deps: ['_texte'], imports: [], code: [
  'def _image_nommee(nom):',
  '    for img in gimp.image_list():',
  '        if _texte(pdb.gimp_image_get_name(img)) == _texte(nom):',
  '            return img',
  '    return None'] };
})(typeof window !== 'undefined' ? window : globalThis);
