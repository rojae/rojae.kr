// 프로젝트 상세 다이어그램 원본(SVG) 생성기.
// 블로그 시각 설계 기준을 따릅니다: 관계는 선으로 그리고, 주요 글자는 표시 크기 14px 이상,
// 가로(wide, 700px)와 세로(narrow, 330px) 두 벌을 만듭니다.
// 결과는 밝은 팔레트의 독립 SVG이며, tools/diagrams.mjs가 사이트 테마 변수로 바꿔 인라인합니다.
// 통합인증 · 제휴 연동 원본은 블로그 작업에서 검토한 파일을 그대로 씁니다(이 생성기 대상 아님).
//   node tools/make-diagrams.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'diagrams');
const C = {
  ink: '#192e42', muted: '#52677c', blue: '#285fbc', green: '#157458', red: '#b33c42',
  line: '#cdd8e3', soft: '#f2f5f9', softBlue: '#edf3fd', softGreen: '#f1f8f5', softRed: '#fbeef0', white: '#fff',
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function svg(name, w, h, title, desc, body) {
  const id = name;
  const markers = ['ink', 'muted', 'blue', 'green', 'red'].map(k =>
    `<marker id="${id}-arrow-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="${C[k]}" stroke-width="1.5"/></marker>`).join('');
  const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc><defs>${markers}<style>text{font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;letter-spacing:-.4px;fill:${C.ink}}.mono{font-family:Menlo,Consolas,monospace;letter-spacing:-.6px}</style></defs><rect width="100%" height="100%" fill="#fff"/>${body.flat(Infinity).join('')}</svg>`;
  writeFileSync(path.join(OUT, `${name}.svg`), out);
  return out.replace(/ARROW/g, id);
}

// 기본 도형. 화살표 마커 id는 svg()에서 파일 이름으로 바뀝니다.
const t = (x, y, s, o = {}) => {
  const { size = 16, fill = 'ink', weight = 500, anchor = 'start', mono = false } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" style="fill:${C[fill] ?? fill}" font-weight="${weight}" text-anchor="${anchor}"${mono ? ' class="mono"' : ''}>${esc(s)}</text>`;
};
const p = (d, o = {}) => {
  const { color = 'line', dash = false, arrow = false, width = 1.6 } = o;
  return `<path d="${d}" fill="none" stroke="${C[color]}" stroke-width="${width}"${dash ? ' stroke-dasharray="5 5"' : ''}${arrow ? ` marker-end="url(#NAME-arrow-${color})"` : ''}/>`;
};
const ln = (x1, y1, x2, y2, o) => p(`M${x1} ${y1}L${x2} ${y2}`, o);
const r = (x, y, w, h, o = {}) => {
  const { fill = 'soft', stroke = null, dash = false, radius = 6 } = o;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${C[fill] ?? fill}" stroke="${stroke ? C[stroke] : 'none'}" stroke-width="1.5"${dash ? ' stroke-dasharray="5 4"' : ''}/>`;
};
const dot = (x, y, color = 'green', hollow = false, dash = false) =>
  `<circle cx="${x}" cy="${y}" r="${hollow ? 9 : 6}" fill="${hollow ? '#fff' : C[color]}" stroke="${C[color]}" stroke-width="2"${dash ? ' stroke-dasharray="3 3"' : ''}/>`;
const cross = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${C.red}" stroke-width="2"/><path d="m${x - 3.5} ${y - 3.5} 7 7 m0 -7 -7 7" stroke="${C.red}" stroke-width="1.8"/>`;
// 상자 + 가운데 정렬된 여러 줄. lines: [text, {size, fill, weight, mono}]
const node = (x, y, w, h, lines, o = {}) => {
  const sizes = lines.map(([, s = {}]) => s.size ?? 16);
  const gap = 6;
  const total = sizes.reduce((a, b) => a + b, 0) + gap * (sizes.length - 1);
  let base = y + (h - total) / 2;
  const texts = lines.map(([s, st = {}], i) => { base += sizes[i]; const out = t(x + w / 2, Math.round(base - sizes[i] * 0.12), s, { anchor: 'middle', ...st }); base += gap; return out; });
  return [r(x, y, w, h, o), ...texts];
};
const store = (x, y, w, h, lines, color = 'green') => {
  const e = 9;
  return [
    `<path d="M${x} ${y + e}a${w / 2} ${e} 0 0 1 ${w} 0v${h - 2 * e}a${w / 2} ${e} 0 0 1 -${w} 0z" fill="${C.white}" stroke="${C[color]}" stroke-width="1.5"/>`,
    `<path d="M${x} ${y + e}a${w / 2} ${e} 0 0 0 ${w} 0" fill="none" stroke="${C[color]}" stroke-width="1.5"/>`,
    node(x, y + e, w, h - e, lines, { fill: 'none' }).slice(1),
  ];
};
const head = (x, y, s, fill = 'muted') => t(x, y, s, { size: 15, fill, weight: 650 });
const divider = (y, w, x = 26) => ln(x, y, w - x, y, { color: 'line', width: 1.2 });

const write = (name, w, h, title, desc, body) => {
  mkdirSync(OUT, { recursive: true });
  const raw = body.flat(Infinity).join('').replace(/NAME-arrow/g, `${name}-arrow`);
  return svg(name, w, h, title, desc, [raw]);
};

// ───────────────────────── 전자문서: 계층별 이중화와 DB 역할 분리
{
  const title = '요청 계층마다 이중화하고, DB 접속 경로와 데이터 복제를 나눴습니다';
  const desc = '이용자 요청은 HAProxy 2대와 keepalived VIP를 거쳐 Nginx WEB 3대로, 다시 HAProxy VIP를 거쳐 Tomcat WAS 2대(API·관리자·배치)로 갑니다. WAS는 AUTH(Redis master·replica, Sentinel 3개), KEY(JKS 키 서버), DB를 호출하고 KISA와는 VPN으로 통신합니다. DB 접속은 MaxScale 2대와 Keepalived가, 노드 간 복제는 MariaDB Galera 3노드가 맡습니다. 운영 서버는 22대입니다.';
  // wide
  const W = 700, rows = [
    { key: 'WEB', count: '3대', y: 70, gate: 'HAProxy ×2', nodes: ['Nginx', 'Nginx', 'Nginx'], note: ['1대는', '별도 도메인'] },
    { key: 'WAS', count: '2대', y: 152, gate: 'HAProxy ×2', nodes: [['Tomcat', 'API·관리자·배치'], ['Tomcat', 'API·관리자·배치']] },
    { key: 'AUTH', count: '2대', y: 234, gate: 'HAProxy ×2', nodes: [['Redis', 'master'], ['Redis', 'replica']], note: ['Sentinel ×3', '세션 토큰'] },
    { key: 'KEY', count: '2대', y: 316, gate: 'HAProxy ×2', nodes: [['키 서버', 'JKS'], ['키 서버', 'JKS']], note: ['암호화 키', ''] },
  ];
  const b = [t(202, 22, '이용자 · 법인', { size: 15, fill: 'muted', anchor: 'middle' }), head(300, 30, '계층별 서버')];
  b.push(ln(202, 28, 202, rows[0].y - 22, { color: 'blue', arrow: true }));
  for (const row of rows) {
    const cy = row.y;
    b.push(t(26, cy - 2, row.key, { size: 19, weight: 750 }), t(26, cy + 20, row.count, { size: 15, fill: 'muted' }));
    b.push(node(136, cy - 20, 132, 40, [[row.gate, { size: 15, fill: 'blue', weight: 650 }]], { fill: 'softBlue', stroke: 'blue' }));
    b.push(ln(268, cy, 296, cy, { color: 'blue', arrow: true }));
    const n = row.nodes.length, nw = n === 3 ? 78 : 124, gap = 10;
    row.nodes.forEach((label, i) => {
      const x = 300 + i * (nw + gap);
      const lines = Array.isArray(label) ? [[label[0], { size: 16, weight: 650 }], [label[1], { size: 14, fill: 'muted' }]] : [[label, { size: 16, weight: 650 }]];
      b.push(node(x, cy - 25, nw, 50, lines, { fill: 'white', stroke: 'line' }));
    });
    if (row.note) { b.push(t(574, cy - 2, row.note[0], { size: 15, fill: 'muted' }), t(574, cy + 19, row.note[1], { size: 15, fill: 'muted' })); }
  }
  // WEB → WAS
  b.push(p('M422 95V110H202V128', { color: 'blue', arrow: true }));
  // WAS → KISA (VPN)
  b.push(ln(558, 152, 590, 152, { color: 'muted', dash: true, arrow: true }));
  b.push(node(594, 130, 92, 44, [['KISA', { size: 16, weight: 700 }]], { fill: 'white', stroke: 'muted', dash: true }));
  b.push(t(640, 194, 'VPN 전용선', { size: 14, fill: 'muted', anchor: 'middle' }));
  // WAS → AUTH / KEY / DB 분기
  b.push(p('M422 177V190H118V448', { color: 'blue' }));
  for (const y of [234, 316]) b.push(ln(118, y, 134, y, { color: 'blue', arrow: true }));
  b.push(t(112, 205, 'WAS에서 호출', { size: 14, fill: 'blue', anchor: 'end' }));
  // DB 계층
  b.push(r(16, 386, 668, 116, { fill: 'softGreen' }));
  b.push(t(26, 446, 'DB', { size: 19, weight: 750 }), t(26, 468, '5대', { size: 15, fill: 'muted' }));
  b.push(ln(118, 448, 134, 448, { color: 'blue', arrow: true }));
  b.push(node(136, 418, 132, 60, [['MaxScale ×2', { size: 15, fill: 'blue', weight: 650 }], ['Keepalived', { size: 14, fill: 'blue' }]], { fill: 'softBlue', stroke: 'blue' }));
  b.push(t(202, 404, '01 접속 경로', { size: 14, fill: 'blue', weight: 650, anchor: 'middle' }));
  b.push(ln(268, 448, 296, 448, { color: 'blue', arrow: true }));
  [0, 1, 2].forEach(i => b.push(store(300 + i * 98, 422, 78, 56, [['DB 노드', { size: 15, fill: 'green', weight: 650 }]])));
  b.push(ln(378, 444, 398, 444, { color: 'green', width: 2 }), ln(378, 456, 398, 456, { color: 'green', width: 2 }));
  b.push(ln(476, 444, 496, 444, { color: 'green', width: 2 }), ln(476, 456, 496, 456, { color: 'green', width: 2 }));
  b.push(t(437, 404, '02 Galera 복제', { size: 14, fill: 'green', weight: 650, anchor: 'middle' }));
  b.push(t(594, 444, '접속 정상과', { size: 15, fill: 'green', weight: 650 }), t(594, 465, '복제 정상은', { size: 15, fill: 'green', weight: 650 }), t(594, 486, '따로 확인', { size: 15, fill: 'green', weight: 650 }));
  b.push(divider(524, W, 16));
  b.push(t(26, 552, '운영 서버 22대 = HAProxy 8 · WEB 3 · WAS 2 · AUTH 2 · KEY 2 · MaxScale 2 · DB 3', { size: 15, fill: 'ink', weight: 650 }));
  write('edoc-wide', W, 572, title, desc, b);

  // narrow
  const N = 330, nb = [t(165, 26, '이용자 · 법인', { size: 15, fill: 'muted', anchor: 'middle' }), ln(165, 34, 165, 52, { color: 'blue', arrow: true })];
  const tiers = [
    ['WEB', 'Nginx ×3', '1대는 별도 도메인'], ['WAS', 'Tomcat ×2', 'API · 관리자 · 배치'],
    ['AUTH', 'Redis master · replica', 'Sentinel ×3 · 세션 토큰'], ['KEY', '키 서버 ×2', 'JKS 암호화 키'],
  ];
  let y = 56;
  tiers.forEach(([k, main, sub], i) => {
    nb.push(r(28, y, 286, 92, { fill: 'white', stroke: 'line' }));
    nb.push(t(42, y + 28, k, { size: 18, weight: 750 }));
    nb.push(t(300, y + 28, 'HAProxy ×2 · VIP', { size: 14, fill: 'blue', weight: 650, anchor: 'end' }));
    nb.push(t(42, y + 56, main, { size: 16, weight: 650 }));
    nb.push(t(42, y + 79, sub, { size: 14, fill: 'muted' }));
    if (i === 0) nb.push(ln(171, y + 92, 171, y + 112, { color: 'blue', arrow: true }));
    y += 112;
  });
  // WAS(두 번째 블록)에서 아래 계층으로 분기
  nb.push(p('M28 214H14V560', { color: 'blue' }));
  for (const yy of [326, 438]) nb.push(ln(14, yy, 26, yy, { color: 'blue', arrow: true }));
  nb.push(ln(14, 560, 26, 560, { color: 'blue', arrow: true }));
  nb.push(t(300, 236, 'KISA · VPN', { size: 14, fill: 'muted', anchor: 'end' }));
  // DB
  y = 504;
  nb.push(r(28, y, 286, 196, { fill: 'softGreen' }));
  nb.push(t(42, y + 28, 'DB', { size: 18, weight: 750 }));
  nb.push(node(42, y + 42, 258, 44, [['01 접속 · MaxScale ×2 · Keepalived', { size: 14, fill: 'blue', weight: 650 }]], { fill: 'softBlue', stroke: 'blue' }));
  nb.push(ln(171, y + 86, 171, y + 106, { color: 'blue', arrow: true }));
  [0, 1, 2].forEach(i => nb.push(store(46 + i * 88, y + 110, 72, 50, [['노드', { size: 15, fill: 'green', weight: 650 }]])));
  nb.push(ln(118, y + 133, 134, y + 133, { color: 'green', width: 2 }), ln(206, y + 133, 222, y + 133, { color: 'green', width: 2 }));
  nb.push(t(171, y + 184, '02 Galera 복제 · 접속과 따로 확인', { size: 14, fill: 'green', weight: 650, anchor: 'middle' }));
  nb.push(divider(720, N, 14));
  nb.push(t(14, 746, '운영 서버 22대', { size: 16, weight: 700 }));
  nb.push(t(14, 770, 'HAProxy 8 · WEB 3 · WAS 2 · AUTH 2', { size: 14, fill: 'muted' }));
  nb.push(t(14, 792, 'KEY 2 · MaxScale 2 · DB 3', { size: 14, fill: 'muted' }));
  write('edoc-narrow', N, 808, title, desc, nb);
}

// ───────────────────────── FluxGate: 요청 처리와 규칙 관리
{
  const title = '확인과 차감은 Redis 안에서 한 번에, 규칙 관리는 별도 경로로';
  const desc = 'Spring Boot 앱의 Filter가 RateLimitHandler에 판단을 위임합니다. Direct Redis 방식은 앱이 Redis에 직접, HTTP API 방식은 별도 Rate Limit Service를 거쳐 Redis에 갑니다. 두 경로 모두 Redis Lua가 토큰 확인과 차감을 원자적으로 실행해 허용 또는 거부(429)를 정합니다. 규칙 관리는 Studio UI가 Keycloak 인증을 쓰는 Admin API를 호출해 MongoDB에 저장하고, MongoDB 어댑터를 설정한 앱이 읽습니다. 변경은 Redis Pub/Sub으로 알립니다.';
  const W = 700, b = [head(26, 30, '요청 처리')];
  b.push(r(16, 50, 262, 128, { fill: 'soft' }));
  b.push(t(28, 72, 'Spring Boot 앱', { size: 14, fill: 'muted', weight: 650 }));
  b.push(node(28, 88, 96, 72, [['Filter', { size: 17, weight: 700 }]], { fill: 'white', stroke: 'line' }));
  b.push(ln(124, 124, 142, 124, { color: 'ink', arrow: true }));
  b.push(node(146, 88, 120, 72, [['RateLimit', { size: 15, weight: 650, mono: true }], ['Handler', { size: 15, weight: 650, mono: true }]], { fill: 'white', stroke: 'line' }));
  // Direct Redis
  b.push(ln(266, 104, 404, 104, { color: 'blue', arrow: true }));
  b.push(t(336, 94, 'Direct Redis', { size: 15, fill: 'blue', weight: 650, anchor: 'middle' }));
  // HTTP API → Rate Limit Service → Redis
  b.push(p('M266 146H286V232H300', { color: 'blue', arrow: true }));
  b.push(t(280, 206, 'HTTP API', { size: 15, fill: 'blue', weight: 650, anchor: 'end' }));
  b.push(node(304, 206, 120, 52, [['Rate Limit', { size: 15, weight: 700 }], ['Service', { size: 15, weight: 700 }]], { fill: 'white', stroke: 'line' }));
  b.push(p('M424 232H483V176', { color: 'blue', arrow: true }));
  // Redis Lua
  b.push(node(408, 66, 150, 108, [['Redis Lua', { size: 20, fill: 'blue', weight: 750 }], ['확인 → 차감', { size: 17, weight: 700 }], ['한 번에 실행', { size: 15, fill: 'muted' }]], { fill: 'softBlue', stroke: 'blue' }));
  b.push(ln(558, 96, 590, 96, { color: 'green', arrow: true }), t(596, 102, '허용', { size: 18, fill: 'green', weight: 750 }));
  b.push(ln(558, 144, 590, 144, { color: 'red', arrow: true }), t(596, 150, '429 거부', { size: 18, fill: 'red', weight: 750 }));
  b.push(t(26, 292, '예) 잔여 1을 동시에 본 A·B 중 A만 차감되고 B는 거부됩니다.', { size: 16, weight: 650 }));
  b.push(t(26, 316, '토큰 보충 시각은 Redis TIME 기준 · 같은 키·슬롯에 판단이 모이는 비용은 남습니다.', { size: 14, fill: 'muted' }));
  b.push(divider(340, W, 16));
  b.push(head(26, 372, '규칙 관리'));
  b.push(node(26, 392, 120, 52, [['Studio UI', { size: 16, weight: 700 }], ['Next.js', { size: 14, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
  b.push(ln(146, 418, 178, 418, { color: 'ink', arrow: true }));
  b.push(node(182, 392, 132, 52, [['Admin API', { size: 16, weight: 700 }], ['규칙 생성·수정', { size: 14, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
  b.push(ln(248, 444, 248, 474, { color: 'muted', dash: true }));
  b.push(node(182, 476, 132, 40, [['Keycloak 인증', { size: 15, weight: 650 }]], { fill: 'soft' }));
  b.push(ln(314, 418, 346, 418, { color: 'green', arrow: true }));
  b.push(store(350, 388, 112, 60, [['MongoDB', { size: 16, fill: 'green', weight: 700 }]]));
  b.push(ln(462, 418, 494, 418, { color: 'green', arrow: true }));
  b.push(node(498, 392, 186, 52, [['MongoDB 어댑터 앱', { size: 15, weight: 700 }], ['규칙 조회', { size: 14, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
  b.push(t(498, 474, '변경 알림: Redis Pub/Sub', { size: 14, fill: 'muted' }), t(498, 496, '→ 캐시 무효화 · 재조회', { size: 14, fill: 'muted' }));
  b.push(divider(536, W, 16));
  b.push(t(26, 564, '차감의 원자성과 규칙 변경 알림은 서로 다른 역할입니다.', { size: 16, weight: 700 }));
  write('fluxgate-wide', W, 584, title, desc, b);

  const N = 330, nb = [head(14, 24, '요청 처리')];
  nb.push(node(14, 38, 140, 46, [['Filter', { size: 17, weight: 700 }]], { fill: 'white', stroke: 'line' }));
  nb.push(ln(154, 61, 172, 61, { color: 'ink', arrow: true }));
  nb.push(node(176, 38, 140, 46, [['RateLimitHandler', { size: 13.5, weight: 650, mono: true }]], { fill: 'white', stroke: 'line' }));
  nb.push(p('M246 84V100H84V122', { color: 'blue', arrow: true }), p('M246 100H246V122', { color: 'blue', arrow: true }));
  nb.push(t(84, 140, 'Direct Redis', { size: 14, fill: 'blue', weight: 650, anchor: 'middle' }));
  nb.push(t(246, 140, 'HTTP API', { size: 14, fill: 'blue', weight: 650, anchor: 'middle' }));
  nb.push(node(176, 152, 140, 50, [['Rate Limit', { size: 15, weight: 700 }], ['Service', { size: 15, weight: 700 }]], { fill: 'white', stroke: 'line' }));
  nb.push(ln(84, 150, 84, 232, { color: 'blue', arrow: true }), ln(246, 202, 246, 232, { color: 'blue', arrow: true }));
  nb.push(node(14, 236, 302, 96, [['Redis Lua', { size: 20, fill: 'blue', weight: 750 }], ['확인 → 차감 한 번에 실행', { size: 16, weight: 700 }]], { fill: 'softBlue', stroke: 'blue' }));
  nb.push(p('M100 332V356', { color: 'green', arrow: true }), t(100, 380, '허용', { size: 18, fill: 'green', weight: 750, anchor: 'middle' }));
  nb.push(p('M230 332V356', { color: 'red', arrow: true }), t(230, 380, '429 거부', { size: 18, fill: 'red', weight: 750, anchor: 'middle' }));
  nb.push(t(14, 414, '잔여 1을 동시에 본 A·B 중', { size: 15, weight: 650 }), t(14, 436, 'A만 차감되고 B는 거부됩니다.', { size: 15, weight: 650 }));
  nb.push(divider(458, N, 14));
  nb.push(head(14, 486, '규칙 관리'));
  const steps = [['Studio UI', 'Next.js'], ['Admin API', 'Keycloak 인증'], ['MongoDB', '규칙 저장'], ['MongoDB 어댑터 앱', '규칙 조회']];
  steps.forEach(([a, s], i) => {
    const yy = 500 + i * 74;
    if (a === 'MongoDB') nb.push(store(85, yy - 4, 160, 62, [[a, { size: 16, fill: 'green', weight: 700 }], [s, { size: 14, fill: 'muted' }]]));
    else nb.push(node(14, yy, 302, 54, [[a, { size: 16, weight: 700 }], [s, { size: 14, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
    if (i < steps.length - 1) nb.push(ln(165, yy + 54, 165, yy + 72, { color: i === 0 ? 'ink' : 'green', arrow: true }));
  });
  nb.push(t(14, 820, '변경 알림은 Redis Pub/Sub → 캐시 무효화', { size: 14, fill: 'muted' }));
  nb.push(divider(840, N, 14));
  nb.push(t(14, 866, '차감의 원자성과 규칙 알림은', { size: 16, weight: 700 }), t(14, 889, '서로 다른 역할입니다.', { size: 16, weight: 700 }));
  write('fluxgate-narrow', N, 904, title, desc, nb);
}

// ───────────────────────── 약관: 화면 구성과 버전·시행일
{
  const title = '화면 구성과 약관 내용을 나누고, 시행일이 노출 버전을 바꿉니다';
  const desc = '약관 그룹은 화면 하나에 함께 노출되는 묶음이고, 그룹 매핑이 포함 약관과 노출 순서를 정하며, 약관은 코드·버전·시행일을 가집니다. 매핑을 바꿀 때마다 그룹 ID를 올려 이력을 남깁니다. 새 버전은 미래 시행일로 미리 등록하면 그날부터 노출되고, 이전보다 과거 시행일이나 더 작은 버전은 등록할 수 없습니다. 버전과 시점은 설명용 예시입니다.';
  const W = 700, b = [head(26, 30, '화면 구성')];
  b.push(node(26, 50, 170, 70, [['약관 그룹', { size: 19, fill: 'blue', weight: 750 }], ['화면 하나의 묶음', { size: 15, fill: 'muted' }]], { fill: 'softBlue' }));
  b.push(ln(196, 85, 258, 85, { color: 'blue', arrow: true }));
  b.push(node(262, 50, 180, 70, [['그룹 매핑', { size: 19, fill: 'blue', weight: 750 }], ['포함 약관 · 노출 순서', { size: 15, fill: 'muted' }]], { fill: 'softBlue' }));
  b.push(ln(442, 85, 504, 85, { color: 'blue', arrow: true }));
  b.push(node(508, 50, 170, 70, [['약관', { size: 19, fill: 'green', weight: 750 }], ['코드 · 버전 · 시행일', { size: 15, fill: 'muted' }]], { fill: 'softGreen' }));
  b.push(ln(352, 120, 352, 148, { color: 'muted', arrow: true }));
  b.push(t(352, 172, '매핑 변경 이력', { size: 17, weight: 700, anchor: 'middle' }), t(352, 194, '바꿀 때마다 그룹 ID를 올려 기록', { size: 15, fill: 'muted', anchor: 'middle' }));
  b.push(divider(222, W, 16));
  b.push(head(26, 254, '시행일 기준 노출 · 설명용 예시'));
  const X0 = 120, XE = 420, X1 = 670;
  b.push(ln(X0, 282, X1, 282, { color: 'blue', arrow: true }));
  b.push(t(X1, 272, '시간', { size: 14, fill: 'muted', anchor: 'end' }));
  b.push(ln(XE, 290, XE, 410, { color: 'muted', dash: true }));
  b.push(r(XE - 52, 264, 104, 26, { fill: 'white' }), t(XE, 282, '새 시행일', { size: 15, fill: 'ink', weight: 700, anchor: 'middle' }));
  // v3
  b.push(t(26, 330, 'v3', { size: 19, weight: 750 }), t(56, 330, '현재', { size: 14, fill: 'muted' }));
  b.push(ln(X0, 325, XE, 325, { color: 'green', width: 6 }), ln(XE, 325, X1 - 10, 325, { color: 'line', width: 6 }));
  b.push(t((X0 + XE) / 2, 312, '노출 중', { size: 15, fill: 'green', weight: 650, anchor: 'middle' }), t((XE + X1) / 2, 312, '노출 종료', { size: 15, fill: 'muted', anchor: 'middle' }));
  // v4
  b.push(t(26, 390, 'v4', { size: 19, weight: 750 }), t(56, 390, '새 버전', { size: 14, fill: 'muted' }));
  b.push(dot(220, 385, 'blue'));
  b.push(ln(220, 385, XE, 385, { color: 'blue', dash: true, width: 2 }), ln(XE, 385, X1 - 10, 385, { color: 'green', width: 6 }));
  b.push(t(220, 368, '미리 등록', { size: 15, fill: 'blue', weight: 650, anchor: 'middle' }));
  b.push(t((XE + X1) / 2, 372, '그날부터 자동 노출', { size: 15, fill: 'green', weight: 650, anchor: 'middle' }));
  b.push(cross(126, 438), t(146, 444, '과거 시행일 · 더 작은 버전은 등록 불가', { size: 15, fill: 'red', weight: 650 }));
  b.push(divider(468, W, 16));
  b.push(t(26, 496, '내용 변경과 화면 배치 변경을 따로 관리합니다.', { size: 16, weight: 700 }));
  write('terms-wide', W, 514, title, desc, b);

  const N = 330, nb = [head(14, 24, '화면 구성')];
  nb.push(node(14, 38, 302, 58, [['약관 그룹', { size: 18, fill: 'blue', weight: 750 }], ['화면 하나의 묶음', { size: 14, fill: 'muted' }]], { fill: 'softBlue' }));
  nb.push(ln(110, 96, 110, 118, { color: 'blue', arrow: true }));
  nb.push(node(14, 122, 192, 58, [['그룹 매핑', { size: 18, fill: 'blue', weight: 750 }], ['포함 약관 · 순서', { size: 14, fill: 'muted' }]], { fill: 'softBlue' }));
  nb.push(ln(206, 151, 226, 151, { color: 'muted', arrow: true }));
  nb.push(t(232, 146, '변경 이력', { size: 15, weight: 700 }), t(232, 166, '그룹 ID 증가', { size: 13.5, fill: 'muted' }));
  nb.push(ln(110, 180, 110, 202, { color: 'blue', arrow: true }));
  nb.push(node(14, 206, 302, 58, [['약관', { size: 18, fill: 'green', weight: 750 }], ['코드 · 버전 · 시행일', { size: 14, fill: 'muted' }]], { fill: 'softGreen' }));
  nb.push(divider(286, N, 14));
  nb.push(head(14, 314, '시행일 기준 노출 · 예시'));
  const x0 = 60, xe = 190, x1 = 316;
  nb.push(ln(x0, 340, x1, 340, { color: 'blue', arrow: true }));
  nb.push(ln(xe, 346, xe, 446, { color: 'muted', dash: true }));
  nb.push(r(xe - 44, 324, 88, 24, { fill: 'white' }), t(xe, 341, '새 시행일', { size: 14, weight: 700, anchor: 'middle' }));
  nb.push(t(14, 384, 'v3', { size: 18, weight: 750 }));
  nb.push(ln(x0, 379, xe, 379, { color: 'green', width: 6 }), ln(xe, 379, x1 - 8, 379, { color: 'line', width: 6 }));
  nb.push(t((x0 + xe) / 2, 368, '노출 중', { size: 14, fill: 'green', weight: 650, anchor: 'middle' }));
  nb.push(t(14, 434, 'v4', { size: 18, weight: 750 }));
  nb.push(dot(96, 429, 'blue'), ln(96, 429, xe, 429, { color: 'blue', dash: true, width: 2 }), ln(xe, 429, x1 - 8, 429, { color: 'green', width: 6 }));
  nb.push(t(96, 416, '미리 등록', { size: 14, fill: 'blue', weight: 650, anchor: 'middle' }), t((xe + x1) / 2, 416, '자동 노출', { size: 14, fill: 'green', weight: 650, anchor: 'middle' }));
  nb.push(cross(24, 474), t(42, 479, '과거 시행일 · 작은 버전 등록 불가', { size: 14, fill: 'red', weight: 650 }));
  nb.push(divider(500, N, 14));
  nb.push(t(14, 526, '내용 변경과 화면 배치 변경을', { size: 16, weight: 700 }), t(14, 549, '따로 관리합니다.', { size: 16, weight: 700 }));
  write('terms-narrow', N, 564, title, desc, nb);
}

// ───────────────────────── 회원 공통 모듈: 사이트별 조합
{
  const title = '같은 모듈을 조합해 사이트별 회원 서비스로 배포합니다';
  const desc = '호출자 요청은 Gravitee API 게이트웨이에서 호출자 인증과 라우팅을 거쳐 지마켓·옥션 회원 서비스로 갑니다. 두 서비스는 공통, 통합, 제휴·인증 모듈을 함께 쓰고 사이트 정책 모듈만 다릅니다. 두 서비스는 통합 Oracle을 공유합니다. 제휴·인증 모듈은 제가 주로 개발했고, 전체 구조는 팀 공동 설계입니다. 실제 인스턴스와 네트워크 구성은 생략했습니다.';
  const W = 700, b = [];
  b.push(node(26, 20, 168, 56, [['지마켓·옥션 앱·웹', { size: 15, weight: 650 }], ['내부 서비스', { size: 15, weight: 650 }]], { fill: 'soft' }));
  b.push(ln(194, 48, 236, 48, { color: 'blue', arrow: true }));
  b.push(node(240, 20, 220, 56, [['API 게이트웨이', { size: 17, weight: 750 }], ['Gravitee · 호출자 인증 · 라우팅', { size: 14, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
  b.push(p('M350 76V96H200V118', { color: 'blue', arrow: true }), p('M350 96H500V118', { color: 'blue', arrow: true }));
  const cols = [[100, '지마켓 회원 서비스', '지마켓 정책'], [400, '옥션 회원 서비스', '옥션 정책']];
  const mods = [['공통', '회원정보 · 로그인 · 캐싱'], null, ['통합', '두 사이트 함께'], ['제휴 · 인증', '제가 주로 개발']];
  for (const [x, name, site] of cols) {
    b.push(r(x, 122, 200, 276, { fill: 'white', stroke: 'line' }));
    b.push(t(x + 100, 150, name, { size: 17, weight: 750, anchor: 'middle' }));
    mods.forEach((m, i) => {
      const y = 166 + i * 56;
      if (!m) b.push(node(x + 14, y, 172, 46, [[site, { size: 16, weight: 650, fill: 'muted' }]], { fill: 'soft', stroke: 'muted', dash: true }));
      else if (i === 3) b.push(node(x + 14, y, 172, 46, [[m[0], { size: 16, weight: 750, fill: 'blue' }], [m[1], { size: 13.5, fill: 'blue' }]], { fill: 'softBlue', stroke: 'blue' }));
      else b.push(node(x + 14, y, 172, 46, [[m[0], { size: 16, weight: 700, fill: 'blue' }], [m[1], { size: 13.5, fill: 'muted' }]], { fill: 'softBlue' }));
    });
  }
  // 같은 모듈끼리 연결
  for (const i of [0, 2, 3]) { const y = 189 + i * 56; b.push(ln(286, y, 414, y, { color: 'blue', dash: true, width: 1.4 })); }
  b.push(r(312, 178, 76, 22, { fill: 'white' }), t(350, 195, '같은 모듈', { size: 14, fill: 'blue', weight: 650, anchor: 'middle' }));
  b.push(r(312, 234, 76, 22, { fill: 'white' }), t(350, 251, '사이트별', { size: 14, fill: 'muted', weight: 650, anchor: 'middle' }));
  // 범례 / 공통 DB
  b.push(p('M200 398V420H350V438', { color: 'green' }), p('M500 398V420H350V438', { color: 'green', arrow: true }));
  b.push(store(270, 442, 160, 58, [['통합 Oracle', { size: 16, fill: 'green', weight: 700 }]]));
  b.push(t(450, 466, '데이터는 이미 하나였고', { size: 15, fill: 'muted' }), t(450, 488, '나뉜 것은 API 계층', { size: 15, fill: 'muted' }));
  b.push(divider(522, W, 16));
  b.push(t(26, 550, '게이트웨이는 호출자를 확인하고, 회원 데이터 접근 권한은 각 서비스가 판단합니다.', { size: 15, weight: 650 }));
  write('platform-wide', W, 568, title, desc, b);

  const N = 330, nb = [];
  nb.push(node(14, 14, 302, 40, [['지마켓·옥션 앱·웹 · 내부 서비스', { size: 14, weight: 650 }]], { fill: 'soft' }));
  nb.push(ln(165, 54, 165, 72, { color: 'blue', arrow: true }));
  nb.push(node(14, 76, 302, 54, [['API 게이트웨이 · Gravitee', { size: 16, weight: 750 }], ['호출자 인증 · 라우팅', { size: 14, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
  nb.push(p('M165 130V144H84V160', { color: 'blue', arrow: true }), p('M165 144H246V160', { color: 'blue', arrow: true }));
  const ncols = [[14, '지마켓', '지마켓 정책'], [176, '옥션', '옥션 정책']];
  const nmods = [['공통'], null, ['통합'], ['제휴 · 인증']];
  for (const [x, name, site] of ncols) {
    nb.push(r(x, 164, 140, 268, { fill: 'white', stroke: 'line' }));
    nb.push(t(x + 70, 190, `${name} 회원`, { size: 16, weight: 750, anchor: 'middle' }));
    nb.push(t(x + 70, 210, '서비스', { size: 14, fill: 'muted', anchor: 'middle' }));
    nmods.forEach((m, i) => {
      const y = 222 + i * 52;
      if (!m) nb.push(node(x + 10, y, 120, 42, [[site, { size: 15, weight: 650, fill: 'muted' }]], { fill: 'soft', stroke: 'muted', dash: true }));
      else nb.push(node(x + 10, y, 120, 42, [[m[0], { size: 16, weight: 750, fill: 'blue' }]], i === 3 ? { fill: 'softBlue', stroke: 'blue' } : { fill: 'softBlue' }));
    });
  }
  for (const i of [0, 2, 3]) { const y = 243 + i * 52; nb.push(ln(144, y, 186, y, { color: 'blue', dash: true, width: 1.4 })); }
  nb.push(p('M84 432V450H165V466', { color: 'green' }), p('M246 432V450H165V466', { color: 'green', arrow: true }));
  nb.push(store(95, 470, 140, 54, [['통합 Oracle', { size: 15, fill: 'green', weight: 700 }]]));
  nb.push(divider(544, N, 14));
  nb.push(t(14, 570, '점선으로 이은 모듈은 두 서비스가 공유', { size: 14, fill: 'blue', weight: 650 }));
  nb.push(t(14, 592, '제휴 · 인증 모듈은 제가 주로 개발', { size: 14, fill: 'blue', weight: 650 }));
  nb.push(t(14, 614, '회원 데이터 권한은 각 서비스가 판단', { size: 14, fill: 'muted' }));
  write('platform-narrow', N, 630, title, desc, nb);
}

// ───────────────────────── 로그인 전환: 흐름과 제약
{
  const title = '재기동으로 증상은 사라졌고, 남은 런타임 제약을 전환으로 풀었습니다';
  const desc = 'DB 연결 단계 문제로 전체 로그인이 불가능한 장애가 났고 재기동으로 복구했습니다. 이후 원인과 제약을 분석하고 Java/Spring 전환을 설계했으며 저는 이 두 단계에 참여했습니다. 기존 .NET은 사내 보안 라이브러리 때문에 런타임 버전이 고정되어 Redis Cluster·MongoDB 연동이 어려웠습니다. 이 제약이 장애의 직접 원인은 아니지만 대응 폭을 좁혔습니다. 전환과 운영, Caffeine 캐시 적용은 팀 작업입니다.';
  const W = 700, b = [head(26, 30, '진행 흐름')];
  const steps = [['장애', '전체 로그인 불가', 'red'], ['재기동', '증상만 복구', 'muted'], ['원인 · 제약 분석', 'DB 연결 단계', 'blue'], ['전환 설계', 'Java/Spring', 'blue'], ['전환 · 운영', '팀 작업', 'green']];
  const xs = [70, 210, 350, 490, 630];
  b.push(ln(xs[0] + 12, 72, xs[4] - 14, 72, { color: 'blue', width: 1.6 }));
  for (let i = 0; i < 4; i++) b.push(ln(xs[i] + 12, 72, xs[i + 1] - 13, 72, { color: 'blue', arrow: true }));
  steps.forEach(([a, s, c], i) => {
    b.push(i === 0 ? cross(xs[i], 72) : dot(xs[i], 72, c, true));
    b.push(t(xs[i], 112, a, { size: 17, weight: 750, anchor: 'middle', fill: i === 0 ? 'red' : 'ink' }));
    b.push(t(xs[i], 136, s, { size: 15, fill: 'muted', anchor: 'middle' }));
  });
  b.push(p('M286 154V164H554V154', { color: 'blue', width: 1.8 }));
  b.push(t(420, 188, '제가 참여한 범위', { size: 16, fill: 'blue', weight: 700, anchor: 'middle' }));
  b.push(divider(212, W, 16));
  b.push(head(26, 244, '바꾼 것은 언어보다 제약'));
  b.push(r(26, 262, 300, 118, { fill: 'soft' }));
  b.push(t(44, 292, '기존 .NET 서비스', { size: 17, weight: 750 }));
  b.push(t(44, 322, '× 런타임 버전 고정', { size: 15, fill: 'red', weight: 650 }), t(44, 344, '   사내 보안 라이브러리 지원 문제', { size: 14, fill: 'muted' }));
  b.push(t(44, 368, '× Redis Cluster · MongoDB 연동 어려움', { size: 15, fill: 'red', weight: 650 }));
  b.push(ln(326, 321, 370, 321, { color: 'blue', arrow: true }));
  b.push(r(374, 262, 300, 118, { fill: 'softBlue' }));
  b.push(t(392, 292, 'Java / Spring 서비스', { size: 17, fill: 'blue', weight: 750 }));
  b.push(t(392, 322, '✓ 조직이 지원하는 런타임', { size: 15, fill: 'green', weight: 650 }));
  b.push(t(392, 346, '✓ 연동 기술 적용 가능', { size: 15, fill: 'green', weight: 650 }));
  b.push(t(392, 368, '   Caffeine 캐시는 팀 작업', { size: 14, fill: 'muted' }));
  b.push(divider(404, W, 16));
  b.push(t(26, 432, '런타임 제약은 장애의 직접 원인이 아니라, 대응 폭을 좁히는 조건이었습니다.', { size: 16, weight: 700 }));
  write('login-wide', W, 450, title, desc, b);

  const N = 330, nb = [head(14, 24, '진행 흐름')];
  const ys = [56, 116, 176, 236, 296];
  nb.push(ln(30, ys[0], 30, ys[4], { color: 'blue', width: 1.6 }));
  steps.forEach(([a, s, c], i) => {
    nb.push(i === 0 ? cross(30, ys[i]) : dot(30, ys[i], c, true));
    nb.push(t(52, ys[i] + 2, a, { size: 17, weight: 750, fill: i === 0 ? 'red' : 'ink' }));
    nb.push(t(52, ys[i] + 24, s, { size: 14, fill: 'muted' }));
  });
  nb.push(p('M236 162H246V258H236', { color: 'blue', width: 1.8 }));
  nb.push(t(254, 206, '제가', { size: 15, fill: 'blue', weight: 700 }), t(254, 226, '참여', { size: 15, fill: 'blue', weight: 700 }));
  nb.push(divider(342, N, 14));
  nb.push(head(14, 370, '바꾼 것은 언어보다 제약'));
  nb.push(r(14, 384, 302, 108, { fill: 'soft' }));
  nb.push(t(28, 412, '기존 .NET 서비스', { size: 16, weight: 750 }));
  nb.push(t(28, 440, '× 런타임 버전 고정', { size: 15, fill: 'red', weight: 650 }));
  nb.push(t(28, 466, '× Redis Cluster · MongoDB 연동 어려움', { size: 13.5, fill: 'red', weight: 650 }));
  nb.push(ln(165, 492, 165, 514, { color: 'blue', arrow: true }));
  nb.push(r(14, 518, 302, 108, { fill: 'softBlue' }));
  nb.push(t(28, 546, 'Java / Spring 서비스', { size: 16, fill: 'blue', weight: 750 }));
  nb.push(t(28, 574, '✓ 조직이 지원하는 런타임', { size: 15, fill: 'green', weight: 650 }));
  nb.push(t(28, 600, '✓ 연동 기술 적용 · 캐시는 팀 작업', { size: 14, fill: 'green', weight: 650 }));
  nb.push(divider(646, N, 14));
  nb.push(t(14, 672, '제약은 장애의 직접 원인이 아니라', { size: 15, weight: 700 }), t(14, 694, '대응 폭을 좁히는 조건이었습니다.', { size: 15, weight: 700 }));
  write('login-narrow', N, 710, title, desc, nb);
}

// ───────────────────────── WAF: 실시간과 분석 트랙
{
  const title = '지금 볼 이벤트와 나중에 볼 이벤트를 다른 경로로 보냅니다';
  const desc = 'Nginx와 ModSecurity가 공격 요청을 차단하고 감사 로그를 JSON으로 남깁니다. Fluent Bit Lua 분류기가 SQL 인젝션·XSS·RCE 룰 또는 이상 점수 20 이상은 실시간 트랙으로, 스캐너 탐지(913xxx)는 분석 트랙으로 보냅니다. 실시간 트랙은 Kafka를 읽는 Go 처리기가 심각도와 GeoIP를 붙여 InfluxDB에 쓰고 Grafana와 대시보드가 봅니다. 분석 트랙은 Logstash가 Elasticsearch에 색인하고 Kibana로 조사하며, ksqlDB가 1분·5분 윈도우 집계를 만듭니다. ClickHouse는 미연결입니다. 커스텀 룰은 룰 파일과 reload 신호를 남기고 nginx -t 검증을 통과하면 무중단 reload합니다.';
  const W = 700, b = [];
  b.push(t(26, 52, '요청', { size: 17, weight: 750 }), ln(68, 46, 106, 46, { color: 'ink', arrow: true }));
  b.push(node(110, 20, 230, 52, [['Nginx + ModSecurity', { size: 16, weight: 750 }], ['OWASP CRS · 공격 요청 403', { size: 14, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
  b.push(ln(340, 46, 396, 46, { color: 'ink', arrow: true }), t(368, 38, '통과', { size: 14, fill: 'muted', anchor: 'middle' }));
  b.push(node(400, 26, 100, 40, [['백엔드', { size: 16, weight: 650 }]], { fill: 'soft' }));
  b.push(ln(225, 72, 225, 104, { color: 'muted', arrow: true }), t(236, 94, '감사 로그 JSON', { size: 14, fill: 'muted' }));
  b.push(node(110, 108, 230, 46, [['Fluent Bit · Lua 분류', { size: 16, weight: 750 }]], { fill: 'white', stroke: 'line' }));
  b.push(ln(340, 131, 396, 131, { color: 'ink', arrow: true }));
  b.push(node(400, 108, 100, 46, [['Kafka', { size: 17, weight: 750 }]], { fill: 'soft' }));
  // 트랙 분기
  b.push(p('M450 154V172H160V384', { color: 'ink' }));
  const lanes = [
    { y: 222, color: 'blue', soft: 'softBlue', name: '실시간', cond: ['SQLi · XSS · RCE', '이상 점수 ≥ 20'], boxes: [['Go 처리기', '심각도 · GeoIP'], ['InfluxDB', '시계열'], ['Grafana · 대시보드', '실시간 관측']] },
    { y: 314, color: 'green', soft: 'softGreen', name: '분석', cond: ['스캐너 탐지', '913xxx'], boxes: [['Logstash', 'GeoIP · 정규화'], ['Elasticsearch', '일 단위 인덱스'], ['Kibana', '사후 조사']] },
  ];
  for (const L of lanes) {
    b.push(r(16, L.y - 38, 668, 76, { fill: L.soft }));
    b.push(t(26, L.y - 8, L.name, { size: 17, fill: L.color, weight: 750 }));
    b.push(t(26, L.y + 12, L.cond[0], { size: 13.5, fill: 'muted' }), t(26, L.y + 30, L.cond[1], { size: 13.5, fill: 'muted' }));
    b.push(ln(160, L.y, 180, L.y, { color: 'ink', arrow: true }));
    L.boxes.forEach(([a, s], i) => {
      const x = 184 + i * 170;
      b.push(node(x, L.y - 26, 136, 52, [[a, { size: 15.5, weight: 700, fill: L.color }], [s, { size: 13.5, fill: 'muted' }]], { fill: 'white', stroke: L.color }));
      if (i < 2) b.push(ln(x + 136, L.y, x + 166, L.y, { color: L.color, arrow: true }));
    });
  }
  b.push(ln(160, 384, 180, 384, { color: 'ink', arrow: true }));
  b.push(node(184, 362, 136, 44, [['ksqlDB', { size: 15.5, weight: 700, fill: 'green' }]], { fill: 'white', stroke: 'green' }));
  b.push(t(334, 380, '1·5분 윈도우 집계', { size: 14, fill: 'muted' }), t(334, 400, 'IP 빈도 · 차단율 · 상위 URI', { size: 14, fill: 'muted' }));
  b.push(node(554, 362, 136, 44, [['ClickHouse 미연결', { size: 14, fill: 'muted', weight: 650 }]], { fill: 'white', stroke: 'muted', dash: true }));
  b.push(divider(428, W, 16));
  b.push(head(26, 458, '룰 반영'));
  const rule = [['대시보드 API', '커스텀 룰 저장'], ['룰 파일 · 신호', 'reload 신호 파일'], ['nginx -t 검증', '통과 시 무중단 reload']];
  rule.forEach(([a, s], i) => {
    const x = 26 + i * 222;
    b.push(node(x, 474, 190, 52, [[a, { size: 15.5, weight: 700 }], [s, { size: 13.5, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
    if (i < 2) b.push(ln(x + 190, 500, x + 218, 500, { color: 'ink', arrow: true }));
  });
  b.push(t(26, 556, '검증에 실패한 룰은 반영하지 않고 기존 설정을 유지합니다.', { size: 15, weight: 650 }));
  write('waf-wide', W, 574, title, desc, b);

  const N = 330, nb = [];
  const chain = [['Nginx + ModSecurity', '공격 요청 403 · 감사 로그 JSON'], ['Fluent Bit · Lua 분류', '룰 ID · 이상 점수로 나눔'], ['Kafka', '']];
  chain.forEach(([a, s], i) => {
    const y = 14 + i * 74;
    nb.push(node(14, y, 302, s ? 54 : 42, s ? [[a, { size: 16, weight: 750 }], [s, { size: 13.5, fill: 'muted' }]] : [[a, { size: 16, weight: 750 }]], { fill: i === 2 ? 'soft' : 'white', stroke: i === 2 ? null : 'line' }));
    if (i < 2) nb.push(ln(165, y + 54, 165, y + 72, { color: 'ink', arrow: true }));
  });
  nb.push(p('M165 190V204H84V222', { color: 'ink', arrow: true }), p('M165 204H246V222', { color: 'ink', arrow: true }));
  const ncols = [
    [14, 'blue', 'softBlue', '실시간', ['SQLi·XSS·RCE', '이상 점수 ≥ 20'], [['Go 처리기', '심각도·GeoIP'], ['InfluxDB', '시계열'], ['Grafana', '대시보드']]],
    [176, 'green', 'softGreen', '분석', ['스캐너 탐지', '913xxx'], [['Logstash', 'GeoIP'], ['Elasticsearch', '일 단위'], ['Kibana', '사후 조사']]],
  ];
  for (const [x, color, soft, name, cond, boxes] of ncols) {
    nb.push(r(x, 226, 140, 324, { fill: soft }));
    nb.push(t(x + 70, 252, name, { size: 17, fill: color, weight: 750, anchor: 'middle' }));
    nb.push(t(x + 70, 274, cond[0], { size: 13.5, fill: 'muted', anchor: 'middle' }), t(x + 70, 292, cond[1], { size: 13.5, fill: 'muted', anchor: 'middle' }));
    boxes.forEach(([a, s], i) => {
      const y = 306 + i * 82;
      nb.push(node(x + 10, y, 120, 54, [[a, { size: a.length > 10 ? 14 : 15.5, weight: 700, fill: color }], [s, { size: 13.5, fill: 'muted' }]], { fill: 'white', stroke: color }));
      if (i < 2) nb.push(ln(x + 70, y + 54, x + 70, y + 78, { color, arrow: true }));
    });
  }
  nb.push(t(14, 578, 'ksqlDB 1·5분 윈도우 집계', { size: 14, fill: 'green', weight: 650 }));
  nb.push(t(14, 600, 'ClickHouse는 스키마만 있고 미연결', { size: 14, fill: 'muted' }));
  nb.push(divider(622, N, 14));
  nb.push(head(14, 650, '룰 반영'));
  rule.forEach(([a, s], i) => {
    const y = 664 + i * 74;
    nb.push(node(14, y, 302, 52, [[a, { size: 15.5, weight: 700 }], [s, { size: 13.5, fill: 'muted' }]], { fill: 'white', stroke: 'line' }));
    if (i < 2) nb.push(ln(165, y + 52, 165, y + 70, { color: 'ink', arrow: true }));
  });
  nb.push(t(14, 906, '검증 실패 시 기존 설정 유지', { size: 15, weight: 650 }));
  write('waf-narrow', N, 922, title, desc, nb);
}

console.log('diagrams written to', OUT);
