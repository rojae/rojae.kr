#!/usr/bin/env python3
"""로고 서체 교체 도구.

사용법:
  python3 tools/make-logo.py "Caveat" 700        # Google Fonts 서체 이름과 굵기
  python3 tools/make-logo.py "Kaushan Script"
  python3 tools/make-logo.py --list               # 미리 등록된 후보 목록

Google Fonts(github.com/google/fonts)에서 TTF를 받아 'rojae'를 SVG 패스로 변환하고
tools/logo.mjs 와 assets/mark.svg 를 다시 씁니다. 이후 `node tools/build.mjs` 를 실행하세요.
필요 패키지: fontTools (pip install fonttools)
"""
import io, os, re, sys, urllib.request
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = 'rojae'
SCALE = 0.1

# 후보 서체: (google/fonts 저장소 경로, 가변 폰트 여부)
CANDIDATES = {
    'Caveat':         ('ofl/caveat/Caveat[wght].ttf', True),
    'Dancing Script': ('ofl/dancingscript/DancingScript[wght].ttf', True),
    'Kaushan Script': ('ofl/kaushanscript/KaushanScript-Regular.ttf', False),
    'Pacifico':       ('ofl/pacifico/Pacifico-Regular.ttf', False),
    'Satisfy':        ('ofl/satisfy/Satisfy-Regular.ttf', False),
    'Great Vibes':    ('ofl/greatvibes/GreatVibes-Regular.ttf', False),
    'Yellowtail':     ('ofl/yellowtail/Yellowtail-Regular.ttf', False),
    'Marck Script':   ('ofl/marckscript/MarckScript-Regular.ttf', False),
    'Sacramento':     ('ofl/sacramento/Sacramento-Regular.ttf', False),
    'Allura':         ('ofl/allura/Allura-Regular.ttf', False),
}


def fetch(path):
    url = 'https://github.com/google/fonts/raw/main/' + path.replace('[', '%5B').replace(']', '%5D')
    with urllib.request.urlopen(url) as r:
        return r.read()


def load_font(family, weight):
    if family in CANDIDATES:
        path, variable = CANDIDATES[family]
    else:
        slug = family.lower().replace(' ', '')
        name = family.replace(' ', '')
        path, variable = f'ofl/{slug}/{name}-Regular.ttf', False
        try:
            data = fetch(path)
        except Exception:
            path, variable = f'ofl/{slug}/{name}[wght].ttf', True
    data = fetch(path)
    font = TTFont(io.BytesIO(data))
    if variable and 'fvar' in font:
        from fontTools.varLib import instancer
        axes = {a.axisTag: (a.minValue, a.maxValue) for a in font['fvar'].axes}
        if 'wght' in axes:
            lo, hi = axes['wght']
            font = instancer.instantiateVariableFont(font, {'wght': max(lo, min(hi, weight))})
    return font


def kerning(font):
    kern = {}
    if 'GPOS' not in font:
        return kern
    try:
        for lk in font['GPOS'].table.LookupList.Lookup:
            for st in lk.SubTable:
                st = getattr(st, 'ExtSubTable', st)
                if st.LookupType != 2:
                    continue
                if st.Format == 1:
                    cov = st.Coverage.glyphs
                    for i, ps in enumerate(st.PairSet):
                        for pv in ps.PairValueRecord:
                            v = getattr(pv.Value1, 'XAdvance', 0) if pv.Value1 else 0
                            kern.setdefault((cov[i], pv.SecondGlyph), v)
                elif st.Format == 2:
                    c1, c2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                    for g1 in st.Coverage.glyphs:
                        for g2 in font.getGlyphOrder():
                            rec = st.Class1Record[c1.get(g1, 0)].Class2Record[c2.get(g2, 0)]
                            v = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                            if v:
                                kern.setdefault((g1, g2), v)
    except Exception:
        pass
    return kern


def outline(font, text):
    gs, cmap, hmtx, kern = font.getGlyphSet(), font.getBestCmap(), font['hmtx'], kerning(font)
    x, prev, cmds, bp = 0, None, [], BoundsPen(font.getGlyphSet())
    for ch in text:
        g = cmap[ord(ch)]
        if prev:
            x += kern.get((prev, g), 0)
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (SCALE, 0, 0, -SCALE, x * SCALE, 0)))
        gs[g].draw(TransformPen(bp, (SCALE, 0, 0, -SCALE, x * SCALE, 0)))
        cmds.append(pen.getCommands())
        x += hmtx[g][0]
        prev = g
    return ' '.join(cmds), bp.bounds, x * SCALE


def main():
    args = sys.argv[1:]
    if not args or args[0] == '--list':
        print('\n'.join(CANDIDATES))
        return
    family = args[0]
    weight = int(args[1]) if len(args) > 1 else 700
    font = load_font(family, weight)
    word, (x0, y0, x1, y1), adv = outline(font, TEXT)
    r, (rx0, ry0, rx1, ry1), _ = outline(font, 'r')
    # 워드마크: 글자 오른쪽에 파란 점, 위아래 여백 6
    dot_x, dot_y, dot_r = x1 + 8, -5.5, 5.5  # 점은 글자 기준선(y=0) 위에
    vb = (x0 - 4, y0 - 6, (dot_x + dot_r + 4) - (x0 - 4), (y1 - y0) + 12)
    logo = (
        f"// {family} {weight}(OFL)로 쓴 'rojae' 워드마크를 SVG 패스로 변환한 것. 폰트 로딩 없이 렌더링됩니다.\n"
        f"// 다시 만들기: python3 tools/make-logo.py \"{family}\" {weight}\n"
        f"export const wordmarkPath = {word!r};\n"
        f"export const rPath = {r!r};\n"
        f"export const wordmarkSvg = (cls = 'logo-word') => `<svg class=\"${{cls}}\" viewBox=\"{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}\" aria-hidden=\"true\">"
        f"<path d=\"${{wordmarkPath}}\" fill=\"var(--text)\"/><circle cx=\"{dot_x:.1f}\" cy=\"{dot_y:.1f}\" r=\"{dot_r}\" fill=\"var(--accent)\"/></svg>`;\n"
    )
    open(os.path.join(ROOT, 'tools', 'logo.mjs'), 'w').write(logo)
    # 파비콘: 둥근 사각형 안에 r을 가운데 맞춤
    rw, rh = rx1 - rx0, ry1 - ry0
    s = 20 / max(rw, rh)
    cx, cy = (rx0 + rx1) / 2, (ry0 + ry1) / 2
    mark = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 30 30">'
        '<rect width="30" height="30" rx="9" fill="#16181d"/>'
        f'<g transform="translate(14 15) scale({s:.3f}) translate({-cx:.2f} {-cy:.2f})"><path d="{r}" fill="#ffffff"/></g>'
        '<circle cx="23.5" cy="22.5" r="2.2" fill="#2f5bd8"/></svg>\n'
    )
    open(os.path.join(ROOT, 'assets', 'mark.svg'), 'w').write(mark)
    print(f'logo: {family} {weight} → tools/logo.mjs, assets/mark.svg (이제 node tools/build.mjs 실행)')


if __name__ == '__main__':
    main()
