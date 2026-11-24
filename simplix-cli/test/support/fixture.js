import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** The fixture projects, each a small project the CLI is run against. */
export const FIXTURES_DIR = path.join(here, '..', 'fixtures');

/** What the CLI is expected to write for the fixture projects. */
export const EXPECTED_DIR = path.join(FIXTURES_DIR, 'expected');

const CLI = path.join(here, '..', '..', 'bin', 'simplix-boot.js');

/**
 * Copies a fixture project into a fresh temporary directory.
 *
 * @param {string} name the fixture's folder name
 * @returns {string} the copy's root
 */
export function copyFixture(name) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `simplix-boot-${name}-`)));
  fs.cpSync(path.join(FIXTURES_DIR, name), root, { recursive: true });
  return root;
}

/**
 * Runs the CLI as a user would, in its own process.
 *
 * @param {string[]} args the arguments after the executable
 * @param {string} cwd the directory the command is run in
 * @returns {{ status: number | null, stdout: string, stderr: string }}
 */
export function runCli(args, cwd) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', npm_config_offline: 'true' },
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/**
 * Every file under a directory, as paths relative to it with forward slashes, sorted.
 *
 * @param {string} dir the directory
 * @returns {string[]}
 */
export function listFiles(dir) {
  const found = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else found.push(path.relative(dir, full).split(path.sep).join('/'));
    }
  };

  if (fs.existsSync(dir)) walk(dir);
  return found.sort();
}

/** Reads a file of a project by its path relative to the root. */
export function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

/** Writes a file of a project by its path relative to the root, creating its folder. */
export function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

/** Rewrites the project configuration of a fixture copy through a function over its parsed form. */
export function editConfig(root, change) {
  const relativePath = '.simplix/generator-simplix.json';
  const config = JSON.parse(read(root, relativePath));
  change(config);
  write(root, relativePath, `${JSON.stringify(config, null, 2)}\n`);
}
