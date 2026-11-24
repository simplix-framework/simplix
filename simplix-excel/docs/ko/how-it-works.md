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

POI로 시트를 직접 작성하는 코드에서는 `ExcelConverter`와 `ExcelStyleManager`도 호출할 수 있습니다. 아래 결과는 `Title` 컬럼과 `format`이 `#,##0.00`인 `Price` 컬럼으로 구성된 행 클래스에서 얻은 값입니다.

| 호출 | 결과 |
|---|---|
| `ExcelConverter.extractColumnTitles(BookRow.class)` | `@ExcelColumn` 필드의 `name`을 `order` 순서로 정렬한 목록: `[Title, Price]` |
| `ExcelConverter.convertToRowData(rows, BookRow.class)` | 행별 텍스트 목록. 컬럼 값은 `toString()` 결과이고 `null`은 빈 텍스트입니다: `[[Dune, 12.5], [Emma, ]]`. 컬럼의 `format`은 적용하지 않습니다 |
| `ExcelConverter.prepareDataModel(rows, BookRow.class)` | 제목 목록과 행 목록을 `headers`와 `rows` 키에 넣은 맵. 직접 작성한 템플릿에 전달할 때 사용합니다 |
| `ExcelConverter.clearCaches()` | 지금까지 읽은 필드와 제목의 캐시를 비웁니다 |
| `new ExcelStyleManager(workbook).createHeaderStyle()` | 익스포터의 헤더 스타일: 가운데 정렬, 굵은 글꼴, 가는 테두리, 회색 배경 |
| `createDataStyle(value, column)` | `@ExcelColumn`의 속성으로 만든 데이터 셀 스타일. 값이 숫자나 날짜이면 `format`을 지정하므로 `Price` 컬럼의 `12.5`에는 `#,##0.00`이, 텍스트에는 `General`이 지정됩니다 |
| `clearCache()` | 지금까지 만든 스타일의 캐시를 비웁니다. 캐시를 비우기 전에는 같은 속성에 같은 스타일 객체를 반환합니다 |

## 모듈이 등록하는 구성

`SimplixExcelAutoConfiguration`이 `simplix.excel`을 `SimplixExcelProperties`에 바인딩하고 시작 시 적용합니다. 형식은 `ValueFormatter`에, 캐시 전환 값은 템플릿 캐시와 필드 캐시에, 템플릿 설정은 `ExcelTemplateGenerator.TemplateOptions` 빈에 적용합니다. 다음 빈도 등록합니다.

| 빈 | 역할 |
|---|---|
| `ExcelLabelsInitializer` | 컨텍스트가 준비되면 애플리케이션의 `MessageSource`와 `ExcelLabelResolver` 빈을 `ExcelLabels`에 전달합니다 |
| `JxlsExporter`, `CsvExporter` | 속성 값으로 미리 구성한 익스포터. 주입해서 사용하는 코드에 제공합니다 |

`DefaultTemplateInitializer.initializeDefaultTemplate()`은 정적 도우미입니다. 애플리케이션에서 호출하면 템플릿 디렉터리와 기본 템플릿이 없을 때 생성합니다. `ExcelTemplateManager`는 JXLS 익스포터가 사용할 템플릿을 불러와 캐시합니다.

## 실패 처리

파일을 기록하는 중에 발생한 오류는 `ExcelExportException` 또는 스트림의 `IOException`으로 호출자에게 전달됩니다. 이때 응답에는 이미 파일의 일부가 기록되었을 수 있습니다. 다운로드 헤더는 익스포터로 설정하고, 예외는 중단된 다운로드로 클라이언트에 전달되도록 하세요. 이 시점에는 오류 본문을 보낼 수 없습니다.

## 그 밖의 공개 메서드

가이드에서는 작업에 필요한 메서드를 설명합니다. 가이드에 나온 타입은 아래 공개 메서드도 제공합니다.

| 타입 | 메서드 | 동작 |
|---|---|---|
| `StringUtil` | `hasText(str)`, `isBlank(str)`, `defaultIfEmpty(str, defaultValue)` | 문자열에 내용이 있는지 검사하고, 빈 문자열을 기본값으로 대체합니다 |
| `ExcelLabels` | `columnName(name)`, `enumLabel(value)`, `booleanLabel(value)` | 익스포터가 출력하는 컬럼 제목, 열거형 상수의 라벨, 불리언 값의 텍스트를 반환합니다 |
| `ExcelLabels` | `configure(source, labelResolvers, format)`, `reset()` | 라벨에 사용할 `MessageSource`와 리졸버를 지정하고, 초기 상태로 되돌립니다. `configure`는 모듈이 시작할 때 호출하며 `reset`은 테스트에 사용합니다 |
| `ExcelLabelResolver` | `resolve(key, locale)` | 직접 작성하는 리졸버에서 구현하는 메서드입니다. 로케일에 맞는 키의 텍스트를 반환합니다 |
| `ValueFormatter` | `formatValue(value, column)`, `parseValue(value, targetType, pattern)`, `registerFormatter(type, formatter)` | 값을 타입과 `@ExcelColumn`에 따라 포맷하고, 문자열을 지정한 타입으로 파싱하고, 타입의 `Formatter`를 등록합니다 |
| `Formatter` | `parse(value, pattern)`, `getDefaultPattern()` | 패턴으로 문자열을 파싱하고, 포매터의 기본 패턴을 반환합니다 |
| `TypeConverter` | `formatNumber`, `formatDate`, `formatLocalDate`, `formatLocalDateTime`, `formatLocalTime`, `formatZonedDateTime`, `formatOffsetDateTime`, `formatInstant`, `formatEnum`, `formatMap`, `formatCollection`, `formatArray` | 해당 타입의 값을 문자열로 변환합니다 |
| `TypeConverter` | `fromString`, `parseDate`, `parseLocalDate`, `parseLocalDateTime`, `parseLocalTime`, `parseZonedDateTime`, `parseOffsetDateTime`, `parseInstant`, `parseEnum`, `parseTemporal` | 문자열을 해당 타입의 값으로 변환합니다 |
| `TypeConverter`, `TemporalConverter` | `setDefaultZone(zone)` | 시간대 정보가 없는 값에 사용할 시간대를 지정합니다 |
| `TemporalConverter` | `isTemporal`, `formatTemporal`, `formatLocalDate`, `formatLocalTime`, `formatLocalDateTime`, `formatZonedDateTime`, `formatOffsetDateTime`, `formatInstant` | 타입이 `java.time` 타입인지 반환하고, 해당 타입의 값을 문자열로 변환합니다 |
| `TemporalConverter` | `parseTemporalFromString`, `parseLocalDate`, `parseLocalTime`, `parseLocalDateTime`, `parseZonedDateTime`, `parseOffsetDateTime`, `parseInstant` | 문자열을 `java.time` 타입의 값으로 변환합니다 |
| `DateConverter` | `formatDate(date, pattern)`, `formatCalendar(calendar, pattern)`, `parseDate(value)`, `parseCalendar(value)` | `java.util.Date` 값과 `Calendar` 값을 포맷하고 파싱합니다 |
| `Converter` | `fromString(value, targetType)` | 날짜 변환기에서 문자열을 대상 타입으로 변환하는 메서드입니다 |
| `ConverterRegistry` | `registerFromStringConverter(targetType, converter)`, `fromString(str, targetType, defaultValue)`, `clear()` | 문자열 변환 함수를 등록하고, 실패 시 사용할 기본값과 함께 문자열을 변환하고, 등록한 변환 함수를 모두 제거합니다 |
| `ExcelTemplateGenerator` | `generateDefaultTemplate()`, `generateTemplateResource()` | JXLS 익스포터의 기본 템플릿을 만듭니다. 임시 `.xlsx` 파일로 만들어 경로를 반환하거나 `Resource`로 반환합니다 |
| `UnifiedCsvExporter.Encoding` | `getName()`, `getCharset()`, `isIncludeBom()` | 인코딩 이름, `Charset`, 바이트 순서 표시(BOM) 기록 여부를 반환합니다 |
| `StandardExcelImporter` | `setApplicationZoneId(zone)`, `getApplicationZoneId()` | 임포터가 날짜·시간 값에 사용하는 시간대를 지정하고 조회합니다. 기본값은 시스템 시간대입니다 |
| `JxlsExporterImpl` | `getTemplatePath()`, `getFilename()`, `getSheetName()`, `getRowAccessWindowSize()`, `isEnableFormulaProcessor()`, `isStreamingEnabled()`, `isHideGridLines()` | 익스포터에 지정한 옵션을 조회합니다 |

## 관련 문서

- [데이터 내보내기](./exporting-data.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
