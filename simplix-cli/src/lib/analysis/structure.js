export function extractParentClass(entityContent) {
  // Find class declaration with extends clause (handle generic types)
  const classMatch = entityContent.match(/class\s+\w+(?:<[^>]+>)?\s+extends\s+(\w+)/);
  if (!classMatch) {
    return null;
  }

  const parentClassName = classMatch[1];

  // Find import for parent class
  const importMatch = entityContent.match(new RegExp(`import\\s+([\\w.]+\\.${parentClassName});`));

  // If no import found, parent class might be in the same package
  // Extract the package from the current file
  let importPath = null;
  if (importMatch) {
    importPath = importMatch[1];
  } else {
    // Try to get the package from the current file
    const packageMatch = entityContent.match(/package\s+([\w.]+);/);
    if (packageMatch) {
      // Assume parent is in the same package if no import is found
      importPath = `${packageMatch[1]}.${parentClassName}`;
    }
  }

  return {
    name: parentClassName,
    importPath: importPath,
  };
}

/**
 * Extracts implemented interfaces from entity class declaration.
 * <p>
 * Parses the implements clause to identify interfaces like TreeEntity.
 * For generic interfaces like TreeEntity<T, ID>, extracts the type parameters.
 *
 * @param {string} entityContent - The entity file content
 * @returns {Array} Array of interface objects with name and generic types
 */
export function extractImplementedInterfaces(entityContent) {
  const interfaces = [];

  // Find class declaration with implements clause
  // Pattern: class EntityName extends ParentClass implements Interface1, Interface2<T, ID>
  // Or: class EntityName implements Interface1, Interface2<T, ID>
  const classDeclarationMatch = entityContent.match(
    /class\s+\w+(?:<[^>]+>)?(?:\s+extends\s+\w+(?:<[^>]+>)?)?\s+implements\s+([^{]+)/
  );

  if (!classDeclarationMatch) {
    return interfaces;
  }

  const implementsClause = classDeclarationMatch[1].trim();

  // Parse TreeEntity<EntityType, IdType> pattern
  const treeEntityMatch = implementsClause.match(/TreeEntity<(\w+),\s*(\w+)>/);
  if (treeEntityMatch) {
    interfaces.push({
      name: 'TreeEntity',
      entityType: treeEntityMatch[1],
      idType: treeEntityMatch[2],
    });
  }

  // Parse other simple interfaces (Serializable, etc.) using matchAll
  const simpleInterfaceMatches = implementsClause.matchAll(/\b(\w+)\b(?![<>])/g);
  for (const match of simpleInterfaceMatches) {
    const interfaceName = match[1];
    // Skip if already added (like TreeEntity) or if it's a generic type parameter
    if (
      !interfaces.some(i => i.name === interfaceName) &&
      interfaceName !== 'TreeEntity' &&
      !['String', 'Long', 'Integer', 'UUID'].includes(interfaceName)
    ) {
      interfaces.push({
        name: interfaceName,
      });
    }
  }

  return interfaces;
}

export function extractIdInfo(entityContent) {
  let idType = 'String';
  let embeddedIdField = null;
  let idField = null;

  const contentLines = entityContent.split('\n');
  let isIdField = false;
  let isEmbeddedIdField = false;
  let inMultiLineAnnotation = false;

  // ID field analysis
  for (let i = 0; i < contentLines.length; i++) {
    const trimmedLine = contentLines[i].trim();

    if (trimmedLine === '@Id') {
      isIdField = true;
      continue;
    }

    if (trimmedLine === '@EmbeddedId') {
      isEmbeddedIdField = true;
      continue;
    }

    // Handle multi-line annotations (like @Column)
    if ((isIdField || isEmbeddedIdField) && trimmedLine.startsWith('@')) {
      // Check if this is a multi-line annotation
      if (trimmedLine.includes('(') && !trimmedLine.includes(')')) {
        inMultiLineAnnotation = true;
      }

      continue;
    }

    // Continue through multi-line annotation
    if (inMultiLineAnnotation) {
      if (trimmedLine.includes(')')) {
        inMultiLineAnnotation = false;
      }

      continue;
    }

    // Check for the private field declaration
    if ((isIdField || isEmbeddedIdField) && trimmedLine.startsWith('private ')) {
      const fieldMatch = trimmedLine.match(/private\s+([^\s<>]+)(?:<[^>]+>)?\s+(\w+)/);
      if (fieldMatch) {
        if (isEmbeddedIdField) {
          embeddedIdField = fieldMatch[2]; // field name
          idType = fieldMatch[1]; // field type
          idField = embeddedIdField;
        } else {
          idType = fieldMatch[1];
          idField = fieldMatch[2];
        }

        break;
      }
    }

    // Reset flags if we hit something that's not an annotation or private field
    if (
      (isIdField || isEmbeddedIdField) &&
      !trimmedLine.startsWith('@') &&
      !trimmedLine.startsWith('private') &&
      !inMultiLineAnnotation &&
      trimmedLine.length > 0
    ) {
      // Skip empty lines and comments
      if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*') && !trimmedLine.startsWith('*')) {
        isIdField = false;
        isEmbeddedIdField = false;
      }
    }
  }

  return { idType, embeddedIdField, idField };
}

export function analyzeEmbeddedId(entityContent, embeddedIdField, idType) {
  if (!embeddedIdField) {
    return null;
  }

  // Find the embedded ID class definition
  const classPattern = new RegExp(`public\\s+static\\s+class\\s+${idType}[^{]*\\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`, 's');
  const classMatch = entityContent.match(classPattern);

  if (!classMatch) {
    return null;
  }

  const classBody = classMatch[1];
  const fields = [];
  const fieldPattern = /private\s+([^\s<>]+)(?:<[^>]+>)?\s+(\w+);/g;
  let match;

  while ((match = fieldPattern.exec(classBody)) !== null) {
    fields.push({
      type: match[1],
      name: match[2],
      parentField: embeddedIdField,
    });
  }

  return fields;
}
