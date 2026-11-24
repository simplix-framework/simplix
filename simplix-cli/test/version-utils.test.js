import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compareReleaseVersions, isSnapshotVersion, parseReleaseCore } from '../src/lib/version-utils.js';

describe('parseReleaseCore', () => {
  it('parses a release version', () => {
    assert.deepStrictEqual(parseReleaseCore('1.2.3'), [1, 2, 3]);
  });

  it('drops the pre-release suffix', () => {
    assert.deepStrictEqual(parseReleaseCore('1.2.3-SNAPSHOT'), [1, 2, 3]);
    assert.deepStrictEqual(parseReleaseCore('1.2.3-rc.1'), [1, 2, 3]);
  });

  it('returns null for anything that is not X.Y.Z', () => {
    assert.strictEqual(parseReleaseCore('1.2'), null);
    assert.strictEqual(parseReleaseCore('latest'), null);
    assert.strictEqual(parseReleaseCore(''), null);
    assert.strictEqual(parseReleaseCore(undefined), null);
  });
});

describe('compareReleaseVersions', () => {
  it('orders by major, minor and patch', () => {
    assert.strictEqual(compareReleaseVersions('1.0.0', '2.0.0'), -1);
    assert.strictEqual(compareReleaseVersions('1.3.0', '1.2.9'), 1);
    assert.strictEqual(compareReleaseVersions('1.2.10', '1.2.9'), 1);
    assert.strictEqual(compareReleaseVersions('1.2.3', '1.2.3'), 0);
  });

  it('treats a SNAPSHOT as equal to the release it precedes', () => {
    assert.strictEqual(compareReleaseVersions('1.2.0-SNAPSHOT', '1.2.0'), 0);
    assert.strictEqual(compareReleaseVersions('1.2.0-SNAPSHOT', '1.3.0'), -1);
  });

  it('returns null when either side cannot be parsed', () => {
    assert.strictEqual(compareReleaseVersions('1.2.3', 'unknown'), null);
    assert.strictEqual(compareReleaseVersions(null, '1.2.3'), null);
  });
});

describe('isSnapshotVersion', () => {
  it('recognises development builds', () => {
    assert.strictEqual(isSnapshotVersion('1.0.0-SNAPSHOT'), true);
    assert.strictEqual(isSnapshotVersion('1.0.0'), false);
    assert.strictEqual(isSnapshotVersion(undefined), false);
  });
});
