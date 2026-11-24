export function extractComment(entityContent, fieldName) {
  // First try to find JavaDoc comment
  // Use \\b at the end to ensure exact field name match, the same way the @Comment branch below
  // does: without it 'name' matches the declaration of 'nameSearch' and takes that field's
  // JavaDoc, so a field whose name is another's prefix is documented as the wrong thing.
  const javadocRegex = new RegExp(
    `/\\*\\*([^*]|\\*(?!/))*\\*/\\s*(?:@[\\w\\.]+(?:\\([^)]*\\))?\\s*)*(?:private|public|protected)\\s+(?:[\\w<>\\[\\]]+)\\s+${fieldName}\\b`,
    's'
  );
  const javadocMatch = entityContent.match(javadocRegex);

  if (javadocMatch) {
    // Extract the comment content from JavaDoc
    const javadocContent = javadocMatch[0];
    const commentMatch = javadocContent.match(/\/\*\*([\s\S]*?)\*\//);
    if (commentMatch) {
      // Clean up the JavaDoc comment
      let comment = commentMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '')) // Remove leading * and spaces
        .join(' ')
        .trim()
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' '); // Normalize whitespace

      // Remove inline JavaDoc tags like {@code ...}, {@link ...}, {@literal ...}
      // Preserve the content inside the tags
      comment = comment.replace(/\{@\w+\s+([^}]*)}/g, '$1');

      // Remove @param, @return, etc. (only standalone @ tags, not inside braces)
      comment = comment.replace(/\s*@(?:param|return|throws|see|since|author|version|deprecated)\b[\s\S]*/i, '').trim();

      if (comment) {
        // Escape double quotes for use in Java annotations
        comment = comment.replace(/"/g, '\\"');
        return comment;
      }
    }
  }

  // Then try @Comment annotation
  // Use negative lookahead (?!@Comment) to ensure we match the closest @Comment to the field
  // This prevents matching the table-level @Comment at the top of the file
  // Use \\b at the end to ensure exact field name match (avoid 'content' matching 'contentId')
  // Never cross a ';': that ends an earlier field, so a @Comment before it belongs to that field and
  // a field carrying none of its own (a @Formula, say) would otherwise take its neighbour's.
  const commentRegex = new RegExp(
    `@Comment\\s*\\("([^"]+)"\\)(?:(?!@Comment|;)[\\s\\S])*?(?:private|public|protected)\\s+[\\w<>\\[\\],]+\\s+${fieldName}\\b`
  );
  const match = entityContent.match(commentRegex);

  if (match) return match[1];

  // Default to camelCase to words
  return camelToWords(fieldName);
}

export function extractTableComment(entityContent) {
  // First try to find @Comment annotation at class level
  const classCommentRegex =
    /@Comment\s*\(\s*"([^"]+)"\s*\)\s*(?:@[^\n]*\n)*\s*(?:public\s+)?(?:class|interface|enum)\s+\w+/;
  const commentMatch = entityContent.match(classCommentRegex);

  if (commentMatch) {
    return commentMatch[1];
  }

  // A class-level annotation that spans several lines (a multi-line @Table or
  // @EntityEventConfig) defeats the line-based pattern above. Everything before the
  // type declaration is the package, imports, the class JavaDoc and the class
  // annotations, so the last @Comment there, outside comments, is the class comment.
  const headerComment = extractClassHeaderComment(entityContent);

  if (headerComment) {
    return headerComment;
  }

  // Then try to find JavaDoc comment for the class
  const classJavadocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:@[^\n]*\n)*\s*(?:public\s+)?(?:class|interface|enum)\s+\w+/;
  const javadocMatch = entityContent.match(classJavadocRegex);

  if (javadocMatch) {
    // Extract the first line of the JavaDoc comment
    const javadocContent = javadocMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .filter(line => line.trim())
      .join(' ')
      .trim();

    // Get the first sentence or line
    const firstSentence = javadocContent.split(/[.!?]/)[0].trim();
    if (firstSentence) {
      // Escape double quotes for use in Java annotations
      return firstSentence.replace(/"/g, '\\"');
    }
  }

  // Then try Hibernate @Table comment annotation
  const tableCommentRegex =
    /@org\.hibernate\.annotations\.Table\s*\(\s*appliesTo\s*=\s*"[^"]+"\s*,\s*comment\s*=\s*"([^"]+)"\s*\)/;
  const match = entityContent.match(tableCommentRegex);

  if (match) return match[1];

  return generateDefaultTableComment(entityContent);
}

function extractClassHeaderComment(entityContent) {
  const withoutComments = entityContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const declaration = withoutComments.match(
    /(?:^|\s)(?:public\s+|abstract\s+|final\s+)*(?:class|interface|enum)\s+\w+/
  );

  if (!declaration) return null;

  const header = withoutComments.slice(0, declaration.index);
  const matches = [...header.matchAll(/@Comment\s*\(\s*"((?:[^"\\]|\\.)+)"\s*\)/g)];

  return matches.length > 0 ? matches[matches.length - 1][1] : null;
}

function camelToWords(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function generateDefaultTableComment(entityContent) {
  const tableNameRegex = /@Table\s*\(\s*name\s*=\s*"([^"]+)"\s*\)/;
  const tableMatch = entityContent.match(tableNameRegex);
  if (tableMatch) {
    return tableMatch[1]
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Entity Table';
}
