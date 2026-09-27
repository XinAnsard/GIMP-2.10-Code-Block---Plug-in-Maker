#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Several statements per line, unusual spacing: the round trip must keep them.
from gimpfu import *


def edge_semicolons(image, drawable):
    w = image.width ; h = image.height ; total = w * h
    pdb.gimp_image_undo_group_start(image)
    try:
        if total > 0: pdb.gimp_message("pixels: %d" % total)
        else:
            pdb.gimp_message("empty")
    finally:
        pdb.gimp_image_undo_group_end(image)


register(
    "python_fu_edge_semicolons", "Edge case", "Edge case", "Tests", "Tests", "2026",
    "Edge semicolons", "*",
    [(PF_IMAGE, "image", "Image", None), (PF_DRAWABLE, "drawable", "Layer", None)],
    [], edge_semicolons, menu="<Image>/Filters/Tests")

main()
