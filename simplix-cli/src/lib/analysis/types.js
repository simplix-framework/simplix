/**
 * Type classification configuration
 */
export const TYPE_CLASSIFICATIONS = {
  basic: new Set([
    'String',
    'Integer',
    'Long',
    'Double',
    'Float',
    'BigDecimal',
    'BigInteger',
    'Boolean',
    'boolean',
    'int',
    'long',
    'double',
    'float',
    'LocalDate',
    'LocalDateTime',
    'ZonedDateTime',
    'OffsetDateTime',
    'Instant',
    'Date',
    'Time',
    'Timestamp',
    'UUID',
    'byte[]',
    'Byte[]',
  ]),
  temporal: new Set([
    'LocalDate',
    'LocalDateTime',
    'ZonedDateTime',
    'OffsetDateTime',
    'Instant',
    'Date',
    'Time',
    'Timestamp',
  ]),
  numeric: new Set([
    'Integer',
    'Long',
    'Double',
    'Float',
    'BigDecimal',
    'BigInteger',
    'int',
    'long',
    'double',
    'float',
  ]),
};

/**
 * The kind of a field whose type is neither basic nor already known: an enum, a related entity, or
 * a plain value when the type's own source declares no `@Entity` (a record, an embeddable or a
 * converted value kept in the row, such as a JSON column). A type the resolver cannot answer for is
 * read as a related entity.
 */
export function classifyNonBasicType(type, importPath, { entityContent, imports, isEntityType }) {
  if (isEnumType(type, entityContent, imports)) return { typeKind: 'enum', isRelation: true };
  if (importPath && isEntityType?.(importPath) === false) return { typeKind: 'value' };
  return { typeKind: 'entity', isRelation: true };
}

export function classifyType(type, imports) {
  // Check if it's a basic type
  if (TYPE_CLASSIFICATIONS.basic.has(type)) {
    return 'basic';
  }

  // Check if it's an enum
  const enumImport = imports.find(imp => imp.endsWith(`.${type}`) && imp.includes('.enums.'));
  if (enumImport) {
    return 'enum';
  }

  // Default to entity for non-basic types
  return null;
}

function isEnumType(type, entityContent, imports) {
  // Check if there's an enum import
  const hasEnumImport = imports.some(
    imp => imp.endsWith(`.${type}`) && (imp.includes('.enums.') || imp.includes('.enum.'))
  );

  if (hasEnumImport) return true;

  // Check if enum is defined in the same file
  const enumPattern = new RegExp(`enum\\s+${type}\\s*\\{`);
  return enumPattern.test(entityContent);
}
