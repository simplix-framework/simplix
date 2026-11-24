# Uploading files

How `FileProcessingService` checks an uploaded file and stores it, how to set limits for one upload, and what the result tells you.

## Ways to store an upload

| Method | Checks | Stores under |
|---|---|---|
| `processAndStore(request)` | empty file, size, allowed type | the directory of the request; an image goes to `images` and is processed |
| `processAndStoreImage(file, maxWidth, maxHeight)` | that the content is an image | `images`, resized and converted |
| `processAndStoreGenericFile(file, directory)` | nothing | the directory, as the file is |

Use `processAndStore` for what users send. The other two skip the checks: an empty file passed to `processAndStoreGenericFile` is stored as a file of 0 bytes.

## Set limits for one upload

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

| Field of `FileProcessingRequest` | Default | Meaning |
|---|---|---|
| `file` | required | the upload |
| `directory` | `files` with the builder | the first part of the stored path |
| `maxFileSize` | `simplix.file.default-max-size`, 10 MB | the largest size accepted |
| `allowedMimeTypes` | `simplix.file.allowed-mime-types` | the content types accepted |
| `maxWidth`, `maxHeight` | `simplix.file.image.default-max-width` and `-height`, 2048 | the size an image is reduced to |
| `enableWebpOptimization` | follows the configuration | `false` keeps this image out of the WebP conversion |

## What is checked

1. The file is not empty; otherwise `EMPTY_FILE`.
2. Its size is within the limit; otherwise `FILE_SIZE_EXCEEDED`, with a message such as `File size 15 bytes exceeds maximum 5 bytes`.
3. Its content type is in the allowed list; otherwise `INVALID_FILE_TYPE`, as for `application/x-msdownload`.
4. Its extension is compared with the content type. A mismatch, such as `photo.png` sent as `application/pdf`, is written to the log as a warning and the file is stored.

The content type is the one the client sent. The check does not open the file, so it keeps out what a browser labels honestly, not a file that was labelled falsely on purpose. Allowed by default are JPEG, PNG, GIF, WebP and SVG images, PDF, the Word, Excel and PowerPoint formats, plain text and CSV.

## Read the result

```java
ProcessedFileResult result = fileProcessingService.processAndStore(FileProcessingRequest.of(file, "documents"));

attachment.setStoredPath(result.getStoredPath());     // documents/2026/03/01/<uuid>.pdf
attachment.setOriginalName(result.getOriginalName()); // Reading list.pdf
attachment.setMimeType(result.mimeType());            // application/pdf
attachment.setSize(result.getFileSize());             // 15
attachment.setChecksum(result.getChecksum());         // 64 hexadecimal characters
```

| Member of `ProcessedFileResult` | Holds |
|---|---|
| `storedInfo()` | a `StoredFileInfo`: `originalName`, `storedName`, `storedPath`, `mimeType`, `fileSize`, `extension`, `checksum` |
| `getStoredPath()`, `getOriginalName()`, `getFileSize()`, `getExtension()`, `getChecksum()` | shortcuts to the same values |
| `category()` | a `FileCategory`: `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`, `ARCHIVE` or `OTHER`; `isImage()`, `isVideo()`, `isAudio()` and `isDocument()` test it |
| `mimeType()`, `originalMimeType()` | the type of what was stored and of what was sent; `wasMimeTypeChanged()` is true after a conversion |
| `width()`, `height()` | the size of a stored image |
| `wasOptimized()` | whether an image was converted to WebP |

Keep the stored path, the original name, the type and the size in a table of your own. The stored name is a random identifier with the extension, so the original name is the only place the name the user chose survives. The checksum is the SHA-256 of the stored bytes.

## Errors

A refused upload throws `FileUploadException` with a `FileErrorCode`. The exception handler of the starter does not map it, so answer it in an advice of your own, as [Getting started](./getting-started.md) shows.

| Code | Thrown when |
|---|---|
| `EMPTY_FILE` | the file has no content |
| `FILE_SIZE_EXCEEDED` | the file is larger than the limit |
| `INVALID_FILE_TYPE` | the content type is not allowed |
| `INVALID_IMAGE`, `IMAGE_PROCESSING_FAILED` | an image could not be read or processed |
| `STORAGE_WRITE_FAILED` | the store refused the write |
| `INVALID_EXTENSION`, `VIRUS_DETECTED`, `STORAGE_QUOTA_EXCEEDED`, `CHECKSUM_MISMATCH`, `MAX_FILES_EXCEEDED` | not thrown by the module; they are there for checks an application adds |

## Related documents

- [Processing images](./processing-images.md)
- [Working with stored files](./working-with-stored-files.md)
- [Configuration reference](./configuration-reference.md)
