import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseArguments } from '../src/lib/args.js';

const spec = {
  positionals: ['entityName'],
  options: {
    force: { type: 'boolean', default: false },
    test: { type: 'boolean', default: true },
    module: { type: 'string' },
  },
};

describe('parseArguments', () => {
  it('gives every option its default when none is passed', () => {
    assert.deepStrictEqual(parseArguments(['Book'], spec), {
      positionals: { entityName: 'Book' },
      options: { force: false, test: true, module: undefined },
    });
  });

  it('turns a boolean on by its name and off by its no- form', () => {
    const { options } = parseArguments(['Book', '--force', '--no-test'], spec);

    assert.strictEqual(options.force, true);
    assert.strictEqual(options.test, false);
  });

  it('reads a string option from the next argument or after an equals sign', () => {
    assert.strictEqual(parseArguments(['Book', '--module', 'admin/billing'], spec).options.module, 'admin/billing');
    assert.strictEqual(parseArguments(['--module=admin/billing', 'Book'], spec).options.module, 'admin/billing');
  });

  it('leaves a positional the command line does not give undefined', () => {
    assert.strictEqual(parseArguments(['--force'], spec).positionals.entityName, undefined);
  });

  it('refuses an option the command does not declare', () => {
    assert.throws(() => parseArguments(['Book', '--forse'], spec), { name: 'CliError', message: 'Unknown option: --forse' });
  });

  it('refuses the no- form of an option that is not a boolean', () => {
    assert.throws(() => parseArguments(['--no-module'], spec), { name: 'CliError', message: 'Unknown option: --no-module' });
  });

  it('refuses a string option with no value, or with another option where its value belongs', () => {
    assert.throws(() => parseArguments(['Book', '--module'], spec), { message: 'Option --module needs a value' });
    assert.throws(() => parseArguments(['Book', '--module', '--force'], spec), { message: 'Option --module needs a value' });
  });

  it('refuses a value on a boolean option', () => {
    assert.throws(() => parseArguments(['--force=yes'], spec), { message: 'Option --force takes no value' });
  });

  it('refuses a positional beyond the declared ones, naming it', () => {
    assert.throws(() => parseArguments(['Book', 'Author'], spec), { message: 'Unexpected argument: Author' });
  });
});
