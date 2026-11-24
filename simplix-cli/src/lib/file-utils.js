import fs from 'node:fs';
import path from 'node:path';
import { CliError } from './errors.js';

/** The files that mark the root of a Gradle or Maven build. */
const BUILD_FILES = ['build.gradle', 'build.gradle.kts', 'pom.xml'];

/**
 * Finds a Java source by its simple class name anywhere under a directory.
 *
 * @param {string} srcPath the directory to search
 * @param {string} className the simple class name, without `.java`
 * @returns {string | null} the first matching file, or null when the directory holds none
 */
export function findEntityFile(srcPath, className) {
  if (!srcPath) return null;

  let entries;
  try {
    entries = fs.readdirSync(srcPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }

  for (const entry of entries) {
    const entryPath = path.join(srcPath, entry.name);
    if (isDirectory(entry, entryPath)) {
      const found = findEntityFile(entryPath, className);
      if (found) return found;
    } else if (entry.name === `${className}.java`) {
      return entryPath;
    }
  }

  return null;
}

function isDirectory(entry, entryPath) {
  if (entry.isDirectory()) return true;
  if (!entry.isSymbolicLink()) return false;

  try {
    return fs.statSync(entryPath).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

/**
 * Checks that the entity sources can be read: the scan path is a directory, and the project root
 * or a directory above it holds a Gradle or Maven build file.
 *
 * @param {string} srcPath the directory the entity sources live under
 * @param {string} root the project root
 * @throws {CliError} when the scan path is missing or no build file is found
 */
export function validateProjectStructure(srcPath, root) {
  if (!fs.existsSync(srcPath)) {
    throw new CliError(`Invalid project structure. Expected path: ${srcPath}`);
  }

  if (!fs.statSync(srcPath).isDirectory()) {
    throw new CliError(`Invalid project structure. Not a directory: ${srcPath}`);
  }

  let current = root;
  for (;;) {
    if (BUILD_FILES.some(name => fs.existsSync(path.join(current, name)))) return;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new CliError(`No build file found in ${root}. Expected one of: ${BUILD_FILES.join(', ')}`);
}
