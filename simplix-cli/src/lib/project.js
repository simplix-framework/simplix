import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { CliError } from './errors.js';

/** The folder a project keeps its generator configuration, entity ymls and templates in. */
export const SIMPLIX_DIR = '.simplix';

/** The project configuration file, inside {@link SIMPLIX_DIR}. */
export const CONFIG_FILE_NAME = 'simplix-boot.json';

/** The name the configuration file had under generator-simplix, read while a project has no file of the current name. */
export const EARLIER_CONFIG_FILE_NAME = 'generator-simplix.json';

/**
 * The nearest directory at or above `start` that holds a `.simplix` folder.
 *
 * @param {string} [start] where to look from
 * @returns {string | undefined} the project root, or undefined outside a project
 */
export function findProjectRoot(start = process.cwd()) {
  let current = path.resolve(start);

  for (;;) {
    const candidate = path.join(current, SIMPLIX_DIR);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return current;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/**
 * The project root, for a command that cannot run outside a project.
 *
 * @param {string} [start] where to look from
 * @returns {string}
 * @throws {CliError} when no `.simplix` folder is found
 */
export function requireProjectRoot(start = process.cwd()) {
  const root = findProjectRoot(start);
  if (root === undefined) {
    throw new CliError('The .simplix directory is missing. Run "simplix-boot init" in the project root first.');
  }

  return root;
}

/** Where the project configuration file lives under a project root, and where it is written. */
export function configPathOf(root) {
  return path.join(root, SIMPLIX_DIR, CONFIG_FILE_NAME);
}

/**
 * The configuration file a project has: the one of the current name, or else the one of the
 * earlier name.
 *
 * @param {string} root the project root
 * @returns {{ path: string, name: string, earlier: boolean } | undefined} the file, or undefined
 *   when the project has neither
 */
export function findConfigFile(root) {
  const current = configPathOf(root);
  if (fs.existsSync(current)) return { path: current, name: CONFIG_FILE_NAME, earlier: false };

  const earlier = path.join(root, SIMPLIX_DIR, EARLIER_CONFIG_FILE_NAME);
  if (fs.existsSync(earlier)) return { path: earlier, name: EARLIER_CONFIG_FILE_NAME, earlier: true };

  return undefined;
}

/**
 * What a project that still has a configuration file of the earlier name is told.
 *
 * @param {string} root the project root
 * @returns {string | undefined} the notice, or undefined when the project has no such file
 */
export function earlierConfigNotice(root) {
  if (!fs.existsSync(path.join(root, SIMPLIX_DIR, EARLIER_CONFIG_FILE_NAME))) return undefined;

  const current = `${SIMPLIX_DIR}/${CONFIG_FILE_NAME}`;
  const earlier = `${SIMPLIX_DIR}/${EARLIER_CONFIG_FILE_NAME}`;
  if (fs.existsSync(configPathOf(root))) {
    return `${earlier} is not read: ${current} is the configuration file. Delete ${earlier}.`;
  }

  return `${earlier} is the earlier name of the configuration file. Rename it to ${current}.`;
}

/** Where an entity's yml lives under a project root. */
export function entityConfigPathOf(root, entityName) {
  return path.join(root, SIMPLIX_DIR, 'entity', `${entityName}.yml`);
}

/**
 * Reads and parses the project configuration.
 *
 * @param {string} root the project root
 * @returns {object | undefined} the configuration, or undefined when the file does not exist
 * @throws {CliError} when the file is not valid JSON
 */
export function readProjectConfig(root) {
  const file = findConfigFile(root);
  if (file === undefined) return undefined;

  try {
    return JSON.parse(fs.readFileSync(file.path, 'utf8'));
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new CliError(`Failed to parse ${file.name}: ${error.message}`);
  }
}

/**
 * Reads the project configuration, for a command that cannot run without it.
 *
 * @param {string} root the project root
 * @returns {object}
 * @throws {CliError} when the file is missing or not valid JSON
 */
export function requireProjectConfig(root) {
  const config = readProjectConfig(root);
  if (config === undefined) {
    throw new CliError(`${CONFIG_FILE_NAME} not found. Run "simplix-boot init" first and create the configuration file.`);
  }

  return config;
}

/**
 * Reads and parses an entity's yml.
 *
 * @param {string} root the project root
 * @param {string} entityName the yml's name
 * @returns {object | undefined} the parsed yml, or undefined when the file does not exist
 * @throws {CliError} when the file is not valid YAML
 */
export function readEntityConfig(root, entityName) {
  const ymlPath = entityConfigPathOf(root, entityName);
  if (!fs.existsSync(ymlPath)) return undefined;

  try {
    return yaml.load(fs.readFileSync(ymlPath, 'utf8'));
  } catch (error) {
    if (!(error instanceof yaml.YAMLException)) throw error;
    throw new CliError(`Failed to read ${entityName}.yml: ${error.message}`);
  }
}

/** The names of the entity ymls of a project, sorted. */
export function listEntityNames(root) {
  const entityDir = path.join(root, SIMPLIX_DIR, 'entity');
  if (!fs.existsSync(entityDir)) return [];

  return fs
    .readdirSync(entityDir)
    .filter(name => name.endsWith('.yml'))
    .map(name => name.slice(0, -4))
    .sort();
}
