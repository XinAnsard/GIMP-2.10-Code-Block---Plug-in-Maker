#!/usr/bin/env python
# Tab-indented file with a line continuation and a blank line inside it.
from gimpfu import *

def edge_tabs(image, drawable):
	names = []
	for layer in image.layers:
		names.append(layer.name)
	text = ", ".join(names) + \
		" (" + str(len(names)) + ")"

	pdb.gimp_message(text)

register("python_fu_edge_tabs", "Edge case", "Edge case", "Tests", "Tests", "2026",
	"Edge tabs", "*",
	[(PF_IMAGE, "image", "Image", None), (PF_DRAWABLE, "drawable", "Layer", None)],
	[], edge_tabs, menu="<Image>/Filters/Tests")

main()
