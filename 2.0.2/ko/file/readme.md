[English](en/file/readme.md) | **한국어**

# simplix-file

업로드한 파일을 검증하고, 인터페이스 하나로 로컬 디스크나 S3 호환 버킷에 저장하는 모듈입니다. 이미지는 저장하는 과정에서 크기를 조정하고 WebP로 변환하며, 썸네일로도 제공합니다. 애플리케이션은 저장 경로를 보관하고, 필요할 때 모듈에 파일, 링크, 썸네일을 요청합니다.

![업로드한 파일을 검증하고, 이미지는 크기를 조정해 변환한 뒤 로컬 또는 S3에 저장합니다. 결과에는 저장 경로, 타입, 크기, 체크섬이 포함됩니다.](../../assets/figures/file-readme-upload-path.ko.svg)

## 설치

이 모듈은 [스타터](ko/starter/readme.md)에 포함되어 있습니다. 단독으로 사용하려면 의존성을 추가하세요.

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-file:${version}"
}
```

## 첫 업로드

```java
ProcessedFileResult result = fileProcessingService.processAndStore(FileProcessingRequest.of(file, "documents"));

result.getStoredPath();                                   // documents/2026/03/01/<uuid>.pdf
fileStorageService.getPublicUrl(result.getStoredPath());  // /files/documents/2026/03/01/<uuid>.pdf
```

설정하지 않으면 파일은 로컬 디스크의 `./uploads`에 저장됩니다. 이 호출을 사용하는 업로드 · 내려받기 엔드포인트는 [시작하기](ko/file/getting-started.md)에서 작성합니다.

## 문서

| 목적 | 문서 |
|---|---|
| 업로드 · 내려받기 엔드포인트 작성 | [시작하기](ko/file/getting-started.md) |
| 크기와 타입 제한, 업로드 결과 확인 | [파일 업로드](ko/file/uploading-files.md) |
| 이미지 크기 조정, WebP 변환, 썸네일 제공 | [이미지 처리](ko/file/processing-images.md) |
| 저장된 파일의 조회, 링크 생성, 정보 확인, 삭제 | [저장된 파일 다루기](ko/file/working-with-stored-files.md) |
| AWS S3나 MinIO에 저장, 직접 업로드와 서명된 링크 | [S3에 파일 저장](ko/file/storing-files-in-s3.md) |
| 클래스별 역할 확인 | [simplix-file 동작 방식](ko/file/how-it-works.md) |
| 속성 조회 | [설정 레퍼런스](ko/file/configuration-reference.md) |
| 문제의 원인 확인 | [문제 해결](ko/file/troubleshooting.md) |

## 요구 사항

| 프로젝트 | SimpliX 라인 | 선언할 버전 |
|---|---|---|
| Spring Boot 4 | 2.x | `2.x` 릴리스 |
| Spring Boot 3 | 1.x | `1.x` 릴리스 |

로컬 저장소, S3 저장소, WebP 변환은 모듈에 포함된 의존성만으로 동작하므로 추가 의존성이 필요하지 않습니다.

## 라이선스

[SimpleCORE License 1.0 (SCL-1.0)](ko/license.md)
