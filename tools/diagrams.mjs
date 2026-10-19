// 프로젝트 상세 페이지 다이어그램.
// 원본은 tools/diagrams/<key>-wide.svg · <key>-narrow.svg (밝은 팔레트의 독립 SVG)입니다.
// 새 원본은 tools/make-diagrams.mjs로 만들고, 통합인증 · 제휴 연동 원본은 블로그 작업에서 검토한 파일입니다.
// 여기서는 색을 CSS 변수(--dg-*)로 바꿔 다크 모드를 따르게 하고, 가로 · 세로 두 벌을 함께 인라인합니다.
// 어느 쪽을 보일지는 style.css의 container query가 그림 컨테이너 폭으로 정합니다(JavaScript 불필요).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'diagrams');

// 원본 팔레트 → 테마 변수. 블로그 작업 시기에 따라 조금씩 다른 값을 같은 역할로 묶습니다.
const PALETTE = {
  ink: ['#192e42', '#172b3d'],
  muted: ['#52677c', '#637387'],
  blue: ['#285fbc', '#275ca0'],
  green: ['#157458', '#187554'],
  red: ['#b33c42', '#b33e3e'],
  line: ['#cdd8e3', '#cbd5df', '#dce3e9'],
  soft: ['#f2f5f9', '#fafbfd', '#f5f8fc'],
  'soft-blue': ['#edf3fd', '#f0f5fc'],
  'soft-green': ['#f1f8f5', '#eff8f3', '#e4f2eb', '#f4f8f6'],
  'soft-red': ['#fbeef0'],
  bg: ['#ffffff', '#fff'],
};
const COLOR = new Map(Object.entries(PALETTE).flatMap(([name, hexes]) => hexes.map(h => [h.toLowerCase(), `var(--dg-${name})`])));

function themed(file, prefix, variant) {
  let s = readFileSync(path.join(DIR, file), 'utf8');
  const title = (s.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '';
  s = s.replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<rect width="100%" height="100%" fill="#fff(?:fff)?"\/>/, '');
  // id 충돌 방지: 같은 페이지에 가로 · 세로 두 벌이 함께 들어갑니다.
  const ids = [...s.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids) {
    const next = `dg-${prefix}-${variant}-${id}`;
    s = s.replaceAll(`id="${id}"`, `id="${next}"`).replaceAll(`url(#${id})`, `url(#${next})`)
      .replace(/aria-labelledby="([^"]*)"/, (_, v) => `aria-labelledby="${v.split(' ').map(x => (x === id ? next : x)).join(' ')}"`);
  }
  s = s.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, hex => {
    const v = COLOR.get(hex.toLowerCase());
    if (!v) throw new Error(`${file}: unmapped color ${hex}`);
    return v;
  });
  // 고정 크기를 지우고 viewBox로 반응형 표시. 원본 폭은 최대 폭으로 남깁니다.
  const width = Number((s.match(/<svg[^>]*\bwidth="(\d+)"/) || [])[1]);
  s = s.replace(/<svg([^>]*?)\swidth="\d+"\sheight="\d+"/, `<svg$1 class="diagram diagram-${variant}" style="max-width:${width}px"`);
  return { svg: s, title };
}

function figure(key) {
  const wide = themed(`${key}-wide.svg`, key, 'wide');
  const narrow = themed(`${key}-narrow.svg`, key, 'narrow');
  return { title: wide.title, markup: `${wide.svg}${narrow.svg}` };
}

// 상세 페이지에서 쓰는 다이어그램 키. 반환값은 { title, markup }입니다.
const KEYS = ['affiliate', 'auth', 'auth-recovery', 'terms', 'platform', 'login', 'edoc', 'waf', 'fluxgate'];
export const diagrams = Object.fromEntries(KEYS.map(key => [key, () => figure(key).markup]));
export const diagramTitle = key => figure(key).title;
