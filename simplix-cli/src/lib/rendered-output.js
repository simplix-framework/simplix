/**
 * Tidies a rendered template before it is written.
 *
 * <p>A scriptlet line indented with the code around it renders as a line holding only that
 * indentation, so every line loses its trailing spaces and tabs, and a run of blank lines
 * collapses to one, so the generated file matches what a formatter would leave.
 *
 * @param {string} rendered the template output
 * @returns {string} the output without trailing whitespace or repeated blank lines
 */
export function tidyRenderedOutput(rendered) {
  return rendered.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');
}
