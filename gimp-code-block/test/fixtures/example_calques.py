#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Créer plusieurs calques
# Plug-in pour GIMP 2.10 (Python 2.7), cree avec l'Atelier de plug-ins GIMP.
# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.
# Menu : Layer > Tools > Créer plusieurs calques
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


def _actions(image, drawable, nombre, prefixe, numeroter):
    """Ce que fait le plug-in (genere a partir des blocs)."""
    i = None
    nom = None
    calque = None
    for i in _compter(1, nombre, 1):
        if numeroter:
            nom = prefixe + _texte(i)
        else:
            nom = prefixe
        calque = pdb.gimp_layer_new(image, int(pdb.gimp_image_width(image)), int(pdb.gimp_image_height(image)), RGBA_IMAGE, _texte(nom), 100, NORMAL_MODE)
        pdb.gimp_image_insert_layer(image, calque, None, 0)
        pdb.gimp_drawable_fill(calque, FILL_TRANSPARENT)
    pdb.gimp_message(_texte(nombre) + " calque(s) créé(s) !")


def python_fu_creer_plusieurs_calques(image, drawable, nombre, prefixe, numeroter):
    pdb.gimp_image_undo_group_start(image)
    pdb.gimp_context_push()
    try:
        _actions(image, drawable, nombre, prefixe, numeroter)
    except Exception:
        pdb.gimp_message("Erreur dans le plug-in « Créer plusieurs calques » :\n" + traceback.format_exc())
    pdb.gimp_context_pop()
    pdb.gimp_image_undo_group_end(image)
    gimp.displays_flush()


register(
    "python_fu_creer_plusieurs_calques",
    "Créer plusieurs calques",
    "Créer plusieurs calques",
    "Moi",
    "Moi",
    "2026",
    "Créer plusieurs calques",
    "*",
    [
        (PF_IMAGE, "image", "Image", None),
        (PF_DRAWABLE, "drawable", "Calque actif", None),
        (PF_SPINNER, "nombre", "Nombre de calques", 3, (1, 100, 1)),
        (PF_STRING, "prefixe", "Début du nom", "Calque_"),
        (PF_TOGGLE, "numeroter", "Ajouter un numéro", True),
    ],
    [],
    python_fu_creer_plusieurs_calques,
    menu="<Image>/Layer/Tools"
)

main()
