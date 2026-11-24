**English** | [한국어](ko/encryption/readme.md)

# simplix-encryption

Encryption of data at rest. Mark a column and its value is encrypted with AES-256-GCM on the way into the database and decrypted on the way out; every stored value names the key version that encrypted it, so keys can be replaced without losing old data.

![An entity value passes the converter and the encryption service on its way to the column, where it is stored as the key version, the IV and the ciphertext.](../../assets/figures/encryption-readme-column-flow.en.svg)

## Install

The [starter](en/starter/readme.md) includes the module. Without the starter:

```groovy
dependencies {
    implementation "dev.simplecore.simplix:simplix-encryption:${version}"
}
```

## Documents

| To | Read |
|---|---|
| encrypt a first column | [Getting started](en/encryption/getting-started.md) |
| encrypt values in code | [Encrypting values in code](en/encryption/encrypting-values-in-code.md) |
| decide where the keys come from | [Choosing a key provider](en/encryption/choosing-a-key-provider.md) |
| replace a key | [Rotating keys](en/encryption/rotating-keys.md) |
| look a property up | [Configuration reference](en/encryption/configuration-reference.md) |
| size, search and migrate an encrypted column | [Encrypting columns](en/encryption/encrypting-columns.md) |
| see how a value is encrypted and which provider is chosen | [How simplix-encryption works](en/encryption/how-it-works.md) |
| find the cause of a problem | [Troubleshooting](en/encryption/troubleshooting.md) |

## Requirements

| Your project | SimpliX line | Version to declare |
|---|---|---|
| Spring Boot 4 | 2.x | a `2.x` release |
| Spring Boot 3 | 1.x | a `1.x` release |

## License

[SimpleCORE License 1.0 (SCL-1.0)](en/license.md)
