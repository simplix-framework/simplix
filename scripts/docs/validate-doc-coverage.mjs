#!/usr/bin/env node
// Lists what a module's English documents never mention: public types (nested ones included),
// annotation attributes, configuration property keys, the names of beans an application
// replaces by declaring a bean of the same name, and the public methods of the types the
// documents name. With --unread it lists the properties
// whose accessor no main source calls. Each list is a ledger to judge, not a verdict: an entry
// that is internal on purpose is recorded in scripts/docs/doc-coverage-ignore.txt with its reason.
//
// Usage: node scripts/docs/validate-doc-coverage.mjs [module] [--strict] [--list] [--unread]
import { readdir, readFile, access } from 'fs/promises';
import { basename, dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MODULE = /^(simplix-[a-z]+|spring-boot-starter-simplix)$/;
const IGNORE_FILE = join(ROOT, 'scripts/docs/doc-coverage-ignore.txt');
const TYPE = /^[ \t]*public\s+(?:(?:abstract|final|static|sealed|non-sealed)\s+)*(class|interface|enum|record|@interface)\s+([A-Z][A-Za-z0-9_]*)/gm;
const ATTRIBUTE = /^[ \t]*(?:[\w.<>\[\]?, ]+?)\s+([a-z]\w*)\s*\(\s*\)\s*(?:default\b[^;]*)?;/gm;
const VALUE_KEY = /\$\{((?:simplix|mybatis)\.[a-zA-Z0-9.-]+)(?::[^}]*)?\}/g;
const CONDITIONAL = /@ConditionalOnProperty\(([^)]*)\)/gs;
const PROPERTIES = /@ConfigurationProperties\(\s*(?:prefix\s*=\s*|value\s*=\s*)?"([^"]+)"/;
const FIELD = /^[ \t]*private\s+(?!static)(?:final\s+)?([\w.<>, ?\[\]]+?)\s+(\w+)\s*(?:=[^;]*)?;/gm;
// A bean method whose @ConditionalOnMissingBean names the bean itself: the application replaces it by that name.
const NAMED_BEAN = /@ConditionalOnMissingBean\(\s*name\s*=\s*"([A-Za-z]\w*)"\s*\)\s*(?:@[\w.]+(?:\([^)]*\))?\s*)*public\s+[\w.<>\[\], ?]+\s+(\w+)\s*\(/g;
// Types whose public methods the framework calls, not an application.
const WIRING = /@ConfigurationProperties|@AutoConfiguration|@Configuration\b|@RestController|@Controller\b|@ControllerAdvice|@RestControllerAdvice|@Aspect\b|@Entity\b|@Converter\b/;
// Methods a container or the language calls.
const CALLED_BY_CONTAINER = /@Override|@Bean|@EventListener|@Scheduled|@PostConstruct|@PreDestroy|@Autowired|@TransactionalEventListener|@ExceptionHandler|@PrePersist|@PostPersist|@PreUpdate|@PostUpdate|@PreRemove|@PostRemove|@PostLoad/;
const LANGUAGE_METHODS = new Set(['toString', 'equals', 'hashCode', 'main', 'afterPropertiesSet', 'destroy', 'setApplicationContext', 'onApplicationEvent', 'run', 'close', 'builder', 'build', 'values', 'valueOf']);
// Attributes every Bean Validation constraint declares; they are the specification's, not the module's.
const CONSTRAINT_ATTRIBUTES = new Set(['groups', 'payload']);

const exists = path => access(path).then(() => true, () => false);
const normalise = text => text.toLowerCase().replace(/[-_]/g, '');
const word = name => new RegExp('\\b' + name + '\\b');

async function walk(dir, out = []) {
  if (!(await exists(dir))) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, out);
    else out.push(path);
  }
  return out;
}

async function readIgnores() {
  const ignores = new Set();
  if (!(await exists(IGNORE_FILE))) return ignores;
  for (const line of (await readFile(IGNORE_FILE, 'utf8')).split('\n')) {
    const entry = line.split('#')[0].trim();
    if (entry) ignores.add(entry);
  }
  return ignores;
}

const stripNoise = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

// Public methods declared directly in the top-level type of a source file; for an interface, every method.
function publicMethods(source, top) {
  if (WIRING.test(stripNoise(source)) || /^public\s+@interface/m.test(source)) return [];
  if (!new RegExp('^public\\s+(?:(?:abstract|final|sealed)\\s+)*(?:class|interface|enum|record)\\s+' + top + '\\b', 'm').test(source)) return [];
  const isInterface = new RegExp('^public\\s+(?:sealed\\s+)?interface\\s+' + top + '\\b', 'm').test(source);
  const declaration = isInterface
    ? /^(?:default\s+|static\s+)?(?:<[^>]+>\s+)?[\w<>\[\],.? ]+?\s+([a-z]\w*)\s*\(/
    : /^public\s+(?:static\s+|final\s+|synchronized\s+|abstract\s+)*(?:<[^>]+>\s+)?[\w<>\[\],.? ]+?\s+([a-z]\w*)\s*\(/;
  const lines = source.split('\n');
  const names = new Set();
  let depth = 0;
  let inComment = false;
  for (let index = 0; index < lines.length; index++) {
    const text = lines[index].trim();
    if (text.startsWith('/*')) inComment = true;
    const commented = inComment;
    if (text.includes('*/')) inComment = false;
    if (commented || text.startsWith('//') || text.startsWith('*')) continue;
    if (depth === 1 && !/^(return|new|throw|else|if|for|while|@)/.test(text)) {
      const match = declaration.exec(text);
      if (match && !LANGUAGE_METHODS.has(match[1])) {
        let above = index - 1;
        let annotations = '';
        while (above >= 0 && /^\s*@/.test(lines[above])) annotations += lines[above--];
        if (!CALLED_BY_CONTAINER.test(annotations)) names.add(match[1]);
      }
    }
    const code = lines[index].replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)'/g, "''");
    depth += (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
  }
  return [...names];
}

// Accessors a record or Lombok generates for the top-level type of a source file.
function generatedAccessors(source, top) {
  const clean = stripNoise(source);
  if (WIRING.test(clean) || /@Component\b|@Service\b|@Repository\b/.test(clean)) return [];
  const record = new RegExp('^public\\s+record\\s+' + top + '\\s*(?:<[^>]*>)?\\s*\\(([^)]*)\\)', 'm').exec(clean);
  if (record) return record[1].split(',').map(part => part.trim().split(/\s+/).pop()).filter(name => /^[a-z]\w*$/.test(name));
  const declaration = new RegExp('^public\\s+(?:final\\s+)?(?:class|enum)\\s+' + top + '\\b', 'm').exec(clean);
  if (!declaration) return [];
  const classLevel = /@(?:Getter|Data|Value)\b/.test(clean.slice(0, declaration.index));
  const lines = clean.split('\n');
  const names = [];
  let depth = 0;
  for (let index = 0; index < lines.length; index++) {
    if (depth === 1 && !/\bstatic\b/.test(lines[index])) {
      const field = /^\s*(?:@\w+\s+)*(?:private\s+)?(?!static|public|protected|return|throw)(?:final\s+)?(?:volatile\s+)?[\w.<>\[\], ?]+?\s+([a-z]\w*)\s*(?:=[^;]*)?;/.exec(lines[index]);
      if (field && (classLevel || /@Getter\b/.test(lines[index]) || /@Getter\b/.test(lines[index - 1] ?? ''))) names.push(field[1]);
    }
    depth += (lines[index].match(/\{/g) || []).length - (lines[index].match(/\}/g) || []).length;
  }
  return names;
}

// Public methods of the public types nested in the top-level type of a source file.
function nestedPublicMethods(source) {
  const clean = stripNoise(source);
  if (WIRING.test(clean)) return [];
  const found = [];
  let depth = 0;
  let nested = null;
  for (const line of clean.split('\n')) {
    const text = line.trim();
    if (depth === 1) {
      const type = /^public\s+(?:static\s+)?(?:final\s+)?(?:class|interface|record|enum)\s+([A-Z]\w*)/.exec(text);
      if (type) nested = type[1];
    }
    if (depth === 2 && nested && !/^(return|new|throw|else|if|for|while|@)/.test(text)) {
      const method = /^public\s+(?:static\s+|final\s+)*(?:<[^>]+>\s+)?[\w<>\[\],.? ]+?\s+([a-z]\w*)\s*\(/.exec(text);
      if (method && !LANGUAGE_METHODS.has(method[1])) found.push({ nested, name: method[1] });
    }
    depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    if (depth <= 1 && /\}/.test(line)) nested = null;
  }
  return found;
}

// Class name -> body text with the bodies of nested classes removed.
function classBodies(source) {
  const clean = stripNoise(source);
  const bodies = new Map();
  const declaration = /\b(?:class|record)\s+([A-Z]\w*)[^{;]*\{/g;
  for (const match of clean.matchAll(declaration)) {
    let depth = 1;
    let index = match.index + match[0].length;
    const start = index;
    let own = '';
    while (index < clean.length && depth > 0) {
      const char = clean[index];
      if (char === '{') depth++;
      else if (char === '}') depth--;
      if (depth === 1 && char !== '}') own += char;
      else if (depth === 1 && char === '}') own += '\n';
      index++;
    }
    bodies.set(match[1], { own, whole: clean.slice(start, index) });
  }
  return bodies;
}

function propertyKeys(prefix, className, bodies, fields = [], seen = new Set()) {
  const body = bodies.get(className);
  if (!body || seen.has(className)) return fields;
  seen.add(className);
  for (const match of body.own.matchAll(FIELD)) {
    const type = match[1].trim();
    const key = prefix + '.' + match[2];
    if (bodies.has(type)) propertyKeys(key, type, bodies, fields, new Set(seen));
    else fields.push({ key, field: match[2], owner: className });
  }
  return fields;
}

function conditionalKeys(source) {
  const keys = [];
  for (const match of source.matchAll(CONDITIONAL)) {
    const prefix = /prefix\s*=\s*"([^"]+)"/.exec(match[1])?.[1];
    for (const name of match[1].matchAll(/(?:name|value)\s*=\s*\{?\s*"([^"]+)"/g)) keys.push(prefix ? prefix + '.' + name[1] : name[1]);
  }
  return keys;
}

async function metadataKeys(module) {
  const path = join(ROOT, module, 'build/classes/java/main/META-INF/spring-configuration-metadata.json');
  if (!(await exists(path))) return [];
  return (JSON.parse(await readFile(path, 'utf8')).properties ?? []).map(property => property.name);
}

// Keys a document states: flattened YAML and properties code blocks, and backticked tokens of the prose.
function documentedKeys(text) {
  const full = new Set();
  const tokens = new Set();
  const blocks = /```(\w*)\n([\s\S]*?)```/g;
  for (const block of text.matchAll(blocks)) {
    if (block[1] === 'yaml' || block[1] === 'yml') {
      const stack = [];
      for (const line of block[2].split('\n')) {
        const entry = /^(\s*)(?:- )?["']?([\w.-]+)["']?\s*:/.exec(line);
        if (!entry) continue;
        while (stack.length && stack[stack.length - 1].indent >= entry[1].length) stack.pop();
        stack.push({ indent: entry[1].length, name: entry[2] });
        full.add(normalise(stack.map(item => item.name).join('.')));
      }
    } else if (block[1] === 'properties') {
      for (const line of block[2].split('\n')) {
        const entry = /^\s*([\w.-]+)\s*=/.exec(line);
        if (entry) full.add(normalise(entry[1]));
      }
    }
  }
  for (const token of text.replace(blocks, '').matchAll(/`([^`\n]+)`/g)) {
    for (const part of token[1].split(/[\s,=:]+/)) if (/^[\w.-]+$/.test(part)) tokens.add(normalise(part.replace(/\.\*$/, '')));
  }
  return { full, tokens };
}

function keyIsDocumented(key, documented) {
  const flat = normalise(key);
  if (documented.full.has(flat) || documented.tokens.has(flat)) return true;
  for (const stated of documented.full) if (stated.startsWith(flat + '.')) return true;
  const segments = flat.split('.');
  for (let cut = 1; cut < segments.length; cut++) {
    const prefix = segments.slice(0, cut).join('.');
    const rest = segments.slice(cut).join('.');
    if (cut >= 2 && documented.tokens.has(prefix) && documented.tokens.has(rest)) return true;
  }
  return false;
}

async function inspect(module, ignores, allMainSources) {
  const sources = (await walk(join(ROOT, module, 'src/main/java'))).filter(path => path.endsWith('.java'));
  if (sources.length === 0) return null;
  const types = [];
  const attributes = [];
  const keys = new Map();
  const beans = new Set();
  const methods = [];
  const accessors = [];
  for (const path of sources) {
    const source = await readFile(path, 'utf8');
    const top = basename(path, '.java');
    const clean = stripNoise(source);
    for (const match of clean.matchAll(TYPE)) types.push({ name: match[2], top, annotation: match[1] === '@interface' });
    if (new RegExp('public\\s+@interface\\s+' + top + '\\b').test(clean)) {
      for (const match of clean.matchAll(ATTRIBUTE)) if (!CONSTRAINT_ATTRIBUTES.has(match[1])) attributes.push({ annotation: top, name: match[1] });
    }
    for (const match of source.matchAll(NAMED_BEAN)) if (match[1] === match[2]) beans.add(match[1]);
    for (const name of publicMethods(source, top)) methods.push({ type: top, name });
    for (const name of generatedAccessors(source, top)) accessors.push({ type: top, name });
    for (const method of nestedPublicMethods(source)) methods.push({ type: top, nested: method.nested, name: method.name });
    for (const match of source.matchAll(VALUE_KEY)) keys.set(match[1], keys.get(match[1]) ?? null);
    for (const key of conditionalKeys(source)) if (/^(simplix|mybatis)\./.test(key)) keys.set(key, keys.get(key) ?? null);
    const prefix = PROPERTIES.exec(source)?.[1];
    if (prefix) {
      const bodies = classBodies(source);
      for (const field of propertyKeys(prefix, top, bodies)) keys.set(field.key, { ...field, path });
    }
  }
  for (const key of await metadataKeys(module)) if (![...keys.keys()].some(known => normalise(known) === normalise(key))) keys.set(key, null);

  const paths = [join(ROOT, module, 'README.md'), ...(await walk(join(ROOT, module, 'docs/en'))).filter(p => p.endsWith('.md'))];
  const documents = [];
  for (const path of paths) if (await exists(path)) documents.push(await readFile(path, 'utf8'));
  const text = documents.join('\n');
  const documented = documentedKeys(text);
  const ignored = name => ignores.has(module + ':' + name);

  const missingTypes = types.filter(type => {
    const label = type.name === type.top ? type.name : type.top + '.' + type.name;
    if (ignored(label) || ignored(type.top)) return false;
    if (type.name === type.top) return !word(type.name).test(text);
    return !documents.some(doc => word(type.top).test(doc) && word(type.name).test(doc));
  }).map(type => type.name === type.top ? type.name : type.top + '.' + type.name).sort();
  const missingAttributes = attributes.filter(attribute => !ignored(attribute.annotation) && !ignored(attribute.annotation + '.' + attribute.name)
    && word(attribute.annotation).test(text)
    && !documents.some(doc => word(attribute.annotation).test(doc) && word(attribute.name).test(doc)))
    .map(attribute => '@' + attribute.annotation + '.' + attribute.name).sort();
  const missingKeys = [...keys.keys()].filter(key => !ignored(key) && !keyIsDocumented(key, documented)).sort();
  const missingBeans = [...beans].filter(bean => !ignored(bean) && !word(bean).test(text)).sort();
  const namedMethods = methods.filter(method => !ignored(method.type) && word(method.type).test(text));
  const missingMethods = namedMethods.filter(method => !ignored(method.type + '.*') && !ignored(method.type + '.' + method.name) && !word(method.name).test(text))
    .map(method => method.type + '.' + (method.nested ? method.nested + '.' : '') + method.name).sort();
  const capital = name => name[0].toUpperCase() + name.slice(1);
  const kebab = name => name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
  const namedAccessors = accessors.filter(accessor => !ignored(accessor.type) && word(accessor.type).test(text));
  const missingAccessors = namedAccessors.filter(accessor => !ignored(accessor.type + '.*') && !ignored(accessor.type + '.' + accessor.name)
    && !word(accessor.name).test(text) && !word('get' + capital(accessor.name)).test(text) && !word('is' + capital(accessor.name)).test(text) && !word('set' + capital(accessor.name)).test(text) && !text.includes(kebab(accessor.name) + '`'))
    .map(accessor => accessor.type + '.' + accessor.name).sort();

  const unread = [];
  for (const [key, field] of keys) {
    if (!field || ignored(key)) continue;
    const suffix = field.field[0].toUpperCase() + field.field.slice(1);
    const accessor = new RegExp('\\b(?:get|is)' + suffix + '\\s*\\(');
    const kebab = key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
    const tail = kebab.split('.').pop();
    const keyLiteral = new RegExp('"[^"]*' + tail.replace(/-/g, '-?') + '[^"]*"', 'i');
    const used = allMainSources.some(other => (other.path !== field.path && /ConditionalOnProperty|@Value|getProperty|@Scheduled/.test(other.source) && keyLiteral.test(other.source))
      || (other.path !== field.path && accessor.test(other.source))
      || (other.path === field.path && new RegExp('(?<!private[^;\\n]*)\\b(?:this\\.)?' + field.field + '\\b(?!\\s*[=;])').test(stripNoise(other.source).replace(FIELD, ''))));
    if (!used) unread.push(key);
  }
  return { module, types: types.length, attributes: attributes.length, keys: keys.size, beans: beans.size, methods: namedMethods.length, accessors: namedAccessors.length, missingTypes, missingAttributes, missingKeys, missingBeans, missingMethods, missingAccessors, unread: unread.sort(), words: text.split(/\s+/).length };
}

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const list = args.includes('--list');
  const showUnread = args.includes('--unread');
  const wanted = args.find(arg => !arg.startsWith('--'));
  const ignores = await readIgnores();
  const names = (await readdir(ROOT)).filter(name => MODULE.test(name)).sort();
  const allMainSources = [];
  for (const name of names) {
    for (const path of (await walk(join(ROOT, name, 'src/main/java'))).filter(p => p.endsWith('.java'))) allMainSources.push({ path, source: await readFile(path, 'utf8') });
  }
  let gaps = 0;
  console.log('ℹ Documentation coverage: public types, annotation attributes, configuration properties, beans replaced by name and public methods the documents never mention\n');
  for (const module of names.filter(name => !wanted || name === wanted || name === 'simplix-' + wanted)) {
    const result = await inspect(module, ignores, allMainSources);
    if (!result) continue;
    const missing = result.missingTypes.length + result.missingAttributes.length + result.missingKeys.length + result.missingBeans.length + result.missingMethods.length + result.missingAccessors.length;
    gaps += missing;
    console.log((missing === 0 ? '✔' : '⚠') + ' ' + module + ': types ' + (result.types - result.missingTypes.length) + '/' + result.types
      + ', annotation attributes ' + (result.attributes - result.missingAttributes.length) + '/' + result.attributes
      + ', properties ' + (result.keys - result.missingKeys.length) + '/' + result.keys
      + ', beans replaced by name ' + (result.beans - result.missingBeans.length) + '/' + result.beans
      + ', public methods ' + (result.methods - result.missingMethods.length) + '/' + result.methods
      + ', generated accessors ' + (result.accessors - result.missingAccessors.length) + '/' + result.accessors + ', ' + result.words + ' words');
    if (list || wanted) {
      if (result.missingTypes.length) console.log('    types: ' + result.missingTypes.join(', '));
      if (result.missingAttributes.length) console.log('    annotation attributes: ' + result.missingAttributes.join(', '));
      if (result.missingKeys.length) console.log('    properties: ' + result.missingKeys.join(', '));
      if (result.missingBeans.length) console.log('    beans replaced by name: ' + result.missingBeans.join(', '));
      if (result.missingMethods.length) console.log('    public methods: ' + result.missingMethods.join(', '));
      if (result.missingAccessors.length) console.log('    generated accessors: ' + result.missingAccessors.join(', '));
    }
    if (showUnread && result.unread.length) console.log('    properties whose accessor no main source calls (a hint: grep the field and the key before writing "no effect"): ' + result.unread.join(', '));
  }
  console.log('\n' + (gaps === 0 ? '✔ Nothing is unmentioned' : '⚠ ' + gaps + ' unmentioned; run with a module name or --list to see them'));
  if (strict && gaps > 0) process.exit(1);
}

main().catch(error => {
  console.error('✖ ' + error.message);
  process.exit(2);
});
