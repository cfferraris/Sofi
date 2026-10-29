import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('index.html', 'utf8');
const resources = fs.readFileSync('recursos.html', 'utf8');
const categories = ['desarrollo', 'crianza', 'regulacion', 'juego', 'lecturas', 'guias'];

test('services no longer expose per-service buttons or dialog markup', () => {
  assert.equal((home.match(/data-service-key=/g) || []).length, 0);
  assert.equal((home.match(/siteContentDialog/g) || []).length, 0);
});

test('navigation opens the resource library and cards link to their categories', () => {
  assert.match(
    home,
    /href="recursos\.html" class="nav-link" target="_blank" rel="noopener noreferrer">Recursos<\/a>/,
  );
  assert.doesNotMatch(home, /href="#recursos" class="nav-link"/);

  for (const id of categories) {
    assert.match(home, new RegExp('href="recursos\\.html#' + id + '"'));
    assert.match(resources, new RegExp('id="' + id + '"'));
    assert.match(resources, new RegExp('href="#' + id + '"'));
  }

  assert.equal((resources.match(/class="resource-tile"/g) || []).length, 18);
  assert.equal((resources.match(/class="resource-category-illustration"/g) || []).length, 6);
  assert.equal((resources.match(/class="resource-thumb"/g) || []).length, 0);
});

test('resources contain a downloadable reading material', () => {
  assert.match(resources, /assets\/recursos\/registro-semanal\.txt/);
  assert.match(resources, /download/);
});

test('category illustrations are shared at section level, not repeated on resource cards', () => {
  const sprite = fs.readFileSync('assets/recursos/miniaturas.svg', 'utf8');
  const symbols = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]);
  const uses = [...resources.matchAll(/class="resource-category-illustration"[\s\S]*?<use href="assets\/recursos\/miniaturas\.svg#([^"]+)"/g)].map((match) => match[1]);
  assert.equal(symbols.length, 6);
  assert.equal(uses.length, 6);
  assert.equal(new Set(uses).size, 6);
  assert.deepEqual(uses.filter((id) => !symbols.includes(id)), []);
});
