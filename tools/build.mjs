// node tools/build.mjs — tools/content.mjs의 내용으로 index.html, resume.html, work/*.html을 생성합니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profile, focus, ways, caseStudies, experience, openSource, contributions, writing, education } from './content.mjs';
import { diagrams } from './diagrams.mjs';
import { wordmarkSvg } from './logo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const byKey = Object.fromEntries(caseStudies.map(c => [c.key, c]));
const ext = 'target="_blank" rel="noopener noreferrer"';
const isExternal = href => /^https?:/.test(href);
const linkAttrs = href => (isExternal(href) ? ` ${ext}` : '');
const list = (items, cls = 'points') => `<ul class="${cls}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
const tags = (items, label = '기술') => `<ul class="tags" aria-label="${label}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

function page({ title, description, prefix = '', body, current = '', script = true }) {
  const nav = [
    ['프로젝트', `${prefix}index.html#work`, 'nav-keep', 'work'],
    ['경력', `${prefix}index.html#experience`, '', 'experience'],
    ['오픈소스', `${prefix}index.html#opensource`, '', 'opensource'],
    ['글', `${prefix}index.html#writing`, '', 'writing'],
    ['이력서', `${prefix}resume.html`, 'nav-keep', 'resume'],
  ].map(([label, href, cls, id]) => `<a${cls ? ` class="${cls}"` : ''} href="${href}"${current === id ? ' aria-current="page"' : ''}>${label}</a>`).join('\n        ');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/svg+xml" href="${prefix}assets/mark.svg">
  <link rel="stylesheet" href="${prefix}style.css">
${script ? `  <script src="${prefix}script.js" defer></script>\n` : ''}</head>
<body>
  <a class="skip-link" href="#main">본문으로 이동</a>
  <header class="site-header">
    <div class="container">
      <a class="logo" href="${prefix}index.html" aria-label="${profile.name} 홈">${wordmarkSvg()}</a>
      <nav class="site-nav" aria-label="메인 메뉴">
        ${nav}
      </nav>
    </div>
  </header>
${body}
  <footer class="site-footer">
    <div class="container">
      <span>© <span data-year>2026</span> ${profile.name}</span>
      <nav aria-label="외부 링크">
        <a href="${profile.github}" ${ext}>GitHub</a>
        <a href="${profile.blog}" ${ext}>Blog</a>
        <a href="${prefix}index.html#contact">Contact</a>
      </nav>
    </div>
  </footer>
</body>
</html>
`;
}

function flow(f) {
  const rows = f.rows.map(row => `<div class="flow-row">${row.map(col =>
    `<div class="flow-col">${col.map((n, i) => `<span class="node${i === 0 && col.length === 1 ? '' : ''}">${n}</span>`).join('')}</div>`
  ).join('<span class="flow-arrow" aria-hidden="true"></span>')}</div>`).join('');
  return `<figure class="flow-figure"><div class="flow">${rows}</div><figcaption>${f.caption}</figcaption></figure>`;
}

function projectMeta(c, period = c.period) {
  return `<div class="project-meta"><span class="badge">${c.badge}</span><span>${period}</span><span>${c.team}</span></div>`;
}

// ---------- index ----------
function renderIndex() {
  const focusHtml = ''; const _unused = focus.map((f, i) => `
          <article class="focus-card">
            <span class="focus-num">0${i + 1}</span>
            <h3>${f.title}</h3>
            <p>${f.text}</p>
            ${f.ref.length ? `<p class="focus-links">${f.ref.map(k => `<a class="link" href="work/${k}.html">${byKey[k].title} <span class="arrow" aria-hidden="true">→</span></a>`).join('')}</p>` : ''}
          </article>`).join('');

  const featured = caseStudies.filter(c => c.featured);
  const more = caseStudies.filter(c => !c.featured);
  const projects = featured.map((c, i) => `
        <article class="project-card${c.image ? ' has-media' : ''}${c.wide ? ' is-featured' : ''}">
          <div class="project-body">
            ${projectMeta(c)}
            <h3><a href="work/${c.key}.html">${c.title}</a></h3>
            <p class="project-sub">${c.sub}</p>
            <p class="project-summary">${c.summary}</p>
            ${list(c.cardPoints)}
            ${tags(c.stack.slice(0, 6))}
            <span class="project-more link">자세히 읽기 <span class="arrow" aria-hidden="true">→</span></span>
          </div>
          ${c.image ? `<div class="project-media"><img src="assets/fluxgate-repository.png" width="1280" height="850" alt="OpenFluxGate GitHub 저장소 README 화면" loading="lazy"></div>` : ''}
        </article>`).join('');

  const osHtml = openSource.slice(0, 3).map(o => `
        <a class="os-card" href="${o.href}"${linkAttrs(o.href)}>
          <div class="os-top"><h3>${o.title}</h3><span class="os-role">${o.role}</span></div>
          <p>${o.text}</p>
          ${tags(o.tags)}
          <span class="arrow" aria-hidden="true">${isExternal(o.href) ? '↗' : '→'}</span>
        </a>`).join('');

  const contribHtml = contributions.map(c => `
          <a class="contrib-row" href="${c.href}" ${ext}>
            <span class="contrib-repo">${c.repo} #${c.number}<em>merged ${c.merged}</em></span>
            <span><strong>${c.title}</strong><span>${c.text}</span></span>
            <span class="arrow" aria-hidden="true">↗</span>
          </a>`).join('');

  const writingHtml = writing.slice(0, 3).map(w => `
        <article class="post">
          <span class="post-type">${w.type}</span>
          <div>
            <h3><a href="${w.href}" ${ext}>${w.title} <span class="arrow" aria-hidden="true">↗</span></a></h3>
            <p>${w.text}</p>
            ${w.extra.length ? `<p class="post-extra">${w.extra.map(([l, h]) => `<a href="${h}" ${ext}>${l}</a>`).join('')}</p>` : ''}
          </div>
        </article>`).join('');

  const body = `
  <main id="main">
    <section class="hero container" aria-labelledby="hero-title">
      <div class="hero-grid">
        <div>
          <p class="hero-kicker">${profile.role}</p>
          <h1 id="hero-title">${profile.headline}</h1>
          <p class="hero-tagline">${profile.tagline}</p>
          <p class="hero-lead">${profile.lead}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#work">프로젝트 보기</a>
            <a class="btn" href="resume.html">이력서</a>
            <a class="btn" href="${profile.github}" ${ext}>GitHub <span aria-hidden="true">↗</span></a>
            <a class="btn" href="${profile.blog}" ${ext}>기술 블로그 <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <img class="avatar" src="assets/avatar.png" width="148" height="148" alt="${profile.name} 프로필 사진">
      </div>
      <dl class="hero-facts">
        ${profile.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n        ')}
      </dl>
    </section>

    <section id="ways" class="section container" aria-labelledby="ways-title">
      <div class="section-head">
        <h2 id="ways-title">일하는 방식</h2>
        <p>기록으로 확인할 수 있는 것만 적었습니다</p>
      </div>
      <div class="ways-grid">${ways.map(w => `
        <article class="way"><h3>${w.title}</h3><p>${w.text}</p></article>`).join('')}
      </div>
    </section>

    <section id="work" class="section container" aria-labelledby="work-title">
      <div class="section-head">
        <h2 id="work-title">대표 프로젝트</h2>
        <p>무엇을, 왜, 어디까지 만들었는지</p>
      </div>
      <div class="projects">${projects}
      </div>
      <ul class="more-projects">${more.map(c => `
        <li><a href="work/${c.key}.html"><span class="project-meta"><span class="badge">${c.badge}</span><span>${c.period}</span></span><strong>${c.title}</strong><span class="more-sub">${c.sub} · ${c.role}</span><span class="arrow" aria-hidden="true">→</span></a></li>`).join('')}
      </ul>
    </section>

    <section id="experience" class="section container" aria-labelledby="experience-title">
      <div class="section-head">
        <h2 id="experience-title">경력</h2>
        <a class="link" href="resume.html">전체 이력서 <span class="arrow" aria-hidden="true">→</span></a>
      </div>
${renderExperience('', { headingLevel: 3, compact: true })}
    </section>

    <section id="opensource" class="section container" aria-labelledby="opensource-title">
      <div class="section-head">
        <h2 id="opensource-title">오픈소스</h2>
        <a class="link" href="${profile.github}" ${ext}>GitHub <span aria-hidden="true">↗</span></a>
      </div>
      <div class="os-grid">${osHtml}
      </div>
      <div class="contrib">
        <h3 class="sub-title">OSS 기여</h3>${contribHtml}
      </div>
    </section>

    <section id="writing" class="section container" aria-labelledby="writing-title">
      <div class="section-head">
        <h2 id="writing-title">글</h2>
        <a class="link" href="${profile.blog}" ${ext}>블로그 전체 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="posts">${writingHtml}
      </div>
    </section>

    <section id="contact" class="section container" aria-labelledby="contact-title">
      <div class="contact-card">
        <div>
          <h2 id="contact-title">Contact</h2>
          <p>채용이나 협업 제안, 기술 이야기는 이메일로 주세요.</p>
        </div>
        <div class="contact-actions">
          <a class="btn btn-primary email" href="mailto:${profile.email}">${profile.email}</a>
          <button class="btn" type="button" data-copy-email>이메일 복사</button>
          <p class="copy-status" role="status" aria-live="polite"></p>
        </div>
      </div>
    </section>
  </main>
`;
  return page({ title: `${profile.name} — Server Engineer`, description: '회원·인증과 외부 서비스 연동을 만드는 서버 개발자 오재성의 프로젝트, 경력, 오픈소스와 글.', body });
}

function renderExperience(prefix, { headingLevel = 3, compact = false } = {}) {
  const h = `h${headingLevel}`;
  const sub = `h${headingLevel + 1}`;
  return experience.map(co => {
    const jobs = co.projects.map(p => {
      const c = p.ref ? byKey[p.ref] : null;
      const title = c ? c.title : p.title;
      const titleHtml = c ? `<a href="${prefix}work/${c.key}.html">${title} <span class="arrow" aria-hidden="true">→</span></a>` : title;
      const subline = c ? `${c.sub} · ${c.team} · ${c.role}` : `${p.sub} · ${p.team} · ${p.role}`;
      const tagList = c ? c.stack : p.tags;
      return `
        <article class="job">
          <p class="period">${p.period}</p>
          <div>
            <${sub}>${titleHtml}</${sub}>
            <p class="job-sub">${subline}</p>
            ${list(compact ? p.points.slice(0, 2) : p.points)}
            ${tags(compact ? tagList.slice(0, 5) : tagList)}
            ${p.link ? `<p class="job-link"><a class="link" href="${p.link[1]}" ${ext}>${p.link[0]} <span aria-hidden="true">↗</span></a></p>` : ''}
          </div>
        </article>`;
    }).join('');
    const others = co.yearly.length && !compact ? `
        <div class="others">
          <${sub} class="sub-title">연도별로 맡은 일</${sub}>
          <ol class="years">${co.yearly.map(y => `
            <li class="year">
              <div class="year-head"><span class="year-num">${y.year}</span><span class="year-theme">${y.theme}</span></div>
              <ul class="year-items">${y.items.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ul>
            </li>`).join('')}
          </ol>
        </div>` : '';
    return `      <div class="company">
        <div class="company-head"><${h}>${co.name} <span>${co.team}</span></${h}><p class="period">${co.period}</p></div>${jobs}${others}
      </div>`;
  }).join('\n');
}

// ---------- case study ----------
function renderCase(c, i) {
  const prev = caseStudies[i - 1];
  const next = caseStudies[i + 1];
  const slug = (n) => `s${n}`;
  const toc = [['scope', '만든 것'], ...c.story.map((st, n) => [slug(n), st.heading]), ['closing', '돌아보면']];
  const body = `
  <main id="main" class="page case">
    <div class="container case-layout">
      <aside class="toc" aria-label="목차">
        <a class="breadcrumb" href="../index.html#work"><span aria-hidden="true">←</span> 프로젝트</a>
        <ol>${toc.map(([id, l]) => `<li><a href="#${id}">${l}</a></li>`).join('')}</ol>
      </aside>
      <article class="case-body">
        <a class="breadcrumb mobile-only" href="../index.html#work"><span aria-hidden="true">←</span> 프로젝트</a>
        <header class="page-head">
          <div class="project-meta"><span class="badge">${c.badge}</span><span>${c.sub}</span></div>
          <h1>${c.title}</h1>
          <p class="page-lead">${c.summary}</p>
        </header>
        <dl class="facts">
          <div><dt>기간</dt><dd>${c.period}</dd></div>
          <div><dt>팀</dt><dd>${c.team}</dd></div>
          <div><dt>역할</dt><dd>${c.role}</dd></div>
          <div class="facts-wide"><dt>기술</dt><dd>${tags(c.stack)}</dd></div>
        </dl>
${c.links.length ? `        <div class="page-links">${c.links.map(([l, h]) => `<a class="btn" href="${h}" ${ext}>${l} <span aria-hidden="true">↗</span></a>`).join('')}</div>\n` : ''}${c.previews ? `        <div class="link-previews">
          <p class="link-previews-title">지금 운영 중인 약관 페이지</p>
          <div class="preview-grid">${c.previews.map(v => `
            <a class="preview" href="${v.href}" ${ext}><img src="../assets/${v.image}" width="720" height="450" alt="${v.title} 페이지 미리보기" loading="lazy"><span class="preview-body"><strong>${v.title}</strong><span>${v.host} <span aria-hidden="true">↗</span></span></span></a>`).join('')}
          </div>
        </div>\n` : ''}
        <section id="scope" class="case-section">
          <h2>만든 것</h2>
          ${c.diagram && diagrams[c.diagram] ? `<figure class="flow-figure diagram-figure">${diagrams[c.diagram]()}<figcaption><span class="diagram-tip">↔ 옆으로 밀어서 보기 · 탭하면 크게</span><br class="diagram-tip">${c.flow.caption}</figcaption></figure>` : flow(c.flow)}
          <ul class="feature-grid">${c.features.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ul>
          ${c.image ? `<figure class="shot"><img src="../assets/fluxgate-repository.png" width="1280" height="850" alt="OpenFluxGate GitHub 저장소 README 화면" loading="lazy"><figcaption>공개 저장소 README</figcaption></figure>` : ''}
        </section>
${c.story.map((st, n) => `
        <section id="${slug(n)}" class="case-section">
          <h2>${st.heading}</h2>
          ${st.paragraphs.map(p => `<p>${p}</p>`).join('\n          ')}
        </section>`).join('')}

        <section id="closing" class="case-section">
          <h2>돌아보면</h2>
          <blockquote class="closing">${c.closing}</blockquote>
        </section>

        ${c.internal ? '<p class="note">회사 업무는 공개 가능한 수준으로만 적었습니다. 내부 코드, 시스템 이름, 고객 정보와 운영 수치는 넣지 않았고, 팀이 함께 한 일과 제가 한 일을 구분했습니다.</p>' : ''}
        <nav class="pager" aria-label="다른 프로젝트">
          ${prev ? `<a class="prev" href="${prev.key}.html"><span>← 이전</span><strong>${prev.title}</strong></a>` : ''}
          ${next ? `<a class="next" href="${next.key}.html"><span>다음 →</span><strong>${next.title}</strong></a>` : ''}
        </nav>
      </article>
    </div>
  </main>
`;
  return page({ title: `${c.title} — ${profile.name}`, description: c.summary, prefix: '../', body, current: 'work', script: true });
}

// ---------- resume ----------
function renderResume() {
  const body = `
  <main id="main" class="page">
    <div class="container">
      <a class="breadcrumb" href="index.html"><span aria-hidden="true">←</span> 홈</a>
      <header class="page-head">
        <div class="resume-head">
          <div>
            <p class="hero-kicker">${profile.role}</p>
            <h1>${profile.name}</h1>
          </div>
          <span class="resume-actions no-print"><a class="btn btn-primary" href="resume.pdf" download="오재성_이력서.pdf">PDF 다운로드</a><button type="button" class="btn" data-print>인쇄</button></span>
        </div>
        <p class="page-lead">${profile.lead}</p>
        <p class="resume-formats no-print">PDF 다른 형식: <a href="resume/compact.pdf" download="오재성_이력서_compact.pdf">컴팩트 (2쪽)</a> · <a href="resume/simple.pdf" download="오재성_이력서_simple.pdf">심플</a> · <a href="resume/modern.pdf" download="오재성_이력서_modern.pdf">모던</a> · <a href="resume/classic.pdf" download="오재성_이력서_classic.pdf">클래식</a></p>
        <div class="resume-contact">
          <a href="mailto:${profile.email}">${profile.email}</a>
          <a href="${profile.github}">github.com/rojae</a>
          <a href="${profile.blog}">rojae.github.io</a>
        </div>
      </header>

      <section class="resume-block">
        <h2>경력</h2>
${renderExperience('', { headingLevel: 3 })}
      </section>

      <section class="resume-block">
        <h2>기술</h2>
        <ul class="tags"><li>Java 21</li><li>Spring Boot 3</li><li>Spring Security</li><li>Spring Batch</li><li>Spring Cloud Data Flow</li><li>WebFlux</li><li>JPA · Querydsl</li><li>Gravitee API Gateway</li><li>Kafka</li><li>Redis Cluster</li><li>Oracle</li><li>MongoDB</li><li>InfluxDB · Grafana</li><li>MariaDB Galera</li><li>HAProxy · Nginx</li><li>Jenkins</li></ul>
      </section>

      <section class="resume-block">
        <h2>오픈소스</h2>
        <div class="timeline">${openSource.map(o => `
          <div class="timeline-item">
            <p class="period">${o.role}</p>
            <div><h3><a class="link" href="${o.href}">${o.title}</a></h3><p class="team">${o.text}</p></div>
          </div>`).join('')}${contributions.map(c => `
          <div class="timeline-item">
            <p class="period">Contributor</p>
            <div><h3><a class="link" href="${c.href}">${c.repo} #${c.number}</a></h3><p class="team">${c.title} — ${c.text}</p></div>
          </div>`).join('')}
        </div>
      </section>

      <section class="resume-block">
        <h2>글</h2>
        <div class="timeline">${writing.map(w => `
          <div class="timeline-item">
            <p class="period">${w.type}</p>
            <div><h3><a class="link" href="${w.href}">${w.title}</a></h3><p class="team">${w.text}</p></div>
          </div>`).join('')}
        </div>
      </section>

      <section class="resume-block">
        <h2>학력</h2>
        <div class="timeline">${education.map(([p, t, d]) => `
          <div class="timeline-item">
            <p class="period">${p}</p>
            <div><h3>${t}</h3><p class="team">${d}</p></div>
          </div>`).join('')}
        </div>
      </section>

      <p class="note">공개용 경력 요약 · 2026.09</p>
    </div>
  </main>
`;
  return page({ title: `이력서 — ${profile.name}`, description: '백엔드 개발자 오재성의 경력 요약.', body, current: 'resume' });
}

fs.mkdirSync(path.join(root, 'work'), { recursive: true });
fs.writeFileSync(path.join(root, 'index.html'), renderIndex());
fs.writeFileSync(path.join(root, 'resume.html'), renderResume());
const keep = new Set(caseStudies.map(c => `${c.key}.html`));
for (const f of fs.readdirSync(path.join(root, 'work'))) if (!keep.has(f)) fs.rmSync(path.join(root, 'work', f));
caseStudies.forEach((c, i) => fs.writeFileSync(path.join(root, 'work', `${c.key}.html`), renderCase(c, i)));
console.log(`built index.html, resume.html, ${caseStudies.length} case studies`);
