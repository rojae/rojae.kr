import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { validateResumeBuilder } from '../tools/publish.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-submodule-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('publishing requires a clean, initialized Git submodule from the expected repository', t => {
  const root = fixture(t);
  const source = path.join(root, 'source');
  const site = path.join(root, 'site');
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  fs.mkdirSync(source);
  fs.mkdirSync(site);
  git(source, 'init', '-b', 'main');
  fs.writeFileSync(path.join(source, 'template.mjs'), 'export const name = "example";\n');
  git(source, 'add', 'template.mjs');
  git(source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Provide an isolated submodule fixture');
  git(site, 'init', '-b', 'main');
  assert.throws(() => validateResumeBuilder(site), /submodule/i);
  git(site, '-c', 'protocol.file.allow=always', 'submodule', 'add', source, 'resume-builder');
  assert.throws(() => validateResumeBuilder(site), /repository/i);
  git(site, 'config', '-f', '.gitmodules', 'submodule.resume-builder.url', 'https://github.com/rojae/resume-builder.git');
  assert.doesNotThrow(() => validateResumeBuilder(site));
  const builder = path.join(site, 'resume-builder');
  fs.writeFileSync(path.join(builder, 'uncommitted.txt'), 'not included in the pinned commit');
  assert.throws(() => validateResumeBuilder(site), /uncommitted/i);
  fs.unlinkSync(path.join(builder, 'uncommitted.txt'));
  fs.appendFileSync(path.join(builder, 'template.mjs'), '// dirty\n');
  assert.throws(() => validateResumeBuilder(site), /uncommitted/i);
  fs.renameSync(path.join(builder, '.git'), path.join(builder, '.git-disabled'));
  assert.throws(() => validateResumeBuilder(site), /initialize/i);
});

test('PDF generation explains missing submodule and dependencies without using a sibling folder', t => {
  const root = fixture(t);
  const site = path.join(root, 'site');
  fs.mkdirSync(path.join(site, 'tools'), { recursive: true });
  for (const file of ['make-resume-pdf.mjs', 'content.mjs']) {
    fs.copyFileSync(new URL(`../tools/${file}`, import.meta.url), path.join(site, 'tools', file));
  }
  // A sibling builder must not satisfy the site's dependency.
  fs.mkdirSync(path.join(root, 'resume-builder'));
  fs.writeFileSync(path.join(root, 'resume-builder/package.json'), '{}');
  const run = () => spawnSync(process.execPath, ['tools/make-resume-pdf.mjs'], { cwd: site, encoding: 'utf8' });
  let result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /git submodule update --init --recursive/);
  fs.mkdirSync(path.join(site, 'resume-builder'));
  fs.writeFileSync(path.join(site, 'resume-builder/package.json'), '{}');
  result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /npm ci --prefix resume-builder/);
  assert.equal(fs.existsSync(path.join(site, 'output')), false);
});
