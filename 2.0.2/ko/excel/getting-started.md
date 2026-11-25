# simplix-excel 시작하기

이 문서는 파일의 행을 클래스로 정의하고, 파일을 내려받고 업로드하는 컨트롤러 엔드포인트를 작성하는 과정을 안내합니다.

## 1단계. 행 정의

```java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoanRow {

    @ExcelColumn(name = "Reader", order = 1, width = 24)
    private String reader;

    @ExcelColumn(name = "Title", order = 2, width = 40)
    private String title;

    @ExcelColumn(name = "Due", order = 3, format = "yyyy-MM-dd")
    private LocalDate due;

    @ExcelColumn(name = "Late fee", order = 4, format = "#,##0")
    private BigDecimal lateFee;

    @ExcelColumn(name = "Returned", order = 5)
    private Boolean returned;

    @ExcelColumn(ignore = true)
    private String internalNote;
}
```

`@ExcelColumn`을 지정한 필드가 컬럼이 됩니다. `name`은 헤더, `order`는 위치, `format`은 날짜와 숫자의 패턴입니다. `ignore`를 지정한 필드는 제외됩니다.

## 2단계. 엔드포인트 작성

```java
@RestController
@RequestMapping("/catalog/loan")
@RequiredArgsConstructor
public class LoanFileController {

    private final LoanQueries loans;

    @GetMapping("/export.xlsx")
    public void xlsx(HttpServletResponse response) throws IOException {
        new StandardExcelExporter<>(LoanRow.class)
            .filename("loans.xlsx")
            .sheetName("Loans")
            .export(loans.all(), response);
    }

    @GetMapping("/export.csv")
    public void csv(HttpServletResponse response) throws IOException {
        new UnifiedCsvExporter<>(LoanRow.class)
            .filename("loans.csv")
            .export(loans.all(), response);
    }

    @PostMapping("/import")
    public SimpliXApiResponse<Integer> upload(@RequestParam("file") MultipartFile file) throws IOException {
        List<LoanRow> rows = new StandardExcelImporter<>(LoanRow.class).importFromExcel(file);
        loans.saveAll(rows);
        return SimpliXApiResponse.success(rows.size());
    }
}
```

익스포터는 응답에 파일을 기록하고 콘텐츠 타입과 내려받을 파일 이름을 설정합니다. 임포터는 행마다 객체 하나를 반환합니다.

## 3단계. 파일 확인

대출이 두 건일 때 내려받은 CSV는 다음과 같습니다.

```csv
"Reader","Title","Due","Late fee","Returned"
"Ursula","On dragons, volume 1","2026-03-01","1,500",Y
"'=cmd()","Say ""hello""","2026-03-09",0,N
```

- 날짜와 숫자는 컬럼의 `format`을 따릅니다.
- 불리언 값은 `Y`와 `N`으로 기록합니다.
- 문자열 값은 따옴표로 감싸고, 값 안의 따옴표는 두 번 기록합니다.
- `=`로 시작하는 값 앞에는 아포스트로피를 추가하므로, 스프레드시트가 수식으로 실행하지 않습니다.

Excel 파일에는 `Loans` 시트에 같은 헤더 행과 값이 기록됩니다.

## 다음 단계

- [데이터 내보내기](ko/excel/exporting-data.md)
- [파일 가져오기](ko/excel/importing-files.md)
- [컬럼과 값의 라벨 지정](ko/excel/labelling-columns-and-values.md)
