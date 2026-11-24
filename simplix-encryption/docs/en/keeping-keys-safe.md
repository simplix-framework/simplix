# Keeping keys safe

How to create a key, where to keep it in each environment, what to watch while the application runs, and what to do when a key may have leaked.

## Create a key

```bash
openssl rand -base64 32
```

A key is 32 random bytes in Base64. Take it from a cryptographic random source, as above. A word, a sentence or a value produced by a web page is not a key, and a key is used in one environment only.

## Where the key lives

| Environment | Provider | Key material |
|---|---|---|
| development, tests | `simple` | the built-in development text, or `static-key` in the local configuration |
| staging, production with secrets in configuration | `configurable` | one environment variable or secret per key version, never the repository |
| a server without a secret manager | `managed` | files under `key-store-path`, which the provider creates readable by the application user only (directory `rwx------`, files `rw-------`); `master-key` and `salt` come from the environment |
| production with Vault | `vault` | Vault, reached over TLS with a token or role of the application only |

The `simple` provider logs `SimpleKeyProvider initialized - DO NOT USE IN PRODUCTION` at start. Treat that line in a production log as a failed deployment.

## What to watch

```java
Map<String, Object> statistics = keyProvider.getKeyStatistics();
```

```text
{activeKeys=1, autoRotation=false, cachedKeys=2, currentVersion=v2, deprecatedKeys=1,
 deprecatedVersions=[v1], lastRotation=never, nextRotation=unknown,
 provider=ConfigurableKeyProvider, rotationDays=90, rotationEnabled=false, totalConfiguredKeys=2}
```

- `KeyProvider.getKeyStatistics()` names the provider, the current version and the rotation state; each provider adds entries of its own. Expose it on an administrator screen or a scheduled check, and alert when `currentVersion` is not the one you deployed.
- A rotation is logged as `Key rotated: <old> -> <new> (reason: <reason>, provider: <name>)`.
- A value that cannot be decrypted means its key version is no longer available: keep every version that rows still use, and count the versions in use before a key is removed ([Rotating keys](./rotating-keys.md)).

## When a key may have leaked

1. Add a new key version and make it current, so that new values are written with it ([Rotating keys](./rotating-keys.md), step 1). With the `managed` and `vault` providers `keyProvider.rotateKey()` does this; the `configurable` provider returns the current version unchanged, because its keys come from the configuration.
2. Re-encrypt the rows that carry the leaked version (step 2).
3. Remove the leaked version from the configuration, the key store or Vault once no row uses it (step 3).
4. Find out how the key left: the leaked version stays readable by whoever holds it for every copy of the data taken before the re-encryption, such as backups.

## Before a deployment

- The production profile does not use the `simple` provider.
- No key, master key or salt is in the repository or in an image.
- Every key version that stored rows use is configured.
- The connection to Vault uses TLS.
- Someone is named who rotates keys, and the steps were rehearsed outside production.

## Related documents

- [Choosing a key provider](./choosing-a-key-provider.md)
- [Rotating keys](./rotating-keys.md)
- [Troubleshooting](./troubleshooting.md)
