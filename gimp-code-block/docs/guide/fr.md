# Guide d'utilisation — GIMP Code Block

## 🗺️ L'écran de l'atelier

- À **gauche**, les catégories de blocs. Clique sur une catégorie pour voir ses blocs, puis glisse un bloc dans la zone de construction.
- Au **centre**, la zone de construction. Molette : défiler ; Ctrl + molette : zoomer ; glisser dans le vide : se déplacer.
- À **droite**, le panneau : 💡 Aide (sur le bloc sélectionné), 🐍 Code (le Python produit), ✅ Vérification, 🤖 IA et 🎓 Cours.
- En **haut**, les menus, la recherche de blocs (touche /) et le bouton ⬇ Télécharger.

## 🧩 Les formes des blocs

- **Bloc à encoche** : une action. Il s'empile sous un autre.
- **Bloc arrondi** : une valeur (nombre, texte, calque, variable). Il se glisse dans un trou.
- **Bloc pointu (hexagonal)** : une condition vraie/fausse, pour « si » et « tant que ».
- **Bloc en C** : il contient d'autres blocs (boucles, conditions, raccourcis).

Un bloc grisé est désactivé : il n'est pas dans le code. Clic droit sur un bloc : dupliquer, commenter, désactiver, replier, aide.

## ▶ Le bloc de départ

Le bloc jaune **▶ Quand je lance** décrit ton plug-in : son nom dans le menu, le menu où il apparaît, s'il a besoin d'une image ouverte, et ses réglages (« d'abord, demander »).

Les réglages deviennent la fenêtre que GIMP affiche avant de lancer le plug-in. Utilise leur valeur avec les blocs 🎛️ de la catégorie ▶ Démarrer.

**Paramètres ▸ Mon plug-in** règle le reste : auteur, annulation groupée, gestion des erreurs, modules importés.

## ⬇ Télécharger et installer

Clique sur **⬇ Télécharger** : tu obtiens un fichier `.py`. Range-le dans le dossier plug-ins de GIMP et redémarre GIMP.
- **Windows** : `C:\Users\<toi>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux** : `~/.config/GIMP/2.10/plug-ins`, puis `chmod +x fichier.py`
- **macOS** : `~/Library/Application Support/GIMP/2.10/plug-ins`

Le dossier exact est dans **Édition ▸ Préférences ▸ Dossiers ▸ Greffons**. Les plug-ins faits ici marchent dans **GIMP 2.10** (pas dans GIMP 3, qui a une autre API).

## 🐍 Importer un script Python

**Fichier ▸ Importer un script Python**, ou glisse le fichier `.py` sur la page. Chaque ligne devient un bloc Python.

Garantie : tant que tu ne changes rien, le téléchargement redonne **le même fichier, octet pour octet** (commentaires, espaces, tabulations compris). Si tu modifies un bloc, seules ses lignes sont réécrites.

Un script avec une erreur de syntaxe s'importe quand même : la partie fautive devient un bloc 🧱 « code brut » à corriger.

## 🟠 Les blocs Python et leurs pastilles

- **orange** : variable ; **violet** : constante de GIMP ; **jaune** : fonction de GIMP ; **vert foncé** : autre fonction ; blocs verts : calculs et comparaisons ; cases blanches : valeurs écrites telles quelles.

Clique sur une pastille et tape : une liste de propositions s'ouvre (flèches ↑↓ puis Entrée, ou clic). Pour une fonction de GIMP, les cases manquantes se remplissent toutes seules.

Clic droit sur un appel de fonction : ajouter ou retirer un argument. Clic droit sur « si » : ajouter « sinon si » ou « sinon ».

La catégorie 🐍 Python liste les variables de ton script et des **raccourcis GIMP** tout prêts (annulation groupée, boucle sur les images, sur les calques…).

## ⚙️ Les 857 fonctions de GIMP (PDB)

Deux façons de les utiliser : le bloc « ⚙️ fonction GIMP » (🧰 Avancé) dans un plug-in en blocs simples, ou le bloc « appeler … » dans les blocs Python.

Recherche : tape un mot en français ou en anglais (flou, calque, sélection, texte…). Les fonctions les plus utilisées sont en premier ; « ancienne » signale une fonction dépréciée qui a une remplaçante.

Le `run_mode` n'est jamais à fournir : pygimp l'ajoute. Les tableaux ont souvent un compteur juste avant (ex. `num_points` puis `points`).

## ⚡ Raccourcis GIMP

Des blocs qui remplacent ce que tous les scripts écrivent à la main :
- « en une seule annulation » : tout compte pour un seul Ctrl+Z, même en cas d'erreur ;
- « en remettant ensuite… » les couleurs et outils, la sélection ou le calque actif ;
- « pour chaque image ouverte », « pour chaque calque de toutes les images », « pour chaque fichier du dossier » ;
- « nouveau calque de la taille de l'image », « copier le calque dans une autre image ».

## ✅ Vérification et erreurs

L'onglet **✅ Vérification** relit ton plug-in à chaque modification : 🛑 erreur (il ne marcherait pas), ⚠️ à regarder, ℹ️ information. Clique sur une ligne pour aller au bloc.

Dans GIMP : **Fenêtres ▸ Fenêtres ancrables ▸ Console d'erreurs** montre les erreurs Python. Les plug-ins faits ici affichent aussi l'erreur complète dans un message.

**Filtres ▸ Python-Fu ▸ Console** : pour essayer une ligne de Python directement dans GIMP.

## 🤖 L'assistant IA

**IA ▸ Choisir l'IA** : n'importe quel service compatible (OpenAI, Anthropic, Gemini, Mistral…), une IA locale (Ollama, LM Studio) ou le mode copier-coller, sans connexion.

Demande une fonction, un plug-in entier, une correction ou une explication. La réponse est vérifiée et réparée automatiquement avant de devenir des blocs.

## 💾 Sauvegarder ton travail

L'atelier garde automatiquement ton travail dans ce navigateur.

Pour le garder ailleurs ou le partager : **Fichier ▸ Sauvegarder le projet** (fichier `.json`). Le `.py` téléchargé contient aussi l'empreinte des blocs : en le réimportant, tu retrouves tes blocs à l'identique.

## ❓ Problèmes fréquents

- **Le plug-in n'apparaît pas** : mauvais dossier, GIMP pas redémarré, fichier non exécutable (Linux), ou Python-Fu absent (Linux : paquet `gimp-python`).
- **Le menu est grisé** : le plug-in a besoin d'une image ouverte (case du bloc ▶).
- **« argument count » / « wrong type »** : regarde l'onglet ✅ Vérification, il indique le nombre d'arguments attendu.
- **Accents bizarres** : utilise les blocs de texte de l'atelier, ils gèrent l'UTF-8 pour toi.

---

# Cours : de débutant complet à pro

Chaque leçon explique une idée, puis te donne une mission. L'atelier vérifie tout seul quand tu as réussi.

## 🌱 Niveau 1 — Premiers pas

*Tu n'as jamais programmé ? Parfait, on commence ici.*

### 1. Ton premier plug-in

🎯 **Faire afficher « Bonjour » par GIMP.**

Un **plug-in** est un petit programme qui ajoute une commande dans les menus de GIMP. Ici, tu le construis en emboîtant des blocs, comme un puzzle : l'atelier écrit le vrai code Python à ta place.

Tout plug-in commence par le bloc jaune **▶ Quand je lance**. Les blocs rangés sous « puis faire » s'exécutent **de haut en bas**, un par un.

**Ta mission**

1. Clique sur le bloc ci-dessous pour l'ajouter : il s'accroche tout seul sous « puis faire ».
2. Clique dans la case blanche du message et écris ton texte.
3. Regarde l'onglet 🐍 Code : la ligne `pdb.gimp_message(...)` est apparue.

### 2. Installer ton plug-in dans GIMP

🎯 **Voir ton plug-in dans les menus de GIMP et le lancer.**

GIMP charge les plug-ins au démarrage, depuis un dossier spécial appelé **plug-ins**.
- **Windows** : `C:\Users\<toi>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux** : `~/.config/GIMP/2.10/plug-ins` (puis rends le fichier exécutable : `chmod +x fichier.py`)
- **macOS** : `~/Library/Application Support/GIMP/2.10/plug-ins`

Le chemin exact est écrit dans GIMP : **Édition ▸ Préférences ▸ Dossiers ▸ Greffons**.

**Ta mission**

1. Dans le bloc ▶, donne un nom à ton plug-in et choisis son menu.
2. Clique sur **⬇ Télécharger** en haut à droite.
3. Range le fichier `.py` dans le dossier plug-ins, puis **redémarre GIMP**.
4. Ouvre une image et cherche ton plug-in dans le menu choisi. Clique : ton message apparaît !
5. Quand ça marche, clique sur « J'ai réussi ».

> 💡 Le plug-in n'apparaît pas ? Vérifie que le fichier est bien dans le dossier plug-ins (pas dans un sous-dossier en trop), qu'il se termine par .py, et que GIMP a été redémarré. Sous Linux, il faut aussi le paquet gimp-python.

### 3. Agir sur l'image : un nouveau calque

🎯 **Créer un calque rempli de blanc dans l'image.**

Un **calque** est une feuille transparente posée sur l'image. Les blocs violets (📑 Calques) les créent et les modifient.

Le bloc « nouveau calque » de la catégorie ⚡ Raccourcis fait en une fois ce que les programmeurs écrivent en 3 lignes : créer le calque, l'ajouter à l'image, le remplir.

Remarque les ovales bleus « 🖼️ image actuelle » : ce sont des **valeurs**. Ils désignent l'image sur laquelle tu as lancé le plug-in.

**Ta mission**

1. Ajoute le bloc ci-dessous.
2. Change son nom (« Mon calque ») et choisis « blanc » dans la liste.
3. Télécharge, remplace l'ancien fichier dans GIMP, redémarre et essaie.

### 4. Poser une question à l'utilisateur

🎯 **Demander un nombre au lancement et s'en servir.**

Quand un plug-in a des **réglages**, GIMP ouvre une petite fenêtre avant de le lancer : l'utilisateur y choisit un nombre, un texte, une couleur…

Les réglages se rangent dans la partie « d'abord, demander » du bloc ▶. Ensuite, le bloc « 🎛️ valeur du réglage » (catégorie ▶ Démarrer) donne ce que l'utilisateur a choisi.

**Ta mission**

1. Ouvre la catégorie **▶ Démarrer & réglages** et glisse un réglage « 🔢 nombre entier » dans « d'abord, demander ». Donne-lui un nom, par exemple `opacite`.
2. Ajoute le bloc « opacité de … » ci-dessous.
3. Dans sa case du pourcentage, dépose le bloc 🎛️ du réglage (il apparaît dans la catégorie ▶ Démarrer une fois le réglage créé).

## 🌿 Niveau 2 — Les bases de la programmation

*Variables, boucles, conditions : les 3 idées qui font tous les programmes.*

### 5. Les variables : des boîtes pour retenir

🎯 **Ranger une valeur dans une variable, puis la réutiliser.**

Une **variable** est une boîte avec un nom. On y range une valeur (un nombre, un texte, un calque…) pour s'en resservir plus tard.

« mettre `x` à 5 » range 5 dans la boîte `x`. Ensuite, chaque bloc `x` vaut 5. Si tu remets autre chose dans `x`, l'ancienne valeur est remplacée.

Les blocs qui créent quelque chose (calque, texte, image) ont souvent une flèche **→ dans** : le résultat est rangé dans une variable, pour que tu puisses le modifier ensuite.

**Ta mission**

1. Ouvre **📦 Variables & listes** et clique sur « ➕ Créer une variable ». Appelle-la `nom`.
2. Ajoute « mettre … à … » et mets-y un texte, par exemple « Bonjour ».
3. Ajoute « 💬 afficher le message » et dépose-y le bloc de ta variable.

### 6. Répéter : les boucles

🎯 **Créer 5 calques d'un coup.**

Un ordinateur ne se lasse jamais : une **boucle** refait les mêmes blocs autant de fois qu'on veut.

« répéter 10 fois » est la plus simple. « compter avec `i` de 1 à 10 » fait pareil, mais la variable `i` vaut 1, puis 2, puis 3… : pratique pour numéroter.

Les blocs en forme de **C** contiennent d'autres blocs : tout ce qui est à l'intérieur est répété.

**Ta mission**

1. Ajoute le bloc « compter avec … » ci-dessous et mets 5 comme fin.
2. Glisse un bloc « nouveau calque » **à l'intérieur** du C.
3. Bonus : dans le nom du calque, utilise « regrouper … et … » (🧮 Calculs & texte) pour écrire « Calque » + `i`.

### 7. Choisir : les conditions

🎯 **Faire quelque chose seulement si l'image est plus large que haute.**

« **si** … **alors** … » ne fait les blocs de l'intérieur que si la condition est vraie.

Une condition est un bloc **hexagonal** (pointu des deux côtés) : une comparaison comme « … > … », « … contient … », « … et … ».

Avec « si … alors … sinon … », tu choisis entre deux chemins.

**Ta mission**

1. Ajoute « si … alors ».
2. Dans sa case pointue, dépose une comparaison « … > … ».
3. À gauche, mets « largeur de image actuelle » ; à droite, « hauteur de image actuelle ».
4. Dans le C, mets un message « Image en paysage ! ».

### 8. Parcourir tous les calques

🎯 **Faire la même chose sur chaque calque de l'image.**

« pour chaque calque `calque` de image actuelle » est une boucle spéciale : à chaque tour, la variable `calque` contient **un** calque de l'image, puis le suivant…

C'est comme ça qu'on renomme, cache ou modifie 200 calques en un clic. Avec la case « chercher aussi dans les groupes », les calques rangés dans des dossiers sont aussi visités.

**Ta mission**

1. Ajoute « pour chaque calque ».
2. Dedans, mets « opacité de … » et dépose la variable `calque` dans sa première case.
3. Choisis 50 % : tous tes calques deviennent à moitié transparents.

## 🌳 Niveau 3 — GIMP pour de vrai

*Sélections, texte, plusieurs images, dossiers entiers.*

### 9. Sélectionner et peindre

🎯 **Remplir un rectangle de couleur.**

La **sélection** (les pointillés) limite les actions à une zone. Dans GIMP, presque tous les filtres et remplissages ne touchent que la sélection.

Les positions se comptent en pixels depuis le **coin en haut à gauche** : x vers la droite, y vers le bas.

Pense à tout désélectionner à la fin, pour rendre la main proprement à l'utilisateur.

**Ta mission**

1. Ajoute « couleur de premier plan » et choisis une couleur.
2. Ajoute « sélectionner un rectangle » (x 0, y 0, 200 × 100).
3. Ajoute « remplir la sélection de … avec couleur de premier plan ».
4. Termine par « tout désélectionner ».

### 10. Écrire du texte

🎯 **Ajouter un calque de texte sur l'image.**

Le bloc « écrire … » crée un **calque de texte** : police, taille, couleur et position se règlent dans le bloc.

Le calque de texte est rangé dans une variable (→ dans `texte`) : tu peux ensuite le déplacer, changer son opacité, etc.

**Ta mission**

1. Ajoute le bloc « écrire ».
2. Mets ton texte, une taille de 60 px, une couleur.
3. Bonus : utilise un réglage « texte court » pour que l'utilisateur choisisse le texte.

### 11. Travailler sur toutes les images ouvertes

🎯 **Appliquer une action à chaque image ouverte, avec une annulation propre.**

Un plug-in n'est pas obligé de travailler seulement sur l'image actuelle. « pour chaque image ouverte » passe sur **toutes** les images ouvertes dans GIMP.

Chaque action compte normalement comme une étape d'annulation. Le raccourci ⚡ regroupe tout ce que le plug-in fait sur une image en **un seul Ctrl+Z**.

Dans la boucle, utilise la variable `img` à la place de « image actuelle ».

**Ta mission**

1. Ajoute « pour chaque image ouverte (une annulation par image) ».
2. Dedans, mets « aplatir … » et dépose `img` dans sa case.
3. Ouvre 3 images dans GIMP et lance ton plug-in.

### 12. Traiter un dossier entier (lot)

🎯 **Ouvrir chaque image d'un dossier, la modifier et l'exporter en PNG.**

Le **traitement par lot** est la vraie superpuissance des scripts : 500 fichiers traités pendant que tu prends un café.

Le raccourci « pour chaque fichier image du dossier » ouvre chaque fichier sans fenêtre, fait tes blocs, puis libère la mémoire.

Astuce : ajoute un réglage « 📁 dossier à choisir » pour que l'utilisateur choisisse le dossier dans GIMP.

**Ta mission**

1. Ajoute le bloc de lot ci-dessous, avec l'extension `.jpg`.
2. Dedans, mets « exporter … en PNG vers … » avec `img`.
3. Pour le chemin, regroupe le nom du fichier et « .png » (🧮 Calculs & texte).

## 🚀 Niveau 4 — Vers le code (pro)

*Lire et écrire du Python, utiliser les 857 fonctions de GIMP, déboguer.*

### 13. Lire le Python que tu as construit

🎯 **Comprendre le lien entre un bloc et ses lignes de code.**

Chaque bloc correspond à une ou plusieurs lignes de **Python 2.7**, le langage des plug-ins de GIMP 2.10.

Dans l'onglet 🐍 Code, **clique sur un bloc** : ses lignes s'allument. **Clique sur une ligne** : son bloc est sélectionné. C'est la meilleure façon d'apprendre à lire le code.

À retenir : en Python, ce qui est **décalé vers la droite** (l'indentation) est « à l'intérieur » — exactement comme les blocs dans un C.
- `pdb.gimp_...(...)` : un appel à une fonction de GIMP
- `x = ...` : on range une valeur dans la variable `x`
- `for ... in ...:` : une boucle ; `if ...:` : une condition

**Ta mission**

1. Ouvre l'onglet 🐍 Code.
2. Clique sur trois blocs différents et regarde les lignes qui s'allument.

### 14. Passer aux blocs Python

🎯 **Transformer ton plug-in en blocs Python, une ligne = un bloc.**

Les blocs simples sont confortables, mais les blocs **Python** te montrent tout le code, ligne par ligne, et te laissent tout modifier.

Dans les blocs Python, les couleurs t'aident :
- pastille **orange** : une variable (`image`, `calque`, `x`)
- pastille **violette** : une constante de GIMP (`FILL_WHITE`, `NORMAL_MODE`)
- pastille **jaune** : une fonction de GIMP (`pdb.…`)
- blocs verts : les calculs et comparaisons (`+`, `==`, `and`…)

Clique sur une pastille et tape quelques lettres : une liste de propositions s'ouvre.

**Ta mission**

1. Clique sur le bouton ci-dessous (ou Fichier ▸ Voir ce plug-in en blocs Python).
2. Explore : clique sur une pastille orange et regarde les variables proposées.

### 15. Les 857 fonctions de GIMP

🎯 **Appeler une fonction de la PDB avec les bons arguments.**

La **PDB** (Procedure DataBase) est la liste de tout ce que GIMP sait faire : 857 fonctions. Tout ce que tu fais à la souris dans GIMP a sa fonction.

Dans un bloc « appeler … », clique sur le nom de la fonction et tape un mot, en français ou en anglais : **flou**, **calque**, **texte**… La liste montre chaque fonction avec ses arguments et une explication. Choisis : les cases se remplissent toutes seules.

Le 🔍 du bloc ouvre la liste complète, rangée par groupes.

Règle d'or : le `run_mode` ne se passe **jamais** — pygimp l'ajoute lui-même.

**Ta mission**

1. Ajoute un bloc « appeler … » (catégorie 🐍 Python).
2. Clique sur son nom, tape « flou » et choisis `plug_in_gauss`.
3. Remplace les 0.0 par 5.0 pour un flou de 5 pixels.

### 16. Déboguer comme un pro

🎯 **Trouver et comprendre une erreur.**

Tout le monde fait des erreurs, même les pros. La différence : ils savent **où regarder**.
- L'onglet **✅ Vérification** trouve beaucoup d'erreurs **avant** GIMP : case vide, mauvais nombre d'arguments, fonction inconnue… Clique sur un problème pour voir le bloc.
- Dans GIMP, les erreurs s'affichent dans **Fenêtres ▸ Fenêtres ancrables ▸ Console d'erreurs**.
- Pour voir ce que vaut une variable pendant l'exécution, affiche-la : `pdb.gimp_message(str(x))`.
- **Filtres ▸ Python-Fu ▸ Console** permet d'essayer une ligne de Python directement dans GIMP.

Lis les erreurs **de bas en haut** : la dernière ligne dit ce qui ne va pas, celle du dessus dit où.

**Ta mission**

1. Ouvre l'onglet ✅ Vérification.
2. Ajoute un « appeler … » vers `pdb.gimp_message` et mets une variable dedans, par exemple `str(image.width)`.

### 17. Écrire tes propres fonctions

🎯 **Ranger un morceau de code dans une fonction et l'appeler.**

Quand tu répètes les mêmes lignes à plusieurs endroits, range-les dans une **fonction** : « définir `ma_fonction(calque)` ». Ensuite, un seul bloc « appeler `ma_fonction(...)` » fait tout.

Les **paramètres** (entre parenthèses) sont des variables remplies au moment de l'appel. « retourner … » renvoie un résultat.

Un bon nom de fonction dit ce qu'elle fait : `mettre_en_gris`, `numeroter_calques`… Tes fonctions apparaissent aussi dans les suggestions.

**Ta mission**

1. Ajoute « définir … » avec le nom `griser` et le paramètre `calque`.
2. Dedans, appelle `pdb.gimp_drawable_desaturate(calque, DESATURATE_LUMINANCE)`.
3. Ailleurs, appelle `griser(drawable)`.

### 18. Importer, modifier, partager

🎯 **Ouvrir un vrai script existant et le modifier sans le casser.**

Tu as trouvé un plug-in sur Internet ? **Fichier ▸ Importer un script Python** : chaque ligne devient un bloc, et le téléchargement redonne **exactement le même fichier** tant que tu ne changes rien. Si tu modifies un bloc, seules ses lignes changent.

L'**assistant IA** (onglet 🤖) peut écrire une fonction, expliquer un script ou corriger une erreur. Ses réponses sont vérifiées (Python 2.7, vraies fonctions de GIMP, bon nombre d'arguments) avant de devenir des blocs.

Tu es maintenant capable de lire, écrire et corriger des plug-ins GIMP. La suite : ouvre des scripts d'autres personnes, lis-les bloc par bloc, et construis les tiens. **Bravo !**

**Ta mission**

1. Importe un script `.py` (ou un exemple : Fichier ▸ Exemples, puis convertis-le).
2. Change une valeur et regarde dans l'onglet 🐍 Code quelles lignes ont changé.
3. Quand c'est fait, clique sur « J'ai réussi ».

