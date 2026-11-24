# 이미지 처리

업로드한 이미지에 적용되는 처리, 처리 방식을 변경하는 방법, 코드에서 이미지를 직접 조정 · 변환 · 측정하는 방법을 설명합니다.

## 업로드 시 적용되는 처리

| 업로드 | 저장 결과 | 이유 |
|---|---|---|
| 3000×2000 크기의 28KB PNG | WebP, 2048×1365, 15KB | 기본 한도 2048보다 크고, 변환 대상이 되는 크기입니다 |
| 같은 파일, 한도 800×800 | WebP, 800×533 | 비율을 유지하면서 한도 안에 맞춥니다 |
| 같은 파일, `enableWebpOptimization(false)`와 한도 1000 | JPEG, 1000×666 | 변환하지 않고 크기만 조정한 이미지는 JPEG로 기록합니다 |
| 300×200 크기의 10KB 미만 PNG | PNG 그대로 | 한도 이내이고 `min-size-for-optimization`보다 작습니다 |

변환한 이미지의 확장자는 `.webp`가 되고, `ProcessedFileResult`의 `mimeType()`에는 새 타입이, `originalMimeType()`에는 원래 타입이 포함됩니다. JPEG로 기록한 이미지에는 투명도가 없습니다. 투명한 이미지를 업로드 대상으로 허용하기 전에 실제 이미지로 결과를 확인하세요.

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

## 썸네일

```java
Resource thumbnail = fileStorageService.getThumbnail(storedPath, 128, 128);
String url = fileStorageService.getThumbnailUrl(storedPath, 128, 128);
// /files/thumbnails/128x128/images/2026/03/01/<uuid>.webp
```

썸네일은 처음 요청할 때 생성해 보관하므로, 이후 요청에서는 저장된 사본을 읽습니다. 비율을 유지하면서 지정한 크기 안에 맞춥니다. 3000×2000 이미지를 128×128로 요청하면 128×85 크기의 JPEG를 반환합니다. 로컬 저장소는 기본 경로 아래의 `simplix.file.thumbnail.cache-path` 폴더에 크기와 저장 경로별로 썸네일을 보관하고, S3 저장소는 버킷의 `simplix.file.thumbnail.s3-prefix` 아래에 보관합니다. URL 형식은 `<공개 URL 접두어>/thumbnails/<너비>x<높이>/<저장 경로>`이며, [시작하기](./getting-started.md)의 엔드포인트로 제공합니다.

## 코드에서 이미지 처리

업로드를 거치지 않는 이미지를 처리하려면 `ImageProcessingService`를 주입하세요. 다른 시스템이 전달한 파일이나 문서에 삽입할 이미지가 여기에 해당합니다.

| 호출(3000×2000 PNG 대상) | 결과 |
|---|---|
| `extractMetadata(input)` | `ImageMetadata`: 3000×2000, `png`. `isLandscape()`는 true, `getAspectRatio()`는 1.5 |
| `resize(input, 600, 600, true)` | 600×400. 비율을 유지합니다 |
| `resize(input, 600, 600, false)` | 600×600. 비율을 무시하고 늘립니다 |
| `resizeIfExceeds(input, 600, 600)` | 첫 번째 호출과 같게 조정합니다. 이미 한도 이내인 이미지는 원래 크기로 반환합니다 |
| `generateThumbnail(input, 128, 128)` | 128×85 |
| `convertToWebp(input, quality, lossless)` | WebP로 변환한 이미지 |
| `optimizeAndConvertToWebp(input, maxWidth, maxHeight, quality)` | 한도에 맞게 조정한 뒤 변환합니다. 업로드에서 사용하는 처리입니다 |

각 호출은 `ProcessedImage`를 반환합니다. `data()`의 바이트, `mimeType()`, `width()`, `height()`, `getFileSize()`로 구성됩니다. `ImageMetadata`에는 `isPortrait()`와 `isSquare()`도 있습니다. 크기 조정 메서드는 JPEG를 반환합니다.

## 처리 대상 형식

- `isSupported(mimeType)`은 서비스가 해당 타입을 처리할 수 있는지 반환합니다. `image/png`는 true, `image/svg+xml`과 `image/heic`는 false입니다.
- `isImage(mimeType)`은 `image/` 접두어만 확인하므로 SVG에도 true를 반환합니다. SVG 업로드는 크기 조정이나 썸네일 생성 없이 그대로 저장합니다.
- `isWebpSupported()`는 WebP 인코더를 사용할 수 있는지 반환합니다. 인코더는 모듈에 포함되어 있으므로, 플랫폼에서 네이티브 라이브러리를 불러오지 못하는 경우가 아니면 true입니다.
- 이미지로 표시되었지만 실제로는 이미지가 아닌 파일은 `ImageProcessingException`과 `INVALID_IMAGE_FORMAT` 코드로 실패합니다: `No image reader found for the input`.

| `ImageProcessingException.ImageErrorCode`의 코드 | 의미 |
|---|---|
| `INVALID_IMAGE_FORMAT`, `CORRUPTED_IMAGE` | 내용을 이미지로 읽을 수 없음 |
| `UNSUPPORTED_FORMAT` | 처리할 수 없는 형식 |
| `RESIZE_FAILED`, `THUMBNAIL_GENERATION_FAILED`, `METADATA_EXTRACTION_FAILED` | 실패한 처리 단계 |
| `IMAGE_TOO_LARGE` | 처리하기에 너무 큰 이미지 |

## 메모리

이미지는 메모리에서 디코딩합니다. 3000×2000 이미지는 파일 크기와 관계없이 처리하는 동안 약 24MB를 사용합니다. 업로드 크기를 제한하고, 대량 처리는 이미지를 하나씩 처리하세요.

## 관련 문서

- [파일 업로드](./uploading-files.md)
- [설정 레퍼런스](./configuration-reference.md)
