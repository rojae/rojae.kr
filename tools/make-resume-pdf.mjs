// node tools/make-resume-pdf.mjs — content.mjs를 resume-builder(compact 템플릿) 데이터로 변환해 resume.pdf를 만듭니다.
// 사이트 본문과 이력서 PDF가 같은 문구 · 수치를 쓰도록 하기 위한 스크립트입니다.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { profile, caseStudies, experience, openSource, contributions, resume } from './content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builder = path.join(root, 'resume-builder');
if (!fs.existsSync(path.join(builder, 'package.json'))) {
  throw new Error('Initialize resume-builder: git submodule update --init --recursive');
}
const require = createRequire(path.join(builder, 'package.json'));
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (cause) {
  throw new Error('Install the PDF dependencies: npm ci --prefix resume-builder', { cause });
}
const byKey = Object.fromEntries(caseStudies.map(c => [c.key, c]));
const site = 'https://rojae.kr';
const strip = s => s.replace(/<[^>]+>/g, '');

// 프로젝트별 '성과' 한 줄 (compact 템플릿은 성과가 있으면 성과를, 없으면 intro를 보여줌)
const impact = Object.fromEntries(
  Object.entries(resume.projectDetails).map(([key, paragraphs]) => [key, paragraphs.join(' ')])
);

const companies = experience.map((co, i) => ({
  id: `c${i}`,
  company: co.name === '지마켓' ? '주식회사 지마켓' : co.name,
  team: co.team,
  period: co.period.replace('—', '~').replace('현재', '재직 중'),
  projects: [
    ...co.projects.map((p, n) => {
      const c = p.ref ? byKey[p.ref] : null;
      const title = c ? c.title : p.title;
      const role = c ? `${c.team} — ${c.role}` : `${p.team} — ${p.role}`;
      const sections = [{ label: '내용', items: p.points }];
      if (c && impact[c.key]) sections.push({ label: '성과', text: impact[c.key] });
      return { id: p.ref || `p${i}${n}`, order: n + 1, title, period: p.period.replace('—', '~'), role, intro: c ? strip(c.summary) : p.points[0], sections, details: resume.projectDetails[p.ref] || p.points, tech: (c ? c.stack : p.tags).join(', ') };
    }),
    ...(co.yearly.length ? [{
      id: `ops${i}`, order: 99, title: `${co.name} 회원·인증 운영 개선`, period: co.period.replace('—', '~'), role: '직접 담당',
      intro: '발송 지연 관측, 본인확인 전환과 개인정보 처리·운영 개선',
      details: [
        'API 접수만으로 알기 어려운 발송 지연·에이전트 상태를 Kafka·InfluxDB·Grafana로 관측하도록 개발하고 메일 지연 장애에 대응했습니다.',
        '모듈 종료에 맞춘 NICE API 전환, CI 저장·조회 암호화, 탈퇴 개인정보 분리·파기 배치의 SCDF 전환을 담당하고 ISMS-P 심사에서 절차를 설명했습니다.',
        'DNS는 기존 연결 재사용과 새 연결의 이름 해석, 성공·실패 조회 캐시를 구분해 분석·공유했습니다. 관심상품·관심매장 API 명세 변경도 연동 서비스와 협의했습니다.',
      ],
      sections: [{ label: '문제와 대응', text: 'API 접수만으로 알기 어려운 발송 지연·에이전트 상태를 Kafka·InfluxDB·Grafana로 관측하도록 개발하고 메일 지연 장애에 대응했습니다. 기존 모듈 종료에 맞춘 NICE API 전환과 CI 저장·조회 암호화, 탈퇴 개인정보 분리·파기 배치의 SCDF 전환을 담당했습니다. DNS는 기존 연결 재사용과 새 연결의 조회를 구분해 분석·공유했습니다. 관심상품·관심매장 API 명세 변경도 연동 서비스와 협의했습니다.' }],
    }] : []),
  ],
}));

const data = {
  _standalone: true,
  profile: { name: profile.name, nameEn: resume.nameEn, title: resume.title, email: profile.email, phone: '', location: 'Seoul, Republic of Korea', links: { Site: site, GitHub: profile.github, Blog: profile.blog } },
  summary: resume.summary,
  highlights: resume.highlights,
  skills: resume.skills,
  openSource: [
    ...openSource.filter(o => ['OpenFluxGate', 'IssueLinker'].includes(o.title)).map(o => ({ name: o.title, tagline: o.title === 'OpenFluxGate' ? '동시 요청의 확인·차감을 Lua로 원자 처리하고 Redis TIME으로 앱 시계 차이를 완화했습니다. EVALSHA는 본문 반복 전송을 줄이며 매 요청 실행은 남습니다. 엔진·스타터 0.3.7 Maven Central 배포·사내 POC. 현재 LTS는 멀티 밴드 검사 후 차감, 슬롯 간 보상 환급의 비원자성·실행 불명 차감의 재시도 제한, Pub/Sub·주기 조회를 다루며 출시 버전과 구분합니다.' : o.text, url: o.href.startsWith('http') ? o.href : `${site}/${o.href}` })),
    ...contributions.map(c => ({ name: `OpenFeign #${c.number}`, tagline: `${c.text}. ${c.merged} 병합.`, url: c.href })),
  ],
  experience: companies,
  education: resume.education,
  awards: resume.awards,
};
// Reuse the existing builder without changing its source data or templates.
const output = path.join(root, 'output', 'resume');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'site.json'), JSON.stringify(data, null, 2));
const theme = fs.readFileSync(path.join(builder, 'styles/theme.css'), 'utf8');
const printCss = fs.readFileSync(path.join(root, 'tools/resume-print.css'), 'utf8')
  + '\nsection.block:has(.skills-row), section.block:has(.skill-block) { break-inside: avoid; }';
const templates = ['compact', 'simple', 'modern', 'classic'];
fs.mkdirSync(path.join(root, 'resume'), { recursive: true });
const browser = await puppeteer.launch({ headless: true });
try {
  for (const t of templates) {
    const mod = await import(pathToFileURL(path.join(builder, 'templates', `${t}.mjs`)).href);
    const templateData = structuredClone(data);
    if (t === 'compact') {
      const current = templateData.experience[0];
      const continuation = { ...current, pageStart: true, projects: current.projects.slice(3) };
      current.projects = current.projects.slice(0, 3);
      templateData.experience.splice(1, 0, continuation);
      templateData.experience[2].pageStart = true;
    }
    if (t !== 'compact') for (const company of templateData.experience) for (const project of company.projects) {
      project.intro = '';
      if (project.details) project.sections = [{ label: '설계와 결과', items: project.details }];
      else if (project.sections.some(section => section.label === '내용')) project.sections = project.sections.filter(section => section.label === '내용');
    }
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${profile.name} 이력서</title><style>${theme}\n${mod.css}\n${printCss}</style></head><body class="template-${t}"><div class="page">${mod.render(templateData)}</div></body></html>`);
    // Put work before skill lists, preserving every section.
    await page.evaluate(() => {
      const summary = document.querySelector('.summary');
      const work = [...document.querySelectorAll('section.block')].find(el => el.querySelector('.company'));
      summary.after(work);
    });
    if (t === 'compact') await page.evaluate(companies => {
      document.querySelectorAll('.company').forEach((element, index) => {
        const company = companies[index];
        if (company.pageStart) element.classList.add('resume-page-start');
        element.querySelectorAll('.pj').forEach((project, projectIndex) => {
          const details = company.projects[projectIndex].details;
          if (!details) return;
          const list = document.createElement('ul');
          list.className = 'pj-decisions';
          for (const text of details) {
            const item = document.createElement('li');
            item.textContent = text;
            list.append(item);
          }
          project.querySelector('.pj-desc').replaceWith(list);
        });
      });
    }, templateData.experience);
    await page.evaluate(() => document.fonts.ready);
    fs.writeFileSync(path.join(output, `${t}.html`), await page.content());
    await page.pdf({ path: path.join(root, 'resume', `${t}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#666">rojae.kr &nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
    await page.close();
    console.log(`resume/${t}.pdf`);
  }
} finally {
  await browser.close();
}
fs.copyFileSync(path.join(root, 'resume', 'compact.pdf'), path.join(root, 'resume.pdf'));
console.log(`resume.pdf (compact) + resume/{${templates.join(',')}}.pdf updated from resume-builder`);
