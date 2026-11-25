# Configuration reference

Every property of the module, under `simplix.file`.

## Uploads

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | switches the module on |
| `default-max-size` | `10MB` | the largest upload accepted when a request sets no limit |
| `allowed-mime-types` | JPEG, PNG, GIF, WebP and SVG images, PDF, Word, Excel and PowerPoint formats, plain text, CSV | the content types accepted when a request sets none |
| `max-files-per-request` | `10` | no effect: no code reads it |
| `checksum-algorithm` | `SHA-256` | no effect: no code reads it; the checksum is always SHA-256 |
| `virus-scan-enabled` | `false` | no effect: no code reads it |

## Storage

| Property | Default | Meaning |
|---|---|---|
| `storage.provider` | `local` | `local` or `s3` |
| `storage.local.base-path` | `./uploads` | the folder of the local store |
| `storage.local.public-url-prefix` | `/files` | put in front of a stored path to make its URL |
| `storage.s3.endpoint` | none | the endpoint of a store other than AWS |
| `storage.s3.bucket` | none | the bucket; required |
| `storage.s3.access-key`, `storage.s3.secret-key` | none | the credentials; required |
| `storage.s3.region` | `us-east-1` | the region |
| `storage.s3.path-style-access` | `true` | addresses the bucket in the path, as MinIO needs |
| `storage.s3.public-url-prefix` | none | a public base URL; with it, URLs are not signed |
| `storage.s3.presigned-url-expiration` | `60` | minutes a signed link is valid when the call names no lifetime |
| `storage.s3.multipart-part-size` | `8MB` | the part and buffer size of an upload, between 5 MB and 512 MB |

## Images

| Property | Default | Meaning |
|---|---|---|
| `image.default-max-width`, `image.default-max-height` | `2048` | the size an uploaded image is reduced to |
| `image.default-quality` | `85` | the JPEG quality of a resized image |
| `image.resize-on-upload` | `true` | resizes images that exceed the limit |
| `image.max-file-size` | `10MB` | the largest image accepted |
| `image.allowed-formats` | JPEG, PNG, GIF, WebP | the image types the image service processes |
| `image.optimization.enable-webp-conversion` | `true` | converts uploaded images to WebP |
| `image.optimization.convertible-formats` | JPEG, PNG, BMP | the image types that are converted to WebP |
| `image.optimization.webp-quality` | `80` | the quality of the conversion |
| `image.optimization.min-size-for-optimization` | `10240` | bytes below which an image is not converted |
| `image.optimization.webp-lossless` | `false` | no effect: no code reads it |
| `image.thumbnail.default-quality` | `80` | the quality of a thumbnail |
| `image.thumbnail.default-sizes` | `64`, `128`, `256` | no effect: no code reads it; a thumbnail is made in the size a call asks for |
| `image.thumbnail.max-dimension` | `512` | no effect: no code reads it |

## Thumbnails

| Property | Default | Meaning |
|---|---|---|
| `thumbnail.cache-enabled` | `true` | keeps generated thumbnails |
| `thumbnail.cache-path` | `./uploads/.thumbnails` | the folder of the local thumbnail cache, under the base path |
| `thumbnail.s3-prefix` | `thumbnails` | the key prefix of thumbnails in the bucket |

## Beyond the module

| Property | Default | Meaning |
|---|---|---|
| `spring.servlet.multipart.max-file-size` | `1MB` | the largest file Spring accepts in an upload; a larger one never reaches the module |
| `spring.servlet.multipart.max-request-size` | `10MB` | the largest multipart request |

## Related documents

- [Uploading files](en/file/uploading-files.md)
- [Storing files in S3](en/file/storing-files-in-s3.md)
- [Processing images](en/file/processing-images.md)
