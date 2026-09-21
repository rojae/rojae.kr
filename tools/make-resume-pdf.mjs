// node tools/make-resume-pdf.mjs — content.mjs를 resume-builder(compact 템플릿) 데이터로 변환해 resume.pdf를 만듭니다.
// 사이트 본문과 이력서 PDF가 같은 문구 · 수치를 쓰도록 하기 위한 스크립트입니다.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { profile, caseStudies, experience, openSource, contributions, resume, affiliateMetrics } from './content.mjs';

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
const impact = {
  affiliate: `실시간 동의·배치·탈회·리워드와 운영 어드민을 개발, 동의 ${affiliateMetrics.daily} 규모 운영. 인증 커밋 이후 동의 저장은 별도 트랜잭션으로 분리하고, 배치 중복 판정과 집계에는 유니크 제약·비관적 락을 적용.`,
  auth: '다섯 인증 유형과 외부 업체 연동, 공통 UUID 세션과 관리자 기능 전체 구현. 도메인 설정과 세션 유효기간, 인증 업체별 신규 요청 비율을 관리자 화면에서 변경.',
  terms: '약관 · 약관그룹 · 그룹 매핑 모델과 시행일자 기반 버저닝을 설계하고 HTML 에디터 어드민 · 공개 약관 페이지를 개발. 지마켓 · 옥션 · ESMPLUS 약관 페이지를 한 서비스에서 운영 중이며, 후속 약관 동의 서비스로 확장.',
  platform: '공통 · 사이트별 모듈을 조합해 배포하는 구조(팀 공동) 위에서 제휴 · 인증 모듈을 개발하고, Gravitee API 게이트웨이 라우팅으로 서비스별 호출부를 분산. 프로덕션 운영 중.',
  login: '로그인 불가 장애 이후 DB 연결 문제 분석과 Java/Spring 전환 설계에 참여. 런타임 버전 고정이 연동 기술 적용을 막던 구조를 검토하고 회원정보 조회 캐시(Caffeine) 도입에 참여.',
  edoc: 'HAProxy · Nginx · Tomcat · Redis Sentinel · MaxScale · MariaDB Galera로 서버 22대 이중화 인프라를 구성하고 API · 관리자 · 배치 서비스와 KISA VPN 연동을 개발. 전자문서유통중계자 인증 심사 적합(1차 부적합 → 2차 적합), 2022.09 가오픈.',
};

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
      return { id: p.ref || `p${i}${n}`, order: n + 1, title, period: p.period.replace('—', '~'), role, intro: c ? strip(c.summary) : p.points[0], sections, details: resume.projectDetails[p.ref], tech: (c ? c.stack : p.tags).join(', ') };
    }),
    ...(co.yearly.length ? [{
      id: `ops${i}`, order: 99, title: `${co.name} 회원·인증 운영 개선`, period: co.period.replace('—', '~'), role: '직접 담당',
      intro: co.yearly.flatMap(y => y.items.map(([t]) => t)).join(' · '),
      sections: [{ label: '성과', text: 'NICE 통합인증 API 전환과 배포 절차 정리, 회원 CI 저장·조회 경로 암호화 적용. Kafka·InfluxDB·Grafana로 메시지 발송과 로그인 이벤트를 관측하고 메일 발송 지연 장애 대응. 관심상품·관심매장 API 연동과 서비스 간 명세 변경 협의.' }],
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
    ...openSource.filter(o => ['OpenFluxGate', 'IssueLinker'].includes(o.title)).map(o => ({ name: o.title, tagline: o.title === 'OpenFluxGate' ? 'Redis Lua 기반 분산 Rate Limiting과 Spring Boot 2.7/3.x 스타터, 동적 규칙 관리 어드민을 개발해 Maven Central에 배포. 사내 코드 리뷰·POC 단계.' : o.text, url: o.href.startsWith('http') ? o.href : `${site}/${o.href}` })),
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
const printCss = fs.readFileSync(path.join(root, 'tools/resume-print.css'), 'utf8');
const templates = ['compact', 'simple', 'modern', 'classic'];
fs.mkdirSync(path.join(root, 'resume'), { recursive: true });
const browser = await puppeteer.launch({ headless: true });
try {
  for (const t of templates) {
    const mod = await import(pathToFileURL(path.join(builder, 'templates', `${t}.mjs`)).href);
    const templateData = structuredClone(data);
    if (t === 'compact') {
      const current = templateData.experience[0];
      const continuation = { ...current, pageStart: true, projects: current.projects.slice(4) };
      current.projects = current.projects.slice(0, 4);
      templateData.experience.splice(1, 0, continuation);
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
