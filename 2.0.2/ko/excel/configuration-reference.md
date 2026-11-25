# 설정 레퍼런스

`simplix.excel` 아래에 있는 모듈의 모든 속성을 정리합니다. 이 값은 익스포터의 기본값이며, 코드에서 익스포터에 지정한 옵션이 우선합니다.

## 내보내기

| 속성 | 기본값 | 의미 |
|---|---|---|
| `export.page-size` | `1000` | 페이지당 행 수 |
| `export.window-size` | `100` | 스트리밍할 때 메모리에 유지하는 행 수 |
| `export.default-sheet-name` | `Data` | 시트 이름 |
| `export.streaming-enabled` | `false` | 기본으로 스트리밍 사용 |
| `export.hide-grid-lines` | `false` | 눈금선 숨기기 |
| `export.enable-formulas` | `true` | 템플릿 내보내기에서 수식 다시 계산 |

## CSV

| 속성 | 기본값 | 의미 |
|---|---|---|
| `csv.delimiter` | `,` | 값 구분 기호 |
| `csv.encoding` | `UTF-8` | 문자 집합 |
| `csv.quote-strings` | `true` | 문자열 값을 따옴표로 감쌈 |
| `csv.include-headers` | `true` | 헤더 행 기록 |
| `csv.line-separator` | 시스템의 줄 구분자 | 줄 끝 문자 |

## 형식

| 속성 | 기본값 | 의미 |
|---|---|---|
| `format.date-format` | `yyyy-MM-dd` | 날짜 |
| `format.time-format` | `HH:mm:ss` | 시각 |
| `format.date-time-format` | `yyyy-MM-dd HH:mm:ss` | 날짜 시각 |
| `format.number-format` | `#,##0` | 정수 |
| `format.decimal-format` | `#,##0.00` | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 컬럼의 `format`을 사용하세요 |
| `format.percentage-format` | `#,##0.00%` | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 컬럼의 `format`을 사용하세요 |
| `format.currency-format` | `¤#,##0.00` | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 컬럼의 `format`을 사용하세요 |
| `format.booleanTrueValue` | `Y` | `true`의 표기 |
| `format.booleanFalseValue` | `N` | `false`의 표기 |

## 템플릿과 캐시

| 속성 | 기본값 | 의미 |
|---|---|---|
| `template.path` | `templates/default-template.xlsx` | 기본 템플릿 |
| `template.default-sheet-name` | `Data` | 생성하는 템플릿의 시트 |
| `template.default-column-width` | `15` | 생성하는 템플릿의 컬럼 너비 |
| `template.use-jxls-markers` | `true` | 생성하는 템플릿에 JXLS 마커 기록 |
| `template.apply-header-style` | `true` | 생성하는 템플릿의 헤더 행에 스타일 적용 |
| `cache.template-cache-enabled` | `true` | 불러온 템플릿 유지 |
| `cache.field-cache-enabled` | `true` | 행 클래스에서 읽은 필드 유지 |
| `cache.column-cache-enabled` | `true` | 컬럼 정의 유지 |

## 관련 문서

- [데이터 내보내기](ko/excel/exporting-data.md)
- [컬럼과 값의 라벨 지정](ko/excel/labelling-columns-and-values.md)
