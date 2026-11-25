import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import yaml from 'js-yaml';
import { entityFieldLookup } from '../src/lib/generate/template-vars.js';
import { copyFixture, read, runCli, write } from './support/fixture.js';

const TESTS = 'generated/test/java/com/example/library/web/catalog/service';

/** Removes fields from an entity yml of a fixture copy, as a developer who trims the yml does. */
function dropYmlFields(root, entity, names) {
  const relativePath = `.simplix/entity/${entity}.yml`;
  const config = yaml.load(read(root, relativePath));
  for (const name of names) {
    assert.ok(config.fields[name], `${entity}.yml must list ${name} for the case to mean anything`);
    delete config.fields[name];
  }
  write(root, relativePath, yaml.dump(config));
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

describe('entityFieldLookup', () => {
  const has = entityFieldLookup([{ name: 'title' }], [{ name: 'createdAt' }]);

  it('finds a field the entity declares and a field a parent class declares', () => {
    assert.strictEqual(has('title'), true);
    assert.strictEqual(has('createdAt'), true);
  });

  it('answers false for a field neither declares', () => {
    assert.strictEqual(has('updatedAt'), false);
  });
});

describe('audit timestamps in the generated service tests', () => {
  let root;

  before(() => {
    root = copyFixture('library');
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('sets the timestamps a parent class declares when the yml does not list them', () => {
    dropYmlFields(root, 'Author', ['createdAt', 'updatedAt']);

    const result = runCli(['generate', 'Author'], root);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    const test = read(root, `${TESTS}/AuthorServiceTest.java`);
    assert.strictEqual(count(test, 'entity.setCreatedAt(Instant.now());'), 1);
    assert.strictEqual(count(test, 'entity.setUpdatedAt(Instant.now());'), 1);
  });

  it('sets them on the node and on its child in a tree service test', () => {
    dropYmlFields(root, 'Shelf', ['createdAt', 'updatedAt']);

    const result = runCli(['generate', 'Shelf'], root);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    const test = read(root, `${TESTS}/ShelfTreeServiceTest.java`);
    assert.strictEqual(count(test, 'entity.setCreatedAt(Instant.now());'), 1);
    assert.strictEqual(count(test, 'childEntity.setCreatedAt(Instant.now());'), 1);
    assert.strictEqual(count(test, 'entity.setUpdatedAt(Instant.now());'), 1);
    assert.strictEqual(count(test, 'childEntity.setUpdatedAt(Instant.now());'), 1);
  });

  it('reads the parent class without reporting it in the output of generate', () => {
    const result = runCli(['generate', 'Book', '--force'], root);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.doesNotMatch(result.stdout, /parent class/i);
  });

  it('sets no timestamp on an entity that has none, in its own source or in a parent class', () => {
    write(
      root,
      'src/main/java/com/example/library/domain/catalog/entity/Note.java',
      [
        'package com.example.library.domain.catalog.entity;',
        '',
        'import jakarta.persistence.Column;',
        'import jakarta.persistence.Entity;',
        'import jakarta.persistence.Id;',
        'import jakarta.persistence.Table;',
        'import lombok.Getter;',
        'import lombok.Setter;',
        '',
        '@Entity',
        '@Table(name = "notes")',
        '@Getter',
        '@Setter',
        'public class Note {',
        '',
        '    @Id',
        '    @Column(name = "note_id", nullable = false)',
        '    private String noteId;',
        '',
        '    @Column(name = "text", length = 500)',
        '    private String text;',
        '}',
        '',
      ].join('\n')
    );
    assert.strictEqual(runCli(['config', 'Note'], root).status, 0);

    const result = runCli(['generate', 'Note'], root);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    const test = read(root, `${TESTS}/NoteServiceTest.java`);
    assert.strictEqual(count(test, 'setCreatedAt'), 0);
    assert.strictEqual(count(test, 'setUpdatedAt'), 0);
  });
});
