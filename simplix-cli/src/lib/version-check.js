import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { style, symbols } from './console.js';
import { CliError } from './errors.js';
import { CONFIG_FILE_NAME } from './project.js';
import {
  compareReleaseVersions,
  getGeneratorPackageName,
  getGeneratorVersion,
  getReleaseTag,
  isSnapshotVersion,
  toReleaseVersion,
} from './version-utils.js';

const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const NPM_LOOKUP_TIMEOUT_MS = 15000;

/**
 * Version of the CLI this project is built against, as recorded in
 * project configuration under `generator.version`. Null when not recorded.
 */
export function readRequiredVersion(config) {
  const recorded = config?.generator?.version;
  return typeof recorded === 'string' && recorded.trim() !== '' ? recorded.trim() : null;
}

const GENERATOR_VERSION_FIELD = /("generator"\s*:\s*\{[^{}]*?"version"\s*:\s*)"[^"]*"/;
const GENERATOR_BLOCK_OPEN = /"generator"\s*:\s*\{/;

/**
 * Write `generator.version` into the project configuration file.
 * The surrounding text is preserved byte for byte so recording a version never
 * reformats a configuration file the project maintains by hand.
 */
export function recordGeneratorVersion(configPath, version) {
  const raw = fs.readFileSync(configPath, 'utf8');

  if (GENERATOR_VERSION_FIELD.test(raw)) {
    fs.writeFileSync(configPath, raw.replace(GENERATOR_VERSION_FIELD, `$1"${version}"`));
    return;
  }

  if (GENERATOR_BLOCK_OPEN.test(raw)) {
    fs.writeFileSync(
      configPath,
      raw.replace(GENERATOR_BLOCK_OPEN, match => `${match}\n    "version": "${version}",`)
    );
    return;
  }

  const objectOpen = raw.indexOf('{');
  if (objectOpen === -1) {
    throw new CliError(`${CONFIG_FILE_NAME} is not a JSON object`);
  }

  const inserted = `${raw.slice(0, objectOpen + 1)}\n  "generator": {\n    "version": "${version}"\n  },${raw.slice(objectOpen + 1)}`;
  fs.writeFileSync(configPath, inserted);
}

/**
 * Latest version of this build's release line published to the npm registry, or null when the
 * registry cannot be reached or the line has never been published.
 */
export function fetchLatestPublishedVersion(packageName = getGeneratorPackageName(), releaseTag = getReleaseTag()) {
  let output;
  try {
    output = execFileSync(NPM_BIN, ['view', `${packageName}@${releaseTag}`, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: NPM_LOOKUP_TIMEOUT_MS,
    });
  } catch (error) {
    // npm exits non-zero for an unpublished package and an unreachable registry, is killed at the
    // timeout, and is absent on a machine without it. Each of those is "no answer".
    if (typeof error.status === 'number' || error.signal || error.code === 'ENOENT' || error.code === 'ETIMEDOUT') {
      return null;
    }

    throw error;
  }

  const version = output.trim();
  return version === '' ? null : version;
}

/**
 * Install a published version globally. Output streams to the terminal so the
 * caller sees npm's own progress and failures.
 */
export function installGeneratorVersion(version, packageName = getGeneratorPackageName()) {
  execFileSync(NPM_BIN, ['install', '-g', `${packageName}@${version}`], { stdio: 'inherit' });
}

/**
 * Refuse to generate when the running CLI is older than the version the
 * project is built against. Templates and configuration keys move together,
 * so an older CLI silently produces code the project no longer expects.
 *
 * A newer CLI is allowed and only reports the drift, and a project that
 * records no version is left alone beyond a one-line notice.
 *
 * @param {object} check
 * @param {object} [check.config] the parsed project configuration
 * @param {(message: string) => void} check.log where the notices go
 * @param {boolean} [check.skip] whether the check is skipped for this run
 * @throws {CliError} when the running CLI is older than the project requires
 */
export function assertGeneratorVersion({ config, log, skip = false }) {
  if (skip) {
    return;
  }

  const current = getGeneratorVersion();
  const required = readRequiredVersion(config);

  if (!required) {
    log(
      `${symbols.info} This project records no generator version. Run ${style.cyan('simplix-boot version --write')} to pin it to ${toReleaseVersion(current)}.`
    );
    return;
  }

  const comparison = compareReleaseVersions(current, required);

  if (comparison === null) {
    log(`${symbols.warning} Cannot compare generator version ${current} with the required version ${required}.`);
    return;
  }

  if (comparison > 0) {
    log(
      `${symbols.warning} Generator ${current} is newer than the version this project records (${required}). Run ${style.cyan('simplix-boot version --write')} to update it.`
    );
    return;
  }

  if (comparison === 0) {
    return;
  }

  const packageName = getGeneratorPackageName();
  const latest = fetchLatestPublishedVersion(packageName);
  const target = latest && compareReleaseVersions(latest, required) >= 0 ? latest : required;

  throw new CliError(
    [
      `Generator ${style.red(current)} is older than the version this project requires (${style.cyan(required)}).`,
      `  latest on npm: ${latest ? style.cyan(latest) : `${style.yellow('lookup failed')}: check the registry connection`}`,
      `  update: ${style.cyan(`npm install -g ${packageName}@${target}`)}`,
      `  or:     ${style.cyan('simplix-boot version --update')}`,
      `  skip:   rerun with ${style.cyan('--skip-version-check')}`,
    ].join('\n')
  );
}

function describeStatus(current, required) {
  if (required === null) {
    return 'unrecorded';
  }

  const comparison = compareReleaseVersions(current, required);

  if (comparison === null) {
    return 'unknown';
  }

  if (comparison < 0) {
    return 'outdated';
  }

  if (comparison > 0) {
    return 'ahead';
  }

  return 'match';
}

/**
 * Current / required / latest triple, for reporting and for machine-readable
 * output. `latest` is only looked up when `includeLatest` is set, because the
 * lookup costs a registry round trip.
 */
export function collectVersionStatus({ config, includeLatest = false }) {
  const current = getGeneratorVersion();
  const required = readRequiredVersion(config);

  return {
    packageName: getGeneratorPackageName(),
    current,
    snapshot: isSnapshotVersion(current),
    required,
    latest: includeLatest ? fetchLatestPublishedVersion() : null,
    status: describeStatus(current, required),
  };
}
