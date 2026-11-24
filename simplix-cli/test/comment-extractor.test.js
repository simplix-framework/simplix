import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractComment, extractTableComment } from '../src/lib/comment-extractor.js';

describe('extractTableComment', () => {
  it('reads a class @Comment followed by single-line annotations', () => {
    const source = '@Entity\n@Comment("Job positions")\n@Getter\npublic class JobPosition {\n}\n';

    assert.strictEqual(extractTableComment(source), 'Job positions');
  });

  it('reads a class @Comment followed by a multi-line annotation', () => {
    const source = [
      '/** Roles. */',
      '@Entity',
      '@Table(',
      '\tname = "user_roles"',
      ')',
      '@Comment("Global user roles")',
      '@EntityEventConfig(',
      '\tonCreate = "CREATED"',
      ')',
      '@Getter',
      'public class UserRole extends BaseEntity<String> {',
      '\t@Comment("Unique role identifier")',
      '\tprivate String roleId;',
      '}',
    ].join('\n');

    assert.strictEqual(extractTableComment(source), 'Global user roles');
  });

  it('ignores a field @Comment when the class has none', () => {
    const source =
      '/** Plain entity. */\n@Entity\n@Table(\n name = "x"\n)\npublic class Plain {\n @Comment("Field")\n private String id;\n}\n';

    assert.notStrictEqual(extractTableComment(source), 'Field');
  });
});

describe('extractComment', () => {
  const source = [
    'public class Entry {',
    '    @Column(name = "actor_user_id")',
    '    @Comment("The operator of a manual entry")',
    '    private String actorUserId;',
    '',
    '    @Formula("(select u.name from users u where u.user_id = actor_user_id)")',
    '    private String actorName;',
    '',
    '    /** What a charge paid for. */',
    '    @Formula("(select h.feature from holds h where h.hold_id = hold_id)")',
    '    @Enumerated(EnumType.STRING)',
    '    private Feature chargeFeature;',
    '}',
  ].join('\n');

  it('never takes the @Comment of an earlier field', () => {
    assert.strictEqual(extractComment(source, 'actorName'), 'Actor Name');
  });

  it('falls back to the field name, not a neighbour @Comment', () => {
    assert.strictEqual(extractComment(source, 'chargeFeature'), 'Charge Feature');
  });

  it('still reads a field its own @Comment', () => {
    assert.strictEqual(extractComment(source, 'actorUserId'), 'The operator of a manual entry');
  });
});
