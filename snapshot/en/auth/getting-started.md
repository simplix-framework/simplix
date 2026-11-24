# Getting started with simplix-auth

What the module needs from an application before it protects anything. [Securing an application](en/securing-an-application.md) walks through the same steps with a running example.

## What you provide

| You provide | Why | Without it |
|---|---|---|
| a `SimpliXUserDetailsService` bean | the module loads users and their password hashes through it | the security configuration, the token filter and the token endpoints are not registered |
| an encryption key, or key rotation | tokens are encrypted with it | the application does not start |
| a `PermissionEvaluator` bean | the generated controllers ask `hasPermission(group, action)` | those endpoints answer 403 |
| API paths under `/api` | the token filter guards `/api/**` | a call with a token is sent to the login page |

## The smallest configuration

```yaml
simplix:
  auth:
    jwe:
      encryption-key-location: classpath:keys/jwe-key.json
```

The key is an RSA key in JSON Web Key format. [Getting started](en/getting-started.md) shows the command that creates it.

## Write the user details service

The module never stores users. It asks this service for a user by name and compares the password of the request with the hash the service returns, using the `PasswordEncoder` of the application.

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

| Method of `SimpliXUserDetailsService` | You write it | Does |
|---|---|---|
| `loadUserByUsername(username)` | yes | returns the user with the password hash and the authorities, or throws `UsernameNotFoundException` |
| `getMessageSource()` | yes | gives the module the messages of its error answers |
| `exists(username)` | optional | tells whether a user exists; by default it tries to load the user |
| `loadCurrentUser(authentication)` | optional | loads the user of an authentication |
| `isAccountLocked`, `isAccountExpired`, `isCredentialsExpired` | optional | read the flags of the `UserDetails` |
| `getUserAuthorities(username)` | optional | the names of the authorities of a user |

### Carry your own user data

`loadUserByUsername` may return a class of your own instead of the `User` of Spring Security, for example to carry a display name. With a token, the principal of each request is the object this method returned.

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

## Try the whole cycle

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

An access token is valid for 30 minutes and a refresh token for 7 days unless you change the lifetimes. Revoking has an effect only with the blacklist on; see [Revoking tokens](en/auth/revoking-tokens.md).

## Where to go from here

| You want to | Read |
|---|---|
| open some paths, or change which paths need a login | [Securing paths](en/auth/securing-paths.md) |
| make a sign-out take effect at once | [Revoking tokens](en/auth/revoking-tokens.md) |
| replace the encryption key without signing users out | [Rotating keys](en/auth/rotating-keys.md) |
| let users sign in with Google, Kakao or another provider | [Signing in with social accounts](en/auth/signing-in-with-social-accounts.md) |
| accept tokens another system issues | [Accepting external tokens](en/auth/accepting-external-tokens.md) |
| understand which part answers a request | [How simplix-auth works](en/auth/how-it-works.md) |

## Next steps

- [Issuing and refreshing tokens](en/auth/issuing-and-refreshing-tokens.md)
- [Securing paths](en/auth/securing-paths.md)
- [Troubleshooting](en/auth/troubleshooting.md)
