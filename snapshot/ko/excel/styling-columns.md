# 컬럼 스타일 지정

컬럼의 너비, 글꼴, 색, 숫자 · 날짜 형식을 지정하는 방법과 파일에 기록되는 결과를 설명합니다. 모든 설정은 필드의 `@ExcelColumn`에 선언합니다.

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

위 행 클래스를 `StandardExcelExporter`로 내보내면 다음과 같은 시트가 만들어집니다.

| 컬럼 | 셀 | 파일의 스타일 |
|---|---|---|
| Title | 문자열 `On dragons` | 너비 30자, 굵게, 가운데 정렬, 연한 노란색 채우기, 진한 빨간색 글자, 줄 바꿈 |
| Price | 숫자 `12000.5` | 숫자 형식 `#,##0.00`. `12,000.50`으로 표시됩니다 |
| Published | 날짜 셀 | 날짜 형식 `yyyy/MM/dd`. `2026/03/01`로 표시됩니다 |
| Internal note | 기록하지 않음 | `ignore = true`이면 필드를 제외합니다 |

헤더 행은 굵게 기록합니다. 숫자와 날짜는 시트에서도 숫자와 날짜로 유지되므로 사용자가 컬럼을 합산하고 정렬할 수 있으며, 형식은 표시 방식만 결정합니다. CSV에서는 같은 형식을 문자열에 적용합니다: `"12,000.50"`, `"2026/03/01"`.

## 속성

| 속성 | 타입 | 기본값 | 의미 |
|---|---|---|---|
| `name` | `String` | 빈 값 | 헤더. `{key}` 형식은 메시지 키로 해석합니다 |
| `order` | `int` | 마지막 | 컬럼 위치. 숫자가 작을수록 앞에 배치합니다 |
| `ignore` | `boolean` | `false` | 필드를 제외합니다 |
| `width` | `int` | `15` | 컬럼 너비(문자 수) |
| `format` | `String` | 없음 | `#,##0.00` 같은 숫자 패턴 또는 `yyyy/MM/dd` 같은 날짜 패턴 |
| `alignment` | Apache POI의 `HorizontalAlignment` | `LEFT` | 가로 정렬. `LEFT`, `CENTER`, `RIGHT` 등 열거형의 값을 사용합니다 |
| `bold`, `italic` | `boolean` | `false` | 글꼴의 굵기와 기울임 |
| `fontName`, `fontSize` | `String`, `short` | `Arial`, `10` | 글꼴과 크기(포인트) |
| `backgroundColor`, `fontColor` | Apache POI의 `IndexedColors` | `AUTOMATIC` | 채우기 색과 글자 색. 인덱스 팔레트의 값을 사용합니다 |
| `wrapText` | `boolean` | `true` | 긴 문자열을 셀 안에서 줄 바꿈합니다 |

스타일 속성은 Excel 파일에 적용됩니다. CSV 파일에는 `name`, `order`, `ignore`, `format`이 적용됩니다.

## 내용에 맞춘 컬럼 너비

```java
new StandardExcelExporter<>(BookRow.class)
    .autoSizeColumns(true)
    .export(rows, response);
```

`autoSizeColumns(true)`를 지정하면 행을 기록한 뒤 컬럼의 내용을 측정해 `width` 대신 측정한 너비를 적용합니다. 측정할 때 모든 셀을 읽으므로 대량 내보내기에서는 사용하지 마세요.

## 직접 정의한 타입의 필드

익스포터에 변환 규칙이 없는 값은 `toString()`의 결과로 기록합니다. 레코드 `Isbn("978-1")`은 `Isbn[value=978-1]`로 기록됩니다. 내보낼 문자열을 반환하도록 타입의 `toString()`을 작성하거나 행 클래스에 `String` 필드를 사용하세요. `ConverterRegistry.registerToStringConverter`는 애플리케이션 코드에서 호출하는 `ConverterRegistry.toString`의 결과에만 적용되며, 익스포터는 이 등록 정보를 읽지 않습니다.

## 관련 문서

- [데이터 내보내기](ko/excel/exporting-data.md)
- [컬럼과 값의 라벨 지정](ko/excel/labelling-columns-and-values.md)
- [설정 레퍼런스](ko/excel/configuration-reference.md)
