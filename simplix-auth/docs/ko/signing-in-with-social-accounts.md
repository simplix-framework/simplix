# 소셜 계정 로그인

Google, Kakao, Naver, GitHub, Facebook, Apple 또는 OpenID Connect 제공자의 계정으로 로그인하는 기능을 설명합니다. OAuth2 교환은 Spring Security가 처리합니다. SimpliX는 제공자의 프로필을 같은 형태로 변환하고, 애플리케이션에 해당 사용자를 조회한 뒤, 클라이언트에 SimpliX 토큰을 전달합니다.

## 준비

- 의존성에 `org.springframework.boot:spring-boot-starter-oauth2-client` 추가. 모듈은 이 라이브러리로 컴파일하지만 함께 가져오지는 않습니다.
- 제공자별 클라이언트 ID와 시크릿. 제공자 콘솔에는 등록 설정의 리다이렉트 URI를 입력합니다. 등록에 `redirect-uri`를 지정하지 않으면 `{baseUrl}/login/oauth2/code/{registrationId}`입니다.

## 1단계. 제공자 등록

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid, profile, email
          kakao:
            client-id: ${KAKAO_CLIENT_ID}
            client-secret: ${KAKAO_CLIENT_SECRET}
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/oauth2/callback/{registrationId}"
            scope: profile_nickname, account_email
            client-authentication-method: client_secret_post
        provider:
          kakao:
            authorization-uri: https://kauth.kakao.com/oauth/authorize
            token-uri: https://kauth.kakao.com/oauth/token
            user-info-uri: https://kapi.kakao.com/v2/user/me
            user-name-attribute: id

simplix:
  auth:
    oauth2:
      success-url: /dashboard
      failure-url: /login?error=social
      token-delivery-method: COOKIE
      email-conflict-policy: REJECT
```

Google은 클라이언트 ID와 시크릿만 지정하면 됩니다. Kakao, Naver처럼 Spring Security에 정의되어 있지 않은 제공자는 `provider` 아래에 엔드포인트도 지정해야 합니다. 클라이언트 ID가 비어 있는 등록은 건너뛰므로, 일부 제공자를 설정하지 않은 환경에서도 같은 설정 파일을 사용할 수 있습니다. 다만 등록이 하나도 남지 않으면 애플리케이션이 시작되지 않습니다.

### 모듈이 지원하는 프로바이더

| 등록 ID | 프로토콜 | 추출기 | 사용자 식별자 |
|---|---|---|---|
| `google` | OpenID Connect | `GoogleUserInfoExtractor` | `sub` |
| `kakao` | OpenID Connect | `KakaoUserInfoExtractor` | `id`. 이메일 주소와 닉네임은 `kakao_account`에서 읽습니다 |
| `naver` | OAuth2 | `NaverUserInfoExtractor` | `response` 안의 `id` |
| `github` | OAuth2 | `GitHubUserInfoExtractor` | `id`. `login`이 사용자 이름입니다 |
| `facebook` | OAuth2 | `FacebookUserInfoExtractor` | `id` |
| `apple` | OpenID Connect | `AppleUserInfoExtractor` | `sub` |
| 그 밖의 OpenID Connect 프로바이더 | OpenID Connect | `StandardOidcUserInfoExtractor` | `sub`와 표준 클레임 |

각 추출기는 `OAuth2UserInfoExtractorStrategy`입니다. `OAuth2UserInfoExtractor`가 `getProviderType()`이 등록 정보와 일치하는 추출기를 선택합니다. 등록 ID는 `OAuth2ProviderType` 이름의 소문자 형태입니다.

## 2단계. 사용자 조회 구현

`OAuth2AuthenticationService`를 구현하세요. 이 빈이 있으면 소셜 로그인이 활성화됩니다.

```java
@Service
@RequiredArgsConstructor
public class LibraryOAuth2Service implements OAuth2AuthenticationService {

    private final SocialConnectionRepository connections;
    private final LibraryUserDetailsService users;

    @Override
    public UserDetails authenticateOAuth2User(OAuth2UserInfo userInfo) {
        return connections.findByProviderAndProviderId(userInfo.getProvider(), userInfo.getProviderId())
            .map(connection -> users.loadUserByUsername(connection.getUsername()))
            .orElseThrow(() -> new UsernameNotFoundException(userInfo.getEmail()));
    }

    @Override
    public void linkSocialAccount(String userId, OAuth2UserInfo userInfo) {
        connections.save(new SocialConnection(userId, userInfo.getProvider(), userInfo.getProviderId()));
    }

    @Override
    public void unlinkSocialAccount(String userId, OAuth2ProviderType provider) {
        connections.deleteByUsernameAndProvider(userId, provider);
    }

    @Override
    public Set<OAuth2ProviderType> getLinkedProviders(String userId) {
        return connections.findProvidersByUsername(userId);
    }
}
```

`OAuth2UserInfo`는 모든 제공자에서 같은 형태입니다: `provider`, `providerId`, `email`, `emailVerified`, `name`, `firstName`, `lastName`, `profileImageUrl`, `locale`, 원본 `attributes`.

## 3단계. 제공자로 이동

| 링크 | 동작 |
|---|---|
| `/oauth2/authorize/{provider}` | 로그인합니다. 처음 사용하는 소셜 계정이면 계정을 생성합니다 |
| `/oauth2/login/{provider}` | 로그인만 처리합니다. 연동되지 않은 소셜 계정은 `NO_LINKED_ACCOUNT`로 실패합니다 |
| `/oauth2/register/{provider}` | 가입만 처리합니다. 이미 연동된 소셜 계정은 실패합니다 |
| `/oauth2/link/{provider}` | 로그인한 사용자에게 소셜 계정을 연동합니다 |
| `/oauth2/callback/{provider}` | 등록에 `redirect-uri: "{baseUrl}/oauth2/callback/{registrationId}"`를 지정했을 때 제공자가 돌아오는 주소입니다. 페이지에서 직접 호출하지 않습니다 |

등록되지 않은 제공자를 가리키는 링크는 `failure-url`로 이동합니다.

사용자가 거친 링크는 `OAuth2Intent`(`AUTO`, `LOGIN`, `REGISTER`)로 서비스에 전달됩니다. 인텐트별로 다르게 처리하려면 `authenticateOAuth2User(userInfo, intent)`를 재정의하세요.

## 토큰 전달 방식

| `token-delivery-method` | 로그인 성공 후 동작 | 적합한 경우 |
|---|---|---|
| `COOKIE`(기본값) | 토큰을 HttpOnly 쿠키로 설정하고 `success-url`로 리다이렉트 | 같은 사이트의 웹 애플리케이션 |
| `POST_MESSAGE` | `window.postMessage`로 토큰을 오프너에 전달하는 페이지를 렌더링합니다. 오프너의 출처가 `allowed-origins`에 있어야 합니다 | 제공자를 팝업으로 여는 단일 페이지 애플리케이션 |
| `REDIRECT` | `success-url`의 쿼리 문자열에 토큰을 추가 | 네이티브 클라이언트. 토큰이 브라우저 기록에 남습니다 |

## 이미 계정이 있는 이메일

| `email-conflict-policy` | 동작 |
|---|---|
| `REJECT`(기본값) | 로그인을 거부합니다. 사용자는 기존 방식으로 로그인한 뒤 소셜 계정을 연동합니다 |
| `AUTO_LINK` | 기존 사용자에게 소셜 계정을 연동합니다. 편리하지만 제공자의 이메일 인증 수준에 안전성이 좌우됩니다 |

## 신규 사용자의 추가 정보 입력

제공자가 주는 정보만으로 가입할 수 없으면, 사용자가 폼을 작성하는 동안 프로필을 세션에 `PendingSocialRegistration`으로 보관합니다. `pending-registration-ttl-seconds`(600)가 지나면 만료됩니다.

```java
PendingSocialRegistration pending = (PendingSocialRegistration)
    session.getAttribute(PendingSocialRegistration.SESSION_ATTR);

if (pending == null || pending.isExpired()) {
    throw new SimpliXGeneralException(ErrorCode.GEN_BAD_REQUEST, "Social registration expired", null);
}
```

## 관련 문서

- [토큰 발급과 갱신](./issuing-and-refreshing-tokens.md)
- [설정 레퍼런스](./configuration-reference.md)
