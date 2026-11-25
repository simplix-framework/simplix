# Labelling columns and values

How to make an exported file read like the screen it came from: headers, enum values and boolean values in the language of the user. Excel and CSV follow the same rules.

## Translate the headers

```java
public class LoanRow {

    @ExcelColumn(name = "{entities.Loan.reader}", order = 1)
    private String reader;

    @ExcelColumn(name = "{entities.Loan.status}", order = 2)
    private LoanStatus status;

    @ExcelColumn(name = "Internal note", order = 3)
    private String note;
}
```

```properties
entities.Loan.reader=Reader
entities.Loan.status=Status
```

A `name` written as `{key}` is read as a message key and resolved in the locale of the request. A name without braces is written as it is. A key with no translation is written as the key itself, so a missing label never fails a download.

## Translate enum values

An enum value is written with the first of these that exists: the message `enums.<SimpleClassName>.<CONSTANT>`, the label of a `SimpliXLabeledEnum`, the constant name.

```properties
enums.LoanStatus.OPEN=On loan
enums.LoanStatus.RETURNED=Returned
enums.LoanStatus.OVERDUE=Overdue
```

## Write boolean values

```yaml
simplix:
  excel:
    format:
      booleanTrueValue: "{common.yes}"
      booleanFalseValue: "{common.no}"
```

A boolean field is written as text, `Y` and `N` by default, in Excel as well as in CSV, so the same list reads the same in both. A value in braces is a message key here too.

## Where the labels are looked up

Labels are resolved through the `MessageSource` of the application. With the [starter](en/starter/readme.md), the entity labels under `messages/entities` are found as well, through an `ExcelLabelResolver` it registers. Register a resolver of your own for labels kept elsewhere; resolvers are asked before the `MessageSource`, in bean order, and return `null` for a key they do not know.

```java
@Bean
public ExcelLabelResolver catalogLabels(CatalogLabelBundle bundle) {
    return (key, locale) -> key.startsWith("catalog.") ? bundle.find(key, locale) : null;
}
```

## Related documents

- [Messages and locales](en/starter/messages-and-locales.md)
- [Exporting data](en/excel/exporting-data.md)
