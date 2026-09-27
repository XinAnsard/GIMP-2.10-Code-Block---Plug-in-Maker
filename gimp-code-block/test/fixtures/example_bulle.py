#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Bulle blanche
# Plug-in pour GIMP 2.10 (Python 2.7), cree avec l'Atelier de plug-ins GIMP.
# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.
# Menu : Filters > Mes scripts > Bulle blanche
#
from gimpfu import *
import traceback


def _actions(image, drawable, couleur, marge):
    """Ce que fait le plug-in (genere a partir des blocs)."""
    bulle = None
    if pdb.gimp_selection_is_empty(image):
        pdb.gimp_message("Fais d'abord une sélection autour de la bulle.")
        return
    pdb.gimp_selection_flood(image)
    pdb.gimp_selection_grow(image, marge)
    bulle = pdb.gimp_layer_new(image, int(pdb.gimp_image_width(image)), int(pdb.gimp_image_height(image)), RGBA_IMAGE, "Bulle", 100, NORMAL_MODE)
    pdb.gimp_image_insert_layer(image, bulle, None, -1)
    pdb.gimp_drawable_fill(bulle, FILL_TRANSPARENT)
    pdb.gimp_context_set_foreground(couleur)
    pdb.gimp_edit_fill(bulle, FILL_FOREGROUND)
    pdb.gimp_selection_none(image)


def python_fu_bulle_blanche(image, drawable, couleur, marge):
    pdb.gimp_image_undo_group_start(image)
    pdb.gimp_context_push()
    try:
        _actions(image, drawable, couleur, marge)
    except Exception:
        pdb.gimp_message("Erreur dans le plug-in « Bulle blanche » :\n" + traceback.format_exc())
    pdb.gimp_context_pop()
    pdb.gimp_image_undo_group_end(image)
    gimp.displays_flush()


register(
    "python_fu_bulle_blanche",
    "Bulle blanche",
    "Bulle blanche",
    "Moi",
    "Moi",
    "2026",
    "Bulle blanche",
    "*",
    [
        (PF_IMAGE, "image", "Image", None),
        (PF_DRAWABLE, "drawable", "Calque actif", None),
        (PF_COLOR, "couleur", "Couleur de la bulle", (255, 255, 255)),
        (PF_INT, "marge", "Marge autour (px)", 2),
    ],
    [],
    python_fu_bulle_blanche,
    menu="<Image>/Filters/Mes scripts"
)

main()
