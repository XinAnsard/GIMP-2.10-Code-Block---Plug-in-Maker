#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Comments in every awkward position, plus accented text."""
from gimpfu import *   # inline comment after an import


# comment before the function
def edge_comments(image, drawable):   # comment on the def line
    """Docstring with an accent: éàü."""
    n = 0   # counter
    # comment inside the body
    for layer in image.layers:
        # comment at the start of a loop body
        if layer.visible:
            n += 1
        # comment before else
        else:
            pass
    # comment before the last statement
    pdb.gimp_message(u"visibles : %d" % n)


register(
    "python_fu_edge_comments",   # name
    "Edge case", "Edge case", "Tests", "Tests", "2026",
    "Edge comments", "*",
    [
        (PF_IMAGE, "image", "Image", None),
        (PF_DRAWABLE, "drawable", "Layer", None),
    ],
    [], edge_comments, menu="<Image>/Filters/Tests")
main()
