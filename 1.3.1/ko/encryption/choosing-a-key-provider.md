# 키 프로바이더 선택

암호화 키의 출처를 설명합니다. 키 프로바이더는 현재 키와 버전별 이전 키를 암호화 서비스에 제공합니다. 사용할 프로바이더는 `simplix.encryption.provider`와 활성 Spring 프로필로 정해집니다.

| 프로바이더 | 키 보관 위치 | 교체 | 적합한 환경 |
|---|---|---|---|
| `simple` | 설정에 지정한 문자열 하나 | 없음 | 개발과 테스트 |
| `configurable` | 설정의 버전별 항목 | 설정 변경으로 교체 | Kubernetes Secret처럼 설정으로 비밀 값을 관리하는 배포 환경 |
| `managed` | 디스크의 파일 | 경과 일수에 따른 자동 교체 | 시크릿 관리 도구가 없는 서버 |
| `vault` | HashiCorp Vault | Vault에서 처리 | Vault를 사용하는 운영 환경 |

## 활성 프로바이더

| 프로바이더 | 등록 조건 |
|---|---|
| `configurable` | `provider: configurable`. 프로필과 관계없습니다 |
| `vault` | `prod`, `staging`, `vault` 프로필 중 하나가 활성이고, Spring Vault가 클래스패스에 있으며, `provider`가 `vault`이거나 지정되지 않음 |
| `managed` | `file-based`, `managed`, `staging` 프로필 중 하나가 활성이고 `provider: managed` |
| `simple` | `dev`, `test`, `local` 프로필 중 하나가 활성이거나 활성 프로필이 없고, 위 조건에 해당하지 않음 |

> ⚠ `prod` 같은 프로필에서 Spring Vault도 없고 `provider: configurable`도 지정하지 않으면 키 프로바이더가 등록되지 않습니다. 개발 환경이 아닌 모든 환경에서는 프로바이더를 명시적으로 지정하세요.

`KeyProvider` 빈을 직접 등록하면 모든 프로바이더를 대체합니다.

## Simple

```yaml
simplix:
  encryption:
    static-key: ${ENCRYPTION_STATIC_KEY}
```

키는 `static-key`에서 파생합니다. 지정하지 않으면 내장된 개발용 문자열을 사용하며, 시작할 때 `SimpleKeyProvider initialized - DO NOT USE IN PRODUCTION`을 기록합니다. 버전을 관리하지 않으므로 문자열을 바꾸면 저장된 데이터를 읽을 수 없습니다.

## Configurable

```yaml
simplix:
  encryption:
    provider: configurable
    configurable:
      current-version: v2
      keys:
        v1:
          key: ${ENCRYPTION_KEY_V1}
          deprecated: true
        v2:
          key: ${ENCRYPTION_KEY_V2}
```

```bash
# A key is 32 random bytes in Base64
openssl rand -base64 32
```

새 값은 `current-version`의 키로 암호화합니다. 목록에 있는 모든 버전으로 복호화할 수 있으며, `deprecated`로 표시한 버전은 복호화에만 사용합니다. `current-version`이 없거나, 키 목록에 없거나, deprecated로 표시되어 있거나, 키가 32바이트가 아니면 애플리케이션이 시작되지 않습니다.

## Managed

```yaml
spring:
  profiles:
    active: managed

simplix:
  encryption:
    provider: managed
    key-store-path: /var/lib/library/keys
    master-key: ${ENCRYPTION_MASTER_KEY}
    salt: ${ENCRYPTION_SALT}
    rotation:
      enabled: true
      days: 90
```

키는 `key-store-path` 아래의 파일로 보관하며 `metadata.json`에 목록을 기록합니다. 디렉터리와 파일은 애플리케이션 사용자만 읽을 수 있습니다. 첫 키는 `master-key`와 `salt`에서 PBKDF2로 파생합니다. 키가 `rotation.days`보다 오래되면 새 키를 생성합니다. ShedLock `LockProvider` 빈이 있으면 교체에 잠금을 사용하므로, 디렉터리를 공유하는 여러 인스턴스에서 한 번만 교체합니다.

## Vault

```yaml
spring:
  profiles:
    active: prod
  cloud:
    vault:
      uri: https://vault.example.com
      authentication: KUBERNETES

simplix:
  encryption:
    provider: vault
```

`spring-cloud-starter-vault-config`를 추가하세요. 키는 `secret/encryption/keys/<version>`에서 읽으며 각 키에는 Base64로 인코딩한 `key` 필드가 있습니다. 현재 버전은 `secret/encryption/keys/current`의 `version` 필드로 지정합니다. 경로는 고정되어 있습니다.

```bash
vault secrets enable -version=1 -path=secret kv
vault kv put secret/encryption/keys/v1 key="$(head -c 32 /dev/urandom | base64)"
vault kv put secret/encryption/keys/current version=v1
```

- `secret/` 마운트는 버전 1의 키-값 엔진이어야 합니다. 개발 모드의 Vault가 기본으로 생성하는 버전 2 마운트에서는 프로바이더가 경로를 읽지 못해 애플리케이션이 `Vault initialization failed` 오류로 시작되지 않습니다.
- 애플리케이션을 처음 시작하기 전에 첫 키와 `current` 항목을 기록하세요. 이 값이 없으면 프로바이더가 시작되지 않습니다.
- 키를 교체하려면 새 키를 새 버전으로 기록하고 `current`가 그 버전을 가리키도록 변경합니다. 이전 버전은 유지하세요. 이전 버전으로 암호화한 행은 해당 버전의 키로 복호화합니다.

## 관련 문서

- [키 교체](ko/encryption/rotating-keys.md)
- [설정 레퍼런스](ko/encryption/configuration-reference.md)
