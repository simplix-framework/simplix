# 데이터 내보내기

행을 Excel이나 CSV 파일로 기록하는 방법을 설명합니다. 메모리에 있는 목록, 검색 조건에 맞는 전체 결과, 한 번에 불러오기 어려운 큰 테이블을 다룹니다.

## 익스포터

| 클래스 | 출력 형식 | 옵션 |
|---|---|---|
| `StandardExcelExporter` | `.xlsx` | `filename`, `sheetName`, `autoSizeColumns`, `streaming`, `pageSize`, `windowSize`, `dataProvider` |
| `UnifiedCsvExporter` | `.csv` | `filename`, `delimiter`, `encoding`, `includeHeader`, `quoteStrings`, `sanitizeFormulas`, `lineEnding`, `dateFormat`, `numberFormat`, `streaming`, `batchSize`, `dataProvider` |
| `JxlsExporterImpl` | 템플릿 기반 `.xlsx` | [템플릿으로 내보내기](ko/excel/exporting-with-a-template.md) 참고 |

행 클래스로 익스포터를 생성하고 옵션을 지정한 뒤, 내려받기 응답에는 `export(items, response)`를, 그 밖의 출력에는 `export(items, outputStream)`을 호출합니다.

## 목록에 표시되는 결과 내보내기

목록 화면은 한 페이지만 표시하지만, 내보낸 파일에는 같은 필터에 해당하는 모든 행이 있어야 합니다. `SearchExport`는 페이지 단위 검색을 반복 호출해 모든 페이지를 파일 하나에 기록합니다.

```java
@GetMapping("/export")
public void export(@RequestParam Map<String, String> params,
                   @RequestParam(defaultValue = "XLSX") ExportFormat format,
                   HttpServletResponse response) throws IOException {
    SearchExport.of(LoanRow.class, loans::search)
        .baseName("loans")
        .pageSize(500)
        .write(params, format, response);
}
```

요청의 `page`와 `size`는 내보내기 자체의 페이징 값으로 대체하고 `format`은 제외합니다. 정렬을 포함한 나머지 매개변수는 모든 페이지 조회에 전달됩니다. 파일 이름은 `baseName`과 형식으로 정해지며 `loans.csv` 또는 `loans.xlsx`입니다.

## 큰 테이블 내보내기

```java
new StandardExcelExporter<>(LoanRow.class)
    .filename("loans.xlsx")
    .streaming(true)
    .dataProvider(pageRequest -> loans.page(pageRequest))
    .export(null, response);
```

`streaming(true)`와 `dataProvider`를 지정하면 익스포터가 페이지를 하나씩 요청하고 일정 범위의 행만 메모리에 유지합니다. 프로바이더가 없으면 페이지 크기보다 긴 컬렉션을 같은 방식으로 페이지 단위로 기록합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.excel.export.page-size` | `1000` | 페이지당 요청하는 행 수 |
| `simplix.excel.export.window-size` | `100` | 스트리밍할 때 메모리에 유지하는 행 수 |
| `simplix.excel.export.streaming-enabled` | `false` | 기본으로 스트리밍 사용 |

### 직접 조회하는 컬렉션

`StreamingCollection`은 순회하는 동안 페이지 공급자에서 내용을 가져오는 컬렉션입니다. CSV 익스포터를 포함한 모든 익스포터에 전달할 수 있으며, 메모리에 다 올릴 수 없는 쿼리 결과를 내보낼 때 사용합니다.

```java
StreamingCollection<LoanRow> rows = new StreamingCollection<>(pageRequest -> loans.page(pageRequest), 1000);

new UnifiedCsvExporter<>(LoanRow.class)
    .filename("loans.csv")
    .export(rows, response);
```

공급자는 전체 건수를 확인할 때 한 번, 이후 페이지마다 한 번 호출됩니다. 페이지 크기가 10이고 행이 25건이면 네 번 호출됩니다. 쿼리의 정렬 순서를 고정하세요. 그렇지 않으면 페이지 사이에서 행이 중복되거나 누락될 수 있습니다.

## CSV 세부 사항

- `encoding`으로 문자 집합을 지정합니다: `UTF8`, `UTF8_BOM`, `ISO_8859_1`, `UTF16_LE`, `UTF16_BE`. Excel에서 여는 파일에는 `UTF8_BOM`을 선택하세요.
- 기본으로 켜져 있는 `sanitizeFormulas`는 `=`, `+`, `-`, `@`로 시작하는 값 앞에 아포스트로피를 추가합니다.
- `delimiter`와 `lineEnding`으로 파일을 읽는 프로그램에 맞게 조정합니다.

## 컬럼 스타일

너비, 글꼴, 색, 숫자 · 날짜 형식은 `@ExcelColumn`의 속성으로 지정합니다. [컬럼 스타일 지정](ko/excel/styling-columns.md)에 속성별 결과가 정리되어 있습니다.

## 관련 문서

- [컬럼과 값의 라벨 지정](ko/excel/labelling-columns-and-values.md)
- [템플릿으로 내보내기](ko/excel/exporting-with-a-template.md)
