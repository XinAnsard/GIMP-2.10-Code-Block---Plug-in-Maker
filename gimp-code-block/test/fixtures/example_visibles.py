#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Afficher ou cacher par nom
# Plug-in pour GIMP 2.10 (Python 2.7), cree avec l'Atelier de plug-ins GIMP.
# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.
# Menu : Layer > Tools > Afficher ou cacher par nom
#
from gimpfu import *
import traceback


def _texte(valeur):
    # Convertit n'importe quelle valeur en texte UTF-8 accepte par la PDB de GIMP
    if valeur is None:
        return ""
    if isinstance(valeur, unicode):
        return valeur.encode("utf-8")
    return str(valeur)


def _liste_calques(parent, dans_groupes, avec_groupes):
    resultat = []
    for calque in parent.layers:
        if pdb.gimp_item_is_group(calque):
            if avec_groupes:
                resultat.append(calque)
            if dans_groupes:
                resultat.extend(_liste_calques(calque, dans_groupes, avec_groupes))
        else:
            resultat.append(calque)
    return resultat


def _contient(texte, morceau, ignorer_casse):
    texte = _texte(texte).decode("utf-8")
    morceau = _texte(morceau).decode("utf-8")
    if ignorer_casse:
        texte = texte.lower()
        morceau = morceau.lower()
    return morceau in texte


def _actions(image, drawable, recherche, visible):
    """Ce que fait le plug-in (genere a partir des blocs)."""
    compte = None
    calque = None
    compte = 0
    for calque in _liste_calques(image, True, False):
        if _contient(pdb.gimp_item_get_name(calque), recherche, True):
            pdb.gimp_item_set_visible(calque, visible)
            compte = compte + 1
    pdb.gimp_message("Calques modifiés : " + _texte(compte))


def python_fu_afficher_ou_cacher_par_nom(image, drawable, recherche, visible):
    pdb.gimp_image_undo_group_start(image)
    pdb.gimp_context_push()
    try:
        _actions(image, drawable, recherche, visible)
    except Exception:
        pdb.gimp_message("Erreur dans le plug-in « Afficher ou cacher par nom » :\n" + traceback.format_exc())
    pdb.gimp_context_pop()
    pdb.gimp_image_undo_group_end(image)
    gimp.displays_flush()


register(
    "python_fu_afficher_ou_cacher_par_nom",
    "Afficher ou cacher par nom",
    "Afficher ou cacher par nom",
    "Moi",
    "Moi",
    "2026",
    "Afficher ou cacher par nom",
    "*",
    [
        (PF_IMAGE, "image", "Image", None),
        (PF_DRAWABLE, "drawable", "Calque actif", None),
        (PF_STRING, "recherche", "Le nom contient", "text"),
        (PF_TOGGLE, "visible", "Rendre visibles (sinon cacher)", True),
    ],
    [],
    python_fu_afficher_ou_cacher_par_nom,
    menu="<Image>/Layer/Tools"
)

main()
