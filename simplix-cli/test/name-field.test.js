import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { warnOnNameFieldConflict } from '../src/commands/generate.js';
import { analyzeEntity } from '../src/lib/entity-analyzer.js';
import { findNameField } from '../src/lib/name-field.js';

const entitySource = () => `package dev.example.release.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import dev.simplecore.simplix.core.annotation.NameField;

@Entity
public class ReleaseArtifact {

    @Id
    @Column(name = "release_artifact_id")
    private String releaseArtifactId;

    @Column(name = "name")
    private String name;

    @NameField
    @Column(name = "artifact_name")
    private String artifactName;
}
`;

describe('the entity analyzer', () => {
  it('flags the field marked @NameField and no other', () => {
    const { fields } = analyzeEntity(entitySource());
    assert.deepStrictEqual(fields.filter(f => f.isNameField).map(f => f.name), ['artifactName']);
  });

  it('flags nothing where the entity marks no field', () => {
    const unmarked = entitySource().replace('    @NameField\n', '');
    assert.ok(!unmarked.includes('    @NameField'));
    assert.strictEqual(analyzeEntity(unmarked).fields.some(f => f.isNameField), false);
  });
});

describe('findNameField', () => {
  const fields = [
    { name: 'name', type: 'String' },
    { name: 'artifactName', type: 'String', isNameField: true },
  ];

  it('takes the marked field ahead of the conventional candidates', () => {
    // `name` is the first candidate by convention; the mark is the entity saying otherwise.
    assert.strictEqual(findNameField(fields, 'releaseArtifactId'), 'artifactName');
  });

  it('keeps the convention where no field is marked', () => {
    assert.strictEqual(findNameField(
        fields.map(({ isNameField: _unused, ...rest }) => rest),
        'releaseArtifactId'
      ), 'name');
  });
});

describe('entity: warnOnNameFieldConflict', () => {
  const run = (yml, fields) => {
    const messages = [];
    warnOnNameFieldConflict(fields, 'ReleaseArtifact', yml, message => messages.push(message));
    return messages;
  };

  const marked = [{ name: 'artifactName', isNameField: true }, { name: 'name' }];

  it('names the entity, both fields and the yml to fix when they differ', () => {
    const [message] = run({ nameField: 'name' }, marked);
    assert.ok(message.includes('ReleaseArtifact'));
    assert.ok(message.includes('artifactName @NameField'));
    assert.ok(message.includes('nameField: name'));
    assert.ok(message.includes('set nameField: artifactName'));
  });

  it('is quiet when the yml agrees, when the entity marks nothing and when the yml names nothing', () => {
    assert.deepStrictEqual(run({ nameField: 'artifactName' }, marked), []);
    assert.deepStrictEqual(run({ nameField: 'name' }, [{ name: 'name' }]), []);
    assert.deepStrictEqual(run({}, marked), []);
  });
});
