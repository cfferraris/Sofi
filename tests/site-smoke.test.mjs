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
  assert.match(html, /Preparar solicitud por WhatsApp/);
  assert.match(html, /turno queda sujeto a confirmación/i);
});

test('submitted appointment form is actually hidden by the stylesheet', () => {
  assert.match(css, /\.appointment-form\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
});

test('appointment result shows only pending confirmation and free resources', () => {
  assert.ok(html.includes('id="appointmentRequestResult"'));
  assert.match(html, /Ver recursos gratuitos/i);
  assert.doesNotMatch(html, /appointmentWhatsAppLink|appointmentMessagePreview|appointmentCopyButton/);
  assert.match(js, /turno todavía no está confirmado/i);
  assert.match(js, /window\.open\(url, '_blank'/);
  assert.match(js, /https:\/\/wa\.me\/\$\{WHATSAPP_NUMBER\}\?text=\$\{encodeURIComponent\(message\)\}/);
  assert.match(js, /únicamente cuando reciba una respuesta de Piel de Mar por WhatsApp/i);
  assert.doesNotMatch(js, /appointmentMessagePreview|appointmentCopyButton|appointmentWhatsAppLink/);
});

test('appointment selector keeps period and time in the same control', () => {
  assert.match(js, /renderTimeOptions\(timeInput\.value\)/);
  assert.match(js, /renderPeriodOptions\(\)/);
  assert.match(js, /selectedPeriod\.times\.includes\(payload\.time\)/);
  assert.match(html, /<input[^>]*type="hidden"[^>]*id="appointmentPeriod"/);
  assert.match(html, /id="appointmentTime"/);
  assert.doesNotMatch(html, /<label for="appointmentPeriod"/);
  assert.doesNotMatch(html, /id="appointmentTime"[^>]*disabled/);
  assert.match(js, /morning:\s*\{[\s\S]*?'08:00'[\s\S]*?'11:30'/);
  assert.match(js, /afternoon:\s*\{[\s\S]*?'16:00'[\s\S]*?'19:30'/);
});

test('privacy policy exists and describes the WhatsApp flow without claiming database storage', () => {
  assert.ok(existsSync(resolve(root, 'privacidad.html')));
  const privacy = readFileSync(resolve(root, 'privacidad.html'), 'utf8');
  assert.match(privacy, /prepara un mensaje para WhatsApp/i);
  assert.doesNotMatch(privacy, /se registra en una base de datos privada/i);
});

test('primary appointment CTAs route through the validated request form', () => {
  assert.match(html, /href="#consulta"[\s\S]{0,250}class="btn-intro btn-intro-final"/);
  assert.match(html, /href="#consulta"[\s\S]{0,200}class="whatsapp-float"/);
});

test('appointment flow does not call an API or persist personal data', () => {
  assert.doesNotMatch(js, /fetch\s*\(|localStorage|sessionStorage/);
  assert.ok(!js.includes('appointments.json'));
  assert.ok(!existsSync(resolve(root, 'server.js')));
  assert.ok(!existsSync(resolve(root, 'render.yaml')));
});

test('CSP explicitly permits only the script sources used by the page', () => {
  const match = html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([\s\S]*?)"\s*>/i);
  assert.ok(match, 'Missing Content-Security-Policy meta');
  const policy = match[1].replace(/\s+/g, ' ').trim();
  assert.match(policy, /(?:^|; )default-src 'self'(?:;|$)/);
  assert.match(policy, /(?:^|; )script-src 'self' https:\/\/unpkg\.com(?:;|$)/);
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'|script-src[^;]*'unsafe-eval'/);
  assert.match(html, /<script src=["']https:\/\/unpkg\.com\/lucide@0\.468\.0\/dist\/umd\/lucide\.min\.js["'] defer><\/script>/);
  assert.doesNotMatch(html, /lucide@latest/i);
});

test('JSON-LD is valid structured data and remains separate from executable JavaScript', () => {
  const match = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  assert.ok(match, 'Missing JSON-LD structured data block');
  assert.doesNotThrow(() => JSON.parse(match[1]), 'JSON-LD must remain valid JSON');
  assert.doesNotMatch(match[1], /<\/script/i);
});

test('Instagram icon references match the repository filename case', () => {
  const iconPath = resolve(root, 'assets/icons/Instagram.svg');
  assert.ok(existsSync(iconPath), 'Expected assets/icons/Instagram.svg to exist');
  assert.doesNotMatch(html, /assets\/icons\/instagram\.svg/);
  assert.match(html, /assets\/icons\/Instagram\.svg/);
});

test('keyboard focus indicators use a high-contrast dual ring', () => {
  assert.doesNotMatch(css, /outline: [23]px solid var\(--agua\);/);
  assert.equal(
    [...css.matchAll(/outline: 3px solid var\(--profundo\); box-shadow: 0 0 0 2px var\(--arena\);/g)].length,
    3,
    'Global, intro-slider and appointment focus indicators must use the accessible dual ring'
  );
});

test('inactive slider and carousel dots have solid high-contrast boundaries', () => {
  assert.doesNotMatch(css, /background:\s*rgba\(5,\s*73,\s*84,\s*0\.25\)/);
  assert.doesNotMatch(css, /background:\s*rgba\(148,\s*209,\s*216,\s*0\.4\)/);
  assert.equal([...css.matchAll(/border: 2px solid var\(--profundo\);/g)].length, 2,
    'Both sets of inactive interactive indicators must have a solid dark boundary');
});

test('navigation and carousel controls use native semantics', () => {
  assert.doesNotMatch(html, /role=["'](?:menubar|menuitem|none|tablist|tab)["']/);
  assert.equal([...js.matchAll(/setAttribute\('aria-pressed'/g)].length, 8,
    'Carousel indicators and pause/resume controls must expose their pressed state');
  assert.doesNotMatch(js, /setAttribute\('role', 'tab'\)|aria-selected/);
});
