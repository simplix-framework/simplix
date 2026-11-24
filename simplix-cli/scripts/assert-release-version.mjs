// Refuses to publish a development build. npm runs this before every publish, so it guards the
// release workflow and a publish run by hand alike.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));
const { version } = packageJson;

if (version.endsWith('-SNAPSHOT')) {
  console.error(`✖ Refusing to publish ${version}: a -SNAPSHOT version is a development build.`);
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`✖ Refusing to publish "${version}": a release version must be X.Y.Z.`);
  process.exit(1);
}
