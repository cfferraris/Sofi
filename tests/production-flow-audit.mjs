import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const targetUrl = process.env.PRODUCTION_URL || 'https://sofi-ywgo.onrender.com/';
const maxAttempts = 18;
const retryDelayMs = 5000;
const report = {
  generatedAt: new Date().toISOString(),
  url: targetUrl,
  auditedBranchSha: process.env.GITHUB_SHA || null,
  mode: 'production browser simulation; window.open is intercepted; no WhatsApp message is sent',
  attempts: 0,
  assets: {},
  securityHeaders: null,
  formFlow: null,
  result: 'FAIL',
  error: null
};
let browser;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

try {
  browser = await chromium.launch({ headless: true });
  const localCss = await readFile(resolve('css/styles.css'));
  const localJs = await readFile(resolve('js/main.js'));
  let verified = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    report.attempts = attempt;
    const context = await browser.newContext({
      viewport: { width: 1365, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__pdmWhatsAppUrl = null;
      window.open = (url) => {
        window.__pdmWhatsAppUrl = String(url);
        return { closed: false };
      };
    });

    let assetsMatch = false;
    try {
      const response = await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 25000
      });
      assert.ok(response && response.status() === 200, 'Published site must return HTTP 200');
      const responseHeaders = response.headers();
      const requiredHeaders = {
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-frame-options': 'DENY',
        'x-robots-tag': 'noindex, follow'
      };
      for (const [name, expected] of Object.entries(requiredHeaders)) {
        assert.equal((responseHeaders[name] || '').toLowerCase(), expected.toLowerCase(), `Missing or incorrect staging header: ${name}`);
      }
      const permissionsPolicy = (responseHeaders['permissions-policy'] || '').replace(/\\s/g, '');
      assert.equal(permissionsPolicy, 'camera=(),microphone=(),geolocation=()', 'Missing or incorrect staging Permissions-Policy');
      assert.ok(responseHeaders['strict-transport-security'], 'Strict-Transport-Security must be present');
      assert.equal((responseHeaders['x-content-type-options'] || '').toLowerCase(), 'nosniff', 'X-Content-Type-Options must be nosniff');
      report.securityHeaders = {
        'referrer-policy': responseHeaders['referrer-policy'],
        'x-frame-options': responseHeaders['x-frame-options'],
        'permissions-policy': responseHeaders['permissions-policy'],
        'x-robots-tag': responseHeaders['x-robots-tag'],
        'strict-transport-security': responseHeaders['strict-transport-security'],
        'x-content-type-options': responseHeaders['x-content-type-options'],
        cspHttpHeaderPresent: Boolean(responseHeaders['content-security-policy']),
        checkedAt: new Date().toISOString()
      };

      const cssUrl = new URL('css/styles.css', targetUrl);
      cssUrl.searchParams.set('audit', String(attempt));
      const jsUrl = new URL('js/main.js', targetUrl);
      jsUrl.searchParams.set('audit', String(attempt));
      const [cssResponse, jsResponse] = await Promise.all([
        context.request.get(cssUrl.toString(), { timeout: 15000 }),
        context.request.get(jsUrl.toString(), { timeout: 15000 })
      ]);
      const [publishedCss, publishedJs] = await Promise.all([
        cssResponse.body(),
        jsResponse.body()
      ]);
      report.assets = {
        cssStatus: cssResponse.status(),
        jsStatus: jsResponse.status(),
        cssSha256Published: sha256(publishedCss),
        cssSha256Branch: sha256(localCss),
        cssMatchesBranch: publishedCss.equals(localCss),
        jsSha256Published: sha256(publishedJs),
        jsSha256Branch: sha256(localJs),
        jsMatchesBranch: publishedJs.equals(localJs)
      };
      assetsMatch = cssResponse.status() === 200 && jsResponse.status() === 200
        && report.assets.cssMatchesBranch && report.assets.jsMatchesBranch;

      if (assetsMatch) {
        const heroVisible = await page.locator('#hero').evaluate((hero) => getComputedStyle(hero).display !== 'none');
        if (heroVisible) {
          await page.locator('#hero').click({ position: { x: 3, y: 3 } });
        }
        await page.waitForFunction(() => {
          const hero = document.querySelector('#hero');
          return !hero || getComputedStyle(hero).display === 'none';
        }, { timeout: 10000 });

        const form = page.locator('#appointmentRequestForm');
        await page.locator('#appointmentName').fill('Prueba QA');
        await page.locator('#appointmentInsurance').fill('Particular');
        await page.locator('#appointmentReason').fill('Consulta automatizada de producción');
        const minDate = await page.locator('#appointmentDate').getAttribute('min');
        assert.ok(minDate, 'Appointment date must have a minimum');
        await page.locator('#appointmentDate').fill(minDate);
        await page.locator('#appointmentConsent').check();
        const time = page.locator('#appointmentTime');
        await time.selectOption('morning');
        const expectedMorning = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
        for (const slot of expectedMorning) {
          assert.equal(await time.locator(`option[value="${slot}"]`).count(), 1, `Missing morning slot ${slot}`);
        }
        await time.selectOption('09:00');
        await page.locator('.appointment-submit').click();
        await page.locator('#appointmentRequestResult').waitFor({ state: 'visible', timeout: 5000 });
        assert.equal(await form.isHidden(), true, 'Submitted form and WhatsApp button must be hidden');
        assert.equal(await page.locator('.appointment-submit:visible').count(), 0, 'Submit button must not remain visible');
        assert.equal(await page.locator('#appointmentRequestResult a[href="recursos.html"]').count(), 1, 'Free resources link must remain available');

        const opened = await page.evaluate(() => window.__pdmWhatsAppUrl);
        assert.ok(opened, 'WhatsApp URL must be opened by the form flow');
        const url = new URL(opened);
        assert.equal(url.hostname, 'wa.me');
        assert.equal(url.pathname, '/5493425004018');
        assert.match(url.searchParams.get('text') || '', /Nombre: Prueba QA/);

        report.formFlow = {
          formHiddenAfterSubmission: await form.isHidden(),
          submitButtonVisibleAfterSubmission: await page.locator('.appointment-submit:visible').count() > 0,
          freeResourcesLinkPresent: await page.locator('#appointmentRequestResult a[href="#recursos"]').count() === 1,
          whatsappTargetVerified: url.hostname === 'wa.me' && url.pathname === '/5493425004018',
          whatsappMessageIntercepted: true,
          realMessageSent: false,
          testedMorningSlots: expectedMorning
        };
        report.result = 'PASS';
        verified = true;
      }
    } catch (error) {
      if (assetsMatch) {
        report.error = String(error);
        throw error;
      }
      report.error = `Waiting for Render to publish the audited CSS/JS: ${String(error)}`;
    } finally {
      await context.close();
    }

    if (verified) break;
    if (attempt < maxAttempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelayMs));
  }

  assert.ok(verified, report.error || 'Published CSS/JS did not match the audited branch after waiting for deployment.');
} catch (error) {
  report.result = 'FAIL';
  report.error = String(error);
} finally {
  if (browser) await browser.close();
  await mkdir('artifacts', { recursive: true });
  await writeFile(resolve('artifacts', 'production-flow-audit.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

if (report.result !== 'PASS') process.exitCode = 1;
