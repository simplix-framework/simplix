import { TYPE_CLASSIFICATIONS, classifyNonBasicType, classifyType } from './types.js';
import { extractComment } from '../comment-extractor.js';
import { findImportPath } from './imports.js';

/**
 * Annotation mapping for field characteristics
 */
const ANNOTATION_MAPPINGS = {
  '@NaturalId': { property: 'isNaturalId', value: true },
  '@Lob': { property: 'isLob', value: true },
  '@NameField': { property: 'isNameField', value: true },
  '@ManyToOne': { property: 'relationType', value: 'ManyToOne' },
  '@OneToMany': { property: 'relationType', value: 'OneToMany' },
  '@OneToOne': { property: 'relationType', value: 'OneToOne' },
  '@ManyToMany': { property: 'relationType', value: 'ManyToMany' },
};

export function analyzeFields(contentLines, imports, entityContent, isEntityType) {
  const fields = [];
  const annotations = [];
  let inMultiLineAnnotation = false;
  let currentAnnotation = '';

  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i].trim();

    // Handle multi-line annotation continuation
    if (inMultiLineAnnotation) {
      currentAnnotation += ' ' + line;
      // Check if annotation is complete (balanced parentheses)
      const openCount = (currentAnnotation.match(/\(/g) || []).length;
      const closeCount = (currentAnnotation.match(/\)/g) || []).length;
      if (openCount === closeCount) {
        annotations.push(currentAnnotation);
        currentAnnotation = '';
        inMultiLineAnnotation = false;
      }

      continue;
    }

    // Collect annotations
    if (line.startsWith('@')) {
      // Check if this is a multi-line annotation (has open paren but no close)
      const hasOpenParen = line.includes('(');
      const hasCloseParen = line.includes(')');

      if (hasOpenParen && !hasCloseParen) {
        // Start of multi-line annotation
        inMultiLineAnnotation = true;
        currentAnnotation = line;
      } else {
        // Single-line annotation
        annotations.push(line);
      }

      continue;
    }

    // Parse field definition
    if (line.startsWith('private ')) {
      // Skip fields with @Transient annotation
      if (annotations.some(ann => ann.startsWith('@Transient'))) {
        annotations.length = 0;
        continue;
      }

      // Remove Java modifiers (final, static, transient, volatile) before parsing
      const cleanedLine = line
        .replace(/\bfinal\b/g, '')
        .replace(/\bstatic\b/g, '')
        .replace(/\btransient\b/g, '')
        .replace(/\bvolatile\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Skip method declarations (containing parentheses)
      if (cleanedLine.includes('(') || cleanedLine.includes(')')) {
        annotations.length = 0;
        continue;
      }

      const fieldMatch = cleanedLine.match(/private\s+([^\s<>]+)(?:<([^>]+)>)?\s+(\w+)/);

      if (!fieldMatch) {
        annotations.length = 0;
        continue;
      }

      const rawType = fieldMatch[1];
      const genericType = fieldMatch[2];
      const fieldName = fieldMatch[3];

      // Determine if it's a collection
      const isCollection = ['List', 'Set', 'Collection', 'ArrayList', 'HashSet'].includes(rawType);
      const isMap = rawType === 'Map' || rawType === 'HashMap' || rawType === 'TreeMap' || rawType === 'LinkedHashMap';
      const actualType = (isCollection || isMap) && genericType ? genericType : rawType;

      // Initialize field info
      const fieldInfo = {
        name: fieldName,
        type: isMap && genericType ? `${rawType}<${genericType}>` : isCollection ? rawType : actualType,
        actualType: isCollection ? actualType : undefined,
        isCollection,
        isMap,
        collectionType: isCollection || isMap ? rawType : undefined,
        typeKind: isMap ? 'map' : classifyType(actualType, imports),
        comment: extractComment(entityContent, fieldName),
      };

      // Process annotations
      processFieldAnnotations(annotations, fieldInfo, contentLines, i);

      // Classify a non-basic type as an enum, a related entity or a plain value, and set its import path
      if (!TYPE_CLASSIFICATIONS.basic.has(actualType)) {
        const importPath = findImportPath(actualType, imports, entityContent);

        if (!fieldInfo.typeKind) {
          Object.assign(
            fieldInfo,
            classifyNonBasicType(actualType, importPath, { entityContent, imports, isEntityType })
          );
        }

        if (importPath) {
          fieldInfo.importPath = importPath;
        }
      }

      fields.push(fieldInfo);
      annotations.length = 0;
    } else if (line.length > 0 && !line.startsWith('//') && !line.startsWith('/*')) {
      annotations.length = 0;
    }
  }

  return fields;
}

function processFieldAnnotations(annotations, fieldInfo, contentLines, lineIndex) {
  annotations.forEach(annotation => {
    // Apply annotation mappings
    for (const [key, mapping] of Object.entries(ANNOTATION_MAPPINGS)) {
      if (annotation.startsWith(key)) {
        fieldInfo[mapping.property] = mapping.value;
      }
    }

    // Process Column annotation
    if (annotation.startsWith('@Column')) {
      const columnInfo = parseColumnAnnotation(annotation, contentLines, lineIndex);
      if (columnInfo) {
        fieldInfo.columnInfo = columnInfo;
      }
    }

    // Process JoinColumn annotation
    if (annotation.startsWith('@JoinColumn')) {
      const joinColumnMatch = annotation.match(/name\s*=\s*"([^"]+)"/);
      if (joinColumnMatch) {
        fieldInfo.joinColumnName = joinColumnMatch[1];
      }
    }

    // Process JsonIncludeProperties annotation
    // Example: @JsonIncludeProperties({"contentId", "title", "status", "channelId"})
    if (annotation.startsWith('@JsonIncludeProperties')) {
      const propsMatch = annotation.match(/@JsonIncludeProperties\s*\(\s*\{([^}]+)\}\s*\)/);
      if (propsMatch) {
        const propsString = propsMatch[1];
        const props = propsString
          .split(',')
          .map(p => p.trim().replace(/"/g, ''))
          .filter(p => p.length > 0);
        fieldInfo.jsonIncludeProperties = props;
      }
    }
  });
}

function parseColumnAnnotation(annotation, contentLines, startIndex) {
  let fullAnnotation = annotation;

  // Handle multi-line annotations
  if (!annotation.includes(')')) {
    for (let j = startIndex - 1; j >= 0; j--) {
      const prevLine = contentLines[j].trim();
      fullAnnotation = prevLine + ' ' + fullAnnotation;
      if (prevLine.includes('@Column')) break;
    }
  }

  const columnInfo = {};

  // Extract column attributes
  const patterns = {
    nullable: /nullable\s*=\s*(true|false)/,
    unique: /unique\s*=\s*(true|false)/,
    length: /length\s*=\s*(\d+)/,
    name: /name\s*=\s*"([^"]+)"/,
    columnDefinition: /columnDefinition\s*=\s*"([^"]+)"/,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = fullAnnotation.match(pattern);
    if (match) {
      columnInfo[key] =
        key === 'nullable' || key === 'unique'
          ? match[1] === 'true'
          : key === 'length'
            ? parseInt(match[1], 10)
            : match[1];
    }
  }

  return Object.keys(columnInfo).length > 0 ? columnInfo : null;
}
