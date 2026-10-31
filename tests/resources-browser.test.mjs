import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

let server;
let baseURL;

before(async () => {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
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

  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolveServer) => server.close(resolveServer));
});

test('resource library is a collapsible accordion that shows only the chosen section', async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of [
      { width: 1365, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(`${baseURL}/recursos.html`, { waitUntil: 'domcontentloaded' });

      assert.equal(await page.title(), 'Recursos | Piel de Mar');
      assert.equal(await page.locator('details.library-section').count(), 6);
      assert.equal(await page.locator('details.library-section[open]').count(), 0, 'all sections start collapsed');
      assert.equal(await page.locator('.library-item:visible').count(), 0, 'no resource is visible until a section is chosen');
      assert.equal(await page.locator('.library-thumb:visible').count(), 0);

      // Abrir una sección muestra solo sus 3 recursos, cada uno con su imagen, y mantiene el detalle cerrado.
      await page.locator('#desarrollo > summary').click();
      assert.equal(await page.locator('details.library-section[open]').count(), 1);
      assert.equal(await page.locator('#desarrollo .library-item:visible').count(), 3);
      assert.equal(await page.locator('#desarrollo .library-thumb:visible').count(), 3);
      assert.equal(await page.locator('.library-detail:visible').count(), 0, 'details stay hidden until clicked');

      // Un recurso se abre con un clic y se cierra con otro.
      await page.locator('#desarrollo-lectura > summary').click();
      assert.equal(await page.locator('#desarrollo-lectura .library-detail').isVisible(), true);
      assert.equal(await page.locator('.library-detail:visible').count(), 1);
      await page.locator('#desarrollo-lectura > summary').click();
      assert.equal(await page.locator('#desarrollo-lectura .library-detail').isVisible(), false);

      // Elegir otra sección colapsa la anterior.
      await page.locator('#juego > summary').click();
      assert.equal(await page.locator('details.library-section[open]').count(), 1);
      assert.equal(await page.locator('#desarrollo').evaluate((el) => el.open), false);
      assert.equal(await page.locator('#juego').evaluate((el) => el.open), true);

      // Teclado: Enter abre y cierra la sección enfocada.
      await page.locator('#guias > summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#guias').evaluate((el) => el.open), true);

      // El material descargable es un enlace directo.
      assert.equal(await page.locator('#guias a[download]').getAttribute('href'), 'assets/recursos/registro-semanal.txt');
      const sprite = await page.request.get(`${baseURL}/assets/recursos/miniaturas.svg`);
      assert.equal(sprite.status(), 200);

      // Los enlaces de la página principal abren la sección (y el recurso) indicados.
      await page.goto(`${baseURL}/recursos.html#crianza`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#crianza').open);
      assert.equal(await page.locator('details.library-section[open]').count(), 1);
      await page.goto(`${baseURL}/recursos.html#regulacion-juego`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#regulacion-juego')?.open);
      assert.equal(await page.locator('#regulacion').evaluate((el) => el.open), true);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `horizontal overflow: ${overflow}px`);

      for (const open of [false, true]) {
        if (open) await page.locator('#desarrollo > summary').click();
        const accessibility = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        assert.deepEqual(accessibility.violations.map((violation) => violation.id), []);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test('embeds create their iframe only after the resource is opened', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.route(/wordwall\.net|youtube-nocookie\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>ok</p>' }));
    await page.goto(`${baseURL}/recursos.html`);
    assert.equal(await page.locator('iframe').count(), 0);
    await page.locator('#juego > summary').click();
    assert.equal(await page.locator('iframe').count(), 0, 'section open alone does not load the game');
    await page.locator('#juego-memoria > summary').click();
    const game = page.locator('#juego-memoria iframe');
    await game.waitFor({ state: 'attached' });
    assert.equal(await game.count(), 1);
    assert.match(await game.getAttribute('src'), /^https:\/\/wordwall\.net\/es\/embed\//);
    assert.ok((await game.getAttribute('title')).length > 5);
    await page.locator('#guias > summary').click();
    await page.locator('#guia-video > summary').click();
    const video = page.locator('#guia-video iframe');
    await video.waitFor({ state: 'attached' });
    assert.match(await video.getAttribute('src'), /^https:\/\/www\.youtube-nocookie\.com\/embed\/geRfpZ474Ms\?/);
    const box = await video.boundingBox();
    assert.ok(box.width >= 600, `video should be large, got ${box.width}px`);
    assert.equal(await page.locator('#guia-video a[href*="youtube.com"]').count(), 0);
    assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.05);
  } finally {
    await browser.close();
  }
});
