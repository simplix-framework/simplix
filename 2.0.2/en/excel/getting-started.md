# Getting started with simplix-excel

This page describes the rows of a file with a class, and writes controller endpoints that download and upload it.

## Step 1. Describe a row

```java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoanRow {

    @ExcelColumn(name = "Reader", order = 1, width = 24)
    private String reader;

    @ExcelColumn(name = "Title", order = 2, width = 40)
    private String title;

    @ExcelColumn(name = "Due", order = 3, format = "yyyy-MM-dd")
    private LocalDate due;

    @ExcelColumn(name = "Late fee", order = 4, format = "#,##0")
    private BigDecimal lateFee;

    @ExcelColumn(name = "Returned", order = 5)
    private Boolean returned;

    @ExcelColumn(ignore = true)
    private String internalNote;
}
```

Each field with `@ExcelColumn` is a column: `name` is the header, `order` the position, `format` the pattern of dates and numbers. A field marked `ignore` is left out.

## Step 2. Write the endpoints

```java
@RestController
@RequestMapping("/catalog/loan")
@RequiredArgsConstructor
public class LoanFileController {

    private final LoanQueries loans;

    @GetMapping("/export.xlsx")
    public void xlsx(HttpServletResponse response) throws IOException {
        new StandardExcelExporter<>(LoanRow.class)
            .filename("loans.xlsx")
            .sheetName("Loans")
            .export(loans.all(), response);
    }

    @GetMapping("/export.csv")
    public void csv(HttpServletResponse response) throws IOException {
        new UnifiedCsvExporter<>(LoanRow.class)
            .filename("loans.csv")
            .export(loans.all(), response);
    }

    @PostMapping("/import")
    public SimpliXApiResponse<Integer> upload(@RequestParam("file") MultipartFile file) throws IOException {
        List<LoanRow> rows = new StandardExcelImporter<>(LoanRow.class).importFromExcel(file);
        loans.saveAll(rows);
        return SimpliXApiResponse.success(rows.size());
    }
}
```

An exporter writes the file to the response and sets the content type and the download file name. The importer returns one object per row.

## Step 3. Look at the file

With two loans, the CSV download reads as follows.

```csv
"Reader","Title","Due","Late fee","Returned"
"Ursula","On dragons, volume 1","2026-03-01","1,500",Y
"'=cmd()","Say ""hello""","2026-03-09",0,N
```

- Dates and numbers follow the `format` of the column.
- Boolean values are written as `Y` and `N`.
- A text value is quoted, and a quote inside it is doubled.
- A value that starts with `=` gets a leading apostrophe, so a spreadsheet does not run it as a formula.

The Excel download holds the same header row and values on a sheet named `Loans`.

## Next steps

- [Exporting data](en/excel/exporting-data.md)
- [Importing files](en/excel/importing-files.md)
- [Labelling columns and values](en/excel/labelling-columns-and-values.md)
