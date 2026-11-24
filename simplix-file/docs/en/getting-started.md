# Getting started with simplix-file

This page writes an endpoint that takes an upload, an endpoint that returns the file and one that returns a thumbnail, and answers upload errors with status 400.

## Step 1. Configure the storage

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

- `base-path` is the folder the files are written to.
- `public-url-prefix` is put in front of a stored path to make its URL. The module builds the URL and does not serve it: step 3 does. Use a path under `/api` when the files need a token, which is where tokens are checked.
- Spring refuses a file larger than `spring.servlet.multipart.max-file-size`, 1 MB by default, before the module sees it. Raise it to the largest file you accept.

## Step 2. Write the controller

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

The application in [Building a CRUD API](../../../docs/en/building-a-crud-api.md) serves its controllers under `/api`, so these endpoints are `/api/files`. `processAndStore` checks the file and stores it; an image is stored under `images`, whatever directory the request names.

## Step 3. Try it

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

The 3000 by 2000 PNG of 28 KB was resized to 2048 by 1365, converted to WebP and stored in 15 KB. `GET` on the `url` returns it with the content type `image/webp`, and `/api/files/thumbnails/128x128/images/2026/11/25/<uuid>.webp` returns a JPEG thumbnail.

> ⚠ Set the content type of a download yourself, as the controller does with `describe`. A `Resource` returned without one is written by the JSON converter instead of as the file.

## Step 4. Answer errors

The module throws its own exceptions, which the exception handler of the starter does not know: without the advice below, a refused upload is answered with status 500.

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

With the advice an executable is answered with status 400 and the body above, and a path that does not exist with status 404 and `PATH_NOT_FOUND`.

## Next steps

- [Uploading files](./uploading-files.md)
- [Processing images](./processing-images.md)
- [Storing files in S3](./storing-files-in-s3.md)
