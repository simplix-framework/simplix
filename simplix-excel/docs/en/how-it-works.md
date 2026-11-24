# How simplix-excel works

The classes behind an export and an import, what the module registers, and where the defaults come from.

## Exporters and importers

| Interface | Implementation | Writes or reads |
|---|---|---|
| `ExcelExporter<T>` | `StandardExcelExporter<T>` | an `.xlsx` sheet from the `@ExcelColumn` fields of a row class |
| `CsvExporter<T>` | `UnifiedCsvExporter<T>` | a `.csv` file from the same fields, in a `UnifiedCsvExporter.Encoding` |
| `JxlsExporter<T>` | `JxlsExporterImpl<T>` | a workbook filled from a template |
| none | `StandardExcelImporter<T>` | objects from an uploaded Excel or CSV file |

The exporters extend `AbstractExporter`, which reads the annotated fields of the row class once, orders them and sets the download headers of the response. Its `AbstractExporter.BatchProcessor` is the callback through which rows are handed over page by page. An exporter is created with `new` for each export, since it holds the options of that export.

## From a field to a cell

1. `ExcelConverter` reads the value of each annotated field of a row.
2. A number or a date becomes a numeric cell with the `format` of the column; `ExcelStyleManager` creates the cell style for the column once and reuses it for every row, and `DefaultCellStyle` gives the workbook the named `Normal` style spreadsheet programs expect.
3. For CSV and for text cells, `ValueFormatter` picks a `Formatter` by the type of the value: `NumberFormatter`, `DateFormatter` for `java.util.Date`, `TemporalFormatter` for the `java.time` types and `DefaultFormatter` for the rest, all built on `AbstractFormatter` and cached in `FormatterCache`.
4. `ExcelLabels` resolves a header written as `{key}`, the label of an enum constant and the text of a boolean value.
5. On import, `TypeConverter` turns the text of a cell into the type of the field, with `DateConverter` and `TemporalConverter` for dates.

`Converter<T>` is the interface of the two date converters. `ConverterRegistry` and `StringUtil` are helpers an application may call for its own conversions; the exporters and the importer do not consult the registry.

`ExcelConverter` and `ExcelStyleManager` may be called as well, by code that writes a sheet with POI itself. The results below are those of a row class with a `Title` column and a `Price` column whose `format` is `#,##0.00`.

| Call | Result |
|---|---|
| `ExcelConverter.extractColumnTitles(BookRow.class)` | the `name` of each `@ExcelColumn` field, sorted by `order`: `[Title, Price]` |
| `ExcelConverter.convertToRowData(rows, BookRow.class)` | each row as texts, the `toString()` of every column value and an empty text for `null`: `[[Dune, 12.5], [Emma, ]]`. The `format` of a column is not applied |
| `ExcelConverter.prepareDataModel(rows, BookRow.class)` | a map that holds both, under `headers` and `rows`, for a template of your own |
| `ExcelConverter.clearCaches()` | discards the fields and titles read so far |
| `new ExcelStyleManager(workbook).createHeaderStyle()` | the header style of the exporter: centred, bold, with thin borders and a grey background |
| `createDataStyle(value, column)` | the style of a data cell from the attributes of its `@ExcelColumn`. The `format` is set when the value is a number or a date, so `12.5` in the `Price` column receives `#,##0.00` and a text receives `General` |
| `clearCache()` | discards the styles created so far; the same attributes otherwise return the same style object |

## What the module registers

`SimplixExcelAutoConfiguration` binds `simplix.excel` to `SimplixExcelProperties` and applies it at start: the formats to `ValueFormatter`, the cache switches to the template and field caches, and the template settings to the `ExcelTemplateGenerator.TemplateOptions` bean. It also registers:

| Bean | Role |
|---|---|
| `ExcelLabelsInitializer` | hands the `MessageSource` and the `ExcelLabelResolver` beans of the application to `ExcelLabels` once the context is up |
| `JxlsExporter`, `CsvExporter` | exporters preconfigured from the properties, for code that injects one |

`DefaultTemplateInitializer.initializeDefaultTemplate()` is a static helper: called by an application, it creates the template directory and a default template when they do not exist. `ExcelTemplateManager` loads and caches templates for the JXLS exporter.

## Failures

A failure while a file is written reaches the caller as `ExcelExportException` or as the `IOException` of the stream. The response may already carry part of the file then, so set the download headers through the exporter and let the exception reach the client as a broken download: an error body cannot be sent any more.

## Related documents

- [Exporting data](./exporting-data.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
