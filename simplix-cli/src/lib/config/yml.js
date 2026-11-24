import yaml from 'js-yaml';

export function createBaseConfig(entityName, modulePath, idFieldName, nameField, repositoryModulePath) {
  const config = {
    entity: entityName,
    modulePath,
  };

  // Add promoteModule placeholder for user to fill in
  config.promoteModule = '<__MODIFY__>';

  // Add repositoryModulePath right after modulePath if it differs
  if (repositoryModulePath !== null && repositoryModulePath !== undefined && repositoryModulePath !== modulePath) {
    config.repositoryModulePath = repositoryModulePath;
  }

  config.idField = idFieldName;
  config.nameField = nameField;
  config.thymeleafBaseDir = entityName
    .replace(/([A-Z])/g, '/$1')
    .replace(/^\//, '')
    .toLowerCase();
  config.defaultSortField = '<__MODIFY__>';
  config.defaultSortDirection = 'desc';
  config.fields = {};

  return config;
}

export function formatYamlContent(ymlContent) {
  return ymlContent
    .replace(/^entity:.*$/m, '$&\n')
    .replace(/^fields:$/m, '\nfields:\n')
    .replace(/^ {2}(\w+):$/gm, '\n  $1:')
    .replace(/^ {2}(\w+\.\w+):$/gm, '\n  $1:')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(\s+)(views|searchOperators):\n\s+-\s+(.+(?:\n\s+-\s+.+)*)/gm, (_, indent, key, items) => {
      const values = items.split('\n').map(line => line.replace(/\s+-\s+/, '').trim());
      return `${indent}${key}: [${values.join(', ')}]`;
    });
}

/**
 * Serializes an entity configuration as the yml a project keeps under `.simplix/entity`.
 *
 * @param {object} config the entity configuration
 * @returns {string} the yml text
 */
export function dumpEntityConfig(config) {
  return formatYamlContent(
    yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"',
      flowStyle: false,
      styles: {
        '!!null': 'empty',
      },
    })
  );
}
