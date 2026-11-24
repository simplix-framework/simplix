/**
 * Finds the field an entity's records are named by.
 *
 * <p>The field the entity marks `@NameField` wins. Otherwise the first String field among
 * `name`, `title`, `displayName`, `description` and `code`, then the first String field whose
 * name contains "name", then the first String field that is not the id, then the id itself.
 *
 * @param {object[]} fields the analyzed entity fields
 * @param {string} idFieldName the id field
 * @returns {string} the field name
 */
export function findNameField(fields, idFieldName) {
  if (!Array.isArray(fields)) {
    return idFieldName;
  }

  const declared = fields.find(f => f.isNameField);
  if (declared) {
    return declared.name;
  }

  const nameFieldCandidates = ['name', 'title', 'displayName', 'description', 'code'];

  for (const candidate of nameFieldCandidates) {
    const field = fields.find(f => f.name === candidate && f.type === 'String');
    if (field) {
      return field.name;
    }
  }

  const nameContainingField = fields.find(f => f.name.toLowerCase().includes('name') && f.type === 'String');
  if (nameContainingField) {
    return nameContainingField.name;
  }

  const firstStringField = fields.find(f => f.type === 'String' && f.name !== idFieldName);
  if (firstStringField) {
    return firstStringField.name;
  }

  return idFieldName;
}
