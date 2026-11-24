export function findImportPath(type, imports, entityContent) {
  // Look for direct import
  const directImport = imports.find(imp => imp.endsWith(`.${type}`));
  if (directImport) return directImport;

  // Look for entity wildcard imports and try to match with type name
  const entityWildcards = imports.filter(imp => imp.endsWith('.*') && imp.includes('.entity.'));

  // Try to match type name with wildcard package segment
  // e.g., "CmsQnaExtension" should match "...extension.*"
  for (const wildcard of entityWildcards) {
    const packagePath = wildcard.slice(0, -2); // remove ".*"
    const lastSegment = packagePath.split('.').pop(); // e.g., "extension"

    // Check if type name contains this segment (case-insensitive)
    if (type.toLowerCase().includes(lastSegment.toLowerCase())) {
      return wildcard.replace('*', type);
    }
  }

  // If no matching wildcard, assume same package
  const packageMatch = entityContent ? entityContent.match(/package\s+([\w.]+);/) : null;
  if (packageMatch) {
    const currentPackage = packageMatch[1];
    return `${currentPackage}.${type}`;
  }

  // Fallback to any wildcard import (last resort)
  const wildcardImports = imports.filter(imp => imp.endsWith('.*'));
  for (const wildcard of wildcardImports) {
    const possiblePath = wildcard.replace('*', type);
    return possiblePath;
  }

  return null;
}

export function analyzeImports(entityContent) {
  const importPattern = /import\s+([\w.]+(?:\.\*)?);/g;
  const imports = [];
  let match;

  while ((match = importPattern.exec(entityContent)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

export function processImports(entityContent) {
  const imports = [];
  const lines = entityContent.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') && trimmed.endsWith(';')) {
      const importPath = trimmed.substring(7, trimmed.length - 1).trim();

      // Classify import type
      let type = 'other';
      if (importPath.includes('.entities.') || importPath.includes('.entity.')) {
        type = 'entity';
      } else if (importPath.includes('.enums.') || importPath.includes('.enum.')) {
        type = 'enum';
      } else if (importPath.startsWith('java.') || importPath.startsWith('javax.')) {
        type = 'java';
      } else if (importPath.includes('springframework')) {
        type = 'spring';
      }

      imports.push({ path: importPath, type });
    }
  });

  return imports;
}
