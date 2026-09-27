import json, re, os

BASE = '/home/claude/pdb210'
src = open(os.path.join(BASE, 'parse_pdb.py')).read()
ns = {}
exec(src.split("procs = {}")[0], ns)
parse_args = ns['parse_args']
find_block = ns['find_block']


def parse_dir(d):
    procs = {}
    for fn in sorted(os.listdir(d)):
        group = fn[:-4]
        text = open(os.path.join(d, fn), encoding='utf-8', errors='replace').read()
        hm = re.search(r'^sub stroke_arg \(\) \{\n(.*?)^\}', text, re.M | re.S)
        if hm:
            text = text.replace('&stroke_arg', hm.group(1).strip())
        m = re.search(r'@procs\s*=\s*qw\((.*?)\);', text, re.S)
        exported = set(m.group(1).split()) if m else set()
        for sm in re.finditer(r'^sub\s+(\w+)\s*\{', text, re.M):
            sub = sm.group(1)
            if sub not in exported:
                continue
            nxt = re.search(r'^sub\s+\w+\s*\{', text[sm.end():], re.M)
            body = text[sm.start(): sm.end() + (nxt.start() if nxt else len(text))]
            blurb = (re.search(r"\$blurb\s*=\s*'((?:[^'\\]|\\.)*)'", body, re.S)
                     or re.search(r'\$blurb\s*=\s*"((?:[^"\\]|\\.)*)"', body, re.S))
            dep = re.search(r"&std_pdb_deprecated\s*\(\s*'([^']*)'\s*\)", body)
            dep_none = re.search(r"&std_pdb_deprecated\s*;", body) or re.search(r"&std_pdb_deprecated\s*\(\s*\)", body)
            ia = re.search(r'@inargs\s*=\s*\(', body)
            oa = re.search(r'@outargs\s*=\s*\(', body)
            inargs = parse_args(find_block(body, ia.end() - 1)) if ia else []
            outargs = parse_args(find_block(body, oa.end() - 1)) if oa else []
            if group == 'plug_in_compat':
                pname = sub.replace('_', '-')
            else:
                pname = 'gimp-' + sub.replace('_', '-')
            procs[pname] = dict(group=group,
                                blurb=re.sub(r'\s+', ' ', blurb.group(1)) if blurb else '',
                                dep=(dep.group(1) if dep else ('NONE' if dep_none else '')),
                                inp=inargs, out=outargs)
    return procs


p210 = parse_dir(os.path.join(BASE, 'groups'))
p28 = parse_dir(os.path.join(BASE, 'groups28'))


def A(n, t, d='', none_ok=False):
    return dict(name=n, type=t, desc=d, none_ok=none_ok, is_count=False)


RM = A('run-mode', 'int32')
# Plug-ins externes : signatures relevees dans les sources C / scm de GIMP 2.10
ext = {
    'plug-in-sel2path': dict(group='plug_in_ext', blurb='Converts a selection to a path', dep='',
                             inp=[RM, A('image', 'image'), A('drawable', 'drawable', 'Input drawable (unused)', True)], out=[]),
    'file-png-save': dict(group='file_ext', blurb='Exports files in PNG file format', dep='',
                          inp=[RM, A('image', 'image'), A('drawable', 'drawable'), A('filename', 'string'), A('raw-filename', 'string'),
                               A('interlace', 'int32', 'Use Adam7 interlacing?'), A('compression', 'int32', 'Deflate Compression factor (0--9)'),
                               A('bkgd', 'int32', 'Write bKGD chunk?'), A('gama', 'int32', 'Write gAMA chunk?'), A('offs', 'int32', 'Write oFFs chunk?'),
                               A('phys', 'int32', 'Write pHYs chunk?'), A('time', 'int32', 'Write tIME chunk?')], out=[]),
    'file-png-save-defaults': dict(group='file_ext', blurb='Exports files in PNG file format (default settings)', dep='',
                                   inp=[RM, A('image', 'image'), A('drawable', 'drawable'), A('filename', 'string'), A('raw-filename', 'string')], out=[]),
    'file-jpeg-save': dict(group='file_ext', blurb='Saves files in the JPEG file format', dep='',
                           inp=[RM, A('image', 'image'), A('drawable', 'drawable'), A('filename', 'string'), A('raw-filename', 'string'),
                                A('quality', 'float', 'Quality (0 <= quality <= 1)'), A('smoothing', 'float', 'Smoothing (0..1)'),
                                A('optimize', 'int32', 'Optimized tables (0/1)'), A('progressive', 'int32', 'Progressive (0/1)'),
                                A('comment', 'string', 'Image comment'), A('subsmp', 'int32', 'Sub-sampling 0..3 (2 = 4:4:4)'),
                                A('baseline', 'int32', 'Baseline JPEG (0/1)'), A('restart', 'int32', 'Restart markers interval'),
                                A('dct', 'int32', 'DCT method 0..2')], out=[]),
    'script-fu-drop-shadow': dict(group='script_fu_ext', blurb='Add a drop shadow to the selected region (or alpha)', dep='',
                                  inp=[RM, A('image', 'image'), A('drawable', 'drawable'), A('offset-x', 'float', 'Offset X'),
                                       A('offset-y', 'float', 'Offset Y'), A('blur-radius', 'float', 'Blur radius'), A('color', 'color', 'Color'),
                                       A('opacity', 'float', 'Opacity 0..100'), A('allow-resizing', 'int32', 'Allow resizing (0/1)')], out=[]),
}
p210.update(ext)

etext = open(os.path.join(BASE, 'enums.pl')).read()
pyconst = set(open(os.path.join(BASE, 'py_constants.txt')).read().split())
enums = {}
parts = re.split(r'^\s{4}(\w+) =>\s*$', etext, flags=re.M)
for i in range(1, len(parts) - 1, 2):
    name, body = parts[i], parts[i + 1]
    mp = dict((a, int(b)) for a, b in re.findall(r"(GIMP_\w+)\s*=>\s*'(-?\d+)'", body))
    sy = re.search(r'symbols\s*=>\s*\[\s*qw\((.*?)\)\s*\]', body, re.S)
    syms = sy.group(1).split() if sy else list(mp.keys())
    vals = []
    for s in syms:
        if s in mp:
            py = s[5:] if s.startswith('GIMP_') else s
            vals.append([py if py in pyconst else '', mp[s]])
    if vals:
        enums[name] = vals


def kind_of(t):
    if t.startswith('enum '):
        return 'enum'
    for k in ['int32array', 'int16array', 'int8array', 'floatarray', 'stringarray', 'colorarray', 'int32', 'int16', 'int8',
              'float', 'string', 'boolean', 'image', 'drawable', 'layer_mask', 'layer', 'channel', 'vectors', 'item',
              'display', 'color', 'unit', 'parasite', 'selection']:
        if k in t:
            return k
    return t


def conv(procs):
    out = {}
    for k, v in procs.items():
        py = k.replace('-', '_')
        args = []
        for a in v['inp']:
            if a['name'] in ('run-mode', 'run_mode'):
                continue
            kd = 'count' if a.get('is_count') else kind_of(a['type'])
            en = ''
            excl = []
            if kd == 'enum':
                mm = re.match(r'enum (\w+)(?:\s*\(no ([^)]*)\))?', a['type'])
                en = mm.group(1)
                if mm.group(2):
                    excl = [x.strip()[5:] for x in mm.group(2).split(',')]
            args.append([a['name'], kd, a['type'], (a['desc'] or '')[:150], 1 if a.get('none_ok') else 0, en, excl])
        outs = [[a['name'], 'count' if a.get('is_count') else kind_of(a['type'])] for a in v['out']]
        if v['dep'] and v['dep'] != 'NONE':
            dep = v['dep'].replace('-', '_')
        elif v['dep'] == 'NONE':
            dep = '?'
        else:
            dep = ''
        runmode = 1 if (v['inp'] and v['inp'][0]['name'] in ('run-mode', 'run_mode')) else 0
        if v['group'].endswith('_ext') or v['group'] == 'plug_in_compat':
            in28 = -1
        else:
            in28 = 1 if k in p28 else 0
        out[py] = [v['group'], v['blurb'][:200], dep, in28, args, outs, runmode]
    return out


sigs = conv(p210)
json.dump({'sigs': sigs, 'enums': enums}, open('/home/claude/v2/sigs.json', 'w'), separators=(',', ':'), ensure_ascii=False)
json.dump(sorted(pyconst), open('/home/claude/v2/pyconst.json', 'w'))
print('procs', len(sigs), 'enums', len(enums), 'size', os.path.getsize('/home/claude/v2/sigs.json'))
for t in ['gimp_edit_fill', 'plug_in_gauss', 'gimp_file_load', 'gimp_text_layer_new', 'gimp_image_select_item',
          'gimp_paintbrush_default', 'gimp_item_transform_translate', 'gimp_image_get_active_vectors', 'gimp_edit_stroke_vectors',
          'gimp_layer_resize_to_image_size', 'gimp_image_rotate', 'gimp_context_swap_colors', 'gimp_image_get_name',
          'gimp_layer_remove_mask', 'gimp_item_get_image', 'gimp_image_raise_item', 'gimp_progress_set_text', 'gimp_threshold',
          'gimp_edit_stroke', 'gimp_selection_flood', 'gimp_image_flip', 'gimp_text_layer_set_line_spacing',
          'gimp_text_layer_get_markup', 'gimp_context_set_default_colors', 'gimp_image_resize_to_layers', 'gimp_layer_add_mask',
          'gimp_desaturate_full', 'gimp_brightness_contrast', 'gimp_invert', 'gimp_edit_clear', 'gimp_layer_create_mask',
          'gimp_text_layer_set_letter_spacing', 'gimp_image_add_vguide', 'gimp_display_new', 'gimp_image_get_active_drawable',
          'gimp_layer_scale', 'gimp_image_lower_item', 'plug_in_colortoalpha', 'gimp_drawable_get_pixel', 'gimp_text_layer_get_font']:
    s = sigs.get(t)
    print(t, '->', None if not s else (s[0], 'dep=' + s[2], '28=' + str(s[3]), [(a[0], a[1], a[5]) for a in s[4]], [o[0] for o in s[5]]))
print('FillType', enums.get('GimpFillType'))
print('ChannelOps', enums.get('GimpChannelOps'))
print('DesatMode', enums.get('GimpDesaturateMode'))
print('SizeType', enums.get('GimpSizeType'))
