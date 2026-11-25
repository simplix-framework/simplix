# simplix-file 문제 해결

파일을 저장하고 제공할 때 발생하는 증상과 원인, 조치를 정리합니다.

| 증상 | 원인 | 조치 |
|---|---|---|
| 거부된 업로드가 상태 500과 `GEN_INTERNAL_SERVER_ERROR`로 응답됨 | 스타터의 예외 핸들러는 `FileUploadException`을 처리하지 않습니다 | [시작하기](ko/file/getting-started.md)의 어드바이스를 추가하세요 |
| 수 MB가 넘는 업로드가 컨트롤러 실행 전에 상태 500으로 응답됨 | Spring의 멀티파트 한도에서 거부되었습니다 | `spring.servlet.multipart.max-file-size`와 `max-request-size`를 늘리고, 어드바이스에서 `MaxUploadSizeExceededException`을 처리하세요 |
| 내려받기 응답이 파일이 아닌 JSON으로 반환됨 | 응답에 콘텐츠 타입이 없어 JSON 변환기가 `Resource`를 기록했습니다 | `describe`나 애플리케이션 레코드의 값으로 콘텐츠 타입을 지정하세요 |
| 파일 URL이 404로 응답하거나 로그인 페이지로 리다이렉트됨 | 모듈은 URL만 구성하고 파일을 제공하지 않습니다. `/api` 밖의 경로는 폼 로그인으로 처리됩니다 | 내려받기 엔드포인트를 작성하고 `public-url-prefix`를 그 경로에 맞추세요 |
| 요청에 다른 디렉터리를 지정했는데 이미지가 `images` 아래에 저장됨 | 처리한 이미지는 항상 `images`에 저장됩니다 | 경로는 결과에서 읽으세요. 디렉터리로 직접 구성하지 마세요 |
| PNG가 WebP나 JPEG로 저장됨 | 크기 한도를 넘는 이미지는 크기를 조정하고, 일정 크기 이상이면 변환합니다 | 결과의 타입을 저장하세요. 원본을 유지하려면 `enableWebpOptimization(false)`를 지정하거나 한도를 늘리세요 |
| 빈 파일이 저장됨 | `processAndStoreGenericFile`과 `processAndStoreImage`는 검증을 건너뜁니다 | 사용자가 보낸 파일에는 `processAndStore`를 사용하세요 |
| 확장자가 맞지 않는 파일이 허용됨 | 확장자와 콘텐츠 타입이 일치하지 않아도 로그에만 기록합니다 | 필요하면 애플리케이션 코드에서 확장자를 검사하세요 |
| `No image reader found for the input` | 내용이 이미지가 아니거나 HEIC처럼 리더가 없는 형식입니다 | JPEG, PNG, GIF, WebP를 허용하고, 이 예외에는 상태 400으로 응답하세요 |
| 모든 S3 호출이 `NOT_CONFIGURED`를 발생시킴 | 버킷, 액세스 키, 시크릿 키 중 누락된 값이 있습니다. 메시지에 해당 항목이 포함됩니다 | 누락된 속성을 지정하거나 `StorageConfigurationSource`로 제공하세요 |
| S3 파일의 링크가 1시간 뒤에 동작하지 않음 | `s3.public-url-prefix`가 없으면 `getPublicUrl`이 만료되는 서명된 링크를 반환합니다 | 링크는 필요할 때 생성하고 저장하지 마세요. 저장 경로를 보관하세요 |
| 큰 S3 파일을 제공할 때 메모리가 부족함 | `retrieve`가 객체 전체를 읽습니다 | `getDownloadUrl`을 제공해 브라우저가 버킷에서 직접 읽게 하세요 |

## 관련 문서

- [simplix-file 동작 방식](ko/file/how-it-works.md)
- [설정 레퍼런스](ko/file/configuration-reference.md)
