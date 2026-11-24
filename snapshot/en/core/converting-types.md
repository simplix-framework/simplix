# Converting types

Converters between text and boolean, enum and date-time values, used wherever SimpliX reads or writes text: JSON, Excel and CSV files, and request parameters.

## The converters

```java
BooleanConverter booleans = new StandardBooleanConverter();
booleans.fromString("yes");   // true
booleans.fromString("0");     // false

EnumConverter enums = new StandardEnumConverter();
enums.fromString("overdue", LoanStatus.class);   // LoanStatus.OVERDUE
enums.toMap(LoanStatus.OVERDUE);                 // {type=LoanStatus, value=OVERDUE, label=Overdue}

DateTimeConverter dates = DateTimeConverter.of(ZoneId.of("Asia/Seoul"));
dates.fromString("2026-03-01 09:30:00", LocalDateTime.class);         // 2026-03-01T09:30
dates.fromString("2026-03-01T09:30:00+09:00", OffsetDateTime.class);  // 2026-03-01T09:30+09:00
dates.toString(LocalDateTime.of(2026, 3, 1, 9, 30));                  // 2026-03-01T09:30:00.000+09:00
```

| Interface | Standard implementation | Converts |
|---|---|---|
| `BooleanConverter` | `StandardBooleanConverter` | text such as `true`, `yes`, `y`, `1` and their opposites |
| `EnumConverter` | `StandardEnumConverter` | a constant name in any letter case; `toMap` gives the type, the value and the label |
| `DateTimeConverter` | `StandardDateTimeConverter` | date and time text in common formats to `LocalDate`, `LocalDateTime`, `OffsetDateTime` and the other `Temporal` types |

Implement an interface to change a rule, for example to read `O` and `X` as boolean values.

```java
public class MarkBooleanConverter implements BooleanConverter {

    @Override
    public Boolean fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return switch (value.trim().toUpperCase()) {
            case "O" -> true;
            case "X" -> false;
            default -> throw new IllegalArgumentException("Use O or X: " + value);
        };
    }

    @Override
    public String toString(Boolean value) {
        return Boolean.TRUE.equals(value) ? "O" : "X";
    }
}
```

## What text is accepted

### Boolean values

`StandardBooleanConverter` reads `true`, `1`, `yes`, `y` and `on` as true and `false`, `0`, `no`, `n` and `off` as false, in any letter case. Any other text is refused with an `IllegalArgumentException` that lists the allowed values. `toString` writes `true` or `false`.

### Dates and times

`StandardDateTimeConverter` tries the patterns of the target type in turn.

| Target type | Accepted text |
|---|---|
| `LocalDate` | `2026-03-01`, `2026/03/01`, `2026.03.01`, `20260301` |
| `LocalTime` | `09:30:00.000`, `09:30:00`, `09:30`, `093000`, `0930` |
| `LocalDateTime` | `2026-03-01T09:30:00`, `2026-03-01 09:30:00`, `2026-03-01 09:30`, the same with `.` or `/` as the date separator, `20260301093000`, `202603010930`; a date without a time is refused |
| `OffsetDateTime` | `2026-03-01T09:30:00+09:00`, with or without milliseconds, and `2026-03-01 09:30:00 +09:00` |
| `ZonedDateTime` | `2026-03-01T09:30:00+09:00[Asia/Seoul]`, ISO-8601 with an offset, and `2026-03-01 09:30:00 KST` |
| `Instant` | `2026-03-01T00:30:00Z` and ISO-8601 with an offset |

A value without a zone is taken to be in the zone the converter was created with (`DateTimeConverter.of(zoneId)`). `toString` writes a date as `2026-03-01`, a time as `09:30:00`, and every date-time, whatever its type, in that zone as `2026-03-01T09:30:00.000+09:00`.

### Enums

`StandardEnumConverter.fromString("overdue", LoanStatus.class)` finds the constant whatever the letter case. `toString` writes the constant name, and `toMap` writes the type, the value and, for a `SimpliXLabeledEnum`, the label.

## Enums with a label

An enum that implements `SimpliXLabeledEnum` carries the text a screen shows for each constant.

```java
public enum LoanStatus implements SimpliXLabeledEnum {
    OPEN("On loan"),
    RETURNED("Returned"),
    OVERDUE("Overdue");

    private final String label;

    LoanStatus(String label) {
        this.label = label;
    }

    @Override
    public String getLabel() {
        return label;
    }
}
```

With the Jackson configuration of the [starter](en/starter/readme.md), such an enum is written to JSON as an object.

```json
{
  "status" : {
    "type" : "LoanStatus",
    "value" : "OVERDUE",
    "label" : "Overdue"
  }
}
```

`LabeledEnum` extends the interface for enums that are also read back from that object form: its deserializer accepts both the plain constant name and the `{"value": ..., "label": ...}` object.

## Jackson serializers

| Class | Does |
|---|---|
| `SimpliXBooleanSerializer`, `SimpliXBooleanDeserializer` | write and read boolean values through the `BooleanConverter` |
| `SimpliXEnumSerializer` | writes an enum through the `EnumConverter` |
| `SimpliXDateTimeSerializer`, `SimpliXDateTimeDeserializer` | write and read date-time values through the `DateTimeConverter` |

The starter registers them with the application's `ObjectMapper`.

## The time zone of a request

`TimezoneContext` holds the time zone of the current request. The starter sets it from the `X-Timezone` header, for example `X-Timezone: Asia/Seoul`; without the header it is UTC.

```java
ZoneId zone = TimezoneContext.getZoneId();
Instant todayStart = TimezoneContext.todayStart();
Instant seoul = TimezoneContext.todayStart(ZoneId.of("Asia/Seoul"));
```

`todayStart()` is the instant the day began in that zone, the boundary a "today" query needs. On a thread that serves no request, such as a scheduler, pass the zone explicitly.

## Related documents

- [Translating fields](en/core/translating-fields.md)
- [simplix-excel](en/excel/readme.md): uses the converters to read and write cells
