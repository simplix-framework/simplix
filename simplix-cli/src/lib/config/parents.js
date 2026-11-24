import fs from 'node:fs';
import path from 'node:path';
import { analyzeEntity } from '../entity-analyzer.js';
import { entityTypeResolver, findParentEntityPath } from './paths.js';

export function analyzeParentClass(context, parentClass, baseEntityPath, srcPath, processedClasses) {
  let parentFields = [];
  let finalIdField = null;

  if (parentClass && parentClass.importPath && !processedClasses.has(parentClass.name)) {
    processedClasses.add(parentClass.name);

    const parentEntityName = parentClass.name;
    let parentEntityPath = findParentEntityPath(context, parentClass, baseEntityPath, srcPath);

    if (parentEntityPath && fs.existsSync(parentEntityPath)) {
      context.log(`Found parent class: ${parentEntityName} at ${path.relative(context.root, parentEntityPath)}`);
      const parentContent = fs.readFileSync(parentEntityPath, 'utf8');
      const parentAnalysis = analyzeEntity(parentContent, { isEntityType: entityTypeResolver(context, srcPath) });
      parentFields = parentAnalysis.fields;

      context.log(`  Analyzed ${parentEntityName}: found ${parentFields.length} fields`);
      if (parentAnalysis.parentClass) {
        context.log(
          `  Parent ${parentEntityName} extends ${parentAnalysis.parentClass.name} (import: ${parentAnalysis.parentClass.importPath})`
        );
      } else {
        context.log(`  Parent ${parentEntityName} does not extend another class`);
      }

      if (parentAnalysis.idField) {
        finalIdField = parentAnalysis.idField;
      }

      // Recursively analyze grandparent classes
      if (parentAnalysis.parentClass) {
        context.log(`Parent ${parentEntityName} extends ${parentAnalysis.parentClass.name}, analyzing recursively...`);
        const grandparentResult = analyzeParentClass(
      context,
          parentAnalysis.parentClass,
          baseEntityPath,
          srcPath,
          processedClasses
        );

        if (grandparentResult.parentFields && grandparentResult.parentFields.length > 0) {
          grandparentResult.parentFields.forEach(field => {
            if (!parentFields.find(f => f.name === field.name)) {
              parentFields.push(field);
            }
          });
        }

        if (!finalIdField && grandparentResult.finalIdField) {
          finalIdField = grandparentResult.finalIdField;
        }
      }

      if (!finalIdField && !parentAnalysis.parentClass) {
        finalIdField = 'id';
      }
    }
  }

  return { parentFields, finalIdField };
}

export function mergeFields(parentFields, fields) {
  if (!fields || !Array.isArray(fields)) {
    return;
  }

  const mergedFields = [...fields];

  parentFields.forEach(field => {
    if (!mergedFields.find(f => f.name === field.name)) {
      mergedFields.push(field);
    }
  });

  fields.length = 0;
  fields.push(...mergedFields);
}

export function analyzeReferenceParent(context, referenceParentClass, baseEntityPath, srcPath, referenceFields) {
  const parentEntityPath = findParentEntityPath(context, referenceParentClass, baseEntityPath, srcPath);
  let actualReferenceIdField = null;
  let idFieldType = null;

  if (parentEntityPath && fs.existsSync(parentEntityPath)) {
    const parentContent = fs.readFileSync(parentEntityPath, 'utf8');
    const parentAnalysis = analyzeEntity(parentContent);

    actualReferenceIdField = parentAnalysis.idField || 'id';

    const mergedReferenceFields = [...parentAnalysis.fields];
    referenceFields.forEach(field => {
      if (!mergedReferenceFields.find(f => f.name === field.name)) {
        mergedReferenceFields.push(field);
      }
    });

    referenceFields.length = 0;
    referenceFields.push(...mergedReferenceFields);
  }

  return { actualReferenceIdField, idFieldType };
}
