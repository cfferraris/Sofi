import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp'
};

let server;
let baseURL;

before(async () => {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const requested = pathname === '/' ? '/index.html' : pathname;
      const filePath = resolve(root, `.${requested}`);
      if (filePath !== root && !filePath.startsWith(root + sep)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const info = await stat(filePath);
      if (!info.isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store'
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolveClose) => server.close(resolveClose));
});

test('appointment flow works on desktop and mobile without sending WhatsApp messages', async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];

  try {
    for (const viewport of [
      { name: 'desktop', width: 1365, height: 900 },
      { name: 'mobile', width: 390, height: 844 }
    ]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: 'reduce'
      });
      page.on('pageerror', (error) => failures.push(`${viewport.name}: ${error.message}`));
      await page.addInitScript(() => {
        window.__openedWhatsAppUrl = null;
        window.open = (url) => {
          window.__openedWhatsAppUrl = String(url);
          return { closed: false };
        };
      });

      const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200, `${viewport.name}: homepage must respond with HTTP 200`);

      const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
      assert.doesNotThrow(() => JSON.parse(jsonLd || ''), 'JSON-LD must parse in browser');

      assert.equal(await page.locator('[role="menubar"], [role="menuitem"], [role="tablist"], [role="tab"]').count(), 0,
        'Site navigation and carousel indicators must use native semantics');

      await page.locator('#hero').click({ position: { x: 3, y: 3 } });
      await page.waitForFunction(() => {
        const hero = document.querySelector('#hero');
        return hero && getComputedStyle(hero).display === 'none';
      });

      if (viewport.name === 'mobile') {
        const menu = page.locator('#menuToggle');
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await page.locator('#navMenu a[href="#recursos"]').click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      }

      const form = page.locator('#appointmentRequestForm');
      assert.equal(await form.evaluate((element) => element.checkValidity()), false,
        `${viewport.name}: required fields must be validated`);

      await page.locator('#appointmentName').fill('Prueba QA');
      await page.locator('#appointmentInsurance').fill('Particular');
      await page.locator('#appointmentReason').fill('Consulta de prueba automatizada');
      const date = await page.locator('#appointmentDate').getAttribute('min');
      assert.ok(date, 'Date input must have a minimum date');
      await page.locator('#appointmentDate').fill(date);
      await page.locator('#appointmentConsent').check();

      const time = page.locator('#appointmentTime');
      await time.selectOption('morning');
      await time.locator('option[value="08:00"]').waitFor();
      await time.selectOption('08:00');
      await time.selectOption('__change-period__');
      await time.selectOption('afternoon');
      assert.equal(await time.locator('option[value="08:00"]').count(), 0,
        'Changing period must remove incompatible morning times');
      await time.selectOption('16:00');

      await page.locator('.appointment-submit').click();
      await page.locator('#appointmentRequestResult').waitFor({ state: 'visible' });

      const status = await page.locator('#appointmentRequestStatus').innerText();
      assert.match(status, /todavía no está confirmado/i);
      assert.equal(await page.locator('#appointmentMessagePreview, #appointmentCopyButton, #appointmentWhatsAppLink').count(), 0,
        'Result screen must not expose message preview/copy/WhatsApp controls');
      assert.equal(await page.locator('#appointmentRequestResult a[href="#recursos"]').count(), 1,
        'Result screen must include the real free-resources destination');
      assert.equal(await page.getByText('Hola, quiero solicitar un turno con Piel de Mar.', { exact: true }).count(), 0,
        'Prepared WhatsApp message must not be rendered on the page');

      const opened = await page.evaluate(() => window.__openedWhatsAppUrl);
      assert.ok(opened, 'Form submission must attempt to open WhatsApp');
      const url = new URL(opened);
      assert.equal(url.hostname, 'wa.me');
      assert.equal(url.pathname, '/5493425004018');
      const message = url.searchParams.get('text') || '';
      assert.match(message, /Nombre: Prueba QA/);
      assert.match(message, /Obra social o cobertura: Particular/);
      assert.match(message, /Motivo de la consulta: Consulta de prueba automatizada/);
      assert.match(message, /Franja horaria: Tarde/);
      assert.match(message, /Horario deseado: 16:00/);
      assert.match(message, /turno queda confirmado únicamente cuando reciba una respuesta/i);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.equal(overflow, false, `${viewport.name}: page must not overflow horizontally`);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  assert.deepEqual(failures, [], 'No uncaught JavaScript errors should occur');
});
