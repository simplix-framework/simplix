#!/usr/bin/env node
/**
 * Copies the shared documentation site from this repository, which holds the original, to the
 * other SimpliX documentation repositories, or checks that their copies are still the same.
 *
 *   node scripts/sync-docs-site.mjs [--check] <repository folder> [...]
 *
 * Shared: the shell (docs/index.html), the look and behaviour (docs/assets/site), the version
 * path arithmetic (docs/assets/version-selector.js) and the script that combines the versions for
 * GitHub Pages (scripts/prepare-docs.mjs). Each repository keeps its own docs/assets/site-config.js.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHARED = ['docs/index.html', 'docs/assets/site', 'docs/assets/version-selector.js', 'scripts/prepare-docs.mjs'];

function filesOf(base, entry) {
  const full = path.join(base, entry);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [entry];
  return fs.readdirSync(full).sort().flatMap(name => filesOf(base, path.join(entry, name)));
}

const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/** The shared files of a repository that differ from the original, are missing or are extra. */
export function differences(target) {
  const problems = [];
  const expected = SHARED.flatMap(entry => filesOf(root, entry));
  for (const file of expected) {
    const copy = path.join(target, file);
    if (!fs.existsSync(copy)) problems.push('missing: ' + file);
    else if (digest(copy) !== digest(path.join(root, file))) problems.push('differs: ' + file);
  }
  for (const file of SHARED.flatMap(entry => filesOf(target, entry))) {
    if (!expected.includes(file)) problems.push('not in the original: ' + file);
  }
  if (!fs.existsSync(path.join(target, 'docs/assets/site-config.js'))) problems.push('missing: docs/assets/site-config.js');
  return problems;
}

export function sync(target) {
  for (const entry of SHARED) {
    const destination = path.join(target, entry);
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(path.join(root, entry), destination, { recursive: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const targets = args.filter(arg => arg !== '--check');
  if (targets.length === 0) throw new Error('Usage: node scripts/sync-docs-site.mjs [--check] <repository folder> [...]');
  let failed = false;
  for (const target of targets) {
    if (!check) sync(target);
    const problems = differences(target);
    console.log((problems.length === 0 ? '\u2714 ' : '\u2716 ') + target + (problems.length ? '\n  ' + problems.join('\n  ') : ''));
    failed ||= problems.length > 0;
  }
  if (failed) process.exit(1);
}
