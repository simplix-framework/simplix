# S3에 파일 저장

AWS S3나 MinIO 같은 S3 호환 저장소에 파일을 보관하고, 만료되는 링크를 제공하고, 브라우저가 버킷으로 직접 업로드하게 하는 방법을 설명합니다.

## 1단계. 버킷 설정

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

- `bucket`, `access-key`, `secret-key`는 필수입니다. 하나라도 없으면 애플리케이션은 시작되지만 `isConfigured()`가 false를 반환하고, 모든 연산이 누락된 설정 이름이 포함된 `NOT_CONFIGURED` 코드의 `StorageException`을 발생시킵니다.
- `endpoint`에는 AWS가 아닌 저장소를 지정합니다. AWS S3에서는 지정하지 않습니다.
- `path-style-access`의 기본값은 MinIO에 필요한 `true`입니다. AWS S3에서는 `false`를 사용합니다.
- 버킷이 없으면 저장소를 처음 사용할 때 생성합니다. 인증 정보에 생성 권한이 있어야 합니다.

## 2단계. 같은 코드 사용

업로드, 썸네일, [저장된 파일 다루기](./working-with-stored-files.md)의 호출은 변경 없이 동작합니다. 바이트가 저장되는 위치와 URL의 형태만 달라집니다.

|  | 로컬 | S3 |
|---|---|---|
| `getPublicUrl` | `public-url-prefix`와 저장 경로 | `s3.public-url-prefix`가 있으면 접두어와 경로. 없으면 `presigned-url-expiration`분(기본 60분) 동안 유효한 서명된 링크 |
| `getDownloadUrl` | 공개 URL | 전달한 유효 시간과 내려받기 파일 이름이 적용된 서명된 링크 |
| `store` | 파일을 기록합니다 | 버킷으로 스트리밍합니다. `multipart-part-size`보다 긴 스트림은 멀티파트 업로드로 전송합니다 |
| `retrieve` | 파일을 엽니다 | 객체 전체를 메모리로 읽습니다 |
| 썸네일 | 캐시 폴더 | 버킷의 `thumbnail.s3-prefix` 아래 |
| 직접 업로드 | 지원하지 않음 | 지원 |

## 내려받기 링크 제공

```java
String url = fileStorageService.getDownloadUrl(
    attachment.getStoredPath(),
    Duration.ofMinutes(5),
    attachment.getOriginalName()
);
```

브라우저가 버킷에서 원본 이름으로 직접 내려받으며, 바이트가 애플리케이션을 거치지 않습니다. 큰 파일에는 `retrieve` 대신 이 방식을 사용하세요. 링크의 유효 시간은 7일을 넘을 수 없습니다. `s3.public-url-prefix`를 지정하면 버킷이 공개 상태이거나 CDN 뒤에 있는 것으로 간주해, URL 메서드가 서명 없이 접두어를 추가한 경로를 반환합니다.

## 브라우저에서 버킷으로 직접 업로드

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

1. 클라이언트가 파일의 이름, 타입, 크기를 전달해 애플리케이션에 업로드 티켓을 요청합니다.
2. 애플리케이션이 `PresignedUpload`를 반환합니다. 파일이 저장될 `storedPath`, `url`, HTTP `method`, 전송할 `headers`, `expiresAt`으로 구성됩니다.
3. 클라이언트가 해당 메서드와 헤더로 `url`에 파일을 전송합니다. 크기와 타입이 서명에 포함되므로 다른 파일을 보내면 저장소가 거부합니다.
4. 클라이언트가 완료를 알리면, 애플리케이션은 레코드를 생성하기 전에 `describe`로 객체를 조회합니다. 이 조회로 업로드가 실제로 완료되었는지 확인합니다.

요청 한 건으로 전송할 수 있는 크기는 최대 5GB입니다. 직접 업로드는 `FileProcessingService`를 거치지 않으므로 검증, 크기 조정, 변환이 적용되지 않습니다. 타입과 크기는 티켓을 요청할 때 확인하고 `describe` 결과로 다시 확인하세요. 로컬 저장소에서도 실행되는 코드에서는 먼저 `supportsDirectUpload()`를 호출하세요.

## 실행 중 설정 변경

저장소는 `StorageConfigurationSource`에서 설정을 읽습니다. 기본 구현은 속성 값을 반환합니다. 관리자가 수정하는 테이블처럼 다른 위치에 설정을 보관하려면 빈을 직접 선언하세요.

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

`revision()`은 연산마다 호출됩니다. 반환 값이 달라지면 저장소는 다음 호출부터 `s3()`의 설정으로 새 클라이언트를 생성하고, 이전 클라이언트는 실행 중이던 호출이 끝난 뒤 닫습니다. 따라서 재시작이 필요하지 않습니다. `revision()`은 비용이 낮아야 합니다. 테이블을 조회하지 말고 캐시한 값을 반환하세요.

## 대용량 파일

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.file.storage.s3.multipart-part-size` | 8MB | 각 파트의 크기이자 `store`가 사용하는 버퍼 크기. 5MB에서 512MB 사이로 유지됩니다 |

업로드 한 건에 사용할 수 있는 파트는 최대 10,000개이므로, `store`가 처리할 수 있는 최대 파일 크기는 파트 크기의 10,000배입니다. 기본값에서는 약 80GB입니다. 더 큰 파일에는 파트 크기를 늘리세요.

## 관련 문서

- [저장된 파일 다루기](./working-with-stored-files.md)
- [설정 레퍼런스](./configuration-reference.md)
- [문제 해결](./troubleshooting.md)
