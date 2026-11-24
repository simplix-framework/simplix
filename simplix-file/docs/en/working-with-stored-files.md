# Working with stored files

What `FileStorageService` does with a stored path: read the file, make a link, describe it and delete it. The same calls work on the local disk and in S3.

## The stored path

```text
uploads
├── documents
│   └── 2026/03/01/3f1c9a52-....pdf
└── images
    └── 2026/03/01/8d2e7b10-....webp
```

A file is stored under its directory, the date and a random name that keeps the extension: `documents/2026/03/01/<uuid>.pdf`. That path is the handle of the file. Keep it in your own table; every other call takes it as its argument. The name the user gave is not part of the path, so two uploads of `report.pdf` never collide and a file name cannot reach the file system.

## Operations

| Call | Does | Result on the local store |
|---|---|---|
| `store(inputStream, originalName, directory)`, `store(..., mimeType, directory)` | stores a stream that did not come from an upload | a `StoredFileInfo` |
| `retrieve(storedPath)` | returns the file as a `Resource` | the file; a path that does not exist throws `StorageException` with `PATH_NOT_FOUND` |
| `exists(storedPath)` | tells whether the file is there | `true` or `false` |
| `describe(storedPath)`, `describe(storedPath, false)` | returns a `StoredObjectInfo`: `storedPath`, `size`, `contentType`, `lastModified` and, unless the second argument is false, the `checksum` | size 15, type `application/pdf`, a SHA-256 checksum |
| `getPublicUrl(storedPath)` | the URL of the file | `/files/documents/2026/03/01/<uuid>.pdf` |
| `getDownloadUrl(storedPath, validFor, downloadFileName)` | a link for one download, under the given file name where the store can sign links | the same as the public URL |
| `getThumbnail(storedPath, width, height)`, `getThumbnailUrl(...)` | a thumbnail of an image, and its URL | see [Processing images](./processing-images.md) |
| `delete(storedPath)` | removes the file | `true`; `false` when the file was already gone |
| `supportsDirectUpload()`, `createDirectUpload(...)` | lets a browser upload straight to the store | not supported; see [Storing files in S3](./storing-files-in-s3.md) |
| `isConfigured()` | tells whether the store has the settings it needs | `true` |

## Serve a download under its original name

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

Look the file up by the id of your own record, not by a path the client sends: the record is where you decide who may read it. Set the content type, or the `Resource` is written by the JSON converter.

## Delete with the record

```java
@Transactional
public void remove(String id) {
    Attachment attachment = attachments.findById(id).orElseThrow();
    attachments.delete(attachment);
    fileStorageService.delete(attachment.getStoredPath());
}
```

The module does not know which records refer to a file and never deletes on its own. Delete the file when its record goes; a file that is left behind takes space and nothing else.

## Paths that leave the store

A stored path that points outside the base folder is refused: `retrieve("../../etc/passwd")` throws `StorageException` with the code `INVALID_PATH`.

| Code of `StorageException` | Meaning |
|---|---|
| `PATH_NOT_FOUND` | no file at that path |
| `INVALID_PATH` | the path is not a stored path of this store |
| `WRITE_FAILED`, `READ_FAILED`, `DELETE_FAILED` | the operation failed in the store |
| `PERMISSION_DENIED`, `STORAGE_FULL` | the store refused for lack of rights or of space |
| `CHECKSUM_CALCULATION_FAILED` | the checksum could not be computed |
| `NOT_CONFIGURED` | the S3 store lacks a setting; the message names it |
| `UNSUPPORTED_OPERATION` | the store does not offer the operation, such as a direct upload on the local store |

## Related documents

- [Uploading files](./uploading-files.md)
- [Storing files in S3](./storing-files-in-s3.md)
