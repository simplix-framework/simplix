# 컬럼과 값의 라벨 지정

내보낸 파일이 화면과 같은 문구로 표시되도록 하는 방법을 설명합니다. 헤더, 열거형 값, 불리언 값을 사용자의 언어로 기록하며, Excel과 CSV에 같은 규칙이 적용됩니다.

## 헤더 번역

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

`{key}` 형식으로 지정한 `name`은 메시지 키로 해석해 요청 로케일의 문구로 기록합니다. 중괄호가 없는 이름은 그대로 기록합니다. 번역이 없는 키는 키 자체를 기록하므로, 라벨이 없어도 내려받기가 실패하지 않습니다.

## 열거형 값 번역

열거형 값은 다음 중 먼저 존재하는 값으로 기록합니다: 메시지 `enums.<SimpleClassName>.<CONSTANT>`, `SimpliXLabeledEnum`의 라벨, 상수 이름.

```properties
enums.LoanStatus.OPEN=On loan
enums.LoanStatus.RETURNED=Returned
enums.LoanStatus.OVERDUE=Overdue
```

## 불리언 값 표기

```yaml
simplix:
  excel:
    format:
      booleanTrueValue: "{common.yes}"
      booleanFalseValue: "{common.no}"
```

불리언 필드는 Excel과 CSV 모두에서 문자열로 기록하며 기본값은 `Y`와 `N`입니다. 따라서 같은 목록이 양쪽 형식에서 같게 표시됩니다. 여기에서도 중괄호 형식의 값은 메시지 키로 해석합니다.

## 라벨 조회 위치

라벨은 애플리케이션의 `MessageSource`로 조회합니다. [스타터](ko/starter/readme.md)를 사용하면 스타터가 등록한 `ExcelLabelResolver`로 `messages/entities` 아래의 엔티티 라벨도 조회합니다. 다른 위치에 보관한 라벨에는 리졸버를 직접 등록하세요. 리졸버는 빈 순서대로 `MessageSource`보다 먼저 조회되며, 알 수 없는 키에는 `null`을 반환합니다.

```java
@Bean
public ExcelLabelResolver catalogLabels(CatalogLabelBundle bundle) {
    return (key, locale) -> key.startsWith("catalog.") ? bundle.find(key, locale) : null;
}
```

## 관련 문서

- [메시지와 로케일](ko/starter/messages-and-locales.md)
- [데이터 내보내기](ko/excel/exporting-data.md)
