# Exporting with a template

How to fill a workbook that was designed in Excel: a report with a title block, merged cells, formulas and a logo. The layout lives in the template file, and the code only supplies the data.

## Step 1. Design the template

Create the workbook in Excel and mark the cells with JXLS expressions. The rows are available as `items`, and each parameter by its name.

| Cell | Content |
|---|---|
| a title cell | `${branch}`, `${printedOn}` |
| the first cell of the sheet, as a comment | `jx:area(lastCell="E2")` |
| the first cell of the repeated row, as a comment | `jx:each(items="items" var="item" lastCell="E2")` |
| the cells of the repeated row | `${item.reader}`, `${item.title}`, `${item.due}` |

Save the file under `src/main/resources/templates`.

## Step 2. Fill it

```java
new JxlsExporterImpl<>(LoanRow.class)
    .template("/templates/loan-report.xlsx")
    .filename("loan-report.xlsx")
    .parameter("branch", "Central Library")
    .parameter("printedOn", LocalDate.now())
    .export(loans.all(), response);
```

The template path is read from the classpath when it starts with a slash, and from the file system otherwise.

| Method | Meaning |
|---|---|
| `template(path)` | the template file |
| `parameter(name, value)`, `parameters(map)` | values for the expressions outside the rows |
| `enableFormulas(boolean)` | recalculates the formulas of the template after the rows are filled in |
| `hideGridLines(boolean)` | hides the grid lines of the sheet |
| `sheetName(name)` | names the sheet |
| `streaming(boolean)`, `rowAccessWindowSize(n)` | writes large results with a window of rows in memory |

## Generate a template to start from

```java
try (OutputStream out = Files.newOutputStream(Path.of("src/main/resources/templates/loan-report.xlsx"))) {
    ExcelTemplateGenerator.generateTemplate(out);
}
```

`ExcelTemplateGenerator` writes a workbook with one sheet, `Data`, that already carries the JXLS markers: `jx:area` on the first cell, a `jx:each` over `headers` that writes the header row to the right, and a `jx:each` over `rows` for the data. Open it in Excel and design around the markers. The `simplix.excel.template.*` properties set the sheet name, the column width and whether the markers and the header style are written.

## How templates are loaded

- A template is read once and kept in memory. `ExcelTemplateManager.removeFromCache(path)` and `clearCache()` make the next export read the file again; `simplix.excel.cache.template-cache-enabled: false` switches the cache off.
- `ExcelTemplateManager.templateExists(path)` tells whether a template can be found.
- An export with a path that does not exist fails with `IllegalArgumentException: Template not found: <path>`.

## Related documents

- [Exporting data](./exporting-data.md)
- [Configuration reference](./configuration-reference.md)
