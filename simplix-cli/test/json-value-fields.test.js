import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ejs from 'ejs';
import { BUILT_IN_TEMPLATE_DIR } from '../src/lib/templates.js';
import { templateVars } from './support/template-vars.js';
import { processRegularField } from '../src/lib/config/fields.js';
import { analyzeEntity } from '../src/lib/entity-analyzer.js';
import { createEntityTypeResolver, declaresEntity } from '../src/lib/entity-type-resolver.js';

const templatesDir = BUILT_IN_TEMPLATE_DIR;
const template = relativePath => fs.readFileSync(path.join(templatesDir, relativePath), 'utf8');

/** An entity with a JSON column holding a list of records beside a real many-to-many relation. */
const reportSource = `package dev.example.audit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import dev.example.audit.tag.entity.Tag;

import java.util.List;

@Entity
public class Report {

    @Id
    @Column(name = "report_id")
    private String reportId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "checks", nullable = false)
    private List<CheckResult> checks;

    @ManyToMany
    private List<Tag> tags;
}
`;

/** A value record kept in the JSON column; it is not an entity and has no table. */
const checkResultSource = `package dev.example.audit.entity;

/**
 * How one check ended. Kept in a report's JSON column; nothing here is an @Entity.
 */
public record CheckResult(String check, String status) {
}
`;

const tagSource = `package dev.example.audit.tag.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;

@Entity
@EntityListeners(Object.class)
public class Tag {
    @Id
    private String tagId;
}
`;

/** A resolver over sources held in memory, keyed by fully qualified name. */
function memoryResolver(sources) {
  return fullyQualifiedName => {
    const source = sources[fullyQualifiedName];
    return source === undefined ? undefined : declaresEntity(source);
  };
}

const sources = {
  'dev.example.audit.entity.CheckResult': checkResultSource,
  'dev.example.audit.tag.entity.Tag': tagSource,
};

const field = (fields, name) => {
  const found = fields.find(f => f.name === name);
  if (!found) throw new Error(`no field ${name} in the analysis`);
  return found;
};

describe('declaresEntity', () => {
  it('finds the @Entity mark, bare, with arguments or fully qualified', () => {
    assert.strictEqual(declaresEntity(tagSource), true);
    assert.strictEqual(declaresEntity('@Entity(name = "tags")\npublic class Tag {}'), true);
    assert.strictEqual(declaresEntity('@jakarta.persistence.Entity\npublic class Tag {}'), true);
  });

  it('is not fooled by an annotation whose name starts with Entity, or by a comment', () => {
    assert.strictEqual(declaresEntity('@EntityListeners(Object.class)\npublic class Audited {}'), false);
    assert.strictEqual(declaresEntity('/**\n * @Entity is not used here\n */\npublic record Value(String a) {}'), false);
    assert.strictEqual(declaresEntity(checkResultSource), false);
  });
});

describe('the entity analyzer: a JSON list of records next to a relation', () => {
  const { fields } = analyzeEntity(reportSource, { isEntityType: memoryResolver(sources) });

  it('reads the list of records as a plain value, keeping its element type and import', () => {
    const checks = field(fields, 'checks');
    assert.strictEqual(checks.typeKind, 'value');
    assert.ok(!checks.isRelation);
    assert.strictEqual(checks.isCollection, true);
    assert.strictEqual(checks.collectionType, 'List');
    assert.strictEqual(checks.actualType, 'CheckResult');
    assert.strictEqual(checks.importPath, 'dev.example.audit.entity.CheckResult');
  });

  it('still reads the list of entities as a relation', () => {
    const tags = field(fields, 'tags');
    assert.strictEqual(tags.typeKind, 'entity');
    assert.strictEqual(tags.isRelation, true);
    assert.strictEqual(tags.relationType, 'ManyToMany');
    assert.strictEqual(tags.importPath, 'dev.example.audit.tag.entity.Tag');
  });

  it('keeps a type whose source it cannot find a relation, as before', () => {
    const { fields: unresolved } = analyzeEntity(reportSource, { isEntityType: () => undefined });
    assert.strictEqual(field(unresolved, 'checks').typeKind, 'entity');
    assert.strictEqual(field(unresolved, 'checks').isRelation, true);
  });

  it('keeps every non-basic type a relation when no resolver is given, as before', () => {
    const { fields: legacy } = analyzeEntity(reportSource);
    assert.strictEqual(field(legacy, 'checks').typeKind, 'entity');
    assert.strictEqual(field(legacy, 'tags').typeKind, 'entity');
  });
});

describe('createEntityTypeResolver over a source tree', () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'simplix-entity-types-'));
    const write = (relative, content) => {
      const file = path.join(root, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    };

    write('audit/entity/CheckResult.java', checkResultSource);
    write('audit/tag/entity/Tag.java', tagSource);
    // The same simple name in another package, declared as an entity: the package decides.
    write(
      'billing/entity/CheckResult.java',
      'package dev.example.billing.entity;\n\nimport jakarta.persistence.Entity;\n\n@Entity\npublic class CheckResult {}\n'
    );
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('answers from the source whose package and name match', () => {
    const isEntityType = createEntityTypeResolver(root);
    assert.strictEqual(isEntityType('dev.example.audit.entity.CheckResult'), false);
    assert.strictEqual(isEntityType('dev.example.billing.entity.CheckResult'), true);
    assert.strictEqual(isEntityType('dev.example.audit.tag.entity.Tag'), true);
  });

  it('answers nothing for a type that is not in the tree', () => {
    const isEntityType = createEntityTypeResolver(root);
    assert.strictEqual(isEntityType('dev.example.audit.entity.Missing'), undefined);
    assert.strictEqual(isEntityType('dev.example.other.entity.CheckResult'), undefined);
  });

  it('answers nothing when the tree does not exist', () => {
    assert.strictEqual(createEntityTypeResolver(path.join(root, 'absent'))('dev.example.audit.entity.CheckResult'), undefined);
  });
});

describe('the built-in templates over the analysis', () => {
  const { fields } = analyzeEntity(reportSource, { isEntityType: memoryResolver(sources) });
  const ymlFields = {
    reportId: { views: ['list', 'detail'], searchOperators: ['equals', 'in'], sortable: true },
    checks: { views: ['detail'], searchOperators: [], sortable: false, type: 'List<CheckResult>' },
    tags: {
      views: ['detail'],
      searchOperators: [],
      reference: { entity: 'Tag', idField: 'tagId', idType: 'String', nameField: 'tagId', multiple: true },
    },
  };
  const vars = templateVars({
    entityName: 'Report',
    classPrefix: 'Report',
    fields,
    entityFields: fields,
    idFieldName: 'reportId',
    ymlConfig: { idField: 'reportId', fields: ymlFields },
    modulePath: 'audit',
    packagePaths: { service: 'dev.example.app.audit.service', dto: 'dev.example.app.audit.dto' },
    entityPackage: 'dev.example.audit.entity',
  });

  it('wires a service for the related entity and none for the value record', () => {
    const service = ejs.render(template('service/EntityService.java.template'), vars, { escape: s => s });

    assert.ok(service.includes('private final ObjectProvider<TagService> tagServiceProvider;'));
    assert.ok(!service.includes('CheckResultService'));
  });

  it('mocks a service for the related entity and none for the value record in the service test', () => {
    const test = template('test/EntityServiceTest.java.template');
    const out = ejs.render(test, { ...vars, ymlConfig: { ...vars.ymlConfig } }, { escape: s => s });
    assert.ok(out.includes('TagService'));
    assert.ok(!out.includes('CheckResultService'));
  });

  it('gives the DTO the element type the entity holds, and imports it', () => {
    const dto = ejs.render(template('dto/EntityDTOs.java.template'), vars, { escape: s => s });
    assert.match(dto, /^import dev\.example\.audit\.entity\.CheckResult;$/m);
    assert.match(dto, /private List<CheckResult> checks;/);
    assert.ok(!dto.includes('CheckResultService'));
  });
});

describe('config: the yml entry a JSON list of records starts with', () => {
  const { fields } = analyzeEntity(reportSource, { isEntityType: memoryResolver(sources) });

  /** The real field processing, over a project root that holds no source to look a reference up in. */
  function configFor(name) {
    const context = { root: path.join(os.tmpdir(), 'simplix-boot-no-such-project'), config: undefined, log: () => {} };
    const config = { fields: {} };

    processRegularField(context, field(fields, name), config, 'reportId', []);
    return config.fields[name];
  }

  it('declares the list of records as a value of its own type, with no reference block', () => {
    const entry = configFor('checks');

    assert.strictEqual(entry.reference, undefined);
    assert.strictEqual(entry.sortable, false);
    assert.deepStrictEqual(entry.searchOperators, []);
    assert.deepStrictEqual(entry.views, ['detail', 'edit']);
    assert.strictEqual(entry.type, 'List<CheckResult>');
  });

  it('still declares the list of entities as a reference', () => {
    const entry = configFor('tags');

    assert.strictEqual(entry.type, undefined);
    assert.strictEqual(entry.reference.entity, 'Tag');
    assert.strictEqual(entry.reference.multiple, true);
  });
});
