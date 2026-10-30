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

test('menu goes to the on-page resources section and cards link to the library categories', () => {
  assert.match(home, /<li><a href="#recursos" class="nav-link">Recursos<\/a><\/li>/);
  assert.match(home, /<section id="recursos"/);
  assert.doesNotMatch(home, /class="nav-link"[^>]*recursos\.html/);

  for (const id of categories) {
    assert.match(home, new RegExp('href="recursos\\.html#' + id + '"'));
    assert.match(resources, new RegExp('<details class="library-section" id="' + id + '" name="recursos-seccion">'));
  }

  assert.equal((resources.match(/class="library-section"/g) || []).length, 6);
  assert.equal((resources.match(/class="library-item(?: library-item-static)?"/g) || []).length, 18);
  assert.equal((resources.match(/class="library-thumb"/g) || []).length, 18);
});

test('resources contain a downloadable reading material', () => {
  assert.match(resources, /assets\/recursos\/registro-semanal\.txt/);
  assert.match(resources, /download/);
});

test('every resource shows its own section illustration and starts collapsed', () => {
  const sprite = fs.readFileSync('assets/recursos/miniaturas.svg', 'utf8');
  const symbols = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(symbols.length, 6);

  const sections = [...resources.matchAll(/<details class="library-section" id="(\w+)"[^>]*>([\s\S]*?)<\/details>\s*(?=<details class="library-section"|<\/div>)/g)];
  assert.equal(sections.length, 6);
  const used = new Set();
  for (const [, , body] of sections) {
    const ids = [...body.matchAll(/miniaturas\.svg#([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, 3, 'three resources per section, each with the section image');
    assert.equal(new Set(ids).size, 1, 'all resources of a section share its illustration');
    assert.ok(symbols.includes(ids[0]));
    used.add(ids[0]);
  }
  assert.equal(used.size, 6, 'each section has a distinct illustration');

  assert.doesNotMatch(resources, /<details[^>]*\sopen[\s>]/, 'sections and resources must start collapsed');
  assert.doesNotMatch(resources, /style=|<style/i);
});
