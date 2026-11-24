import { execFileSync } from 'node:child_process';

/**
 * Reads one value of the git configuration in effect for a directory.
 *
 * @param {string} key the configuration key, such as `user.name`
 * @param {string} cwd the directory to read the configuration for
 * @returns {string | undefined} the value, or undefined when git has none or is not installed
 */
export function getGitConfig(key, cwd) {
  try {
    return execFileSync('git', ['config', key], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    // git exits 1 for an unset key, and is absent on a machine that never installed it.
    if (error.status === 1 || error.code === 'ENOENT') return undefined;
    throw error;
  }
}
