import lodash from 'lodash';

/** Upper-cases the first character of a string; an empty or missing string gives an empty string. */
export function capitalizeFirstLetter(string) {
  if (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return '';
}

/**
 * Turns the import of a referenced entity into the import of the service generated for it, by
 * moving the entity's domain package to the web layer.
 *
 * @param {string} entityImport the fully qualified entity class
 * @param {string} entityType the entity's simple class name
 * @returns {string} the fully qualified service class
 */
export function transformImportForService(entityImport, entityType) {
  const patterns = [
    { from: /\.domain\.entities\./, to: '.web.' },
    { from: /\.domain\.[^.]+\.entity\./, to: '.web.' },
    { from: /\.domain\./, to: '.web.' },
    { from: /\.entities\./, to: '.web.' },
    { from: /\.entity\./, to: '.web.' },
  ];

  let servicePath = entityImport;
  for (const pattern of patterns) {
    if (pattern.from.test(servicePath)) {
      servicePath = servicePath.replace(pattern.from, pattern.to);
      break;
    }
  }

  if (!servicePath.endsWith('Service')) {
    servicePath = servicePath.replace(new RegExp(`\\.${entityType}$`), `.service.${entityType}Service`);
  }

  return servicePath;
}

/** The fields whose name marks the position of a record in an ordered list. */
const ORDER_FIELD_NAMES = [
  'displayOrder',
  'itemOrder',
  'sortOrder',
  'order',
  'priority',
  'listOrder',
  'menuOrder',
  'displaySeq',
  'sortIndex',
];

/** The first field an ordered list is ordered by, or undefined. */
export function findOrderField(fields) {
  return fields.find(field => ORDER_FIELD_NAMES.includes(field.name));
}

function propertyType(embeddedIdFields, propertyName) {
  if (!Array.isArray(embeddedIdFields)) {
    return 'String';
  }

  const field = embeddedIdFields.find(f => f.name === propertyName);

  return field ? field.type : 'String';
}

function neededImports(embeddedIdFields) {
  const imports = [];
  if (Array.isArray(embeddedIdFields)) {
    embeddedIdFields.forEach(field => {
      if (field.type === 'LocalDateTime') {
        imports.push('java.time.LocalDateTime');
      } else if (field.type === 'UUID') {
        imports.push('java.util.UUID');
      }
    });
  }

  return [...new Set(imports)];
}

/** The moment of generation as an ISO timestamp in Korea Standard Time. */
function generatedAt() {
  const shifted = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return shifted.toISOString().replace('Z', '+09:00');
}

/**
 * The lookup a template asks whether the entity carries a field, declared by the entity itself or
 * by a parent class.
 *
 * @param {object[]} fields the entity's own fields
 * @param {object[]} inheritedFields the fields of its parent classes
 * @returns {(name: string) => boolean} whether a field of that name exists
 */
export function entityFieldLookup(fields, inheritedFields) {
  const names = new Set([...fields, ...inheritedFields].map(field => field.name));
  return name => names.has(name);
}

/**
 * Builds the variables every template is rendered with.
 *
 * @param {object} input
 * @param {object} input.props the names, packages and paths resolved for the entity
 * @param {object} [input.entityConfig] the parsed entity yml
 * @param {string} input.entityComment the entity's table comment
 * @param {object} input.analysis what the entity analyzer read from the source
 * @param {object[]} input.fields the entity fields, with service imports resolved
 * @param {object[]} [input.inheritedFields] the fields of the entity's parent classes whose source is
 *   under the scan path, without those the entity declares again
 * @param {string} input.controllerName the REST controller's class name
 * @param {string[]} input.dtoExcludeFields the fields every DTO leaves out
 * @param {object} input.searchFields the embedded id and entity search fields
 * @param {boolean} input.hasTreeEntity whether the entity implements `TreeEntity`
 * @param {object} [input.treeEntityInterface] that interface, as analyzed
 * @param {object} input.supportClasses the application classes generated code may call
 * @returns {object} the template variables
 */
export function buildTemplateVars({
  props,
  entityConfig,
  entityComment,
  analysis,
  fields,
  inheritedFields = [],
  controllerName,
  dtoExcludeFields,
  searchFields,
  hasTreeEntity,
  treeEntityInterface,
  supportClasses,
}) {
  const { idType, embeddedIdField, embeddedIdFields } = analysis;
  const hasEmbeddedId = Boolean(embeddedIdField);
  const embeddedIdPropertyNames =
    hasEmbeddedId && embeddedIdFields && embeddedIdFields.length > 0 ? embeddedIdFields.map(field => field.name) : [];
  const otherEntityField = fields.find(f => !f.id && f.name !== embeddedIdField)?.name || 'someField';
  const orderField = findOrderField(fields);

  return {
    ...props,
    entityComment,
    fields,
    idType,
    entityFields: fields,
    inheritedFields,
    entityHasField: entityFieldLookup(fields, inheritedFields),
    entityNameLowerFirst: props.entityName.charAt(0).toLowerCase() + props.entityName.slice(1),
    idFieldName: entityConfig?.idField || 'id',
    controllerName,
    classPrefixLowerFirst: props.classPrefix.charAt(0).toLowerCase() + props.classPrefix.slice(1),
    capitalizeFirstLetter,

    hasEmbeddedId,
    embeddedIdField,
    embeddedIdType: hasEmbeddedId ? idType : null,
    embeddedIdPropertyNames,
    embeddedIdPropertyName1: embeddedIdPropertyNames[0] || 'propertyName1',
    embeddedIdPropertyName2: embeddedIdPropertyNames[1] || 'propertyName2',
    otherEntityField,
    embeddedIdFields,

    embeddedIdSearchFields: searchFields.embeddedIdSearchFields,
    entitySearchFields: searchFields.entitySearchFields,

    embeddedFieldCapitalized: embeddedIdField
      ? embeddedIdField + capitalizeFirstLetter(embeddedIdPropertyNames[0] || 'propertyName1')
      : '',
    embeddedField2Capitalized: embeddedIdField
      ? embeddedIdField + capitalizeFirstLetter(embeddedIdPropertyNames[1] || 'propertyName2')
      : '',
    otherFieldCapitalized: capitalizeFirstLetter(otherEntityField),
    propType1: propertyType(embeddedIdFields, embeddedIdPropertyNames[0]),
    propType2: propertyType(embeddedIdFields, embeddedIdPropertyNames[1]),
    importsArray: neededImports(embeddedIdFields),

    ymlConfig: {
      ...entityConfig,
      thymeleafBaseDir: entityConfig?.thymeleafBaseDir || '',
    },

    dtoExcludeFields,

    hasOrderField: Boolean(orderField),
    orderField,

    hasTreeEntity,
    treeEntityInterface,

    supportClasses,

    _: lodash,
    generatedAt: generatedAt(),
  };
}
