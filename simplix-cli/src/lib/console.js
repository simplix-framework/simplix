const ANSI = {
  bold: [1, 22],
  dim: [2, 22],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  cyan: [36, 39],
};

/**
 * Whether escape sequences are written: never under NO_COLOR, always under FORCE_COLOR, otherwise
 * only to a terminal.
 */
function colorEnabled() {
  const { NO_COLOR, FORCE_COLOR, TERM } = process.env;

  if (NO_COLOR !== undefined && NO_COLOR !== '') return false;
  if (FORCE_COLOR !== undefined) return FORCE_COLOR !== '0' && FORCE_COLOR !== 'false';
  return Boolean(process.stdout.isTTY) && TERM !== 'dumb';
}

function paint(style, text) {
  if (!colorEnabled()) return String(text);
  const [open, close] = ANSI[style];
  return `\u001b[${open}m${text}\u001b[${close}m`;
}

/** Text styles, each a function from text to text. */
export const style = {
  bold: text => paint('bold', text),
  dim: text => paint('dim', text),
  red: text => paint('red', text),
  green: text => paint('green', text),
  yellow: text => paint('yellow', text),
  cyan: text => paint('cyan', text),
};

/** The status marks a message opens with. */
export const symbols = {
  get info() {
    return paint('blue', 'ℹ');
  },
  get success() {
    return paint('green', '✔');
  },
  get warning() {
    return paint('yellow', '⚠');
  },
  get error() {
    return paint('red', '✖');
  },
};

/**
 * Where a command writes: progress and reports as lines, and a machine-readable result as the one
 * line a script reads.
 *
 * @returns {{ log: (message?: string) => void, result: (text: string) => void }}
 */
export function createOutput() {
  return {
    log(message = '') {
      process.stdout.write(`${message}\n`);
    },
    result(text) {
      process.stdout.write(`${text}\n`);
    },
  };
}
