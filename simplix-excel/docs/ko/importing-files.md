# 파일 가져오기

업로드한 Excel이나 CSV 파일을 객체로 읽는 방법과, 행을 저장하기 전에 확인할 내용을 설명합니다.

## 파일 읽기

```java
StandardExcelImporter<LoanRow> importer = new StandardExcelImporter<>(LoanRow.class);
importer.setSheetIndex(0);
importer.setSkipHeader(true);
importer.setDateFormat("yyyy-MM-dd");

List<LoanRow> fromExcel = importer.importFromExcel(file);
List<LoanRow> fromCsv = importer.importFromCsv(file);
```

임포터는 행 클래스의 `@ExcelColumn` 필드를 `order` 순서대로 컬럼에 대응시켜 읽고, 행마다 객체 하나를 반환합니다. 기본 설정에서는 첫 번째 시트를 읽고 첫 행을 헤더로 건너뜁니다.

| setter | 기본값 | 의미 |
|---|---|---|
| `setSheetIndex` | `0` | Excel 파일에서 읽을 시트 |
| `setSkipHeader` | `true` | 첫 행 건너뛰기 |
| `setDateFormat` | `yyyy-MM-dd` | 날짜 문자열의 패턴 |
| `setDateTimeFormat` | `yyyy-MM-dd HH:mm:ss` | 날짜 시각 문자열의 패턴 |
| `setApplicationZoneId` | 시스템 시간대 | 날짜 셀을 `OffsetDateTime`, `ZonedDateTime`, `Instant`로 읽을 때 적용하는 시간대 |
| `setColumnMapping` | `order` 기준 | 컬럼과 필드의 대응 |

## 컬럼 직접 매핑

파일의 구성이 행 클래스와 다르면, 0부터 시작하는 컬럼 번호와 필드를 직접 대응시키세요. 지정하지 않은 컬럼은 무시합니다.

```java
importer.setColumnMapping(Map.of(
    0, "reader",
    1, "title",
    3, "lateFee"
));
```

## 값 변환 방식

| 필드 타입 | Excel 셀 | CSV 문자열 |
|---|---|---|
| `String` | 셀의 문자열 | 문자열 그대로 |
| `Integer`, `Long`, `Double`, `Float`, `BigDecimal` | 셀의 숫자 | `2000`, `12.5` 같은 숫자. 천 단위 구분 기호는 읽지 못합니다 |
| `Boolean` | 불리언 셀 또는 문자열 | `Y`, `N`, `true`, `false`, `1`, `0` 같은 문자열 |
| `LocalDate`, `LocalDateTime`, `OffsetDateTime`, `ZonedDateTime`, `Instant` | 날짜 셀 또는 날짜 형식의 문자열 | 날짜 형식의 문자열 |

> ⚠ 이 모듈에서 `#,##0` 같은 숫자 형식으로 내보낸 파일에는 `1,500`으로 기록됩니다. 이 값을 CSV에서 다시 읽으면 숫자로 변환되지 않아 가져오기에 실패합니다. 다시 가져올 숫자는 구분 기호 없이 내보내세요.

빈 셀은 필드의 기본값을 유지합니다. 객체로 변환할 수 없는 행이 있으면 원인을 포함한 예외와 함께 가져오기가 중단됩니다.

## 저장 전 검증

임포터는 값을 변환하기만 하고 검증하지 않습니다. 행 클래스에 Bean Validation 제약을 지정하고, 저장하기 전에 모든 행을 검사하세요. 파일 전체를 받아들이거나 전체를 거부하도록 처리합니다.

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

행 번호는 사용자가 파일에서 보는 번호로 알려 주세요. 헤더 행이 있으면 첫 데이터 행은 2행입니다.

## 관련 문서

- [데이터 내보내기](./exporting-data.md)
- [타입 변환](../../../simplix-core/docs/ko/converting-types.md)
- [simplix-file](../../../simplix-file/README.ko.md): 업로드 처리
