import path from 'node:path';
import { resolveControllerName } from '../controller-name.js';
import { locateTemplate, projectTemplateDir } from '../templates.js';

const COMPONENT_TYPES = ['repository', 'service', 'controllerRest', 'controllerWeb', 'dto'];

const FILE_SUFFIXES = {
  repository: 'Repository',
  service: 'Service',
  controllerRest: 'RestController',
  controllerWeb: 'Controller',
  dto: 'DTOs',
};

/** The template each component is rendered from unless the project configuration maps another. */
const DEFAULT_TEMPLATES = {
  repository: 'repository/EntityRepository.java.template',
  service: 'service/EntityService.java.template',
  controllerRest: 'controller/rest/EntityRestController.java.template',
  controllerWeb: 'controller/web/EntityWebController.java.template',
  dto: 'dto/EntityDTOs.java.template',
  serviceTest: 'test/EntityServiceTest.java.template',
  restControllerTest: 'test/EntityRestControllerTest.java.template',
};

const TEST_TYPES = ['serviceTest', 'restControllerTest'];

/**
 * The components no template ships for: a project that wants one provides its template, and a
 * project that does not is not told on every run that it is missing.
 */
const OPTIONAL_TYPES = ['restControllerTest'];

const TEST_SUFFIXES = {
  serviceTest: 'ServiceTest',
  restControllerTest: 'RestControllerTest',
};

/** The template a tree entity's service is rendered from, and its test. */
const TREE_SERVICE_TEMPLATE = 'service/EntityTreeService.java.template';
const TREE_SERVICE_TEST_TEMPLATE = 'test/EntityTreeServiceTest.java.template';

function entry(root, templateFile, targetPath) {
  return {
    templateFile,
    template: locateTemplate(root, templateFile),
    // Where the project would put its own copy, which is what a "not found" message points at.
    projectTemplate: path.join(projectTemplateDir(root), templateFile),
    path: targetPath,
  };
}

function testBasePathOf(settings) {
  return settings.testBasePath || settings.baseTargetPath.replace('/main/', '/test/');
}

/**
 * Lists the files `generate` writes for one entity.
 *
 * <p>A component is generated when the project configuration gives it a target path. The files
 * that will be written come back under `files`, and the ones dropped for want of a template
 * under `missingTemplates`, so a file whose template does not exist is never announced as
 * generated and then skipped a line later.
 *
 * @param {object} plan
 * @param {string} plan.root the project root
 * @param {object} plan.settings the resolved generate settings
 * @param {string} plan.ymlName the entity yml's name, which prefixes the generated classes
 * @param {object} plan.entityConfig the parsed entity yml
 * @param {string} plan.modulePath the yml's module path
 * @param {boolean} plan.withTests whether test files are generated
 * @returns {{ files: object[], missingTemplates: object[] }}
 */
export function buildFileGenerationList({ root, settings, ymlName, entityConfig, modulePath, withTests }) {
  const { targetPaths, templateMapping, baseTargetPath } = settings;
  const files = [];
  const missingTemplates = [];

  const addFile = (type, targetPath) => {
    const planned = entry(root, templateMapping[type] || DEFAULT_TEMPLATES[type], targetPath);
    if (planned.template) files.push(planned);
    else if (!OPTIONAL_TYPES.includes(type)) missingTemplates.push(planned);
  };

  COMPONENT_TYPES.filter(type => targetPaths[type]).forEach(type => {
    addFile(
      type,
      path.join(
        root,
        baseTargetPath,
        targetPaths[type].replace('{modulePath}', modulePath),
        type === 'controllerRest'
          ? `${resolveControllerName(ymlName, entityConfig)}.java`
          : `${ymlName}${FILE_SUFFIXES[type]}.java`
      )
    );
  });

  if (withTests) {
    TEST_TYPES.forEach(type => {
      let testTargetPath = '';
      if (type === 'serviceTest' && targetPaths.service) {
        testTargetPath = targetPaths.service;
      } else if (type === 'restControllerTest' && targetPaths.controllerRest) {
        testTargetPath = targetPaths.controllerRest;
      }

      if (testTargetPath) {
        addFile(
          type,
          path.join(
            root,
            testBasePathOf(settings),
            testTargetPath.replace('{modulePath}', modulePath),
            type === 'restControllerTest'
              ? `${resolveControllerName(ymlName, entityConfig)}Test.java`
              : `${ymlName}${TEST_SUFFIXES[type]}.java`
          )
        );
      }
    });
  }

  return { files, missingTemplates };
}

/**
 * The files added for an entity that implements `TreeEntity`: its tree service, and that
 * service's test when a template for it exists.
 *
 * @param {object} plan
 * @param {string} plan.root the project root
 * @param {object} plan.settings the resolved generate settings
 * @param {string} plan.ymlName the entity yml's name
 * @param {string} plan.modulePath the yml's module path
 * @returns {object[]}
 */
export function treeServiceFiles({ root, settings, ymlName, modulePath }) {
  const { targetPaths, baseTargetPath } = settings;
  if (!targetPaths.service) return [];

  const serviceDir = targetPaths.service.replace('{modulePath}', modulePath);
  const files = [
    entry(root, TREE_SERVICE_TEMPLATE, path.join(root, baseTargetPath, serviceDir, `${ymlName}TreeService.java`)),
  ];

  const test = entry(
    root,
    TREE_SERVICE_TEST_TEMPLATE,
    path.join(root, testBasePathOf(settings), serviceDir, `${ymlName}TreeServiceTest.java`)
  );
  if (test.template) files.push(test);

  return files;
}
