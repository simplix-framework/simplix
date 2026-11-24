import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveEntityType } from '../src/lib/entity-type.js';

describe('resolveEntityType', () => {
  it('is the yml name when the yml names no entity, or the same one', () => {
    assert.strictEqual(resolveEntityType('Order', {}), 'Order');
    assert.strictEqual(resolveEntityType('Order', undefined), 'Order');
    assert.strictEqual(resolveEntityType('Order', { entity: 'Order' }), 'Order');
  });

  it('is the entity the yml names for a second surface over it', () => {
    assert.strictEqual(resolveEntityType('MyOrder', { entity: 'Order' }), 'Order');
  });

  it('rejects an entity that is not a Java class name', () => {
    assert.throws(() => resolveEntityType('MyOrder', { entity: 'order' }), { message: /entity/ });
    assert.throws(() => resolveEntityType('MyOrder', { entity: 'a.Order' }), { message: /entity/ });
    assert.throws(() => resolveEntityType('MyOrder', { entity: 7 }), { message: /entity/ });
  });

  it('requires a name', () => {
    assert.throws(() => resolveEntityType('', {}), { message: /name/ });
  });
});
