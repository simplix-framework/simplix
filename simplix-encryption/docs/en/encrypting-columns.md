# Encrypting columns

How to keep a column encrypted in the database while the entity works with the plain value: what to put on the field, how wide to make the column, how to find a row by an encrypted value, and what an encrypted column can no longer do.

## Mark the fields

```java
@Entity
@Table(name = "readers")
@Getter
@Setter
@NoArgsConstructor
public class Reader extends SimpliXBaseEntity<String> {

    @Id
    @UuidV7Generator
    @Column(name = "reader_id")
    private String readerId;

    @Column(nullable = false, length = 80)
    private String name;

    // Stored encrypted, read back as plain text
    @Convert(converter = AesEncryptionConverter.class)
    @Column(length = 512)
    private String email;

    // Finds the row without decrypting anything
    @Column(name = "email_hash", length = 44)
    private String emailHash;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(length = 128)
    private String phone;

    public void setEmail(String email) {
        this.email = email;
        this.emailHash = email == null ? null : HashingUtils.hash(email.trim().toLowerCase());
    }

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

The converter encrypts when the entity is written and decrypts when it is read. Services, DTOs and JSON see `ursula@example.com`; the table holds a value such as `v2:<iv>:<ciphertext>`. A `null` and an empty text are stored as they are; neither is encrypted.

## Make the column wide enough

An encrypted value is longer than its text: the version, a 16-character IV and the ciphertext in Base64, which grows by a third and carries a 16-byte tag. The lengths below were measured with a 6-character version name.

| Text | Latin letters | Hangul |
|---|---|---|
| 10 characters | 60 | 88 |
| 20 characters | 72 | 128 |
| 50 characters | 112 | 248 |
| 100 characters | 180 | 448 |
| 255 characters | 388 | 1068 |
| 1000 characters | 1380 | 4048 |

The length is the length of the version, plus 18, plus four characters for every three bytes of the text and its tag: `version + 18 + 4 × ceil((bytes + 16) / 3)`. A Hangul character is three bytes in UTF-8. Size the column for the longest text you accept and for the longest version name you will use, or use a `TEXT` column.

## Find a row by an encrypted value

Two encryptions of the same text differ, so `WHERE email = ?` never matches. Keep a hash of the normalised value in a second column and search by that.

```java
public interface ReaderRepository extends SimpliXBaseRepository<Reader, String> {

    Optional<Reader> findByEmailHash(String emailHash);
}

public Optional<Reader> findByEmail(String email) {
    return readerRepository.findByEmailHash(HashingUtils.hash(email.trim().toLowerCase()));
}
```

Normalise the value the same way when it is stored and when it is searched. Put a unique index on the hash column to keep the value unique.

## What an encrypted column cannot do

| Not possible | Instead |
|---|---|
| an index or a unique constraint on the value | index the hash column |
| `LIKE` and other partial matches | keep a searchable part in its own column, such as the domain of an e-mail address, when the part is not sensitive |
| sorting by the value | sort in memory after reading, or by another column |
| comparing the column in SQL, JPQL or a native query | read the entity and compare in Java |

## Encrypt a table that already has data

1. Widen the column, then add the converter. A row that still holds plain text is read as it is: the converter returns a value that is not in the encrypted format unchanged.
2. Every row that is saved after that is written encrypted, so the table fills with encrypted values as rows are updated.
3. For the rows nobody updates, read and save them in batches until no plain value is left.

A value that is already encrypted is not encrypted a second time, so saving a row twice is safe.

## Check what is stored

```sql
SELECT reader_id, email FROM readers;
-- 01a2...  v2:kYp1c0Vd3mF6Qw9x:Zm9vYmFyYmF6...
```

A native query shows the stored value, since it does not pass the converter. A value without the version prefix is a plain row that was not migrated yet.

## Related documents

- [Encrypting values in code](./encrypting-values-in-code.md)
- [Rotating keys](./rotating-keys.md)
- [Protecting sensitive data](../../../simplix-core/docs/en/protecting-sensitive-data.md)
