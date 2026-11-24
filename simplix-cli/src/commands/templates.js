import fs from 'node:fs';
import path from 'node:path';
import { symbols } from '../lib/console.js';
import { CliError } from '../lib/errors.js';
import { BUILT_IN_TEMPLATE_DIR, listBuiltInTemplates, locateTemplate, projectTemplateDir } from '../lib/templates.js';

export const usage = 'simplix-boot templates [--eject [<template>]] [--force]';

export const summary = 'List the templates in use, or copy built-in templates into .simplix/templates';

export const argumentSpec = {
  positionals: ['template'],
  options: {
    eject: { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
  },
};

function projectOnlyTemplates(root) {
  const dir = projectTemplateDir(root);
  const found = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.template')) found.push(path.relative(dir, full).split(path.sep).join('/'));
    }
  };

  if (fs.existsSync(dir)) walk(dir);
  return found;
}

/**
 * Every template the project can render from, with where it comes from: the project's own copy,
 * or the built-in one when the project has none of that relative path.
 *
 * @param {string} root the project root
 * @returns {{ template: string, origin: 'project' | 'built-in', replacesBuiltIn: boolean }[]}
 */
export function listTemplates(root) {
  const builtIn = new Set(listBuiltInTemplates());
  const names = [...new Set([...builtIn, ...projectOnlyTemplates(root)])].sort();

  return names.map(template => ({
    template,
    origin: locateTemplate(root, template).origin,
    replacesBuiltIn: builtIn.has(template) && locateTemplate(root, template).origin === 'project',
  }));
}

/**
 * Copies built-in templates into the project, where an edited copy replaces the built-in one.
 *
 * @param {object} eject
 * @param {string} eject.root the project root
 * @param {string} [eject.template] one template by its relative path; every built-in one when omitted
 * @param {boolean} [eject.force] whether an existing project copy is overwritten
 * @returns {{ template: string, outcome: 'copied' | 'kept' }[]}
 * @throws {CliError} when the named template is not a built-in one
 */
export function ejectTemplates({ root, template, force = false }) {
  const builtIn = listBuiltInTemplates();
  if (template !== undefined && !builtIn.includes(template)) {
    throw new CliError(`No built-in template named ${template}. Run "simplix-boot templates" for the list.`);
  }

  return (template === undefined ? builtIn : [template]).map(name => {
    const dest = path.join(projectTemplateDir(root), name);
    if (fs.existsSync(dest) && !force) return { template: name, outcome: 'kept' };

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(BUILT_IN_TEMPLATE_DIR, name), dest);
    return { template: name, outcome: 'copied' };
  });
}

/** Runs `templates` from the command line. */
export function run({ root, positionals, options, output }) {
  const { log } = output;

  if (!options.eject) {
    if (positionals.template !== undefined) {
      throw new CliError(`A template name is only used with --eject\nUsage: ${usage}`);
    }

    for (const entry of listTemplates(root)) {
      const note = entry.replacesBuiltIn ? ' (replaces the built-in template)' : '';
      log(`${entry.origin.padEnd(8)}  ${entry.template}${note}`);
    }

    return;
  }

  for (const result of ejectTemplates({ root, template: positionals.template, force: options.force })) {
    const target = path.relative(root, path.join(projectTemplateDir(root), result.template));
    if (result.outcome === 'copied') log(`${symbols.success} ${target}`);
    else log(`${symbols.warning} SKIP: ${target} (already exists, use --force to overwrite)`);
  }
}
