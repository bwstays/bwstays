#!/usr/bin/env python3
"""
Builds css/fontawesome.min.css and assets/fonts/fontawesome/*.woff2: a subset of
Font Awesome Free 5.15.1 holding only the icons the site actually uses.

    pip install fonttools brotli
    python scripts/build-fontawesome.py

Why: the full stylesheet (58 KB) blocks rendering and the full solid + brands
fonts are 160 KB. The subset is a few KB each, so icons cost almost nothing.

Inputs (unmodified downloads of Font Awesome Free 5.15.1, from cdnjs):
    scripts/fontawesome-src/all.min.css and fa-{solid-900,brands-400,regular-400}.woff2

An icon is "used" when `fa-<name>` appears in any .html, .js, .json or .txt file
of the site. When you add a new icon, just re-run this script.
"""
import glob
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'scripts', 'fontawesome-src')
OUT_CSS = os.path.join(ROOT, 'css', 'fontawesome.min.css')
OUT_FONTS = os.path.join(ROOT, 'assets', 'fonts', 'fontawesome')
FONTS = ['fa-solid-900', 'fa-brands-400', 'fa-regular-400']
SKIP_DIRS = {'.git', 'node_modules', 'scripts', 'css', 'assets', 'tools', 'resources'}


def used_names():
    names = set()
    pat = re.compile(r'\bfa-([a-z0-9]+(?:-[a-z0-9]+)*)\b')
    for dp, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
        for f in files:
            if f.endswith(('.html', '.js', '.json', '.txt', '.xml', '.md')):
                try:
                    s = open(os.path.join(dp, f), encoding='utf-8', errors='ignore').read()
                except OSError:
                    continue
                names.update(pat.findall(s))
    # also the scripts' own css classes written in css/*.css (e.g. .fa-xxx used for pseudo rules)
    for f in glob.glob(os.path.join(ROOT, 'css', '*.css')):
        if os.path.basename(f) == 'fontawesome.min.css':
            continue
        names.update(pat.findall(open(f, encoding='utf-8', errors='ignore').read()))
    return names


def top_level_blocks(css):
    out, depth, start = [], 0, 0
    for i, ch in enumerate(css):
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                out.append(css[start:i + 1])
                start = i + 1
    rest = css[start:]
    return out, rest


def main():
    css = open(os.path.join(SRC, 'all.min.css'), encoding='utf-8').read()
    css = re.sub(r'^/\*!.*?\*/\s*', '', css, flags=re.S)
    used = used_names()
    blocks, rest = top_level_blocks(css)
    icon_re = re.compile(r'^((?:\.fa-[a-z0-9-]+:before,?)+)\{content:"\\([0-9a-f]+)"\}$')
    kept, codepoints, icons_kept, icons_all = [], set(), 0, 0
    for b in blocks:
        m = icon_re.match(b.strip())
        if m:
            sels = [s for s in m.group(1).split(',') if s]
            icons_all += len(sels)
            keep = [s for s in sels if s[len('.fa-'):-len(':before')] in used]
            if keep:
                icons_kept += len(keep)
                codepoints.add(int(m.group(2), 16))
                kept.append(','.join(keep) + '{content:"' + chr(92) + m.group(2) + '"}')
            continue
        if b.lstrip().startswith('@font-face'):
            name = re.search(r'webfonts/([\w-]+)\.woff2', b).group(1)
            b = re.sub(r'src:.*\}$', 'src:url(../assets/fonts/fontawesome/%s.woff2) format("woff2")}' % name, b, flags=re.S)
        kept.append(b.strip())
    os.makedirs(OUT_FONTS, exist_ok=True)
    total = 0
    for name in FONTS:
        font = TTFont(os.path.join(SRC, name + '.woff2'))
        cmap = font.getBestCmap()
        have = sorted(cp for cp in codepoints if cp in cmap)
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = []
        opts.hinting = False
        opts.name_IDs = [1, 2]
        opts.notdef_outline = False
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=have)
        sub.subset(font)
        dst = os.path.join(OUT_FONTS, name + '.woff2')
        font.flavor = 'woff2'
        font.save(dst)
        size = os.path.getsize(dst)
        total += size
        print('%-16s %3d glyphs  %6d bytes' % (name, len(have), size))
    hdr = ('/*! Font Awesome Free 5.15.1 by @fontawesome - https://fontawesome.com | License - '
           'https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT). '
           'Subset for bwstays.com by scripts/build-fontawesome.py - do not edit by hand. */\n')
    open(OUT_CSS, 'w', encoding='utf-8', newline='').write(hdr + ''.join(kept) + rest.strip())
    print('icons kept %d of %d | css %d bytes | fonts %d bytes' % (icons_kept, icons_all, os.path.getsize(OUT_CSS), total))
    unknown = sorted(n for n in used if n not in {s[len('.fa-'):-len(':before')] for b in blocks for s in (icon_re.match(b.strip()).group(1).split(',') if icon_re.match(b.strip()) else []) if s} and not re.match(r'(\d+x|lg|xs|sm|fw|w-\d+|ul|li|border|pull-\w+|spin|pulse|rotate-\d+|flip-\w+|stack\w*|inverse|layers\w*)$', n))
    print('fa-* names in the site that are not icons or modifiers (ignore if they are your own classes):', unknown[:40])


if __name__ == '__main__':
    sys.exit(main())
