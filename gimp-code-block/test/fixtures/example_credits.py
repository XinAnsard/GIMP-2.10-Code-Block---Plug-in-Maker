#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Crédits +1
# Plug-in pour GIMP 2.10 (Python 2.7), cree avec l'Atelier de plug-ins GIMP.
# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.
# Menu : Python-Fu > Crédits +1
#
from gimpfu import *
import re
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


def _texte_du_calque(calque):
    # get_text renvoie None quand le texte a une mise en forme : on lit alors le balisage
    texte = pdb.gimp_text_layer_get_text(calque)
    if texte is None:
        balisage = pdb.gimp_text_layer_get_markup(calque)
        if balisage is None:
            texte = ""
        else:
            texte = re.sub(r"<.*?>", "", balisage)
    return texte


def _nombre(valeur):
    texte = _texte(valeur).strip().replace(",", ".")
    if texte.lstrip("-").isdigit():
        return int(texte)
    return float(texte)


def _actions(image, drawable, ajout):
    """Ce que fait le plug-in (genere a partir des blocs)."""
    calque = None
    for calque in _liste_calques(image, True, False):
        if pdb.gimp_item_is_text_layer(calque) and _texte_du_calque(calque).strip().isdigit():
            pdb.gimp_text_layer_set_text(calque, _texte(_nombre(_texte_du_calque(calque)) + ajout))


def python_fu_credits_1(image, drawable, ajout):
    pdb.gimp_image_undo_group_start(image)
    pdb.gimp_context_push()
    try:
        _actions(image, drawable, ajout)
    except Exception:
        pdb.gimp_message("Erreur dans le plug-in « Crédits +1 » :\n" + traceback.format_exc())
    pdb.gimp_context_pop()
    pdb.gimp_image_undo_group_end(image)
    gimp.displays_flush()


register(
    "python_fu_credits_1",
    "Crédits +1",
    "Crédits +1",
    "Moi",
    "Moi",
    "2026",
    "Crédits +1",
    "*",
    [
        (PF_IMAGE, "image", "Image", None),
        (PF_DRAWABLE, "drawable", "Calque actif", None),
        (PF_INT, "ajout", "Nombre à ajouter", 1),
    ],
    [],
    python_fu_credits_1,
    menu="<Image>/Python-Fu"
)

main()
