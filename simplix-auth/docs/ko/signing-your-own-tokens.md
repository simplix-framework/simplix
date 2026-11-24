# 자체 토큰 서명

로그인이 아닌 단기 토큰을 위한 서명기를 설명합니다. 서명된 다운로드 링크, 일회용 QR 코드, 장치가 오프라인으로 검증하는 토큰에 사용합니다. 모듈의 다른 기능을 사용하지 않아도 등록됩니다.

## 서버가 다시 읽는 토큰

`SimpliXStatelessTokenSigner`는 페이로드를 HMAC-SHA256으로 서명해 URL에 안전한 `payload.signature` 토큰을 만들고, 저장 없이 검증합니다. 페이로드가 변경되지 않았고 이 애플리케이션이 발급했음을 보장합니다. 만료 시각은 페이로드에 직접 넣고 직접 검사해야 합니다.

```java
@Service
@RequiredArgsConstructor
public class DownloadLinks {

    private final SimpliXStatelessTokenSigner signer;

    public String linkFor(String fileId) {
        long expiresAt = Instant.now().plusSeconds(300).getEpochSecond();
        return "/api/files/download?token=" + signer.sign(fileId + ":" + expiresAt);
    }

    public String fileIdOf(String token) {
        String payload = signer.verify(token)
            .orElseThrow(() -> new SimpliXGeneralException(ErrorCode.AUTH_TOKEN_INVALID, "Invalid link", null));
        String[] parts = payload.split(":");
        if (Instant.now().getEpochSecond() > Long.parseLong(parts[1])) {
            throw new SimpliXGeneralException(ErrorCode.AUTH_TOKEN_EXPIRED, "Link expired", null);
        }
        return parts[0];
    }
}
```

```yaml
simplix:
  auth:
    stateless-token:
      secret: ${LINK_SIGNING_SECRET}
```

> ⚠ `stateless-token.secret`을 지정하지 않으면 시작할 때마다 임의의 키를 생성합니다. 재시작하면 기존 링크를 사용할 수 없고 인스턴스마다 키가 다릅니다. 운영 환경에서는 반드시 지정하세요.

## 다른 쪽에서 검증하는 토큰

`SimpliXAsymmetricTokenSigner`는 Ed25519로 서명한 컴팩트 JWS(`alg` `EdDSA`)를 만듭니다. 공개 키만 보유한 클라이언트가 서버를 호출하지 않고 토큰을 검증합니다. `publicJwk()`는 게시할 공개 키를 JSON Web Key로 반환합니다.

| 속성 | 의미 |
|---|---|
| `simplix.auth.asymmetric-token.key-file` | 키 쌍을 보관하는 파일. 파일이 없으면 처음 실행할 때 새 키 쌍을 기록합니다 |
| `simplix.auth.asymmetric-token.private-key`, `public-key` | 파일 대신 지정하는 base64 DER 형식(PKCS#8, X.509)의 키 쌍 |
| `simplix.auth.asymmetric-token.key-id` | 토큰과 게시하는 키에 기록할 키 ID. 지정하지 않으면 `default`입니다 |

파일과 키를 모두 지정하지 않으면 이번 실행에서만 사용하는 키 쌍을 생성합니다.

## 관련 문서

- [토큰 발급과 갱신](./issuing-and-refreshing-tokens.md)
- [simplix-file](../../../simplix-file/README.ko.md)
