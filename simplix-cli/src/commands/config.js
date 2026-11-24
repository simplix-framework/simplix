import fs from 'node:fs';
import path from 'node:path';
import { symbols } from '../lib/console.js';
import { analyzeEntity } from '../lib/entity-analyzer.js';
import { CliError } from '../lib/errors.js';
import { findEntityFile } from '../lib/file-utils.js';
import { buildFkIdFieldMap, processEmbeddedIdFields, processRegularField } from '../lib/config/fields.js';
import { analyzeParentClass, mergeFields } from '../lib/config/parents.js';
import {
  entityTypeResolver,
  extractModulePath,
  findRepositoryModulePath,
  getBaseEntityPath,
} from '../lib/config/paths.js';
import { createBaseConfig, dumpEntityConfig } from '../lib/config/yml.js';
import { findNameField } from '../lib/name-field.js';
import { entityConfigPathOf, readProjectConfig } from '../lib/project.js';
import { assertGeneratorVersion } from '../lib/version-check.js';

export const usage = 'simplix-boot config <EntityName> [--force] [--skip-version-check]';

export const summary = 'Analyze a JPA entity and write its yml under .simplix/entity';

export const argumentSpec = {
  positionals: ['entityName'],
  options: {
    force: { type: 'boolean', default: false },
    'skip-version-check': { type: 'boolean', default: false },
  },
};

/**
 * Builds the yml of one entity from its Java source: its id and name fields, its module path, and
 * for every field the views it appears in and the operators it is searched with.
 *
 * @param {object} context
 * @param {string} context.root the project root
 * @param {object} [context.config] the parsed project configuration
 * @param {(message?: string) => void} context.log where progress goes
 * @param {string} entityName the entity class name
 * @returns {string} the yml text
 * @throws {CliError} when the entity source is not found
 */
export function buildEntityConfigYml(context, entityName) {
  const baseEntityPath = getBaseEntityPath(context);
  const srcPath = path.join(context.root, baseEntityPath);
  const entityPath = findEntityFile(srcPath, entityName);

  if (!entityPath) {
    throw new CliError(`Entity file not found\nLooking for: ${entityName}.java\nSearched in: ${srcPath}`);
  }

  const entityContent = fs.readFileSync(entityPath, 'utf8');
  const { fields, embeddedIdFields, idField, parentClass } = analyzeEntity(entityContent, {
    isEntityType: entityTypeResolver(context, srcPath),
  });

  let finalIdField = idField;
  const { parentFields, finalIdField: parentIdField } = analyzeParentClass(
    context,
    parentClass,
    baseEntityPath,
    srcPath,
    new Set()
  );

  if (!finalIdField && parentIdField) {
    finalIdField = parentIdField;
  }

  if (parentFields.length > 0) {
    mergeFields(parentFields, fields);
  }

  const idFieldName = finalIdField || 'id';
  const nameField = findNameField(fields, idFieldName);
  const modulePath = extractModulePath(entityContent, entityName);

  const repositoryModulePath = findRepositoryModulePath(context, entityName, modulePath);
  if (repositoryModulePath !== null && repositoryModulePath !== modulePath) {
    context.log(`  Repository found at: ${repositoryModulePath || '(root)'}`);
  }

  const config = createBaseConfig(entityName, modulePath, idFieldName, nameField, repositoryModulePath);

  if (Array.isArray(fields) && fields.some(field => field.name === 'createdAt')) {
    config.defaultSortField = 'createdAt';
  }

  processEmbeddedIdFields(embeddedIdFields, config);

  const fkIdFieldMap = buildFkIdFieldMap(fields);

  if (Array.isArray(fields)) {
    fields.forEach(field => {
      processRegularField(context, field, config, idFieldName, embeddedIdFields, fkIdFieldMap);
    });
  }

  return dumpEntityConfig(config);
}

/** Runs `config` from the command line. */
export function run({ root, positionals, options, output }) {
  const { entityName } = positionals;
  if (!entityName) {
    throw new CliError(`Entity name is required\nUsage: ${usage}`);
  }

  const config = readProjectConfig(root);
  const log = output.log;

  if (config) {
    assertGeneratorVersion({ config, log, skip: options['skip-version-check'] });
  }

  const yml = buildEntityConfigYml({ root, config, log }, entityName);
  const configPath = entityConfigPathOf(root, entityName);

  if (fs.existsSync(configPath) && !options.force) {
    log(`\n${symbols.warning} Config file already exists: ${entityName}.yml`);
    log('Use --force to overwrite');
    return;
  }

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, yml);
  log(`\n${symbols.success} Generated config file: ${entityName}.yml`);
}
