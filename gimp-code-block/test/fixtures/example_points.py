#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Textes sur les points du chemin
# Plug-in pour GIMP 2.10 (Python 2.7), cree avec l'Atelier de plug-ins GIMP.
# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.
# Menu : Python-Fu > Textes sur les points du chemin
#
from gimpfu import *
import codecs
import traceback


def _texte(valeur):
    # Convertit n'importe quelle valeur en texte UTF-8 accepte par la PDB de GIMP
    if valeur is None:
        return ""
    if isinstance(valeur, unicode):
        return valeur.encode("utf-8")
    return str(valeur)


def _chemin(valeur):
    # Chemin en unicode pour os / codecs (accents Windows)
    if isinstance(valeur, unicode):
        return valeur
    return _texte(valeur).decode("utf-8")


def _compter(debut, fin, pas):
    valeurs = []
    if pas == 0:
        return valeurs
    valeur = debut
    if pas > 0:
        while valeur <= fin:
            valeurs.append(valeur)
            valeur = valeur + pas
    else:
        while valeur >= fin:
            valeurs.append(valeur)
            valeur = valeur + pas
    return valeurs


def _points_du_chemin(chemin):
    # Les ID de traces sont des entiers ; chaque point d'ancrage = 6 nombres (poignee, ancre, poignee)
    points = []
    nombre, traces = pdb.gimp_vectors_get_strokes(chemin)
    for trace in traces:
        genre, nb, controle, ferme = pdb.gimp_vectors_stroke_get_points(chemin, trace)
        index = 0
        while index + 3 < len(controle):
            points.append((controle[index + 2], controle[index + 3]))
            index = index + 6
    return points


def _lire_texte(chemin):
    # utf-8-sig retire le BOM ; les fins de ligne Windows sont normalisees
    with codecs.open(_chemin(chemin), "r", encoding="utf-8-sig") as fichier:
        contenu = fichier.read()
    return contenu.replace(u"\r\n", u"\n").encode("utf-8")


def _actions(image, drawable, fichier, police, taille, couleur):
    """Ce que fait le plug-in (genere a partir des blocs)."""
    chemin = None
    points = None
    textes = None
    i = None
    x = None
    y = None
    calque_texte = None
    chemin = pdb.gimp_image_get_active_vectors(image)
    if not (chemin is not None):
        pdb.gimp_message("Choisis d'abord un chemin dans l'onglet Chemins.")
        return
    points = _points_du_chemin(chemin)
    textes = _lire_texte(fichier).split("[breaker]")
    for i in _compter(1, len(textes), 1):
        x = 10
        y = 10
        if i <= len(points):
            x = (points[int(i) - 1])[0]
            y = (points[int(i) - 1])[1]
        calque_texte = pdb.gimp_text_layer_new(image, _texte(textes[int(i) - 1]).strip(), police, taille, UNIT_PIXEL)
        pdb.gimp_image_insert_layer(image, calque_texte, None, 0)
        pdb.gimp_layer_set_offsets(calque_texte, int(x), int(y))
        pdb.gimp_text_layer_set_color(calque_texte, couleur)
        pdb.gimp_item_set_name(calque_texte, "text #" + _texte(i))


def python_fu_textes_sur_les_points_du_chemin(image, drawable, fichier, police, taille, couleur):
    pdb.gimp_image_undo_group_start(image)
    pdb.gimp_context_push()
    try:
        _actions(image, drawable, fichier, police, taille, couleur)
    except Exception:
        pdb.gimp_message("Erreur dans le plug-in « Textes sur les points du chemin » :\n" + traceback.format_exc())
    pdb.gimp_context_pop()
    pdb.gimp_image_undo_group_end(image)
    gimp.displays_flush()


register(
    "python_fu_textes_sur_les_points_du_chemin",
    "Textes sur les points du chemin",
    "Textes sur les points du chemin",
    "Moi",
    "Moi",
    "2026",
    "Textes sur les points du chemin",
    "*",
    [
        (PF_IMAGE, "image", "Image", None),
        (PF_DRAWABLE, "drawable", "Calque actif", None),
        (PF_FILE, "fichier", "Fichier texte (bulles séparées par [breaker])", ""),
        (PF_FONT, "police", "Police", "Sans"),
        (PF_INT, "taille", "Taille (px)", 20),
        (PF_COLOR, "couleur", "Couleur", (0, 0, 0)),
    ],
    [],
    python_fu_textes_sur_les_points_du_chemin,
    menu="<Image>/Python-Fu"
)

main()
