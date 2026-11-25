# simplix-excel 문제 해결

파일을 내보내거나 가져올 때 발생하는 증상과 원인, 조치를 정리합니다.

## 내보내기

| 증상 | 원인 | 조치 |
|---|---|---|
| CSV 파일의 한글이 Excel에서 깨짐 | Excel은 바이트 순서 표시가 없는 UTF-8 파일을 로컬 코드 페이지로 읽습니다 | `encoding(UnifiedCsvExporter.Encoding.UTF8_BOM)`으로 내보내세요 |
| 헤더에 `entities.Loan.reader` 같은 키가 표시됨 | 라벨을 조회하는 번들에 해당 키의 번역이 없습니다 | 키를 추가하거나 `ExcelLabelResolver`를 등록하세요. [컬럼과 값의 라벨 지정](ko/excel/labelling-columns-and-values.md)을 참고하세요 |
| 셀에 `Isbn[value=978-1]`이나 클래스 이름이 표시됨 | 익스포터에 변환 규칙이 없는 타입의 필드여서 `toString()` 결과를 기록합니다 | 내보내기용 `toString()`을 작성하거나 `String` 필드를 사용하세요 |
| CSV에서 `=`로 시작하는 값 앞에 아포스트로피가 추가됨 | `sanitizeFormulas`가 수식 인젝션으로부터 사용자를 보호합니다 | 사람이 여는 파일에서는 켠 상태로 유지하고, 다른 프로그램이 읽는 파일에서만 끄세요 |
| 대량 내보내기가 `OutOfMemoryError`로 실패함 | 파일을 기록하기 전에 모든 행을 불러옵니다 | `dataProvider`와 함께 `streaming(true)`를 사용하거나 `StreamingCollection`을 사용하고, `autoSizeColumns`는 끄세요 |
| 템플릿 내보내기가 `Template not found`로 실패함 | 클래스패스 템플릿 경로가 슬래시로 시작하지 않거나 파일이 패키징되지 않았습니다 | `/templates/loan-report.xlsx` 같은 경로를 사용하고 빌드된 jar를 확인하세요 |
| 변경한 템플릿이 반영되지 않음 | 템플릿을 캐시합니다 | `ExcelTemplateManager.removeFromCache(path)`를 호출하거나 재시작하세요 |
| `format.currency-format`, `format.decimal-format`, `format.percentage-format`을 변경해도 적용되지 않음 | 이 속성을 읽는 코드가 없습니다 | 컬럼의 `format`으로 패턴을 지정하세요 |

## 가져오기

| 증상 | 원인 | 조치 |
|---|---|---|
| `"1,500"` 같은 숫자에서 CSV 가져오기가 실패함 | 임포터는 천 단위 구분 기호를 읽지 못합니다 | 다시 가져올 숫자는 구분 기호 없이 내보내세요 |
| Excel에서 읽은 `BigDecimal`이 `1500.0`으로 표시됨 | 숫자 셀을 부동 소수점 숫자로 읽습니다 | 가져온 뒤 소수 자릿수를 지정하세요 |
| 값이 다른 필드에 채워짐 | 파일의 컬럼 순서가 행 클래스의 `order`와 다릅니다 | `setColumnMapping`으로 파일의 컬럼 번호를 지정하세요 |
| 첫 데이터 행이 누락됨 | 임포터가 첫 행을 헤더로 건너뜁니다 | 헤더가 없는 파일에는 `setSkipHeader(false)`를 호출하세요 |
| 날짜가 다른 날로 읽힘 | 문자열이 `dateFormat`과 맞지 않거나, 가져올 때의 시간대가 파일을 기록한 시간대와 다릅니다 | `setDateFormat`과 `setApplicationZoneId`를 지정하세요 |

## 관련 문서

- [simplix-excel 동작 방식](ko/excel/how-it-works.md)
- [파일 가져오기](ko/excel/importing-files.md)
