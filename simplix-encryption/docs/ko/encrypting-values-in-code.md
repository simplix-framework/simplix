# 코드에서 값 암호화

`EncryptionService`는 JPA 변환기를 거치지 않는 값을 암호화하고 복호화합니다. 파일 이름, 다른 모듈이 저장하는 토큰, 큐로 전송하는 값에 사용합니다.

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

## 암호화된 값의 형식

암호화된 값은 콜론으로 구분한 문자열이며, 키 버전, IV, 암호문으로 구성됩니다. IV와 암호문은 Base64로 인코딩합니다. 알고리즘은 256비트 키, 12바이트 IV, 128비트 인증 태그를 사용하는 AES GCM 모드이므로, 변조된 값은 복호화에 실패합니다. 호출마다 새 IV를 생성하므로 같은 문자열을 두 번 암호화하면 서로 다른 값이 만들어집니다.

## 컬럼

| 변환기 | 속성 타입 | 용도 |
|---|---|---|
| `AesEncryptionConverter` | `String` | 개인정보와 일반 문자열 |
| `AesEncryptionBytesConverter` | `byte[]` | 메모리에서 지워야 하는 비밀 값. 작업이 끝나면 `AesEncryptionBytesConverter.erase(bytes)`를 호출합니다 |

`AesEncryptionConverter`와 `AesEncryptionBytesConverter`는 같은 컬럼 형식을 사용하므로, 데이터를 변경하지 않고 속성의 변환기를 바꿀 수 있습니다. 변환기는 이미 암호화된 값을 다시 암호화하지 않고, 암호화 형식이 아닌 값은 그대로 반환합니다. 따라서 마이그레이션하는 동안 테이블에 기존 평문 행이 남아 있어도 됩니다.

## 관련 문서

- [키 교체](./rotating-keys.md)
- [민감한 데이터 보호](../../../simplix-core/docs/ko/protecting-sensitive-data.md)
