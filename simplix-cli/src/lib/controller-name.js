import { CliError } from './errors.js';
/**
 * Resolves the REST controller class name for an entity.
 *
 * The entity yml may set `controllerName` to name a controller other than
 * `<Entity>RestController` (for example an `Admin<Entity>RestController` whose class
 * name is already part of a published operation id). `generate` and `promote` both
 * read the name through this function, so the file written and the file promoted
 * always agree.
 *
 * @param {string} entityName the entity class name
 * @param {object} [entityConfig] the parsed `.simplix/entity/<Entity>.yml`
 * @returns {string} the controller class name
 * @throws {Error} when `controllerName` is set but is not a Java class name
 */
export function resolveControllerName(entityName, entityConfig) {
  if (!entityName) {
    throw new Error('entityName is required to resolve the controller name');
  }

  const configured = entityConfig?.controllerName;
  if (configured === undefined || configured === null || configured === '') {
    return `${entityName}RestController`;
  }

  if (typeof configured !== 'string' || !/^[A-Z][A-Za-z0-9_]*$/.test(configured)) {
    throw new CliError(
      `controllerName in ${entityName}.yml must be a Java class name starting with an upper-case letter, got: ${JSON.stringify(configured)}`
    );
  }

  return configured;
}
