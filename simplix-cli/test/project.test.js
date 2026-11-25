import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  findProjectRoot,
  listEntityNames,
  readEntityConfig,
  readProjectConfig,
  requireProjectConfig,
  requireProjectRoot,
} from '../src/lib/project.js';

describe('the project a command runs in', () => {
  let outside;
  let root;

  before(() => {
    outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-boot-project-')));
    root = path.join(outside, 'app');
    fs.mkdirSync(path.join(root, '.simplix', 'entity'), { recursive: true });
    fs.mkdirSync(path.join(root, 'modules', 'domain', 'src'), { recursive: true });
    fs.writeFileSync(path.join(root, '.simplix', 'entity', 'Zebra.yml'), 'entity: Zebra\nmodulePath: zoo\n');
    fs.writeFileSync(path.join(root, '.simplix', 'entity', 'Ant.yml'), 'entity: Ant\n');
    fs.writeFileSync(path.join(root, '.simplix', 'entity', 'notes.txt'), 'not a yml');
  });

  after(() => fs.rmSync(outside, { recursive: true, force: true }));

  it('is the directory holding .simplix, found from the directory itself and from below it', () => {
    assert.strictEqual(findProjectRoot(root), root);
    assert.strictEqual(findProjectRoot(path.join(root, 'modules', 'domain', 'src')), root);
  });

  it('is not found from above the project', () => {
    assert.notStrictEqual(findProjectRoot(outside), root);
    assert.throws(() => requireProjectRoot(path.parse(outside).root), { name: 'CliError', message: /\.simplix directory is missing/ });
  });

  it('is not a file that happens to be named .simplix', () => {
    const decoy = path.join(outside, 'decoy');
    fs.mkdirSync(decoy);
    fs.writeFileSync(path.join(decoy, '.simplix'), '');

    assert.notStrictEqual(findProjectRoot(decoy), decoy);
  });

  it('lists the entity ymls by name, sorted, and nothing else in the folder', () => {
    assert.deepStrictEqual(listEntityNames(root), ['Ant', 'Zebra']);
    assert.deepStrictEqual(listEntityNames(outside), []);
  });

  it('reads an entity yml, and answers undefined for one that does not exist', () => {
    assert.deepStrictEqual(readEntityConfig(root, 'Zebra'), { entity: 'Zebra', modulePath: 'zoo' });
    assert.strictEqual(readEntityConfig(root, 'Lion'), undefined);
  });

  it('refuses an entity yml that is not YAML, naming it', () => {
    fs.writeFileSync(path.join(root, '.simplix', 'entity', 'Broken.yml'), 'fields: [unclosed\n');

    assert.throws(() => readEntityConfig(root, 'Broken'), { name: 'CliError', message: /^Failed to read Broken\.yml: / });
    fs.rmSync(path.join(root, '.simplix', 'entity', 'Broken.yml'));
  });

  it('answers undefined for a missing configuration, and refuses it where a command needs one', () => {
    assert.strictEqual(readProjectConfig(root), undefined);
    assert.throws(() => requireProjectConfig(root), { name: 'CliError', message: /simplix-boot\.json not found/ });
  });

  it('reads the configuration, and refuses one that is not JSON', () => {
    const configPath = path.join(root, '.simplix', 'simplix-boot.json');

    fs.writeFileSync(configPath, '{ "target": { "basePackage": "dev.example" } }');
    assert.deepStrictEqual(requireProjectConfig(root), { target: { basePackage: 'dev.example' } });

    fs.writeFileSync(configPath, '{ "target": ');
    assert.throws(() => readProjectConfig(root), { name: 'CliError', message: /^Failed to parse simplix-boot\.json: / });
  });
});
