# 파일 업로드

`FileProcessingService`가 업로드한 파일을 검증하고 저장하는 과정, 업로드별로 제한을 지정하는 방법, 결과에 포함된 정보를 설명합니다.

## 업로드 저장 방식

| 메서드 | 검증 | 저장 위치 |
|---|---|---|
| `processAndStore(request)` | 빈 파일, 크기, 허용 타입 | 요청에 지정한 디렉터리. 이미지는 `images`에 저장하고 이미지 처리를 적용합니다 |
| `processAndStoreImage(file, maxWidth, maxHeight)` | 내용이 이미지인지 여부 | `images`. 크기를 조정하고 변환합니다 |
| `processAndStoreGenericFile(file, directory)` | 없음 | 지정한 디렉터리. 파일을 그대로 저장합니다 |

사용자가 보낸 파일에는 `processAndStore`를 사용하세요. 나머지 메서드는 검증을 건너뜁니다. `processAndStoreGenericFile`에 빈 파일을 전달하면 0바이트 파일로 저장됩니다.

## 업로드별 제한 지정

```java
// Defaults of the configuration
FileProcessingRequest.of(file, "documents");

// An image, with the largest side it may keep
FileProcessingRequest.forImage(file, 1200, 1200);

// Limits of this upload
FileProcessingRequest request = FileProcessingRequest.builder(file)
    .directory("contracts")
    .maxFileSize(DataSize.ofMegabytes(20))
    .allowedMimeTypes(Set.of("application/pdf"))
    .build();

ProcessedFileResult result = fileProcessingService.processAndStore(request);
```

| `FileProcessingRequest`의 필드 | 기본값 | 의미 |
|---|---|---|
| `file` | 필수 | 업로드한 파일 |
| `directory` | 빌더 사용 시 `files` | 저장 경로의 첫 부분 |
| `maxFileSize` | `simplix.file.default-max-size`(10MB) | 허용하는 최대 크기 |
| `allowedMimeTypes` | `simplix.file.allowed-mime-types` | 허용하는 콘텐츠 타입 |
| `maxWidth`, `maxHeight` | `simplix.file.image.default-max-width`, `-height`(2048) | 이미지를 축소하는 기준 크기 |
| `enableWebpOptimization` | 설정을 따름 | `false`이면 이 이미지를 WebP로 변환하지 않습니다 |

## 검증 항목

1. 파일이 비어 있지 않은지 확인합니다. 비어 있으면 `EMPTY_FILE`입니다.
2. 크기가 한도 이내인지 확인합니다. 초과하면 `FILE_SIZE_EXCEEDED`이며 `File size 15 bytes exceeds maximum 5 bytes` 같은 메시지가 포함됩니다.
3. 콘텐츠 타입이 허용 목록에 있는지 확인합니다. `application/x-msdownload`처럼 목록에 없으면 `INVALID_FILE_TYPE`입니다.
4. 확장자를 콘텐츠 타입과 비교합니다. `photo.png`를 `application/pdf`로 보낸 것처럼 일치하지 않으면 로그에 경고를 기록하고 파일을 저장합니다.

콘텐츠 타입은 클라이언트가 보낸 값입니다. 이 검증은 파일 내용을 열어 보지 않으므로, 브라우저가 올바르게 표시한 타입은 걸러내지만 의도적으로 타입을 속인 파일은 걸러내지 못합니다. 기본 허용 타입은 JPEG, PNG, GIF, WebP, SVG 이미지와 PDF, Word, Excel, PowerPoint 형식, 일반 텍스트, CSV입니다.

## 결과 확인

```java
ProcessedFileResult result = fileProcessingService.processAndStore(FileProcessingRequest.of(file, "documents"));

attachment.setStoredPath(result.getStoredPath());     // documents/2026/03/01/<uuid>.pdf
attachment.setOriginalName(result.getOriginalName()); // Reading list.pdf
attachment.setMimeType(result.mimeType());            // application/pdf
attachment.setSize(result.getFileSize());             // 15
attachment.setChecksum(result.getChecksum());         // 64 hexadecimal characters
```

| `ProcessedFileResult`의 멤버 | 내용 |
|---|---|
| `storedInfo()` | `StoredFileInfo`: `originalName`, `storedName`, `storedPath`, `mimeType`, `fileSize`, `extension`, `checksum` |
| `getStoredPath()`, `getOriginalName()`, `getFileSize()`, `getExtension()`, `getChecksum()` | 같은 값을 반환하는 단축 메서드 |
| `category()` | `FileCategory`: `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`, `ARCHIVE`, `OTHER`. `isImage()`, `isVideo()`, `isAudio()`, `isDocument()`로 판정합니다 |
| `mimeType()`, `originalMimeType()` | 저장한 파일의 타입과 전송된 파일의 타입. 변환했으면 `wasMimeTypeChanged()`가 true입니다 |
| `width()`, `height()` | 저장한 이미지의 크기 |
| `wasOptimized()` | 이미지를 WebP로 변환했는지 여부 |

저장 경로, 원본 이름, 타입, 크기는 애플리케이션의 테이블에 보관하세요. 저장 이름은 무작위 식별자에 확장자를 추가한 값이므로, 사용자가 지정한 이름은 원본 이름에만 남습니다. 체크섬은 저장한 바이트의 SHA-256 값입니다.

## 오류

거부된 업로드는 `FileErrorCode`가 포함된 `FileUploadException`을 발생시킵니다. 스타터의 예외 핸들러는 이 예외를 처리하지 않으므로, [시작하기](ko/file/getting-started.md)의 예시처럼 어드바이스에서 직접 응답하세요.

| 코드 | 발생 조건 |
|---|---|
| `EMPTY_FILE` | 파일에 내용이 없음 |
| `FILE_SIZE_EXCEEDED` | 파일이 한도보다 큼 |
| `INVALID_FILE_TYPE` | 허용되지 않는 콘텐츠 타입 |
| `INVALID_IMAGE`, `IMAGE_PROCESSING_FAILED` | 이미지를 읽거나 처리하지 못함 |
| `STORAGE_WRITE_FAILED` | 저장소가 쓰기를 거부함 |
| `INVALID_EXTENSION`, `VIRUS_DETECTED`, `STORAGE_QUOTA_EXCEEDED`, `CHECKSUM_MISMATCH`, `MAX_FILES_EXCEEDED` | 모듈에서는 발생시키지 않습니다. 애플리케이션이 추가하는 검증에 사용합니다 |

## `FileProcessingService`의 기타 메서드

| 메서드 | 반환값 |
|---|---|
| `determineCategory(file)` | 저장하지 않고, 서비스가 업로드에 지정할 `FileCategory`를 반환합니다 |
| `shouldOptimizeToWebp(file)` | 이미지 설정에 따라 이 업로드를 WebP로 변환하는지 여부를 반환합니다 |
| `changeExtensionToWebp(filename)`, `extractExtension(filename)` | 확장자를 WebP로 바꾼 파일 이름과 파일 이름의 확장자를 반환합니다. 정적 메서드는 `StoredFileInfo.extractExtension(filename)`입니다 |

## 관련 문서

- [이미지 처리](ko/file/processing-images.md)
- [저장된 파일 다루기](ko/file/working-with-stored-files.md)
- [설정 레퍼런스](ko/file/configuration-reference.md)
