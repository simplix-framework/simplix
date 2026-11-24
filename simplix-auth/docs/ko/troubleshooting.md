# 문제 해결

로그인이나 토큰의 실패 증상별 원인과 해결 방법을 정리합니다.

## 애플리케이션이 시작되지 않을 때

| 메시지 | 원인 | 해결 |
|---|---|---|
| `Security key is not configured. Please set simplix.auth.jwt.secret-key` | 암호화 키를 설정하지 않았습니다. 메시지에 적힌 속성은 존재하지 않습니다 | `simplix.auth.jwe.encryption-key-location`을 설정하거나 키 교체 모드를 사용 |
| `Failed to load security key from ...` | 해당 위치에 키 파일이 없음 | 경로와 파일이 클래스패스에 있는지 확인 |
| `NoClassDefFoundError: org/springframework/security/oauth2/client/...` | OAuth2 클라이언트 라이브러리 없이 `OAuth2AuthenticationService` 빈을 등록함 | `spring-boot-starter-oauth2-client`를 추가 |
| `No qualifying bean of type 'ClientRegistrationRepository'` | 소셜 로그인이 활성화되었으나 등록된 제공자가 없음 | `spring.security.oauth2.client.registration`을 하나 이상 설정 |

## 호출이 거부될 때

| 증상 | 원인 | 해결 |
|---|---|---|
| 모든 경로가 본문 없이 401로 응답 | `SimpliXUserDetailsService` 빈이 없어 모듈이 활성화되지 않음 | 빈을 등록 |
| 발급이 401과 `AUTH_INVALID_CREDENTIALS`로 응답 | 자격 증명이 틀렸거나, 해시가 `PasswordEncoder` 빈으로 만든 것이 아님 | 등록된 인코더로 만든 해시를 저장 |
| 유효한 토큰으로 호출한 API가 `/login`으로 리다이렉트됨 | 경로가 `/api/` 밖에 있음 | 컨트롤러를 `/api` 아래에 제공 |
| 401과 `AUTH_TOKEN_INVALID`, 「Token authentication failed」 | 토큰 형식이 잘못되었거나, 이 인스턴스에 없는 키로 암호화됨 | 모든 인스턴스가 같은 키를 사용하는지 확인. 키 교체 모드에서는 정적 키를 제거 |
| 401과 `AUTH_TOKEN_INVALID`, 「You have been logged out」 | 토큰이 폐기되었거나, 리프레시 토큰을 두 번 사용함 | 다시 로그인. 가장 최근의 리프레시 토큰만 보관 |
| 모든 사용자에게 403과 `AUTHZ_INSUFFICIENT_PERMISSIONS`로 응답 | `PermissionEvaluator` 빈이 없음 | 빈을 등록 |
| 사용자가 네트워크를 바꾸면 토큰을 사용할 수 없음 | `enable-ip-validation`이 켜져 있음 | 모바일 클라이언트에서는 비활성화 |

## 브라우저 클라이언트가 실패할 때

| 증상 | 원인 | 해결 |
|---|---|---|
| `Access-Control-Allow-Origin` 누락 | 허용되지 않은 출처 | `simplix.auth.cors.allowed-origins`에 추가 |
| 로그아웃해도 토큰을 계속 사용할 수 있음 | 블랙리스트가 꺼져 있음 | `simplix.auth.token.enable-blacklist: true`를 설정 |
| 폐기한 토큰을 다른 인스턴스에서 계속 사용할 수 있음 | 블랙리스트를 로컬에 보관함 | `blacklist-store: REDIS` 또는 `NATS`를 사용 |
| 소셜 로그인이 `/login?error=social`로 돌아옴 | 링크의 제공자가 등록되지 않았거나 제공자가 로그인을 거부함 | 등록 ID와 제공자 콘솔에 입력한 리다이렉트 URI를 확인 |

## 관련 문서

- [시작하기](./getting-started.md)
- [인증 모니터링](./monitoring-authentication.md)
