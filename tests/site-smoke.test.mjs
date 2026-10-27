import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(root, 'index.html');
const jsPath = resolve(root, 'js/main.js');
const cssPath = resolve(root, 'css/styles.css');

const html = readFileSync(htmlPath, 'utf8');
const js = readFileSync(jsPath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

test('all local HTML src/href assets resolve with exact case', () => {
  const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((ref) => ref && !/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(ref));

  const missing = refs.filter((ref) => !existsSync(resolve(root, decodeURIComponent(ref.split(/[?#]/)[0]))));
  assert.deepEqual([...new Set(missing)], [], `Missing local HTML references: ${[...new Set(missing)].join(', ')}`);
});

test('all local CSS url() assets resolve with exact case', () => {
  const refs = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
    .map((match) => match[1].trim())
    .filter((ref) => ref && !/^(?:https?:|data:|#)/i.test(ref));

  const missing = refs.filter((ref) => !existsSync(resolve(dirname(cssPath), decodeURIComponent(ref.split(/[?#]/)[0]))));
  assert.deepEqual([...new Set(missing)], [], `Missing local CSS references: ${[...new Set(missing)].join(', ')}`);
});

test('HTML ids are unique and internal links have targets', () => {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const idSet = new Set(ids);
  const targets = [...html.matchAll(/href=["']#([^"']+)["']/g)].map((match) => match[1]);
  const missingTargets = targets.filter((target) => !idSet.has(target));

  assert.deepEqual([...new Set(duplicates)], [], `Duplicate ids: ${[...new Set(duplicates)].join(', ')}`);
  assert.deepEqual([...new Set(missingTargets)], [], `Missing anchor targets: ${[...new Set(missingTargets)].join(', ')}`);
});

test('intro slider controls target the intro slider, not the testimonials carousel', () => {
  assert.match(js, /introNextBtn\.disabled\s*=\s*introCurrentIndex\s*>=\s*introSlides\.length\s*-\s*1/);
  assert.doesNotMatch(js, /nextBtn\.disabled\s*=\s*introCurrentIndex/);
});

test('footer year is initialized by the external script allowed by CSP', () => {
  assert.match(html, /id=["']currentYear["']/);
  assert.match(js, /currentYear\.textContent\s*=\s*String\(new Date\(\)\.getFullYear\(\)\)/);
  assert.doesNotMatch(html, /<script>\s*window\.addEventListener\(['"]load['"]/);
});

test('referenced local icon path matches the versioned filename case', () => {
  assert.ok(existsSync(resolve(root, 'assets/icons/Instagram.svg')));
  assert.doesNotMatch(html, /assets\/icons\/instagram\.svg/);
});
