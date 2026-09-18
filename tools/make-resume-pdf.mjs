// node tools/make-resume-pdf.mjs — content.mjs를 resume-builder(compact 템플릿) 데이터로 변환해 resume.pdf를 만듭니다.
// 사이트 본문과 이력서 PDF가 같은 문구 · 수치를 쓰도록 하기 위한 스크립트입니다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { profile, caseStudies, experience, openSource, contributions, resume } from './content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builder = path.resolve(root, '..', 'resume-builder');
const byKey = Object.fromEntries(caseStudies.map(c => [c.key, c]));
const site = 'https://rojae.kr';
const strip = s => s.replace(/<[^>]+>/g, '');

// 프로젝트별 '성과' 한 줄 (compact 템플릿은 성과가 있으면 성과를, 없으면 intro를 보여줌)
const impact = {
  affiliate: '실시간 동의 · 일배치 정합 · 월배치 파일 · 탈회 · 리워드와 운영 어드민을 프로덕션 운영 중. 오픈 첫 달 동의 약 1만 명(일 평균 200명, 최대 500명). 인증 커밋 이후 동의 저장을 별도 트랜잭션으로, 배치 묶음 집계는 비관적 락으로 구조를 결정.',
  auth: '지식 · 소셜 · 소유 · 본인 · 계좌 · 기업 인증을 한 서비스의 모듈로 통합하고, 도메인별 연동과 인증업체 비율을 어드민에서 조정하는 구조를 결정 · 구현. 월 인증 비용 약 1/3 절감, 인증 관련 CS 문의 90% 이상 감소.',
  terms: '약관 · 약관그룹 · 그룹 매핑 모델과 시행일자 기반 버저닝을 설계하고 HTML 에디터 어드민 · 공개 약관 페이지를 개발. 지마켓 · 옥션 · ESMPLUS 약관 페이지를 한 서비스에서 운영 중이며, 후속 약관 동의 서비스로 확장.',
  platform: '공통 · 사이트별 모듈을 조합해 배포하는 구조(팀 공동) 위에서 제휴 · 인증 모듈을 개발하고, Gravitee API 게이트웨이 라우팅으로 서비스별 호출부를 분산. 프로덕션 운영 중.',
  login: '로그인 불가 장애 이후 DB 연결 문제 분석과 Java/Spring 전환 설계에 참여. 런타임 버전 고정이 연동 기술 적용을 막던 구조를 검토하고 회원정보 조회 캐시(Caffeine) 도입에 참여.',
  edoc: 'HAProxy · Nginx · Tomcat · Redis Sentinel · MaxScale · MariaDB Galera로 서버 22대 이중화 인프라를 구성하고 API · 관리자 · 배치 서비스와 KISA VPN 연동을 개발. 전자문서유통중계자 인증 심사 적합(1차 부적합 → 2차 적합), 2022.09 가오픈.',
};

const companies = experience.map((co, i) => ({
  id: `c${i}`,
  company: co.name === '지마켓' ? '주식회사 지마켓' : co.name,
  team: co.team,
  period: co.period.replace('—', '~'),
  projects: [
    ...co.projects.map((p, n) => {
      const c = p.ref ? byKey[p.ref] : null;
      const title = c ? `${c.title} (${c.sub})` : `${p.title} (${p.sub})`;
      const role = c ? `${c.team} — ${c.role}` : `${p.team} — ${p.role}`;
      const sections = [{ label: '내용', items: p.points }];
      if (c && impact[c.key]) sections.push({ label: '성과', text: impact[c.key] });
      return { id: p.ref || `p${i}${n}`, order: n + 1, title, period: p.period.replace('—', '~'), role, intro: c ? strip(c.summary) : p.points[0], sections, tech: (c ? c.stack : p.tags).join(', ') };
    }),
    ...(co.yearly.length ? [{
      id: `ops${i}`, order: 99, title: '회원 · 인증 운영 개선 (상시)', period: co.period.replace('—', '~'), role: '직접 담당',
      intro: co.yearly.flatMap(y => y.items.map(([t]) => t)).join(' · '),
      sections: [{ label: '성과', text: co.yearly.flatMap(y => y.items.map(([t, d]) => `${t}: ${d}`)).slice(0, 5).join(' / ') }],
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
    ...openSource.slice(0, 3).map(o => ({ name: o.title, tagline: o.text, url: o.href.startsWith('http') ? o.href : `${site}/${o.href}` })),
    { name: 'OpenFeign', tagline: `코어 라이브러리 개선 ${contributions.length}건 기여 · 병합 (${contributions.map(c => `#${c.number}`).join(', ')})`, url: contributions[0].href },
  ],
  experience: companies,
  education: resume.education,
  awards: resume.awards,
};
fs.writeFileSync(path.join(builder, 'data', 'site.json'), JSON.stringify(data, null, 2));
// 템플릿 4종을 한 번에 생성. resume.pdf는 compact, 나머지는 resume/ 아래에 둡니다.
const templates = ['compact', 'simple', 'modern', 'classic'];
fs.mkdirSync(path.join(root, 'resume'), { recursive: true });
for (const t of templates) {
  execFileSync('node', ['build.mjs', 'site', t], { cwd: builder, stdio: 'inherit' });
  fs.copyFileSync(path.join(builder, 'out', `site-${t}.pdf`), path.join(root, 'resume', `${t}.pdf`));
}
fs.copyFileSync(path.join(root, 'resume', 'compact.pdf'), path.join(root, 'resume.pdf'));
console.log(`resume.pdf (compact) + resume/{${templates.join(',')}}.pdf updated from resume-builder`);
