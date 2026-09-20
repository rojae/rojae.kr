// Build and verify before committing only the reviewed public-site file set.
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowed = new Set([
  'index.html', 'resume.html', '404.html', 'style.css', 'script.js', 'resume.pdf',
  'README.md', '.gitignore', '.nojekyll', 'CNAME', 'verify.cjs',
  ...['affiliate', 'auth', 'terms', 'platform', 'login', 'edoc', 'waf', 'fluxgate'].map(k => `work/${k}.html`),
  ...['compact', 'simple', 'modern', 'classic'].map(k => `resume/${k}.pdf`),
  ...['avatar.png', 'fluxgate-repository.png', 'mark.svg'].map(k => `assets/${k}`),
  ...['content.mjs', 'build.mjs', 'diagrams.mjs', 'logo.mjs', 'make-logo.py', 'make-resume-pdf.mjs', 'resume-print.css', 'publish.mjs'].map(k => `tools/${k}`),
  'tests/content.test.mjs', 'tests/publish.test.mjs',
]);

export function parseStatus(raw) {
  const files = [];
  let staged = false;
  for (const row of raw.split('\0').filter(Boolean)) {
    const state = row.slice(0, 2);
    if (/[RCU]/.test(state) || state === 'AA' || state === 'DD') throw new Error('Resolve renames or conflicts before publishing.');
    staged ||= state[0] !== ' ' && state[0] !== '?';
    files.push(row.slice(3));
  }
  return { files, staged };
}

export function validatePublish({ branch, remote, files, staged, playwright, args }) {
  if (branch !== 'main') throw new Error('Publish must run on main.');
  if (!['https://github.com/rojae/rojae.kr.git', 'git@github.com:rojae/rojae.kr.git'].includes(remote)) throw new Error('Unexpected origin remote.');
  if (staged) throw new Error('Existing staged changes found. Review or commit them separately.');
  const unrelated = files.filter(file => !allowed.has(file));
  if (unrelated.length) throw new Error(`Files outside the public-site allowlist: ${unrelated.join(', ')}`);
  if (!args.includes('--no-push') && (args.includes('--no-verify') || args.includes('--no-pdf'))) throw new Error('Skipping PDF generation or verification is local-only (--no-push).');
  if (!args.includes('--no-verify') && !playwright) throw new Error('Playwright unavailable. Set PLAYWRIGHT_MODULE; publication has stopped.');
}

function findPlaywright() {
  const require = createRequire(import.meta.url);
  const home = process.env.HOME || '';
  const candidates = process.env.PLAYWRIGHT_MODULE ? [process.env.PLAYWRIGHT_MODULE] : [
    'playwright', path.join(home, '.agents/skills/gstack/node_modules/playwright'),
  ];
  if (!process.env.PLAYWRIGHT_MODULE) {
    const cache = path.join(home, '.npm/_npx');
    if (fs.existsSync(cache)) for (const dir of fs.readdirSync(cache)) candidates.push(path.join(cache, dir, 'node_modules/playwright'));
  }
  for (const candidate of candidates) {
    try { if (require(candidate).chromium) return candidate; } catch { /* Try the next existing installation. */ }
  }
  return null;
}

function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`node tools/publish.mjs [-m "변경 이유"] [--no-push] [--no-pdf] [--no-verify]

HTML → PDF 4종 → 회귀·브라우저 검증 → 지정 파일 커밋 → origin/main 푸시
--no-push: 로컬 커밋까지만 수행. --no-pdf, --no-verify는 이 모드에서만 허용.
main 브랜치, 지정 origin, 비어 있는 스테이징 영역이 필요합니다.
검증 도구가 없거나 공개 파일 목록 밖의 변경이 있으면 중단합니다.
PLAYWRIGHT_MODULE로 기존 Playwright 설치 경로를 지정할 수 있습니다.`);
    return;
  }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-m') {
      if (!args[++i] || args[i].startsWith('--')) throw new Error('-m requires a message.');
    } else if (!['--no-push', '--no-pdf', '--no-verify'].includes(args[i])) throw new Error(`Unknown argument: ${args[i]}`);
  }
  const git = (...argv) => execFileSync('git', argv, { cwd: root, encoding: 'utf8' });
  const run = (command, argv, env = process.env) => {
    const result = spawnSync(command, argv, { cwd: root, env, stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`${command} ${argv.join(' ')} failed (${result.error?.message || result.status}).`);
  };
  const playwright = findPlaywright();
  const preflight = () => {
    const state = parseStatus(git('status', '--porcelain=v1', '-z', '--untracked-files=all'));
    validatePublish({ ...state, branch: git('branch', '--show-current').trim(), remote: git('remote', 'get-url', 'origin').trim(), playwright, args });
    return state.files;
  };
  preflight();
  run(process.execPath, ['tools/build.mjs']);
  if (!args.includes('--no-pdf')) run(process.execPath, ['tools/make-resume-pdf.mjs']);
  run(process.execPath, ['--test', 'tests/content.test.mjs', 'tests/publish.test.mjs']);
  if (!args.includes('--no-verify')) run(process.execPath, ['verify.cjs'], { ...process.env, PLAYWRIGHT_MODULE: playwright });
  const files = preflight();
  if (files.length) {
    const index = args.indexOf('-m');
    const message = index >= 0 ? args[index + 1] : 'Keep the public profile and resume consistent';
    const checks = args.includes('--no-verify') ? 'content and publication unit tests; browser checks skipped' : 'content and publication unit tests; Playwright responsive checks';
    run('git', ['add', '--', ...files]);
    run('git', ['commit', '-m', `${message}\n\nTested: ${checks}\nScope-risk: narrow\nDirective: Publish only after content and PDF verification`]);
  }
  if (!args.includes('--no-push')) {
    // A clean tree may still contain previously verified, unpushed commits.
    run('git', ['push', 'origin', 'HEAD:refs/heads/main']);
    console.log('Pushed. Check GitHub Pages deployment before claiming rojae.kr is updated.');
  } else console.log('Local-only run completed; nothing was pushed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
