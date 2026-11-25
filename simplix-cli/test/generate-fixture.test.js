import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { BUILT_IN_TEMPLATE_DIR } from '../src/lib/templates.js';
import { EXPECTED_DIR, copyFixture, editConfig, listFiles, read, runCli, write } from './support/fixture.js';

const ENTITIES = ['Author', 'Book', 'Shelf'];
const WEB = 'generated/main/java/com/example/library/web/catalog';

describe('config over the library fixture', () => {
  let root;

  before(() => {
    root = copyFixture('library');
    fs.rmSync(path.join(root, '.simplix', 'entity'), { recursive: true });
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  for (const entity of ENTITIES) {
    it(`writes the yml of ${entity} from its source`, () => {
      const result = runCli(['config', entity], root);

      assert.strictEqual(result.status, 0, result.stderr);
      assert.strictEqual(read(root, `.simplix/entity/${entity}.yml`), read(EXPECTED_DIR, `config/${entity}.yml`));
    });
  }

  it('keeps an existing yml without --force and says so', () => {
    write(root, '.simplix/entity/Author.yml', 'entity: Author\n');

    const result = runCli(['config', 'Author'], root);

    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /Config file already exists: Author\.yml/);
    assert.strictEqual(read(root, '.simplix/entity/Author.yml'), 'entity: Author\n');
  });

  it('fails, naming the class and the path searched, for an entity with no source', () => {
    const result = runCli(['config', 'Magazine'], root);

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /Entity file not found/);
    assert.match(result.stderr, /Looking for: Magazine\.java/);
    assert.ok(!fs.existsSync(path.join(root, '.simplix/entity/Magazine.yml')));
  });
});

describe('generate over the library fixture, with the built-in templates alone', () => {
  let root;

  before(() => {
    root = copyFixture('library');
    assert.ok(!fs.existsSync(path.join(root, '.simplix', 'templates')), 'the fixture must have no templates of its own');
    for (const entity of ENTITIES) {
      const result = runCli(['generate', entity], root);
      assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    }
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('reports no missing template, the controller test being one only a project provides', () => {
    const fresh = copyFixture('library');
    try {
      const result = runCli(['generate', 'Book'], fresh);

      assert.strictEqual(result.status, 0, result.stderr);
      assert.ok(!result.stdout.includes('SKIP'));
      assert.ok(!result.stdout.includes('RestControllerTest'));
    } finally {
      fs.rmSync(fresh, { recursive: true, force: true });
    }
  });

  it('generates the controller test once the project provides its template', () => {
    const fresh = copyFixture('library');
    try {
      write(fresh, '.simplix/templates/test/EntityRestControllerTest.java.template', '// <%= controllerName %>Test\n');

      const result = runCli(['generate', 'Book'], fresh);

      assert.strictEqual(result.status, 0, result.stderr);
      assert.strictEqual(
        read(fresh, 'generated/test/java/com/example/library/web/catalog/controller/BookRestControllerTest.java'),
        '// BookRestControllerTest\n'
      );
    } finally {
      fs.rmSync(fresh, { recursive: true, force: true });
    }
  });

  it('says which template is missing when the configuration maps a component to one that does not exist', () => {
    const fresh = copyFixture('library');
    try {
      editConfig(fresh, config => {
        config.template = { dto: 'dto/Renamed.java.template' };
      });

      const result = runCli(['generate', 'Book'], fresh);

      assert.match(result.stdout, /SKIP: .*BookDTOs\.java \(template not found: \.simplix\/templates\/dto\/Renamed\.java\.template\)/);
      assert.ok(!fs.existsSync(path.join(fresh, WEB, 'dto', 'BookDTOs.java')));
      assert.ok(fs.existsSync(path.join(fresh, WEB, 'service', 'BookService.java')));
    } finally {
      fs.rmSync(fresh, { recursive: true, force: true });
    }
  });

  it('writes exactly the expected files', () => {
    const expected = listFiles(path.join(EXPECTED_DIR, 'generated'));

    assert.ok(expected.length > 0, 'the expected tree is empty, so the comparison would prove nothing');
    assert.deepStrictEqual(listFiles(path.join(root, 'generated')), expected);
  });

  for (const file of listFiles(path.join(EXPECTED_DIR, 'generated'))) {
    it(`renders ${path.basename(file)} as expected`, () => {
      assert.strictEqual(read(root, `generated/${file}`), read(EXPECTED_DIR, `generated/${file}`));
    });
  }

  it('generates the tree service only for the entity that implements TreeEntity', () => {
    const services = listFiles(path.join(root, WEB, 'service'));

    assert.ok(services.includes('ShelfTreeService.java'));
    assert.ok(!services.includes('BookTreeService.java'));
    assert.ok(!services.includes('AuthorTreeService.java'));
  });

  it('passes create and update the reference the DTOs carry, and not the one only shown', () => {
    const service = read(root, `${WEB}/service/BookService.java`);

    assert.ok(service.includes('return saveAndGetProjection(entity, createDTO.getAuthorId());'));
    assert.ok(service.includes('return saveAndGetProjection(entity, updateDto.getAuthorId());'));
    assert.ok(service.includes('private BookDetailDTO saveAndGetProjection(Book entity, String authorId) {'));
    assert.ok(!service.includes('getShelfId'));
  });

  it('passes no reference for an entity whose yml edits none', () => {
    const service = read(root, `${WEB}/service/AuthorService.java`);

    assert.ok(service.includes('return saveAndGetProjection(entity);'));
    assert.ok(service.includes('private AuthorDetailDTO saveAndGetProjection(Author entity) {'));
  });

  it('drops sortable on the Boolean field the yml asked to sort by, and keeps it on the others', () => {
    const lines = read(root, `${WEB}/dto/BookDTOs.java`).split('\n');
    const annotation = field => lines.find(line => line.includes(`@SearchableField(entityField = "${field}"`));

    assert.strictEqual(annotation('referenceOnly').trim(), '@SearchableField(entityField = "referenceOnly", operators = {EQUALS})');
    assert.ok(annotation('title').includes('sortable = true'));
    assert.ok(annotation('title').includes('keyword = true'));
  });

  it('generates the export endpoint only for the entity whose yml asks for it', () => {
    assert.ok(read(root, `${WEB}/controller/BookRestController.java`).includes('@GetMapping("/export")'));
    assert.ok(!read(root, `${WEB}/controller/AuthorRestController.java`).includes('@GetMapping("/export")'));
  });

  it('imports no class of an application: every dev.simplecore.simplix import is a source of this framework', t => {
    const repository = fileURLToPath(new URL('../../', import.meta.url));
    if (!fs.existsSync(path.join(repository, 'settings.gradle'))) {
      t.skip('the framework sources are not beside the package, so the imports cannot be resolved');
      return;
    }

    const sources = new Set();
    for (const module of fs.readdirSync(repository, { withFileTypes: true })) {
      const javaRoot = path.join(repository, module.name, 'src', 'main', 'java');
      if (!module.isDirectory() || !fs.existsSync(javaRoot)) continue;
      for (const file of listFiles(javaRoot)) if (file.endsWith('.java')) sources.add(file.slice(0, -5).split('/').join('.'));
    }

    const imports = new Set();
    for (const file of listFiles(path.join(root, 'generated'))) {
      for (const match of read(root, `generated/${file}`).matchAll(/^import (?:static )?([\w.]+?)(?:\.\*)?;/gm)) imports.add(match[1]);
    }

    const framework = [...imports].filter(name => name.startsWith('dev.simplecore.simplix.'));
    assert.ok(framework.length > 10, `only ${framework.length} framework imports were found, so the scan is not reading the files`);

    // A nested class or a static member is imported through its outer class.
    const resolves = name => {
      const parts = name.split('.');
      for (let length = parts.length; length > 3; length--) if (sources.has(parts.slice(0, length).join('.'))) return true;
      return false;
    };
    assert.deepStrictEqual(framework.filter(name => !resolves(name)), []);

    const foreign = [...imports].filter(
      name => name.startsWith('dev.simplecore.') && !name.startsWith('dev.simplecore.simplix.') && !name.startsWith('dev.simplecore.searchable.')
    );
    assert.deepStrictEqual(foreign, []);
  });

  it('skips a file that exists without --force, and overwrites it with --force', () => {
    const file = `${WEB}/service/AuthorService.java`;
    write(root, file, '// edited by hand\n');

    const kept = runCli(['generate', 'Author'], root);
    assert.strictEqual(kept.status, 0);
    assert.match(kept.stdout, /SKIP: .*AuthorService\.java \(already exists, use --force to overwrite\)/);
    assert.strictEqual(read(root, file), '// edited by hand\n');

    const forced = runCli(['generate', 'Author', '--force'], root);
    assert.strictEqual(forced.status, 0);
    assert.strictEqual(read(root, file), read(EXPECTED_DIR, `${file}`));
  });

  it('runs from a directory below the project root', () => {
    const result = runCli(['generate', 'Author', '--force'], path.join(root, 'src', 'main'));

    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Successfully generated CRUD files for Author/);
  });

  it('writes no test file with --no-test', () => {
    const fresh = copyFixture('library');
    try {
      const result = runCli(['generate', 'Author', '--no-test'], fresh);

      assert.strictEqual(result.status, 0, result.stderr);
      assert.deepStrictEqual(listFiles(path.join(fresh, 'generated', 'test')), []);
      assert.strictEqual(listFiles(path.join(fresh, 'generated', 'main')).length, 3);
    } finally {
      fs.rmSync(fresh, { recursive: true, force: true });
    }
  });
});

describe('a template of the project replaces the built-in one of the same path', () => {
  let root;

  before(() => {
    root = copyFixture('library');
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('renders the file from the project template and every other file from the built-in ones', () => {
    write(root, '.simplix/templates/service/EntityService.java.template', '// <%= classPrefix %>Service, from the project\n');

    const result = runCli(['generate', 'Author'], root);

    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(read(root, `${WEB}/service/AuthorService.java`), '// AuthorService, from the project\n');
    assert.strictEqual(
      read(root, `${WEB}/dto/AuthorDTOs.java`),
      read(EXPECTED_DIR, `${WEB}/dto/AuthorDTOs.java`)
    );
  });

  it('lists which templates are the project\'s and which are built in', () => {
    const lines = runCli(['templates'], root).stdout.trim().split('\n');

    assert.ok(lines.includes('project   service/EntityService.java.template (replaces the built-in template)'));
    assert.ok(lines.includes('built-in  dto/EntityDTOs.java.template'));
  });

  it('copies one built-in template into the project with --eject, and keeps an existing copy', () => {
    const ejected = runCli(['templates', '--eject', 'dto/EntityDTOs.java.template'], root);
    assert.strictEqual(ejected.status, 0, ejected.stderr);
    assert.strictEqual(
      read(root, '.simplix/templates/dto/EntityDTOs.java.template'),
      fs.readFileSync(path.join(BUILT_IN_TEMPLATE_DIR, 'dto/EntityDTOs.java.template'), 'utf8')
    );

    const again = runCli(['templates', '--eject', 'service/EntityService.java.template'], root);
    assert.match(again.stdout, /SKIP: .*EntityService\.java\.template \(already exists/);
    assert.strictEqual(read(root, '.simplix/templates/service/EntityService.java.template'), '// <%= classPrefix %>Service, from the project\n');
  });

  it('refuses to eject a template the CLI does not ship', () => {
    const result = runCli(['templates', '--eject', 'service/Missing.java.template'], root);

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /No built-in template named service\/Missing\.java\.template/);
  });
});

describe('a template that fails to render', () => {
  let root;

  before(() => {
    root = copyFixture('library');
    write(root, '.simplix/templates/dto/EntityDTOs.java.template', '<% throw new Error("the dto template refuses") %>');
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('fails the run, names the file and the reason, and still writes the files that rendered', () => {
    const result = runCli(['generate', 'Author'], root);

    assert.strictEqual(result.status, 1);
    assert.match(result.stdout, /Failed to render dto\/EntityDTOs\.java\.template: [\s\S]*the dto template refuses/);
    assert.match(result.stderr, /1 of 4 files failed to render for Author: AuthorDTOs\.java/);
    assert.ok(!result.stdout.includes('Successfully generated'));
    assert.ok(!fs.existsSync(path.join(root, WEB, 'dto', 'AuthorDTOs.java')));
    assert.ok(fs.existsSync(path.join(root, WEB, 'service', 'AuthorService.java')));
  });
});

describe('a yml that asks for a member only an application class can answer', () => {
  let root;

  before(() => {
    root = copyFixture('library');
    write(root, '.simplix/entity/Book.yml', read(root, '.simplix/entity/Book.yml').replace('export: true\n', 'export: true\nstatusCounts: [status]\n'));
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('refuses, naming the yml key and the configuration key, while no class is configured', () => {
    const result = runCli(['generate', 'Book'], root);

    assert.strictEqual(result.status, 1);
    assert.match(result.stdout, /Book\.yml uses statusCounts or aggregates, which needs supportClasses\.searchFigures in \.simplix\/simplix-boot\.json/);
  });

  it('imports the configured class and calls it by its simple name', () => {
    editConfig(root, config => {
      config.supportClasses = { searchFigures: 'com.example.library.app.search.ListFigures' };
    });

    const result = runCli(['generate', 'Book', '--force'], root);
    const service = read(root, `${WEB}/service/BookService.java`);
    const controller = read(root, `${WEB}/controller/BookRestController.java`);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.ok(service.includes('import com.example.library.app.search.ListFigures;'));
    assert.ok(service.includes('import com.example.library.app.search.ListFigures.ValueCountDTO;'));
    assert.ok(service.includes('public List<ValueCountDTO> statusCounts(String field, Map<String, String> params) {'));
    assert.ok(controller.includes('import com.example.library.app.search.ListFigures.ValueCountDTO;'));
  });

  it('refuses a configured value that is not a class name', () => {
    editConfig(root, config => {
      config.supportClasses = { searchFigures: 'ListFigures' };
    });

    const result = runCli(['generate', 'Book', '--force'], root);

    assert.strictEqual(result.status, 1);
    assert.match(result.stdout, /supportClasses\.searchFigures in simplix-boot\.json must be a fully qualified Java class name/);
  });
});

describe('promote and generated over the library fixture', () => {
  let root;
  const promoted = 'modules/catalog/src/main/java/com/example/library/web/catalog/service/AuthorService.java';

  before(() => {
    root = copyFixture('library');
    for (const entity of ENTITIES) assert.strictEqual(runCli(['generate', entity], root).status, 0);
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('requires the module', () => {
    const result = runCli(['promote', 'Author'], root);

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /--module option is required/);
  });

  it('moves the generated files into the module, stamps them and stores their bases', () => {
    const result = runCli(['promote', 'Author', '--module', 'catalog'], root);
    const held = read(root, promoted);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(held, /^\/\/ @simplix-generated\n\/\/ @simplix-render [0-9a-f]{12} promote Author --module catalog\n/);
    assert.strictEqual(read(root, `.simplix/bases/${promoted}`), held);
    assert.ok(!fs.existsSync(path.join(root, WEB, 'service', 'AuthorService.java')));
  });

  it('reports every promoted file untouched, as one JSON line and nothing else on standard output', () => {
    const result = runCli(['generated', '--json'], root);
    const report = JSON.parse(result.stdout);

    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout.trim().split('\n').length, 1);
    assert.deepStrictEqual(report.counts, { untouched: 4 });
    assert.ok(report.files.some(file => file.path === promoted && file.entity === 'Author' && file.state === 'untouched'));
  });

  it('reports an edited file as edited, and merges a later template change into it', () => {
    write(root, promoted, read(root, promoted).replace('public class AuthorService', '// kept by hand\npublic class AuthorService'));
    assert.deepStrictEqual(JSON.parse(runCli(['generated', '--json'], root).stdout).counts, { edited: 1, untouched: 3 });

    const template = fs.readFileSync(path.join(BUILT_IN_TEMPLATE_DIR, 'service/EntityService.java.template'), 'utf8');
    write(root, '.simplix/templates/service/EntityService.java.template', `${template}\n// added by the template\n`);
    assert.strictEqual(runCli(['generate', 'Author', '--force'], root).status, 0);

    const result = runCli(['promote', 'Author', '--module', 'catalog'], root);
    const merged = read(root, promoted);

    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Merged the template change into the edits/);
    assert.ok(merged.includes('// kept by hand\npublic class AuthorService'));
    assert.ok(merged.trimEnd().endsWith('// added by the template'));
  });

  it('exits non-zero and names the state when a promoted file has no base', () => {
    fs.rmSync(path.join(root, '.simplix', 'bases'), { recursive: true });

    const result = runCli(['generated', '--no-render'], root);

    assert.strictEqual(result.status, 1);
    assert.match(result.stdout, /no-base +modules\/catalog\/src\/main\/java\/com\/example\/library\/web\/catalog\/service\/AuthorService\.java/);
  });
});
