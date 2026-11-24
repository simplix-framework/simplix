# 키 안전하게 운영하기

키 생성 방법, 환경별 보관 위치, 운영 중 확인할 항목, 키 노출이 의심될 때의 조치를 설명합니다.

## 키 생성

```bash
openssl rand -base64 32
```

키는 Base64로 인코딩한 무작위 32바이트입니다. 위와 같이 암호학적 난수 생성기로 만드세요. 단어나 문장, 웹 페이지에서 생성한 값은 키로 사용하지 않으며, 키 하나는 한 환경에서만 사용합니다.

## 키 보관 위치

| 환경 | 프로바이더 | 키 보관 |
|---|---|---|
| 개발, 테스트 | `simple` | 내장 개발용 문자열 또는 로컬 설정의 `static-key` |
| 스테이징, 설정으로 시크릿을 관리하는 운영 환경 | `configurable` | 키 버전마다 환경 변수 또는 시크릿 하나. 저장소에는 넣지 않습니다 |
| 시크릿 관리자가 없는 서버 | `managed` | `key-store-path` 아래의 파일. 프로바이더가 애플리케이션 사용자만 읽을 수 있게 생성합니다(디렉터리 `rwx------`, 파일 `rw-------`). `master-key`와 `salt`는 환경 변수로 전달합니다 |
| Vault를 사용하는 운영 환경 | `vault` | Vault. 애플리케이션 전용 토큰 또는 역할로 TLS를 사용해 접근합니다 |

`simple` 프로바이더는 시작할 때 `SimpleKeyProvider initialized - DO NOT USE IN PRODUCTION`을 로그에 기록합니다. 운영 로그에 이 줄이 있으면 배포 실패로 처리하세요.

## 운영 중 확인 항목

```java
Map<String, Object> statistics = keyProvider.getKeyStatistics();
```

```text
{activeKeys=1, autoRotation=false, cachedKeys=2, currentVersion=v2, deprecatedKeys=1,
 deprecatedVersions=[v1], lastRotation=never, nextRotation=unknown,
 provider=ConfigurableKeyProvider, rotationDays=90, rotationEnabled=false, totalConfiguredKeys=2}
```

- `KeyProvider.getKeyStatistics()`는 프로바이더, 현재 버전, 교체 상태를 반환하며 프로바이더마다 항목이 추가됩니다. 관리자 화면이나 예약 점검에서 조회하고, `currentVersion`이 배포한 버전과 다르면 알림을 보내세요.
- 키 교체는 `Key rotated: <old> -> <new> (reason: <reason>, provider: <name>)` 형식으로 로그에 기록됩니다.
- 복호화할 수 없는 값은 해당 키 버전을 더 이상 사용할 수 없다는 뜻입니다. 행에서 사용 중인 버전은 모두 유지하고, 키를 제거하기 전에 사용 중인 버전을 집계하세요([키 교체](ko/encryption/rotating-keys.md)).

## 키 노출이 의심될 때

1. 새 키 버전을 추가해 현재 버전으로 지정합니다. 이후 새 값은 이 버전으로 기록됩니다([키 교체](ko/encryption/rotating-keys.md) 1단계). `managed`와 `vault` 프로바이더에서는 `keyProvider.rotateKey()`가 이 작업을 수행합니다. `configurable` 프로바이더는 키를 설정에서 읽으므로 현재 버전을 그대로 반환합니다.
2. 노출된 버전으로 암호화된 행을 다시 암호화합니다(2단계).
3. 노출된 버전을 사용하는 행이 없어지면 설정, 키 저장소 또는 Vault에서 해당 버전을 제거합니다(3단계).
4. 키가 노출된 경로를 확인합니다. 백업처럼 재암호화 전에 복사된 데이터는 노출된 버전의 키를 확보한 사람이 계속 읽을 수 있습니다.

## 배포 전 점검

- 운영 프로파일에서 `simple` 프로바이더를 사용하지 않습니다.
- 키, 마스터 키, salt가 저장소나 이미지에 포함되어 있지 않습니다.
- 저장된 행에서 사용 중인 키 버전이 모두 설정되어 있습니다.
- Vault 연결에 TLS를 사용합니다.
- 키 교체 담당자가 지정되어 있고, 운영 환경 밖에서 절차를 미리 수행해 보았습니다.

## 관련 문서

- [키 프로바이더 선택](ko/encryption/choosing-a-key-provider.md)
- [키 교체](ko/encryption/rotating-keys.md)
- [문제 해결](ko/encryption/troubleshooting.md)
