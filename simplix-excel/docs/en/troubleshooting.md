# Troubleshooting simplix-excel

Symptoms an application meets when it exports or imports files, the cause of each and what to change.

## Exports

| Symptom | Cause | What to do |
|---|---|---|
| Hangul in a CSV file is unreadable in Excel | Excel reads a UTF-8 file without a byte order mark in the local code page | export with `encoding(UnifiedCsvExporter.Encoding.UTF8_BOM)` |
| A header shows a key such as `entities.Loan.reader` | the key has no translation in the bundles the labels are read from | add the key, or register an `ExcelLabelResolver`; see [Labelling columns and values](./labelling-columns-and-values.md) |
| A cell shows `Isbn[value=978-1]` or a class name | the field has a type the exporters have no rule for, so `toString()` is written | give the type a `toString()` for export, or use a `String` field |
| A value that starts with `=` has an apostrophe in front in CSV | `sanitizeFormulas` protects the reader from formula injection | leave it on for files people open; switch it off only for files another program reads |
| A large export fails with `OutOfMemoryError` | every row is loaded before the file is written | use `streaming(true)` with a `dataProvider`, or a `StreamingCollection`, and leave `autoSizeColumns` off |
| A template export fails with `Template not found` | the path does not start with a slash for a classpath template, or the file is not packaged | use a path such as `/templates/loan-report.xlsx` and check the built jar |
| A changed template is not picked up | templates are cached | call `ExcelTemplateManager.removeFromCache(path)`, or restart |
| `format.currency-format`, `format.decimal-format` or `format.percentage-format` changes nothing | no code reads these properties | set the pattern on the column with `format` |

## Imports

| Symptom | Cause | What to do |
|---|---|---|
| A CSV import fails on a number such as `"1,500"` | the importer does not read a thousands separator | export numbers that will be imported again without a group separator |
| A `BigDecimal` read from Excel is `1500.0` | a numeric cell is read as a floating-point number | set the scale after the import |
| Values land in the wrong fields | the columns of the file are not in the `order` of the row class | set `setColumnMapping` with the column numbers of the file |
| The first row of data is missing | the importer skips the first row as the header | call `setSkipHeader(false)` for a file without a header |
| A date is read as the wrong day | the text does not match `dateFormat`, or the zone of the import differs from the zone the file was written in | set `setDateFormat` and `setApplicationZoneId` |

## Related documents

- [How simplix-excel works](./how-it-works.md)
- [Importing files](./importing-files.md)
