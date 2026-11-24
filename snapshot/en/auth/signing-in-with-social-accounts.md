# Signing in with social accounts

How to let users sign in with an account of Google, Kakao, Naver, GitHub, Facebook, Apple or any OpenID Connect provider. Spring Security runs the OAuth2 exchange; SimpliX turns the provider's profile into one shape, asks your application which user it is, and hands the client SimpliX tokens.

## Before you begin

- `org.springframework.boot:spring-boot-starter-oauth2-client` among the dependencies: the module compiles against it and does not bring it.
- A client id and secret from each provider, with the redirect URI of your registration entered at the provider: `{baseUrl}/login/oauth2/code/{registrationId}` unless the registration sets `redirect-uri`.

## Step 1. Register the providers

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

Google needs only the client id and secret. Providers Spring Security does not know, such as Kakao and Naver, also need their endpoints under `provider`. A registration whose client id is empty is skipped, so one configuration file can serve environments where some providers are not set up. At least one registration has to remain: with none the application does not start.

### Providers the module reads

| Registration id | Protocol | Extractor | Identifier of the user |
|---|---|---|---|
| `google` | OpenID Connect | `GoogleUserInfoExtractor` | `sub` |
| `kakao` | OpenID Connect | `KakaoUserInfoExtractor` | `id`; the e-mail address and the nickname are read from `kakao_account` |
| `naver` | OAuth2 | `NaverUserInfoExtractor` | `id` inside `response` |
| `github` | OAuth2 | `GitHubUserInfoExtractor` | `id`; `login` is the user name |
| `facebook` | OAuth2 | `FacebookUserInfoExtractor` | `id` |
| `apple` | OpenID Connect | `AppleUserInfoExtractor` | `sub` |
| any other OpenID Connect provider | OpenID Connect | `StandardOidcUserInfoExtractor` | `sub`, with the standard claims |

Each extractor is an `OAuth2UserInfoExtractorStrategy`; `OAuth2UserInfoExtractor` picks the one whose `getProviderType()` matches the registration. The registration id is the lower-case name of the `OAuth2ProviderType`.

## Step 2. Tell SimpliX who the user is

Implement `OAuth2AuthenticationService`. Social login is active once this bean exists.

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

`OAuth2UserInfo` is the same for every provider: `provider`, `providerId`, `email`, `emailVerified`, `name`, `firstName`, `lastName`, `profileImageUrl`, `locale`, and the raw `attributes`.

## Step 3. Send the user to the provider

| Link | Does |
|---|---|
| `/oauth2/authorize/{provider}` | signs in, or creates the account when the social account is new |
| `/oauth2/login/{provider}` | signs in only; a social account that is not linked fails with `NO_LINKED_ACCOUNT` |
| `/oauth2/register/{provider}` | registers only; a social account that is already linked fails |
| `/oauth2/link/{provider}` | links the social account to the user who is signed in |
| `/oauth2/callback/{provider}` | where the provider returns when the registration sets `redirect-uri: "{baseUrl}/oauth2/callback/{registrationId}"`; not called by your pages |

A link that names a provider with no registration is sent to `failure-url`.

The link the user came through reaches your service as an `OAuth2Intent`: `AUTO`, `LOGIN` or `REGISTER`. Override `authenticateOAuth2User(userInfo, intent)` to treat them differently.

## How the tokens reach the client

| `token-delivery-method` | After a successful login | Suits |
|---|---|---|
| `COOKIE` (default) | sets the tokens as HttpOnly cookies and redirects to `success-url` | web applications on the same site |
| `POST_MESSAGE` | renders a page that sends the tokens to the opener with `window.postMessage`; the opener's origin must be in `allowed-origins` | single-page applications that open the provider in a popup |
| `REDIRECT` | adds the tokens to the query string of `success-url` | native clients; the tokens appear in the browser history |

## An e-mail address that already has an account

| `email-conflict-policy` | Behaviour |
|---|---|
| `REJECT` (default) | refuses the login; the user signs in the usual way and links the social account |
| `AUTO_LINK` | links the social account to the existing user; convenient, and only as safe as the provider's e-mail verification |

## Ask a new user for more

When a registration needs more than the provider gives, the profile is kept in the session as a `PendingSocialRegistration` while the user fills in your form. It expires after `pending-registration-ttl-seconds` (600).

```java
PendingSocialRegistration pending = (PendingSocialRegistration)
    session.getAttribute(PendingSocialRegistration.SESSION_ATTR);

if (pending == null || pending.isExpired()) {
    throw new SimpliXGeneralException(ErrorCode.GEN_BAD_REQUEST, "Social registration expired", null);
}
```

## Related documents

- [Issuing and refreshing tokens](en/auth/issuing-and-refreshing-tokens.md)
- [Configuration reference](en/auth/configuration-reference.md)
