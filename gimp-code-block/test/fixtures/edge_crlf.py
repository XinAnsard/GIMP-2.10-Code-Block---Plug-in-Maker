#!/usr/bin/env python
# BOM + CRLF line endings, as produced by some Windows editors.
from gimpfu import *


def edge_crlf(image, drawable):
    pdb.gimp_message("ok")


register("python_fu_edge_crlf", "Edge case", "Edge case", "Tests", "Tests", "2026",
         "Edge crlf", "*",
         [(PF_IMAGE, "image", "Image", None), (PF_DRAWABLE, "drawable", "Layer", None)],
         [], edge_crlf, menu="<Image>/Filters/Tests")

main()
