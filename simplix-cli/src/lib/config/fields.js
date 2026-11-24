import fs from 'node:fs';
import path from 'node:path';
import { analyzeEntity } from '../entity-analyzer.js';
import { findEntityFile } from '../file-utils.js';
import { findNameField } from '../name-field.js';
import { defaultSearchOperators } from '../search-operators.js';
import { analyzeReferenceParent } from './parents.js';
import { getBaseEntityPath } from './paths.js';

export function processEmbeddedIdFields(embeddedIdFields, config) {
  if (!embeddedIdFields || !Array.isArray(embeddedIdFields)) return;

  embeddedIdFields.forEach(field => {
    const isSortableType =
      field.type === 'String' || field.type === 'Integer' || field.type === 'Long' || field.type === 'UUID';

    const fieldConfig = {
      sortable: isSortableType,
      views: ['list', 'detail', 'edit', 'batchUpdate'],
    };

    if (field.typeKind === 'basic') {
      fieldConfig.searchOperators = ['equals'];
    }

    config.fields[`${field.parentField}.${field.name}`] = fieldConfig;
  });
}

/**
 * Build a map of FK ID fields that reference specific entities.
 */
export function buildFkIdFieldMap(fields) {
  const fkToEntityMap = new Map();
  const idToEntityMap = new Map();

  if (!Array.isArray(fields)) {
    return { fkToEntityMap, idToEntityMap };
  }

  fields.forEach(field => {
    if (field.typeKind === 'basic' && field.type === 'String') {
      const possibleEntityFieldName = field.name.replace(/Id$/, '');

      if (possibleEntityFieldName !== field.name) {
        const entityField = fields.find(f => f.name === possibleEntityFieldName && f.typeKind === 'entity');

        if (entityField) {
          const entityType = entityField.actualType || entityField.type;
          fkToEntityMap.set(`${entityType}:${possibleEntityFieldName}`, field.name);
          idToEntityMap.set(field.name, { entityType, entityField });
        }
      }
    }
  });

  return { fkToEntityMap, idToEntityMap };
}

export function processRegularField(
  context,
  field,
  config,
  idFieldName,
  embeddedIdFields,
  fkFieldMaps = { fkToEntityMap: new Map(), idToEntityMap: new Map() }
) {
  if (!config || !config.fields) {
    return;
  }

  if (embeddedIdFields && embeddedIdFields.some(ef => ef.name === field.name)) {
    return;
  }

  const embeddedIdFieldNames = Object.keys(config.fields)
    .filter(key => key.includes('.'))
    .map(key => key.split('.')[0]);

  if (embeddedIdFieldNames.includes(field.name)) {
    return;
  }

  const fieldConfig = createFieldConfig(field, idFieldName);

  if (!fieldConfig) {
    return;
  }

  addFieldMetadata(field, fieldConfig);
  setSearchOperators(field, fieldConfig, idFieldName);

  const { fkToEntityMap, idToEntityMap } = fkFieldMaps;

  if (field.typeKind === 'entity') {
    const entityType = field.actualType || field.type;
    const fkIdFieldKey = `${entityType}:${field.name}`;
    const hasFkIdField = fkToEntityMap.has(fkIdFieldKey);

    if (hasFkIdField) {
      fieldConfig.sortable = false;
      fieldConfig.views = ['list', 'detail'];
      fieldConfig.searchOperators = [];
    } else {
      processEntityReference(context, field, fieldConfig);
    }
  } else if (field.typeKind === 'map' || field.isMap) {
    processMapField(field, fieldConfig);
  } else if (field.typeKind === 'value') {
    processValueField(field, fieldConfig);
  } else if (idToEntityMap.has(field.name)) {
    const { entityType, entityField } = idToEntityMap.get(field.name);
    processFkIdFieldReference(context, field, fieldConfig, entityType, entityField);
  }

  config.fields[field.name] = fieldConfig;
}

export function processFkIdFieldReference(context, field, fieldConfig, entityType, _entityField) {
  if (!fieldConfig) {
    return;
  }

  fieldConfig.searchOperators = ['equals', 'in'];
  fieldConfig.reference = {
    entity: entityType,
    idField: field.name,
    idType: field.type,
    nameField: '<__MODIFY__>',
    multiple: false,
  };

  const baseEntityPath = getBaseEntityPath(context);
  const srcPath = path.join(context.root, baseEntityPath);
  const referenceEntityPath = findEntityFile(srcPath, entityType);

  if (referenceEntityPath) {
    updateFkIdReferenceInfo(context, referenceEntityPath, fieldConfig, baseEntityPath, srcPath);
  }
}

export function updateFkIdReferenceInfo(context, referenceEntityPath, fieldConfig, baseEntityPath, srcPath) {
  if (!referenceEntityPath || !fs.existsSync(referenceEntityPath)) {
    return;
  }

  const referenceEntityContent = fs.readFileSync(referenceEntityPath, 'utf8');
  const {
    idField: referenceIdField,
    fields: referenceFields,
    parentClass: referenceParentClass,
  } = analyzeEntity(referenceEntityContent);

  let actualReferenceIdField = referenceIdField;

  if (!actualReferenceIdField && referenceParentClass && referenceParentClass.importPath) {
    const parentInfo = analyzeReferenceParent(context, referenceParentClass, baseEntityPath, srcPath, referenceFields);
    actualReferenceIdField = parentInfo.actualReferenceIdField;
  }

  actualReferenceIdField = actualReferenceIdField || 'id';
  fieldConfig.reference.nameField = findNameField(referenceFields, actualReferenceIdField);
}

export function createFieldConfig(field, idFieldName) {
  return {
    sortable: isSortableField(field),
    views: getFieldViews(field, idFieldName),
  };
}

// A boolean is filtered, never sorted (isSortableSearchType in utils/search-operators.js says why).
export function isSortableField(field) {
  return (
    field.type === 'String' ||
    field.type === 'Integer' ||
    field.type === 'Long' ||
    field.type === 'Double' ||
    field.type === 'BigDecimal' ||
    field.type === 'LocalDate' ||
    field.type === 'LocalDateTime' ||
    field.type === 'ZonedDateTime' ||
    field.type === 'Instant' ||
    field.typeKind === 'enum'
  );
}

export function getFieldViews(field, idFieldName) {
  if (field.name === idFieldName) {
    return ['list', 'detail', 'edit'];
  }

  if (/Count$/i.test(field.name) || field.name === 'version') {
    return ['list', 'detail'];
  }

  if (field.type === 'String' || /sort|order/i.test(field.name)) {
    return ['list', 'detail', 'edit'];
  }

  return ['list', 'detail', 'edit', 'batchUpdate'];
}

export function addFieldMetadata(field, fieldConfig) {
  if (field.columnInfo) {
    if (field.columnInfo.nullable !== undefined) {
      fieldConfig.required = !field.columnInfo.nullable;
    }

    if (field.columnInfo.unique) {
      fieldConfig.unique = true;
    }

    if (field.columnInfo.length) {
      fieldConfig.maxLength = field.columnInfo.length;
    }
  }

  if (field.isNaturalId) fieldConfig.naturalId = true;
  if (field.isLob) fieldConfig.largeText = true;
}

export function setSearchOperators(field, fieldConfig, idFieldName) {
  if (field.typeKind === 'basic') {
    if (field.name === idFieldName) {
      fieldConfig.searchOperators = ['equals'];
    } else {
      fieldConfig.searchOperators = getSearchOperatorsForType(field.type);
    }
  } else if (field.typeKind === 'enum') {
    fieldConfig.searchOperators = ['equals', 'in'];
  }
}

export function getSearchOperatorsForType(type) {
  return defaultSearchOperators(type);
}

export function processMapField(field, fieldConfig) {
  if (!fieldConfig) {
    return;
  }

  fieldConfig.sortable = false;
  fieldConfig.searchOperators = [];
  fieldConfig.views = ['detail', 'edit'];
  fieldConfig.type = `Map<String, String>`;
  delete fieldConfig.maxLength;
}

/** A value kept in the row (a record or an embeddable in a JSON column): read and written whole, never searched. */
export function processValueField(field, fieldConfig) {
  if (!fieldConfig) {
    return;
  }

  fieldConfig.sortable = false;
  fieldConfig.searchOperators = [];
  fieldConfig.views = ['detail', 'edit'];
  fieldConfig.type = field.isCollection ? `${field.collectionType}<${field.actualType}>` : field.type;
  delete fieldConfig.maxLength;
}

export function processEntityReference(context, field, fieldConfig) {
  if (!fieldConfig) {
    return;
  }

  fieldConfig.searchOperators = ['equals'];
  fieldConfig.views = ['list', 'detail', 'edit'];
  fieldConfig.reference = {
    entity: field.actualType || field.type,
    idField: 'id',
    idType: 'Long',
    nameField: '<__MODIFY__>',
    multiple: field.isCollection,
  };

  const baseEntityPath = getBaseEntityPath(context);
  const srcPath = path.join(context.root, baseEntityPath);
  const referenceEntityPath = findEntityFile(srcPath, field.actualType || field.type);

  if (referenceEntityPath) {
    updateReferenceInfo(context, referenceEntityPath, fieldConfig, baseEntityPath, srcPath);
  }
}

export function updateReferenceInfo(context, referenceEntityPath, fieldConfig, baseEntityPath, srcPath) {
  if (!referenceEntityPath || !fs.existsSync(referenceEntityPath)) {
    return;
  }

  const referenceEntityContent = fs.readFileSync(referenceEntityPath, 'utf8');
  const {
    idField: referenceIdField,
    fields: referenceFields,
    parentClass: referenceParentClass,
  } = analyzeEntity(referenceEntityContent);

  let actualReferenceIdField = referenceIdField;
  let idFieldType = null;

  if (!actualReferenceIdField && referenceParentClass && referenceParentClass.importPath) {
    const parentInfo = analyzeReferenceParent(context, referenceParentClass, baseEntityPath, srcPath, referenceFields);
    actualReferenceIdField = parentInfo.actualReferenceIdField;
    idFieldType = parentInfo.idFieldType;
  }

  actualReferenceIdField = actualReferenceIdField || 'id';

  const idFieldInfo = referenceFields.find(f => f.name === actualReferenceIdField);
  if (idFieldInfo) {
    idFieldType = idFieldInfo.type;
  } else {
    idFieldType = 'UUID';
  }

  fieldConfig.reference.idField = actualReferenceIdField;
  fieldConfig.reference.idType = idFieldType;
  fieldConfig.reference.nameField = findNameField(referenceFields, actualReferenceIdField);
}
