# Encrypting values in code

`EncryptionService` encrypts and decrypts values that do not pass a JPA converter: a file name, a token stored by another module, a value sent to a queue.

```java
EncryptionService.EncryptedData encrypted = encryptionService.encrypt("ursula@example.com");
encrypted.getData();        // v2:<iv>:<ciphertext>
encrypted.getKeyVersion();  // v2

encryptionService.decrypt(encrypted.getData());       // ursula@example.com
encryptionService.isEncrypted(encrypted.getData());   // true
encryptionService.isEncrypted("ursula@example.com");  // false
encryptionService.getKeyVersion(encrypted.getData()); // v2

// decrypts with the key the value names and encrypts with the current key
EncryptionService.EncryptedData renewed = encryptionService.reencrypt(encrypted.getData());
```

## The format of an encrypted value

A value is text separated by colons into the key version, the IV and the ciphertext, the IV and the ciphertext in Base64. The algorithm is AES in GCM mode with a 256-bit key, a 12-byte IV and a 128-bit authentication tag, so a value that was changed fails to decrypt. A new IV is drawn for every call: encrypting the same text twice gives different values.

## Columns

| Converter | Attribute | Use it for |
|---|---|---|
| `AesEncryptionConverter` | `String` | personal data and other text |
| `AesEncryptionBytesConverter` | `byte[]` | a secret the application has to erase from memory: call `AesEncryptionBytesConverter.erase(bytes)` when the work is done |

Both write the same column format, so an attribute can change from one to the other without a data change. A converter leaves a value that is already encrypted as it is, and returns a value that is not in the encrypted format unchanged, which lets a table hold old plain rows while it is being migrated.

## Related documents

- [Rotating keys](./rotating-keys.md)
- [Protecting sensitive data](../../../simplix-core/docs/en/protecting-sensitive-data.md)
