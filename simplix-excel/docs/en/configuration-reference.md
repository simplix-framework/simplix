# Configuration reference

Every property of the module, under `simplix.excel`. They are the defaults of the exporters; an option set on an exporter in code takes precedence.

## Export

| Property | Default | Meaning |
|---|---|---|
| `export.page-size` | `1000` | rows per page |
| `export.window-size` | `100` | rows kept in memory while streaming |
| `export.default-sheet-name` | `Data` | the name of the sheet |
| `export.streaming-enabled` | `false` | streams by default |
| `export.hide-grid-lines` | `false` | hides the grid lines |
| `export.enable-formulas` | `true` | recalculates formulas in template exports |

## CSV

| Property | Default | Meaning |
|---|---|---|
| `csv.delimiter` | `,` | the separator of values |
| `csv.encoding` | `UTF-8` | the character set |
| `csv.quote-strings` | `true` | quotes text values |
| `csv.include-headers` | `true` | writes the header row |
| `csv.line-separator` | the line separator of the system | the end of a line |

## Formats

| Property | Default | Meaning |
|---|---|---|
| `format.date-format` | `yyyy-MM-dd` | dates |
| `format.time-format` | `HH:mm:ss` | times |
| `format.date-time-format` | `yyyy-MM-dd HH:mm:ss` | date-times |
| `format.number-format` | `#,##0` | whole numbers |
| `format.decimal-format` | `#,##0.00` | no effect: no code reads it; set `format` on the column |
| `format.percentage-format` | `#,##0.00%` | no effect: no code reads it; set `format` on the column |
| `format.currency-format` | `¤#,##0.00` | no effect: no code reads it; set `format` on the column |
| `format.booleanTrueValue` | `Y` | the text of `true` |
| `format.booleanFalseValue` | `N` | the text of `false` |

## Templates and caches

| Property | Default | Meaning |
|---|---|---|
| `template.path` | `templates/default-template.xlsx` | the default template |
| `template.default-sheet-name` | `Data` | the sheet of a generated template |
| `template.default-column-width` | `15` | the column width of a generated template |
| `template.use-jxls-markers` | `true` | writes JXLS markers into a generated template |
| `template.apply-header-style` | `true` | styles the header row of a generated template |
| `cache.template-cache-enabled` | `true` | keeps loaded templates |
| `cache.field-cache-enabled` | `true` | keeps the fields read from row classes |
| `cache.column-cache-enabled` | `true` | keeps the column definitions |

## Related documents

- [Exporting data](./exporting-data.md)
- [Labelling columns and values](./labelling-columns-and-values.md)
