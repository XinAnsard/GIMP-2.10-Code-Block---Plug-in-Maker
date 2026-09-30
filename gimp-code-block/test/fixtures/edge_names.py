#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Variables inside expressions: each one becomes a round block, the file stays identical.
from gimpfu import *

def f(image, drawable, a=1, *args, **kw):
    x=a+b
    y = (a +
         b)
    z = -a; w = a if b else c
    v = a[1:2]
    u = not a
    t = a, b
    s = [a,
         b]
    r = {a: b, 'k': a}
    q = (1).real + a
    p = lambda x: x + a
    o = a.b.c
    n = 'x %s' % a
    m = a ** -b
    l = (a)
    k = ((a))
    j = a == b == c
    i = a is not None
    g = a[...]
    e = a[1:2, 3]
    d = a + \
        b
    x = a<b
    x = -1 ** a
    x = [i for i in a if i]
    x = image.width*2 // drawable.height
    x = (image.width, image.height)
    x = a[b][c]
    x = a[:b:]
    x += a
    a.b = c
    a[b] = c
    for a, b in c:
        print a, b
    while a and not b or c:
        break
    assert a, b
    del a
    exec code in ns
    x = `a`
    x = a.b(c).d
    if a: return a
    return None

register("x", "x", "x", "x", "x", "2026", "X", "", [], [], f, menu="<Image>/Filters")
main()
