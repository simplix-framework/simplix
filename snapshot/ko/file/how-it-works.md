# simplix-file 동작 방식

업로드를 처리하는 클래스, 모듈이 등록하는 구성, 애플리케이션이 직접 처리해야 하는 범위를 설명합니다.

## 업로드 처리 과정

1. 애플리케이션이 `FileProcessingService`를 호출합니다. 이 빈은 `DefaultFileProcessingService`입니다.
2. `FileValidator`가 빈 파일 여부, 크기, 콘텐츠 타입을 검사하고 `FileCategory`를 판정합니다.
3. 서비스가 처리할 수 있는 이미지는 `ImageProcessingService`(구현은 `AwtImageProcessingService`)로 전달됩니다. 크기를 측정하고 한도에 맞게 조정하며, 조건에 해당하면 WebP로 변환합니다.
4. `FileStorageService`가 `StoredKey`로 구성한 새 키(디렉터리, 날짜, 무작위 이름)에 바이트를 저장합니다. `LocalFileStorageService`는 파일을 기록하고, `S3FileStorageService`는 객체를 전송합니다.
5. 저장소가 기록한 내용의 SHA-256을 계산해 `StoredFileInfo`를 반환하고, 처리 서비스가 이를 `ProcessedFileResult`에 담아 반환합니다.

## 모듈이 등록하는 구성

`FileAutoConfiguration`이 속성 클래스를 바인딩하고 모듈의 패키지를 스캔합니다. `simplix.file.enabled`가 `false`이면 등록하지 않습니다.

| 빈 | 등록 조건 | 속성 |
|---|---|---|
| `FileProcessingService`, `FileValidator` | 항상 | `simplix.file` 아래의 `FileProperties` |
| `ImageProcessingService` | 항상 | `simplix.file.image` 아래의 `ImageProperties` |
| `LocalFileStorageService` | `storage.provider`가 `local`이거나 지정하지 않았을 때 | `simplix.file.storage` 아래의 `StorageProperties` |
| `S3FileStorageService` | `storage.provider`가 `s3`일 때 | 같은 속성. `StorageConfigurationSource`를 거쳐 읽습니다 |
| `StorageConfigurationSource` | 같은 타입의 빈이 없을 때 | `PropertiesStorageConfigurationSource`가 바인딩된 속성을 반환합니다 |

## S3 저장소의 내부 구조

- `S3ClientFactory`(기본 구현은 `DefaultS3ClientFactory`)가 설정으로 클라이언트와 프리사이너를 생성합니다. 생성할 때는 엔드포인트에 접속하지 않습니다.
- `S3ClientHolder`는 한 리비전의 클라이언트, 프리사이너, 설정을 보관합니다. 모든 연산은 시작할 때의 홀더를 사용하며, 교체된 홀더는 마지막 연산이 끝나면 닫습니다.
- `Digests`는 바이트를 버킷으로 스트리밍하는 동안 SHA-256을 계산합니다. `DownloadFileNames`는 서명된 내려받기 링크의 `Content-Disposition` 값을 구성하며, 구형 클라이언트용 일반 이름과 ASCII 범위를 벗어난 이름을 위한 인코딩된 이름을 함께 포함합니다.
- `PresignedUpload`는 직접 업로드의 티켓이고, `StoredObjectInfo`는 `describe`가 버킷에서 읽은 정보입니다.

## 모듈이 처리하지 않는 범위

- 엔드포인트를 등록하지 않습니다. 업로드, 내려받기, 썸네일 제공은 애플리케이션의 컨트롤러에서 처리합니다.
- 파일 레코드를 관리하지 않습니다. 저장 경로, 원본 이름, 소유자는 애플리케이션의 테이블에 보관합니다.
- 파일 열람 권한을 판단하지 않습니다. 저장 경로는 비밀 값이 아니므로, 파일이나 링크를 반환하기 전에 호출자의 권한을 확인하세요.
- 예외를 HTTP 응답으로 변환하지 않습니다. `FileUploadException`, `StorageException`, `ImageProcessingException`은 애플리케이션의 어드바이스에서 응답합니다.
- 바이러스 검사를 하지 않으며, 파일 내용을 열어 타입을 검증하지 않습니다.
- 파일을 자체적으로 삭제하지 않습니다.

## 관련 문서

- [파일 업로드](ko/file/uploading-files.md)
- [설정 레퍼런스](ko/file/configuration-reference.md)
- [문제 해결](ko/file/troubleshooting.md)
