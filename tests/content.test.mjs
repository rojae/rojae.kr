import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { caseStudies, resume, experience } from '../tools/content.mjs';

test('consent metrics use the confirmed daily average, not an invented first month', () => {
  const affiliate = caseStudies.find(c => c.key === 'affiliate');
  const text = JSON.stringify({ affiliate, resume, experience });
  assert.match(text, /일 평균 약 500명/);
  assert.doesNotMatch(text, /첫 달|200명|최대 500명/);
});

test('public copy does not expose internal security gaps or editorial self-commentary', () => {
  const text = JSON.stringify(caseStudies);
  assert.doesNotMatch(text, /인증 가드가 없|우회 접근 차단|면접이나 문서에서|제가 혼자 감당|제 프로젝트를 남의 눈으로/);
});

test('homepage leads with projects and keeps detailed career history on the resume', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert(html.indexOf('id="work"') < html.indexOf('id="ways"'));
  assert(!html.includes('class="year-items"'));
  assert.equal((html.match(/class="project-card/g) || []).length, 3);
});
