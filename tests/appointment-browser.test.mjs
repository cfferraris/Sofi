import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

let server;
let base;

// Fecha mínima del formulario o, si cae en fin de semana, el lunes siguiente.
function nextWeekday(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function nextWeekend(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  while (date.getUTCDay() !== 6) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

before(async () => {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const requestedPath = pathname === '/' ? '/index.html' : pathname;
      const file = resolve(root, `.${requestedPath}`);

      if (file !== root && !file.startsWith(root + sep)) {
        return response.writeHead(403).end();
      }

      const info = await stat(file);
      if (!info.isFile()) return response.writeHead(404).end();

      response.writeHead(200, {
        'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream',
      });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise((resolveServer, rejectServer) => {
    server.once('error', rejectServer);
    server.listen(0, '127.0.0.1', resolveServer);
  });

  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolveServer) => server.close(resolveServer));
});

test('appointment request still works without rendering the WhatsApp message', async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1365, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();

      await page.addInitScript(() => {
        window.opened = null;
        window.open = (url) => {
          window.opened = String(url);
          return { closed: false };
        };
      });

      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.locator('#hero').click({ position: { x: 3, y: 3 } });
      await page.waitForFunction(
        () => getComputedStyle(document.querySelector('#hero')).display === 'none',
      );

      await page.locator('#appointmentName').fill('Prueba QA');
      await page.locator('#appointmentInsurance').fill('Particular');
      await page.locator('#appointmentReason').fill('Consulta automatizada');

      const minimumDate = await page.locator('#appointmentDate').getAttribute('min');
      await page.locator('#appointmentDate').fill(nextWeekday(minimumDate));
      await page.locator('#appointmentConsent').check();
      await page.locator('#appointmentTime').selectOption('afternoon');
      await page.locator('#appointmentTime').selectOption('16:00');
      await page.locator('.appointment-submit').click();

      const result = page.locator('#appointmentRequestResult');
      await result.waitFor({ state: 'visible' });

      assert.equal(await page.locator('#appointmentRequestForm').isHidden(), true);
      assert.equal(
        await result.locator('.appointment-resource-action').getAttribute('target'),
        '_blank',
      );
      assert.equal(
        await result.locator('.appointment-resource-action').getAttribute('href'),
        'recursos.html',
      );
      assert.equal(
        await result.getByText('Hola, quiero solicitar un turno con Piel de Mar.', {
          exact: true,
        }).count(),
        0,
      );

      const openedUrl = await page.evaluate(() => window.opened);
      const whatsappUrl = new URL(openedUrl);

      assert.equal(whatsappUrl.hostname, 'wa.me');
      assert.equal(whatsappUrl.pathname, '/5493425004018');
      assert.match(whatsappUrl.searchParams.get('text') || '', /Nombre: Prueba QA/);

      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test('appointment dates are limited to weekdays', async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'domcontentloaded' });

    const dateInput = page.locator('#appointmentDate');
    const minimumDate = await dateInput.getAttribute('min');

    await dateInput.fill(nextWeekend(minimumDate));
    assert.match(await dateInput.evaluate((el) => el.validationMessage), /lunes a viernes/i);

    await dateInput.fill(nextWeekday(minimumDate));
    assert.equal(await dateInput.evaluate((el) => el.validationMessage), '');

    await dateInput.fill('2020-01-06');
    assert.match(await dateInput.evaluate((el) => el.validationMessage), /a partir de mañana/i);

    await context.close();
  } finally {
    await browser.close();
  }
});

test('appointment fallback offers WhatsApp link, copy and edit without rendering the message', async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    // Simula un navegador que bloquea la apertura de WhatsApp.
    await page.addInitScript(() => { window.open = () => null; });
    await page.goto(base, { waitUntil: 'domcontentloaded' });

    await page.locator('#appointmentName').fill('Prueba Respaldo');
    await page.locator('#appointmentInsurance').fill('Particular');
    await page.locator('#appointmentReason').fill('Consulta de respaldo');
    const minimumDate = await page.locator('#appointmentDate').getAttribute('min');
    await page.locator('#appointmentDate').fill(nextWeekday(minimumDate));
    await page.locator('#appointmentConsent').check();
    await page.locator('#appointmentTime').selectOption('morning');
    await page.locator('#appointmentTime').selectOption('09:00');
    await page.locator('.appointment-submit').click();

    const result = page.locator('#appointmentRequestResult');
    await result.waitFor({ state: 'visible' });
    assert.match(await page.locator('#appointmentRequestStatus').innerText(), /bloqueado WhatsApp/i);

    const href = await page.locator('#appointmentOpenWhatsApp').getAttribute('href');
    assert.match(href, /^https:\/\/wa\.me\/5493425004018\?text=/);
    assert.match(decodeURIComponent(href), /Nombre: Prueba Respaldo/);

    await page.locator('#appointmentCopyMessage').click();
    await page.getByText('Mensaje copiado', { exact: false }).first().waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /Hola, quiero solicitar un turno con Piel de Mar\./);
    assert.match(copied, /Horario deseado: 09:00/);
    assert.equal(await result.getByText('Prueba Respaldo').count(), 0, 'el mensaje no debe renderizarse');

    await page.locator('#appointmentEditData').click();
    assert.equal(await page.locator('#appointmentRequestForm').isVisible(), true);
    assert.equal(await page.locator('#appointmentName').inputValue(), 'Prueba Respaldo');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'appointmentName');

    await context.close();
  } finally {
    await browser.close();
  }
});
