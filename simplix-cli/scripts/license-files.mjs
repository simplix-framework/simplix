// Carries the repository's license files into the package while it is packed, and takes them out
// again afterwards, so the tarball ships them and the repository keeps one copy.
// usage: node scripts/license-files.mjs <copy|remove>
import { copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILES = ['LICENSE', 'LICENSE_KO'];
const action = process.argv[2];

if (action !== 'copy' && action !== 'remove') {
  console.error('✖ usage: node scripts/license-files.mjs <copy|remove>');
  process.exit(1);
}

for (const name of FILES) {
  const target = fileURLToPath(new URL(`../${name}`, import.meta.url));

  if (action === 'copy') copyFileSync(fileURLToPath(new URL(`../../${name}`, import.meta.url)), target);
  else rmSync(target, { force: true });
}
