import { parseArguments } from './lib/args.js';
import { createOutput, style, symbols } from './lib/console.js';
import { CliError } from './lib/errors.js';
import { requireProjectRoot } from './lib/project.js';
import { getGeneratorVersion } from './lib/version-utils.js';
import * as config from './commands/config.js';
import * as generate from './commands/generate.js';
import * as generated from './commands/generated.js';
import * as init from './commands/init.js';
import * as promote from './commands/promote.js';
import * as templates from './commands/templates.js';
import * as version from './commands/version.js';

/** The commands by name, in the order the help lists them. */
const COMMANDS = { init, config, generate, promote, generated, templates, version };

/** Names a command also answers to. */
const ALIASES = { entity: 'generate' };

function helpText() {
  const width = Math.max(...Object.keys(COMMANDS).map(name => name.length));
  const lines = [
    '',
    `${style.cyan('SimpliX Boot CLI')} v${getGeneratorVersion()}`,
    '',
    'Generates SimpliX Spring Boot code (services, controllers, DTOs, tests) from JPA entities.',
    '',
    style.bold('Usage:'),
    '  simplix-boot <command> [options]',
    '',
    style.bold('Commands:'),
    ...Object.entries(COMMANDS).map(([name, command]) => `  ${name.padEnd(width)}  ${command.summary}`),
    '',
    style.bold('Workflow:'),
    '  1. simplix-boot init                     Create .simplix in the project root',
    '  2. simplix-boot config <EntityName>      Write the entity yml from the JPA entity',
    '  3. Edit .simplix/entity/<EntityName>.yml to match the requirements',
    '  4. simplix-boot generate <EntityName>    Generate the code from the yml',
    '  5. simplix-boot promote <EntityName> --module <module>',
    '',
    'Templates come with the CLI. A file of the same relative path under .simplix/templates',
    'replaces the built-in one; "simplix-boot templates" lists which is in use.',
    '',
    'Run "simplix-boot <command> --help" for the options of one command.',
    '',
  ];

  return lines.join('\n');
}

function commandHelpText(name, command) {
  const options = Object.entries(command.argumentSpec.options ?? {}).map(([option, declared]) => {
    if (declared.type === 'string') return `  --${option} <value>`;
    return declared.default === true ? `  --no-${option}` : `  --${option}`;
  });

  return ['', command.summary, '', style.bold('Usage:'), `  ${command.usage}`, ...(options.length > 0 ? ['', style.bold('Options:'), ...options] : []), ''].join('\n');
}

/**
 * Runs the command line.
 *
 * @param {string[]} argv the arguments after the executable
 * @param {object} [environment]
 * @param {string} [environment.cwd] the directory the command was run in
 * @returns {number} the process exit code
 */
export function main(argv, { cwd = process.cwd() } = {}) {
  const [first, ...rest] = argv;

  try {
    if (first === undefined || first === 'help' || first === '--help' || first === '-h') {
      process.stdout.write(`${helpText()}\n`);
      return 0;
    }

    if (first === '--version' || first === '-v') {
      process.stdout.write(`${getGeneratorVersion()}\n`);
      return 0;
    }

    const name = ALIASES[first] ?? first;
    const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
    if (command === undefined) {
      throw new CliError(`Unknown command: ${first}\nRun "simplix-boot help" for the list of commands.`);
    }

    if (rest.includes('--help') || rest.includes('-h')) {
      process.stdout.write(`${commandHelpText(name, command)}\n`);
      return 0;
    }

    const { positionals, options } = parseArguments(rest, command.argumentSpec);
    const output = createOutput();
    const root = command.needsProject === false ? undefined : requireProjectRoot(cwd);

    return command.run({ cwd, root, positionals, options, output }) ?? 0;
  } catch (error) {
    if (!(error instanceof CliError)) throw error;
    process.stderr.write(`${symbols.error} ${error.message}\n`);
    return error.exitCode;
  }
}
