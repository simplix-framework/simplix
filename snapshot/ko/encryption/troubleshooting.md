# simplix-encryption 문제 해결

암호화를 사용할 때 발생하는 증상과 원인, 조치를 정리합니다.

| 증상 | 원인 | 조치 |
|---|---|---|
| 행을 읽을 때 `DecryptionException: Failed to decrypt data`로 실패함 | 저장된 값이 변경되었거나, 프로바이더에 해당 버전의 키가 없습니다 | 해당 버전의 키를 복원하세요. configurable 프로바이더에서는 행이 남아 있는 버전을 모두 유지합니다 |
| 설정을 변경한 뒤 저장된 값을 모두 읽을 수 없음 | simple 프로바이더의 `static-key`를 변경했습니다. 이 프로바이더는 키를 하나만 유지합니다 | 이전 값을 복원하고, 키를 변경하기 전에 버전을 지원하는 프로바이더로 전환하세요 |
| `prod` 같은 프로파일에서 애플리케이션이 시작되지 않음 | 프로파일과 속성에 맞는 키 프로바이더가 없습니다 | `simplix.encryption.provider`를 명시하고, `vault`를 사용한다면 Spring Vault를 추가하세요 |
| configurable 프로바이더에서 애플리케이션 시작이 거부됨 | `current-version`이 없거나, 키 목록에 없거나, deprecated 상태이거나, 키가 32바이트가 아닙니다 | 설정을 바로잡으세요. 키는 `openssl rand -base64 32`로 생성합니다 |
| 값이 컬럼 길이를 초과해 저장에 실패함 | 암호화한 값은 원문보다 깁니다 | [컬럼 암호화](ko/encryption/encrypting-columns.md)의 표를 기준으로 컬럼 크기를 정하세요 |
| 암호화한 컬럼으로 조회하면 결과가 없음 | 같은 원문도 암호화할 때마다 값이 달라집니다 | 해시 컬럼으로 검색하세요 |
| 테이블의 일부 행이 평문으로 표시됨 | 변환기를 추가하기 전에 기록된 뒤 다시 저장되지 않은 행입니다 | 배치 단위로 읽어 다시 저장하세요 |
| 로그에 `SimpleKeyProvider initialized - DO NOT USE IN PRODUCTION`이 기록됨 | simple 프로바이더가 활성화되어 있습니다 | 개발 환경이 아니면 `configurable`, `managed`, `vault` 중에서 선택하세요 |
| `simplix.encryption.vault.namespace`가 적용되지 않음 | 이 속성을 읽는 코드가 없습니다 | 네임스페이스는 `spring.cloud.vault.namespace`로 지정하세요 |

## 관련 문서

- [simplix-encryption 동작 방식](ko/encryption/how-it-works.md)
- [키 프로바이더 선택](ko/encryption/choosing-a-key-provider.md)
