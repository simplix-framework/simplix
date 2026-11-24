import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveControllerName } from '../src/lib/controller-name.js';

describe('resolveControllerName', () => {
  it('defaults to <Entity>RestController when the yml sets no controllerName', () => {
    assert.strictEqual(resolveControllerName('UserRole', {}), 'UserRoleRestController');
    assert.strictEqual(resolveControllerName('UserRole', undefined), 'UserRoleRestController');
    assert.strictEqual(resolveControllerName('UserRole', { controllerName: '' }), 'UserRoleRestController');
  });

  it('returns the configured controllerName', () => {
    assert.strictEqual(resolveControllerName('UserRole', { controllerName: 'AdminUserRoleRestController' }), 'AdminUserRoleRestController');
  });

  it('rejects a name that is not a Java class name', () => {
    assert.throws(() => resolveControllerName('UserRole', { controllerName: 'adminUserRole' }), { message: /controllerName/ });
    assert.throws(() => resolveControllerName('UserRole', { controllerName: 'Admin.UserRole' }), { message: /controllerName/ });
    assert.throws(() => resolveControllerName('UserRole', { controllerName: 'Admin.java' }), { message: /controllerName/ });
    assert.throws(() => resolveControllerName('UserRole', { controllerName: 42 }), { message: /controllerName/ });
  });

  it('requires an entity name', () => {
    assert.throws(() => resolveControllerName('', {}), { message: /entityName/ });
  });
});
