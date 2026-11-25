import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertGeneratorVersion,
  collectVersionStatus,
  readRequiredVersion,
  recordGeneratorVersion,
} from '../src/lib/version-check.js';
import { getGeneratorVersion } from '../src/lib/version-utils.js';

let workDir;
let registryLookup;

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-version-'));
  // The refusal looks the latest version up through npm. Offline mode makes that lookup answer
  // at once without a network, which is the "lookup failed" branch these tests read.
  registryLookup = process.env.npm_config_offline;
  process.env.npm_config_offline = 'true';
});

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
  if (registryLookup === undefined) delete process.env.npm_config_offline;
  else process.env.npm_config_offline = registryLookup;
});

function writeConfig(contents) {
  const configPath = path.join(workDir, 'simplix-boot.json');
  fs.writeFileSync(configPath, contents);
  return configPath;
}

describe('readRequiredVersion', () => {
  it('reads generator.version', () => {
    assert.strictEqual(readRequiredVersion({ generator: { version: '1.4.0' } }), '1.4.0');
  });

  it('returns null when the version is absent or blank', () => {
    assert.strictEqual(readRequiredVersion({}), null);
    assert.strictEqual(readRequiredVersion({ generator: {} }), null);
    assert.strictEqual(readRequiredVersion({ generator: { version: '  ' } }), null);
    assert.strictEqual(readRequiredVersion(null), null);
  });
});

describe('recordGeneratorVersion', () => {
  it('inserts a generator block when none exists', () => {
    const configPath = writeConfig('{\n  "target": {\n    "basePackage": "dev.example"\n  }\n}\n');

    recordGeneratorVersion(configPath, '1.4.0');

    const written = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.strictEqual(written.generator.version, '1.4.0');
    assert.strictEqual(written.target.basePackage, 'dev.example');
  });

  it('replaces an existing version in place', () => {
    const configPath = writeConfig('{\n  "generator": {\n    "version": "1.0.0"\n  },\n  "a": 1\n}\n');

    recordGeneratorVersion(configPath, '2.1.0');

    assert.strictEqual(fs.readFileSync(configPath, 'utf8'), '{\n  "generator": {\n    "version": "2.1.0"\n  },\n  "a": 1\n}\n');
  });

  it('adds a version to an existing generator block', () => {
    const configPath = writeConfig('{\n  "generator": {\n    "channel": "stable"\n  }\n}\n');

    recordGeneratorVersion(configPath, '1.4.0');

    const written = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.deepStrictEqual(written.generator, { version: '1.4.0', channel: 'stable' });
  });

  it('leaves every other value untouched', () => {
    const configPath = writeConfig('{\n  "dto": {\n    "excludeFields": ["version", "deletedAt"]\n  }\n}\n');

    recordGeneratorVersion(configPath, '1.4.0');

    const written = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.deepStrictEqual(written.dto.excludeFields, ['version', 'deletedAt']);
    assert.strictEqual(written.generator.version, '1.4.0');
  });
});

describe('assertGeneratorVersion', () => {
  const collectLog = () => {
    const lines = [];
    return { lines, log: message => lines.push(message) };
  };

  it('passes when the running version matches', () => {
    const { lines, log } = collectLog();

    assert.doesNotThrow(() =>
      assertGeneratorVersion({ config: { generator: { version: getGeneratorVersion() } }, log }));
    assert.strictEqual(lines.length, 0);
  });

  it('throws when the running version is older', () => {
    const { log } = collectLog();

    assert.throws(() => assertGeneratorVersion({ config: { generator: { version: '999.0.0' } }, log }), { message: /older than the version this project requires/ });
  });

  it('carries the update guidance in the error message', () => {
    const { log } = collectLog();

    assert.throws(() => assertGeneratorVersion({ config: { generator: { version: '999.0.0' } }, log }), { message: /npm install -g @simplix-boot\/cli@999\.0\.0/ });
  });

  it('does not throw when the check is skipped', () => {
    const { lines, log } = collectLog();

    assert.doesNotThrow(() =>
      assertGeneratorVersion({ config: { generator: { version: '999.0.0' } }, log, skip: true }));
    assert.strictEqual(lines.length, 0);
  });

  it('only reports drift when the running version is newer', () => {
    const { lines, log } = collectLog();

    assert.doesNotThrow(() => assertGeneratorVersion({ config: { generator: { version: '0.0.1' } }, log }));
    assert.match(lines.join('\n'), /newer than the version this project records/);
  });

  it('only reports when no version is recorded', () => {
    const { lines, log } = collectLog();

    assert.doesNotThrow(() => assertGeneratorVersion({ config: {}, log }));
    assert.match(lines.join('\n'), /records no generator version/);
  });
});

describe('collectVersionStatus', () => {
  it('reports the comparison without touching the registry', () => {
    const status = collectVersionStatus({ config: { generator: { version: '999.0.0' } } });

    assert.strictEqual(status.packageName, '@simplix-boot/cli');
    assert.strictEqual(status.required, '999.0.0');
    assert.strictEqual(status.latest, null);
    assert.strictEqual(status.status, 'outdated');
  });

  it('reports an unrecorded version', () => {
    assert.strictEqual(collectVersionStatus({ config: {} }).status, 'unrecorded');
  });
});
