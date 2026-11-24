# 설정 레퍼런스

`simplix.encryption` 아래에 있는 모듈의 모든 속성을 정리합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈 사용 |
| `provider` | `simple` | `simple`, `configurable`, `managed`, `vault` 중 하나 |
| `static-key` | 개발용 문자열 | simple 프로바이더가 키를 파생하는 문자열 |
| `simple.allow-rotation` | `false` | simple 프로바이더가 교체 호출을 받도록 허용합니다. 어느 경우에도 키는 하나만 유지합니다 |
| `configurable.current-version` | 없음 | 새 값을 암호화하는 버전 |
| `configurable.keys.<version>.key` | 없음 | Base64로 인코딩한 32바이트 키 |
| `configurable.keys.<version>.deprecated` | `false` | 복호화 전용 버전으로 지정 |
| `key-store-path` | 없음 | managed 프로바이더의 키 파일 디렉터리 |
| `master-key`, `salt` | 없음 | managed 프로바이더가 첫 키를 파생하는 값 |
| `rotation.enabled` | `true` | managed 프로바이더의 경과 일수 기반 교체 |
| `rotation.days` | `90` | 키를 교체하는 경과 일수 |
| `auto-rotation` | `true` | 주기적으로 경과 일수 확인 |
| `vault.enabled` | `true` | vault 프로바이더의 Vault 호출 허용 |
| `vault.path` | `secret/encryption` | 효과가 없습니다. 이 값을 읽는 코드가 없습니다. 키는 항상 `secret/encryption/keys` 아래에 있습니다 |
| `vault.namespace` | 없음 | 효과가 없습니다. 이 값을 읽는 코드가 없으므로 `spring.cloud.vault.namespace`를 사용하세요 |

## 관련 문서

- [키 프로바이더 선택](./choosing-a-key-provider.md)
