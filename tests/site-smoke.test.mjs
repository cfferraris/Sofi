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

test('autoplay pauses while either carousel is hovered or keyboard-focused', () => {
  assert.match(js, /carouselRegion\?\.addEventListener\('focusin', stopAutoPlay\)/);
  assert.match(js, /introRegion\?\.addEventListener\('focusin', stopIntroAutoPlay\)/);
  assert.match(js, /reducedMotion \|\| document\.hidden/g);
});

test('intro slider keyboard navigation is scoped to its section', () => {
  assert.match(js, /introRegion\?\.addEventListener\('keydown'/);
  assert.doesNotMatch(js, /document\.addEventListener\('keydown', \(e\) => \{\s*\/\/ Solo responder si el slider está en viewport/);
});


test('appointment request form collects required fields and explains manual confirmation', () => {
  assert.ok(html.includes('id="appointmentRequestForm"'));
  for (const id of ['appointmentName', 'appointmentInsurance', 'appointmentReason', 'appointmentDate', 'appointmentTime', 'appointmentConsent']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing appointment field: ' + id);
  }
  assert.match(html, /turno no queda confirmado/i);
  assert.match(html, /Este sitio no los guarda/i);
});

test('appointment requests encode the message and provide WhatsApp and copy fallbacks', () => {
  assert.match(js, /const WHATSAPP_NUMBER = ['"]5493425004018['"]/);
  assert.match(js, /encodeURIComponent\(preparedMessage\)/);
  assert.match(js, /window\.open\(whatsappLink\.href, ['"]_blank['"]/);
  assert.match(html, /Continuar a WhatsApp/);
  assert.match(html, /Copiar mensaje/);
});

test('appointment form does not persist personal data or use stale appointment JSON', () => {
  assert.doesNotMatch(js, /localStorage|sessionStorage|sendBeacon/);
  assert.doesNotMatch(js, /appointments\.json/);
  assert.match(js, /America\/Argentina\/Buenos_Aires/);
});

test('appointment form requires acknowledgement and rejects past dates', () => {
  assert.match(html, /id="appointmentConsent"[^>]*required/);
  assert.match(js, /date < localDateString\(\)/);
  assert.match(html, /sujetos a confirmación/i);
  assert.doesNotMatch(html, /horarios disponibles en tiempo real/i);
});
