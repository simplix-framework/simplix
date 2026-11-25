import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import lodash from 'lodash';
import { extractTableComment } from '../lib/comment-extractor.js';
import { symbols } from '../lib/console.js';
import { resolveControllerName } from '../lib/controller-name.js';
import { analyzeParentClass } from '../lib/config/parents.js';
import { analyzeEntity } from '../lib/entity-analyzer.js';
import { createEntityTypeResolver } from '../lib/entity-type-resolver.js';
import { resolveEntityType } from '../lib/entity-type.js';
import { CliError } from '../lib/errors.js';
import { resolveExportConfig } from '../lib/export-config.js';
import { findEntityFile, validateProjectStructure } from '../lib/file-utils.js';
import { buildFileGenerationList, treeServiceFiles } from '../lib/generate/file-plan.js';
import { prepareSearchFields } from '../lib/generate/search-fields.js';
import { createSupportClasses } from '../lib/generate/support-classes.js';
import { deriveRepositoryPackage, resolveGenerateSettings } from '../lib/generate/settings.js';
import { buildTemplateVars, transformImportForService } from '../lib/generate/template-vars.js';
import { getGitConfig } from '../lib/git-utils.js';
import { readEntityConfig, requireProjectConfig } from '../lib/project.js';
import { tidyRenderedOutput } from '../lib/rendered-output.js';
import { assertGeneratorVersion } from '../lib/version-check.js';
import { getGeneratorVersion } from '../lib/version-utils.js';

export const usage = 'simplix-boot generate <EntityName> [--force] [--no-test] [--skip-version-check]';

export const summary = 'Generate the service, controller, DTOs and tests of an entity from its yml';

export const argumentSpec = {
  positionals: ['entityName'],
  options: {
    force: { type: 'boolean', default: false },
    test: { type: 'boolean', default: true },
    'skip-version-check': { type: 'boolean', default: false },
  },
};

/**
 * Tells the operator when the yml names a different field than the entity marks @NameField.
 * SimpliX Meta publishes the entity's mark, so a screen scaffolded from Meta names its records
 * by that field whatever the yml says.
 */
export function warnOnNameFieldConflict(fields, ymlName, entityConfig, log) {
  const declared = fields.find(f => f.isNameField)?.name;
  const configured = entityConfig?.nameField;
  if (declared && configured && declared !== configured) {
    log(
      `${symbols.warning} ${ymlName}: the entity marks ${declared} @NameField but ` +
        `.simplix/entity/${ymlName}.yml says nameField: ${configured}. ` +
        `SimpliX Meta publishes ${declared}; set nameField: ${declared} in the yml`
    );
  }
}

/**
 * Renders one template with the entity's variables.
 *
 * @param {string} templatePath the template file
 * @param {object} templateVars the variables
 * @returns {string} the tidied output
 */
export function renderTemplate(templatePath, templateVars) {
  const rendered = ejs.render(fs.readFileSync(templatePath, 'utf8'), templateVars, {
    escape: text => text,
    filename: templatePath,
  });

  return tidyRenderedOutput(rendered);
}

/**
 * Generates the files of one entity into the project's generated tree.
 *
 * @param {object} run
 * @param {string} run.root the project root
 * @param {string} run.entityName the entity yml's name, which prefixes every generated class
 * @param {boolean} [run.force] whether existing files are overwritten
 * @param {boolean} [run.test] whether test files are generated
 * @param {boolean} [run.skipVersionCheck] whether the version gate is skipped
 * @param {(message?: string) => void} run.log where progress goes
 * @throws {CliError} when the entity cannot be generated, or a template fails to render
 */
export function generate({ root, entityName: ymlName, force = false, test = true, skipVersionCheck = false, log }) {
  if (!ymlName) {
    throw new CliError(`Entity name is required\nUsage: ${usage}`);
  }

  const entityConfig = readEntityConfig(root, ymlName);
  const config = requireProjectConfig(root);
  const settings = resolveGenerateSettings(config, root, log);

  assertGeneratorVersion({ config, log, skip: skipVersionCheck });

  if (entityConfig === undefined || entityConfig === null) {
    throw new CliError(
      `.simplix/entity/${ymlName}.yml not found. Run "simplix-boot config ${ymlName}" to create it.`
    );
  }

  const modulePath = entityConfig.modulePath;
  if (!modulePath) {
    throw new CliError(`modulePath is not configured in ${ymlName}.yml`);
  }

  const packagePaths = {};
  const templatePath =
    entityConfig.thymeleafBaseDir || lodash.kebabCase(ymlName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase());

  Object.entries(settings.targetPaths).forEach(([key, targetPath]) => {
    packagePaths[key] = `${settings.basePackage}.${targetPath.replace('{modulePath}', modulePath).replace(/\//g, '.')}`;
  });

  if (!settings.repositoryDeriveFromEntity && settings.repositoryBasePackage) {
    const repoModulePath = entityConfig.repositoryModulePath || modulePath;
    packagePaths.repository = `${settings.repositoryBasePackage}.${repoModulePath.replace(/\//g, '.')}`;
  }

  const { files, missingTemplates } = buildFileGenerationList({
    root,
    settings,
    ymlName,
    entityConfig,
    modulePath,
    withTests: test,
  });
  const entityName = resolveEntityType(ymlName, entityConfig);
  const exportConfig = resolveExportConfig(ymlName, entityConfig, templatePath);

  const srcPath = path.join(root, settings.baseEntityPath);
  validateProjectStructure(srcPath, root);

  const entityPath = findEntityFile(srcPath, entityName);
  if (!entityPath) {
    throw new CliError(`Entity file not found\nLooking for: ${entityName}.java\nSearched in: ${srcPath}`);
  }

  log(`\n${symbols.success} Found entity file:\n    ${path.relative(root, entityPath)}`);

  const entityContent = fs.readFileSync(entityPath, 'utf8');
  const packageMatch = entityContent.match(/package\s+([\w.]+);/);
  if (!packageMatch) {
    throw new CliError(`Package name not found in entity file: ${path.relative(root, entityPath)}`);
  }

  const entityPackage = packageMatch[1];

  if (settings.repositoryDeriveFromEntity) {
    const derivedRepoPackage = deriveRepositoryPackage(entityPackage);
    if (derivedRepoPackage) {
      packagePaths.repository = derivedRepoPackage;
    }
  }

  const props = {
    gitUser: getGitConfig('user.name', root) ?? 'Unknown',
    gitEmail: getGitConfig('user.email', root) ?? 'unknown@example.com',
    generatorVersion: getGeneratorVersion(),
    entityName,
    classPrefix: ymlName,
    basePackage: settings.basePackage,
    modulePath,
    targetPaths: settings.targetPaths,
    packagePaths,
    templatePath,
    exportConfig,
    entityPackage,
    entityBasePackage: settings.entityBasePackage,
  };

  const entityComment = extractTableComment(entityContent);
  const analysis = analyzeEntity(entityContent, { isEntityType: createEntityTypeResolver(srcPath) });

  // What the entity takes from parent classes whose source is under the scan path. These stay
  // apart from the entity's own fields, which the DTOs and the search fields are built from.
  const { parentFields } = analyzeParentClass(
    { root, config, log: () => {} },
    analysis.parentClass,
    settings.baseEntityPath,
    srcPath,
    new Set()
  );
  const inheritedFields = parentFields.filter(inherited => !analysis.fields.some(own => own.name === inherited.name));

  const treeEntityInterface = (analysis.implementedInterfaces || []).find(i => i.name === 'TreeEntity');
  const hasTreeEntity = Boolean(treeEntityInterface);
  if (hasTreeEntity) {
    log(`\n${symbols.success} Detected TreeEntity interface implementation`);
    files.push(...treeServiceFiles({ root, settings, ymlName, modulePath }));
  }

  const fields = analysis.fields.map(field => {
    if (field.typeKind === 'entity' || field.isRelation || field.relationType === 'ManyToOne') {
      const entityType = field.isCollection ? field.actualType : field.type;
      const entityImport = field.importPath || `${entityPackage}.${entityType}`;

      field.serviceImport = transformImportForService(entityImport, entityType);
    }

    return field;
  });

  warnOnNameFieldConflict(fields, ymlName, entityConfig, log);

  const { idType, embeddedIdField, embeddedIdFields } = analysis;
  const hasEmbeddedId = Boolean(embeddedIdField);
  let embeddedIdPropertyNames = [];

  if (hasEmbeddedId) {
    log(`\n${symbols.success} Detected EmbeddedId: ${embeddedIdField} of type ${idType}`);
    if (embeddedIdFields && embeddedIdFields.length > 0) {
      embeddedIdPropertyNames = embeddedIdFields.map(field => field.name);
      log(`   With properties: ${embeddedIdPropertyNames.join(', ')}`);
    }
  }

  const searchFields = prepareSearchFields({
    ymlName,
    entityConfig,
    log,
    fields,
    embeddedIdFields,
    embeddedIdPropertyNames,
    embeddedIdField,
    hasEmbeddedId,
  });

  const templateVars = buildTemplateVars({
    props,
    entityConfig,
    entityComment,
    analysis,
    fields,
    inheritedFields,
    controllerName: resolveControllerName(ymlName, entityConfig),
    dtoExcludeFields: settings.dtoExcludeFields,
    searchFields,
    hasTreeEntity,
    treeEntityInterface,
    supportClasses: createSupportClasses(config.supportClasses, ymlName),
  });

  log(`\n${symbols.info} Files to generate:`);

  const skip = (targetPath, reason) => {
    log(`   ${symbols.warning} SKIP: ${path.relative(root, targetPath)} (${reason})`);
  };

  for (const file of missingTemplates) {
    skip(file.path, `template not found: ${path.relative(root, file.projectTemplate)}`);
  }

  const failures = [];

  for (const file of files) {
    if (fs.existsSync(file.path) && !force) {
      skip(file.path, 'already exists, use --force to overwrite');
      continue;
    }

    if (!file.template) {
      skip(file.path, `template not found: ${path.relative(root, file.projectTemplate)}`);
      continue;
    }

    let rendered;
    try {
      rendered = renderTemplate(file.template.path, templateVars);
    } catch (error) {
      // A template is the project's own code: whatever it throws is reported against the file it
      // was rendering, and the run fails after the remaining files have been tried.
      failures.push(file);
      log(`   ${symbols.error} ${path.relative(root, file.path)}`);
      log(`     Failed to render ${file.templateFile}: ${error.message}`);
      continue;
    }

    log(`   ${symbols.success} ${path.relative(root, file.path)}`);
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(file.path, rendered);
  }

  if (failures.length > 0) {
    throw new CliError(
      `${failures.length} of ${files.length} files failed to render for ${ymlName}: ${failures
        .map(file => path.basename(file.path))
        .join(', ')}`
    );
  }

  log(`\n${symbols.success} Successfully generated CRUD files for ${ymlName}!`);
}

/** Runs `generate` from the command line. */
export function run({ root, positionals, options, output }) {
  generate({
    root,
    entityName: positionals.entityName,
    force: options.force,
    test: options.test,
    skipVersionCheck: options['skip-version-check'],
    log: output.log,
  });
}
