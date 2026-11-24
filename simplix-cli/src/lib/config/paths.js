import fs from 'node:fs';
import path from 'node:path';
import { createEntityTypeResolver } from '../entity-type-resolver.js';
import { findEntityFile } from '../file-utils.js';

/**
 * The directory entity sources are scanned under: `entity.scanPath`, the older
 * `entity.basePath` and `baseEntityPath`, or the Maven source root.
 *
 * @param {object} context the config command's context, which carries the project configuration
 * @returns {string} the path, relative to the project root
 */
export function getBaseEntityPath(context) {
  const config = context.config;

  if (config?.entity?.scanPath) return config.entity.scanPath;
  if (config?.entity?.basePath) return config.entity.basePath;
  if (config?.baseEntityPath) return config.baseEntityPath;
  return 'src/main/java';
}

/**
 * The directory repository sources are scanned under. A project that derives the repository
 * package from the entity's scans the entity path.
 *
 * @param {object} context the config command's context
 * @returns {string | null} the path, relative to the project root, or null when not configured
 */
export function getRepositoryScanPath(context) {
  const config = context.config;

  if (!config) return null;

  if (config.repository?.deriveFromEntity) {
    return config.entity?.scanPath || config.entity?.basePath || null;
  }

  return config.repository?.scanPath || config.repository?.basePath || null;
}

/**
 * Finds the module path of an entity's repository, read from the repository source's package.
 *
 * @param {object} context the config command's context
 * @param {string} entityName the entity class name
 * @param {string} modulePath the entity's own module path
 * @returns {string | null} the repository's module path when it differs from the entity's, else null
 */
export function findRepositoryModulePath(context, entityName, modulePath) {
  const repoScanPath = getRepositoryScanPath(context);

  if (!repoScanPath) {
    return null;
  }

  const repoFilePath = findEntityFile(path.join(context.root, repoScanPath), `${entityName}Repository`);

  if (!repoFilePath) {
    return null;
  }

  const packageMatch = fs.readFileSync(repoFilePath, 'utf8').match(/package\s+([\w.]+);/);

  if (!packageMatch) {
    return null;
  }

  const repoPackage = packageMatch[1];
  const domainIndex = repoPackage.indexOf('.domain.');

  if (domainIndex === -1) {
    return null;
  }

  const repoModulePath = repoPackage
    .substring(domainIndex + '.domain.'.length)
    .split('.')
    .filter(part => part !== 'repository')
    .join('/');

  return repoModulePath === modulePath ? null : repoModulePath;
}

export function findParentEntityPath(context, parentClass, baseEntityPath, srcPath) {
  let parentEntityPath = null;

  if (parentClass.importPath) {
    // Try direct import path resolution first
    const importPathParts = parentClass.importPath.split('.');
    const domainIndex = importPathParts.indexOf('domain');

    if (domainIndex !== -1) {
      // Convert import path to file path relative to scan root
      // e.g., dev.accesscore.domain.core.entity.BaseEntity -> core/entity/BaseEntity.java
      const pathFromDomain = importPathParts.slice(domainIndex + 1).join('/');

      // Try to find in the scan path directly
      const candidatePaths = [
        // Try full import path under scan root
        path.join(context.root, baseEntityPath, pathFromDomain + '.java'),
      ];

      for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
          parentEntityPath = candidate;
          break;
        }
      }

      // Fallback to recursive search
      if (!parentEntityPath) {
        parentEntityPath = findEntityFile(srcPath, parentClass.name);
      }
    }
  }

  if (!parentEntityPath) {
    parentEntityPath = findEntityFile(srcPath, parentClass.name);
  }

  return parentEntityPath;
}

export function extractModulePath(entityContent, _entityName) {
  const packageMatch = entityContent.match(/package\s+([\w.]+);/);
  let modulePath = '<__MODIFY__>';

  if (packageMatch) {
    const fullPackage = packageMatch[1];
    const domainIndex = fullPackage.indexOf('.domain.');

    if (domainIndex !== -1) {
      const pathAfterDomain = fullPackage.substring(domainIndex + '.domain.'.length);
      const pathParts = pathAfterDomain.split('.');
      const prefixesToRemove = ['entities', 'entity', 'domain', 'domains'];
      let filteredParts = pathParts;

      if (filteredParts.length > 0 && prefixesToRemove.includes(filteredParts[0])) {
        filteredParts = filteredParts.slice(1);
      }

      filteredParts = filteredParts.filter(part => part !== 'entity');
      modulePath = filteredParts.join('/');
    }
  }

  return modulePath;
}

/** The one resolver per source tree that answers whether a field's type is an @Entity. */
export function entityTypeResolver(context, srcPath) {
  if (!context.entityTypeResolvers) context.entityTypeResolvers = new Map();
  if (!context.entityTypeResolvers.has(srcPath))
    context.entityTypeResolvers.set(srcPath, createEntityTypeResolver(srcPath));
  return context.entityTypeResolvers.get(srcPath);
}
