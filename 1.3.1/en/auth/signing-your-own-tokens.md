# Signing your own tokens

Signers for short-lived tokens that are not logins: a signed download link, a one-time QR code, a token a device verifies offline. They are registered whether or not the rest of the module is on.

## A token the server reads back

`SimpliXStatelessTokenSigner` signs a payload with HMAC-SHA256 into a URL-safe `payload.signature` token and verifies it without storing anything. It guarantees that the payload is unchanged and came from this application; the expiry is yours to put in the payload and check.

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

> ⚠ Without `stateless-token.secret` a random key is generated at each start, so links stop working after a restart and differ between instances. Set it in production.

## A token somebody else verifies

`SimpliXAsymmetricTokenSigner` signs with Ed25519 as a compact JWS (`alg` `EdDSA`). A client that holds only the public key verifies the token without calling the server. `publicJwk()` gives the public key as a JSON Web Key to publish.

| Property | Meaning |
|---|---|
| `simplix.auth.asymmetric-token.key-file` | a file that holds the key pair; it is written with a new pair the first time it is missing |
| `simplix.auth.asymmetric-token.private-key`, `public-key` | the pair as base64 DER (PKCS#8 and X.509), instead of a file |
| `simplix.auth.asymmetric-token.key-id` | the key id written into tokens and the published key; `default` when not set |

With neither a file nor a key, a pair is generated for this run only.

## Related documents

- [Issuing and refreshing tokens](en/auth/issuing-and-refreshing-tokens.md)
- [simplix-file](en/file/readme.md)
