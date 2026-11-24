import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { BUILT_IN_TEMPLATE_DIR } from '../src/lib/templates.js';
import { resolveExportConfig } from '../src/lib/export-config.js';

const templatesDir = BUILT_IN_TEMPLATE_DIR;

/** Every `exportConfig.enabled` block of a template, in order, as one EJS source. */
function exportBlocks(relativePath) {
  const source = fs.readFileSync(path.join(templatesDir, relativePath), 'utf8');
  const blocks = source.match(/<% if \(exportConfig\.enabled\) \{ -?%>[\s\S]*?<% \} -?%>/g) || [];
  return blocks.join('\n');
}

function render(relativePath, exportConfig) {
  return ejs.render(exportBlocks(relativePath), {
    exportConfig,
    entityName: 'AuditEvent',
    classPrefix: 'AuditEvent',
    ymlConfig: { permissionGroup: 'SYSTEM' },
  });
}

describe('resolveExportConfig', () => {
  it('is off when the yml does not ask for it', () => {
    assert.deepStrictEqual(resolveExportConfig('Order', {}, 'orders'), { enabled: false });
    assert.deepStrictEqual(resolveExportConfig('Order', undefined, 'orders'), { enabled: false });
    assert.deepStrictEqual(resolveExportConfig('Order', { export: false }, 'orders'), { enabled: false });
  });

  it('writes the list DTO under the last path segment when set to true', () => {
    assert.deepStrictEqual(resolveExportConfig('Order', { export: true }, 'shop/orders'), {
      enabled: true,
      dto: 'OrderListDTO',
      mapper: '',
      baseName: 'orders',
    });
  });

  it('maps list rows through a named DTO and honours a base name', () => {
    assert.deepStrictEqual(resolveExportConfig('Order', { export: { dto: 'OrderExportDTO', baseName: 'all-orders' } }, 'orders'), {
      enabled: true,
      dto: 'OrderExportDTO',
      mapper: '.map(OrderExportDTO::of)',
      baseName: 'all-orders',
    });
  });

  it('rejects a malformed export setting', () => {
    assert.throws(() => resolveExportConfig('Order', { export: 'yes' }, 'orders'), { message: /export/ });
    assert.throws(() => resolveExportConfig('Order', { export: { dto: 'orderExport' } }, 'orders'), { message: /export\.dto/ });
    assert.throws(() => resolveExportConfig('Order', { export: { baseName: 'a/b' } }, 'orders'), { message: /baseName/ });
    assert.throws(() => resolveExportConfig('Order', { export: { format: 'CSV' } }, 'orders'), { message: /unknown keys/ });
  });
});

describe('export blocks in the built-in templates', () => {
  const controller = 'controller/rest/EntityRestController.java.template';
  const service = 'service/EntityService.java.template';

  it('emit nothing when the export is off', () => {
    assert.strictEqual(render(controller, { enabled: false }).trim(), '');
    assert.strictEqual(render(service, { enabled: false }).trim(), '');
  });

  it('emit the export endpoint under the export permission', () => {
    const out = render(controller, resolveExportConfig('AuditEvent', { export: true }, 'common/audit-events'));
    assert.ok(out.includes('import dev.simplecore.simplix.excel.export.ExportFormat;'));
    assert.ok(out.includes('@GetMapping("/export")'));
    assert.ok(out.includes("@PreAuthorize(\"hasPermission('SYSTEM', 'export')\")"));
    assert.ok(out.includes('@SearchableParams(AuditEventSearchDTO.class) Map<String, String> params'));
    assert.ok(out.includes('@RequestParam(defaultValue = "CSV") ExportFormat format'));
    assert.ok(out.includes('service.export(params, format, response);'));
  });

  it('emit a SearchExport over the list search with the list DTO by default', () => {
    const out = render(service, resolveExportConfig('AuditEvent', { export: true }, 'common/audit-events'));
    assert.ok(out.includes('import dev.simplecore.simplix.excel.export.SearchExport;'));
    assert.ok(out.includes('SearchExport.of(AuditEventListDTO.class, filters -> search(filters))'));
    assert.ok(out.includes('.baseName("audit-events")'));
  });

  it('map the list rows through a named export DTO', () => {
    const out = render(
      service,
      resolveExportConfig('AuditEvent', { export: { dto: 'AuditEventExportDTO' } }, 'common/audit-events')
    );
    assert.ok(out.includes('SearchExport.of(AuditEventExportDTO.class, filters -> search(filters).map(AuditEventExportDTO::of))'));
  });
});
