# 설정 레퍼런스

`simplix.file` 아래에 있는 모듈의 모든 속성을 정리합니다.

## 업로드

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈 사용 여부 |
| `default-max-size` | `10MB` | 요청에 한도를 지정하지 않았을 때 허용하는 최대 업로드 크기 |
| `allowed-mime-types` | JPEG, PNG, GIF, WebP, SVG 이미지, PDF, Word, Excel, PowerPoint 형식, 일반 텍스트, CSV | 요청에 타입을 지정하지 않았을 때 허용하는 콘텐츠 타입 |
| `max-files-per-request` | `10` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `checksum-algorithm` | `SHA-256` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 체크섬은 항상 SHA-256입니다 |
| `virus-scan-enabled` | `false` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 저장소

| 속성 | 기본값 | 의미 |
|---|---|---|
| `storage.provider` | `local` | `local` 또는 `s3` |
| `storage.local.base-path` | `./uploads` | 로컬 저장소의 폴더 |
| `storage.local.public-url-prefix` | `/files` | 저장 경로 앞에 추가해 URL을 구성하는 값 |
| `storage.s3.endpoint` | 없음 | AWS가 아닌 저장소의 엔드포인트 |
| `storage.s3.bucket` | 없음 | 버킷. 필수입니다 |
| `storage.s3.access-key`, `storage.s3.secret-key` | 없음 | 인증 정보. 필수입니다 |
| `storage.s3.region` | `us-east-1` | 리전 |
| `storage.s3.path-style-access` | `true` | MinIO에 필요한 경로 방식으로 버킷을 지정합니다 |
| `storage.s3.public-url-prefix` | 없음 | 공개 기본 URL. 지정하면 URL에 서명하지 않습니다 |
| `storage.s3.presigned-url-expiration` | `60` | 호출에서 유효 시간을 지정하지 않았을 때 서명된 링크의 유효 시간(분) |
| `storage.s3.multipart-part-size` | `8MB` | 업로드의 파트 크기이자 버퍼 크기. 5MB에서 512MB 사이로 유지됩니다 |

## 이미지

| 속성 | 기본값 | 의미 |
|---|---|---|
| `image.default-max-width`, `image.default-max-height` | `2048` | 업로드한 이미지를 축소하는 기준 크기 |
| `image.default-quality` | `85` | 크기를 조정한 이미지의 JPEG 품질 |
| `image.resize-on-upload` | `true` | 한도를 넘는 이미지의 크기를 조정합니다 |
| `image.max-file-size` | `10MB` | 허용하는 최대 이미지 크기 |
| `image.allowed-formats` | JPEG, PNG, GIF, WebP | 이미지 서비스가 처리하는 이미지 타입 |
| `image.optimization.enable-webp-conversion` | `true` | 업로드한 이미지를 WebP로 변환합니다 |
| `image.optimization.convertible-formats` | JPEG, PNG, BMP | WebP로 변환하는 이미지 타입 |
| `image.optimization.webp-quality` | `80` | 변환 품질 |
| `image.optimization.min-size-for-optimization` | `10240` | 이 크기(바이트)보다 작은 이미지는 변환하지 않습니다 |
| `image.optimization.webp-lossless` | `false` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |
| `image.thumbnail.default-quality` | `80` | 썸네일 품질 |
| `image.thumbnail.default-sizes` | `64`, `128`, `256` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 썸네일은 호출에서 요청한 크기로 생성합니다 |
| `image.thumbnail.max-dimension` | `512` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다 |

## 썸네일

| 속성 | 기본값 | 의미 |
|---|---|---|
| `thumbnail.cache-enabled` | `true` | 생성한 썸네일을 보관합니다 |
| `thumbnail.cache-path` | `./uploads/.thumbnails` | 로컬 썸네일 캐시 폴더. 기본 경로 아래에 생성됩니다 |
| `thumbnail.s3-prefix` | `thumbnails` | 버킷에서 썸네일에 사용하는 키 접두어 |

## 모듈 외부 설정

| 속성 | 기본값 | 의미 |
|---|---|---|
| `spring.servlet.multipart.max-file-size` | `1MB` | Spring이 업로드에서 허용하는 최대 파일 크기. 더 큰 파일은 모듈에 전달되지 않습니다 |
| `spring.servlet.multipart.max-request-size` | `10MB` | 멀티파트 요청의 최대 크기 |

## 관련 문서

- [파일 업로드](ko/file/uploading-files.md)
- [S3에 파일 저장](ko/file/storing-files-in-s3.md)
- [이미지 처리](ko/file/processing-images.md)
