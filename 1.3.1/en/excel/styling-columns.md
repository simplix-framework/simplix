# Styling columns

How to set the width, the font, the colours and the number or date format of a column, and what ends up in the file. Everything is declared on the field with `@ExcelColumn`.

```java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookRow {

    @ExcelColumn(name = "Title", order = 1, width = 30, bold = true,
        backgroundColor = IndexedColors.LIGHT_YELLOW, fontColor = IndexedColors.DARK_RED,
        alignment = HorizontalAlignment.CENTER)
    private String title;

    @ExcelColumn(name = "Price", order = 2, format = "#,##0.00")
    private BigDecimal price;

    @ExcelColumn(name = "Published", order = 3, format = "yyyy/MM/dd")
    private LocalDate published;

    @ExcelColumn(name = "Internal note", order = 4, ignore = true)
    private String note;
}
```

Exported with `StandardExcelExporter`, the row above gives this sheet.

| Column | Cell | Style in the file |
|---|---|---|
| Title | text `On dragons` | 30 characters wide, bold, centred, light yellow fill, dark red text, wrapped |
| Price | number `12000.5` | number format `#,##0.00`, shown as `12,000.50` |
| Published | a date cell | date format `yyyy/MM/dd`, shown as `2026/03/01` |
| Internal note | not written | `ignore = true` leaves the field out |

The header row is written bold. A number or a date stays a number or a date in the sheet, so the reader can sum and sort the column; the format only decides how it is shown. In CSV the same formats are applied to the text: `"12,000.50"` and `"2026/03/01"`.

## Attributes

| Attribute | Type | Default | Meaning |
|---|---|---|---|
| `name` | `String` | empty | the header; `{key}` is read as a message key |
| `order` | `int` | last | the position of the column; lower numbers come first |
| `ignore` | `boolean` | `false` | leaves the field out |
| `width` | `int` | `15` | the width of the column in characters |
| `format` | `String` | none | a number pattern such as `#,##0.00`, or a date pattern such as `yyyy/MM/dd` |
| `alignment` | `HorizontalAlignment` of Apache POI | `LEFT` | the horizontal alignment: `LEFT`, `CENTER`, `RIGHT` and the others of the enum |
| `bold`, `italic` | `boolean` | `false` | the weight and the slant of the font |
| `fontName`, `fontSize` | `String`, `short` | `Arial`, `10` | the font and its size in points |
| `backgroundColor`, `fontColor` | `IndexedColors` of Apache POI | `AUTOMATIC` | the fill and the text colour, from the indexed palette |
| `wrapText` | `boolean` | `true` | wraps long text inside the cell |

The style attributes apply to Excel files. A CSV file takes `name`, `order`, `ignore` and `format`.

## Fit the columns to their content

```java
new StandardExcelExporter<>(BookRow.class)
    .autoSizeColumns(true)
    .export(rows, response);
```

`autoSizeColumns(true)` measures the content of each column after the rows are written and sets the width from it, in place of `width`. Measuring reads every cell, so leave it off for large exports.

## A field of a type of your own

A value the exporters have no rule for is written with its `toString()`: a record `Isbn("978-1")` ends up as `Isbn[value=978-1]`. Give the type a `toString()` that returns the text to export, or put a `String` field on the row class. `ConverterRegistry.registerToStringConverter` changes what `ConverterRegistry.toString` returns to your own code; the exporters do not read it.

## Related documents

- [Exporting data](en/excel/exporting-data.md)
- [Labelling columns and values](en/excel/labelling-columns-and-values.md)
- [Configuration reference](en/excel/configuration-reference.md)
