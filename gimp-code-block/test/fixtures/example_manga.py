#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Remplacer les textes (manga)
# Plug-in pour GIMP 2.10 (Python 2.7), cree avec l'Atelier de plug-ins GIMP.
# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.
# Menu : Python-Fu > Remplacer les textes (manga)
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


def _lire_texte(chemin):
    # utf-8-sig retire le BOM ; les fins de ligne Windows sont normalisees
    with codecs.open(_chemin(chemin), "r", encoding="utf-8-sig") as fichier:
        contenu = fichier.read()
    return contenu.replace(u"\r\n", u"\n").encode("utf-8")


def _actions(image, drawable, fichier, police, taille, couleur):
    """Ce que fait le plug-in (genere a partir des blocs)."""
    textes = None
    i = None
    calque = None
    textes = _lire_texte(fichier).split("[breaker]")
    for i in _compter(1, len(textes), 1):
        calque = pdb.gimp_image_get_layer_by_name(image, "text #" + _texte(i))
        if (calque is not None):
            pdb.gimp_text_layer_set_text(calque, _texte(textes[int(i) - 1]).strip())
            pdb.gimp_text_layer_set_font(calque, police)
            pdb.gimp_text_layer_set_font_size(calque, taille, UNIT_PIXEL)
            pdb.gimp_text_layer_set_color(calque, couleur)
    pdb.gimp_message("Textes remplacés !")


def python_fu_remplacer_les_textes_manga(image, drawable, fichier, police, taille, couleur):
    pdb.gimp_image_undo_group_start(image)
    pdb.gimp_context_push()
    try:
        _actions(image, drawable, fichier, police, taille, couleur)
    except Exception:
        pdb.gimp_message("Erreur dans le plug-in « Remplacer les textes (manga) » :\n" + traceback.format_exc())
    pdb.gimp_context_pop()
    pdb.gimp_image_undo_group_end(image)
    gimp.displays_flush()


register(
    "python_fu_remplacer_les_textes_manga",
    "Remplacer les textes (manga)",
    "Remplacer les textes (manga)",
    "Moi",
    "Moi",
    "2026",
    "Remplacer les textes (manga)",
    "*",
    [
        (PF_IMAGE, "image", "Image", None),
        (PF_DRAWABLE, "drawable", "Calque actif", None),
        (PF_FILE, "fichier", "Fichier texte (bulles séparées par [breaker])", ""),
        (PF_FONT, "police", "Police", "Sans"),
        (PF_INT, "taille", "Taille (px)", 20),
        (PF_COLOR, "couleur", "Couleur du texte", (0, 0, 0)),
    ],
    [],
    python_fu_remplacer_les_textes_manga,
    menu="<Image>/Python-Fu"
)

main()
