# Choosing a key provider

Where the encryption keys come from. A key provider hands the service the current key and the earlier ones by version; which provider is used follows from `simplix.encryption.provider` and the active Spring profile.

| Provider | Keys are kept | Rotation | Use it for |
|---|---|---|---|
| `simple` | in one configured text | none | development and tests |
| `configurable` | in configuration, one entry per version | by changing the configuration | deployments that manage secrets through configuration, such as Kubernetes Secrets |
| `managed` | in files on disk | automatic, by age | servers without a secret manager |
| `vault` | in HashiCorp Vault | in Vault | production with Vault |

## Which provider is active

| Provider | Registered when |
|---|---|
| `configurable` | `provider: configurable`, in any profile |
| `vault` | the profile `prod`, `staging` or `vault` is active, Spring Vault is on the classpath, and `provider` is `vault` or not set |
| `managed` | the profile `file-based`, `managed` or `staging` is active and `provider: managed` |
| `simple` | the profile `dev`, `test`, `local` or no profile is active, and none of the above applies |

> ⚠ A profile such as `prod` with neither Spring Vault nor `provider: configurable` leaves no key provider. Set the provider explicitly for every environment that is not development.

A `KeyProvider` bean of your own replaces all of them.

## Simple

```yaml
simplix:
  encryption:
    static-key: ${ENCRYPTION_STATIC_KEY}
```

The key is derived from `static-key`. Without it a built-in development text is used, and the provider logs `SimpleKeyProvider initialized - DO NOT USE IN PRODUCTION` at start. It keeps no versions: changing the text makes the stored data unreadable.

## Configurable

```yaml
simplix:
  encryption:
    provider: configurable
    configurable:
      current-version: v2
      keys:
        v1:
          key: ${ENCRYPTION_KEY_V1}
          deprecated: true
        v2:
          key: ${ENCRYPTION_KEY_V2}
```

```bash
# A key is 32 random bytes in Base64
openssl rand -base64 32
```

New values are encrypted with `current-version`. Every listed version can decrypt; a version marked `deprecated` decrypts only. The application refuses to start when `current-version` is missing, is not among the keys or is deprecated, or when a key is not 32 bytes.

## Managed

```yaml
spring:
  profiles:
    active: managed

simplix:
  encryption:
    provider: managed
    key-store-path: /var/lib/library/keys
    master-key: ${ENCRYPTION_MASTER_KEY}
    salt: ${ENCRYPTION_SALT}
    rotation:
      enabled: true
      days: 90
```

Keys are files under `key-store-path`, listed in `metadata.json`; the directory and the files are readable by the application user only. The first key is derived from `master-key` and `salt` with PBKDF2. When a key is older than `rotation.days` a new one is generated. With a ShedLock `LockProvider` bean the rotation is locked, so that several instances that share the directory rotate once.

## Vault

```yaml
spring:
  profiles:
    active: prod
  cloud:
    vault:
      uri: https://vault.example.com
      authentication: KUBERNETES

simplix:
  encryption:
    provider: vault
```

Add `spring-cloud-starter-vault-config`. Keys are read from `secret/encryption/keys/<version>`, each with a Base64 `key` field, and the current version is named at `secret/encryption/keys/current`. A key is fetched when it is first needed and then kept in memory.

## Related documents

- [Rotating keys](en/encryption/rotating-keys.md)
- [Configuration reference](en/encryption/configuration-reference.md)
