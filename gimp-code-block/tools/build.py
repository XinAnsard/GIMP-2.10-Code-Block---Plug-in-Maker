#!/usr/bin/env python3
"""Assemble GIMP Code Block into one self-contained HTML file.

Usage:
    python3 tools/build.py [-o dist/gimp-code-block.html] [--offline vendor/]

The whole app ships as a single HTML file so that a user can double-click it,
or drop it on any static host. Blockly is loaded from a CDN by default; with
--offline it is inlined from a local folder (see docs/BUILD.md).
"""
import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
DATA = os.path.join(ROOT, 'data')
CDN = 'https://cdn.jsdelivr.net/npm/blockly@10.4.3/'

# Order matters: core defines the namespace, i18n must run before the specs are
# collected, app.js boots everything once the DOM and Blockly are ready.
SCRIPTS = (
    'core.js',
    'i18n.js',
    'i18n_en.js',
    'i18n_blocks.js',
    'i18n_learn_en.js',
    'lang/es.js',
    'lang/de.js',
    'lang/pt.js',
    'lang/ru.js',
    'lang/hi.js',
    'lang/ar.js',
    'i18n_apply.js',
    'pyparse.js',
    'specs_a.js',
    'specs_b.js',
    'specs_c.js',
    'specs_d.js',
    'pyblocks.js',
    'gen.js',
    'pyimport.js',
    'examples.js',
    'tools.js',
    'tools2.js',
    'suggest.js',
    'hints.js',
    'pyvars.js',
    'learn.js',
    'ai.js',
    'app.js',
)
BLOCKLY_LANGS = ('es', 'de', 'pt-br', 'ru', 'hi', 'ar')
BLOCKLY_FILES = ('blockly_compressed.js', 'blocks_compressed.js', 'msg/en.js', 'msg/fr.js') + tuple('msg/%s.js' % l for l in BLOCKLY_LANGS)


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def build(out_path, offline_dir=None):
    data = json.load(open(os.path.join(DATA, 'sigs.json'), encoding='utf-8'))
    data['pyconst'] = json.load(open(os.path.join(DATA, 'pyconst.json'), encoding='utf-8'))
    data['popular'] = json.load(open(os.path.join(DATA, 'popular.json'), encoding='utf-8'))
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    parts = []
    if offline_dir:
        missing = [f for f in BLOCKLY_FILES if not os.path.exists(os.path.join(offline_dir, f))]
        if missing:
            sys.exit('missing Blockly files in %s: %s' % (offline_dir, ', '.join(missing)))
        blockly = lambda f: '<script data-ga>\n%s\n</script>' % read(os.path.join(offline_dir, f))
    else:
        blockly = lambda f: '<script data-ga src="%s%s"></script>' % (CDN, f)

    parts.append(blockly('blockly_compressed.js'))
    parts.append(blockly('blocks_compressed.js'))
    # English messages are snapshotted, then French is loaded over them, so the
    # app can switch language at runtime without a second network request.
    parts.append(blockly('msg/en.js'))
    parts.append('<script data-ga>window.__BLOCKLY_EN = window.Blockly ? Object.assign({}, Blockly.Msg) : null; window.__BLOCKLY_MSG = {};</script>')
    # Each other language is loaded over English and snapshotted; French goes last (default).
    for l in BLOCKLY_LANGS:
        parts.append(blockly('msg/%s.js' % l))
        parts.append('<script data-ga>if (window.Blockly) window.__BLOCKLY_MSG[%s] = Object.assign({}, Blockly.Msg);</script>' % json.dumps(l))
    parts.append(blockly('msg/fr.js'))
    parts.append('<script data-ga type="application/json" id="ga-data">%s</script>' % payload)

    for name in SCRIPTS:
        js = read(os.path.join(SRC, name))
        if '</script' in js.lower():
            sys.exit('%s contains a literal </script>, which would break the bundle' % name)
        parts.append('<script data-ga>\n%s\n</script>' % js)

    html = read(os.path.join(SRC, 'index.html')).replace('<!--SCRIPTS-->', '\n'.join(parts))
    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as fh:
        fh.write(html)
    print('%s  (%.0f KB)' % (out_path, len(html.encode('utf-8')) / 1024))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Build the single-file app.')
    ap.add_argument('-o', '--out', default=os.path.join(ROOT, 'dist', 'gimp-code-block.html'))
    ap.add_argument('--offline', metavar='DIR', help='inline Blockly from this folder instead of the CDN')
    args = ap.parse_args()
    build(args.out, args.offline)
