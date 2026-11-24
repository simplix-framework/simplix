# 컬럼 암호화

엔티티에서는 평문을 다루면서 데이터베이스의 컬럼을 암호화해 보관하는 방법을 설명합니다. 필드에 지정할 내용, 컬럼 너비, 암호화한 값으로 행을 찾는 방법, 암호화한 컬럼에서 사용할 수 없는 기능을 다룹니다.

## 필드 지정

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

변환기는 엔티티를 기록할 때 암호화하고 읽을 때 복호화합니다. 서비스, DTO, JSON에서는 `ursula@example.com`을 사용하고, 테이블에는 `v2:<iv>:<ciphertext>` 형식의 값이 저장됩니다. `null`과 빈 문자열은 암호화하지 않고 그대로 저장합니다.

## 컬럼 너비 산정

암호화한 값은 원문보다 깁니다. 버전, 16자의 IV, Base64로 표현한 암호문으로 구성되며, 암호문은 원문보다 3분의 1 길어지고 16바이트 태그가 추가됩니다. 아래 길이는 버전 이름이 6자일 때 측정한 값입니다.

| 원문 | 라틴 문자 | 한글 |
|---|---|---|
| 10자 | 60 | 88 |
| 20자 | 72 | 128 |
| 50자 | 112 | 248 |
| 100자 | 180 | 448 |
| 255자 | 388 | 1068 |
| 1000자 | 1380 | 4048 |

길이는 버전 길이에 18을 더하고, 원문과 태그의 3바이트마다 4자를 더한 값입니다: `버전 + 18 + 4 × ceil((바이트 수 + 16) / 3)`. 한글 한 글자는 UTF-8에서 3바이트입니다. 허용하는 가장 긴 원문과 사용할 가장 긴 버전 이름을 기준으로 컬럼 크기를 정하거나 `TEXT` 컬럼을 사용하세요.

## 암호화한 값으로 행 조회

같은 원문을 암호화해도 결과가 매번 다르므로 `WHERE email = ?` 조건은 일치하지 않습니다. 정규화한 값의 해시를 별도 컬럼에 보관하고 해시로 검색하세요.

```java
public interface ReaderRepository extends SimpliXBaseRepository<Reader, String> {

    Optional<Reader> findByEmailHash(String emailHash);
}

public Optional<Reader> findByEmail(String email) {
    return readerRepository.findByEmailHash(HashingUtils.hash(email.trim().toLowerCase()));
}
```

저장할 때와 검색할 때 같은 방식으로 값을 정규화하세요. 값의 유일성은 해시 컬럼에 유일 인덱스를 지정해 보장합니다.

## 암호화한 컬럼의 제약

| 사용할 수 없는 기능 | 대안 |
|---|---|
| 값에 대한 인덱스나 유일 제약 | 해시 컬럼에 인덱스 지정 |
| `LIKE` 등 부분 일치 검색 | 이메일 주소의 도메인처럼 민감하지 않은 부분을 별도 컬럼에 보관 |
| 값 기준 정렬 | 조회 후 메모리에서 정렬하거나 다른 컬럼으로 정렬 |
| SQL, JPQL, 네이티브 쿼리에서 컬럼 비교 | 엔티티를 읽어 Java에서 비교 |

## 기존 데이터가 있는 테이블 암호화

1. 컬럼 너비를 늘린 뒤 변환기를 추가합니다. 아직 평문인 행은 그대로 읽습니다. 변환기는 암호화 형식이 아닌 값을 변경하지 않고 반환합니다.
2. 이후 저장하는 행은 모두 암호화해 기록하므로, 행이 갱신되면서 테이블이 암호화한 값으로 채워집니다.
3. 갱신되지 않는 행은 평문이 남지 않을 때까지 배치 단위로 읽어 다시 저장합니다.

이미 암호화한 값은 다시 암호화하지 않으므로 같은 행을 여러 번 저장해도 안전합니다.

## 저장된 값 확인

```sql
SELECT reader_id, email FROM readers;
-- 01a2...  v2:kYp1c0Vd3mF6Qw9x:Zm9vYmFyYmF6...
```

네이티브 쿼리는 변환기를 거치지 않으므로 저장된 값을 그대로 조회합니다. 버전 접두어가 없는 값은 아직 전환하지 않은 평문 행입니다.

## 관련 문서

- [코드에서 값 암호화](./encrypting-values-in-code.md)
- [키 교체](./rotating-keys.md)
- [민감한 데이터 보호](../../../simplix-core/docs/ko/protecting-sensitive-data.md)
