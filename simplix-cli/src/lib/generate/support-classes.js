import { CliError } from '../errors.js';
import { CONFIG_FILE_NAME, SIMPLIX_DIR } from '../project.js';

const JAVA_CLASS_NAME = /^(?:[a-z_][A-Za-z0-9_]*\.)+[A-Z][A-Za-z0-9_]*$/;

/**
 * The classes of the application that generated code calls, as the project configuration names
 * them under `supportClasses`.
 *
 * <p>Some generated members need a class the framework does not provide and every application
 * writes for itself, such as the DTOs a list's figures are answered with. A template asks for
 * one by key: `find` for a member that is generated only when the class is configured, and
 * `require` for a member an entity yml asks for outright.
 *
 * @param {Record<string, string>} [configured] the `supportClasses` object of the configuration
 * @param {string} ymlName the entity yml being generated, named in a refusal
 * @returns {{ find: (key: string) => ({ fqn: string, name: string } | undefined),
 *   require: (key: string, usedBy: string) => { fqn: string, name: string } }}
 */
export function createSupportClasses(configured, ymlName) {
  const find = key => {
    const fqn = configured?.[key];
    if (fqn === undefined || fqn === null || fqn === '') return undefined;

    if (typeof fqn !== 'string' || !JAVA_CLASS_NAME.test(fqn)) {
      throw new CliError(
        `supportClasses.${key} in ${CONFIG_FILE_NAME} must be a fully qualified Java class name, got: ${JSON.stringify(fqn)}`
      );
    }

    return { fqn, name: fqn.slice(fqn.lastIndexOf('.') + 1) };
  };

  return {
    find,
    require(key, usedBy) {
      const found = find(key);
      if (found === undefined) {
        throw new CliError(
          `${ymlName}.yml uses ${usedBy}, which needs supportClasses.${key} in ${SIMPLIX_DIR}/${CONFIG_FILE_NAME}`
        );
      }

      return found;
    },
  };
}
