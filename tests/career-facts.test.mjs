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

test('affiliate explains partner routing and distinguishes duplicate bundles from completion', () => {
  const affiliate = caseStudies.find(project => project.key === 'affiliate');
  const text = JSON.stringify([affiliate, resume.projectDetails.affiliate, diagrams.affiliate()]);
  for (const fact of ['Gateway', 'Nginx', '방화벽', '보안 정책', '모니터링', '업체', '일 평균 약 500명', '수신 묶음 수']) assert(text.includes(fact), fact);
  assert.doesNotMatch(text, /마지막 묶음|무유실|원천 차단|자동 재시도|누적 약 1만/);
});

test('FluxGate shows a separate HTTP service and Studio components', () => {
  const svg = diagrams.fluxgate();
  for (const fact of ['Direct Redis', 'HTTP API', 'Rate Limit Service', 'Studio UI', 'Admin API', 'Keycloak', 'MongoDB', 'Redis']) assert(svg.includes(fact), fact);
  const copy = JSON.stringify(caseStudies.find(project => project.key === 'fluxgate'));
  for (const fact of ['MongoDB 어댑터', 'HTTP 샘플', '규칙 현황', 'Pub/Sub', 'Micrometer']) assert(copy.includes(fact), fact);
  assert.doesNotMatch(copy, /서버마다.*세면|POC 완료/);
});

test('resume does not reintroduce retired terms or unverified outcome metrics', () => {
  assert.doesNotMatch(JSON.stringify([resume, experience]), /전자쿠폰|6개 인증|90%|1\/3/);
});
