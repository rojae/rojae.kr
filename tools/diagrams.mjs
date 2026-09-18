// 프로젝트 상세 페이지용 SVG 다이어그램. 색은 CSS 변수를 써서 다크 모드를 따릅니다.
const box = (x, y, w, h, opts = {}) => {
  const { fill = 'var(--bg)', stroke = 'var(--line)', r = 10, dash = '', sw = 1.2 } = opts;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
};
const text = (x, y, s, opts = {}) => {
  const { size = 13, weight = 500, fill = 'var(--text)', anchor = 'middle', family = 'inherit' } = opts;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" font-family="${family}" dominant-baseline="middle">${s}</text>`;
};
const arrow = (x1, y1, x2, y2, opts = {}) => {
  const { stroke = 'var(--text-3)', dash = '', head = true } = opts;
  return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${stroke}" stroke-width="1.4" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}${head ? ' marker-end="url(#ah)"' : ''}/>`;
};
const elbow = (x1, y1, x2, y2, opts = {}) => {
  const mx = opts.mx ?? (x1 + x2) / 2;
  const { stroke = 'var(--text-3)', dash = '', head = true } = opts;
  return `<path d="M${x1} ${y1} L${mx} ${y1} L${mx} ${y2} L${x2} ${y2}" stroke="${stroke}" stroke-width="1.4" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}${head ? ' marker-end="url(#ah)"' : ''}/>`;
};
const chip = (x, y, w, h, title, sub) => `
  ${box(x, y, w, h, { fill: 'var(--bg)', stroke: 'var(--line)', r: 8 })}
  ${text(x + w / 2, y + 17, title, { size: 13, weight: 700 })}
  ${text(x + w / 2, y + 36, sub, { size: 11, fill: 'var(--text-3)' })}`;

export function authDiagram() {
  const W = 980, H = 600;
  const parts = [];
  // 서비스 영역
  parts.push(box(250, 20, 480, 400, { fill: 'var(--accent-soft)', stroke: 'color-mix(in srgb, var(--accent) 35%, var(--line))', r: 16 }));
  parts.push(text(490, 44, '통합인증 서비스', { size: 15, weight: 800, fill: 'var(--accent)' }));
  parts.push(text(490, 64, '도메인별 설정으로 어떤 인증을 어떤 업체로 처리할지 결정', { size: 11.5, fill: 'var(--text-2)' }));

  // 진입점
  parts.push(box(275, 84, 430, 40, { r: 8 }));
  parts.push(text(490, 104, '진입점 · 도메인 식별 · 인증 유형 판단', { size: 13, weight: 600 }));

  // 6개 모듈
  const mods = [
    ['지식인증', 'ID · 비밀번호'], ['소셜인증', '외부 계정 로그인'], ['소유인증', '휴대폰 · 이메일'],
    ['본인인증', '휴대폰 본인확인'], ['계좌인증', '계좌점유 확인'], ['기업인증', '사업자 확인'],
  ];
  mods.forEach(([t, s], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    parts.push(chip(275 + col * 145, 142 + row * 62, 135, 50, t, s));
  });

  // 업체 라우터 (비율)
  parts.push(box(275, 278, 430, 56, { r: 8 }));
  parts.push(text(490, 294, '인증업체 라우터 · 비율 배분', { size: 13, weight: 600 }));
  parts.push(`<rect x="290" y="306" width="400" height="14" rx="7" fill="var(--line)"/>`);
  parts.push(`<rect x="290" y="306" width="280" height="14" rx="7" fill="var(--accent)"/>`);
  parts.push(text(430, 313, '업체 A 70%', { size: 10.5, weight: 700, fill: '#fff' }));
  parts.push(text(630, 313, '업체 B 30%', { size: 10.5, weight: 700, fill: 'var(--text-2)' }));

  // 결과 처리
  parts.push(chip(275, 352, 205, 50, '인증 서비스 토큰', '결과를 토큰으로 후속 단계에'));
  parts.push(chip(500, 352, 205, 50, '인증 세션 (Redis)', '내역 · 이력을 다음 단계까지'));

  // 좌측 사이트
  const sites = ['지마켓', '옥션', 'ESMPLUS'];
  sites.forEach((s, i) => {
    const y = 120 + i * 80;
    parts.push(box(30, y, 150, 48, { r: 10 }));
    parts.push(text(105, y + 24, s, { size: 14, weight: 700 }));
    parts.push(elbow(180, y + 24, 250, 104, { mx: 215 }));
  });
  parts.push(text(105, 96, '연동 서비스', { size: 11, weight: 700, fill: 'var(--text-3)' }));

  // 우측 외부 업체
  const ext = [['본인확인 기관', '휴대폰 본인확인'], ['계좌인증 기관', '은행 계좌 확인'], ['소셜 로그인 제공자', 'OAuth 연동']];
  ext.forEach(([t, s], i) => {
    const y = 120 + i * 80;
    parts.push(chip(800, y, 150, 50, t, s));
    parts.push(elbow(730, 306, 800, y + 25, { mx: 765, dash: i === 2 ? '' : '' }));
  });
  parts.push(text(875, 96, '외부 인증업체', { size: 11, weight: 700, fill: 'var(--text-3)' }));
  parts.push(box(800, 360, 150, 44, { dash: '4 3', r: 10 }));
  parts.push(text(875, 375, '업체 장애 시', { size: 11.5, weight: 700, fill: 'var(--text-2)' }));
  parts.push(text(875, 392, '비율을 옮겨 신규 요청 우회', { size: 10.5, fill: 'var(--text-3)' }));

  // 하단 어드민
  parts.push(box(250, 470, 480, 100, { fill: 'var(--surface)', r: 14 }));
  parts.push(text(490, 494, '어드민', { size: 14, weight: 800 }));
  const adminItems = ['도메인별 연동 설정', '인증 유형별 사용 여부', '인증업체 비율 조정'];
  adminItems.forEach((t, i) => {
    parts.push(box(272 + i * 148, 512, 138, 40, { r: 8 }));
    parts.push(text(341 + i * 148, 532, t, { size: 12, weight: 600 }));
  });
  parts.push(arrow(490, 470, 490, 424, { stroke: 'var(--accent)', dash: '5 4' }));
  parts.push(text(560, 447, '배포 없이 설정 반영', { size: 11, fill: 'var(--accent)', weight: 600 }));

  // 결과 -> 사이트 (토큰 회신)
  parts.push(elbow(275, 377, 105, 320, { mx: 215, dash: '5 4' }));
  parts.push(text(105, 335, '토큰으로 결과 회신', { size: 11, fill: 'var(--text-3)' }));

  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="통합인증 서비스 구조도: 지마켓·옥션·ESMPLUS가 통합인증 진입점을 거쳐 여섯 가지 인증 모듈 중 하나를 사용하고, 인증업체 라우터가 설정된 비율로 외부 인증업체를 고른다. 결과는 토큰과 세션으로 전달되고, 어드민에서 도메인별 연동과 업체 비율을 조정한다.">
  <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--text-3)"/></marker></defs>
  ${parts.join('\n  ')}
</svg>`;
}

export const diagrams = { auth: authDiagram };
