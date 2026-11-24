import { CliError } from './errors.js';
/**
 * Resolves the opt-in list export an entity yml asks for.
 *
 * The export endpoint is generated only when the yml sets `export`, either `true` or an
 * object. An entity that sets nothing gets no export endpoint. The rows written are the
 * list DTO unless `export.dto` names an inner class of the entity's DTO container, which
 * is then built from each list row through its static `of(<ListDTO>)` factory.
 *
 * ```yaml
 * export: true                      # list DTO, file named after the path
 * export:
 *   dto: AuditEventExportDTO        # rows mapped through AuditEventExportDTO.of(row)
 *   baseName: audit-events          # file name without extension
 * ```
 *
 * @param {string} classPrefix the class name prefix of the generated classes
 * @param {object} [entityConfig] the parsed `.simplix/entity/<Entity>.yml`
 * @param {string} templatePath the request path the controller is mapped under
 * @returns {{enabled: false} | {enabled: true, dto: string, mapper: string, baseName: string}}
 * @throws {Error} when `export` or one of its keys has the wrong shape
 */
export function resolveExportConfig(classPrefix, entityConfig, templatePath) {
  if (!classPrefix) {
    throw new Error('classPrefix is required to resolve the export');
  }

  const configured = entityConfig?.export;
  if (configured === undefined || configured === null || configured === false) {
    return { enabled: false };
  }

  const fileName = `${classPrefix}.yml`;
  let options;
  if (configured === true) {
    options = {};
  } else if (typeof configured === 'object' && !Array.isArray(configured)) {
    options = configured;
  } else {
    throw new CliError(`export in ${fileName} must be true or an object, got: ${JSON.stringify(configured)}`);
  }

  const unknown = Object.keys(options).filter(key => key !== 'dto' && key !== 'baseName');
  if (unknown.length > 0) {
    throw new CliError(`export in ${fileName} has unknown keys: ${unknown.join(', ')} (allowed: dto, baseName)`);
  }

  if (options.dto !== undefined && (typeof options.dto !== 'string' || !/^[A-Z][A-Za-z0-9_]*$/.test(options.dto))) {
    throw new CliError(`export.dto in ${fileName} must be a Java class name, got: ${JSON.stringify(options.dto)}`);
  }

  if (
    options.baseName !== undefined &&
    (typeof options.baseName !== 'string' || !/^[A-Za-z0-9._-]+$/.test(options.baseName))
  ) {
    throw new CliError(
      `export.baseName in ${fileName} must be a file name of letters, digits, dots, dashes or underscores, got: ${JSON.stringify(options.baseName)}`
    );
  }

  const listDto = `${classPrefix}ListDTO`;
  const dto = options.dto || listDto;
  const segments = String(templatePath || '')
    .split('/')
    .filter(Boolean);
  const baseName = options.baseName || segments[segments.length - 1] || classPrefix;

  return {
    enabled: true,
    dto,
    mapper: dto === listDto ? '' : `.map(${dto}::of)`,
    baseName,
  };
}
