import fs from 'node:fs';
import path from 'node:path';
import { resolveControllerName } from './controller-name.js';
import { CliError } from './errors.js';

function resolvePath(template, modulePath) {
  if (!template) throw new Error('Path template is undefined');
  if (!modulePath) throw new Error('Module path is undefined');
  return template.replace('{modulePath}', modulePath.replace(/\//g, path.sep));
}

function generatedBase(config) {
  return config.target.generatedBasePath || config.target.basePath;
}

function generatedTestBase(config) {
  return (
    config.target.testGeneratedBasePath ||
    config.target.testBasePath ||
    generatedBase(config).replace('/main/', '/test/')
  );
}

/**
 * Every file promote moves for one entity: where the generator renders it and where it lands in
 * the module. The tree service and its test are listed only when the render produced them.
 *
 * @param {object} target
 * @param {string} target.root the project root
 * @param {object} target.config the parsed `.simplix/generator-simplix.json`
 * @param {string} target.entityName the entity class name
 * @param {object} target.entityConfig the parsed entity yml, which carries `modulePath`
 * @param {string} target.moduleName the target module under the module root (`admin/jobs`)
 * @returns {{ name: string, src: string, dest: string }[]}
 */
export function promoteFiles({ root, config, entityName, entityConfig, moduleName }) {
  const modulePath = entityConfig?.modulePath;
  if (!modulePath) throw new CliError(`modulePath not found in ${entityName}.yml`);
  if (!config.target?.targetPath) throw new CliError('target.targetPath not found in generator-simplix.json');
  const moduleRoot = config.promote?.moduleRoot || 'modules';
  const packagePath = config.target.basePackage.replace(/\./g, '/');
  const main = (target, fileName) => ({
    src: path.join(root, generatedBase(config), resolvePath(target, modulePath), fileName),
    dest: path.join(
      root,
      moduleRoot,
      moduleName,
      'src/main/java',
      packagePath,
      resolvePath(target, modulePath),
      fileName
    ),
  });
  const test = (target, fileName) => ({
    src: path.join(root, generatedTestBase(config), resolvePath(target, modulePath), fileName),
    dest: path.join(
      root,
      moduleRoot,
      moduleName,
      'src/test/java',
      packagePath,
      resolvePath(target, modulePath),
      fileName
    ),
  });
  const { targetPath, testTargetPath } = config.target;
  const files = [];
  if (targetPath.service) files.push({ name: 'Service', ...main(targetPath.service, `${entityName}Service.java`) });
  if (targetPath.controllerRest) {
    const controller = `${resolveControllerName(entityName, entityConfig)}.java`;
    files.push({ name: 'Controller', ...main(targetPath.controllerRest, controller) });
  }

  if (targetPath.dto) files.push({ name: 'DTOs', ...main(targetPath.dto, `${entityName}DTOs.java`) });
  if (testTargetPath?.serviceTest) {
    files.push({ name: 'Service Test', ...test(testTargetPath.serviceTest, `${entityName}ServiceTest.java`) });
  }

  if (targetPath.service) {
    const tree = main(targetPath.service, `${entityName}TreeService.java`);
    if (fs.existsSync(tree.src) || fs.existsSync(tree.dest)) {
      files.push({ name: 'TreeService', ...tree });
      if (testTargetPath?.serviceTest) {
        const treeTest = test(testTargetPath.serviceTest, `${entityName}TreeServiceTest.java`);
        if (fs.existsSync(treeTest.src) || fs.existsSync(treeTest.dest)) {
          files.push({ name: 'TreeService Test', ...treeTest });
        }
      }
    }
  }

  return files;
}

/**
 * The modules under the module root: every directory holding a `src/` tree, named by its path
 * below the root (`admin/jobs`).
 */
export function listModules(root, config) {
  const moduleRoot = path.join(root, config.promote?.moduleRoot || 'modules');
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 4 || !fs.existsSync(dir)) return;
    if (fs.existsSync(path.join(dir, 'src'))) {
      found.push(path.relative(moduleRoot, dir).split(path.sep).join('/'));
      return;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'build') {
        walk(path.join(dir, entry.name), depth + 1);
      }
    }
  };

  walk(moduleRoot, 0);
  return found.sort();
}

/**
 * The module an entity was promoted into: the one module holding any of its promoted files.
 *
 * @returns {string|undefined} the module name, or undefined when none holds a file
 * @throws {Error} when more than one module holds its files
 */
export function findPromotedModule(root, config, entityName, entityConfig) {
  const hits = listModules(root, config).filter(moduleName =>
    promoteFiles({ root, config, entityName, entityConfig, moduleName }).some(file => fs.existsSync(file.dest))
  );
  if (hits.length > 1) throw new CliError(`${entityName} has promoted files in more than one module: ${hits.join(', ')}`);
  return hits[0];
}
