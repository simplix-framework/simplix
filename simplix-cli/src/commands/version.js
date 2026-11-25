import fs from 'node:fs';
import { style, symbols } from '../lib/console.js';
import { CliError } from '../lib/errors.js';
import {
  CONFIG_FILE_NAME,
  EARLIER_CONFIG_FILE_NAME,
  SIMPLIX_DIR,
  configPathOf,
  earlierConfigNotice,
  findConfigFile,
  findProjectRoot,
  readProjectConfig,
} from '../lib/project.js';
import {
  collectVersionStatus,
  fetchLatestPublishedVersion,
  installGeneratorVersion,
  recordGeneratorVersion,
} from '../lib/version-check.js';
import {
  compareReleaseVersions,
  getGeneratorPackageName,
  getGeneratorVersion,
  parseReleaseCore,
  toReleaseVersion,
} from '../lib/version-utils.js';
export const usage = 'simplix-boot version [--json] [--write] [--update [--to <X.Y.Z>]]';

export const summary = 'Report the running, required and latest CLI versions, record or install one';

export const argumentSpec = {
  positionals: [],
  options: {
    json: { type: 'boolean', default: false },
    write: { type: 'boolean', default: false },
    update: { type: 'boolean', default: false },
    to: { type: 'string' },
  },
};

/** `version` reports from anywhere; outside a project it has no recorded version to compare. */
export const needsProject = false;

/** A version npm can install: X.Y.Z with an optional pre-release tag. */
const INSTALLABLE_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function resolveUpdateTarget(requested) {
  if (requested) {
    if (!parseReleaseCore(requested) || !INSTALLABLE_VERSION.test(requested)) {
      throw new CliError(`"${requested}" is not an X.Y.Z version`);
    }

    return requested;
  }

  const latest = fetchLatestPublishedVersion();
  if (!latest) {
    throw new CliError(
      `Cannot resolve the latest published version of ${getGeneratorPackageName()}. Check the registry connection or pass a version with --to.`
    );
  }

  return latest;
}

function reportText(status, configPath, log) {
  log('');
  log(`${style.cyan('SimpliX Boot CLI')} version status\n`);
  log(`  package:  ${status.packageName}`);
  log(`  running:  ${style.bold(status.current)}${status.snapshot ? style.dim(' (development build)') : ''}`);
  log(`  required: ${status.required ?? style.dim('not recorded')}`);
  log(`  latest:   ${status.latest ?? style.dim('lookup failed')}`);
  log(`  config:   ${configPath ?? style.dim('not found')}`);
  log('');

  if (status.status === 'outdated') {
    log(`${symbols.error} The running CLI is older than this project requires.`);
    log(`  run ${style.cyan('simplix-boot version --update')} to install the latest published version.`);
  } else if (status.status === 'ahead') {
    log(`${symbols.warning} The running CLI is newer than this project records.`);
    log(`  run ${style.cyan('simplix-boot version --write')} to record ${toReleaseVersion(status.current)}.`);
  } else if (status.status === 'unrecorded') {
    log(`${symbols.info} This project records no generator version.`);
    log(`  run ${style.cyan('simplix-boot version --write')} to record ${toReleaseVersion(status.current)}.`);
  } else if (status.status === 'unknown') {
    log(`${symbols.warning} The recorded version cannot be compared with the running version.`);
  } else {
    log(`${symbols.success} The running CLI matches this project.`);
  }

  // A development build runs ahead of the registry, so only a genuinely newer
  // published version is worth announcing.
  if (status.latest && compareReleaseVersions(status.latest, status.current) > 0) {
    log(`${symbols.info} npm has ${status.latest} available.`);
  }

  log('');
}

/** Runs `version` from the command line. */
export function run({ cwd, options, output }) {
  const { log } = output;

  if (options.to !== undefined && !options.update) {
    throw new CliError('--to is only used with --update');
  }

  if (options.update) {
    const target = resolveUpdateTarget(options.to);
    const packageName = getGeneratorPackageName();

    log(`Installing ${style.cyan(`${packageName}@${target}`)} globally...`);
    installGeneratorVersion(target, packageName);
    log(`${symbols.success} Installed ${packageName}@${target}. The next ${style.cyan('simplix-boot')} run uses it.`);
    return;
  }

  const root = findProjectRoot(cwd);
  const file = root === undefined ? undefined : findConfigFile(root);
  const configPath = file?.path ?? null;

  if (options.write) {
    if (!file) {
      throw new CliError(
        `${CONFIG_FILE_NAME} not found. Run "simplix-boot init" first and create the configuration file.`
      );
    }

    // The file is written under its current name: one of the earlier name is renamed first.
    const target = configPathOf(root);
    if (file.earlier) {
      fs.renameSync(file.path, target);
      log(`${symbols.success} Renamed ${SIMPLIX_DIR}/${EARLIER_CONFIG_FILE_NAME} to ${SIMPLIX_DIR}/${CONFIG_FILE_NAME}`);
    }

    const version = toReleaseVersion(getGeneratorVersion());
    recordGeneratorVersion(target, version);
    log(`${symbols.success} Recorded generator version ${style.cyan(version)} in ${target}`);
    return;
  }

  const notice = root === undefined ? undefined : earlierConfigNotice(root);
  if (notice !== undefined) output.notice(notice);

  const config = configPath ? readProjectConfig(root) : null;
  const status = collectVersionStatus({ config, includeLatest: true });

  if (options.json) {
    output.result(JSON.stringify({ ...status, configPath }));
    return;
  }

  reportText(status, configPath, log);
}
