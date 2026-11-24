# Processing images

What happens to an uploaded image, how to change it, and how to resize, convert and measure images in your own code.

## What an upload goes through

| Upload | Stored as | Why |
|---|---|---|
| a PNG of 3000 by 2000, 28 KB | WebP, 2048 by 1365, 15 KB | larger than the default limit of 2048, and large enough to convert |
| the same, with a limit of 800 by 800 | WebP, 800 by 533 | the image is fitted into the limit and keeps its proportions |
| the same, with `enableWebpOptimization(false)` and a limit of 1000 | JPEG, 1000 by 666 | a resized image that is not converted is written as JPEG |
| a PNG of 300 by 200, under 10 KB | the PNG, unchanged | within the limit and below `min-size-for-optimization` |

A converted image gets the extension `.webp`, and `ProcessedFileResult` reports the new type in `mimeType()` beside the original in `originalMimeType()`. An image written as JPEG has no transparency. Check how a transparent image of your own comes out before you accept such uploads.

```yaml
simplix:
  file:
    image:
      default-max-width: 2048
      default-max-height: 2048
      default-quality: 85
      optimization:
        enable-webp-conversion: true
        webp-quality: 80
        min-size-for-optimization: 10240
```

## Thumbnails

```java
Resource thumbnail = fileStorageService.getThumbnail(storedPath, 128, 128);
String url = fileStorageService.getThumbnailUrl(storedPath, 128, 128);
// /files/thumbnails/128x128/images/2026/03/01/<uuid>.webp
```

A thumbnail is made the first time it is asked for and kept, so later requests read the stored copy. It fits into the box and keeps its proportions: a 3000 by 2000 image asked for at 128 by 128 comes back as 128 by 85, as a JPEG. The local store keeps thumbnails under the base path, in the folder `simplix.file.thumbnail.cache-path` names, by size and stored path; the S3 store keeps them in the bucket under `simplix.file.thumbnail.s3-prefix`. The URL has the form `<public URL prefix>/thumbnails/<width>x<height>/<stored path>`, which the endpoint in [Getting started](./getting-started.md) serves.

## Work on images in code

Inject `ImageProcessingService` to process an image that does not come through an upload: a file another system delivered, an image to embed in a document.

| Call, on a PNG of 3000 by 2000 | Result |
|---|---|
| `extractMetadata(input)` | an `ImageMetadata`: 3000 by 2000, `png`; `isLandscape()` true, `getAspectRatio()` 1.5 |
| `resize(input, 600, 600, true)` | 600 by 400, the proportions kept |
| `resize(input, 600, 600, false)` | 600 by 600, stretched |
| `resizeIfExceeds(input, 600, 600)` | resized like the first call; an image that already fits is returned at its own size |
| `generateThumbnail(input, 128, 128)` | 128 by 85 |
| `convertToWebp(input, quality, lossless)` | the image as WebP |
| `optimizeAndConvertToWebp(input, maxWidth, maxHeight, quality)` | resized to the limit and converted, the step an upload uses |

Each call returns a `ProcessedImage`: the bytes in `data()`, `mimeType()`, `width()`, `height()` and `getFileSize()`. `ImageMetadata` also has `isPortrait()` and `isSquare()`. The resize methods return JPEG.

## Which formats are processed

- `isSupported(mimeType)` tells whether the service can process a type: true for `image/png`, false for `image/svg+xml` and `image/heic`.
- `isImage(mimeType)` only looks at the `image/` prefix, so it is true for SVG as well. An SVG upload is stored as it is, without resizing or a thumbnail.
- `isWebpSupported()` tells whether the WebP encoder is available; the module brings it, so it is true unless the native library cannot load on the platform.
- A file that claims to be an image and is not fails with `ImageProcessingException` and the code `INVALID_IMAGE_FORMAT`: `No image reader found for the input`.

| Code of `ImageProcessingException.ImageErrorCode` | Meaning |
|---|---|
| `INVALID_IMAGE_FORMAT`, `CORRUPTED_IMAGE` | the content cannot be read as an image |
| `UNSUPPORTED_FORMAT` | the format cannot be processed |
| `RESIZE_FAILED`, `THUMBNAIL_GENERATION_FAILED`, `METADATA_EXTRACTION_FAILED` | the step that failed |
| `IMAGE_TOO_LARGE` | the image is too large to process |

## Memory

An image is decoded in memory: a 3000 by 2000 picture takes about 24 MB while it is processed, whatever the size of its file. Limit the size of uploads, and process large batches one image at a time.

## Related documents

- [Uploading files](./uploading-files.md)
- [Configuration reference](./configuration-reference.md)
