const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
// Use the installed browser tooling without adding a site dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = __dirname;
const output = path.join(root, 'output/playwright');
fs.mkdirSync(output, { recursive: true });
const mime = { ".svg": "image/svg+xml", '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(root, '404.html'); res.statusCode = 404;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let checks = 0;
    const homeMeasurements = [];
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const url of ['/index.html', '/work/affiliate.html', '/work/auth.html', '/work/terms.html', '/work/platform.html', '/work/login.html', '/work/edoc.html', '/work/waf.html', '/work/fluxgate.html', '/resume.html', '/missing-page']) {
        await page.goto(origin + url);
        await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(img => { img.loading = 'eager'; }));
        for (const image of await page.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(img => img.decode());
        }
        const layout = await page.evaluate(() => ({
          width: innerWidth, scroll: document.documentElement.scrollWidth,
          overflow: [...document.querySelectorAll('h1,h2,h3,p,a,button,dt,dd')].filter(el => {
            const r = el.getBoundingClientRect();
            return r.width && (r.right > innerWidth + 1 || r.left < -1);
          }).map(el => el.textContent.slice(0,50)),
          images: [...document.images].every(img => img.complete && img.naturalWidth > 0)
        }));
        assert.equal(layout.scroll, width, `${url}: scroll at ${width}`);
        assert.deepEqual(layout.overflow, [], `${url}: geometry at ${width}`);
        assert(layout.images, `${url}: images loaded`);
        for (const diagram of await page.locator('.diagram-figure > svg').all()) {
          assert(await diagram.evaluate(el => {
            const r = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect();
            return r.left >= parent.left && r.right <= parent.right;
          }), `${url}: diagram clipped inside its container at ${width}`);
        }
        if (url === '/index.html') {
          const home = await page.evaluate(() => {
            const work = document.querySelector('#work');
            return { width: innerWidth, workTop: Math.round(work.getBoundingClientRect().top + scrollY), height: document.documentElement.scrollHeight };
          });
          assert(home.workTop < 900, `projects should appear in the first screen at ${width}`);
          homeMeasurements.push(home);
          assert.equal(await page.locator('.project-card').count(), 3);
          const gaps = await page.locator('.project-card').evaluateAll(cards => cards.map(card =>
            card.querySelector('.project-more').getBoundingClientRect().top - card.querySelector('.tags').getBoundingClientRect().bottom));
          assert(gaps.every(gap => gap < 80), `project card trailing whitespace at ${width}: ${gaps}`);
          if (width === 390) assert(home.height < 6200, 'mobile homepage stays concise');
        }
        if (url === '/resume.html') {
          if (width === 390) assert(await page.evaluate(() => document.documentElement.scrollHeight < 7500), 'collapsed mobile resume stays concise');
          const disclosure = page.locator('.career-details');
          assert(!(await disclosure.evaluate(el => el.open)), 'operational history starts collapsed');
          await disclosure.locator('summary').click();
          assert(await disclosure.evaluate(el => el.open), 'operational history opens');
          const expanded = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth}));
          assert.equal(expanded.scroll, expanded.width, 'expanded history does not overflow');
          await disclosure.locator('summary').click();
        }
        if (url.startsWith('/work/')) {
          const disclosure = page.locator('.implementation-details');
          await disclosure.locator('summary').click();
          assert(await disclosure.evaluate(el => el.open), 'implementation details open');
          assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'expanded implementation fits');
          await disclosure.locator('summary').click();
        }
        checks++;
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const key of ['auth', 'affiliate', 'fluxgate']) {
      await page.goto(`${origin}/work/${key}.html`);
      await page.evaluate(() => document.fonts.ready);
      const diagram = page.locator('.diagram-figure > svg');
      const problems = await diagram.evaluate(svg => {
        const texts = [...svg.querySelectorAll('text')].map(el => ({ text: el.textContent, box: el.getBBox() }));
        const viewport = svg.viewBox.baseVal;
        const errors = [];
        for (const [i, a] of texts.entries()) {
          if (a.box.x < 0 || a.box.y < 0 || a.box.x + a.box.width > viewport.width || a.box.y + a.box.height > viewport.height) errors.push(`outside: ${a.text}`);
          for (const b of texts.slice(i + 1)) {
            const width = Math.min(a.box.x + a.box.width, b.box.x + b.box.width) - Math.max(a.box.x, b.box.x);
            const height = Math.min(a.box.y + a.box.height, b.box.y + b.box.height) - Math.max(a.box.y, b.box.y);
            if (width > 1 && height > 1) errors.push(`overlap: ${a.text} / ${b.text}`);
          }
        }
        return errors;
      });
      assert.deepEqual(problems, [], `${key}: diagram labels`);
      await diagram.screenshot({ path: path.join(output, `diagram-${key}.png`) });
    }
    await page.goto(origin);
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    await page.screenshot({ path: path.join(output, 'desktop-first-screen.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    await page.screenshot({ path: path.join(output, 'mobile-first-screen.png') });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.screenshot({ path: path.join(output, 'narrow-first-screen.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: 'OpenFluxGate', exact: true }).click();
    assert.equal(await page.locator('h1').textContent(), 'OpenFluxGate');
    await page.locator('.diagram-figure svg').click();
    await page.waitForTimeout(100);
    assert(await page.locator('dialog.lightbox').evaluate(d => d.open), 'lightbox opens on diagram click');
    const t0 = await page.locator('.lightbox-content').evaluate(el => el.style.transform);
    await page.mouse.move(190, 500); await page.mouse.down(); await page.mouse.move(250, 540, { steps: 4 }); await page.mouse.up();
    assert.notEqual(await page.locator('.lightbox-content').evaluate(el => el.style.transform), t0, 'drag pans the content');
    const before = parseInt(await page.locator('.lightbox-level').textContent(), 10);
    await page.locator('[data-zoom="+"]').click();
    assert.equal(parseInt(await page.locator('.lightbox-level').textContent(), 10), before + 25, 'zoom + adds 25%');
    await page.locator('[data-zoom="0"]').click();
    assert.equal(await page.locator('.lightbox-level').textContent(), '100%', 'fit resets to the full diagram on mobile');
    assert(await page.locator('.lightbox-content').evaluate(el => {
      const r = el.getBoundingClientRect(), stage = el.parentElement.getBoundingClientRect();
      return r.left >= stage.left && r.right <= stage.right + 1 && r.top >= stage.top && r.bottom <= stage.bottom + 1;
    }), 'fit keeps the whole diagram in the viewer');
    await page.keyboard.press('Escape');
    assert(!(await page.locator('dialog.lightbox').evaluate(d => d.open)), 'lightbox closes on Escape');
    await page.getByRole('link', { name: /← 이전/ }).click();
    assert.equal(await page.locator('h1').textContent(), 'WAF 플랫폼');
    await page.locator('.breadcrumb:visible').first().click();
    assert.equal(new URL(page.url()).hash, '#work');
    await page.getByRole('link', { name: '전체 이력서' }).click();
    await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
    await page.getByRole('button', { name: '인쇄' }).click();
    assert(await page.evaluate(() => window.__printed));
    await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
    assert(await page.locator('.career-details').evaluate(el => el.open), 'printing includes collapsed operational history');
    await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    assert(!(await page.locator('.career-details').evaluate(el => el.open)), 'printing restores collapsed state');
    await page.locator('.career-details summary').click();
    await page.evaluate(() => { dispatchEvent(new Event('beforeprint')); dispatchEvent(new Event('afterprint')); });
    assert(await page.locator('.career-details').evaluate(el => el.open), 'printing preserves already expanded history');
    await page.locator('.career-details summary').click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.pdf({ path: path.join(output, 'public-resume.pdf'), format: 'A4', margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
    const missing = await page.goto(origin + '/missing');
    assert.equal(missing.status(), 404);
    await page.getByRole('link', { name: '홈으로 돌아가기' }).click();
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: '이메일 복사' }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'rojae@kakao.com');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true }); });
    await page.getByRole('button', { name: '이메일 복사' }).click();
    assert.match(await page.locator('.copy-status').textContent(), /선택했습니다/);
    assert.equal(await page.evaluate(() => getSelection().toString()), 'rojae@kakao.com');
    await page.goto(origin);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), '본문으로 이동');
    for (const file of ['index.html', 'resume.html', 'work/affiliate.html', 'work/auth.html', 'work/terms.html', 'work/platform.html', 'work/login.html', 'work/edoc.html', 'work/waf.html', 'work/fluxgate.html']) {
      await page.goto(`${origin}/${file}`);
      const hrefs = await page.locator('a[href]').evaluateAll(links => links.map(a => a.href));
      for (const href of hrefs.filter(h => h.startsWith(origin))) {
        const local = new URL(href).pathname;
        assert(fs.existsSync(path.join(root, local === '/' ? 'index.html' : local)), `${file}: broken link ${href}`);
      }
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage();
    await staticPage.goto(origin);
    assert(await staticPage.getByRole('heading', { name: '대표 프로젝트' }).isVisible());
    await staticPage.goto(origin + '/work/auth.html');
    assert.equal(await staticPage.locator('h1').textContent(), '통합인증 서비스');
    await staticPage.goto('file://' + path.join(root, 'index.html'));
    assert(await staticPage.locator('.avatar').evaluate(img => img.naturalWidth > 0));
    await noJs.close();
    const dark = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 1000 } });
    const darkPage = await dark.newPage();
    await darkPage.goto(origin);
    await darkPage.screenshot({ path: path.join(output, 'desktop-dark-first-screen.png') });
    await dark.close();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ layoutChecks: checks, homeMeasurements, widths: [320,375,390,768,1024,1440], assertions: ['images', 'project navigation', '404 recovery', 'print trigger', 'clipboard success and denial', 'keyboard skip link', 'local links', 'no-JS home', 'file URL assets', 'dark mode screenshot', 'lightbox zoom', 'no page errors'], output }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
