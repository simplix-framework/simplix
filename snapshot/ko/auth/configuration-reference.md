# 설정 레퍼런스

`simplix.auth` 아래에 있는 모듈의 모든 속성을 정리합니다.

## 모듈

| 속성 | 기본값 | 의미 |
|---|---|---|
| `enabled` | `true` | 모듈의 보안 구성 사용 |

## 암호화 키

| 속성 | 기본값 | 의미 |
|---|---|---|
| `jwe.encryption-key-location` | 없음 | `classpath:keys/jwe-key.json`처럼 지정하는 JSON Web Key 형식 RSA 키의 위치 |
| `jwe.encryption-key` | 없음 | 같은 키를 값으로 직접 지정 |
| `jwe.algorithm` | `RSA-OAEP-256` | 키 암호화 알고리즘 |
| `jwe.encryption-method` | `A256GCM` | 콘텐츠 암호화 방식 |
| `jwe.key-rolling.enabled` | `false` | 키를 `JweKeyStore`에 보관하고 교체 |
| `jwe.key-rolling.key-size` | `2048` | 생성하는 RSA 키의 크기(비트) |
| `jwe.key-rolling.auto-initialize` | `true` | 저장소가 비어 있으면 첫 키 생성 |
| `jwe.key-rolling.retention.buffer-seconds` | `86400` | 키 만료 시각을 정할 때 리프레시 토큰 유효 시간에 더하는 값 |
| `jwe.key-rolling.retention.auto-cleanup` | `false` | 교체할 때 만료된 키 삭제 |

## 토큰

| 속성 | 기본값 | 의미 |
|---|---|---|
| `token.access-token-lifetime` | `1800` | 액세스 토큰의 유효 시간(초) |
| `token.refresh-token-lifetime` | `604800` | 리프레시 토큰의 유효 시간(초) |
| `token.enable-token-rotation` | `true` | 갱신할 때마다 새 리프레시 토큰 발급 |
| `token.enable-ip-validation` | `false` | 다른 IP 주소에서 보낸 토큰 거부 |
| `token.enable-user-agent-validation` | `false` | 다른 사용자 에이전트가 보낸 토큰 거부 |
| `token.create-session-on-token-issue` | `true` | 토큰을 발급할 때 HTTP 세션 시작 |
| `token.enable-blacklist` | `false` | 폐기한 토큰 거부 |
| `token.blacklist-store` | `AUTO` | `AUTO`, `REDIS`, `NATS`, `CAFFEINE`, `MEMORY` 중 하나 |
| `token.blacklist-nats-bucket` | `simplix-auth-blacklist` | NATS 키-값 버킷 |
| `token.blacklist-nats-max-retention` | 7일 | NATS 버킷에 항목을 보관하는 최대 기간 |
| `token.blacklist-failure-mode` | `FAIL_CLOSED` | 저장소에 연결할 수 없을 때의 동작: `FAIL_CLOSED` 또는 `FAIL_OPEN` |

## 보안

| 속성 | 기본값 | 의미 |
|---|---|---|
| `security.enable-token-endpoints` | `true` | 토큰 엔드포인트, 토큰 필터, 토큰 프로바이더 등록 |
| `security.enable-web-security` | `true` | 웹 체인과 로그인 페이지 등록 |
| `security.permit-all-patterns` | 없음 | 로그인 없이 접근할 수 있는 경로 |
| `security.prefer-token-over-session` | `true` | 요청에 토큰과 세션이 모두 있으면 토큰으로 인증 |
| `security.enable-cors` | `true` | CORS 설정을 웹 체인에 적용합니다. 토큰 체인과 API 체인에는 항상 적용됩니다 |
| `security.enable-csrf` | `true` | 웹 체인의 CSRF 보호 |
| `security.csrf-ignore-patterns` | `/api/token/**`, `/h2-console/**` | CSRF에서 제외할 웹 체인 경로 |
| `security.enable-http-basic` | `false` | 웹 체인에서 HTTP Basic 허용 |
| `security.require-https` | `false` | 웹 체인을 HTTPS로 리다이렉트 |
| `security.enable-hsts` | `true` | `Strict-Transport-Security` 전송 |
| `security.hsts-max-age-seconds` | `31536000` | 해당 헤더의 `max-age` |
| `security.login-page-template` | `login` | 로그인 페이지의 Thymeleaf 템플릿 |
| `security.login-page-path` | `/login` | 로그인 페이지 경로 |
| `security.login-processing-url` | `/login` | 로그인 폼을 전송하는 주소 |
| `security.logout-url` | `/logout` | 로그아웃 경로 |
| `security.content-security-policy` | 허용 범위가 넓은 정책 | `Content-Security-Policy` 헤더 |
| `security.frame-options` | `SAMEORIGIN` | `SAMEORIGIN` 또는 `DENY` |
| `security.referrer-policy` | 전송하지 않음 | `Referrer-Policy` 헤더 |
| `security.permissions-policy` | 전송하지 않음 | `Permissions-Policy` 헤더 |

## CORS

| 속성 | 기본값 | 의미 |
|---|---|---|
| `cors.allowed-origins` | 없음 | 브라우저의 호출을 허용할 정확한 출처 |
| `cors.allowed-origin-patterns` | 없음 | `https://*.example.com` 같은 출처 패턴. `allowed-origins`보다 우선합니다 |
| `cors.allowed-methods` | 없음 | 허용하는 HTTP 메서드 |
| `cors.allowed-headers` | 없음 | 허용하는 요청 헤더 |
| `cors.exposed-headers` | 없음 | 스크립트가 읽을 수 있는 응답 헤더 |
| `cors.allow-credentials` | 없음 | 쿠키와 인증 헤더 허용 여부 |
| `cors.max-age` | 없음 | 브라우저가 사전 요청 응답을 캐시하는 시간(초) |

## 소셜 로그인

| 속성 | 기본값 | 의미 |
|---|---|---|
| `oauth2.enabled` | `true` | `OAuth2AuthenticationService` 빈이 있을 때 소셜 로그인 사용 |
| `oauth2.success-url` | `/` | 로그인 성공 후 이동할 주소 |
| `oauth2.failure-url` | `/login?error=social` | 로그인 실패 후 이동할 주소 |
| `oauth2.link-success-url` | `/settings/social?linked=true` | 연동 성공 후 이동할 주소 |
| `oauth2.link-failure-url` | `/settings/social?error=link_failed` | 연동 실패 후 이동할 주소 |
| `oauth2.authorization-base-url` | `/oauth2/authorize` | 로그인 링크의 기본 경로 |
| `oauth2.login-base-url` | `/oauth2/login` | 로그인 전용 링크의 기본 경로 |
| `oauth2.register-base-url` | `/oauth2/register` | 가입 전용 링크의 기본 경로 |
| `oauth2.link-base-url` | `/oauth2/link` | 계정 연동 링크의 기본 경로 |
| `oauth2.callback-base-url` | `/oauth2/callback` | 콜백의 기본 경로 |
| `oauth2.email-conflict-policy` | `REJECT` | `REJECT` 또는 `AUTO_LINK` |
| `oauth2.token-delivery-method` | `COOKIE` | `COOKIE`, `POST_MESSAGE`, `REDIRECT` 중 하나 |
| `oauth2.allowed-origins` | 없음 | `postMessage`로 토큰을 받을 수 있는 출처 |
| `oauth2.pending-registration-ttl-seconds` | `600` | 대기 중인 가입 정보를 보관하는 시간 |
| `oauth2.cookie.access-token-name` | `access_token` | 액세스 토큰 쿠키 이름 |
| `oauth2.cookie.refresh-token-name` | `refresh_token` | 리프레시 토큰 쿠키 이름 |
| `oauth2.cookie.path` | `/` | 쿠키 경로 |
| `oauth2.cookie.http-only` | `true` | 스크립트에서 쿠키에 접근하지 못하도록 설정 |
| `oauth2.cookie.secure` | `true` | HTTPS에서만 쿠키 전송 |
| `oauth2.cookie.same-site` | `Lax` | `SameSite` 속성 |

## 리소스 서버

| 속성 | 기본값 | 의미 |
|---|---|---|
| `resource-server.enabled` | `false` | 외부 발급자의 Bearer JWT 수용 |
| `resource-server.path-patterns` | `/api/**` | 토큰이 필요한 경로 |
| `resource-server.issuers[].name` | 필수 | 발급자의 이름 |
| `resource-server.issuers[].issuer-uri` | 필수 | 토큰의 `iss` 값 |
| `resource-server.issuers[].jwk-set-uri` | 자동 조회 | 서명 키의 위치 |
| `resource-server.issuers[].audiences` | 없음 | 허용하는 `aud` 값 |

## 서명기

| 속성 | 기본값 | 의미 |
|---|---|---|
| `stateless-token.secret` | 시작할 때마다 임의의 키 | `SimpliXStatelessTokenSigner`의 HMAC 시크릿 |
| `asymmetric-token.key-file` | 없음 | `SimpliXAsymmetricTokenSigner`의 키 파일 |
| `asymmetric-token.private-key`, `asymmetric-token.public-key` | 없음 | base64 DER 형식의 Ed25519 키 쌍 |
| `asymmetric-token.key-id` | `default` | 토큰에 기록하는 키 ID |

## 관련 문서

- [경로 보호](ko/auth/securing-paths.md)
- [토큰 발급과 갱신](ko/auth/issuing-and-refreshing-tokens.md)
