# Exporting data

How to write rows to an Excel or CSV file: a list already in memory, everything a search matches, and tables too large to load at once.

## The exporters

| Class | Writes | Options |
|---|---|---|
| `StandardExcelExporter` | `.xlsx` | `filename`, `sheetName`, `autoSizeColumns`, `streaming`, `pageSize`, `windowSize`, `dataProvider` |
| `UnifiedCsvExporter` | `.csv` | `filename`, `delimiter`, `encoding`, `includeHeader`, `quoteStrings`, `sanitizeFormulas`, `lineEnding`, `dateFormat`, `numberFormat`, `streaming`, `batchSize`, `dataProvider` |
| `JxlsExporterImpl` | `.xlsx` from a template | see [Exporting with a template](en/excel/exporting-with-a-template.md) |

Create an exporter with the row class, set the options, and call `export(items, response)` to answer a download or `export(items, outputStream)` to write anywhere else.

## Export what a list shows

A list screen shows one page; its export should hold every row the same filters match. `SearchExport` calls your paged search again and again and writes all pages to one file.

```java
@GetMapping("/export")
public void export(@RequestParam Map<String, String> params,
                   @RequestParam(defaultValue = "XLSX") ExportFormat format,
                   HttpServletResponse response) throws IOException {
    SearchExport.of(LoanRow.class, loans::search)
        .baseName("loans")
        .pageSize(500)
        .write(params, format, response);
}
```

The `page` and `size` of the request are replaced by the export's own paging and `format` is dropped; every other parameter, the sort included, reaches each page. The file is named by `baseName` and the format: `loans.csv` or `loans.xlsx`.

## Export a large table

```java
new StandardExcelExporter<>(LoanRow.class)
    .filename("loans.xlsx")
    .streaming(true)
    .dataProvider(pageRequest -> loans.page(pageRequest))
    .export(null, response);
```

With `streaming(true)` and a `dataProvider`, the exporter asks for one page at a time and keeps only a window of rows in memory. Without a provider, a collection longer than the page size is written in the same way, page by page.

| Property | Default | Meaning |
|---|---|---|
| `simplix.excel.export.page-size` | `1000` | rows asked for per page |
| `simplix.excel.export.window-size` | `100` | rows kept in memory while streaming |
| `simplix.excel.export.streaming-enabled` | `false` | streams by default |

### A collection that loads itself

`StreamingCollection` is a collection that asks a page supplier for its content while it is iterated. Pass it to any exporter, the CSV exporter included, to export a query result that does not fit into memory.

```java
StreamingCollection<LoanRow> rows = new StreamingCollection<>(pageRequest -> loans.page(pageRequest), 1000);

new UnifiedCsvExporter<>(LoanRow.class)
    .filename("loans.csv")
    .export(rows, response);
```

The supplier is called once to learn the total and then once per page: 25 rows with a page size of 10 take four calls. Give the query a stable order, or rows can be repeated or skipped between pages.

## CSV details

- `encoding` sets the character set: `UTF8`, `UTF8_BOM`, `ISO_8859_1`, `UTF16_LE` or `UTF16_BE`. Choose `UTF8_BOM` when the file is opened in Excel.
- `sanitizeFormulas`, on by default, puts an apostrophe before a value that starts with `=`, `+`, `-` or `@`.
- `delimiter` and `lineEnding` adapt the file to the program that reads it.

## Style the columns

Width, font, colours and number and date formats are attributes of `@ExcelColumn`. [Styling columns](en/excel/styling-columns.md) lists them with the result of each.

## Related documents

- [Labelling columns and values](en/excel/labelling-columns-and-values.md)
- [Exporting with a template](en/excel/exporting-with-a-template.md)
