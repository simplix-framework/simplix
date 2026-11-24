import { CliError } from './errors.js';

/**
 * Reads a command's arguments against its declaration.
 *
 * <p>A boolean option is `--name` or `--no-name`; a string option is `--name value` or
 * `--name=value`. An option the command does not declare, a string option with no value and a
 * positional beyond the declared ones are refused, so a mistyped flag never runs as its default.
 *
 * @param {string[]} argv the arguments after the command name
 * @param {object} spec
 * @param {string[]} [spec.positionals] the names of the positional arguments, in order
 * @param {Record<string, { type: 'boolean' | 'string', default?: boolean | string }>} [spec.options]
 * @returns {{ positionals: Record<string, string | undefined>, options: Record<string, boolean | string | undefined> }}
 */
export function parseArguments(argv, { positionals = [], options = {} } = {}) {
  const values = {};
  const given = [];

  for (const [name, declared] of Object.entries(options)) values[name] = declared.default;

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    if (!argument.startsWith('--') || argument === '--') {
      given.push(argument);
      continue;
    }

    const equals = argument.indexOf('=');
    const name = argument.slice(2, equals === -1 ? undefined : equals);
    const inline = equals === -1 ? undefined : argument.slice(equals + 1);

    if (options[name]?.type === 'boolean') {
      if (inline !== undefined) throw new CliError(`Option --${name} takes no value`);
      values[name] = true;
      continue;
    }

    if (name.startsWith('no-') && options[name.slice(3)]?.type === 'boolean') {
      if (inline !== undefined) throw new CliError(`Option --${name} takes no value`);
      values[name.slice(3)] = false;
      continue;
    }

    if (options[name]?.type === 'string') {
      const value = inline ?? argv[++index];
      if (value === undefined || (inline === undefined && value.startsWith('--'))) {
        throw new CliError(`Option --${name} needs a value`);
      }

      values[name] = value;
      continue;
    }

    throw new CliError(`Unknown option: --${name}`);
  }

  if (given.length > positionals.length) {
    throw new CliError(`Unexpected argument: ${given[positionals.length]}`);
  }

  const named = {};
  positionals.forEach((name, index) => {
    named[name] = given[index];
  });

  return { positionals: named, options: values };
}
