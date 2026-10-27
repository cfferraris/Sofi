import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const targetUrl = process.env.PRODUCTION_URL || 'https://sofi-ywgo.onrender.com/';
const report = {
  generatedAt: new Date().toISOString(),
  url: targetUrl,
  mode: 'read-only; no form submission and no WhatsApp message sending',
  overall: 'BLOCKED',
  mainDocument: null,
  page: { title: null, metaCsp: null },
  redirectChain: [],
  securityHeaders: {},
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  resourceFailures: [],
  cspViolations: [],
  jsonLd: { present: false, valid: false, error: null },
  icons: { lucideScriptResponse: null, inlineLucidePlaceholders: null, renderedLucideSvgCount: null },
  images: { total: null, loaded: null, failed: null },
  fonts: { status: null, fahkwangAvailable: null },
  limitation: null
};

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const entry = { type: message.type(), text: message.text() };
      report.consoleErrors.push(entry);
      if (/content security policy|violat(?:es|ion).*csp|refused to/i.test(message.text())) {
        report.cspViolations.push(entry);
      }
    }
  });
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    report.failedRequests.push({
      url: request.url(),
      resourceType: request.resourceType(),
      error: request.failure()?.errorText || 'Unknown request failure'
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && response.request().resourceType() !== 'document') {
      report.resourceFailures.push({
        url: response.url(),
        status: response.status(),
        resourceType: response.request().resourceType()
      });
    }
    if (/unpkg\.com\/lucide@0\.468\.0\/dist\/umd\/lucide\.min\.js/.test(response.url())) {
      report.icons.lucideScriptResponse = { url: response.url(), status: response.status() };
    }
  });

  try {
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (response) {
      report.mainDocument = {
        status: response.status(),
        finalUrl: response.url(),
        contentType: response.headers()['content-type'] || null
      };
      const requestChain = [];
      let request = response.request();
      while (request) {
        requestChain.push(request.url());
        request = request.redirectedFrom();
      }
      report.redirectChain = requestChain.reverse();
      const headers = response.headers();
      for (const name of [
        'content-security-policy',
        'x-content-type-options',
        'referrer-policy',
        'strict-transport-security',
        'x-frame-options',
        'permissions-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy'
      ]) {
        report.securityHeaders[name] = headers[name] || null;
      }

      await page.waitForTimeout(1200);
      report.page = await page.evaluate(() => ({
        title: document.title,
        metaCsp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || null
      }));
      report.jsonLd = await page.evaluate(() => {
        const element = document.querySelector('script[type="application/ld+json"]');
        if (!element) return { present: false, valid: false, error: 'JSON-LD block not found' };
        try {
          const data = JSON.parse(element.textContent || '');
          return {
            present: true,
            valid: Boolean(data && typeof data === 'object' && data['@context'] && data['@type'] && data.name),
            type: data['@type'] || null,
            name: data.name || null,
            error: null
          };
        } catch (error) {
          return { present: true, valid: false, error: String(error) };
        }
      });
      report.icons.inlineLucidePlaceholders = await page.locator('i[data-lucide]').count();
      report.icons.renderedLucideSvgCount = await page.locator('svg.lucide').count();
      report.images = await page.locator('img').evaluateAll((images) => ({
        total: images.length,
        loaded: images.filter((image) => image.complete && image.naturalWidth > 0).length,
        failed: images.filter((image) => image.complete && image.naturalWidth === 0).length
      }));
      report.fonts = await page.evaluate(() => ({
        status: document.fonts.status,
        fahkwangAvailable: document.fonts.check('16px Fahkwang')
      }));
      report.overall = response.status() >= 400
        || report.pageErrors.length
        || report.cspViolations.length
        || report.failedRequests.length
        || report.resourceFailures.length
        || (report.icons.lucideScriptResponse && report.icons.lucideScriptResponse.status !== 200)
        || report.icons.inlineLucidePlaceholders > 0
        ? 'REVIEW'
        : 'OBSERVED';
    } else {
      report.limitation = 'Browser navigation returned no main-document response.';
    }
  } catch (error) {
    report.limitation = String(error);
  } finally {
    await page.close();
  }
} catch (error) {
  report.limitation = `Browser audit could not start: ${String(error)}`;
} finally {
  if (browser) await browser.close();
  await mkdir('artifacts', { recursive: true });
  await writeFile(resolve('artifacts', 'production-audit.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
