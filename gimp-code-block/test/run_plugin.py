# -*- coding: utf-8 -*-
# Usage : python2.7 run_plugin.py fichier.py [fichier2.py ...]
import sys
import os
import re
import py_compile
import tempfile
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'stub'))


def lint(src):
    problems = []
    for n, line in enumerate(src.split('\n'), 1):
        s = line.rstrip('\r')
        code = s.split('#')[0] if not re.search(r'["\']', s) else s
        if '\t' in s[:len(s) - len(s.lstrip())]:
            problems.append('ligne %d : tabulation dans l indentation' % n)
        ind = len(s) - len(s.lstrip(' '))
        if s.strip() and ind % 4 != 0:
            problems.append('ligne %d : indentation non multiple de 4' % n)
        if re.search(r'(^|[^\w])f"', code) or re.search(r"(^|[^\w])f'", code):
            problems.append('ligne %d : f-string interdite' % n)
        if re.match(r'\s*print\b', s):
            problems.append('ligne %d : print interdit' % n)
        if re.search(r'\bnonlocal\b', code):
            problems.append('ligne %d : nonlocal (Python 3)' % n)
        if re.match(r'\s*break\s*$', s):
            problems.append('ligne %d : break (style : sortie explicite)' % n)
        if re.search(r'\S\s+if\s+.+\s+else\s+\S', code) and not s.strip().startswith('#') and ' for ' not in code:
            problems.append('ligne %d : operateur ternaire (style)' % n)
        if re.search(r'RUN_NONINTERACTIVE|RUN_INTERACTIVE', code):
            problems.append('ligne %d : run_mode passe a la main (pygimp le gere)' % n)
    return problems


def make_fixture(tmp):
    import gimpfu as g
    img = g.FakeImage(1200, 1800, os.path.join(tmp, 'page_01.png'))
    l1 = g.FakeLayer('Fond', 1200, 1800)
    t1 = g.FakeLayer('text #1', 300, 80, is_text=True, text='Bonjour 1')
    grp = g.GroupLayer('Groupe')
    t2 = g.FakeLayer('text #2', 300, 80, is_text=True, text='41')
    l2 = g.FakeLayer('Bulle', 400, 300)
    img.add(l1)
    img.add(t1)
    img.add(grp)
    img.add(t2, grp)
    img.add(l2, grp)
    v = g.FakeVectors('Chemin')
    v.image = img
    img.vectors.append(v)
    img2 = g.FakeImage(800, 600, None)
    img2.add(g.FakeLayer('Fond', 800, 600))
    g.IMAGES[:] = [img2, img]
    return img, t1, v


def build_args(params, tmp, img, drawable, vec):
    import gimpfu as g
    txt = os.path.join(tmp, u'textes_é.txt'.encode('utf-8'))
    f = open(txt, 'wb')
    f.write(u'\ufeffPremier texte\r\n[breaker]\r\nDeuxième texte é\r\n'.encode('utf-8'))
    f.close()
    d = os.path.join(tmp, 'dossier')
    if not os.path.isdir(d):
        os.makedirs(d)
    for n in ('a.png', 'b.PNG', 'c.txt'):
        open(os.path.join(d, n), 'wb').close()
    args = []
    for p in params:
        t = p[0]
        if t == g.PF_IMAGE:
            args.append(img)
        elif t == g.PF_DRAWABLE or t == g.PF_LAYER:
            args.append(drawable)
        elif t == g.PF_VECTORS:
            args.append(vec)
        elif t == g.PF_FILE or t == g.PF_FILENAME:
            args.append(txt)
        elif t == g.PF_DIRNAME:
            args.append(d)
        elif t == g.PF_TOGGLE:
            args.append(bool(p[3]))
        elif t == g.PF_SPINNER or t == g.PF_OPTION or t == g.PF_INT:
            args.append(int(p[3]))
        elif t == g.PF_SLIDER or t == g.PF_FLOAT:
            args.append(float(p[3]))
        else:
            args.append(p[3])
    return args


def run(path):
    import gimpfu as g
    src = open(path, 'rb').read()
    problems = []
    if src.startswith('\xef\xbb\xbf'):
        problems.append('BOM UTF-8 present')
    try:
        src.decode('utf-8')
    except UnicodeDecodeError:
        problems.append('fichier non UTF-8')
    if '# -*- coding: utf-8 -*-' not in src.split('\n')[1]:
        problems.append('ligne coding utf-8 absente en ligne 2')
    problems.extend(lint(src))
    try:
        py_compile.compile(path, doraise=True)
    except py_compile.PyCompileError as e:
        return ['COMPILATION PYTHON 2.7 : ' + str(e)], None
    del g.CALLS[:]
    del g.MESSAGES[:]
    g.REGISTERED.clear()
    g.STATE['main_called'] = False
    tmp = tempfile.mkdtemp()
    ns = {'__name__': '__main__', '__file__': path}
    try:
        exec compile(src, path, 'exec') in ns
    except Exception as e:
        return problems + ['CHARGEMENT : %r' % e], None
    if not g.STATE['main_called']:
        problems.append('main() non appele')
    if len(g.REGISTERED) != 1:
        problems.append('register() appele %d fois' % len(g.REGISTERED))
        return problems, None
    reg = list(g.REGISTERED.values())[0]
    img, drawable, vec = make_fixture(tmp)
    args = build_args(reg['params'], tmp, img, drawable, vec)
    try:
        reg['function'](*args)
    except Exception as e:
        import traceback
        problems.append('EXECUTION : ' + traceback.format_exc())
    for m in g.MESSAGES:
        if 'Traceback' in m or 'Erreur' in m:
            problems.append('ERREUR CAPTUREE PAR LE PLUG-IN :\n' + m)
    deps = sorted(set(c[0] for c in g.CALLS if c[1]))
    shutil.rmtree(tmp, True)
    return problems, dict(calls=len(g.CALLS), messages=list(g.MESSAGES), deprecated=deps,
                          procs=sorted(set(c[0] for c in g.CALLS)))


if __name__ == '__main__':
    total_bad = 0
    for p in sys.argv[1:]:
        problems, info = run(p)
        name = os.path.basename(p)
        if problems:
            total_bad += 1
            print('ECHEC  %s' % name)
            for pr in problems:
                print('   - ' + pr.replace('\n', '\n     '))
        else:
            print('OK     %s  (%d appels GIMP, messages=%r, depreciees=%r)' % (name, info['calls'], info['messages'][:3], info['deprecated']))
    print('RESULTAT : %d/%d fichiers sans probleme' % (len(sys.argv[1:]) - total_bad, len(sys.argv[1:])))
    sys.exit(1 if total_bad else 0)
