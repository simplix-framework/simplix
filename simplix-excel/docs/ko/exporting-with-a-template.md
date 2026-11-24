# 템플릿으로 내보내기

Excel에서 디자인한 통합 문서에 데이터를 채우는 방법을 설명합니다. 제목 영역, 병합된 셀, 수식, 로고가 있는 보고서에 사용합니다. 레이아웃은 템플릿 파일에 두고, 코드는 데이터만 전달합니다.

## 1단계. 템플릿 디자인

Excel에서 통합 문서를 만들고 셀에 JXLS 표현식을 지정합니다. 행 목록은 `items`로, 매개변수는 각자의 이름으로 사용할 수 있습니다.

| 셀 | 내용 |
|---|---|
| 제목 셀 | `${branch}`, `${printedOn}` |
| 시트 첫 번째 셀의 메모 | `jx:area(lastCell="E2")` |
| 반복 행 첫 번째 셀의 메모 | `jx:each(items="items" var="item" lastCell="E2")` |
| 반복 행의 셀 | `${item.reader}`, `${item.title}`, `${item.due}` |

파일은 `src/main/resources/templates` 아래에 저장하세요.

## 2단계. 데이터 채우기

```java
new JxlsExporterImpl<>(LoanRow.class)
    .template("/templates/loan-report.xlsx")
    .filename("loan-report.xlsx")
    .parameter("branch", "Central Library")
    .parameter("printedOn", LocalDate.now())
    .export(loans.all(), response);
```

템플릿 경로가 슬래시로 시작하면 클래스패스에서 읽고, 그렇지 않으면 파일 시스템에서 읽습니다.

| 메서드 | 의미 |
|---|---|
| `template(path)` | 템플릿 파일 |
| `parameter(name, value)`, `parameters(map)` | 행 밖의 표현식에 사용할 값 |
| `enableFormulas(boolean)` | 행을 채운 뒤 템플릿의 수식을 다시 계산 |
| `hideGridLines(boolean)` | 시트의 눈금선 숨기기 |
| `sheetName(name)` | 시트 이름 지정 |
| `streaming(boolean)`, `rowAccessWindowSize(n)` | 일정 범위의 행만 메모리에 유지하며 큰 결과 기록 |

## 시작용 템플릿 생성

```java
try (OutputStream out = Files.newOutputStream(Path.of("src/main/resources/templates/loan-report.xlsx"))) {
    ExcelTemplateGenerator.generateTemplate(out);
}
```

`ExcelTemplateGenerator`는 JXLS 마커가 포함된 `Data` 시트 하나로 구성된 통합 문서를 생성합니다. 첫 번째 셀에 `jx:area`가, 헤더 행을 오른쪽으로 기록하는 `headers` 대상 `jx:each`와 데이터를 기록하는 `rows` 대상 `jx:each`가 들어 있습니다. Excel에서 열어 마커를 기준으로 디자인하세요. 시트 이름, 컬럼 너비, 마커와 헤더 스타일 기록 여부는 `simplix.excel.template.*` 속성으로 지정합니다.

## 템플릿 로딩 방식

- 템플릿은 한 번 읽어 메모리에 보관합니다. `ExcelTemplateManager.removeFromCache(path)`와 `clearCache()`를 호출하면 다음 내보내기에서 파일을 다시 읽습니다. `simplix.excel.cache.template-cache-enabled: false`를 지정하면 캐시를 사용하지 않습니다.
- `ExcelTemplateManager.templateExists(path)`는 템플릿을 찾을 수 있는지 반환합니다.
- 존재하지 않는 경로로 내보내면 `IllegalArgumentException: Template not found: <path>`로 실패합니다.

## 관련 문서

- [데이터 내보내기](./exporting-data.md)
- [설정 레퍼런스](./configuration-reference.md)
