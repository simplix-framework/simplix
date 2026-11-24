**English** | [한국어](ko/excel/readme.md)

# simplix-excel

Excel and CSV files for a SimpliX application. Annotate a row class once and the same class is exported to `.xlsx`, exported to `.csv` and read back from an uploaded file, with headers, formats and labels in the reader's language.

![One annotated row class is used in three directions: exported as an Excel file, exported as a CSV file, and filled from an uploaded file.](../../assets/figures/excel-readme-row-class.en.svg)

## Install

The [starter](en/starter/readme.md) includes the module. Without the starter:

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-excel:${version}"
}
```

## Documents

| To | Read |
|---|---|
| download a first file | [Getting started](en/excel/getting-started.md) |
| export lists, large and small | [Exporting data](en/excel/exporting-data.md) |
| read an uploaded file | [Importing files](en/excel/importing-files.md) |
| translate headers and values | [Labelling columns and values](en/excel/labelling-columns-and-values.md) |
| fill a designed workbook | [Exporting with a template](en/excel/exporting-with-a-template.md) |
| look a property up | [Configuration reference](en/excel/configuration-reference.md) |
| set widths, fonts, colours and formats | [Styling columns](en/excel/styling-columns.md) |
| see which class does what | [How simplix-excel works](en/excel/how-it-works.md) |
| find the cause of a problem | [Troubleshooting](en/excel/troubleshooting.md) |

## Requirements

| Your project | SimpliX line | Version to declare |
|---|---|---|
| Spring Boot 4 | 2.x | a `2.x` release |
| Spring Boot 3 | 1.x | a `1.x` release |

## License

[SimpleCORE License 1.0 (SCL-1.0)](en/license.md)
