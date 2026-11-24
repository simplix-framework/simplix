# simplix-encryption 동작 방식

모듈의 구성 요소, 값을 암호화하고 다시 읽는 과정, 키 프로바이더가 선택되는 방식을 설명합니다.

## 구성 요소

| 구성 요소 | 클래스 | 역할 |
|---|---|---|
| 변환기 | `AesEncryptionConverter`, `AesEncryptionBytesConverter` | 데이터베이스에 기록할 때 속성을 암호화하고 읽을 때 복호화합니다 |
| 서비스 | `EncryptionService` | AES-GCM으로 암호화 · 복호화하고 모든 값에 키 버전을 기록합니다 |
| 키 프로바이더 | `KeyProvider`: `SimpleKeyProvider`, `ConfigurableKeyProvider`, `ManagedKeyProvider`, `VaultKeyProvider` | 서비스에 현재 키와, 버전으로 지정한 이전 키를 제공합니다 |

`SimpliXEncryptionAutoConfiguration`이 이 구성 요소를 등록하고 `simplix.encryption`을 `SimpliXEncryptionProperties`에 바인딩합니다. `simplix.encryption.enabled: false`를 지정하면 모듈을 등록하지 않습니다. 프로바이더는 `KeyProviderConfiguration`에 프로바이더별 중첩 구성으로 선언되어 있으며, 프로파일과 속성 조건은 [키 프로바이더 선택](./choosing-a-key-provider.md)에 있습니다.

## 값 처리 과정

1. 기록할 때 변환기는 문자열을 서비스에 전달합니다. `null`, 빈 문자열, 이미 암호화 형식인 값은 전달하지 않습니다.
2. 서비스는 프로바이더에 현재 키와 버전을 요청하고, 12바이트 IV를 새로 생성해 암호화합니다.
3. 저장되는 값은 `<version>:<iv>:<ciphertext>` 형식입니다.
4. 읽을 때 서비스는 값에서 버전을 읽고 프로바이더에 해당 키를 요청해 복호화합니다. 형식에 맞지 않는 값은 변경하지 않고 반환합니다.
5. 암호문이나 태그가 변경된 값은 `EncryptionService.DecryptionException`으로 실패하고, 암호화에 실패하면 `EncryptionService.EncryptionException`이 발생합니다.

## 키 프로바이더 직접 작성

클라우드 키 서비스처럼 모듈에서 지원하지 않는 위치에서 키를 가져오려면 `KeyProvider`를 구현한 빈을 선언하세요. 이 빈은 모든 내장 프로바이더를 대체합니다. `AbstractKeyProvider`는 메모리 키 캐시, 버전 이름 생성, 교체 주기 검사를 제공하는 기반 클래스입니다.

| `KeyProvider`의 메서드 | 반환 |
|---|---|
| `getCurrentKey()` | 새 값을 암호화하는 키 |
| `getCurrentVersion()` | 해당 키의 버전. 모든 값의 앞에 기록됩니다 |
| `getKey(version)` | 복호화에 사용할 해당 버전의 키 |
| `rotateKey()` | 교체 후 새 키의 버전 |
| `isConfigured()` | 프로바이더가 키를 제공할 수 있는지 여부 |
| `getName()` | 로그에 기록하는 이름 |

## 그 밖의 공개 메서드

가이드에서는 작업에 필요한 메서드를 설명합니다. 가이드에 나온 타입은 아래 공개 메서드도 제공합니다.

| 타입 | 메서드 | 동작 |
|---|---|---|
| `ConfigurableKeyProvider` | `isDeprecated(version)` | 지정한 키 버전이 사용 중단으로 표시되어 있는지 반환합니다 |
| `ConfigurableKeyProvider` | `getAvailableVersions()` | 프로바이더가 보유한 모든 키 버전을 반환합니다 |

## 관련 문서

- [키 프로바이더 선택](./choosing-a-key-provider.md)
- [컬럼 암호화](./encrypting-columns.md)
- [문제 해결](./troubleshooting.md)
