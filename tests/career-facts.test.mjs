import test from 'node:test';
import assert from 'node:assert/strict';
import { caseStudies, resume, experience } from '../tools/content.mjs';
import { diagrams } from '../tools/diagrams.mjs';

test('public authentication describes all five types and the shared session', () => {
  const auth = caseStudies.find(project => project.key === 'auth');
  const text = JSON.stringify([auth, resume.projectDetails.auth, diagrams.auth()]);
  for (const fact of ['소유', '본인', '계좌', '정보인증', '기업', '아이디·비밀번호', '소셜인증', 'UUID', '유효기간', '활성 여부', '전체 구현', 'E쿠폰']) assert(text.includes(fact), fact);
  assert.doesNotMatch(text, /6개|여섯 가지|전자쿠폰|NICE|90%|1\/3|핵심 구현/);
});

test('affiliate preserves design decisions while abstracting the partner contract', () => {
  const affiliate = caseStudies.find(project => project.key === 'affiliate');
  const text = JSON.stringify([affiliate, resume.projectDetails.affiliate,
    ...Object.entries(diagrams).filter(([key]) => key.startsWith('affiliate')).map(([, render]) => render())]);
  for (const fact of ['같은 명세', '한 제휴사', '추가 구현', '실패 기록', '재처리', '모니터링', '수신 묶음 수', '잠금 대기']) assert(text.includes(fact), fact);
  assert.doesNotMatch(text, /무유실|원천 차단|자동 재시도|누적 약 1만/);
  for (const key of ['affiliate-architecture', 'affiliate-boundary', 'affiliate-extension', 'affiliate-retry', 'affiliate-bundles']) {
    const svg = diagrams[key]();
    assert.doesNotMatch(svg, /삼성|09:00|9시|일배치|월배치|SFTP|\bCI\b|마케팅|정산|단가|Ingress|member-be|member-batch/, key);
    assert.equal((svg.match(/<svg\b/g) || []).length, 2, key);
  }
});

test('FluxGate shows a separate HTTP service and Studio components', () => {
  // Visible node labels must describe the architecture; an SVG description alone is insufficient.
  const svg = diagrams['fluxgate-architecture']().replace(/<desc[\s\S]*?<\/desc>/g, '');
  for (const fact of ['Direct Redis', 'HTTP API', 'Rate Limit Service', 'Studio UI', 'Admin API', 'Keycloak', 'MongoDB', 'Redis']) assert(svg.includes(fact), fact);
  const copy = JSON.stringify(caseStudies.find(project => project.key === 'fluxgate'));
  for (const fact of ['MongoDB 어댑터', 'HTTP 샘플', '규칙 현황', 'Pub/Sub', 'Micrometer']) assert(copy.includes(fact), fact);
  assert.doesNotMatch(copy, /서버마다.*세면|POC 완료/);
});

test('resume does not reintroduce retired terms or unverified outcome metrics', () => {
  assert.doesNotMatch(JSON.stringify([resume, experience]), /전자쿠폰|6개 인증|90%|1\/3/);
});
