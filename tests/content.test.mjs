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

test('homepage cards omit repeated summaries and miniature README imagery', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert(!html.includes('fluxgate-repository.png'));
  assert(!html.includes('class="project-summary"'));
  assert.equal((html.match(/class="project-role"/g) || []).length, 3);
});

test('case studies lead with the problem while retaining all section anchors', () => {
  for (const c of caseStudies) {
    const html = fs.readFileSync(new URL(`../work/${c.key}.html`, import.meta.url), 'utf8');
    assert(html.indexOf('id="s0"') < html.indexOf('id="scope"'), c.key);
    for (const [index] of c.story.entries()) assert(html.includes(`id="s${index}"`), c.key);
    assert(html.includes('id="closing"'), c.key);
  }
});

test('web resume retains operational history in an accessible disclosure', () => {
  const html = fs.readFileSync(new URL('../resume.html', import.meta.url), 'utf8');
  assert.match(html, /<details class="career-details">/);
  assert.match(html, /<summary>추가 운영 이력<\/summary>/);
  assert(html.includes('NICE 통합인증 API'));
  for (const format of ['compact', 'simple', 'modern', 'classic']) assert(html.includes(`resume/${format}.pdf`));
});

test('selected resume projects explain concrete decisions without unsupported guarantees', () => {
  assert.match(JSON.stringify(resume.projectDetails?.auth), /신규 요청|진행 중/);
  assert.match(JSON.stringify(resume.projectDetails?.affiliate), /항목별 새 트랜잭션/);
  assert.doesNotMatch(JSON.stringify(resume.projectDetails?.affiliate), /무유실|자동 복구를 보장/);
  assert.equal(resume.highlights.length, 3);
});
