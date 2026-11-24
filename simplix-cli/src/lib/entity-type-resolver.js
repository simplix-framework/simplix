import fs from 'node:fs';
import path from 'node:path';

/**
 * Whether a Java source declares a JPA entity: a line that starts with `@Entity`, bare, with
 * arguments or fully qualified. `@EntityListeners` and a mention inside a comment do not count.
 *
 * @param {string} source the Java source
 * @returns {boolean} true when the source carries the `@Entity` mark
 */
export function declaresEntity(source) {
  return /^\s*@(?:jakarta\.persistence\.|javax\.persistence\.)?Entity\b(?![.\w])/m.test(source);
}

/**
 * Builds the question the entity analyzer asks of a field's type: is it an `@Entity`?
 *
 * The answer comes from the type's own source under `srcPath`, found by its simple name and
 * matched by its package. A field whose type is not an entity (a record or an embeddable kept in a
 * JSON column, a converted value) is a plain value, not a relation.
 *
 * @param {string} srcPath the directory the entity sources live under
 * @returns {(fullyQualifiedName: string) => (boolean|undefined)} true for an entity, false for a
 *   type whose source declares none, undefined when no source in the tree matches the name
 */
export function createEntityTypeResolver(srcPath) {
  let sourcesBySimpleName;
  const answers = new Map();

  const index = () => {
    if (sourcesBySimpleName) return sourcesBySimpleName;
    sourcesBySimpleName = new Map();
    const walk = dir => {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return;
        throw error;
      }

      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
          const simpleName = entry.name.slice(0, -'.java'.length);
          const list = sourcesBySimpleName.get(simpleName) ?? [];
          list.push(full);
          sourcesBySimpleName.set(simpleName, list);
        }
      }
    };

    walk(srcPath);
    return sourcesBySimpleName;
  };

  return fullyQualifiedName => {
    if (!fullyQualifiedName) return undefined;
    if (answers.has(fullyQualifiedName)) return answers.get(fullyQualifiedName);

    const dot = fullyQualifiedName.lastIndexOf('.');
    const simpleName = fullyQualifiedName.slice(dot + 1);
    const packageName = dot < 0 ? '' : fullyQualifiedName.slice(0, dot);
    let answer;

    for (const file of index().get(simpleName) ?? []) {
      const source = fs.readFileSync(file, 'utf8');
      const declared = source.match(/^\s*package\s+([\w.]+)\s*;/m)?.[1] ?? '';
      if (declared === packageName) {
        answer = declaresEntity(source);
        break;
      }
    }

    answers.set(fullyQualifiedName, answer);
    return answer;
  };
}
