import { analyzeEmbeddedId, extractIdInfo, extractImplementedInterfaces, extractParentClass } from './analysis/structure.js';
import { analyzeFields } from './analysis/fields.js';
import { analyzeImports, processImports } from './analysis/imports.js';

/**
 * Analyzes an entity source: its ID, imports, parent class, interfaces and fields.
 *
 * @param {string} entityContent the entity's Java source
 * @param {object} [options]
 * @param {(fullyQualifiedName: string) => (boolean|undefined)} [options.isEntityType] answers whether
 *   a field's type is an `@Entity` (see `createEntityTypeResolver`). A non-basic, non-enum type it
 *   answers false for is a plain value (`typeKind: 'value'`); a type it cannot answer for, or every
 *   such type when it is absent, is read as a related entity.
 * @returns {object} the analysis
 */
export function analyzeEntity(entityContent, { isEntityType } = {}) {
  // Extract ID field information
  const { idType, embeddedIdField, idField } = extractIdInfo(entityContent);

  // Extract package and imports
  const imports = analyzeImports(entityContent);

  // Extract parent class information
  const parentClass = extractParentClass(entityContent);

  // Extract implemented interfaces
  const implementedInterfaces = extractImplementedInterfaces(entityContent);

  // Analyze regular fields
  const contentLines = entityContent.split('\n');
  const analyzedFields = analyzeFields(contentLines, imports, entityContent, isEntityType);

  // Analyze embeddedId fields if present
  const embeddedIdFields = analyzeEmbeddedId(entityContent, embeddedIdField, idType);

  // Process imports for entity references
  const importInfo = processImports(entityContent);

  return {
    fields: analyzedFields,
    idType,
    idField,
    imports: importInfo,
    embeddedIdFields,
    embeddedIdField,
    parentClass,
    implementedInterfaces,
  };
}
