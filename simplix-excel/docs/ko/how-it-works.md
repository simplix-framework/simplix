# simplix-excel 동작 방식

내보내기와 가져오기를 처리하는 클래스, 모듈이 등록하는 구성, 기본값의 출처를 설명합니다.

## 익스포터와 임포터

| 인터페이스 | 구현 | 대상 |
|---|---|---|
| `ExcelExporter<T>` | `StandardExcelExporter<T>` | 행 클래스의 `@ExcelColumn` 필드로 구성한 `.xlsx` 시트 |
| `CsvExporter<T>` | `UnifiedCsvExporter<T>` | 같은 필드로 구성한 `.csv` 파일. `UnifiedCsvExporter.Encoding`으로 인코딩을 지정합니다 |
| `JxlsExporter<T>` | `JxlsExporterImpl<T>` | 템플릿에 데이터를 채운 통합 문서 |
| 없음 | `StandardExcelImporter<T>` | 업로드한 Excel 또는 CSV 파일에서 읽은 객체 |

익스포터는 `AbstractExporter`를 상속합니다. 이 클래스는 행 클래스의 어노테이션 필드를 한 번 읽어 정렬하고 응답의 다운로드 헤더를 설정합니다. `AbstractExporter.BatchProcessor`는 행을 페이지 단위로 전달하는 콜백입니다. 익스포터는 해당 내보내기의 옵션을 보관하므로 내보낼 때마다 `new`로 생성합니다.

## 필드에서 셀까지

1. `ExcelConverter`가 행의 어노테이션 필드 값을 읽습니다.
2. 숫자와 날짜는 컬럼의 `format`이 적용된 숫자 셀로 기록합니다. `ExcelStyleManager`는 컬럼의 셀 스타일을 한 번 생성해 모든 행에 재사용하고, `DefaultCellStyle`은 스프레드시트 프로그램에 필요한 `Normal` 스타일을 통합 문서에 추가합니다.
3. CSV와 문자열 셀에서는 `ValueFormatter`가 값의 타입에 맞는 `Formatter`를 선택합니다. `NumberFormatter`, `java.util.Date`용 `DateFormatter`, `java.time` 타입용 `TemporalFormatter`, 그 밖의 타입용 `DefaultFormatter`가 있으며, 모두 `AbstractFormatter`를 기반으로 하고 `FormatterCache`에 캐시됩니다.
4. `ExcelLabels`가 `{key}` 형식의 헤더, 열거형 상수의 라벨, 불리언 값의 문구를 조회합니다.
5. 가져올 때는 `TypeConverter`가 셀의 문자열을 필드 타입으로 변환하며, 날짜에는 `DateConverter`와 `TemporalConverter`를 사용합니다.

`Converter<T>`는 날짜 변환기의 인터페이스입니다. `ConverterRegistry`와 `StringUtil`은 애플리케이션에서 직접 변환할 때 호출할 수 있는 도우미이며, 익스포터와 임포터는 레지스트리를 사용하지 않습니다.

## 모듈이 등록하는 구성

`SimplixExcelAutoConfiguration`이 `simplix.excel`을 `SimplixExcelProperties`에 바인딩하고 시작 시 적용합니다. 형식은 `ValueFormatter`에, 캐시 전환 값은 템플릿 캐시와 필드 캐시에, 템플릿 설정은 `ExcelTemplateGenerator.TemplateOptions` 빈에 적용합니다. 다음 빈도 등록합니다.

| 빈 | 역할 |
|---|---|
| `ExcelLabelsInitializer` | 컨텍스트가 준비되면 애플리케이션의 `MessageSource`와 `ExcelLabelResolver` 빈을 `ExcelLabels`에 전달합니다 |
| `JxlsExporter`, `CsvExporter` | 속성 값으로 미리 구성한 익스포터. 주입해서 사용하는 코드에 제공합니다 |

`DefaultTemplateInitializer.initializeDefaultTemplate()`은 정적 도우미입니다. 애플리케이션에서 호출하면 템플릿 디렉터리와 기본 템플릿이 없을 때 생성합니다. `ExcelTemplateManager`는 JXLS 익스포터가 사용할 템플릿을 불러와 캐시합니다.

## 실패 처리

파일을 기록하는 중에 발생한 오류는 `ExcelExportException` 또는 스트림의 `IOException`으로 호출자에게 전달됩니다. 이때 응답에는 이미 파일의 일부가 기록되었을 수 있습니다. 다운로드 헤더는 익스포터로 설정하고, 예외는 중단된 다운로드로 클라이언트에 전달되도록 하세요. 이 시점에는 오류 본문을 보낼 수 없습니다.

## 관련 문서

- [데이터 내보내기](./exporting-data.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
