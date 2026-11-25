# simplix-encryption 시작하기

이 문서는 데이터베이스에 저장하는 이메일 주소를 암호화하면서 검색도 가능하게 구성하는 과정을 안내합니다.

## 1단계. 컬럼에 변환기 지정

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

`AesEncryptionConverter`가 `email`을 암호화합니다. 암호화한 값은 검색할 수 없으므로, simplix-core의 `HashingAttributeConverter`로 같은 주소의 단방향 해시를 `emailHash`에 저장합니다.

> ℹ 저장되는 값은 평문보다 깁니다. 18자 주소는 68자로 저장됩니다. 컬럼 길이를 이에 맞춰 지정하세요.

## 2단계. 저장과 조회

```java
Reader reader = new Reader();
reader.setEmail("ursula@example.com");
reader.setEmailHash("ursula@example.com");
readerRepository.saveAndFlush(reader);

readerRepository.findByEmailHash("ursula@example.com");
```

엔티티에는 항상 평문 주소가 들어 있습니다. `email` 컬럼에는 키 버전, IV, 암호문이 저장됩니다.

```
v2:<16 characters>:<48 characters>
```

## 3단계. 키 선택

설정과 활성 프로필이 없으면 모듈은 내장된 개발용 키로 `SimpleKeyProvider`를 사용하고 경고를 기록합니다. 실제 데이터를 저장하기 전에 프로바이더를 선택하세요. [키 프로바이더 선택](ko/encryption/choosing-a-key-provider.md)을 참고하세요.

## 다음 단계

- [키 프로바이더 선택](ko/encryption/choosing-a-key-provider.md)
- [키 교체](ko/encryption/rotating-keys.md)
- [민감한 데이터 보호](ko/core/protecting-sensitive-data.md)
