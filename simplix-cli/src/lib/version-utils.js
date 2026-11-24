import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

let cachedPackageJson;

function readOwnPackageJson() {
  if (cachedPackageJson) {
    return cachedPackageJson;
  }

  try {
    cachedPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.error('Failed to read package.json:', error.message);
    cachedPackageJson = {};
  }

  return cachedPackageJson;
}

export function getGeneratorVersion() {
  return readOwnPackageJson().version || '0.0.0';
}

export function getGeneratorPackageName() {
  return readOwnPackageJson().name || '@simplix-boot/cli';
}

/**
 * The npm dist-tag this build's release line is published under. Each release line publishes
 * under its own tag, so the newest version of one line is never offered to a project on another.
 */
export function getReleaseTag() {
  return readOwnPackageJson().publishConfig?.tag || 'latest';
}

/**
 * Development builds carry a -SNAPSHOT suffix; released builds never do.
 */
export function isSnapshotVersion(version) {
  return typeof version === 'string' && version.endsWith('-SNAPSHOT');
}

/**
 * Parse the release core of a version into [major, minor, patch].
 * Any pre-release suffix (-SNAPSHOT, -rc.1) is dropped: a project pinned to
 * 1.2.0 is satisfied by 1.2.0-SNAPSHOT, so local development against an
 * unreleased build is never blocked by its own suffix.
 *
 * Returns null when the string is not an X.Y.Z version.
 */
export function parseReleaseCore(version) {
  if (typeof version !== 'string') {
    return null;
  }

  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version.trim());
  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * The X.Y.Z a version belongs to, with any pre-release suffix removed.
 * A project records this rather than the running build, so a development
 * generator pins the release line it belongs to and not `1.0.0-SNAPSHOT`.
 */
export function toReleaseVersion(version) {
  const core = parseReleaseCore(version);
  return core ? core.join('.') : version;
}

/**
 * Compare two versions by release core only.
 * Returns -1, 0 or 1, or null when either side cannot be parsed.
 */
export function compareReleaseVersions(a, b) {
  const left = parseReleaseCore(a);
  const right = parseReleaseCore(b);

  if (!left || !right) {
    return null;
  }

  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) {
      return left[i] < right[i] ? -1 : 1;
    }
  }

  return 0;
}
