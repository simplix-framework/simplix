# Getting started with simplix-encryption

This page encrypts the e-mail address of a reader in the database and keeps it searchable.

## Step 1. Mark the column

```java
@Entity
@Table(name = "readers")
@Getter
@Setter
@NoArgsConstructor
public class Reader extends SimpliXBaseEntity<String> {

    @Id
    @UuidV7Generator
    private String readerId;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "email", length = 500)
    private String email;

    @Convert(converter = HashingAttributeConverter.class)
    @Column(name = "email_hash")
    private String emailHash;

    @Override
    public String getId() {
        return readerId;
    }

    @Override
    public void setId(String id) {
        this.readerId = id;
    }
}
```

`AesEncryptionConverter` encrypts `email`. An encrypted value cannot be searched, so `emailHash` holds a one-way hash of the same address through `HashingAttributeConverter` of simplix-core.

> ℹ The stored value is longer than the plain text: an 18-character address is stored in 68 characters. Size the column for it.

## Step 2. Save and read

```java
Reader reader = new Reader();
reader.setEmail("ursula@example.com");
reader.setEmailHash("ursula@example.com");
readerRepository.saveAndFlush(reader);

readerRepository.findByEmailHash("ursula@example.com");
```

The entity always holds the plain address. The `email` column holds the key version, the IV and the ciphertext.

```
v2:<16 characters>:<48 characters>
```

## Step 3. Choose the key

With no configuration and no active profile the module uses `SimpleKeyProvider` with a built-in development key and logs a warning. Before real data is stored, choose a provider: see [Choosing a key provider](en/encryption/choosing-a-key-provider.md).

## Next steps

- [Choosing a key provider](en/encryption/choosing-a-key-provider.md)
- [Rotating keys](en/encryption/rotating-keys.md)
- [Protecting sensitive data](en/core/protecting-sensitive-data.md)
