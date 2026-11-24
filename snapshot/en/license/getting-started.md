# Getting started with simplix-license

This page adds the module, tells it which product the application is and which keys verify its licenses, and registers a first license.

## Step 1. Add the module

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-license:${version}"
}
```

The [introduction](en/license/readme.md) lists the optional dependencies and the credentials of the SDK repository.

## Step 2. Name the product

```java
@Configuration
public class LicenseIdentityConfig {

    @Value("${application.version}")
    private String applicationVersion;

    @Bean
    public ProductIdentity productIdentity() {
        return new ProductIdentity() {

            @Override
            public String productCode() {
                return "ACPS-PORTAL";
            }

            @Override
            public String release() {
                return applicationVersion;
            }
        };
    }
}
```

A `ProductIdentity` bean is the one bean the application must declare. There is no default: a deployment that does not know which product it is cannot tell whether a token is meant for it, and the application does not start without the bean. `release()` is reported to the license server at activation and compared with the newest release the contract covers.

## Step 3. Add the verification keys

Put the public keys of the issuer into `src/main/resources/license-verification-keys.json`.

```json
[
  { "keyId": "acps-portal-2026", "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...", "compromised": false },
  { "keyId": "acps-portal-2024", "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...", "compromised": true }
]
```

| Member | Holds |
|---|---|
| `keyId` | the name a token carries to say which key signed it |
| `publicKeyPem` | the public key in X.509 PEM form |
| `compromised` | `true` for a signing key that leaked: tokens signed with it cannot grant more than the deployment already holds |

The file may hold several keys, so the issuer can change its signing key without invalidating the licenses signed before. The application does not start when the file is missing or empty, when an entry lacks its name or its key, or when a name appears twice.

## Step 4. Configure

```yaml
api:
  version:
    prefix: /api

application:
  license:
    product-key-prefix: ACPS
    grace-period-mode: READ_ONLY
    activation:
      server-url: https://license.example.com
```

The properties are under `application.license`, not under `simplix`. `api.version.prefix` is the prefix of your API: the module uses it to keep the login and the license endpoints open while the license is not valid. `product-key-prefix` is the first part of the product keys of this product family; it is part of the checksum of a key. Add `@EnableScheduling` to the application, so that the license is verified again while it runs.

## Step 5. Start, and register a license

Until a license is registered the status is `NOT_ACTIVATED`: the API answers with status 403, except the login, the license endpoints and the other paths listed in [Enforcing the license](en/license/enforcing-the-license.md). Sign in and activate.

```bash
curl -X POST "http://localhost:8080/api/deployment-license/activate" \
  -H "Authorization: Bearer <access token>" \
  -H "Content-Type: application/json" \
  -d '{"productKey": "ACPS-XXXX-XXXX-XXXX-XXXX"}'
```

The answer carries the status `VALID`, and the rest of the API opens. The start log shows the fingerprint of the verification key; it has to equal the fingerprint the license server records for its signing key.

## Next steps

- [Activating a license](en/license/activating-a-license.md)
- [Gating features](en/license/gating-features.md)
- [Limiting quantities](en/license/limiting-quantities.md)
