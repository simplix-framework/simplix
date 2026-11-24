import { CliError } from './errors.js';
/**
 * Resolves the JPA entity class a generator input describes.
 *
 * The argument given to `generate` and `promote` names the yml (`.simplix/entity/<Name>.yml`) and
 * the prefix of every generated class (`<Name>Service`, `<Name>DTOs`, `<Name>ListDTO`). The yml's
 * `entity` key names the entity class those classes are built over. The two are the same for the
 * usual one surface per entity; they differ when a second surface is generated over an entity that
 * already has one, for example a self-scoped `MyOrder.yml` with `entity: Order` beside `Order.yml`.
 * The prefix keeps the second surface's classes, bean names, DTO names and API tag apart from the
 * first one's.
 *
 * @param {string} name the generator argument, which is the yml's file name
 * @param {object} [entityConfig] the parsed yml
 * @returns {string} the entity class name
 * @throws {Error} when `entity` is set but is not a Java class name
 */
export function resolveEntityType(name, entityConfig) {
  if (!name) {
    throw new Error('the entity name is required to resolve the entity class');
  }

  const configured = entityConfig?.entity;
  if (configured === undefined || configured === null || configured === '') {
    return name;
  }

  if (typeof configured !== 'string' || !/^[A-Z][A-Za-z0-9_]*$/.test(configured)) {
    throw new CliError(
      `entity in ${name}.yml must be a Java class name starting with an upper-case letter, got: ${JSON.stringify(configured)}`
    );
  }

  return configured;
}
