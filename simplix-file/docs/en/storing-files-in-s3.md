# Storing files in S3

How to keep files in AWS S3 or another S3-compatible store such as MinIO, hand out links that expire, and let browsers upload straight to the bucket.

## Step 1. Configure the bucket

```yaml
# AWS S3
simplix:
  file:
    storage:
      provider: s3
      s3:
        bucket: library-files
        region: ap-northeast-2
        access-key: ${AWS_ACCESS_KEY_ID}
        secret-key: ${AWS_SECRET_ACCESS_KEY}
        path-style-access: false
```

```yaml
# MinIO
simplix:
  file:
    storage:
      provider: s3
      s3:
        endpoint: http://localhost:9000
        bucket: library-files
        access-key: ${MINIO_ACCESS_KEY}
        secret-key: ${MINIO_SECRET_KEY}
        path-style-access: true
```

- `bucket`, `access-key` and `secret-key` are required. Without one of them the application still starts, `isConfigured()` answers false, and every operation throws `StorageException` with the code `NOT_CONFIGURED` and the names of the missing settings.
- `endpoint` names a store other than AWS. Leave it out for AWS S3.
- `path-style-access` is `true` by default, which MinIO needs; AWS S3 uses `false`.
- A bucket that does not exist is created when the store is first used, if the credentials allow it.

## Step 2. Use the same code

Uploads, thumbnails and the calls of [Working with stored files](./working-with-stored-files.md) work without a change. What differs is where the bytes go and what a URL is.

|  | Local | S3 |
|---|---|---|
| `getPublicUrl` | `public-url-prefix` and the stored path | with `s3.public-url-prefix`: the prefix and the path; without it: a signed link valid for `presigned-url-expiration` minutes, 60 by default |
| `getDownloadUrl` | the public URL | a signed link with the lifetime and the download file name you pass |
| `store` | writes a file | streams to the bucket; a stream longer than `multipart-part-size` goes as a multipart upload |
| `retrieve` | opens the file | loads the whole object into memory |
| thumbnails | in the cache folder | in the bucket, under `thumbnail.s3-prefix` |
| direct upload | not supported | supported |

## Hand out a download link

```java
String url = fileStorageService.getDownloadUrl(
    attachment.getStoredPath(),
    Duration.ofMinutes(5),
    attachment.getOriginalName()
);
```

The browser downloads from the bucket, under the original name, without the bytes passing the application. Prefer it to `retrieve` for large files. A link cannot live longer than 7 days. With `s3.public-url-prefix` set, the bucket is taken to be public or behind a CDN, and both URL methods return the prefixed path without a signature.

## Let the browser upload to the bucket

```java
@PostMapping("/attachments/upload-ticket")
public SimpliXApiResponse<PresignedUpload> ticket(@RequestBody @Valid UploadTicketRequest request) {
    PresignedUpload upload = fileStorageService.createDirectUpload(
        "documents", request.fileName(), request.contentType(), request.size(), Duration.ofMinutes(10));
    return SimpliXApiResponse.success(upload);
}

@PostMapping("/attachments/confirm")
public SimpliXApiResponse<Void> confirm(@RequestBody @Valid UploadConfirmRequest request) {
    StoredObjectInfo stored = fileStorageService.describe(request.storedPath());
    attachments.register(request.storedPath(), request.fileName(), stored.contentType(), stored.size(), stored.checksum());
    return SimpliXApiResponse.success(null);
}
```

1. The client asks the application for a ticket with the name, the type and the size of the file.
2. The application answers with a `PresignedUpload`: the `storedPath` the file will have, the `url`, the HTTP `method`, the `headers` to send and `expiresAt`.
3. The client sends the file to the `url` with that method and those headers. The size and the type are part of the signature, so another file is refused by the store.
4. The client reports back, and the application reads the object with `describe` before it creates the record: only then is it certain that the upload happened.

One request carries at most 5 GB. A direct upload skips `FileProcessingService`, so nothing is validated, resized or converted: check the type and the size when the ticket is requested, and again from `describe`. Call `supportsDirectUpload()` first in code that also runs on the local store.

## Change the settings while the application runs

The store reads its settings from a `StorageConfigurationSource`. The default one returns the properties. Declare a bean of your own to keep them elsewhere, for example in a table an administrator edits.

```java
@Component
@RequiredArgsConstructor
public class DatabaseStorageSettings implements StorageConfigurationSource {

    private final StorageSettingRepository settings;

    @Override
    public StorageProperties.S3StorageConfig s3() {
        return settings.current().toS3Config();
    }

    @Override
    public long revision() {
        return settings.currentRevision();
    }
}
```

`revision()` is asked on every operation. When it returns another number, the store builds new clients from `s3()` for the next call and closes the old ones once the calls that were running on them have finished, so no restart is needed. Keep `revision()` cheap: read a cached number, not the table.

## Large files

| Property | Default | Meaning |
|---|---|---|
| `simplix.file.storage.s3.multipart-part-size` | 8 MB | the size of one part and of the buffer `store` uses; kept between 5 MB and 512 MB |

An upload takes at most 10,000 parts, so the largest file `store` accepts is the part size times 10,000: about 80 GB with the default. Raise the part size for larger files.

## Related documents

- [Working with stored files](./working-with-stored-files.md)
- [Configuration reference](./configuration-reference.md)
- [Troubleshooting](./troubleshooting.md)
