import { symbols } from '../console.js';
import { defaultSearchOperators, isSortableSearchType } from '../search-operators.js';

/**
 * The sortable flag a search field is generated with: the yml's, unless the field's type cannot
 * be a sort key. A yml that asks for it anyway is generated without it and the operator is told
 * which line to fix, so an entity written before the rule still generates.
 *
 * @param {object} context
 * @param {string} context.ymlName the entity yml's name
 * @param {(message: string) => void} context.log where the warning goes
 * @param {string} fieldKey the yml key of the field, `parent.child` for an embedded id part
 * @param {string} type the Java type of the field
 * @param {boolean|undefined} sortable what the yml declares
 * @returns {boolean} whether the generated `@SearchableField` carries `sortable = true`
 */
export function resolveSearchSortable({ ymlName, log }, fieldKey, type, sortable) {
  if (!sortable) {
    return false;
  }

  if (isSortableSearchType(type)) {
    return true;
  }

  log(
    `${symbols.warning} ${ymlName}.${fieldKey} is ${type}: sortable dropped, ` +
      `PostgreSQL has no max(boolean) so sorting by it answers 500. ` +
      `Set sortable: false in .simplix/entity/${ymlName}.yml`
  );
  return false;
}

/**
 * Builds the search fields of the generated SearchDTO: the parts of an embedded id, and every
 * entity field the yml gives search operators.
 *
 * @param {object} input
 * @param {string} input.ymlName the entity yml's name
 * @param {object} [input.entityConfig] the parsed entity yml
 * @param {(message: string) => void} input.log where warnings go
 * @param {object[]} input.fields the analyzed entity fields
 * @param {object[]} [input.embeddedIdFields] the fields of the embedded id class
 * @param {string[]} input.embeddedIdPropertyNames the names of those fields
 * @param {string} [input.embeddedIdField] the entity field holding the embedded id
 * @param {boolean} input.hasEmbeddedId whether the entity has an embedded id
 * @returns {{ embeddedIdSearchFields: object[], entitySearchFields: object[] }}
 */
export function prepareSearchFields({
  ymlName,
  entityConfig,
  log,
  fields,
  embeddedIdFields,
  embeddedIdPropertyNames,
  embeddedIdField,
  hasEmbeddedId,
}) {
  const ymlFields = entityConfig?.fields || {};
  const context = { ymlName, log };

  let embeddedIdSearchFields = [];
  if (hasEmbeddedId && Array.isArray(embeddedIdFields)) {
    embeddedIdSearchFields = embeddedIdFields.map(field => {
      const ymlKey = `${embeddedIdField}.${field.name}`;
      const ymlFieldConfig = ymlFields[ymlKey] || {};
      const searchOperators = ymlFieldConfig.searchOperators || defaultSearchOperators(field.type);

      return {
        name: field.name,
        type: field.type,
        comment: field.comment || '',
        parentField: embeddedIdField,
        entityField: `${embeddedIdField}.${field.name}`,
        searchOperators,
        sortable: resolveSearchSortable(context, ymlKey, field.type, ymlFieldConfig.sortable),
        operators: searchOperators
          .map(op =>
            op
              .toUpperCase()
              .replace(/([A-Z])/g, '_$1')
              .replace(/^_/, '')
          )
          .join(', '),
      };
    });
  }

  const entitySearchFields = (Array.isArray(fields) ? fields : [])
    .filter(field => {
      if (field.name === (entityConfig?.idField || 'id')) return false;
      if (field.name === embeddedIdField) return false;
      if (Array.isArray(embeddedIdPropertyNames) && embeddedIdPropertyNames.includes(field.name)) return false;

      const ymlFieldConfig = ymlFields[field.name];
      return ymlFieldConfig && ymlFieldConfig.searchOperators && ymlFieldConfig.searchOperators.length > 0;
    })
    .map(field => {
      const ymlFieldConfig = ymlFields[field.name];
      return {
        name: field.name,
        type: field.type,
        comment: field.comment || '',
        searchOperators: ymlFieldConfig.searchOperators,
        sortable: resolveSearchSortable(context, field.name, field.type, ymlFieldConfig.sortable),
        entityField: field.name === ymlFieldConfig.idField ? undefined : field.name,
      };
    });

  return { embeddedIdSearchFields, entitySearchFields };
}
