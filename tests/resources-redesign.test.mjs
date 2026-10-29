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
  assert.equal((resources.match(/class="resource-thumb"/g) || []).length, 18);
});

test('resources contain a downloadable reading material', () => {
  assert.match(resources, /assets\/recursos\/registro-semanal\.txt/);
  assert.match(resources, /download/);
});
