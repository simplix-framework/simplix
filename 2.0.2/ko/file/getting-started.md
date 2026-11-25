# simplix-file 시작하기

이 페이지에서는 업로드를 받는 엔드포인트, 파일을 반환하는 엔드포인트, 썸네일을 반환하는 엔드포인트를 작성하고, 업로드 오류를 상태 400으로 응답하도록 처리합니다.

## 1단계. 저장소 설정

```yaml
simplix:
  file:
    storage:
      provider: local
      local:
        base-path: ./uploads
        public-url-prefix: /api/files

spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
```

- `base-path`는 파일을 기록하는 폴더입니다.
- `public-url-prefix`는 저장 경로 앞에 추가해 URL을 구성하는 값입니다. 모듈은 URL만 구성하고 파일을 제공하지 않으며, 제공은 3단계에서 처리합니다. 토큰이 필요한 파일이라면 토큰을 확인하는 `/api` 아래의 경로를 사용하세요.
- Spring은 `spring.servlet.multipart.max-file-size`(기본 1MB)보다 큰 파일을 모듈에 전달하기 전에 거부합니다. 허용할 최대 파일 크기에 맞춰 이 값을 늘리세요.

## 2단계. 컨트롤러 작성

```java
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class LibraryFileController {

    private final FileProcessingService fileProcessingService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SimpliXApiResponse<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) {
        ProcessedFileResult result = fileProcessingService.processAndStore(FileProcessingRequest.of(file, "documents"));
        return SimpliXApiResponse.success(Map.of(
            "path", result.getStoredPath(),
            "url", fileStorageService.getPublicUrl(result.getStoredPath()),
            "mimeType", result.mimeType(),
            "size", result.getFileSize()
        ));
    }

    @GetMapping("/thumbnails/{width}x{height}/{*path}")
    public ResponseEntity<Resource> thumbnail(@PathVariable int width, @PathVariable int height, @PathVariable String path) {
        Resource thumbnail = fileStorageService.getThumbnail(path.substring(1), width, height);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(thumbnail);
    }

    @GetMapping("/{*path}")
    public ResponseEntity<Resource> download(@PathVariable String path) {
        String storedPath = path.substring(1);
        StoredObjectInfo info = fileStorageService.describe(storedPath, false);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(info.contentType()))
            .contentLength(info.size())
            .body(fileStorageService.retrieve(storedPath));
    }
}
```

[CRUD API 만들기](ko/building-a-crud-api.md)의 애플리케이션은 컨트롤러를 `/api` 아래에서 제공하므로 이 엔드포인트의 경로는 `/api/files`입니다. `processAndStore`는 파일을 검증하고 저장합니다. 이미지는 요청에 지정한 디렉터리와 관계없이 `images` 아래에 저장됩니다.

## 3단계. 실행 확인

```bash
curl -H "Authorization: Bearer <access token>" -F "file=@cover.png;type=image/png" http://localhost:8080/api/files
```

```json
{
  "type" : "SUCCESS",
  "body" : {
    "url" : "/api/files/images/2026/11/25/<uuid>.webp",
    "mimeType" : "image/webp",
    "path" : "images/2026/11/25/<uuid>.webp",
    "size" : 14828
  },
  "timestamp" : "<time with zone>"
}
```

3000×2000 크기의 28KB PNG가 2048×1365로 조정되고 WebP로 변환되어 15KB로 저장되었습니다. `url`에 `GET` 요청을 보내면 콘텐츠 타입 `image/webp`로 반환되고, `/api/files/thumbnails/128x128/images/2026/11/25/<uuid>.webp`는 JPEG 썸네일을 반환합니다.

> ⚠ 내려받기 응답의 콘텐츠 타입은 컨트롤러 예시처럼 `describe`로 조회해 직접 지정하세요. 콘텐츠 타입 없이 `Resource`를 반환하면 파일 대신 JSON 변환기의 출력이 기록됩니다.

## 4단계. 오류 응답

모듈은 자체 예외를 발생시키며, 스타터의 예외 핸들러는 이 예외를 처리하지 않습니다. 아래 어드바이스가 없으면 거부된 업로드가 상태 500으로 응답됩니다.

```java
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class FileErrorAdvice {

    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<SimpliXApiResponse<Object>> onUpload(FileUploadException e) {
        return ResponseEntity.badRequest().body(SimpliXApiResponse.error(
            e.getMessage(), ErrorCode.VAL_VALIDATION_FAILED.getCode(), e.getErrorCode().name()));
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<SimpliXApiResponse<Object>> onStorage(StorageException e) {
        boolean missing = e.getErrorCode() == StorageException.StorageErrorCode.PATH_NOT_FOUND;
        return ResponseEntity.status(missing ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR).body(SimpliXApiResponse.error(
            missing ? "File not found" : "Storage failed",
            (missing ? ErrorCode.GEN_NOT_FOUND : ErrorCode.GEN_INTERNAL_SERVER_ERROR).getCode(),
            e.getErrorCode().name()));
    }
}
```

```json
{
  "type" : "ERROR",
  "message" : "File type 'application/x-msdownload' is not allowed",
  "timestamp" : "<time with zone>",
  "errorCode" : "VAL_VALIDATION_FAILED",
  "errorDetail" : "INVALID_FILE_TYPE"
}
```

어드바이스를 적용하면 실행 파일 업로드에는 상태 400과 위 본문으로, 존재하지 않는 경로에는 상태 404와 `PATH_NOT_FOUND`로 응답합니다.

## 다음 단계

- [파일 업로드](ko/file/uploading-files.md)
- [이미지 처리](ko/file/processing-images.md)
- [S3에 파일 저장](ko/file/storing-files-in-s3.md)
