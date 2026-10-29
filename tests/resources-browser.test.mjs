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

test('resource library is navigable, responsive and accessible', async () => {
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
      assert.equal(await page.locator('.resources-sidebar nav a').count(), 6);
      assert.equal(await page.locator('.resource-category').count(), 6);
      assert.equal(await page.locator('.resource-tile').count(), 18);
      assert.equal(await page.locator('.resource-category-illustration').count(), 6);
      assert.equal(await page.locator('.resource-category-illustration use').count(), 6);
      assert.equal(await page.locator('.resource-thumb').count(), 0);

      const spriteResponse = await page.request.get(`${baseURL}/assets/recursos/miniaturas.svg`);
      assert.equal(spriteResponse.status(), 200, 'the resource thumbnail sprite must load');
      assert.match(spriteResponse.headers()['content-type'] || '', /image\/svg\+xml/);
      const spriteMarkup = await spriteResponse.text();
      const symbolIds = [...spriteMarkup.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]);
      assert.equal(symbolIds.length, 6, 'the sprite must define one illustration per category');
      const referencedSymbols = await page.locator('.resource-category-illustration use').evaluateAll((elements) =>
        elements.map((element) => new URL(element.getAttribute('href'), location.href).hash.slice(1)),
      );
      assert.equal(new Set(referencedSymbols).size, 6, 'every category must use a distinct illustration');
      assert.deepEqual(
        referencedSymbols.filter((id) => !symbolIds.includes(id)),
        [],
        'every category illustration must reference a symbol in the sprite',
      );

      for (const id of [
        'desarrollo',
        'crianza',
        'regulacion',
        'juego',
        'lecturas',
        'guias',
      ]) {
        await page.locator(`.resources-sidebar a[href="#${id}"]`).click();
        await page.waitForFunction((sectionId) => location.hash === `#${sectionId}`, id);
        assert.ok(await page.locator(`#${id}`).isVisible());
      }

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('body *')]
          .map((element) => ({
            tag: element.tagName,
            cls: typeof element.className === 'string' ? element.className : '',
            id: element.id,
            left: Math.round(element.getBoundingClientRect().left),
            right: Math.round(element.getBoundingClientRect().right),
            width: Math.round(element.getBoundingClientRect().width),
          }))
          .filter((element) => element.right > innerWidth + 1 || element.left < -1)
          .slice(0, 20),
      }));

      assert.equal(
        overflow.scrollWidth > overflow.clientWidth,
        false,
        JSON.stringify(overflow),
      );

      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      assert.deepEqual(accessibility.violations.map((violation) => violation.id), []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
});
