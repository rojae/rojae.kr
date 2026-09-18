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


const panel = (x, y, w, h, title, sub) => `
  ${box(x, y, w, h, { fill: 'var(--accent-soft)', stroke: 'color-mix(in srgb, var(--accent) 35%, var(--line))', r: 16 })}
  ${text(x + w / 2, y + 24, title, { size: 15, weight: 800, fill: 'var(--accent)' })}
  ${sub ? text(x + w / 2, y + 44, sub, { size: 11.5, fill: 'var(--text-2)' }) : ''}`;
const label = (x, y, s) => text(x, y, s, { size: 11, weight: 700, fill: 'var(--text-3)' });
const store = (x, y, w, h, title, sub) => `
  <path d="M${x} ${y + 8} a${w / 2} 8 0 0 1 ${w} 0 v${h - 16} a${w / 2} 8 0 0 1 -${w} 0 z" fill="var(--bg)" stroke="var(--line)" stroke-width="1.2"/>
  <path d="M${x} ${y + 8} a${w / 2} 8 0 0 0 ${w} 0" fill="none" stroke="var(--line)" stroke-width="1.2"/>
  ${text(x + w / 2, y + h / 2 + 2, title, { size: 12.5, weight: 700 })}
  ${sub ? text(x + w / 2, y + h / 2 + 18, sub, { size: 10.5, fill: 'var(--text-3)' }) : ''}`;
const wrap = (W, H, aria, parts) => `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">
  <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--text-3)"/></marker></defs>
  ${parts.join('\n  ')}
</svg>`;

export function affiliateDiagram() {
  const W = 980, H = 640, p = [];
  p.push(panel(250, 20, 480, 390, '제휴 연동 서비스', '동의 · 정합 · 탈회 · 리워드를 한 서비스로'));
  // 실시간 동의
  p.push(box(275, 78, 430, 64, { r: 8 }));
  p.push(text(490, 96, '실시간 동의', { size: 13, weight: 700 }));
  p.push(text(490, 116, '본인 인증 커밋 이후(AFTER_COMMIT) → 동의 · 이력은 새 트랜잭션(REQUIRES_NEW)', { size: 10.5, fill: 'var(--text-2)' }));
  p.push(text(490, 131, '이미 동의된 항목은 성공으로 분류해 같은 요청이 와도 결과가 같음', { size: 10.5, fill: 'var(--text-3)' }));
  // 배치 두 개
  p.push(chip(275, 156, 208, 64, '일배치 정합', '묶음 수신 · 마스터 행 비관적 락'));
  p.push(text(379, 208, '마지막 묶음에서 누락 번호 · 건수 비교', { size: 10, fill: 'var(--text-3)' }));
  p.push(chip(497, 156, 208, 64, '월배치 파일', 'Spring Batch chunk · SFTP'));
  p.push(text(601, 208, '레코드 오류는 skip, 시스템 오류는 실패', { size: 10, fill: 'var(--text-3)' }));
  // 탈회, 리워드
  p.push(chip(275, 236, 208, 50, '탈회 연동', '회원 처리와 외부 반영 실패 분리'));
  p.push(chip(497, 236, 208, 50, '리워드 응모', '외부 호출 실패 → 실패 기록 보관'));
  // 저장소
  p.push(store(300, 312, 160, 76, 'Oracle', '동의 · 이력 · 배치 마스터'));
  p.push(store(520, 312, 160, 76, 'MongoDB', '리워드 실패 기록 · 유니크 인덱스'));
  p.push(arrow(379, 286, 379, 312)); p.push(arrow(601, 286, 601, 312));
  // 좌측: 동의 발생 지점
  p.push(label(105, 60, '동의가 생기는 곳'));
  p.push(box(30, 78, 150, 50, { r: 10 })); p.push(text(105, 96, '지마켓 앱', { size: 13, weight: 700 })); p.push(text(105, 114, '안내 화면에서 동의', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(box(30, 146, 150, 50, { r: 10 })); p.push(text(105, 164, '제휴사 앱', { size: 13, weight: 700 })); p.push(text(105, 182, '제휴사 화면에서 동의', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(elbow(180, 103, 275, 106, { mx: 225 })); p.push(elbow(180, 171, 275, 114, { mx: 225 }));
  p.push(text(105, 216, '양쪽에서 발생하는 동의를', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(text(105, 231, '한 상태로 맞추는 것이 과제', { size: 10.5, fill: 'var(--text-3)' }));
  // 우측: 제휴사 시스템
  p.push(label(875, 60, '제휴사 시스템'));
  p.push(chip(800, 78, 150, 50, '동의 API', '실시간 수신 · 회신'));
  p.push(chip(800, 146, 150, 50, '일배치 전송', '묶음 단위 · 건수'));
  p.push(chip(800, 214, 150, 50, 'SFTP 파일', '월 단위'));
  p.push(chip(800, 282, 150, 50, '리워드 응모 API', '외부 지급'));
  p.push(elbow(730, 110, 800, 103, { mx: 765 })); p.push(elbow(800, 171, 730, 180, { mx: 765 }));
  p.push(elbow(800, 239, 730, 188, { mx: 760 })); p.push(elbow(730, 261, 800, 307, { mx: 765 }));
  // 신뢰 경계
  p.push(box(238, 8, 504, 414, { dash: '5 4', stroke: 'var(--text-3)', fill: 'none', r: 18 }));
  p.push(text(250, 434, '- - 게이트웨이 신뢰 경계 · 우회 접근 차단은 인프라 요구사항', { size: 10, fill: 'var(--text-3)', anchor: 'start' }));
  // 어드민
  p.push(box(250, 470, 480, 150, { fill: 'var(--surface)', r: 14 }));
  p.push(text(490, 494, '운영 어드민 (Next.js)', { size: 14, weight: 800 }));
  ['제휴사 관리', '동의 조회', '배치 모니터링', '리워드 실패 목록'].forEach((t, i) => { p.push(box(268 + i * 113, 512, 104, 36, { r: 8 })); p.push(text(320 + i * 113, 530, t, { size: 11.5, weight: 600 })); });
  p.push(box(268, 560, 444, 44, { r: 8, dash: '4 3' }));
  p.push(text(490, 576, '개인정보 접근 감사', { size: 12, weight: 700 }));
  p.push(text(490, 593, '연동 이력과, 그 이력을 누가 조회했는지의 기록을 분리 · 보관 기간 차등', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(arrow(490, 470, 490, 424, { stroke: 'var(--accent)', dash: '5 4' }));
  p.push(text(575, 452, '상태 확인 · 재처리 근거', { size: 11, fill: 'var(--accent)', weight: 600 }));
  return wrap(W, H, '제휴 연동 서비스 구조도: 지마켓 앱과 제휴사 앱 양쪽에서 발생한 동의를 제휴 연동 서비스가 실시간 동의, 일배치 정합, 월배치 파일, 탈회, 리워드로 처리하고 Oracle과 MongoDB에 저장한다. 제휴사 시스템과는 동의 API, 일배치, SFTP, 리워드 API로 연동하며, 운영 어드민에서 제휴사 관리, 동의 조회, 배치 모니터링, 접근 감사를 제공한다.', p);
}

export function platformDiagram() {
  const W = 980, H = 560, p = [];
  // 클라이언트 → 게이트웨이
  p.push(box(30, 40, 130, 44, { r: 10 })); p.push(text(95, 62, '지마켓 앱 · 웹', { size: 12.5, weight: 700 }));
  p.push(box(30, 100, 130, 44, { r: 10 })); p.push(text(95, 122, '옥션 앱 · 웹', { size: 12.5, weight: 700 }));
  p.push(box(30, 160, 130, 44, { r: 10 })); p.push(text(95, 182, '내부 서비스', { size: 12.5, weight: 700 }));
  p.push(box(220, 40, 200, 164, { fill: 'var(--surface)', r: 12 }));
  p.push(text(320, 66, 'API 게이트웨이', { size: 14, weight: 800 }));
  p.push(text(320, 84, 'Gravitee', { size: 11, fill: 'var(--text-3)' }));
  ['호출자 인증 · 권한 검증', '멀티테넌시 라우팅', '운영 모니터링'].forEach((t, i) => { p.push(box(236, 100 + i * 32, 168, 26, { r: 6 })); p.push(text(320, 113 + i * 32, t, { size: 11, weight: 600 })); });
  [62, 122, 182].forEach(y => p.push(elbow(160, y, 220, 122, { mx: 190 })));
  // 사이트별 서비스
  p.push(label(700, 30, '사이트별로 조합 · 배포'));
  p.push(box(500, 40, 200, 70, { r: 12, stroke: 'color-mix(in srgb, var(--accent) 45%, var(--line))' })); p.push(text(600, 64, '지마켓 회원 서비스', { size: 13, weight: 700 })); p.push(text(600, 86, '공통 + 지마켓 + 통합 + 제휴 · 인증', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(box(730, 40, 200, 70, { r: 12, stroke: 'color-mix(in srgb, var(--accent) 45%, var(--line))' })); p.push(text(830, 64, '옥션 회원 서비스', { size: 13, weight: 700 })); p.push(text(830, 86, '공통 + 옥션 + 통합 + 제휴 · 인증', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(elbow(420, 122, 500, 75, { mx: 460 })); p.push(elbow(420, 122, 730, 75, { mx: 460 }));
  // 모듈 패널
  p.push(panel(250, 250, 680, 210, '모듈 구성', 'DB는 하나였지만 API는 사이트마다 두 번 만들던 구조를, 조합해 배포하는 구조로'));
  const mods = [
    ['공통 모듈', '회원정보 · 로그인 · 캐싱', false], ['지마켓 모듈', '지마켓 정책', false], ['옥션 모듈', '옥션 정책', false], ['통합 모듈', '두 사이트 함께', false],
  ];
  mods.forEach(([t, s2], i) => p.push(chip(272 + i * 165, 306, 152, 50, t, s2)));
  p.push(box(272, 374, 646, 64, { r: 8, stroke: 'var(--accent)', sw: 1.6 }));
  p.push(text(595, 394, '제휴 · 인증 모듈', { size: 13, weight: 800, fill: 'var(--accent)' }));
  p.push(text(595, 414, '공통 구조 위에서 제가 주로 개발한 부분 — 어떤 기능을 공유하고 어떤 정책을 사이트별로 남길지', { size: 10.5, fill: 'var(--text-2)' }));
  p.push(text(595, 428, '전체 아키텍처는 팀 공동 설계', { size: 10, fill: 'var(--text-3)' }));
  p.push(arrow(600, 250, 600, 110, { stroke: 'var(--accent)', dash: '5 4' })); p.push(arrow(830, 250, 830, 110, { stroke: 'var(--accent)', dash: '5 4' }));
  p.push(text(715, 180, '필요한 모듈을 조합', { size: 11, fill: 'var(--accent)', weight: 600 }));
  // DB
  p.push(store(70, 300, 130, 76, '통합 Oracle', '지마켓 · 옥션 공용'));
  p.push(store(70, 400, 130, 56, 'MongoDB · Redis', ''));
  p.push(elbow(250, 331, 200, 338, { mx: 225, head: true }));
  p.push(text(135, 480, '데이터는 이미 하나였다.', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(text(135, 495, '나뉘어 있던 건 API 계층.', { size: 10.5, fill: 'var(--text-3)' }));
  return wrap(W, H, '회원 도메인 공통 모듈화 구조도: 지마켓·옥션 앱과 내부 서비스 요청이 Gravitee API 게이트웨이에서 인증·권한 검증과 라우팅을 거쳐 사이트별 회원 서비스로 간다. 각 서비스는 공통 모듈, 사이트 모듈, 통합 모듈, 제휴·인증 모듈을 조합해 배포하며 통합 Oracle을 공유한다.', p);
}

export function loginDiagram() {
  const W = 980, H = 520, p = [];
  // 상단 타임라인
  const steps = [['장애', '전체 로그인 불가'], ['재기동 복구', '증상은 사라짐'], ['원인 · 제약 분석', '연결 단계 실패 · 런타임 고정'], ['전환 설계', 'Java/Spring으로'], ['전환 · 운영', '캐시 · 연동 기술 적용']];
  steps.forEach(([t, s2], i) => {
    const x = 30 + i * 190;
    p.push(box(x, 30, 170, 54, { r: 10, stroke: i === 2 || i === 3 ? 'var(--accent)' : 'var(--line)', sw: i === 2 || i === 3 ? 1.6 : 1.2 }));
    p.push(text(x + 85, 50, t, { size: 13, weight: 700, fill: i === 2 || i === 3 ? 'var(--accent)' : 'var(--text)' }));
    p.push(text(x + 85, 70, s2, { size: 10.5, fill: 'var(--text-3)' }));
    if (i < 4) p.push(arrow(x + 170, 57, x + 190, 57));
  });
  p.push(text(505, 104, '제가 기여한 범위: 원인 분석과 전환 설계', { size: 11, weight: 600, fill: 'var(--accent)' }));
  // Before / After
  p.push(label(250, 150, 'BEFORE'));
  p.push(box(30, 164, 440, 320, { fill: 'var(--surface)', r: 14 }));
  p.push(text(250, 190, '.NET 로그인 · 회원 서비스', { size: 14, weight: 800 }));
  p.push(box(52, 210, 396, 52, { r: 8, dash: '4 3' })); p.push(text(250, 229, '런타임 버전 고정', { size: 12.5, weight: 700 })); p.push(text(250, 248, '사내 보안 라이브러리가 지원하는 버전에 묶여 업그레이드 불가', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(box(52, 274, 396, 52, { r: 8, dash: '4 3' })); p.push(text(250, 293, '연동 기술 적용 제약', { size: 12.5, weight: 700 })); p.push(text(250, 312, 'Redis Cluster · MongoDB 같은 기술을 붙이기 어려움', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(box(52, 338, 396, 52, { r: 8, dash: '4 3' })); p.push(text(250, 357, 'DB 연결 단계에서 장애', { size: 12.5, weight: 700 })); p.push(text(250, 376, '재기동으로 복구했지만 원인을 다시 마주할 수 있는 상태', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(store(180, 404, 140, 60, 'Oracle', ''));
  p.push(arrow(250, 390, 250, 404));
  p.push(text(250, 476, '제약 ≠ 장애의 직접 원인. 둘을 나눠서 봄', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(label(730, 150, 'AFTER'));
  p.push(panel(510, 164, 440, 320, 'Java / Spring 로그인 · 회원 서비스', '조직이 지원하는 런타임에서 유지보수 · 연동 가능'));
  p.push(chip(532, 216, 396, 50, 'Caffeine 로컬 캐시', '자주 조회되는 회원정보 — DB 부하 완화 (팀 작업)'));
  p.push(text(730, 282, '즉시성이 중요한 상태(차단 · 탈퇴)는 캐시 대상 · 만료를 따로 판단', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(store(532, 300, 120, 64, 'Oracle', ''));
  p.push(store(670, 300, 120, 64, 'Redis Cluster', '세션 · 캐시'));
  p.push(store(808, 300, 120, 64, 'MongoDB', ''));
  [592, 730, 868].forEach(x => p.push(arrow(x, 266, x, 300)));
  p.push(box(532, 386, 396, 44, { r: 8 })); p.push(text(730, 402, '모니터링 · 배포 · 연동 기술을 표준 스택에서', { size: 12, weight: 700 })); p.push(text(730, 420, '팀 공동 운영 서비스. 단독 성능 개선이나 규모를 주장하지 않음', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(text(730, 460, '언어를 바꾼 것이 아니라, 제약을 푼 것', { size: 11.5, weight: 700, fill: 'var(--accent)' }));
  p.push(arrow(470, 324, 510, 324, { stroke: 'var(--accent)' }));
  return wrap(W, H, '로그인 시스템 전환 구조도: 장애, 재기동 복구, 원인·제약 분석, 전환 설계, 전환·운영의 흐름과 함께, 런타임 버전이 고정되어 연동 기술을 붙이기 어렵던 .NET 서비스(Before)와 Caffeine 캐시, Oracle, Redis Cluster, MongoDB를 쓰는 Java/Spring 서비스(After)를 비교한다.', p);
}

export function fluxgateDiagram() {
  const W = 980, H = 600, p = [];
  // 요청 흐름
  p.push(box(30, 60, 120, 48, { r: 10 })); p.push(text(90, 84, '클라이언트 요청', { size: 12.5, weight: 700 }));
  p.push(panel(200, 20, 560, 270, '애플리케이션 (Spring Boot 2.7 / 3.x 스타터)', '설정만으로 필터가 붙는다'));
  p.push(box(224, 68, 512, 56, { r: 8 })); p.push(text(480, 88, 'FluxGate Filter · 제한 키 식별 (LimitScope)', { size: 13, weight: 700 })); p.push(text(480, 108, 'IP · 사용자 ID · API 키 · 복합 키(IP + 사용자) — 무엇을 같은 대상으로 셀 것인가', { size: 10.5, fill: 'var(--text-2)' }));
  p.push(arrow(150, 84, 224, 84));
  p.push(arrow(480, 124, 480, 144));
  p.push(box(224, 144, 512, 56, { r: 8 })); p.push(text(480, 164, 'RateLimitHandler · 멀티 밴드 규칙', { size: 13, weight: 700 })); p.push(text(480, 184, '초 · 분 · 시간 제한을 함께 적용 · WAIT_FOR_REFILL이면 보충을 기다림', { size: 10.5, fill: 'var(--text-2)' }));
  p.push(chip(224, 220, 246, 52, 'Direct Redis', '앱이 Redis에 직접'));
  p.push(chip(490, 220, 246, 52, 'HTTP API 모드', '중앙 Rate Limit 서비스 호출'));
  p.push(arrow(347, 200, 347, 220)); p.push(arrow(613, 200, 613, 220));
  // Redis
  p.push(store(800, 190, 150, 80, 'Redis', 'Lua 스크립트'));
  p.push(text(875, 288, '확인 + 차감을 한 번에', { size: 10, fill: 'var(--text-3)' }));
  p.push(arrow(736, 246, 800, 240)); p.push(`<path d="M347 272 L347 300 L780 300 L780 250 L800 250" stroke="var(--text-3)" stroke-width="1.4" fill="none" marker-end="url(#ah)"/>`);
  p.push(text(875, 304, 'Redis 서버 시간 · 정수 연산', { size: 10, fill: 'var(--text-3)' }));
  p.push(text(875, 318, '인스턴스 시계 차이가 섞이지 않음', { size: 10, fill: 'var(--text-3)' }));
  // 응답
  p.push(box(30, 200, 120, 72, { r: 10 })); p.push(text(90, 224, '허용 / 제한', { size: 12.5, weight: 700 })); p.push(text(90, 244, '429 또는 통과', { size: 10.5, fill: 'var(--text-3)' })); p.push(text(90, 258, 'Retry-After', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(elbow(224, 172, 150, 236, { mx: 187 }));
  // 규칙과 운영
  p.push(label(330, 340, '규칙 관리'));
  p.push(box(200, 356, 260, 110, { fill: 'var(--surface)', r: 12 }));
  p.push(text(330, 380, 'FluxGate Studio', { size: 14, weight: 800 })); p.push(text(330, 398, 'Next.js + Spring Boot · Keycloak OIDC', { size: 10.5, fill: 'var(--text-3)' }));
  ['규칙 생성 · 수정 · 토글', '대시보드 · 시뮬레이션'].forEach((t, i) => { p.push(box(216, 412 + i * 26, 228, 22, { r: 6 })); p.push(text(330, 423 + i * 26, t, { size: 11, weight: 600 })); });
  p.push(store(520, 366, 150, 90, 'MongoDB', '규칙 저장'));
  p.push(arrow(460, 411, 520, 411));
  p.push(elbow(595, 366, 480, 290, { mx: 595, head: true, stroke: 'var(--accent)', dash: '5 4' }));
  p.push(text(690, 330, '재시작 없이 규칙 반영', { size: 11, fill: 'var(--accent)', weight: 600 }));
  // 관측
  p.push(label(875, 340, '관측'));
  p.push(chip(800, 356, 150, 50, 'Prometheus', 'Micrometer 메트릭'));
  p.push(chip(800, 420, 150, 50, '구조화 로그', 'correlation ID · JSON'));
  p.push(elbow(736, 172, 800, 381, { mx: 775, dash: '4 3' })); p.push(elbow(736, 176, 800, 445, { mx: 778, dash: '4 3' }));
  // 하단 배포
  p.push(box(200, 500, 750, 76, { fill: 'var(--surface)', r: 12 }));
  p.push(text(575, 524, '배포 · 상태', { size: 13, weight: 800 }));
  p.push(text(575, 545, 'Maven Central io.github.openfluxgate · v0.3.7 · Docusaurus 문서 포털 · 벤치마크 페이지', { size: 11, fill: 'var(--text-2)' }));
  p.push(text(575, 562, '사내: 팀 코드 리뷰 · POC 완료, 프로덕션 도입 검증 중 — 운영 효과는 도입 후 측정', { size: 10.5, fill: 'var(--text-3)' }));
  return wrap(W, H, 'OpenFluxGate 구조도: 클라이언트 요청이 Spring Boot 스타터로 붙은 FluxGate Filter에서 제한 키를 식별하고, RateLimitHandler가 멀티 밴드 규칙으로 판단한다. Redis 직접 접근 또는 HTTP API 모드로 Redis의 Lua 스크립트가 확인과 차감을 한 번에 처리한다. 규칙은 FluxGate Studio에서 MongoDB에 저장되어 재시작 없이 반영되고, Prometheus 메트릭과 구조화 로그로 관측한다.', p);
}

export function termsDiagram() {
  const W = 980, H = 560, p = [];
  // 중앙 서비스
  p.push(panel(300, 20, 380, 314, '약관 서비스', '약관 · 약관그룹 · 그룹 매핑'));
  p.push(box(322, 78, 336, 60, { r: 8 }));
  p.push(text(490, 98, '약관 코드 · 버전 · 시행일자', { size: 13, weight: 700 }));
  p.push(text(490, 118, '미래 시행일로 등록 → 시점이 되면 자동 노출 · 이전보다 과거 · 작은 버전 불가', { size: 10.5, fill: 'var(--text-2)' }));
  p.push(chip(322, 152, 160, 50, '약관그룹 · 매핑', '화면 하나에 N개 약관 · 순서'));
  p.push(chip(498, 152, 160, 50, '매핑 이력', '그룹 ID를 올리며 변경 추적'));
  p.push(chip(322, 216, 160, 50, '법령 대응 필드', '재동의 · 선동의 · 대체동의'));
  p.push(chip(498, 216, 160, 50, '고지 · 동의 연동', '갱신 시 고지 · 동의 코드'));
  p.push(box(322, 280, 336, 38, { r: 8, dash: '4 3' }));
  p.push(text(490, 299, 'Querydsl 동적 조회 · Hibernate 네이밍 전략으로 사이트 접두사 처리', { size: 10.5, fill: 'var(--text-2)' }));
  // 좌측 어드민
  p.push(label(150, 40, '다루는 쪽'));
  p.push(box(30, 56, 240, 200, { fill: 'var(--surface)', r: 12 }));
  p.push(text(150, 80, '약관 어드민', { size: 14, weight: 800 }));
  p.push(text(150, 98, '운영자가 배포 없이 반영', { size: 10.5, fill: 'var(--text-3)' }));
  ['목록 · 이력 · 상세', '등록 · 갱신 · 외부 약관 링크', 'HTML 에디터 (본문 + 편집 데이터)', '그룹 매핑 추가 · 삭제 · 순서'].forEach((t, i) => { p.push(box(46, 112 + i * 34, 208, 28, { r: 6 })); p.push(text(150, 126 + i * 34, t, { size: 11, weight: 600 })); });
  p.push(arrow(270, 156, 300, 156));
  p.push(text(285, 144, '', { size: 10 }));
  // 우측 공개 페이지
  p.push(label(830, 40, '보여주는 쪽'));
  p.push(box(710, 56, 240, 200, { fill: 'var(--surface)', r: 12 }));
  p.push(text(830, 80, '공개 약관 페이지', { size: 14, weight: 800 }));
  p.push(text(830, 98, '약관코드가 URL에 드러남', { size: 10.5, fill: 'var(--text-3)' }));
  ['세 사이트 각각의 약관 페이지', '최신 버전 자동 선택', '본문 · 요약 · 팝업 / 폴딩', 'HTTPS'].forEach((t, i) => { p.push(box(726, 112 + i * 34, 208, 28, { r: 6 })); p.push(text(830, 126 + i * 34, t, { size: 11, weight: 600 })); });
  p.push(arrow(710, 156, 680, 156));
  p.push(box(760, 280, 140, 40, { r: 10 })); p.push(text(830, 300, '브라우저 · 회원가입 화면', { size: 11, weight: 700 }));
  p.push(arrow(830, 280, 830, 256));
  // 저장소
  p.push(store(330, 360, 150, 80, 'RDB', '메타 · 버전 · 시행일자 · 매핑'));
  p.push(store(500, 360, 150, 80, 'Blob Storage', '본문 HTML · 에디터 JSON'));
  p.push(arrow(405, 334, 405, 360)); p.push(arrow(575, 334, 575, 360));
  p.push(text(490, 462, '메타는 RDB에, 본문은 저장소에 · 최초 조회 후 캐시 — 저장소 장애 시 제공 중단 위험을 인지하고 설계', { size: 10.5, fill: 'var(--text-3)' }));
  // 사이트 확장
  p.push(box(300, 490, 380, 50, { r: 10, stroke: 'var(--accent)', sw: 1.4 }));
  p.push(text(490, 508, '지마켓 · 옥션 · ESMPLUS — 세 사이트를 한 서비스로 운영', { size: 12.5, weight: 700, fill: 'var(--accent)' }));
  p.push(text(490, 526, '사이트별 테이블 접두사는 네이밍 전략으로 — profile · config만 바꾸면 추가', { size: 10.5, fill: 'var(--text-2)' }));
  // 동의 서비스
  p.push(chip(30, 300, 240, 50, '약관 동의 서비스', '동의 코드로 연동 · 가입 · 전환 흐름 (후속)'));
  p.push(elbow(270, 325, 300, 241, { mx: 285, dash: '4 3' }));
  return wrap(W, H, '약관 관리 서비스 구조도: 약관 어드민에서 등록·갱신·에디터·그룹 매핑을 다루고, 약관 서비스가 약관 코드·버전·시행일자, 약관그룹·매핑과 이력, 법령 대응 필드, 고지·동의 연동을 관리한다. 메타는 RDB에, 본문 HTML과 에디터 데이터는 Blob 저장소에 둔다. 공개 약관 페이지는 최신 버전을 자동 선택해 보여주며, 사이트 접두사는 네이밍 전략으로 처리해 지마켓·옥션·ESMPLUS 세 사이트를 한 서비스로 다룬다.', p);
}

export function wafDiagram() {
  const W = 980, H = 640, p = [];
  // 요청 → WAF
  p.push(box(30, 40, 120, 48, { r: 10 })); p.push(text(90, 64, '클라이언트 요청', { size: 12.5, weight: 700 }));
  p.push(box(200, 24, 230, 80, { fill: 'var(--surface)', r: 12 }));
  p.push(text(315, 48, 'Nginx + ModSecurity', { size: 14, weight: 800 })); p.push(text(315, 68, 'OWASP CRS · 이상 점수 모드', { size: 10.5, fill: 'var(--text-3)' })); p.push(text(315, 86, '정적 자원 화이트리스트 · 403 차단', { size: 10.5, fill: 'var(--text-3)' }));
  p.push(arrow(150, 64, 200, 64));
  p.push(box(480, 40, 120, 48, { r: 10 })); p.push(text(540, 64, '백엔드 앱', { size: 12.5, weight: 700 }));
  p.push(arrow(430, 64, 480, 64));
  p.push(text(455, 52, '통과', { size: 10, fill: 'var(--text-3)' }));
  // 감사 로그 → Fluent Bit
  p.push(store(650, 24, 140, 70, '감사 로그', 'JSON · RelevantOnly'));
  p.push(arrow(430, 80, 650, 59));
  p.push(box(830, 24, 120, 80, { r: 10, stroke: 'color-mix(in srgb, var(--accent) 45%, var(--line))' })); p.push(text(890, 48, 'Fluent Bit', { size: 13, weight: 700 })); p.push(text(890, 66, 'Lua 분류기', { size: 11, fill: 'var(--accent)', weight: 600 })); p.push(text(890, 84, '룰 ID · 이상 점수', { size: 10, fill: 'var(--text-3)' }));
  p.push(arrow(790, 59, 830, 59));
  // Kafka bus
  p.push(box(200, 150, 750, 40, { fill: 'var(--accent-soft)', stroke: 'color-mix(in srgb, var(--accent) 35%, var(--line))', r: 10 }));
  p.push(text(575, 170, 'Kafka  ·  waf-realtime-events / waf-logs / waf-alerts', { size: 12.5, weight: 700, fill: 'var(--accent)' }));
  p.push(elbow(890, 104, 890, 150, { mx: 890 }));
  // 실시간 트랙
  p.push(label(340, 226, '실시간 트랙 — 지금 봐야 할 것'));
  p.push(box(200, 240, 300, 220, { fill: 'var(--surface)', r: 12 }));
  p.push(chip(216, 254, 268, 50, 'Go 실시간 처리기', '심각도 = 이상 점수 + 공격 유형 가중치 + 위험 IP'));
  p.push(chip(216, 314, 268, 44, 'GeoIP 조회', 'MaxMind GeoLite2'));
  p.push(store(240, 372, 220, 70, 'InfluxDB', '시계열 · 7일 보관'));
  p.push(arrow(350, 190, 350, 254)); p.push(arrow(350, 304, 350, 314)); p.push(arrow(350, 358, 350, 372));
  p.push(text(350, 452, 'SQLi · XSS · RCE · 이상 점수 ≥ 20', { size: 10, fill: 'var(--text-3)' }));
  // 분석 트랙
  p.push(label(770, 226, '분석 트랙 — 나중에 볼 것'));
  p.push(box(560, 240, 390, 220, { fill: 'var(--surface)', r: 12 }));
  p.push(chip(576, 254, 175, 50, 'ksqlDB', '1분 · 5분 윈도우 집계'));
  p.push(chip(760, 254, 175, 50, 'Logstash', 'GeoIP · 필드 정규화'));
  p.push(store(576, 320, 175, 64, 'Elasticsearch', '일 단위 인덱스'));
  p.push(store(760, 320, 175, 64, 'ClickHouse', '스키마만 · 미연결'));
  p.push(arrow(663, 190, 663, 254)); p.push(arrow(847, 190, 847, 254)); p.push(arrow(663, 304, 663, 320)); p.push(arrow(847, 304, 847, 320, { dash: '4 3' }));
  p.push(text(663, 404, '빈도 · 차단율 · 상위 URI 알림', { size: 10, fill: 'var(--text-3)' }));
  p.push(text(847, 404, '스캐너 노이즈는 여기로', { size: 10, fill: 'var(--text-3)' }));
  p.push(elbow(576, 279, 500, 279, { mx: 540, dash: '4 3', head: true }));
  p.push(text(538, 268, '집계 알림', { size: 9.5, fill: 'var(--text-3)' }));
  // 대시보드 / 룰 관리
  p.push(box(200, 500, 750, 120, { r: 14, stroke: 'var(--accent)', sw: 1.4 }));
  p.push(text(575, 524, '대시보드 API (Spring Boot) + Next.js', { size: 14, weight: 800, fill: 'var(--accent)' }));
  p.push(text(575, 542, 'InfluxDB · Elasticsearch를 읽어 SSE로 실시간 로그 · 메트릭 · 알림 스트리밍 · Google OAuth2 로그인', { size: 10.5, fill: 'var(--text-2)' }));
  ['커스텀 룰 CRUD', '화이트리스트', '룰 파일 생성 + reload 신호', 'nginx -t 검증 후 무중단 reload'].forEach((t, i) => { p.push(box(218 + i * 182, 562, 168, 40, { r: 8 })); p.push(text(302 + i * 182, 582, t, { size: 11, weight: 600 })); });
  p.push(arrow(350, 442, 350, 500)); p.push(arrow(663, 384, 663, 500));
  p.push(`<path d="M950 582 L965 582 L965 64 L950 64" stroke="var(--accent)" stroke-width="1.4" fill="none" stroke-dasharray="5 4" marker-end="url(#ah)"/>`);
  p.push(text(962, 320, '룰 반영', { size: 10, fill: 'var(--accent)', weight: 600 }));
  // 관측
  p.push(chip(30, 254, 140, 44, 'Grafana', '실시간 메트릭'));
  p.push(chip(30, 320, 140, 44, 'Kibana', '사후 조사'));
  p.push(elbow(200, 407, 170, 276, { mx: 185, dash: '4 3' })); p.push(`<path d="M576 352 L540 352 L540 484 L185 484 L185 342 L170 342" stroke="var(--text-3)" stroke-width="1.4" fill="none" stroke-dasharray="4 3" marker-end="url(#ah)"/>`);
  return wrap(W, H, 'WAF 플랫폼 구조도: 클라이언트 요청이 Nginx + ModSecurity를 거쳐 백엔드로 가고, 감사 로그를 Fluent Bit Lua 분류기가 Kafka로 보낸다. 실시간 트랙은 Go 처리기가 심각도와 GeoIP를 붙여 InfluxDB에 쓰고 Grafana가 본다. 분석 트랙은 ksqlDB 윈도우 집계와 Logstash를 거쳐 Elasticsearch에 색인되고 Kibana가 본다. ClickHouse는 스키마만 있고 연결되지 않았다. 대시보드 API와 Next.js가 SSE로 데이터를 보여주고, 커스텀 룰은 파일 생성과 reload 신호로 Nginx에 무중단 반영된다.', p);
}

export const diagrams = { waf: wafDiagram, terms: termsDiagram, auth: authDiagram, affiliate: affiliateDiagram, platform: platformDiagram, login: loginDiagram, fluxgate: fluxgateDiagram };
