#!/usr/bin/env node

/**
 * SimpliX documentation validator.
 *
 * Checks the documents against scripts/docs/documentation-guidelines.md:
 * every document exists in English and Korean with the same headings, code blocks and figures,
 * links and images resolve, and no forbidden symbol or diagram form is used.
 *
 * usage: node scripts/docs/validate-docs.mjs [module] [--strict] [--site]
 *   module    validate the modules whose name contains this text (root documents always run)
 *   --strict  treat warnings as errors
 *   --site    validate the built site under build-docs/ instead of the sources
 *
 * A module without README.ko.md has not been rewritten to the two-language structure yet. It is
 * listed at the end and only its symbols are checked.
 */

import { readdir, readFile, access } from 'fs/promises';
import { basename, dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SYMBOLS = { success: '\u2714', error: '\u2716', warning: '\u26A0', info: '\u2139' };
const APPROVED_SYMBOLS = Object.values(SYMBOLS);
const LANGS = ['en', 'ko'];
const MODULE_NAME = /^(simplix-[a-z]+|spring-boot-starter-simplix)$/;

const EMOJI = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
const EM_DASH = '\u2014';
const HARDCODED_VERSION = /(?:<version>\d+\.\d+\.\d+<\/version>|(?:version|Version|VERSION)[\s:='"]*\d+\.\d+\.\d+)/;
const IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g;
const LINK = /(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g;

class Report {
  constructor(name) {
    this.name = name;
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
  }

  error(message, file) {
    this.errors.push(file ? `${message} (${file})` : message);
  }

  warn(message, file) {
    this.warnings.push(file ? `${message} (${file})` : message);
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

/** Markdown files under a directory, as paths relative to it, sorted. */
async function markdownFiles(dir) {
  if (!(await exists(dir))) return [];
  const found = [];
  const walk = async current => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) found.push(relative(dir, full));
    }
  };
  await walk(dir);
  return found.sort();
}

/** The parts of a document the checks read: heading levels, code blocks and the text outside code. */
function parse(content) {
  const headings = [];
  const codeBlocks = [];
  const prose = [];
  let block = null;
  for (const line of content.split('\n')) {
    if (/^\s*```/.test(line)) {
      if (block === null) {
        block = [line.trim()];
      } else {
        codeBlocks.push(block.join('\n'));
        block = null;
      }
    } else if (block !== null) {
      block.push(line);
    } else {
      const heading = /^(#{1,6})\s/.exec(line);
      if (heading) headings.push(heading[1].length);
      prose.push(line);
    }
  }
  return { headings, codeBlocks, prose: prose.join('\n') };
}

function targets(pattern, text) {
  return [...text.matchAll(pattern)].map(match => match[1]);
}

function isExternal(target) {
  return /^(https?:|mailto:|#|data:)/.test(target);
}

/** Symbol rules every document follows, rewritten or not. */
function checkSymbols(content, file, report) {
  content.split('\n').forEach((line, index) => {
    const emoji = (line.match(EMOJI) ?? []).filter(symbol => !APPROVED_SYMBOLS.includes(symbol));
    if (emoji.length > 0) report.error(`Forbidden symbol ${emoji.join(' ')}`, `${file}:${index + 1}`);
  });
}

async function checkDocument(path, file, lang, report) {
  const content = await readFile(path, 'utf8');
  const parsed = parse(content);
  checkSymbols(content, file, report);

  content.split('\n').forEach((line, index) => {
    if (line.includes(EM_DASH)) report.error('The em dash is not written', `${file}:${index + 1}`);
    // A changelog is where released versions are named.
    const names = !file.endsWith('changelog.md') && HARDCODED_VERSION.test(line) && !line.includes('${');
    if (names) report.warn('Possible hardcoded version', `${file}:${index + 1}`);
  });
  if (parsed.codeBlocks.some(code => code.startsWith('```mermaid'))) {
    report.error('Mermaid block found: figures are SVG files drawn by docs/figures', file);
  }

  for (const image of targets(IMAGE, parsed.prose)) {
    if (isExternal(image)) continue;
    if (!(await exists(resolve(dirname(path), image)))) report.error(`Image not found: ${image}`, file);
    const figure = /\.(en|ko)\.svg$/.exec(image);
    if (figure && figure[1] !== lang) report.error(`Figure of the other language: ${image}`, file);
  }
  for (const link of targets(LINK, parsed.prose)) {
    const [target] = link.split('#');
    if (isExternal(link) || target === '' || target.startsWith('/')) continue;
    const resolved = resolve(dirname(path), target);
    if (!(await exists(resolved))) report.error(`Link target not found: ${link}`, file);
    // A unit that has a Korean introduction is linked through it from Korean documents.
    const korean = join(dirname(resolved), 'README.ko.md');
    // The Korean introduction links its own English twin as the language switch.
    const twin = resolve(path) === korean;
    if (lang === 'ko' && !twin && basename(resolved) === 'README.md' && (await exists(korean))) {
      report.error(`Korean document links the English introduction: ${link}`, file);
    }
  }
  return parsed;
}

function figureIds(parsed) {
  return targets(IMAGE, parsed.prose)
    .map(image => /([^/]+)\.(?:en|ko)\.svg$/.exec(image)?.[1])
    .filter(Boolean);
}

/** A pair of documents carries the same headings, code blocks and figures. */
function checkPair(english, korean, file, report) {
  if (english.headings.join(',') !== korean.headings.join(',')) {
    report.error(`Heading structure differs between the languages (en ${english.headings.length}, ko ${korean.headings.length})`, file);
  }
  if (english.codeBlocks.length !== korean.codeBlocks.length) {
    report.error(`Code block count differs (en ${english.codeBlocks.length}, ko ${korean.codeBlocks.length})`, file);
  } else {
    english.codeBlocks.forEach((code, index) => {
      if (code !== korean.codeBlocks[index]) report.error(`Code block ${index + 1} differs between the languages`, file);
    });
  }
  if (figureIds(english).join(',') !== figureIds(korean).join(',')) {
    report.error('Figures differ between the languages', file);
  }
}

/**
 * Validates one documentation unit: an introduction pair and the docs/en and docs/ko folders
 * beside it.
 */
async function validateUnit(name, dir, pending) {
  const report = new Report(name);
  const readme = { en: join(dir, 'README.md'), ko: join(dir, 'README.ko.md') };
  const docs = { en: join(dir, 'docs/en'), ko: join(dir, 'docs/ko') };

  if (!(await exists(readme.ko))) {
    pending.push(name);
    for (const file of [...(await markdownFiles(docs.ko)).map(f => join('docs/ko', f)), 'README.md']) {
      const path = join(dir, file);
      if (await exists(path)) checkSymbols(await readFile(path, 'utf8'), file, report);
    }
    return report;
  }

  const parsed = {};
  for (const lang of LANGS) {
    const label = relative(dir, readme[lang]);
    if (!(await exists(readme[lang]))) {
      report.error(`Missing ${label}`);
      continue;
    }
    parsed[lang] = await checkDocument(readme[lang], label, lang, report);
    report.passed += 1;
  }
  if (parsed.en && parsed.ko) checkPair(parsed.en, parsed.ko, 'README', report);

  const files = { en: await markdownFiles(docs.en), ko: await markdownFiles(docs.ko) };
  for (const file of new Set([...files.en, ...files.ko])) {
    const pair = {};
    for (const lang of LANGS) {
      if (!files[lang].includes(file)) {
        report.error(`Missing docs/${lang}/${file}`);
        continue;
      }
      pair[lang] = await checkDocument(join(docs[lang], file), `docs/${lang}/${file}`, lang, report);
      report.passed += 1;
    }
    if (pair.en && pair.ko) checkPair(pair.en, pair.ko, file, report);
  }
  if (name !== 'root' && !files.en.includes('getting-started.md')) report.warn('No getting-started.md');
  return report;
}

/** Every link and image of the built site resolves inside build-docs/. */
async function validateSite() {
  const report = new Report('build-docs');
  const site = join(PROJECT_ROOT, 'build-docs');
  if (!(await exists(site))) {
    report.error('build-docs/ not found: run ./scripts/build-docs.sh first');
    return report;
  }
  for (const file of await markdownFiles(site)) {
    const path = join(site, file);
    const parsed = parse(await readFile(path, 'utf8'));
    for (const image of targets(IMAGE, parsed.prose)) {
      if (!isExternal(image) && !(await exists(resolve(dirname(path), image)))) report.error(`Image not found: ${image}`, file);
    }
    for (const link of targets(LINK, parsed.prose)) {
      const [target] = link.split('#');
      if (isExternal(link) || target === '' || !target.endsWith('.md')) continue;
      // Docsify resolves a Markdown link from the site root.
      if (!(await exists(join(site, target.replace(/^\//, ''))))) report.error(`Link target not found: ${link}`, file);
    }
    report.passed += 1;
  }
  return report;
}

function print(report) {
  console.log(`\nValidating ${report.name}...`);
  if (report.passed > 0) console.log(`  ${SYMBOLS.success} ${report.passed} documents checked`);
  report.warnings.forEach(message => console.log(`  ${SYMBOLS.warning} Warning: ${message}`));
  report.errors.forEach(message => console.log(`  ${SYMBOLS.error} Error: ${message}`));
}

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const filter = args.find(arg => !arg.startsWith('--'));
  console.log(`${SYMBOLS.info} SimpliX Documentation Validator`);

  const reports = [];
  const pending = [];
  if (args.includes('--site')) {
    reports.push(await validateSite());
  } else {
    const entries = await readdir(PROJECT_ROOT, { withFileTypes: true });
    const modules = entries.filter(entry => entry.isDirectory() && MODULE_NAME.test(entry.name)).map(entry => entry.name).sort();
    const selected = filter ? modules.filter(name => name.includes(filter)) : modules;
    if (filter && selected.length === 0) {
      console.log(`${SYMBOLS.error} No module matches: ${filter}`);
      process.exit(1);
    }
    reports.push(await validateUnit('root', PROJECT_ROOT, pending));
    for (const name of selected) reports.push(await validateUnit(name, join(PROJECT_ROOT, name), pending));
  }

  reports.forEach(print);
  const errors = reports.reduce((sum, report) => sum + report.errors.length, 0);
  const warnings = reports.reduce((sum, report) => sum + report.warnings.length, 0);
  const passed = reports.reduce((sum, report) => sum + report.passed, 0);

  console.log(`\n${'-'.repeat(50)}`);
  console.log(`${SYMBOLS.info} Summary`);
  console.log(`  ${SYMBOLS.success} Documents checked: ${passed}`);
  console.log(`  ${SYMBOLS.warning} Warnings: ${warnings}`);
  console.log(`  ${SYMBOLS.error} Errors: ${errors}`);
  if (pending.length > 0) {
    console.log(`\n${SYMBOLS.info} Not yet rewritten to the two-language structure: ${pending.join(', ')}`);
  }

  if (errors > 0 || (strict && warnings > 0)) {
    console.log(`\n${SYMBOLS.error} Validation failed`);
    process.exit(1);
  }
  console.log(`\n${warnings > 0 ? SYMBOLS.warning + ' Validation passed with warnings' : SYMBOLS.success + ' All validations passed'}`);
}

main().catch(error => {
  console.error(`${SYMBOLS.error} Unexpected error:`, error.message);
  process.exit(1);
});
