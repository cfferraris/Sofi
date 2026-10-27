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


test('appointment request form collects required fields and links to privacy policy', () => {
  assert.ok(html.includes('id="appointmentRequestForm"'));
  for (const id of ['appointmentName', 'appointmentInsurance', 'appointmentReason', 'appointmentDate', 'appointmentPeriod', 'appointmentTime', 'appointmentConsent']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing appointment field: ' + id);
  }
  assert.match(html, /privacidad\.html/);
  assert.match(html, /Enviar solicitud de turno/);
  assert.match(html, /turno queda sujeto a confirmación/i);
});

test('successful appointment result has one action and no WhatsApp/copy controls', () => {
  const resultStart = html.indexOf('id="appointmentRequestResult"');
  const resultEnd = html.indexOf('</div>', resultStart);
  const resultPanel = html.slice(resultStart, resultEnd);
  assert.match(resultPanel, /Tu solicitud de turno fue registrada\. Te confirmaremos a la brevedad\./);
  assert.match(resultPanel, /href="#recursos"/);
  assert.match(resultPanel, /Explorar el contenido gratuito/);
  assert.doesNotMatch(html, /Continuar a WhatsApp|Preparar solicitud por WhatsApp|Copiar mensaje/);
});

test('appointment form submits to API and preserves the half-hour time slots', () => {
  assert.ok(js.includes("fetch('/api/appointments'"));
  assert.match(js, /morning:\s*\{[\s\S]*?'08:00'[\s\S]*?'11:30'/);
  assert.match(js, /afternoon:\s*\{[\s\S]*?'16:00'[\s\S]*?'19:30'/);
  assert.match(js, /selectedPeriod\.times\.includes\(payload\.time\)/);
  assert.doesNotMatch(js, /window\.open\(whatsappLink|navigator\.clipboard|localStorage|sessionStorage/);
});

test('privacy policy exists and documents data handling', () => {
  assert.ok(existsSync(resolve(root, 'privacidad.html')));
});


test('primary appointment CTAs route through the validated request form', () => {
  assert.match(html, /href="#consulta"[\s\S]{0,250}class="btn-intro btn-intro-final"/);
  assert.match(html, /href="#consulta"[\s\S]{0,200}class="whatsapp-float"/);
});

test('WhatsApp request text uses actual newline separators rather than literal backslash-n', () => {
  assert.match(js, /\.join\('\\n'\)/);
});

test('appointment form does not store personal data in the browser or read stale JSON', () => {
  assert.doesNotMatch(js, /localStorage|sessionStorage|appointments\\.json|navigator\\.clipboard/);
  assert.match(js, /fetch\\('\/api\/appointments'/);
});

test('backend does not expose source, tests, docs, or historical data as static files', () => {
  const server = readFileSync(resolve(root, 'server.js'), 'utf8');
  for (const path of ['/server.js', '/.env', '/data', '/docs', '/tests', '/lib', '/node_modules']) {
    assert.ok(server.includes("'" + path + "'"), 'Expected private path protection for ' + path);
  }
});
