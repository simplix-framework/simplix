import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { lineLatest, prepareDocs } from '../prepare-docs.mjs';

const docs = new URL('../../docs/', import.meta.url);
const read = file => fs.readFileSync(new URL(file, docs), 'utf8');
const put = (root, file, text) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
};

/** Runs a browser settings file and returns the window it filled. */
function settings(...files) {
  const window = {};
  for (const file of files) vm.runInNewContext(read(file), { window });
  return window;
}

test('a release line keeps its newest release', () => {
  assert.deepEqual(lineLatest(['1.9.0', '2.0.2', '1.10.0', '2.0.1', '0.1.5']), ['2.0.2', '1.10.0', '0.1.5']);
});

test('a deployment keeps the newest release of each line and gives every version the current shell', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-docs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const previous = path.join(root, 'previous'), built = path.join(root, 'built'), output = path.join(root, 'output');
  const html = '<html><head><title>Project Documentation</title></head><body>a shell of its own time</body></html>';
  for (const directory of [path.join(previous, 'snapshot'), path.join(previous, '1.9.0'), path.join(previous, '1.10.0'), path.join(previous, '2.0.0'), built]) {
    put(directory, 'index.html', html);
  }
  put(previous, '1.10.0/obsolete.md', 'old');
  put(previous, '2.0.0/ko/README.md', '# Home');
  put(built, 'new.md', 'new');
  assert.deepEqual(prepareDocs({ previous, built, output, version: '1.10.0' }), { releases: ['2.0.0', '1.10.0'], snapshot: 'snapshot' });
  assert.ok(!fs.existsSync(path.join(output, '1.9.0')), 'an older release of a line leaves the site');
  assert.ok(!fs.existsSync(path.join(output, '1.10.0', 'obsolete.md')));
  assert.ok(fs.existsSync(path.join(output, '1.10.0', 'new.md')));
  for (const version of ['snapshot', '1.10.0', '2.0.0']) {
    assert.equal(fs.readFileSync(path.join(output, version, 'index.html'), 'utf8'), read('index.html'));
    assert.ok(fs.existsSync(path.join(output, version, 'assets', 'site', 'site.js')));
  }
  assert.match(fs.readFileSync(path.join(output, '2.0.0', 'assets', 'site-config.js'), 'utf8'), /SIMPLIX_FOLDER = \{"languages":\["ko"\]\}/);
  assert.match(fs.readFileSync(path.join(output, 'index.html'), 'utf8'), /\.\/2\.0\.0\//);
  assert.throws(() => prepareDocs({ previous, built, output, version: '../outside' }));
});

test('the shell loads files that exist, and this site is one of the libraries', () => {
  const shell = read('index.html');
  for (const [, file] of shell.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(new URL(file, docs)), file + ' is missing');
  }
  const { SIMPLIX_SITE: site, SIMPLIX_PRODUCTS: products } = settings('assets/site-config.js', 'assets/site/products.js');
  assert.ok(products.some(product => product.id === site.id), 'products.js has no entry for ' + site.id);
  for (const product of products) {
    assert.match(product.url, /^https:\/\/simplix-framework\.github\.io\/[a-z-]+\/$/);
    assert.match(product.accent, /^#[0-9a-f]{6}$/);
  }
  assert.equal(new Set(products.map(product => product.accent)).size, products.length, 'every library has a colour of its own');
});

test('a figure is never shown larger than its own size', () => {
  const rule = /\.markdown-section img \{([^}]*)\}/.exec(read('assets/site/site.css'))?.[1] ?? '';
  assert.match(rule, /width: auto/);
  assert.match(rule, /max-width: 100%/);
});
