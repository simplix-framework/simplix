/**
 * Default search operators per Java type, shared by `config` (which writes them into a new yml)
 * and `entity` (which falls back to them for an embedded id field the yml does not mention).
 *
 * A temporal field offers the inclusive pair plus `between`. The frontend's date range filter
 * writes `<field>.greaterThanOrEqualTo` and `<field>.lessThanOrEqualTo`; a field declaring only
 * the exclusive `greaterThan` / `lessThan` refuses that request as an invalid parameter, so every
 * ranged read of the list fails. The exclusive pair stays available by writing it in the yml.
 */

const TEMPORAL_TYPES = Object.freeze([
  'Instant',
  'LocalDate',
  'LocalTime',
  'LocalDateTime',
  'OffsetDateTime',
  'ZonedDateTime',
]);

const NUMERIC_TYPES = Object.freeze(['Integer', 'Long', 'Double', 'BigDecimal']);

/**
 * Types whose column cannot be a sort key. The paging query aggregates the sort column as
 * `max(<column>)` and PostgreSQL has no `max(boolean)`, so a boolean `@SearchableField` declared
 * `sortable = true` answers 500 the moment anybody sorts by it, and puts the sort arrow in the
 * list header that triggers it.
 */
const UNSORTABLE_TYPES = Object.freeze(['boolean', 'Boolean']);

/**
 * @param {string} type a simple Java type name
 * @returns {boolean} whether the type holds a point in time, a date, or a wall-clock time
 */
export function isTemporalType(type) {
  return TEMPORAL_TYPES.includes(type);
}

/**
 * @param {string} type a simple Java type name, primitive spellings included
 * @returns {boolean} whether a search field of that type may be generated with `sortable = true`
 */
export function isSortableSearchType(type) {
  return !UNSORTABLE_TYPES.includes(type);
}

/**
 * @param {string} type a simple Java type name
 * @returns {string[]} the yml searchOperators a field of that type starts with
 */
export function defaultSearchOperators(type) {
  if (type === 'String') {
    return ['equals', 'contains'];
  }

  if (NUMERIC_TYPES.includes(type)) {
    return ['equals', 'greaterThan', 'lessThan'];
  }

  if (isTemporalType(type)) {
    return ['between', 'greaterThanOrEqual', 'lessThanOrEqual'];
  }

  return ['equals'];
}

const OPERATOR_CONSTANTS = Object.freeze({
  greaterThanOrEqual: 'GREATER_THAN_OR_EQUAL_TO',
  greaterThanOrEquals: 'GREATER_THAN_OR_EQUAL_TO',
  lessThanOrEqual: 'LESS_THAN_OR_EQUAL_TO',
  lessThanOrEquals: 'LESS_THAN_OR_EQUAL_TO',
});

/**
 * Converts one yml searchOperators entry to its SearchOperator enum constant. The yml names are
 * camelCase; the constants are UPPER_SNAKE, with the inclusive comparisons spelled
 * `..._OR_EQUAL_TO`.
 *
 * @param {string} operator a yml operator name such as `greaterThanOrEqual` or `isNull`
 * @returns {string} the SearchOperator constant name
 */
export function toSearchOperatorConstant(operator) {
  if (OPERATOR_CONSTANTS[operator]) {
    return OPERATOR_CONSTANTS[operator];
  }

  return operator.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}
