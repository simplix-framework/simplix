import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getSearchOperatorsForType } from '../src/lib/config/fields.js';
import { prepareSearchFields } from '../src/lib/generate/search-fields.js';
import {
  defaultSearchOperators,
  isTemporalType,
  toSearchOperatorConstant,
} from '../src/lib/search-operators.js';

const TEMPORAL = ['Instant', 'LocalDate', 'LocalTime', 'LocalDateTime', 'OffsetDateTime', 'ZonedDateTime'];

describe('defaultSearchOperators', () => {
  for (const each of TEMPORAL)
    it('offers the inclusive bounds and between for %s'.replace('%s', each), () => (type => {
    assert.deepStrictEqual(defaultSearchOperators(type), ['between', 'greaterThanOrEqual', 'lessThanOrEqual']);
  })(each));

  for (const each of TEMPORAL)
    it('never offers the exclusive bounds alone for %s'.replace('%s', each), () => (type => {
    const operators = defaultSearchOperators(type);
    assert.ok(!operators.includes('greaterThan'));
    assert.ok(!operators.includes('lessThan'));
  })(each));

  for (const each of ['Integer', 'Long', 'Double', 'BigDecimal'])
    it('keeps equals and the exclusive range for %s'.replace('%s', each), () => (type => {
    assert.deepStrictEqual(defaultSearchOperators(type), ['equals', 'greaterThan', 'lessThan']);
  })(each));

  it('keeps the text, flag and fallback defaults', () => {
    assert.deepStrictEqual(defaultSearchOperators('String'), ['equals', 'contains']);
    assert.deepStrictEqual(defaultSearchOperators('Boolean'), ['equals']);
    assert.deepStrictEqual(defaultSearchOperators('UUID'), ['equals']);
    assert.deepStrictEqual(defaultSearchOperators('SomethingElse'), ['equals']);
  });

  it('classifies the temporal types and nothing else', () => {
    TEMPORAL.forEach(type => assert.strictEqual(isTemporalType(type), true));
    ['String', 'Long', 'Boolean', 'Date'].forEach(type => assert.strictEqual(isTemporalType(type), false));
  });
});

describe('the generators that write a default', () => {
  for (const each of TEMPORAL)
    it('config writes the inclusive pair into the yml of a %s field'.replace('%s', each), () => (type => {
    assert.deepStrictEqual(getSearchOperatorsForType(type), defaultSearchOperators(type));
  })(each));

  for (const each of TEMPORAL)
    it('entity falls back to the inclusive pair for a %s id field'.replace('%s', each), () => (type => {
    const { embeddedIdSearchFields } = prepareSearchFields({
      ymlName: 'Reading',
      entityConfig: { fields: {} },
      log: () => {},
      fields: [],
      embeddedIdFields: [{ name: 'takenAt', type }],
      embeddedIdPropertyNames: ['takenAt'],
      embeddedIdField: 'id',
      hasEmbeddedId: true,
    });

    assert.deepStrictEqual(embeddedIdSearchFields[0].searchOperators, defaultSearchOperators(type));
  })(each));
});

describe('toSearchOperatorConstant', () => {
  it('spells the inclusive comparisons with the OR_EQUAL_TO suffix', () => {
    assert.strictEqual(toSearchOperatorConstant('greaterThanOrEqual'), 'GREATER_THAN_OR_EQUAL_TO');
    assert.strictEqual(toSearchOperatorConstant('greaterThanOrEquals'), 'GREATER_THAN_OR_EQUAL_TO');
    assert.strictEqual(toSearchOperatorConstant('lessThanOrEqual'), 'LESS_THAN_OR_EQUAL_TO');
    assert.strictEqual(toSearchOperatorConstant('lessThanOrEquals'), 'LESS_THAN_OR_EQUAL_TO');
  });

  it('turns any other camelCase name into UPPER_SNAKE', () => {
    assert.strictEqual(toSearchOperatorConstant('greaterThan'), 'GREATER_THAN');
    assert.strictEqual(toSearchOperatorConstant('startsWith'), 'STARTS_WITH');
    assert.strictEqual(toSearchOperatorConstant('isNotNull'), 'IS_NOT_NULL');
    assert.strictEqual(toSearchOperatorConstant('between'), 'BETWEEN');
  });
});
