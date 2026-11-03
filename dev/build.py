"""Assemble the app from dev/src into one index.html (plus sw.js, manifest, README).

dev/src/index.tpl.html has two placeholders: /*__CSS__*/ (filled with css/*.css) and //__JS__
(filled with js/*.js in file-name order, all inside one function so they share one scope).

Usage (from the repo root):  python3 -I dev/build.py [out_dir]
out_dir defaults to the repo root, which is what GitHub Pages serves.
"""
import os
import re
import shutil
import sys

DEV = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DEV, 'src')
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(DEV)


def read(*p):
    return open(os.path.join(*p), encoding='utf-8').read()


def parts(sub, ext):
    d = os.path.join(SRC, sub)
    return '\n'.join(read(d, f) for f in sorted(os.listdir(d)) if f.endswith(ext))


html = read(SRC, 'index.tpl.html')
for key in ('/*__CSS__*/', '//__JS__'):
    assert html.count(key) == 1, f'{key} must appear exactly once in index.tpl.html'
js = parts('js', '.js')
assert js.count('__APPVER__') == 1, '__APPVER__ must appear exactly once in the js'
ver = re.search(r"corner-reach-(v\d+)", read(SRC, 'sw.js')).group(1)   # 版本号跟着 sw.js 的快取名称
html = html.replace('/*__CSS__*/', parts('css', '.css')).replace('//__JS__', js.replace('__APPVER__', ver))
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
for f in ('sw.js', 'manifest.webmanifest', 'README.md'):
    shutil.copy(os.path.join(SRC, f), os.path.join(OUT, f))
print('built', len(html), 'bytes, version', ver, '->', OUT)
