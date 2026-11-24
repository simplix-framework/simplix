# How simplix-file works

The classes behind an upload, what the module registers and what it leaves to the application.

## The path of an upload

1. The application calls `FileProcessingService`; the bean is a `DefaultFileProcessingService`.
2. `FileValidator` checks that the file is not empty, its size and its content type, and names its `FileCategory`.
3. An image the service can process goes to `ImageProcessingService`, implemented by `AwtImageProcessingService`: it is measured, resized to the limit and, when it qualifies, converted to WebP.
4. `FileStorageService` stores the bytes under a new key built by `StoredKey`: the directory, the date and a random name. `LocalFileStorageService` writes a file, and `S3FileStorageService` sends an object.
5. The store computes the SHA-256 of what it wrote and returns a `StoredFileInfo`, which the processing service wraps in a `ProcessedFileResult`.

## What the module registers

`FileAutoConfiguration` binds the three property classes and scans the packages of the module, unless `simplix.file.enabled` is `false`.

| Bean | Registered when | Properties |
|---|---|---|
| `FileProcessingService`, `FileValidator` | always | `FileProperties`, under `simplix.file` |
| `ImageProcessingService` | always | `ImageProperties`, under `simplix.file.image` |
| `LocalFileStorageService` | `storage.provider` is `local` or not set | `StorageProperties`, under `simplix.file.storage` |
| `S3FileStorageService` | `storage.provider` is `s3` | the same, through a `StorageConfigurationSource` |
| `StorageConfigurationSource` | no bean of that type exists | `PropertiesStorageConfigurationSource` returns the bound properties |

## Inside the S3 store

- An `S3ClientFactory`, by default `DefaultS3ClientFactory`, builds the client and the presigner from the settings. Building them does not contact the endpoint.
- An `S3ClientHolder` keeps the client, the presigner and the settings of one revision. Every operation works on the holder it started with, and a replaced holder is closed when its last operation ends.
- `Digests` computes the SHA-256 while the bytes stream to the bucket, and `DownloadFileNames` builds the `Content-Disposition` value of a signed download link, with a plain form of the name for old clients and an encoded form for names outside ASCII.
- A `PresignedUpload` is the ticket of a direct upload, and a `StoredObjectInfo` is what `describe` reads back from the bucket.

## What the module does not do

- It registers no endpoint. Uploading, downloading and serving thumbnails are controllers of the application.
- It keeps no record of the files. The stored path, the original name and the owner belong in a table of the application.
- It does not decide who may read a file. A stored path is not a secret; check the right of the caller before a file or a link is returned.
- It does not map its exceptions to HTTP answers. `FileUploadException`, `StorageException` and `ImageProcessingException` are answered by an advice of the application.
- It does not scan for viruses or look inside a file to verify its type.
- It never deletes a file on its own.

## Other public methods

The guides show the methods a task needs. The types they name also have these public methods.

| Type | Method | Does |
|---|---|---|
| `FileValidator` | `validate(file, maxSize, allowedMimeTypes)` | checks an uploaded file against a size limit and a set of MIME types, and throws when it does not pass |
| `FileValidator` | `validateImage(file, maxWidth, maxHeight)` | checks an uploaded image against a width and a height limit |
| `FileValidator` | `determineFileCategory(mimeType, extension)` | returns the `FileCategory` of a MIME type and an extension |

## Related documents

- [Uploading files](./uploading-files.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
