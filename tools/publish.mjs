// node tools/publish.mjs [-m "커밋 메시지"] [--no-pdf] [--no-verify] [--no-push]
// 문구 수정 후 이 한 번으로: HTML 생성 → 이력서 PDF 4종 생성 → 레이아웃 검증 → 커밋 → 푸시(rojae.kr 반영)
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const HELP = `
rojae.kr 사용법
────────────────────────────────────────────────────────────
문구 고치기      tools/content.mjs  (프로필 · 프로젝트 · 경력 · 오픈소스 · 글 · 이력서 요약)
다이어그램       tools/diagrams.mjs (프로젝트별 SVG)
디자인           style.css
로고 바꾸기      python3 tools/make-logo.py "Caveat" 700   (서체 이름, 굵기)  → 이어서 publish

한 번에 반영     node tools/publish.mjs -m "무엇을 바꿨는지"
                 = build → pdf → verify → commit → push  (1~2분 뒤 https://rojae.kr 반영)

따로 실행        node tools/build.mjs            HTML만 생성
                 node tools/make-resume-pdf.mjs  이력서 PDF 4종 (resume.pdf + resume/*.pdf)
                 PLAYWRIGHT_MODULE=<playwright 경로> node verify.cjs   레이아웃 · 링크 검증

옵션             --no-pdf     PDF 생성 건너뛰기
                 --no-verify  검증 건너뛰기
                 --no-push    커밋까지만 (푸시 안 함)
                 -m "메시지"  커밋 메시지 (기본: "Update site")

전제             ../resume-builder 에 npm install 되어 있어야 PDF 생성 가능
                 검증은 PLAYWRIGHT_MODULE 환경변수가 없으면 자동으로 찾아봅니다
────────────────────────────────────────────────────────────`;
if (flag('--help') || flag('-h')) { console.log(HELP); process.exit(0); }

const run = (label, cmd, cmdArgs, opts = {}) => {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit', ...opts });
  if (r.status !== 0) { console.error(`✗ ${label} 실패`); process.exit(r.status || 1); }
};

run('HTML 생성', 'node', ['tools/build.mjs']);
if (!flag('--no-pdf')) run('이력서 PDF 4종 생성', 'node', ['tools/make-resume-pdf.mjs']);
if (!flag('--no-verify')) {
  let mod = process.env.PLAYWRIGHT_MODULE;
  if (!mod) {
    const candidates = ['/Users/jaeseoh/.npm/_npx', path.join(process.env.HOME || '', '.npm/_npx')];
    for (const base of candidates) {
      if (!fs.existsSync(base)) continue;
      for (const d of fs.readdirSync(base)) {
        const p = path.join(base, d, 'node_modules', 'playwright');
        if (fs.existsSync(p)) { mod = p; break; }
      }
      if (mod) break;
    }
  }
  if (mod) run('레이아웃 · 링크 검증', 'node', ['verify.cjs'], { env: { ...process.env, PLAYWRIGHT_MODULE: mod } });
  else console.log('\n⚠ playwright를 찾지 못해 검증을 건너뜁니다 (PLAYWRIGHT_MODULE 지정 가능)');
}
const mi = args.indexOf('-m');
const msg = mi >= 0 && args[mi + 1] ? args[mi + 1] : 'Update site';
const status = execFileSync('git', ['status', '--porcelain'], { cwd: root }).toString().trim();
if (!status) { console.log('\n변경 사항이 없습니다.'); process.exit(0); }
run('커밋', 'git', ['add', '-A']);
run('커밋', 'git', ['-c', 'user.name=rojae', '-c', 'user.email=rojae@kakao.com', 'commit', '-q', '-m', msg]);
if (!flag('--no-push')) { run('푸시', 'git', ['push', '-q', 'origin', 'main']); console.log('\n✓ 푸시 완료 — 1~2분 뒤 https://rojae.kr 에 반영됩니다.'); }
else console.log('\n✓ 커밋 완료 (푸시는 하지 않음)');
