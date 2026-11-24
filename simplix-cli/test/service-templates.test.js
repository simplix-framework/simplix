import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { BUILT_IN_TEMPLATE_DIR } from '../src/lib/templates.js';

const templatesDir = BUILT_IN_TEMPLATE_DIR;

function source(relativePath) {
  return fs.readFileSync(path.join(templatesDir, relativePath), 'utf8');
}

/** The text from the first line containing `start` through the closing brace of that member. */
function member(template, start) {
  const from = template.indexOf(start);
  if (from < 0) {
    throw new Error(`"${start}" is not in the template`);
  }

  const closing = template.indexOf('\n    }\n', from);
  return template.slice(from, closing + '\n    }\n'.length);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function render(block, vars) {
  return ejs.render(block, {
    capitalizeFirstLetter,
    entityName: 'UserRole',
    classPrefix: 'UserRole',
    idFieldName: 'roleId',
    idType: 'String',
    hasEmbeddedId: false,
    embeddedIdType: 'UserRoleId',
    fields: [],
    ymlConfig: { idField: 'roleId', fields: {} },
    ...vars,
  });
}

describe('the ID guard in the built-in service template', () => {
  const service = source('service/EntityService.java.template');
  const update = member(service, 'public <%= classPrefix %>DetailDTO update(');

  it('throws the placeholder the HTTP layer resolves, not a message resolved at throw time', () => {
    const out = render(update);
    assert.ok(out.includes('if (!Objects.equals(entity.getRoleId(), updateDto.getRoleId())) {'));
    assert.ok(out.includes('throw new SimpliXGeneralException(ErrorCode.GEN_CONFLICT, "{error.id.cannot.change}", null);'));
    assert.doesNotMatch(out, /getMessage\(|messageSource|LocaleContextHolder/);
  });

  it('refuses before the DTO is mapped onto the entity', () => {
    const out = render(update);
    assert.ok(out.indexOf('{error.id.cannot.change}') > 0);
    assert.ok(out.indexOf('{error.id.cannot.change}') < out.indexOf('modelMapper.map(updateDto, entity);'));
  });

  it('imports what the guard uses', () => {
    assert.ok(service.includes('import dev.simplecore.simplix.core.exception.ErrorCode;'));
    assert.ok(service.includes('import dev.simplecore.simplix.core.exception.SimpliXGeneralException;'));
  });
});

describe('the ID guard in the built-in service test template', () => {
  const test = source('test/EntityServiceTest.java.template');
  const refusal = member(test, '@DisplayName("Should refuse an update that changes the ID")');

  it('asserts the key a placeholder names, never English prose', () => {
    const out = render(refusal);
    assert.ok(out.includes('updateDto.setRoleId(UUID.randomUUID().toString());'));
    assert.ok(out.includes('.isInstanceOf(SimpliXGeneralException.class)'));
    assert.ok(out.includes('.hasMessageContaining("error.id.cannot.change");'));
    assert.ok(out.includes('verify(repository, never()).saveAndFlush(any(UserRole.class));'));
    assert.ok(!out.includes('messageSource'));
  });

  it('changes the ID to another value of its own type', () => {
    assert.ok((render(refusal, { idType: 'Long' })).includes('updateDto.setRoleId(2L);'));
    assert.ok((render(refusal, { idType: 'Integer' })).includes('updateDto.setRoleId(2);'));
    assert.ok((render(refusal, { idType: 'UUID' })).includes('updateDto.setRoleId(UUID.randomUUID());'));
  });

  it('gives the update DTO the entity ID, so the updates that must succeed pass the guard', () => {
    const setUp = test.match(/updateDto = new <%= classPrefix %>UpdateDTO\(\);\n[^\n]*\n/)[0];
    assert.ok(render(setUp).includes('updateDto.setRoleId(testId);'));
    assert.ok(!render(setUp, { hasEmbeddedId: true }).includes('updateDto.setRoleId('));
  });

  it('imports the exception it asserts', () => {
    assert.ok(test.includes('import dev.simplecore.simplix.core.exception.SimpliXGeneralException;'));
  });

  it('is not generated for an embedded id, whose update DTO carries no id to change', () => {
    const guarded = test.slice(test.lastIndexOf('<% if (!hasEmbeddedId) { %>', test.indexOf(refusal)), test.indexOf(refusal));

    assert.match(guarded, /^<% if \(!hasEmbeddedId\) \{ %>\s*@Test\s*$/);
  });
});

describe('the answer the built-in service template gives after a write', () => {
  const service = source('service/EntityService.java.template');
  const project = member(service, 'private <%= classPrefix %>DetailDTO saveAndGetProjection(');

  it('reads the written row again before it maps the answer', () => {
    const out = render(project);
    const saved = out.indexOf('UserRole savedEntity = saveAndFlush(entity);');
    const refreshed = out.indexOf('entityManager.refresh(savedEntity);');
    const answered = out.indexOf('return findById(savedEntity.getRoleId(), UserRoleDetailDTO.class)');
    assert.ok(saved > 0);
    assert.ok(refreshed > saved);
    assert.ok(answered > refreshed);
  });
});
