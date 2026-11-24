import fs from 'node:fs';
import path from 'node:path';
import { symbols } from '../lib/console.js';
import { CliError } from '../lib/errors.js';
import { readEntityConfig, requireProjectConfig } from '../lib/project.js';
import { promoteFiles } from '../lib/promote-files.js';
import { carryStamp, readBase, recordBase, stampRender, writeTracked } from '../lib/tracked-render.js';
import { assertGeneratorVersion } from '../lib/version-check.js';

export const usage = 'simplix-boot promote <EntityName> --module <module> [--adopt] [--force] [--skip-version-check]';

export const summary = 'Move generated files into a module as tracked renders, merging later template changes';

export const argumentSpec = {
  positionals: ['entityName'],
  options: {
    module: { type: 'string' },
    force: { type: 'boolean', default: false },
    adopt: { type: 'boolean', default: false },
    'skip-version-check': { type: 'boolean', default: false },
  },
};

/**
 * Promotes one stamped render under the tracked-render rule, or overwrites with `force`, or with
 * `adopt` takes the render as the base of an existing file that has none.
 */
function promoteOne(root, file, stamped, { force, adopt }) {
  if (force) {
    fs.mkdirSync(path.dirname(file.dest), { recursive: true });
    fs.writeFileSync(file.dest, stamped);
    recordBase(root, file.dest, stamped);
    return { outcome: 'written' };
  }

  // Adopting a file the customisation deleted records its base, so later promotes leave it deleted.
  if (adopt && !fs.existsSync(file.dest)) {
    if (readBase(root, file.dest) === undefined) recordBase(root, file.dest, stamped);
    return { outcome: 'removed' };
  }

  if (adopt && readBase(root, file.dest) === undefined) {
    const held = fs.readFileSync(file.dest, 'utf8');
    fs.writeFileSync(file.dest, carryStamp(held, stamped));
    recordBase(root, file.dest, stamped);
    return { outcome: 'adopted' };
  }

  return writeTracked(root, file.dest, stamped);
}

/**
 * Promotes the generated files of one entity into a module.
 *
 * <p>Every promoted file is a tracked render: it opens with a fingerprint of the render it was
 * laid down as, and that render is stored under `.simplix/bases/`. A later promote rewrites an
 * untouched file, merges the template change three ways into an edited one, and never overwrites
 * an edited file whose merge conflicts.
 *
 * @param {object} run
 * @param {string} run.root the project root
 * @param {string} run.entityName the entity yml's name
 * @param {string} run.moduleName the target module below the module root
 * @param {boolean} [run.force] whether existing files are overwritten, edits included
 * @param {boolean} [run.adopt] whether this render becomes the base of files promoted without one
 * @param {boolean} [run.skipVersionCheck] whether the version gate is skipped
 * @param {(message?: string) => void} run.log where progress goes
 * @throws {CliError} when a file conflicts or has no base, or the target module does not exist
 */
export function promote({ root, entityName, moduleName, force = false, adopt = false, skipVersionCheck = false, log }) {
  if (!entityName) {
    throw new CliError(`Entity name is required\nUsage: ${usage}`);
  }

  const config = requireProjectConfig(root);
  assertGeneratorVersion({ config, log, skip: skipVersionCheck });

  if (!moduleName) {
    throw new CliError(
      `--module option is required.\nUsage: ${usage}\nExample: simplix-boot promote UserAccount --module user-admin`
    );
  }

  log(`\n${symbols.info} Promoting ${entityName} to module "${moduleName}"...`);

  const entityConfig = readEntityConfig(root, entityName);
  if (entityConfig === undefined || entityConfig === null) {
    throw new CliError(`Entity configuration not found: .simplix/entity/${entityName}.yml`);
  }

  const moduleRoot = config.promote?.moduleRoot || 'modules';
  if (!fs.existsSync(path.join(root, moduleRoot, moduleName))) {
    throw new CliError(`Target module directory not found: ${moduleRoot}/${moduleName}`);
  }

  log(`${symbols.info} Module path: ${entityConfig.modulePath}`);
  log(`${symbols.info} Target module: ${moduleRoot}/${moduleName}`);

  const origin = `promote ${entityName} --module ${moduleName}`;
  const counts = {};
  let failed = false;

  for (const file of promoteFiles({ root, config, entityName, entityConfig, moduleName })) {
    log(`\n${symbols.info} ${file.name}:`);
    log(`  From: ${path.relative(root, file.src)}`);
    log(`  To:   ${path.relative(root, file.dest)}`);

    if (!fs.existsSync(file.src)) {
      log(`  ${symbols.warning} Source file not found; run simplix-boot generate ${entityName} first`);
      continue;
    }

    const stamped = stampRender(fs.readFileSync(file.src, 'utf8'), origin);
    const outcome = promoteOne(root, file, stamped, { force, adopt });
    counts[outcome.outcome] = (counts[outcome.outcome] ?? 0) + 1;

    switch (outcome.outcome) {
      case 'written':
        log(`  ${symbols.success} Written (absent or untouched)`);
        break;
      case 'merged':
        log(`  ${symbols.success} Merged the template change into the edits`);
        break;
      case 'current':
        log(`  ${symbols.success} Edited, and already carries the template change`);
        break;
      case 'removed':
        log(`  ${symbols.info} Removed: deleted after it was laid down, so it stays deleted`);
        break;
      case 'adopted':
        log(`  ${symbols.success} Adopted: stamped, its edits kept against this render as base`);
        break;
      case 'conflict':
        failed = true;
        log(`  ${symbols.error} Conflict: the file was kept; the merge with markers is at`);
        log(`    ${path.relative(root, outcome.report)}`);
        break;
      default:
        failed = true;
        log(`  ${symbols.error} No base: the file is edited and was never promoted with a stored base.`);
        log(`    Kept. Run with --adopt to take this render as its base, or --force to overwrite it.`);
    }

    // A conflict keeps the render in generated/, so the promote can run again after the fix.
    if (outcome.outcome !== 'conflict' && outcome.outcome !== 'no-base') fs.rmSync(file.src);
  }

  log(`\n${symbols.info} Summary:`);
  for (const [outcome, count] of Object.entries(counts)) log(`  ${outcome}: ${count}`);

  if (failed) {
    throw new CliError(`Promotion of ${entityName} left files that need attention.`);
  }

  log(`\n${symbols.success} Promotion complete!`);
  log(`\nNext steps:`);
  log(`  1. Run: simplix-boot generated`);
  log(`  2. Run: ./gradlew clean build -x test`);
}

/** Runs `promote` from the command line. */
export function run({ root, positionals, options, output }) {
  promote({
    root,
    entityName: positionals.entityName,
    moduleName: options.module,
    force: options.force,
    adopt: options.adopt,
    skipVersionCheck: options['skip-version-check'],
    log: output.log,
  });
}
