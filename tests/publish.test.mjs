import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePublish, parseStatus } from '../tools/publish.mjs';

const valid = { branch: 'main', remote: 'https://github.com/rojae/rojae.kr.git', files: ['style.css'], staged: false, playwright: true, args: [] };
test('publishing requires verification, PDF generation, the expected branch and remote', () => {
  assert.doesNotThrow(() => validatePublish(valid));
  for (const override of [{ playwright: false }, { branch: 'draft' }, { remote: 'https://github.com/other/repo.git' }, { args: ['--no-verify'] }, { args: ['--no-pdf'] }]) {
    assert.throws(() => validatePublish({ ...valid, ...override }));
  }
});
test('publishing cannot include unrelated or already staged files', () => {
  for (const override of [{ files: ['notes/private.md'] }, { files: ['assets/token.json'] }, { staged: true }]) {
    assert.throws(() => validatePublish({ ...valid, ...override }));
  }
});
test('publishing accepts the design contract and print regression tests', () => {
  assert.doesNotThrow(() => validatePublish({ ...valid, files: ['DESIGN.md', 'tests/print.test.mjs'] }));
});
test('publishing accepts only the submodule reference, never nested source or private data', () => {
  assert.doesNotThrow(() => validatePublish({ ...valid, files: ['.gitmodules', 'resume-builder', 'tests/submodule.test.mjs'] }));
  for (const file of ['resume-builder/data/base.json', 'resume-builder/templates/compact.mjs']) {
    assert.throws(() => validatePublish({ ...valid, files: [file] }));
  }
});
test('explicit local-only mode may skip expensive checks', () => {
  assert.doesNotThrow(() => validatePublish({ ...valid, playwright: false, args: ['--no-push', '--no-verify', '--no-pdf'] }));
});
test('NUL-delimited git paths retain spaces and staged state; renames fail closed', () => {
  assert.deepEqual(parseStatus(' M style.css\0?? notes/my draft.md\0'), { files: ['style.css', 'notes/my draft.md'], staged: false });
  assert.equal(parseStatus('M  style.css\0').staged, true);
  assert.throws(() => parseStatus('R  new.html\0old.html\0'));
});
