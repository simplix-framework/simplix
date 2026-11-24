# Configuration reference

Every property of the module, under `simplix.encryption`.

| Property | Default | Meaning |
|---|---|---|
| `enabled` | `true` | switches the module on |
| `provider` | `simple` | `simple`, `configurable`, `managed` or `vault` |
| `static-key` | a development text | the text the simple provider derives its key from |
| `simple.allow-rotation` | `false` | lets the simple provider accept a rotation call; it keeps one key either way |
| `configurable.current-version` | none | the version that encrypts new values |
| `configurable.keys.<version>.key` | none | a 32-byte key in Base64 |
| `configurable.keys.<version>.deprecated` | `false` | the version decrypts only |
| `key-store-path` | none | the directory of the managed provider's key files |
| `master-key`, `salt` | none | what the managed provider derives its first key from |
| `rotation.enabled` | `true` | lets the managed provider rotate by age |
| `rotation.days` | `90` | the age at which a key is rotated |
| `auto-rotation` | `true` | checks the age on a schedule |
| `vault.enabled` | `true` | lets the Vault provider call Vault |
| `vault.path` | `secret/encryption` | the base path in Vault |
| `vault.namespace` | none | no effect: no code reads it; set `spring.cloud.vault.namespace` |

## Related documents

- [Choosing a key provider](en/encryption/choosing-a-key-provider.md)
