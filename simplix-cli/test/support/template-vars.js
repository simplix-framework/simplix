import lodash from 'lodash';
import { createSupportClasses } from '../../src/lib/generate/support-classes.js';
import { capitalizeFirstLetter } from '../../src/lib/generate/template-vars.js';

/**
 * The variables a whole template needs to render, for an entity with a String id and no embedded
 * id, tree, export or support class. A test overrides the ones its case is about.
 *
 * @param {object} overrides the variables that differ
 * @returns {object} the template variables
 */
export function templateVars(overrides) {
  return {
    entityComment: overrides.entityName,
    fields: [],
    entityFields: [],
    idType: 'String',
    capitalizeFirstLetter,
    hasEmbeddedId: false,
    embeddedIdField: null,
    embeddedIdType: null,
    embeddedIdPropertyNames: [],
    embeddedIdFields: [],
    embeddedIdSearchFields: [],
    entitySearchFields: [],
    dtoExcludeFields: [],
    hasOrderField: false,
    orderField: null,
    hasTreeEntity: false,
    treeEntityInterface: null,
    exportConfig: { enabled: false },
    basePackage: 'dev.example.app',
    packagePaths: {},
    entityBasePackage: 'dev.example',
    importsArray: [],
    generatorVersion: '0.0.0',
    generatedAt: '2000-01-01T00:00:00+09:00',
    gitUser: 'tester',
    gitEmail: 'tester@example.com',
    supportClasses: createSupportClasses({}, overrides.classPrefix),
    _: lodash,
    ...overrides,
  };
}
