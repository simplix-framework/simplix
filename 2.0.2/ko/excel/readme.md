[English](en/excel/readme.md) | **한국어**

# simplix-excel

SimpliX 애플리케이션의 Excel과 CSV 파일 처리 모듈입니다. 행 클래스에 어노테이션을 한 번 지정하면 같은 클래스로 `.xlsx`와 `.csv`를 내보내고, 업로드한 파일을 읽을 수 있습니다. 헤더, 형식, 라벨은 독자의 언어로 기록됩니다.

![어노테이션을 지정한 행 클래스 하나를 Excel 내보내기, CSV 내보내기, 업로드 파일 가져오기에 함께 사용합니다.](../../assets/figures/excel-readme-row-class.ko.svg)

## 설치

[스타터](ko/starter/readme.md)에 이 모듈이 포함되어 있습니다. 스타터 없이 사용할 때는 다음과 같이 추가합니다.

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-excel:${version}"
}
```

## 문서

| 하려는 일 | 문서 |
|---|---|
| 첫 파일 내려받기 | [시작하기](ko/excel/getting-started.md) |
| 크고 작은 목록 내보내기 | [데이터 내보내기](ko/excel/exporting-data.md) |
| 업로드한 파일 읽기 | [파일 가져오기](ko/excel/importing-files.md) |
| 헤더와 값 번역 | [컬럼과 값의 라벨 지정](ko/excel/labelling-columns-and-values.md) |
| 서식이 있는 통합 문서 채우기 | [템플릿으로 내보내기](ko/excel/exporting-with-a-template.md) |
| 속성 조회 | [설정 레퍼런스](ko/excel/configuration-reference.md) |
| 너비, 글꼴, 색, 형식 지정 | [컬럼 스타일 지정](ko/excel/styling-columns.md) |
| 클래스별 역할 확인 | [simplix-excel 동작 방식](ko/excel/how-it-works.md) |
| 문제의 원인 확인 | [문제 해결](ko/excel/troubleshooting.md) |

## 요구 사항

| 프로젝트 | SimpliX 라인 | 선언할 버전 |
|---|---|---|
| Spring Boot 4 | 2.x | `2.x` 릴리스 |
| Spring Boot 3 | 1.x | `1.x` 릴리스 |

## 라이선스

[SimpleCORE License 1.0 (SCL-1.0)](ko/license.md)
