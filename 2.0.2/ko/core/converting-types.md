# 타입 변환

문자열과 불리언 · 열거형 · 날짜 시각 값 사이의 변환기를 설명합니다. SimpliX가 문자열을 읽거나 쓰는 JSON, Excel과 CSV 파일, 요청 매개변수에서 사용합니다.

## 변환기

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

| 인터페이스 | 표준 구현 | 변환 대상 |
|---|---|---|
| `BooleanConverter` | `StandardBooleanConverter` | `true`, `yes`, `y`, `1` 같은 문자열과 그 반대 값 |
| `EnumConverter` | `StandardEnumConverter` | 대소문자와 관계없는 상수 이름. `toMap`은 타입, 값, 라벨을 반환합니다 |
| `DateTimeConverter` | `StandardDateTimeConverter` | 일반적인 형식의 날짜 시각 문자열과 `LocalDate`, `LocalDateTime`, `OffsetDateTime` 등 `Temporal` 타입 |

규칙을 바꾸려면 인터페이스를 구현하세요. 예를 들어 `O`와 `X`를 불리언 값으로 읽도록 바꿀 수 있습니다.

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

## 허용하는 문자열

### 불리언 값

`StandardBooleanConverter`는 대소문자와 관계없이 `true`, `1`, `yes`, `y`, `on`을 참으로, `false`, `0`, `no`, `n`, `off`를 거짓으로 읽습니다. 그 밖의 문자열은 허용 값 목록이 포함된 `IllegalArgumentException`으로 거부합니다. `toString`은 `true` 또는 `false`를 기록합니다.

### 날짜와 시각

`StandardDateTimeConverter`는 대상 타입의 패턴을 순서대로 시도합니다.

| 대상 타입 | 허용하는 문자열 |
|---|---|
| `LocalDate` | `2026-03-01`, `2026/03/01`, `2026.03.01`, `20260301` |
| `LocalTime` | `09:30:00.000`, `09:30:00`, `09:30`, `093000`, `0930` |
| `LocalDateTime` | `2026-03-01T09:30:00`, `2026-03-01 09:30:00`, `2026-03-01 09:30`, 날짜 구분 기호가 `.`이나 `/`인 같은 형식, `20260301093000`, `202603010930`. 시각이 없는 날짜는 거부합니다 |
| `OffsetDateTime` | `2026-03-01T09:30:00+09:00`(밀리초 포함 여부 무관), `2026-03-01 09:30:00 +09:00` |
| `ZonedDateTime` | `2026-03-01T09:30:00+09:00[Asia/Seoul]`, 오프셋이 있는 ISO-8601, `2026-03-01 09:30:00 KST` |
| `Instant` | `2026-03-01T00:30:00Z`와 오프셋이 있는 ISO-8601 |

시간대가 없는 값은 변환기를 생성할 때 지정한 시간대(`DateTimeConverter.of(zoneId)`)의 값으로 처리합니다. `toString`은 날짜를 `2026-03-01`, 시각을 `09:30:00`으로 기록하고, 날짜 시각은 타입과 관계없이 해당 시간대의 `2026-03-01T09:30:00.000+09:00` 형식으로 기록합니다.

### 열거형

`StandardEnumConverter.fromString("overdue", LoanStatus.class)`는 대소문자와 관계없이 상수를 찾습니다. `toString`은 상수 이름을 기록하고, `toMap`은 타입과 값, `SimpliXLabeledEnum`이면 라벨도 기록합니다.

## 라벨이 있는 열거형

`SimpliXLabeledEnum`을 구현한 열거형은 상수마다 화면에 표시할 문구를 제공합니다.

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

[스타터](ko/starter/readme.md)의 Jackson 구성을 사용하면 이런 열거형은 JSON에 객체로 기록됩니다.

```json
{
  "status" : {
    "type" : "LoanStatus",
    "value" : "OVERDUE",
    "label" : "Overdue"
  }
}
```

`LabeledEnum`은 이 객체 형태에서 다시 읽어야 하는 열거형을 위한 확장 인터페이스입니다. 전용 역직렬화기가 상수 이름 문자열과 `{"value": ..., "label": ...}` 객체를 모두 읽습니다.

## Jackson 직렬화기

| 클래스 | 동작 |
|---|---|
| `SimpliXBooleanSerializer`, `SimpliXBooleanDeserializer` | `BooleanConverter`로 불리언 값을 쓰고 읽습니다 |
| `SimpliXEnumSerializer` | `EnumConverter`로 열거형을 씁니다 |
| `SimpliXDateTimeSerializer`, `SimpliXDateTimeDeserializer` | `DateTimeConverter`로 날짜 시각 값을 쓰고 읽습니다 |

스타터가 이 직렬화기를 애플리케이션의 `ObjectMapper`에 등록합니다.

## 요청의 시간대

`TimezoneContext`는 현재 요청의 시간대를 보관합니다. 스타터가 `X-Timezone` 헤더(예: `X-Timezone: Asia/Seoul`)로 값을 설정하며, 헤더가 없으면 UTC입니다.

```java
ZoneId zone = TimezoneContext.getZoneId();
Instant todayStart = TimezoneContext.todayStart();
Instant seoul = TimezoneContext.todayStart(ZoneId.of("Asia/Seoul"));
```

`todayStart()`는 해당 시간대에서 오늘이 시작된 시각이며, 「오늘」 조건의 쿼리에 필요한 경계 값입니다. 스케줄러처럼 요청을 처리하지 않는 스레드에서는 시간대를 직접 전달하세요.

## 관련 문서

- [필드 번역](ko/core/translating-fields.md)
- [simplix-excel](ko/excel/readme.md): 셀을 읽고 쓸 때 이 변환기를 사용합니다
