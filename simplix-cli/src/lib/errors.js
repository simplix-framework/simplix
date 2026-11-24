/**
 * A failure the person running the command can act on: a missing file, a bad option, a
 * configuration the command cannot use. The command line prints its message and exits with its
 * code; any other error is a defect and surfaces with its stack.
 */
export class CliError extends Error {
  /**
   * @param {string} message what went wrong and what to do about it
   * @param {object} [options]
   * @param {number} [options.exitCode] the process exit code
   */
  constructor(message, { exitCode = 1 } = {}) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}
