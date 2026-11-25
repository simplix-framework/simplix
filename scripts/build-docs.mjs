#!/usr/bin/env node

/**
 * Assembles the Docsify site under build-docs/ from the documents of the repository.
 *
 *   docs/{lang}/**                    -> {lang}/**
 *   {module}/docs/{lang}/**           -> {lang}/{module-short}/**
 *   {module}/README.md, README.ko.md  -> en/{module-short}/readme.md, ko/{module-short}/readme.md
 *   docs/assets/**                    -> assets/**
 *
 * A module without README.ko.md keeps its README.md as the Korean introduction.
 * Every link and image is resolved against the source file it is written in and rewritten to the
 * place its target takes in the site, so a document reads the same on GitHub and on the site.
 *
 * usage: node scripts/build-docs.mjs      (DOCS_VERSION overrides the version of build.gradle)
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = join(ROOT, 'build-docs');
const LANGS = ['ko', 'en'];
const REPOSITORY_BLOB = 'https://github.com/simplix-framework/simplix/blob/main/';
const MODULE_NAME = /^(simplix-[a-z]+|spring-boot-starter-simplix)$/;
const TARGET = /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g;

const toPosix = path => path.split(sep).join('/');
const shortName = module => (module === 'spring-boot-starter-simplix' ? 'starter' : module.replace(/^simplix-/, ''));

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

/** Source file (repository-relative) to its path in the site. */
function planSite() {
  const plan = new Map();
  const add = (source, target) => plan.set(toPosix(relative(ROOT, source)), target);

  for (const file of filesUnder(join(ROOT, 'docs/assets'))) add(file, toPosix(relative(join(ROOT, 'docs'), file)));
  for (const lang of LANGS) {
    for (const file of filesUnder(join(ROOT, 'docs', lang))) add(file, `${lang}/${toPosix(relative(join(ROOT, 'docs', lang), file))}`);
  }

  const modules = readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && MODULE_NAME.test(entry.name) && existsSync(join(ROOT, entry.name, 'README.md')))
    .map(entry => entry.name);
  for (const module of modules) {
    const short = shortName(module);
    const korean = join(ROOT, module, 'README.ko.md');
    if (existsSync(korean)) {
      add(join(ROOT, module, 'README.md'), `en/${short}/readme.md`);
      add(korean, `ko/${short}/readme.md`);
    } else {
      add(join(ROOT, module, 'README.md'), `ko/${short}/readme.md`);
    }
    for (const lang of LANGS) {
      const docs = join(ROOT, module, 'docs', lang);
      for (const file of filesUnder(docs)) add(file, `${lang}/${short}/${toPosix(relative(docs, file))}`);
    }
  }
  return plan;
}

/**
 * Rewrites the links and images of one document for its place in the site.
 * Docsify resolves a Markdown link from the site root and an image from the document's folder.
 */
function rewrite(content, sourcePath, sitePath, plan, unresolved) {
  const lang = sitePath.split('/')[0];
  let inCode = false;
  return content
    .split('\n')
    .map(line => {
      if (/^\s*```/.test(line)) inCode = !inCode;
      if (inCode) return line;
      return line.replace(TARGET, (whole, bang, text, target) => {
        if (/^(https?:|mailto:|#|data:)/.test(target)) return whole;
        const [path, anchor] = target.split('#');
        const suffix = anchor === undefined ? '' : `#${anchor}`;
        if (path.startsWith('/')) return `${bang}[${text}](${path.slice(1)}${suffix})`;

        const resolved = toPosix(relative(ROOT, resolve(dirname(join(ROOT, sourcePath)), path)));
        // The repository introductions are not pages of the site: the documentation home stands in.
        const homes = { 'README.md': 'en/README.md', 'README.ko.md': 'ko/README.md' };
        // A document not yet rewritten may count its way up from the module folder instead of from
        // its own, so a path that leads nowhere is tried again from the repository root.
        const fromRoot = path.replace(/^(\.\.\/)+/, '');
        const mapped =
          plan.get(resolved) ??
          (homes[resolved] && plan.has(`docs/${homes[resolved]}`) ? homes[resolved] : undefined) ??
          (path.startsWith('../') ? plan.get(fromRoot) : undefined);
        if (mapped !== undefined) {
          const rewritten = bang === '!' ? posix.relative(posix.dirname(sitePath), mapped) : mapped;
          return `${bang}[${text}](${rewritten}${suffix})`;
        }
        if (existsSync(join(ROOT, resolved)) && !statSync(join(ROOT, resolved)).isDirectory()) {
          return `${bang}[${text}](${REPOSITORY_BLOB}${resolved}${suffix})`;
        }
        unresolved.push(`${sourcePath}: ${target} (${lang})`);
        return whole;
      });
    })
    .join('\n');
}

function projectVersion() {
  if (process.env.DOCS_VERSION) return process.env.DOCS_VERSION;
  const match = /projectVersion = '([^']*)'/.exec(readFileSync(join(ROOT, 'build.gradle'), 'utf8'));
  if (!match) throw new Error('projectVersion not found in build.gradle');
  return match[1];
}

function main() {
  const version = projectVersion();
  console.log(`Building SimpliX documentation... (v${version})`);
  rmSync(BUILD_DIR, { recursive: true, force: true });
  mkdirSync(BUILD_DIR, { recursive: true });

  for (const file of ['index.html', '.nojekyll']) cpSync(join(ROOT, 'docs', file), join(BUILD_DIR, file));

  const plan = planSite();
  const unresolved = [];
  let documents = 0;
  for (const [source, target] of plan) {
    const out = join(BUILD_DIR, target);
    mkdirSync(dirname(out), { recursive: true });
    if (source.endsWith('.md') && !posix.basename(source).startsWith('_')) {
      writeFileSync(out, rewrite(readFileSync(join(ROOT, source), 'utf8'), source, target, plan, unresolved));
      documents += 1;
    } else {
      cpSync(join(ROOT, source), out);
    }
  }
  // The site opens in Korean, so the root sidebar is the Korean one.
  cpSync(join(ROOT, 'docs/ko/_sidebar.md'), join(BUILD_DIR, '_sidebar.md'));

  console.log(`  Documents: ${documents}`);
  console.log(`  Other files: ${plan.size - documents}`);
  if (unresolved.length > 0) {
    console.log(`  \u26A0 Links left as written because their target was not found: ${unresolved.length}`);
    for (const entry of unresolved.slice(0, 20)) console.log(`    ${entry}`);
  }
  console.log(`\nOutput: ${relative(ROOT, BUILD_DIR)}/`);
  console.log('Preview: cd build-docs && python3 -m http.server 3000');
}

main();
