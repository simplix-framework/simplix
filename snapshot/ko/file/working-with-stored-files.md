# 저장된 파일 다루기

`FileStorageService`로 저장 경로를 처리하는 방법을 설명합니다. 파일 읽기, 링크 생성, 정보 조회, 삭제를 다루며, 같은 호출이 로컬 디스크와 S3에서 모두 동작합니다.

## 저장 경로

```text
uploads
├── documents
│   └── 2026/03/01/3f1c9a52-....pdf
└── images
    └── 2026/03/01/8d2e7b10-....webp
```

파일은 디렉터리, 날짜, 확장자를 유지한 무작위 이름으로 저장됩니다: `documents/2026/03/01/<uuid>.pdf`. 이 경로가 파일의 식별자입니다. 애플리케이션의 테이블에 보관하세요. 다른 모든 호출은 이 경로를 인자로 받습니다. 사용자가 지정한 이름은 경로에 포함되지 않으므로 `report.pdf`를 여러 번 업로드해도 충돌하지 않고, 파일 이름이 파일 시스템에 전달되지 않습니다.

## 연산

| 호출 | 동작 | 로컬 저장소의 결과 |
|---|---|---|
| `store(inputStream, originalName, directory)`, `store(..., mimeType, directory)` | 업로드를 거치지 않은 스트림을 저장합니다 | `StoredFileInfo` |
| `retrieve(storedPath)` | 파일을 `Resource`로 반환합니다 | 파일. 존재하지 않는 경로는 `PATH_NOT_FOUND` 코드의 `StorageException`을 발생시킵니다 |
| `exists(storedPath)` | 파일의 존재 여부를 반환합니다 | `true` 또는 `false` |
| `describe(storedPath)`, `describe(storedPath, false)` | `StoredObjectInfo`를 반환합니다: `storedPath`, `size`, `contentType`, `lastModified`. 두 번째 인자가 false가 아니면 `checksum`도 포함합니다 | 크기 15, 타입 `application/pdf`, SHA-256 체크섬 |
| `getPublicUrl(storedPath)` | 파일의 URL | `/files/documents/2026/03/01/<uuid>.pdf` |
| `getDownloadUrl(storedPath, validFor, downloadFileName)` | 내려받기용 링크. 서명된 링크를 지원하는 저장소에서는 지정한 파일 이름으로 내려받습니다 | 공개 URL과 같은 값 |
| `getThumbnail(storedPath, width, height)`, `getThumbnailUrl(...)` | 이미지의 썸네일과 URL | [이미지 처리](ko/file/processing-images.md) 참고 |
| `delete(storedPath)` | 파일을 삭제합니다 | `true`. 이미 없는 파일이면 `false` |
| `supportsDirectUpload()`, `createDirectUpload(...)` | 브라우저가 저장소로 직접 업로드하게 합니다 | 지원하지 않습니다. [S3에 파일 저장](ko/file/storing-files-in-s3.md) 참고 |
| `isConfigured()` | 저장소에 필요한 설정이 있는지 반환합니다 | `true` |

## 원본 이름으로 내려받기

```java
@GetMapping("/attachments/{id}")
public ResponseEntity<Resource> download(@PathVariable String id) {
    Attachment attachment = attachments.findById(id).orElseThrow();
    Resource file = fileStorageService.retrieve(attachment.getStoredPath());

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(attachment.getMimeType()))
        .contentLength(attachment.getSize())
        .header(HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(attachment.getOriginalName(), StandardCharsets.UTF_8).build().toString())
        .body(file);
}
```

파일은 애플리케이션 레코드의 식별자로 조회하세요. 클라이언트가 보낸 경로는 사용하지 않습니다. 열람 권한은 이 레코드를 기준으로 판단합니다. 콘텐츠 타입을 지정하지 않으면 `Resource`가 JSON 변환기의 출력으로 기록됩니다.

## 레코드와 함께 삭제

```java
@Transactional
public void remove(String id) {
    Attachment attachment = attachments.findById(id).orElseThrow();
    attachments.delete(attachment);
    fileStorageService.delete(attachment.getStoredPath());
}
```

모듈은 어느 레코드가 파일을 참조하는지 알지 못하며, 파일을 자체적으로 삭제하지 않습니다. 레코드를 삭제할 때 파일도 삭제하세요. 삭제하지 않은 파일은 공간만 차지합니다.

## 저장소 밖을 가리키는 경로

기본 폴더 밖을 가리키는 저장 경로는 거부됩니다. `retrieve("../../etc/passwd")`는 `INVALID_PATH` 코드의 `StorageException`을 발생시킵니다.

| `StorageException`의 코드 | 의미 |
|---|---|
| `PATH_NOT_FOUND` | 해당 경로에 파일이 없음 |
| `INVALID_PATH` | 이 저장소의 저장 경로가 아님 |
| `WRITE_FAILED`, `READ_FAILED`, `DELETE_FAILED` | 저장소에서 해당 연산이 실패함 |
| `PERMISSION_DENIED`, `STORAGE_FULL` | 권한이나 공간이 부족해 저장소가 거부함 |
| `CHECKSUM_CALCULATION_FAILED` | 체크섬을 계산하지 못함 |
| `NOT_CONFIGURED` | S3 저장소에 필요한 설정이 없습니다. 메시지에 누락된 설정이 포함됩니다 |
| `UNSUPPORTED_OPERATION` | 저장소가 지원하지 않는 연산. 로컬 저장소의 직접 업로드가 여기에 해당합니다 |

## 관련 문서

- [파일 업로드](ko/file/uploading-files.md)
- [S3에 파일 저장](ko/file/storing-files-in-s3.md)
