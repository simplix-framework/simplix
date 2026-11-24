import fs from 'node:fs';
import path from 'node:path';
import { style } from '../lib/console.js';
import { CONFIG_FILE_NAME, SIMPLIX_DIR } from '../lib/project.js';
import { getGeneratorVersion } from '../lib/version-utils.js';

export const usage = 'simplix-boot init';

export const summary = 'Create the .simplix folder in the current directory';

export const argumentSpec = { positionals: [], options: {} };

/** `init` creates the project folder, so it runs where it is called instead of inside a project. */
export const needsProject = false;

/** Runs `init` from the command line. */
export function run({ cwd, output }) {
  const { log } = output;
  const simplixPath = path.join(cwd, SIMPLIX_DIR);

  log(`\n${style.cyan('SimpliX Boot CLI')} v${getGeneratorVersion()} - Initialize\n`);

  if (fs.existsSync(simplixPath)) {
    log(style.yellow(`${SIMPLIX_DIR} folder already exists.\n`));
    return;
  }

  for (const folder of ['entity', 'templates']) {
    const keep = path.join(simplixPath, folder, '.gitkeep');
    fs.mkdirSync(path.dirname(keep), { recursive: true });
    fs.writeFileSync(keep, '');
    log(`   create ${path.relative(cwd, keep)}`);
  }

  log(style.green('SimpliX initialized successfully.\n'));
  log('Next steps:');
  log(`  1. Create ${style.cyan(`${SIMPLIX_DIR}/${CONFIG_FILE_NAME}`)} configuration file`);
  log(`  2. Run ${style.cyan('simplix-boot version --write')} to pin the CLI version`);
  log(`  3. Run ${style.cyan('simplix-boot config <EntityName>')} to generate entity config`);
  log(`  4. Run ${style.cyan('simplix-boot generate <EntityName>')} to generate CRUD files\n`);
}
