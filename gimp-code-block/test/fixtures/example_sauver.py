#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Enregistrer toutes les images
# Plug-in pour GIMP 2.10 (Python 2.7), cree avec l'Atelier de plug-ins GIMP.
# Installation : copier ce fichier dans le dossier plug-ins de GIMP puis redemarrer GIMP.
# Menu : File > Export > Enregistrer toutes les images
#
from gimpfu import *
import os
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


def _calque_pour_export(img):
    calque = pdb.gimp_image_get_active_drawable(img)
    if calque is None:
        calque = img.layers[0]
    return calque


def _enregistrer_xcf_a_cote(img):
    nom = pdb.gimp_image_get_filename(img)
    if nom:
        chemin = nom.rsplit(".", 1)[0] + ".xcf"
        pdb.gimp_file_save(img, _calque_pour_export(img), chemin, chemin)
    else:
        pdb.gimp_message("Image jamais enregistrée : impossible de savoir où mettre le .xcf")


def _exporter_jpg(img, chemin, qualite):
    copie = pdb.gimp_image_duplicate(img)
    if pdb.gimp_image_base_type(copie) != RGB:
        pdb.gimp_image_convert_rgb(copie)
    calque = pdb.gimp_image_flatten(copie)
    pdb.file_jpeg_save(copie, calque, _texte(chemin), _texte(chemin), qualite / 100.0, 0.0, 1, 0, "", 2, 1, 0, 0)
    pdb.gimp_image_delete(copie)


def _sans_extension(chemin):
    return _texte(os.path.splitext(_chemin(chemin))[0])


def _actions(jpg, qualite):
    """Ce que fait le plug-in (genere a partir des blocs)."""
    img = None
    gimp.progress_init("Enregistrement des images…")
    for img in list(reversed(gimp.image_list())):
        if (pdb.gimp_image_get_filename(img) is not None):
            _enregistrer_xcf_a_cote(img)
            if jpg:
                _exporter_jpg(img, _sans_extension(_texte(pdb.gimp_image_get_filename(img))) + ".jpg", qualite)
        else:
            pdb.gimp_message("Jamais enregistrée, ignorée : " + _texte(pdb.gimp_image_get_name(img)))
        pdb.gimp_progress_pulse()
    pdb.gimp_progress_end()
    pdb.gimp_message("Toutes les images sont enregistrées !")


def python_fu_enregistrer_toutes_les_images(jpg, qualite):
    pdb.gimp_context_push()
    try:
        _actions(jpg, qualite)
    except Exception:
        pdb.gimp_message("Erreur dans le plug-in « Enregistrer toutes les images » :\n" + traceback.format_exc())
    pdb.gimp_context_pop()
    gimp.displays_flush()


register(
    "python_fu_enregistrer_toutes_les_images",
    "Enregistrer toutes les images",
    "Enregistrer toutes les images",
    "Moi",
    "Moi",
    "2026",
    "Enregistrer toutes les images",
    "",
    [
        (PF_TOGGLE, "jpg", "Exporter aussi en JPEG", True),
        (PF_SLIDER, "qualite", "Qualité JPEG", 95.0, (0.0, 100.0, 1.0)),
    ],
    [],
    python_fu_enregistrer_toutes_les_images,
    menu="<Image>/File/Export"
)

main()
