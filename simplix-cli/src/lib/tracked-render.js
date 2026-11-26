import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** The marker line every promoted file opens with. */
export const GENERATED_MARKER = '@simplix-generated';

/** The line under the marker carrying the render fingerprint and the command that laid it down. */
export const RENDER_MARKER = '@simplix-render';

/**
 * The committed folder that holds, per promoted file, the exact render promote last wrote for it.
 *
 * <p>That render is the merge base the next promote reads an edited file against. It lives in the
 * project, so a fresh clone merges exactly as the machine that promoted.
 */
export const BASE_DIR = path.join('.simplix', 'bases');

/** Where a conflicting promote writes its merge with markers; inside the git-ignored tree. */
export const CONFLICT_DIR = path.join('generated', 'conflicts');

/**
 * The fingerprint of one render, over everything but the fingerprint line itself.
 *
 * @param {string} source the file's content
 * @returns {string} twelve hex characters
 */
export function renderFingerprint(source) {
  const withoutStamp = source
    .split('\n')
    .filter(line => !line.includes(RENDER_MARKER))
    .join('\n');
  return crypto.createHash('sha256').update(withoutStamp).digest('hex').slice(0, 12);
}

/**
 * Puts the marker and the fingerprint line on top of a fresh render.
 *
 * @param {string} render the generator's output, unstamped
 * @param {string} origin the command arguments that reproduce the render
 * @returns {string} the stamped render
 */
export function stampRender(render, origin) {
  const body = stripStamp(render);
  const marked = `// ${GENERATED_MARKER}\n${body}`;
  return `// ${GENERATED_MARKER}\n// ${RENDER_MARKER} ${renderFingerprint(marked)} ${origin}\n${body}`;
}

/** The content without the marker and fingerprint lines. */
export function stripStamp(source) {
  return source
    .split('\n')
    .filter(line => !line.includes(RENDER_MARKER) && !line.includes(GENERATED_MARKER))
    .join('\n');
}

/**
 * Gives an edited file the stamp lines of a render, so it reads as laid down from that render and
 * keeps every edit.
 */
export function carryStamp(held, render) {
  const stamp = render.split('\n').filter(line => line.includes(GENERATED_MARKER) || line.includes(RENDER_MARKER));
  return [...stamp, stripStamp(held)].join('\n');
}

/** The fingerprint recorded in a file's stamp line, or undefined. */
export function recordedFingerprint(held) {
  const line = held.split('\n').find(one => one.includes(RENDER_MARKER));
  if (line === undefined) return undefined;
  return new RegExp(`${RENDER_MARKER}\\s+([0-9a-f]{12})`).exec(line)?.[1];
}

/** The command arguments recorded after the fingerprint, or undefined. */
export function recordedOrigin(held) {
  const line = held.split('\n').find(one => one.includes(RENDER_MARKER));
  if (line === undefined) return undefined;
  return new RegExp(`${RENDER_MARKER}\\s+[0-9a-f]{12}\\s+(.+)$`).exec(line)?.[1]?.trim();
}

/** Whether a file still holds exactly the render it was stamped as. */
export function isUntouched(held) {
  const recorded = recordedFingerprint(held);
  return recorded !== undefined && recorded === renderFingerprint(held);
}

/** Where the stored base of a promoted file lives, under the project root. */
export function basePathFor(root, filePath) {
  return path.join(root, BASE_DIR, path.relative(root, path.resolve(root, filePath)));
}

/** The stored base of a promoted file, or undefined when none was recorded. */
export function readBase(root, filePath) {
  const at = basePathFor(root, filePath);
  return fs.existsSync(at) ? fs.readFileSync(at, 'utf8') : undefined;
}

/** Stores a stamped render as the merge base of a promoted file. */
export function recordBase(root, filePath, render) {
  writeWithDir(basePathFor(root, filePath), render);
}

function writeWithDir(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

/**
 * A three-way merge of `ours` and `theirs` against `base`, through `git merge-file`.
 *
 * @returns {{ text: string, hunks: string[] }} the merge and each conflicting region with markers
 */
export function mergeThreeWay(base, ours, theirs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-merge-'));
  try {
    const [o, b, t] = ['edited', 'base', 'template'].map(name => path.join(dir, name));
    fs.writeFileSync(o, ours);
    fs.writeFileSync(b, base);
    fs.writeFileSync(t, theirs);
    let text;
    try {
      text = execFileSync('git', ['merge-file', '-p', '-L', 'edited', '-L', 'base', '-L', 'template', o, b, t], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (err) {
      // A positive exit status is the number of conflicts, and stdout still holds the merge.
      if (typeof err.status !== 'number' || err.status < 0 || typeof err.stdout !== 'string') throw err;
      text = err.stdout;
    }

    const hunks = [...text.matchAll(/^<<<<<<< edited\n[\s\S]*?^>>>>>>> template\n?/gm)].map(m => m[0]);
    return { text, hunks };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const SINGLE_IMPORT = /^import (?:static )?[\w.]+\.(\w+);$/;

/**
 * Puts back each import the edited file had and the merge dropped while the merged code still names
 * the imported class or member: a template that stops importing a class cannot see that code
 * written into the file by hand still uses it.
 *
 * @param {string} ours the edited file
 * @param {string} merged the result of the three-way merge
 * @returns {string} the merge with those imports after its last import line
 */
export function keepUsedImports(ours, merged) {
  const mergedLines = merged.split('\n');
  const present = new Set(mergedLines.filter(line => SINGLE_IMPORT.test(line)));
  const code = mergedLines.filter(line => !line.startsWith('import ')).join('\n');
  const dropped = ours.split('\n').filter(line => {
    const name = SINGLE_IMPORT.exec(line)?.[1];
    return name !== undefined && !present.has(line) && new RegExp(`\\b${name}\\b`).test(code);
  });
  if (dropped.length === 0) return merged;
  const lastImport = mergedLines.findLastIndex(line => line.startsWith('import '));
  if (lastImport < 0) return merged;
  mergedLines.splice(lastImport + 1, 0, ...new Set(dropped));
  return mergedLines.join('\n');
}

/**
 * What a promote of one fresh render into one file comes to, without writing anything.
 *
 * - `written`: absent or untouched, so the fresh render goes in as it is
 * - `merged`: edited, and the template change merges into the edits without a conflict
 * - `current`: edited, and the merge changes nothing
 * - `conflict`: edited, and the template change collides with the edits
 * - `no-base`: edited, and no stored base exists to merge against
 * - `removed`: absent while a base is stored, so it was deleted after it was laid down and stays deleted
 *
 * @param {string} root the project root
 * @param {string} filePath the promoted file
 * @param {string} stamped the fresh render, stamped
 * @returns {{ outcome: string, text?: string, hunks?: string[] }}
 */
export function planTracked(root, filePath, stamped) {
  if (!fs.existsSync(filePath)) {
    return readBase(root, filePath) === undefined ? { outcome: 'written', text: stamped } : { outcome: 'removed' };
  }

  const ours = fs.readFileSync(filePath, 'utf8');
  if (isUntouched(ours)) return { outcome: 'written', text: stamped };
  let base = readBase(root, filePath);
  if (base === undefined && recordedFingerprint(ours) === recordedFingerprint(stamped)) base = stamped;
  if (base === undefined) return { outcome: 'no-base' };
  // The stamp lines name the render a file was read against and are not content: every side takes
  // the fresh render's, so a fingerprint that moved never collides with one an edit carried.
  const merge = mergeThreeWay(carryStamp(base, stamped), carryStamp(ours, stamped), stamped);
  const hunks = merge.hunks;
  const text = filePath.endsWith('.java') ? keepUsedImports(ours, merge.text) : merge.text;
  if (hunks.length > 0) return { outcome: 'conflict', text, hunks };
  if (text === ours || text === carryStamp(ours, stamped)) return { outcome: 'current', text: ours };
  return { outcome: 'merged', text };
}

/**
 * Writes one fresh render into a promoted file under the tracked-render rule: laid down when absent,
 * rewritten while untouched, left deleted once removed, merged three-way into the edits once somebody has edited it. A conflict
 * never overwrites the file; its merge with markers goes to {@link CONFLICT_DIR}.
 *
 * @returns {{ outcome: string, report?: string, hunks?: string[] }}
 */
export function writeTracked(root, filePath, stamped) {
  const plan = planTracked(root, filePath, stamped);
  switch (plan.outcome) {
    case 'written':
    case 'merged':
      writeWithDir(filePath, plan.text);
      recordBase(root, filePath, stamped);
      return { outcome: plan.outcome };
    case 'current':
      recordBase(root, filePath, stamped);
      return { outcome: 'current' };
    case 'conflict': {
      const report = path.join(root, CONFLICT_DIR, `${path.relative(root, path.resolve(root, filePath))}.conflict`);
      writeWithDir(report, plan.text);
      return { outcome: 'conflict', report, hunks: plan.hunks };
    }

    default:
      return { outcome: plan.outcome };
  }
}
