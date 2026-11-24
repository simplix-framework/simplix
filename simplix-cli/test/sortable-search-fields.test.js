import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { isSortableField } from '../src/lib/config/fields.js';
import { prepareSearchFields } from '../src/lib/generate/search-fields.js';
import { isSortableSearchType } from '../src/lib/search-operators.js';
import { BUILT_IN_TEMPLATE_DIR } from '../src/lib/templates.js';
import { templateVars } from './support/template-vars.js';

const dtoTemplate = fs.readFileSync(path.join(BUILT_IN_TEMPLATE_DIR, 'dto/EntityDTOs.java.template'), 'utf8');

/** The yml of a Device entity and the log its warnings are captured in. */
function generatorFor(ymlFields) {
  const messages = [];
  const self = {
    ymlName: 'Device',
    entityConfig: { idField: 'deviceId', fields: ymlFields },
    log: message => messages.push(message),
  };
  return { self, messages };
}

function prepare(self, fields, extra = {}) {
  return prepareSearchFields({
    ...self,
    fields,
    embeddedIdFields: [],
    embeddedIdPropertyNames: [],
    embeddedIdField: null,
    hasEmbeddedId: false,
    ...extra,
  });
}

/** The whole built-in DTO template, rendered with the search fields the generator prepared. */
function renderDtos(entitySearchFields, ymlFields) {
  return ejs.render(
    dtoTemplate,
    templateVars({
      entityName: 'Device',
      classPrefix: 'Device',
      idFieldName: 'deviceId',
      entitySearchFields,
      ymlConfig: { idField: 'deviceId', fields: ymlFields },
      modulePath: 'device',
      entityPackage: 'dev.example.app.entity',
    }),
    { escape: s => s }
  );
}

/** The `@SearchableField(...)` line that targets one entity field. */
function annotationFor(rendered, entityField) {
  const line = rendered.split('\n').find(l => l.includes(`@SearchableField(entityField = "${entityField}"`));
  if (!line) {
    throw new Error(`no @SearchableField for ${entityField} in the rendered DTOs`);
  }

  return line;
}

describe('isSortableSearchType', () => {
  for (const each of ['Boolean', 'boolean'])
    it('refuses %s, which has no max() on PostgreSQL'.replace('%s', each), () => (type => {
    assert.strictEqual(isSortableSearchType(type), false);
  })(each));

  for (const each of ['String', 'Integer', 'Long', 'Instant', 'LocalDate', 'BigDecimal', 'UUID'])
    it('accepts %s'.replace('%s', each), () => (type => {
    assert.strictEqual(isSortableSearchType(type), true);
  })(each));
});

describe('config: the sortable flag a new yml starts with', () => {
  const sortable = field => isSortableField(field);

  it('is off for a Boolean field', () => {
    assert.strictEqual(sortable({ name: 'enabled', type: 'Boolean' }), false);
  });

  for (const each of ['String', 'Integer', 'Long', 'Double', 'BigDecimal', 'LocalDate', 'Instant'])
    it('stays on for %s'.replace('%s', each), () => (type => {
    assert.strictEqual(sortable({ name: 'value', type }), true);
  })(each));

  it('stays on for an enum', () => {
    assert.strictEqual(sortable({ name: 'status', type: 'DeviceStatus', typeKind: 'enum' }), true);
  });
});

describe('entity: prepareSearchFields', () => {
  const ymlFields = {
    name: { sortable: true, searchOperators: ['equals', 'contains'] },
    enabled: { sortable: true, searchOperators: ['equals'] },
    active: { sortable: true, searchOperators: ['equals'] },
    archived: { sortable: false, searchOperators: ['equals'] },
  };
  const entityFields = [
    { name: 'name', type: 'String' },
    { name: 'enabled', type: 'Boolean' },
    { name: 'active', type: 'boolean' },
    { name: 'archived', type: 'Boolean' },
  ];

  it('drops sortable on a Boolean field and keeps it on a String field', () => {
    const { self } = generatorFor(ymlFields);
    const { entitySearchFields } = prepare(self, entityFields);
    const sortableOf = name => entitySearchFields.find(f => f.name === name).sortable;

    assert.strictEqual(sortableOf('name'), true);
    assert.strictEqual(sortableOf('enabled'), false);
    assert.strictEqual(sortableOf('active'), false);
    assert.strictEqual(sortableOf('archived'), false);
  });

  it('names the entity, the field and the yml line to fix, once per offending field', () => {
    const { self, messages } = generatorFor(ymlFields);
    prepare(self, entityFields);

    assert.strictEqual(messages.length, 2);
    assert.ok(messages[0].includes('Device.enabled is Boolean'));
    assert.ok(messages[0].includes('sortable: false in .simplix/entity/Device.yml'));
    assert.ok(messages[1].includes('Device.active is boolean'));
  });

  it('says nothing when no sortable Boolean is declared', () => {
    const { self, messages } = generatorFor({ name: ymlFields.name, archived: ymlFields.archived });
    prepare(self, entityFields);

    assert.deepStrictEqual(messages, []);
  });

  it('covers a part of an embedded id through the same rule', () => {
    const { self, messages } = generatorFor({
      'id.region': { sortable: true, searchOperators: ['equals'] },
      'id.primary': { sortable: true, searchOperators: ['equals'] },
    });
    const { embeddedIdSearchFields } = prepare(self, [], {
      hasEmbeddedId: true,
      embeddedIdField: 'id',
      embeddedIdFields: [
        { name: 'region', type: 'String' },
        { name: 'primary', type: 'Boolean' },
      ],
    });

    assert.strictEqual(embeddedIdSearchFields.find(f => f.name === 'region').sortable, true);
    assert.strictEqual(embeddedIdSearchFields.find(f => f.name === 'primary').sortable, false);
    assert.strictEqual(messages.length, 1);
    assert.ok(messages[0].includes('Device.id.primary is Boolean'));
  });
});

describe('the built-in DTO template over the prepared search fields', () => {
  const ymlFields = {
    name: { sortable: true, searchOperators: ['equals', 'contains'] },
    enabled: { sortable: true, searchOperators: ['equals'] },
    active: { sortable: true, searchOperators: ['equals'] },
  };
  const entityFields = [
    { name: 'name', type: 'String' },
    { name: 'enabled', type: 'Boolean' },
    { name: 'active', type: 'boolean' },
  ];

  it('writes sortable = true for the String field and for no Boolean field', () => {
    const { self } = generatorFor(ymlFields);
    const { entitySearchFields } = prepare(self, entityFields);
    const rendered = renderDtos(entitySearchFields, ymlFields);

    assert.ok((annotationFor(rendered, 'name')).includes('sortable = true'));
    assert.ok(!(annotationFor(rendered, 'enabled')).includes('sortable'));
    assert.ok(!(annotationFor(rendered, 'active')).includes('sortable'));
    assert.ok(rendered.includes('private Boolean enabled;'));
    assert.ok(rendered.includes('private Boolean active;'));
  });

  it('drops sortable on a Boolean field by itself, for a field only the yml declares', () => {
    const unguarded = entityFields.map(f => ({
      name: f.name,
      type: f.type,
      comment: '',
      searchOperators: ymlFields[f.name].searchOperators,
      sortable: true,
      entityField: f.name,
    }));
    const rendered = renderDtos(unguarded, ymlFields);

    assert.ok(annotationFor(rendered, 'name').includes('sortable = true'));
    assert.ok(!annotationFor(rendered, 'enabled').includes('sortable'));
    assert.ok(!annotationFor(rendered, 'active').includes('sortable'));
  });
});
