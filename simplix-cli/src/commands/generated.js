import fs from 'node:fs';
import path from 'node:path';
import { CliError } from '../lib/errors.js';
import { listEntityNames, readEntityConfig, requireProjectConfig } from '../lib/project.js';
import { findPromotedModule, promoteFiles } from '../lib/promote-files.js';
import { isUntouched, planTracked, readBase, stampRender } from '../lib/tracked-render.js';
import { generate } from './generate.js';

export const usage = 'simplix-boot generated [--no-render] [--json]';

export const summary = 'Report the state of every promoted file against its base and the current templates';

export const argumentSpec = {
  positionals: [],
  options: {
    render: { type: 'boolean', default: true },
    json: { type: 'boolean', default: false },
  },
};

/**
 * The states that fail the report: a promote would rewrite the file, would collide with its
 * edits, or cannot merge into it at all.
 */
export const FAILING_STATES = ['stale', 'conflict', 'no-base'];

/**
 * Judges one promoted file against its stored base and the current templates.
 *
 * - `untouched`: still exactly the render promote laid down, and what it would lay down now
 * - `edited`: changed since it was laid down; the current render merges into it cleanly
 * - `stale`: untouched, but the current render differs; a promote would rewrite it
 * - `conflict`: edited, and the current render collides with the edits
 * - `no-base`: present with no stored base, so no later template change can be merged into it
 * - `removed`: a base is stored and the file is gone
 * - `absent`: neither a file nor a base
 *
 * @param {string} root the project root
 * @param {string} dest the promoted file
 * @param {string|undefined} fresh the current render, stamped, or undefined when not rendered
 * @returns {string} the state
 */
export function judgePromoted(root, dest, fresh) {
  const base = readBase(root, dest);
  if (!fs.existsSync(dest)) return base === undefined ? 'absent' : 'removed';
  if (base === undefined) return 'no-base';
  const held = fs.readFileSync(dest, 'utf8');
  if (isUntouched(held)) return fresh === undefined || fresh === held ? 'untouched' : 'stale';
  if (fresh === undefined) return 'edited';
  return planTracked(root, dest, fresh).outcome === 'conflict' ? 'conflict' : 'edited';
}

/**
 * Collects the state of every promoted file of a project. With `render`, each promoted entity is
 * generated again first (into the generated tree), so a stale file and a conflicting merge are
 * found before a promote meets them.
 *
 * @param {object} report
 * @param {string} report.root the project root
 * @param {boolean} [report.render] whether every promoted entity is rendered before it is judged
 * @returns {{ files: { path: string, entity: string, state: string }[], counts: Record<string, number> }}
 * @throws {CliError} when an entity fails to render, so no state can be judged
 */
export function collectGeneratedState({ root, render = true }) {
  const config = requireProjectConfig(root);
  const files = [];

  for (const entityName of listEntityNames(root)) {
    const entityConfig = readEntityConfig(root, entityName);
    const moduleName = findPromotedModule(root, config, entityName, entityConfig);

    if (moduleName === undefined) continue;

    if (render) renderEntity(root, entityName);

    const origin = `promote ${entityName} --module ${moduleName}`;

    for (const file of promoteFiles({ root, config, entityName, entityConfig, moduleName })) {
      const fresh =
        render && fs.existsSync(file.src) ? stampRender(fs.readFileSync(file.src, 'utf8'), origin) : undefined;
      const state = judgePromoted(root, file.dest, fresh);

      if (state !== 'absent') files.push({ path: path.relative(root, file.dest), entity: entityName, state });
    }
  }

  const counts = {};
  for (const file of files) counts[file.state] = (counts[file.state] ?? 0) + 1;

  return { files, counts };
}

function renderEntity(root, entityName) {
  const lines = [];

  try {
    generate({ root, entityName, force: true, skipVersionCheck: true, log: message => lines.push(message ?? '') });
  } catch (error) {
    if (!(error instanceof CliError)) throw error;
    const tail = [...lines.join('\n').trim().split('\n').slice(-3), error.message].join('\n');
    throw new CliError(`Rendering ${entityName} failed, so no state can be judged:\n${tail}`);
  }
}

/** Runs `generated` from the command line. */
export function run({ root, options, output }) {
  const { files, counts } = collectGeneratedState({ root, render: options.render });

  if (options.json) {
    output.result(JSON.stringify({ files, counts }));
  } else {
    for (const file of files) output.log(`${file.state.padEnd(10)} ${file.path}`);
    output.log(
      `\n${Object.entries(counts)
        .map(([state, count]) => `${state} ${count}`)
        .join(' · ')}`
    );
  }

  if (files.some(file => FAILING_STATES.includes(file.state))) {
    return 1;
  }

  return 0;
}
