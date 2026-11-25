import fs from 'node:fs';
import path from 'node:path';
import { symbols } from '../console.js';
import { CliError } from '../errors.js';
import { CONFIG_FILE_NAME } from '../project.js';

/**
 * The directory entity sources are scanned under: `entity.scanPath`, the older
 * `entity.basePath`, or the Maven source root.
 */
export function resolveEntityScanPath(config) {
  return config.entity?.scanPath || config.entity?.basePath || 'src/main/java';
}

/**
 * Derives a package from a path that runs through a `/java/` source root.
 *
 * @param {string} baseEntityPath a path such as `modules/domain/src/main/java/com/example/entity`
 * @returns {string} the package below the source root, or an empty string
 */
export function deriveEntityPackage(baseEntityPath) {
  if (!baseEntityPath) return '';
  const javaIndex = baseEntityPath.indexOf('/java/');
  if (javaIndex === -1) return '';
  return baseEntityPath.substring(javaIndex + 6).replace(/\//g, '.');
}

/**
 * Derives the repository package from an entity package by replacing its last `.entity` segment
 * with `.repository`.
 *
 * @param {string} entityPackage the entity's package
 * @returns {string} the repository package, or an empty string when the package has no such segment
 */
export function deriveRepositoryPackage(entityPackage) {
  if (!entityPackage) return '';
  const lastEntityIndex = entityPackage.lastIndexOf('.entity');
  if (lastEntityIndex === -1) return '';
  return entityPackage.substring(0, lastEntityIndex) + '.repository';
}

function validate(config, root, log) {
  const hasNewStructure = config.entity && config.target;

  if (hasNewStructure) {
    if (!config.target?.generatedBasePath && !config.target?.basePath) {
      throw new CliError('Missing required configuration field: target.generatedBasePath');
    }

    if (!config.target?.basePackage) {
      throw new CliError('Missing required configuration field: target.basePackage');
    }

    const entityScanPath = resolveEntityScanPath(config);
    if (!fs.existsSync(path.join(root, entityScanPath))) {
      log(`${symbols.warning} Entity scan path does not exist: ${entityScanPath}`);
    }

    return;
  }

  const missingFields = ['baseTargetPath', 'basePackage'].filter(field => !config[field]);

  if (missingFields.length > 0) {
    throw new CliError(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }

  if (config.baseEntityPath && !fs.existsSync(path.join(root, config.baseEntityPath))) {
    log(`${symbols.warning} Entity path does not exist: ${config.baseEntityPath}`);
  }
}

/**
 * Reads what `generate` needs out of the project configuration.
 *
 * @param {object} config the parsed project configuration
 * @param {string} root the project root
 * @param {(message: string) => void} log where warnings go
 * @returns {object} the resolved settings
 * @throws {CliError} when a required field is missing
 */
export function resolveGenerateSettings(config, root, log) {
  try {
    validate(config, root, log);
  } catch (error) {
    if (!(error instanceof CliError)) throw error;
    throw new CliError(`Failed to read ${CONFIG_FILE_NAME}: ${error.message}`);
  }

  const baseEntityPath = resolveEntityScanPath(config);
  const baseTargetPath = config.target?.generatedBasePath || config.target?.basePath;
  const targetPaths = {};

  Object.entries(config.target?.targetPath || {}).forEach(([key, value]) => {
    targetPaths[key] = value;
  });

  return {
    baseEntityPath,
    baseTargetPath,
    testBasePath:
      config.target?.testGeneratedBasePath || config.target?.testBasePath || baseTargetPath?.replace('/main/', '/test/'),
    basePackage: config.target?.basePackage || config.basePackage,
    entityBasePackage: config.entity?.basePackage || deriveEntityPackage(baseEntityPath),
    repositoryDeriveFromEntity: config.repository?.deriveFromEntity === true,
    repositoryBasePackage: config.repository?.basePackage,
    dtoExcludeFields: config.dto?.excludeFields || [],
    templateMapping: config.template || {},
    targetPaths,
  };
}
