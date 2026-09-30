/* Atelier — le cours (de débutant complet à pro) et le guide d'utilisation.
   Tous les textes sont en français ici ; les traductions passent par GA.T (i18n_learn_en.js + paquets de langue).
   Mise en forme des textes : **gras**, `code`, et une ligne qui commence par « - » devient une puce. */
(function (root) {
'use strict';
var GA = root.GA;
var T = function (x) { return GA.T ? GA.T(x) : x; };

/* ---------- outils pour les vérifications (indépendants de la langue : on regarde les types de blocs) ---------- */
function hat(ws) { return ws.getBlocksByType('g_start', false)[0] || ws.getBlocksByType('py_file', false)[0] || null; }
function prog(ws) { var h = hat(ws); return h ? h.getDescendants(false).filter(function (b) { return b.isEnabled() && !b.isShadow(); }) : []; }
function inProg(ws, types) { types = [].concat(types); return prog(ws).filter(function (b) { return types.indexOf(b.type) >= 0; }); }
function has(ws, types) { return inProg(ws, types).length > 0; }
// dans les cases du bloc (corps d'une boucle, argument…), pas dans les blocs empilés en dessous
function inside(b, types) {
  types = [].concat(types);
  return b.inputList.some(function (inp) {
    var t = inp.connection && inp.connection.targetBlock();
    return t && t.getDescendants(false).some(function (d) { return types.indexOf(d.type) >= 0 && d.isEnabled(); });
  });
}
function hasInside(ws, outer, inner) { return inProg(ws, outer).some(function (b) { return inside(b, inner); }); }
function settings(ws) { var s = ws.getBlocksByType('g_start', false)[0]; if (!s) return []; var out = [], b = s.getInputTargetBlock('SETTINGS'); while (b) { out.push(b); b = b.getNextBlock(); } return out; }
function calls(ws) { return inProg(ws, ['py_callst', 'py_call']).filter(function (b) { return !b.f_; }).map(function (b) { return { b: b, f: String(b.getFieldValue('FUNC') || '') }; }); }
var LAYER_ACTIONS = ['lyr_rename', 'lyr_visible', 'lyr_opacity', 'lyr_mode', 'lyr_delete', 'lyr_move', 'lyr_scale', 'lyr_alpha', 'lyr_dup', 'paint_blur', 'paint_fill_all', 'paint_desat', 'paint_invert', 'paint_bc', 'txt_set', 'txt_color', 'txt_size'];
var NEW_LAYER = ['lyr_new', 'fast_layer_new'];

/* ---------- les leçons ---------- */
GA.LEARN_LEVELS = [
  { n: 1, t: '🌱 Niveau 1 — Premiers pas', d: 'Tu n\'as jamais programmé ? Parfait, on commence ici.' },
  { n: 2, t: '🌿 Niveau 2 — Les bases de la programmation', d: 'Variables, boucles, conditions : les 3 idées qui font tous les programmes.' },
  { n: 3, t: '🌳 Niveau 3 — GIMP pour de vrai', d: 'Sélections, texte, plusieurs images, dossiers entiers.' },
  { n: 4, t: '🚀 Niveau 4 — Vers le code (pro)', d: 'Lire et écrire du Python, utiliser les 857 fonctions de GIMP, déboguer.' }
];
GA.LEARN = [
  { id: 'hello', lvl: 1, t: 'Ton premier plug-in',
    goal: 'Faire afficher « Bonjour » par GIMP.',
    p: ['Un **plug-in** est un petit programme qui ajoute une commande dans les menus de GIMP. Ici, tu le construis en emboîtant des blocs, comme un puzzle : l\'atelier écrit le vrai code Python à ta place.',
      'Tout plug-in commence par le bloc jaune **▶ Quand je lance**. Les blocs rangés sous « puis faire » s\'exécutent **de haut en bas**, un par un.'],
    steps: ['Clique sur le bloc ci-dessous pour l\'ajouter : il s\'accroche tout seul sous « puis faire ».', 'Clique dans la case blanche du message et écris ton texte.', 'Regarde l\'onglet 🐍 Code : la ligne `pdb.gimp_message(...)` est apparue.'],
    blocks: ['msg_show'],
    check: function (ws) { return has(ws, 'msg_show'); },
    hint: 'Il faut un bloc « 💬 afficher le message » accroché sous « puis faire ».' },
  { id: 'install', lvl: 1, t: 'Installer ton plug-in dans GIMP',
    goal: 'Voir ton plug-in dans les menus de GIMP et le lancer.',
    p: ['GIMP charge les plug-ins au démarrage, depuis un dossier spécial appelé **plug-ins**.',
      '- **Windows** : `C:\\Users\\<toi>\\AppData\\Roaming\\GIMP\\2.10\\plug-ins`',
      '- **Linux** : `~/.config/GIMP/2.10/plug-ins` (puis rends le fichier exécutable : `chmod +x fichier.py`)',
      '- **macOS** : `~/Library/Application Support/GIMP/2.10/plug-ins`',
      'Le chemin exact est écrit dans GIMP : **Édition ▸ Préférences ▸ Dossiers ▸ Greffons**.'],
    steps: ['Dans le bloc ▶, donne un nom à ton plug-in et choisis son menu.', 'Clique sur **⬇ Télécharger** en haut à droite.', 'Range le fichier `.py` dans le dossier plug-ins, puis **redémarre GIMP**.', 'Ouvre une image et cherche ton plug-in dans le menu choisi. Clique : ton message apparaît !', 'Quand ça marche, clique sur « J\'ai réussi ».'],
    acts: [{ a: 'download', l: '⬇ Télécharger le plug-in' }],
    manual: true,
    tip: 'Le plug-in n\'apparaît pas ? Vérifie que le fichier est bien dans le dossier plug-ins (pas dans un sous-dossier en trop), qu\'il se termine par .py, et que GIMP a été redémarré. Sous Linux, il faut aussi le paquet gimp-python.' },
  { id: 'layer', lvl: 1, t: 'Agir sur l\'image : un nouveau calque',
    goal: 'Créer un calque rempli de blanc dans l\'image.',
    p: ['Un **calque** est une feuille transparente posée sur l\'image. Les blocs violets (📑 Calques) les créent et les modifient.',
      'Le bloc « nouveau calque » de la catégorie ⚡ Raccourcis fait en une fois ce que les programmeurs écrivent en 3 lignes : créer le calque, l\'ajouter à l\'image, le remplir.',
      'Remarque les ovales bleus « 🖼️ image actuelle » : ce sont des **valeurs**. Ils désignent l\'image sur laquelle tu as lancé le plug-in.'],
    steps: ['Ajoute le bloc ci-dessous.', 'Change son nom (« Mon calque ») et choisis « blanc » dans la liste.', 'Télécharge, remplace l\'ancien fichier dans GIMP, redémarre et essaie.'],
    blocks: ['fast_layer_new'],
    check: function (ws) { return has(ws, NEW_LAYER); },
    hint: 'Il faut un bloc qui crée un calque (catégorie 📑 Calques ou ⚡ Raccourcis).' },
  { id: 'settings', lvl: 1, t: 'Poser une question à l\'utilisateur',
    goal: 'Demander un nombre au lancement et s\'en servir.',
    p: ['Quand un plug-in a des **réglages**, GIMP ouvre une petite fenêtre avant de le lancer : l\'utilisateur y choisit un nombre, un texte, une couleur…',
      'Les réglages se rangent dans la partie « d\'abord, demander » du bloc ▶. Ensuite, le bloc « 🎛️ valeur du réglage » (catégorie ▶ Démarrer) donne ce que l\'utilisateur a choisi.'],
    steps: ['Ouvre la catégorie **▶ Démarrer & réglages** et glisse un réglage « 🔢 nombre entier » dans « d\'abord, demander ». Donne-lui un nom, par exemple `opacite`.', 'Ajoute le bloc « opacité de … » ci-dessous.', 'Dans sa case du pourcentage, dépose le bloc 🎛️ du réglage (il apparaît dans la catégorie ▶ Démarrer une fois le réglage créé).'],
    blocks: ['lyr_opacity'],
    check: function (ws) { return settings(ws).some(function (b) { return GA.SPEC[b.type] && GA.SPEC[b.type].kind === 'setting'; }) && has(ws, 'g_setting_get'); },
    hint: 'Il faut au moins un réglage dans « d\'abord, demander » ET un bloc 🎛️ qui l\'utilise dans les actions.' },

  { id: 'vars', lvl: 2, t: 'Les variables : des boîtes pour retenir',
    goal: 'Ranger une valeur dans une variable, puis la réutiliser.',
    p: ['Une **variable** est une boîte avec un nom. On y range une valeur (un nombre, un texte, un calque…) pour s\'en resservir plus tard.',
      '« mettre `x` à 5 » range 5 dans la boîte `x`. Ensuite, chaque bloc `x` vaut 5. Si tu remets autre chose dans `x`, l\'ancienne valeur est remplacée.',
      'Les blocs qui créent quelque chose (calque, texte, image) ont souvent une flèche **→ dans** : le résultat est rangé dans une variable, pour que tu puisses le modifier ensuite.'],
    steps: ['Ouvre **📦 Variables & listes** et clique sur « ➕ Créer une variable ». Appelle-la `nom`.', 'Ajoute « mettre … à … » et mets-y un texte, par exemple « Bonjour ».', 'Ajoute « 💬 afficher le message » et dépose-y le bloc de ta variable.'],
    blocks: ['msg_show'],
    check: function (ws) { return has(ws, 'g_var_set') && has(ws, 'g_var_get'); },
    hint: 'Il faut un bloc « mettre … à … » ET un bloc variable qui la relit.' },
  { id: 'loops', lvl: 2, t: 'Répéter : les boucles',
    goal: 'Créer 5 calques d\'un coup.',
    p: ['Un ordinateur ne se lasse jamais : une **boucle** refait les mêmes blocs autant de fois qu\'on veut.',
      '« répéter 10 fois » est la plus simple. « compter avec `i` de 1 à 10 » fait pareil, mais la variable `i` vaut 1, puis 2, puis 3… : pratique pour numéroter.',
      'Les blocs en forme de **C** contiennent d\'autres blocs : tout ce qui est à l\'intérieur est répété.'],
    steps: ['Ajoute le bloc « compter avec … » ci-dessous et mets 5 comme fin.', 'Glisse un bloc « nouveau calque » **à l\'intérieur** du C.', 'Bonus : dans le nom du calque, utilise « regrouper … et … » (🧮 Calculs & texte) pour écrire « Calque » + `i`.'],
    blocks: ['c_for', 'fast_layer_new'],
    check: function (ws) { return hasInside(ws, ['c_repeat', 'c_for', 'c_while'], NEW_LAYER); },
    hint: 'Le bloc qui crée le calque doit être DANS le C de la boucle, pas en dessous.' },
  { id: 'ifs', lvl: 2, t: 'Choisir : les conditions',
    goal: 'Faire quelque chose seulement si l\'image est plus large que haute.',
    p: ['« **si** … **alors** … » ne fait les blocs de l\'intérieur que si la condition est vraie.',
      'Une condition est un bloc **hexagonal** (pointu des deux côtés) : une comparaison comme « … > … », « … contient … », « … et … ».',
      'Avec « si … alors … sinon … », tu choisis entre deux chemins.'],
    steps: ['Ajoute « si … alors ».', 'Dans sa case pointue, dépose une comparaison « … > … ».', 'À gauche, mets « largeur de image actuelle » ; à droite, « hauteur de image actuelle ».', 'Dans le C, mets un message « Image en paysage ! ».'],
    blocks: ['c_if', 'op_compare', 'img_width', 'img_height', 'msg_show'],
    check: function (ws) { return inProg(ws, ['c_if', 'c_ifelse']).some(function (b) { var c = b.getInputTargetBlock('C'); return !!c; }); },
    hint: 'Il faut un « si … alors » dont la case pointue contient une condition.' },
  { id: 'eachlayer', lvl: 2, t: 'Parcourir tous les calques',
    goal: 'Faire la même chose sur chaque calque de l\'image.',
    p: ['« pour chaque calque `calque` de image actuelle » est une boucle spéciale : à chaque tour, la variable `calque` contient **un** calque de l\'image, puis le suivant…',
      'C\'est comme ça qu\'on renomme, cache ou modifie 200 calques en un clic. Avec la case « chercher aussi dans les groupes », les calques rangés dans des dossiers sont aussi visités.'],
    steps: ['Ajoute « pour chaque calque ».', 'Dedans, mets « opacité de … » et dépose la variable `calque` dans sa première case.', 'Choisis 50 % : tous tes calques deviennent à moitié transparents.'],
    blocks: ['c_foreach_layer', 'lyr_opacity'],
    check: function (ws) { return hasInside(ws, ['c_foreach_layer', 'c_each_layer_all'], LAYER_ACTIONS); },
    hint: 'Il faut une action sur un calque (opacité, renommer, visibilité…) DANS la boucle « pour chaque calque ».' },

  { id: 'select', lvl: 3, t: 'Sélectionner et peindre',
    goal: 'Remplir un rectangle de couleur.',
    p: ['La **sélection** (les pointillés) limite les actions à une zone. Dans GIMP, presque tous les filtres et remplissages ne touchent que la sélection.',
      'Les positions se comptent en pixels depuis le **coin en haut à gauche** : x vers la droite, y vers le bas.',
      'Pense à tout désélectionner à la fin, pour rendre la main proprement à l\'utilisateur.'],
    steps: ['Ajoute « couleur de premier plan » et choisis une couleur.', 'Ajoute « sélectionner un rectangle » (x 0, y 0, 200 × 100).', 'Ajoute « remplir la sélection de … avec couleur de premier plan ».', 'Termine par « tout désélectionner ».'],
    blocks: ['paint_fg', 'sel_rect', 'paint_fill_sel', 'sel_none'],
    check: function (ws) { return has(ws, ['sel_rect', 'sel_ellipse', 'sel_all', 'sel_color', 'sel_item']) && has(ws, ['paint_fill_sel', 'paint_stroke_sel', 'paint_clear']); },
    hint: 'Il faut une sélection (rectangle, ellipse…) ET un remplissage de la sélection.' },
  { id: 'text', lvl: 3, t: 'Écrire du texte',
    goal: 'Ajouter un calque de texte sur l\'image.',
    p: ['Le bloc « écrire … » crée un **calque de texte** : police, taille, couleur et position se règlent dans le bloc.',
      'Le calque de texte est rangé dans une variable (→ dans `texte`) : tu peux ensuite le déplacer, changer son opacité, etc.'],
    steps: ['Ajoute le bloc « écrire ».', 'Mets ton texte, une taille de 60 px, une couleur.', 'Bonus : utilise un réglage « texte court » pour que l\'utilisateur choisisse le texte.'],
    blocks: ['txt_new'],
    check: function (ws) { return has(ws, 'txt_new'); },
    hint: 'Il faut un bloc « écrire … » (catégorie 🔤 Texte).' },
  { id: 'allimages', lvl: 3, t: 'Travailler sur toutes les images ouvertes',
    goal: 'Appliquer une action à chaque image ouverte, avec une annulation propre.',
    p: ['Un plug-in n\'est pas obligé de travailler seulement sur l\'image actuelle. « pour chaque image ouverte » passe sur **toutes** les images ouvertes dans GIMP.',
      'Chaque action compte normalement comme une étape d\'annulation. Le raccourci ⚡ regroupe tout ce que le plug-in fait sur une image en **un seul Ctrl+Z**.',
      'Dans la boucle, utilise la variable `img` à la place de « image actuelle ».'],
    steps: ['Ajoute « pour chaque image ouverte (une annulation par image) ».', 'Dedans, mets « aplatir … » et dépose `img` dans sa case.', 'Ouvre 3 images dans GIMP et lance ton plug-in.'],
    blocks: ['c_each_image_undo', 'img_flatten'],
    check: function (ws) { return inProg(ws, ['c_each_image_undo', 'c_foreach_image', 'c_each_layer_all']).some(function (b) { return b.getInputTargetBlock('DO'); }); },
    hint: 'Il faut une boucle sur les images ouvertes avec au moins un bloc à l\'intérieur.' },
  { id: 'batch', lvl: 3, t: 'Traiter un dossier entier (lot)',
    goal: 'Ouvrir chaque image d\'un dossier, la modifier et l\'exporter en PNG.',
    p: ['Le **traitement par lot** est la vraie superpuissance des scripts : 500 fichiers traités pendant que tu prends un café.',
      'Le raccourci « pour chaque fichier image du dossier » ouvre chaque fichier sans fenêtre, fait tes blocs, puis libère la mémoire.',
      'Astuce : ajoute un réglage « 📁 dossier à choisir » pour que l\'utilisateur choisisse le dossier dans GIMP.'],
    steps: ['Ajoute le bloc de lot ci-dessous, avec l\'extension `.jpg`.', 'Dedans, mets « exporter … en PNG vers … » avec `img`.', 'Pour le chemin, regroupe le nom du fichier et « .png » (🧮 Calculs & texte).'],
    blocks: ['c_each_file_open', 'file_png'],
    check: function (ws) { return hasInside(ws, ['c_each_file_open', 'c_foreach_file'], ['file_png', 'file_jpg', 'file_save_xcf', 'file_save_next', 'file_layer_png']); },
    hint: 'Il faut un enregistrement ou un export DANS une boucle sur les fichiers d\'un dossier.' },

  { id: 'readcode', lvl: 4, t: 'Lire le Python que tu as construit',
    goal: 'Comprendre le lien entre un bloc et ses lignes de code.',
    p: ['Chaque bloc correspond à une ou plusieurs lignes de **Python 2.7**, le langage des plug-ins de GIMP 2.10.',
      'Dans l\'onglet 🐍 Code, **clique sur un bloc** : ses lignes s\'allument. **Clique sur une ligne** : son bloc est sélectionné. C\'est la meilleure façon d\'apprendre à lire le code.',
      'À retenir : en Python, ce qui est **décalé vers la droite** (l\'indentation) est « à l\'intérieur » — exactement comme les blocs dans un C.',
      '- `pdb.gimp_...(...)` : un appel à une fonction de GIMP',
      '- `x = ...` : on range une valeur dans la variable `x`',
      '- `for ... in ...:` : une boucle ; `if ...:` : une condition'],
    steps: ['Ouvre l\'onglet 🐍 Code.', 'Clique sur trois blocs différents et regarde les lignes qui s\'allument.'],
    acts: [{ a: 'tab', x: 'code', l: '🐍 Ouvrir l\'onglet Code' }],
    check: function (ws, f) { return !!f.tab_code; },
    hint: 'Ouvre l\'onglet 🐍 Code, dans le panneau de droite.' },
  { id: 'pyblocks', lvl: 4, t: 'Passer aux blocs Python',
    goal: 'Transformer ton plug-in en blocs Python, une ligne = un bloc.',
    p: ['Les blocs simples sont confortables, mais les blocs **Python** te montrent tout le code, ligne par ligne, et te laissent tout modifier.',
      'Dans les blocs Python, les couleurs t\'aident :',
      '- pastille **orange** : une variable (`image`, `calque`, `x`)',
      '- pastille **violette** : une constante de GIMP (`FILL_WHITE`, `NORMAL_MODE`)',
      '- pastille **jaune** : une fonction de GIMP (`pdb.…`)',
      '- blocs verts : les calculs et comparaisons (`+`, `==`, `and`…)',
      'Clique sur une pastille et tape quelques lettres : une liste de propositions s\'ouvre.'],
    steps: ['Clique sur le bouton ci-dessous (ou Fichier ▸ Voir ce plug-in en blocs Python).', 'Explore : clique sur une pastille orange et regarde les variables proposées.'],
    acts: [{ a: 'convert', l: '🔁 Voir mon plug-in en blocs Python' }],
    check: function (ws) { return !!ws.getBlocksByType('py_file', false)[0]; },
    hint: 'Il faut convertir ton plug-in (ou importer un script) : un bloc « 📄 script Python » doit être présent.' },
  { id: 'pdb', lvl: 4, t: 'Les 857 fonctions de GIMP',
    goal: 'Appeler une fonction de la PDB avec les bons arguments.',
    p: ['La **PDB** (Procedure DataBase) est la liste de tout ce que GIMP sait faire : 857 fonctions. Tout ce que tu fais à la souris dans GIMP a sa fonction.',
      'Dans un bloc « appeler … », clique sur le nom de la fonction et tape un mot, en français ou en anglais : **flou**, **calque**, **texte**… La liste montre chaque fonction avec ses arguments et une explication. Choisis : les cases se remplissent toutes seules.',
      'Le 🔍 du bloc ouvre la liste complète, rangée par groupes.',
      'Règle d\'or : le `run_mode` ne se passe **jamais** — pygimp l\'ajoute lui-même.'],
    steps: ['Ajoute un bloc « appeler … » (catégorie 🐍 Python).', 'Clique sur son nom, tape « flou » et choisis `plug_in_gauss`.', 'Remplace les 0.0 par 5.0 pour un flou de 5 pixels.'],
    blocks: ['py_callst'],
    check: function (ws) { return calls(ws).some(function (c) { var m = /^pdb\.(\w+)$/.exec(c.f), s = m && GA.SIGS && GA.SIGS[m[1]]; return s && c.b.a_.length === s[4].length && c.b.a_.every(function (k, i) { return c.b.getInputTargetBlock('A' + i); }); }); },
    hint: 'Il faut un appel `pdb.…` vers une vraie fonction de GIMP, avec toutes ses cases remplies.' },
  { id: 'debug', lvl: 4, t: 'Déboguer comme un pro',
    goal: 'Trouver et comprendre une erreur.',
    p: ['Tout le monde fait des erreurs, même les pros. La différence : ils savent **où regarder**.',
      '- L\'onglet **✅ Vérification** trouve beaucoup d\'erreurs **avant** GIMP : case vide, mauvais nombre d\'arguments, fonction inconnue… Clique sur un problème pour voir le bloc.',
      '- Dans GIMP, les erreurs s\'affichent dans **Fenêtres ▸ Fenêtres ancrables ▸ Console d\'erreurs**.',
      '- Pour voir ce que vaut une variable pendant l\'exécution, affiche-la : `pdb.gimp_message(str(x))`.',
      '- **Filtres ▸ Python-Fu ▸ Console** permet d\'essayer une ligne de Python directement dans GIMP.',
      'Lis les erreurs **de bas en haut** : la dernière ligne dit ce qui ne va pas, celle du dessus dit où.'],
    steps: ['Ouvre l\'onglet ✅ Vérification.', 'Ajoute un « appeler … » vers `pdb.gimp_message` et mets une variable dedans, par exemple `str(image.width)`.'],
    acts: [{ a: 'tab', x: 'check', l: '✅ Ouvrir la Vérification' }],
    check: function (ws, f) { return !!f.tab_check && calls(ws).some(function (c) { return /^(pdb\.gimp_message|gimp\.message)$/.test(c.f) && inside(c.b, 'py_var'); }); },
    hint: 'Ouvre l\'onglet ✅ Vérification, puis ajoute un message qui affiche une variable.' },
  { id: 'functions', lvl: 4, t: 'Écrire tes propres fonctions',
    goal: 'Ranger un morceau de code dans une fonction et l\'appeler.',
    p: ['Quand tu répètes les mêmes lignes à plusieurs endroits, range-les dans une **fonction** : « définir `ma_fonction(calque)` ». Ensuite, un seul bloc « appeler `ma_fonction(...)` » fait tout.',
      'Les **paramètres** (entre parenthèses) sont des variables remplies au moment de l\'appel. « retourner … » renvoie un résultat.',
      'Un bon nom de fonction dit ce qu\'elle fait : `mettre_en_gris`, `numeroter_calques`… Tes fonctions apparaissent aussi dans les suggestions.'],
    steps: ['Ajoute « définir … » avec le nom `griser` et le paramètre `calque`.', 'Dedans, appelle `pdb.gimp_drawable_desaturate(calque, DESATURATE_LUMINANCE)`.', 'Ailleurs, appelle `griser(drawable)`.'],
    blocks: ['py_def', 'py_callst'],
    check: function (ws) { var defs = inProg(ws, 'py_def').map(function (b) { return b.getFieldValue('NAME'); }); return calls(ws).some(function (c) { return defs.indexOf(c.f) >= 0 && !/^python_fu_/.test(c.f); }); },
    hint: 'Il faut un bloc « définir … » ET un appel à cette fonction (même nom).' },
  { id: 'pro', lvl: 4, t: 'Importer, modifier, partager',
    goal: 'Ouvrir un vrai script existant et le modifier sans le casser.',
    p: ['Tu as trouvé un plug-in sur Internet ? **Fichier ▸ Importer un script Python** : chaque ligne devient un bloc, et le téléchargement redonne **exactement le même fichier** tant que tu ne changes rien. Si tu modifies un bloc, seules ses lignes changent.',
      'L\'**assistant IA** (onglet 🤖) peut écrire une fonction, expliquer un script ou corriger une erreur. Ses réponses sont vérifiées (Python 2.7, vraies fonctions de GIMP, bon nombre d\'arguments) avant de devenir des blocs.',
      'Tu es maintenant capable de lire, écrire et corriger des plug-ins GIMP. La suite : ouvre des scripts d\'autres personnes, lis-les bloc par bloc, et construis les tiens. **Bravo !**'],
    steps: ['Importe un script `.py` (ou un exemple : Fichier ▸ Exemples, puis convertis-le).', 'Change une valeur et regarde dans l\'onglet 🐍 Code quelles lignes ont changé.', 'Quand c\'est fait, clique sur « J\'ai réussi ».'],
    acts: [{ a: 'import', l: '🐍 Importer un script Python' }, { a: 'examples', l: '✨ Exemples' }],
    manual: true }
];

/* ---------- guide d'utilisation ---------- */
GA.GUIDE = [
  { t: '🗺️ L\'écran de l\'atelier', p: [
    '- À **gauche**, les catégories de blocs. Clique sur une catégorie pour voir ses blocs, puis glisse un bloc dans la zone de construction.',
    '- Au **centre**, la zone de construction. Molette : défiler ; Ctrl + molette : zoomer ; glisser dans le vide : se déplacer.',
    '- À **droite**, le panneau : 💡 Aide (sur le bloc sélectionné), 🐍 Code (le Python produit), ✅ Vérification, 🤖 IA et 🎓 Cours.',
    '- En **haut**, les menus, la recherche de blocs (touche /) et le bouton ⬇ Télécharger.'] },
  { t: '🧩 Les formes des blocs', p: [
    '- **Bloc à encoche** : une action. Il s\'empile sous un autre.',
    '- **Bloc arrondi** : une valeur (nombre, texte, calque, variable). Il se glisse dans un trou.',
    '- **Bloc pointu (hexagonal)** : une condition vraie/fausse, pour « si » et « tant que ».',
    '- **Bloc en C** : il contient d\'autres blocs (boucles, conditions, raccourcis).',
    'Un bloc grisé est désactivé : il n\'est pas dans le code. Clic droit sur un bloc : dupliquer, commenter, désactiver, replier, aide.'] },
  { t: '▶ Le bloc de départ', p: [
    'Le bloc jaune **▶ Quand je lance** décrit ton plug-in : son nom dans le menu, le menu où il apparaît, s\'il a besoin d\'une image ouverte, et ses réglages (« d\'abord, demander »).',
    'Les réglages deviennent la fenêtre que GIMP affiche avant de lancer le plug-in. Utilise leur valeur avec les blocs 🎛️ de la catégorie ▶ Démarrer.',
    '**Paramètres ▸ Mon plug-in** règle le reste : auteur, annulation groupée, gestion des erreurs, modules importés.'] },
  { t: '⬇ Télécharger et installer', p: [
    'Clique sur **⬇ Télécharger** : tu obtiens un fichier `.py`. Range-le dans le dossier plug-ins de GIMP et redémarre GIMP.',
    '- **Windows** : `C:\\Users\\<toi>\\AppData\\Roaming\\GIMP\\2.10\\plug-ins`',
    '- **Linux** : `~/.config/GIMP/2.10/plug-ins`, puis `chmod +x fichier.py`',
    '- **macOS** : `~/Library/Application Support/GIMP/2.10/plug-ins`',
    'Le dossier exact est dans **Édition ▸ Préférences ▸ Dossiers ▸ Greffons**. Les plug-ins faits ici marchent dans **GIMP 2.10** (pas dans GIMP 3, qui a une autre API).'] },
  { t: '🐍 Importer un script Python', p: [
    '**Fichier ▸ Importer un script Python**, ou glisse le fichier `.py` sur la page. Chaque ligne devient un bloc Python.',
    'Garantie : tant que tu ne changes rien, le téléchargement redonne **le même fichier, octet pour octet** (commentaires, espaces, tabulations compris). Si tu modifies un bloc, seules ses lignes sont réécrites.',
    'Un script avec une erreur de syntaxe s\'importe quand même : la partie fautive devient un bloc 🧱 « code brut » à corriger.'] },
  { t: '🟠 Les blocs Python et leurs pastilles', p: [
    '- **orange** : variable ; **violet** : constante de GIMP ; **jaune** : fonction de GIMP ; **vert foncé** : autre fonction ; blocs verts : calculs et comparaisons ; cases blanches : valeurs écrites telles quelles.',
    'Clique sur une pastille et tape : une liste de propositions s\'ouvre (flèches ↑↓ puis Entrée, ou clic). Pour une fonction de GIMP, les cases manquantes se remplissent toutes seules.',
    'Clic droit sur un appel de fonction : ajouter ou retirer un argument. Clic droit sur « si » : ajouter « sinon si » ou « sinon ».',
    'La catégorie 🐍 Python liste les variables de ton script et des **raccourcis GIMP** tout prêts (annulation groupée, boucle sur les images, sur les calques…).'] },
  { t: '⚙️ Les 857 fonctions de GIMP (PDB)', p: [
    'Deux façons de les utiliser : le bloc « ⚙️ fonction GIMP » (🧰 Avancé) dans un plug-in en blocs simples, ou le bloc « appeler … » dans les blocs Python.',
    'Recherche : tape un mot en français ou en anglais (flou, calque, sélection, texte…). Les fonctions les plus utilisées sont en premier ; « ancienne » signale une fonction dépréciée qui a une remplaçante.',
    'Le `run_mode` n\'est jamais à fournir : pygimp l\'ajoute. Les tableaux ont souvent un compteur juste avant (ex. `num_points` puis `points`).'] },
  { t: '⚡ Raccourcis GIMP', p: [
    'Des blocs qui remplacent ce que tous les scripts écrivent à la main :',
    '- « en une seule annulation » : tout compte pour un seul Ctrl+Z, même en cas d\'erreur ;',
    '- « en remettant ensuite… » les couleurs et outils, la sélection ou le calque actif ;',
    '- « pour chaque image ouverte », « pour chaque calque de toutes les images », « pour chaque fichier du dossier » ;',
    '- « nouveau calque de la taille de l\'image », « copier le calque dans une autre image ».'] },
  { t: '✅ Vérification et erreurs', p: [
    'L\'onglet **✅ Vérification** relit ton plug-in à chaque modification : 🛑 erreur (il ne marcherait pas), ⚠️ à regarder, ℹ️ information. Clique sur une ligne pour aller au bloc.',
    'Dans GIMP : **Fenêtres ▸ Fenêtres ancrables ▸ Console d\'erreurs** montre les erreurs Python. Les plug-ins faits ici affichent aussi l\'erreur complète dans un message.',
    '**Filtres ▸ Python-Fu ▸ Console** : pour essayer une ligne de Python directement dans GIMP.'] },
  { t: '🤖 L\'assistant IA', p: [
    '**IA ▸ Choisir l\'IA** : n\'importe quel service compatible (OpenAI, Anthropic, Gemini, Mistral…), une IA locale (Ollama, LM Studio) ou le mode copier-coller, sans connexion.',
    'Demande une fonction, un plug-in entier, une correction ou une explication. La réponse est vérifiée et réparée automatiquement avant de devenir des blocs.'] },
  { t: '💾 Sauvegarder ton travail', p: [
    'L\'atelier garde automatiquement ton travail dans ce navigateur.',
    'Pour le garder ailleurs ou le partager : **Fichier ▸ Sauvegarder le projet** (fichier `.json`). Le `.py` téléchargé contient aussi l\'empreinte des blocs : en le réimportant, tu retrouves tes blocs à l\'identique.'] },
  { t: '❓ Problèmes fréquents', p: [
    '- **Le plug-in n\'apparaît pas** : mauvais dossier, GIMP pas redémarré, fichier non exécutable (Linux), ou Python-Fu absent (Linux : paquet `gimp-python`).',
    '- **Le menu est grisé** : le plug-in a besoin d\'une image ouverte (case du bloc ▶).',
    '- **« argument count » / « wrong type »** : regarde l\'onglet ✅ Vérification, il indique le nombre d\'arguments attendu.',
    '- **Accents bizarres** : utilise les blocs de texte de l\'atelier, ils gèrent l\'UTF-8 pour toi.'] }
];

/* ---------- mise en forme ---------- */
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]; }); }
function md(s) {
  return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}
function paras(list) {
  var h = '', ul = false;
  list.forEach(function (x) {
    var t = T(x);
    if (/^- /.test(t)) { if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + md(t.slice(2)) + '</li>'; }
    else { if (ul) { h += '</ul>'; ul = false; } h += '<p>' + md(t) + '</p>'; }
  });
  return h + (ul ? '</ul>' : '');
}
GA.learnMd = paras;

/* ---------- progression ---------- */
var KEY = 'atelier-gimp-learn';
function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ok */ } }
var state = load();
state.done = state.done || {}; state.flags = state.flags || {};
function lesson(id) { return GA.LEARN.filter(function (l) { return l.id === id; })[0]; }

GA.learn = {
  flag: function (name) { if (!state.flags[name]) { state.flags[name] = 1; save(state); GA.learn.check(); } },
  isDone: function (id) { return !!state.done[id]; },
  progress: function () { return GA.LEARN.filter(function (l) { return state.done[l.id]; }).length; },
  current: function () { return state.cur && lesson(state.cur) ? state.cur : null; },
  open: function (id) {
    state.cur = id || state.cur || GA.LEARN[0].id; save(state);
    if (GA.app && GA.app.showTab) GA.app.showTab('learn');
    GA.learn.render();
  },
  list: function () { state.cur = null; save(state); GA.learn.render(); },
  /* vérifie la mission de la leçon ouverte (appelé à chaque modification) */
  check: function () {
    var l = GA.learn.current() && lesson(state.cur), ws = GA.ws;
    if (!l || !ws || l.manual || state.done[l.id]) return;
    var ok = false;
    try { ok = !!l.check(ws, state.flags); } catch (e) { ok = false; }
    if (ok) { state.done[l.id] = 1; save(state); GA.learn.render(); if (GA.toast) GA.toast('🎉 ' + T('Mission réussie !')); }
  },
  reset: function () { state = { done: {}, flags: {} }; save(state); GA.learn.render(); },
  render: function () {
    var el = document.getElementById('p-learn');
    if (!el) return;
    var l = GA.learn.current() && lesson(state.cur);
    el.innerHTML = l ? lessonHtml(l) : listHtml();
    wire(el, l);
  }
};

function bar() {
  var n = GA.learn.progress(), tot = GA.LEARN.length;
  return '<div class="lnBar"><div style="width:' + Math.round(100 * n / tot) + '%"></div></div><div class="lnCount">' + n + ' / ' + tot + ' ' + esc(T('leçons réussies')) + '</div>';
}
function listHtml() {
  var h = '<h2>🎓 ' + esc(T('Cours : de débutant complet à pro')) + '</h2><p class="muted">' + esc(T('Chaque leçon explique une idée, puis te donne une mission. L\'atelier vérifie tout seul quand tu as réussi.')) + '</p>' + bar();
  var next = GA.LEARN.filter(function (x) { return !state.done[x.id]; })[0];
  if (next) h += '<p><button class="btn primary" data-open="' + next.id + '">▶ ' + esc(GA.learn.progress() ? T('Continuer') : T('Commencer le cours')) + ' : ' + esc(T(next.t)) + '</button></p>';
  GA.LEARN_LEVELS.forEach(function (lv) {
    h += '<h3>' + esc(T(lv.t)) + '</h3><p class="muted lnLvl">' + esc(T(lv.d)) + '</p><div class="lnList">';
    GA.LEARN.filter(function (x) { return x.lvl === lv.n; }).forEach(function (x, i) {
      h += '<button class="lnItem' + (state.done[x.id] ? ' done' : '') + '" data-open="' + x.id + '"><span class="lnMark">' + (state.done[x.id] ? '✅' : (GA.LEARN.indexOf(x) + 1)) + '</span><span>' + esc(T(x.t)) + '</span></button>';
    });
    h += '</div>';
  });
  h += '<p class="lnFoot"><button class="btn" data-guide="1">📘 ' + esc(T('Guide d\'utilisation')) + '</button> <button class="btn" data-reset="1">↺ ' + esc(T('Recommencer le cours')) + '</button></p>';
  return h;
}
function blockChip(type) {
  var sp = GA.SPEC[type];
  if (!sp) return '';
  var cat = GA.CAT[sp.cat] || {}, title = GA.titleOf ? GA.titleOf(sp) : type;
  var col = sp.cat === 'py' ? '#3776AB' : cat.colour;
  return '<button class="lnBlock" data-add="' + type + '" style="background:' + col + '" title="' + esc(T('Ajouter ce bloc')) + '">＋ ' + esc(title) + '</button>';
}
function lessonHtml(l) {
  var idx = GA.LEARN.indexOf(l), lv = GA.LEARN_LEVELS[l.lvl - 1], done = !!state.done[l.id];
  var h = '<p class="lnNav"><button class="btn" data-list="1">☰ ' + esc(T('Toutes les leçons')) + '</button><span class="muted">' + esc(T(lv.t)) + ' · ' + (idx + 1) + ' / ' + GA.LEARN.length + '</span></p>';
  h += '<h2>' + esc(T(l.t)) + '</h2>';
  h += '<div class="lnGoal">🎯 ' + md(T(l.goal)) + '</div>';
  h += '<div class="lnText">' + paras(l.p) + '</div>';
  h += '<h3>🧭 ' + esc(T('Ta mission')) + '</h3><ol class="steps">' + l.steps.map(function (s) { return '<li>' + md(T(s)) + '</li>'; }).join('') + '</ol>';
  if (l.blocks && l.blocks.length) h += '<p class="muted">' + esc(T('Clique sur un bloc pour l\'ajouter :')) + '</p><div class="lnBlocks">' + l.blocks.map(blockChip).join('') + '</div>';
  if (l.acts) h += '<div class="lnActs">' + l.acts.map(function (a, i) { return '<button class="btn" data-act-i="' + i + '">' + esc(T(a.l)) + '</button>'; }).join('') + '</div>';
  if (l.tip) h += '<div class="tip">💡 ' + md(T(l.tip)) + '</div>';
  if (done) h += '<div class="lnOk">🎉 ' + esc(T('Mission réussie !')) + '</div>';
  else if (l.manual) h += '<p><button class="btn primary" data-manual="1">✔ ' + esc(T('J\'ai réussi')) + '</button></p>';
  else h += '<div class="lnWait"><span>⏳ ' + esc(T('L\'atelier vérifie ta mission pendant que tu travailles.')) + '</span><button class="btn" data-hint="1">' + esc(T('Un indice ?')) + '</button></div><div class="lnHint" hidden>💡 ' + md(T(l.hint || '')) + '</div>';
  h += '<p class="lnNav2">' + (idx > 0 ? '<button class="btn" data-open="' + GA.LEARN[idx - 1].id + '">← ' + esc(T('Précédente')) + '</button>' : '<span></span>') +
    (idx < GA.LEARN.length - 1 ? '<button class="btn' + (done ? ' primary' : '') + '" data-open="' + GA.LEARN[idx + 1].id + '">' + esc(T('Suivante')) + ' →</button>' : '') + '</p>';
  return h;
}
function wire(el, l) {
  el.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { GA.learn.open(b.getAttribute('data-open')); el.scrollTop = 0; }; });
  el.querySelectorAll('[data-list]').forEach(function (b) { b.onclick = GA.learn.list; });
  el.querySelectorAll('[data-guide]').forEach(function (b) { b.onclick = function () { GA.openGuide(); }; });
  el.querySelectorAll('[data-reset]').forEach(function (b) { b.onclick = function () { GA.app.confirmBox(T('Recommencer le cours ?'), T('Ta progression dans le cours sera effacée.'), T('Recommencer'), function (ok) { if (ok) GA.learn.reset(); }); }; });
  el.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { addBlock(b.getAttribute('data-add')); }; });
  el.querySelectorAll('[data-manual]').forEach(function (b) { b.onclick = function () { state.done[l.id] = 1; save(state); GA.learn.render(); }; });
  el.querySelectorAll('[data-hint]').forEach(function (b) { b.onclick = function () { var x = el.querySelector('.lnHint'); if (x) x.hidden = false; }; });
  el.querySelectorAll('[data-act-i]').forEach(function (b) { b.onclick = function () { runAct(l.acts[+b.getAttribute('data-act-i')]); }; });
}
function runAct(a) {
  var app = GA.app || {};
  if (a.a === 'tab' && app.showTab) app.showTab(a.x);
  else if (a.a === 'download' && app.openExport) app.openExport();
  else if (a.a === 'convert' && app.convertToPython) app.convertToPython();
  else if (a.a === 'import' && GA.actions) GA.actions.importFile();
  else if (a.a === 'examples' && app.openExamples) app.openExamples();
}
/* ajoute un bloc ; une action s'accroche au bout du programme (sous « puis faire » ou dans le script) */
function addBlock(type) {
  var ws = GA.ws, Blockly = root.Blockly;
  if (!ws || !Blockly) return;
  var st = GA.toolboxEntry(GA.SPEC[type]);
  delete st.kind;
  var blk = Blockly.serialization.blocks.append(st, ws);
  var h = hat(ws), input = h && (h.getInput('DO') ? 'DO' : null);
  if (blk.previousConnection && input) {
    var c = h.getInput(input).connection, last = h.getInputTargetBlock(input);
    while (last && last.getNextBlock()) last = last.getNextBlock();
    try { (last ? last.nextConnection : c).connect(blk.previousConnection); } catch (e) { /* forme incompatible : on le pose à côté */ }
  }
  if (!blk.getParent()) { var vm = ws.getMetricsManager().getViewMetrics(true); blk.moveBy(vm.left + vm.width * 0.35, vm.top + 60); }
  blk.select();
  ws.centerOnBlock(blk.id);
}

/* ---------- le guide ---------- */
GA.openGuide = function (k) {
  if (!GA.app || !GA.app.openDialog) return;
  k = k || 0;
  var toc = GA.GUIDE.map(function (s, i) { return '<button class="gdTab' + (i === k ? ' on' : '') + '" data-g="' + i + '">' + esc(T(s.t)) + '</button>'; }).join('');
  var d = GA.app.openDialog('<h2>📘 ' + esc(T('Guide d\'utilisation')) + '</h2><div class="gdWrap"><nav class="gdToc">' + toc + '</nav><div class="gdBody" id="gdBody"></div></div>' +
    '<div class="foot"><button class="btn" id="gdCourse">🎓 ' + esc(T('Suivre le cours')) + '</button><button class="btn primary" id="gdOk">OK</button></div>', 'wide');
  function show(i) {
    d.querySelectorAll('.gdTab').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-g') === i); });
    d.querySelector('#gdBody').innerHTML = '<h3>' + esc(T(GA.GUIDE[i].t)) + '</h3>' + paras(GA.GUIDE[i].p);
    d.querySelector('#gdBody').scrollTop = 0;
  }
  d.querySelectorAll('.gdTab').forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-g')); }; });
  d.querySelector('#gdOk').onclick = GA.app.closeDialog;
  d.querySelector('#gdCourse').onclick = function () { GA.app.closeDialog(); GA.learn.open(); };
  show(k);
};
})(typeof window !== 'undefined' ? window : globalThis);
