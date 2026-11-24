# Importing files

How to read an uploaded Excel or CSV file into objects, and what to check before the rows are saved.

## Read a file

```java
StandardExcelImporter<LoanRow> importer = new StandardExcelImporter<>(LoanRow.class);
importer.setSheetIndex(0);
importer.setSkipHeader(true);
importer.setDateFormat("yyyy-MM-dd");

List<LoanRow> fromExcel = importer.importFromExcel(file);
List<LoanRow> fromCsv = importer.importFromCsv(file);
```

The importer reads the columns in the `order` of the `@ExcelColumn` fields of the row class and returns one object per row. With the defaults it reads the first sheet and skips the first row as the header.

| Setter | Default | Meaning |
|---|---|---|
| `setSheetIndex` | `0` | the sheet of an Excel file |
| `setSkipHeader` | `true` | skips the first row |
| `setDateFormat` | `yyyy-MM-dd` | the pattern of date text |
| `setDateTimeFormat` | `yyyy-MM-dd HH:mm:ss` | the pattern of date-time text |
| `setApplicationZoneId` | the system zone | the zone given to date cells read into `OffsetDateTime`, `ZonedDateTime` or `Instant` |
| `setColumnMapping` | by `order` | which column fills which field |

## Map the columns yourself

When the file is not laid out like the row class, say which column, counted from zero, fills which field. Columns that are not named are ignored.

```java
importer.setColumnMapping(Map.of(
    0, "reader",
    1, "title",
    3, "lateFee"
));
```

## How values are converted

| Field type | From an Excel cell | From CSV text |
|---|---|---|
| `String` | the text of the cell | the text |
| `Integer`, `Long`, `Double`, `Float`, `BigDecimal` | the number of the cell | plain digits such as `2000` or `12.5`; a thousands separator is not read |
| `Boolean` | a boolean cell, or text | text such as `Y`, `N`, `true`, `false`, `1`, `0` |
| `LocalDate`, `LocalDateTime`, `OffsetDateTime`, `ZonedDateTime`, `Instant` | a date cell, or text in the date format | text in the date format |

> ⚠ A file this module exported with a number format such as `#,##0` writes `1,500`. Read back from CSV, that text does not become a number and the import fails. Export numbers that will be imported again without a group separator.

An empty cell leaves the field at its default. A row that cannot be turned into an object stops the import with an exception that names the cause.

## Validate before saving

The importer converts and does not judge. Put Bean Validation constraints on the row class and check every row before any is saved, so that a file is accepted whole or not at all.

```java
List<LoanRow> rows = importer.importFromExcel(file);

for (int i = 0; i < rows.size(); i++) {
    Set<ConstraintViolation<LoanRow>> violations = validator.validate(rows.get(i));
    if (!violations.isEmpty()) {
        throw new SimpliXGeneralException(ErrorCode.VAL_VALIDATION_FAILED,
            "Row " + (i + 2) + " is not valid", violations.iterator().next().getMessage());
    }
}
```

Report the row number as the user sees it in the file: with a header row, the first data row is row 2.

## Related documents

- [Exporting data](./exporting-data.md)
- [Converting types](../../../simplix-core/docs/en/converting-types.md)
- [simplix-file](../../../simplix-file/README.md): accepting uploads
