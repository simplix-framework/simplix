import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { copyFixture, listFiles, read, runCli, runCliUnread } from './support/fixture.js';

const packageJson = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));

describe('the command line', () => {
  let empty;

  before(() => {
    empty = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-boot-cli-')));
  });

  after(() => fs.rmSync(empty, { recursive: true, force: true }));

  it('prints the help, with every command, when run with no argument', () => {
    const result = runCli([], empty);

    assert.strictEqual(result.status, 0);
    for (const command of ['init', 'config', 'generate', 'promote', 'generated', 'templates', 'version']) {
      assert.match(result.stdout, new RegExp(`^  ${command} +\\S`, 'm'));
    }
  });

  it('prints its version', () => {
    assert.strictEqual(runCli(['--version'], empty).stdout, `${packageJson.version}\n`);
  });

  it('prints the usage and the options of one command', () => {
    const result = runCli(['promote', '--help'], empty);

    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /simplix-boot promote <EntityName> --module <module>/);
    assert.match(result.stdout, /^  --module <value>$/m);
    assert.match(result.stdout, /^  --adopt$/m);
  });

  it('refuses an unknown command on standard error', () => {
    const result = runCli(['generat', 'Book'], empty);

    assert.strictEqual(result.status, 1);
    assert.strictEqual(result.stdout, '');
    assert.match(result.stderr, /Unknown command: generat/);
  });

  it('refuses a command that needs a project when run outside one', () => {
    const result = runCli(['generate', 'Book'], empty);

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /\.simplix directory is missing\. Run "simplix-boot init"/);
  });

  it('answers the old name of generate', () => {
    const root = copyFixture('library');
    try {
      const result = runCli(['entity', 'Author'], root);

      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, /Successfully generated CRUD files for Author/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('finishes its work and keeps its exit code when nothing reads its output', async () => {
    const root = copyFixture('library');
    try {
      const result = await runCliUnread(['generate', 'Author'], root);

      assert.strictEqual(result.stderr, '');
      assert.strictEqual(result.status, 0);
      assert.deepStrictEqual(listFiles(path.join(root, 'generated')), [
        'main/java/com/example/library/web/catalog/controller/AuthorRestController.java',
        'main/java/com/example/library/web/catalog/dto/AuthorDTOs.java',
        'main/java/com/example/library/web/catalog/service/AuthorService.java',
        'test/java/com/example/library/web/catalog/service/AuthorServiceTest.java',
      ]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('init', () => {
  let root;

  before(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-boot-init-')));
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('creates the entity and template folders, and nothing else', () => {
    const result = runCli(['init'], root);

    assert.strictEqual(result.status, 0, result.stderr);
    assert.deepStrictEqual(listFiles(root), ['.simplix/entity/.gitkeep', '.simplix/templates/.gitkeep']);
  });

  it('leaves an existing .simplix as it is', () => {
    fs.writeFileSync(path.join(root, '.simplix', 'entity', 'Book.yml'), 'entity: Book\n');

    const result = runCli(['init'], root);

    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /\.simplix folder already exists/);
    assert.strictEqual(read(root, '.simplix/entity/Book.yml'), 'entity: Book\n');
  });
});

describe('version', () => {
  let root;

  before(() => {
    root = copyFixture('library');
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('reports an unrecorded project as one JSON line', () => {
    const result = runCli(['version', '--json'], root);
    const report = JSON.parse(result.stdout);

    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout.trim().split('\n').length, 1);
    assert.strictEqual(report.packageName, '@simplix-boot/cli');
    assert.strictEqual(report.current, packageJson.version);
    assert.strictEqual(report.required, null);
    assert.strictEqual(report.status, 'unrecorded');
    assert.strictEqual(report.configPath, path.join(root, '.simplix', 'simplix-boot.json'));
  });

  it('records the release it belongs to in the configuration, and then matches it', () => {
    const release = packageJson.version.replace(/-.*$/, '');

    assert.strictEqual(runCli(['version', '--write'], root).status, 0);
    assert.strictEqual(JSON.parse(read(root, '.simplix/simplix-boot.json')).generator.version, release);

    const report = JSON.parse(runCli(['version', '--json'], root).stdout);
    assert.strictEqual(report.required, release);
    assert.strictEqual(report.status, 'match');
  });

  it('stops a generating command when the project requires a newer CLI, and runs it with the skip flag', () => {
    const configPath = path.join(root, '.simplix', 'simplix-boot.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.generator.version = '999.0.0';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const stopped = runCli(['generate', 'Author'], root);
    assert.strictEqual(stopped.status, 1);
    assert.match(stopped.stderr, /is older than the version this project requires \(999\.0\.0\)/);
    assert.deepStrictEqual(listFiles(path.join(root, 'generated')), []);

    assert.strictEqual(runCli(['generate', 'Author', '--skip-version-check'], root).status, 0);
  });

  it('asks npm for the newest version under the dist-tag of its own release line', { skip: process.platform === 'win32' }, () => {
    const bin = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-boot-npm-')));
    try {
      const asked = path.join(bin, 'asked');
      fs.writeFileSync(path.join(bin, 'npm'), `#!/bin/sh\necho "$@" > "${asked}"\necho 9.9.9\n`, { mode: 0o755 });

      const result = runCli(['version', '--json'], root, { PATH: `${bin}${path.delimiter}${process.env.PATH}` });

      assert.strictEqual(result.status, 0, result.stderr);
      assert.strictEqual(fs.readFileSync(asked, 'utf8'), `view @simplix-boot/cli@${packageJson.publishConfig.tag} version\n`);
      assert.strictEqual(JSON.parse(result.stdout).latest, '9.9.9');
    } finally {
      fs.rmSync(bin, { recursive: true, force: true });
    }
  });

  it('refuses --to without --update, and a target that is not a version', () => {
    assert.match(runCli(['version', '--to', '1.2.3'], root).stderr, /--to is only used with --update/);
    assert.match(runCli(['version', '--update', '--to', 'latest'], root).stderr, /"latest" is not an X\.Y\.Z version/);
  });
});

describe('the package version', () => {
  it('is the version the framework build declares', t => {
    const buildFile = fileURLToPath(new URL('../../build.gradle', import.meta.url));
    if (!fs.existsSync(buildFile)) {
      t.skip('the framework build file is not beside the package');
      return;
    }

    const declared = /projectVersion = '([^']+)'/.exec(fs.readFileSync(buildFile, 'utf8'));

    assert.ok(declared, 'build.gradle no longer declares projectVersion in the form this test reads');
    assert.strictEqual(packageJson.version, declared[1]);
  });
});
