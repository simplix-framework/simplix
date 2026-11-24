import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIMPLIX_DIR } from './project.js';

/** The templates the CLI ships, used for every template a project does not provide itself. */
export const BUILT_IN_TEMPLATE_DIR = fileURLToPath(new URL('../../templates', import.meta.url));

/** Where a project keeps the templates that replace the built-in ones, under its root. */
export function projectTemplateDir(root) {
  return path.join(root, SIMPLIX_DIR, 'templates');
}

/**
 * Finds a template by its path relative to a template directory. The project's own copy under
 * `.simplix/templates` wins; the built-in template of the same relative path is used otherwise.
 *
 * @param {string} root the project root
 * @param {string} relativePath the template's path, such as `service/EntityService.java.template`
 * @returns {{ path: string, origin: 'project' | 'built-in' } | undefined} the template, or
 *   undefined when neither the project nor the CLI has one
 */
export function locateTemplate(root, relativePath) {
  const own = path.join(projectTemplateDir(root), relativePath);
  if (fs.existsSync(own)) return { path: own, origin: 'project' };

  const builtIn = path.join(BUILT_IN_TEMPLATE_DIR, relativePath);
  if (fs.existsSync(builtIn)) return { path: builtIn, origin: 'built-in' };

  return undefined;
}

/**
 * Every built-in template, by its path relative to the template directory, sorted.
 *
 * @returns {string[]}
 */
export function listBuiltInTemplates() {
  const found = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.template')) found.push(path.relative(BUILT_IN_TEMPLATE_DIR, full).split(path.sep).join('/'));
    }
  };

  if (fs.existsSync(BUILT_IN_TEMPLATE_DIR)) walk(BUILT_IN_TEMPLATE_DIR);
  return found.sort();
}
