# simplix-auth 시작하기

모듈이 보호를 시작하기 전에 애플리케이션이 제공해야 하는 내용을 정리합니다. [애플리케이션 보안 적용](../../../docs/ko/securing-an-application.md)에서 같은 단계를 실행 예제로 안내합니다.

## 애플리케이션이 제공하는 내용

| 제공하는 내용 | 이유 | 없을 때 |
|---|---|---|
| `SimpliXUserDetailsService` 빈 | 모듈이 이 빈으로 사용자와 비밀번호 해시를 조회 | 보안 구성, 토큰 필터, 토큰 엔드포인트가 등록되지 않음 |
| 암호화 키 또는 키 교체 설정 | 토큰을 이 키로 암호화 | 애플리케이션이 시작되지 않음 |
| `PermissionEvaluator` 빈 | 생성된 컨트롤러가 `hasPermission(group, action)`으로 검사 | 해당 엔드포인트가 403으로 응답 |
| `/api` 아래의 API 경로 | 토큰 필터가 `/api/**`를 보호 | 토큰으로 호출해도 로그인 페이지로 이동 |

## 최소 설정

```yaml
simplix:
  auth:
    jwe:
      encryption-key-location: classpath:keys/jwe-key.json
```

키는 JSON Web Key 형식의 RSA 키입니다. 키를 만드는 명령은 [시작하기](../../../docs/ko/getting-started.md)에 있습니다.

## 사용자 정보 서비스 작성

모듈은 사용자를 저장하지 않습니다. 이 서비스에 이름으로 사용자를 요청하고, 애플리케이션의 `PasswordEncoder`로 요청의 비밀번호를 서비스가 반환한 해시와 비교합니다.

```java
@Service
@RequiredArgsConstructor
public class LibraryUserDetailsService implements SimpliXUserDetailsService {

    private final MemberRepository memberRepository;
    private final MessageSource messageSource;

    @Override
    public MessageSource getMessageSource() {
        return messageSource;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        Member member = memberRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(username));
        return User.withUsername(member.getUsername())
            .password(member.getPasswordHash())
            .roles(member.getRole())
            .build();
    }
}

@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

| `SimpliXUserDetailsService`의 메서드 | 작성 여부 | 동작 |
|---|---|---|
| `loadUserByUsername(username)` | 필수 | 비밀번호 해시와 권한이 포함된 사용자를 반환하거나 `UsernameNotFoundException`을 발생시킵니다 |
| `getMessageSource()` | 필수 | 모듈이 오류 응답에 사용하는 메시지 소스를 반환합니다 |
| `exists(username)` | 선택 | 사용자의 존재 여부를 반환합니다. 기본 구현은 사용자를 불러와 확인합니다 |
| `loadCurrentUser(authentication)` | 선택 | 인증 정보에 해당하는 사용자를 불러옵니다 |
| `isAccountLocked`, `isAccountExpired`, `isCredentialsExpired` | 선택 | `UserDetails`의 상태 값을 읽습니다 |
| `getUserAuthorities(username)` | 선택 | 사용자의 권한 이름 목록 |

### 사용자 정보 확장

`loadUserByUsername`은 Spring Security의 `User` 대신 애플리케이션의 클래스를 반환할 수 있습니다. 표시 이름처럼 추가 정보를 담을 때 사용합니다. 토큰으로 인증한 요청의 principal은 이 메서드가 반환한 객체입니다.

```java
@Getter
public class LibraryUser extends User {

    private final String displayName;

    public LibraryUser(String username, String passwordHash, Collection<? extends GrantedAuthority> authorities, String displayName) {
        super(username, passwordHash, authorities);
        this.displayName = displayName;
    }
}
```

```java
@GetMapping("/whoami")
public String whoAmI(@AuthenticationPrincipal LibraryUser user) {
    return user.getDisplayName();
}
```

## 전체 흐름 확인

```bash
# 1. Sign in: the answer carries accessToken and refreshToken
curl -X POST -u alice:secret http://localhost:8080/auth/token/issue

# 2. Call the API
curl -H "Authorization: Bearer <access token>" http://localhost:8080/api/catalog/author/search

# 3. Renew the pair before the access token expires
curl -X POST -H "X-Refresh-Token: <refresh token>" http://localhost:8080/auth/token/refresh

# 4. Sign out
curl -X POST -H "Authorization: Bearer <access token>" -H "X-Refresh-Token: <refresh token>" http://localhost:8080/auth/token/revoke
```

```json
{
  "accessToken" : "<token>",
  "refreshToken" : "<token>",
  "accessTokenExpiry" : "<time with zone>",
  "refreshTokenExpiry" : "<time with zone>"
}
```

수명을 변경하지 않으면 액세스 토큰은 30분, 리프레시 토큰은 7일 동안 유효합니다. 폐기는 블랙리스트를 켠 경우에만 적용됩니다. [토큰 폐기](./revoking-tokens.md)를 참고하세요.

## 상황별 다음 문서

| 목적 | 문서 |
|---|---|
| 일부 경로를 공개하거나 로그인이 필요한 경로를 변경 | [경로 보호](./securing-paths.md) |
| 로그아웃을 즉시 적용 | [토큰 폐기](./revoking-tokens.md) |
| 사용자를 로그아웃시키지 않고 암호화 키 교체 | [키 교체](./rotating-keys.md) |
| Google, Kakao 등 프로바이더 계정으로 로그인 | [소셜 계정 로그인](./signing-in-with-social-accounts.md) |
| 다른 시스템이 발급한 토큰 수용 | [외부 토큰 수용](./accepting-external-tokens.md) |
| 요청에 응답하는 구성 요소 확인 | [simplix-auth 동작 방식](./how-it-works.md) |

## 다음 단계

- [토큰 발급과 갱신](./issuing-and-refreshing-tokens.md)
- [경로 보호](./securing-paths.md)
- [문제 해결](./troubleshooting.md)
