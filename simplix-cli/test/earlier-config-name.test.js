import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  CONFIG_FILE_NAME,
  EARLIER_CONFIG_FILE_NAME,
  earlierConfigNotice,
  findConfigFile,
  readProjectConfig,
} from '../src/lib/project.js';
import { EXPECTED_DIR, copyFixture, read, runCli } from './support/fixture.js';

const CURRENT = `.simplix/${CONFIG_FILE_NAME}`;
const EARLIER = `.simplix/${EARLIER_CONFIG_FILE_NAME}`;

describe('the configuration file of a project', () => {
  let root;

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-boot-config-name-')));
    fs.mkdirSync(path.join(root, '.simplix'));
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  const put = (relativePath, config) => fs.writeFileSync(path.join(root, relativePath), JSON.stringify(config));

  it('is the file of the current name, with nothing to tell', () => {
    put(CURRENT, { from: 'current' });

    assert.deepStrictEqual(findConfigFile(root), { path: path.join(root, CURRENT), name: CONFIG_FILE_NAME, earlier: false });
    assert.deepStrictEqual(readProjectConfig(root), { from: 'current' });
    assert.strictEqual(earlierConfigNotice(root), undefined);
  });

  it('is the file of the earlier name when no file of the current name exists', () => {
    put(EARLIER, { from: 'earlier' });

    assert.deepStrictEqual(findConfigFile(root), { path: path.join(root, EARLIER), name: EARLIER_CONFIG_FILE_NAME, earlier: true });
    assert.deepStrictEqual(readProjectConfig(root), { from: 'earlier' });
    assert.strictEqual(
      earlierConfigNotice(root),
      `${EARLIER} is the earlier name of the configuration file. Rename it to ${CURRENT}.`
    );
  });

  it('is the file of the current name when both exist, and says the earlier one is not read', () => {
    put(CURRENT, { from: 'current' });
    put(EARLIER, { from: 'earlier' });

    assert.strictEqual(findConfigFile(root).earlier, false);
    assert.deepStrictEqual(readProjectConfig(root), { from: 'current' });
    assert.strictEqual(earlierConfigNotice(root), `${EARLIER} is not read: ${CURRENT} is the configuration file. Delete ${EARLIER}.`);
  });

  it('names the file it read when that file is not JSON', () => {
    fs.writeFileSync(path.join(root, EARLIER), '{ "target": ');

    assert.throws(() => readProjectConfig(root), { name: 'CliError', message: /^Failed to parse generator-simplix\.json: / });
  });

  it('is absent from a project that has neither file', () => {
    assert.strictEqual(findConfigFile(root), undefined);
    assert.strictEqual(readProjectConfig(root), undefined);
    assert.strictEqual(earlierConfigNotice(root), undefined);
  });
});

describe('a project whose configuration file has the earlier name', () => {
  let root;

  beforeEach(() => {
    root = copyFixture('library');
    fs.renameSync(path.join(root, CURRENT), path.join(root, EARLIER));
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('generates what a project with the current name generates, and is told to rename the file', () => {
    const result = runCli(['generate', 'Author'], root);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stderr, /\.simplix\/generator-simplix\.json is the earlier name of the configuration file\. Rename it to \.simplix\/simplix-boot\.json\./);
    const service = 'generated/main/java/com/example/library/web/catalog/service/AuthorService.java';
    assert.strictEqual(read(root, service), read(EXPECTED_DIR, service));
  });

  it('keeps a result on standard output whole', () => {
    const result = runCli(['version', '--json'], root);

    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout.trim().split('\n').length, 1);
    assert.strictEqual(JSON.parse(result.stdout).configPath, path.join(root, EARLIER));
    assert.match(result.stderr, /is the earlier name of the configuration file/);
  });

  it('is moved to the current name by version --write, with its content kept', () => {
    const before = JSON.parse(read(root, EARLIER));

    const result = runCli(['version', '--write'], root);

    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Renamed \.simplix\/generator-simplix\.json to \.simplix\/simplix-boot\.json/);
    assert.ok(!fs.existsSync(path.join(root, EARLIER)));
    const { generator, ...rest } = JSON.parse(read(root, CURRENT));
    assert.ok(generator.version);
    assert.deepStrictEqual(rest, before);

    const next = runCli(['generate', 'Author'], root);
    assert.strictEqual(next.status, 0, next.stdout + next.stderr);
    assert.strictEqual(next.stderr, '');
  });

  it('is not read once a file of the current name stands beside it', () => {
    fs.copyFileSync(path.join(root, EARLIER), path.join(root, CURRENT));
    fs.writeFileSync(path.join(root, EARLIER), '{ "target": ');

    const result = runCli(['generate', 'Author'], root);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stderr, /\.simplix\/generator-simplix\.json is not read: \.simplix\/simplix-boot\.json is the configuration file\./);
  });
});
