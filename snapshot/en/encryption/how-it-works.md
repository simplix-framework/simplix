# How simplix-encryption works

The parts of the module, how a value is encrypted and read back, and how the key provider is chosen.

## The parts

| Part | Class | Role |
|---|---|---|
| the converters | `AesEncryptionConverter`, `AesEncryptionBytesConverter` | encrypt an attribute on the way to the database and decrypt it on the way back |
| the service | `EncryptionService` | encrypts and decrypts with AES-GCM and writes the version of the key into every value |
| the key provider | a `KeyProvider`: `SimpleKeyProvider`, `ConfigurableKeyProvider`, `ManagedKeyProvider` or `VaultKeyProvider` | hands the service the current key and any earlier key by its version |

`SimpliXEncryptionAutoConfiguration` registers them and binds `simplix.encryption` to `SimpliXEncryptionProperties`; `simplix.encryption.enabled: false` leaves the module out. The providers are declared in `KeyProviderConfiguration`, one nested configuration per provider with the profile and property conditions listed in [Choosing a key provider](en/encryption/choosing-a-key-provider.md).

## What happens to a value

1. On a write, the converter passes the text to the service unless it is `null`, empty or already in the encrypted format.
2. The service asks the provider for the current key and its version, draws a new 12-byte IV and encrypts.
3. The stored value is `<version>:<iv>:<ciphertext>`.
4. On a read, the service takes the version from the value, asks the provider for that key and decrypts. A value that is not in the format is returned unchanged.
5. A value whose ciphertext or tag was changed fails with `EncryptionService.DecryptionException`; a failure to encrypt is an `EncryptionService.EncryptionException`.

## A key provider of your own

Declare a bean that implements `KeyProvider` to take the keys from a place the module does not cover, such as a cloud key service. It replaces every built-in provider. `AbstractKeyProvider` is a base class with an in-memory key cache, version naming and the rotation age check.

| Method of `KeyProvider` | Returns |
|---|---|
| `getCurrentKey()` | the key that encrypts new values |
| `getCurrentVersion()` | its version, which is written in front of every value |
| `getKey(version)` | the key of a version, for decryption |
| `rotateKey()` | the version of the new key after a rotation |
| `isConfigured()` | whether the provider can hand out keys |
| `getName()` | a name for logs |

## Other public methods

The guides show the methods a task needs. The types they name also have these public methods.

| Type | Method | Does |
|---|---|---|
| `ConfigurableKeyProvider` | `isDeprecated(version)` | says whether a key version is marked as deprecated |
| `ConfigurableKeyProvider` | `getAvailableVersions()` | returns every key version the provider holds |

## Related documents

- [Choosing a key provider](en/encryption/choosing-a-key-provider.md)
- [Encrypting columns](en/encryption/encrypting-columns.md)
- [Troubleshooting](en/encryption/troubleshooting.md)
