# What about GIMP 3?

Plug-ins produced here target **GIMP 2.10** and its Python-Fu (`gimpfu`, Python 2.7).

GIMP 3 replaced that with a GObject-Introspection API (`Gimp` namespace, Python 3), a
different plug-in class model and different procedure names. A 2.10 plug-in does not run
in GIMP 3, and no amount of automatic conversion is reliable enough today to pretend
otherwise.

If you need GIMP 3, the honest answer for now is: keep GIMP 2.10 installed alongside it,
or port the logic by hand — the structure the workshop shows you (settings, actions, the
procedures used) transfers, the API calls do not.

Contributions towards a GIMP 3 target are welcome, but it is a second code generator and
a second procedure database, not a flag.
