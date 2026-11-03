"""Draw the app icons: the penalty box seen from above, an arrow arriving at its edge, and a yellow corner flag.
Usage: python3 -I make_icons.py <out_dir>
"""
import sys
from PIL import Image, ImageDraw

OUT = sys.argv[1]
GRASS, CHALK, FLAG = (36, 87, 61), (243, 245, 238), (242, 194, 48)


def icon(size):
    S = 4 * size
    im = Image.new('RGB', (S, S), GRASS)
    d = ImageDraw.Draw(im)
    w = max(4, S // 34)
    # penalty box and six-yard box hanging from the goal line (top edge)
    bx0, bx1, by = int(S * 0.2), int(S * 0.8), int(S * 0.44)
    d.line([(bx0, -w), (bx0, by), (bx1, by), (bx1, -w)], fill=CHALK, width=w, joint='curve')
    sx0, sx1, sy = int(S * 0.37), int(S * 0.63), int(S * 0.19)
    d.line([(sx0, -w), (sx0, sy), (sx1, sy), (sx1, -w)], fill=CHALK, width=w, joint='curve')
    # the arc outside the box
    r = int(S * 0.13)
    d.arc([S // 2 - r, by - r, S // 2 + r, by + r], start=20, end=160, fill=CHALK, width=w)
    # arrow arriving at the box edge
    ax0, ay0, ax1, ay1 = int(S * 0.3), int(S * 0.88), int(S * 0.47), int(S * 0.6)
    aw = int(w * 1.5)
    d.line([(ax0, ay0), (ax1, ay1)], fill=FLAG, width=aw)
    import math
    ang = math.atan2(ay1 - ay0, ax1 - ax0)
    L, spread = S * 0.11, 0.55
    tip = (ax1 + math.cos(ang) * aw * 0.6, ay1 + math.sin(ang) * aw * 0.6)
    p1 = (tip[0] - L * math.cos(ang - spread), tip[1] - L * math.sin(ang - spread))
    p2 = (tip[0] - L * math.cos(ang + spread), tip[1] - L * math.sin(ang + spread))
    d.polygon([tip, p1, p2], fill=FLAG)
    # corner flag bottom-right
    fx, fy = int(S * 0.72), int(S * 0.6)
    fw2 = max(4, S // 45)
    d.line([(fx, fy), (fx, int(S * 0.88))], fill=CHALK, width=fw2)
    fw, fh = int(S * 0.15), int(S * 0.1)
    d.polygon([(fx + fw2 // 2, fy), (fx + fw2 // 2 + fw, fy), (fx + fw2 // 2 + int(fw * 0.7), fy + fh // 2), (fx + fw2 // 2 + fw, fy + fh), (fx + fw2 // 2, fy + fh)], fill=CHALK)
    return im.resize((size, size), Image.LANCZOS)


for n in (180, 192, 512):
    icon(n).save(f'{OUT}/icon-{n}.png', optimize=True)
print('ok')
