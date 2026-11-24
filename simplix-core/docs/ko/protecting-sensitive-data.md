# 민감한 데이터 보호

개인정보가 화면, 로그, 평문 컬럼에 노출되지 않도록 하는 유틸리티를 설명합니다. HTML 정리, 값 마스킹, 검색해야 하는 값의 해싱, 엔티티 단위 마스킹을 다룹니다.

## 값 정리와 마스킹

```java
HtmlSanitizer.sanitize("<b>Bold</b><script>alert(1)</script>");       // Bold
HtmlSanitizer.escapeHtml("<b>Bold</b>");                               // &lt;b&gt;Bold&lt;&#x2F;b&gt;
HtmlSanitizer.containsDangerousContent("<img src=x onerror=alert(1)>"); // true

DataMaskingUtils.maskEmail("ursula@example.com");          // ur***@example.com
DataMaskingUtils.maskPhoneNumber("010-1234-5678");         // 010-****-****
DataMaskingUtils.maskCreditCard("4111-1111-1111-1111");    // ****-****-****-1111
DataMaskingUtils.maskIpAddress("192.168.10.25");           // 192.168.10.0
DataMaskingUtils.maskGeneric("AB1234567890", 2, 2);        // AB********90

// login ur***@example.com card ****-****-****-1111
LogMasker.maskSensitiveData("login ursula@example.com card 4111-1111-1111-1111");
```

| 클래스 | 용도 |
|---|---|
| `HtmlSanitizer` | 저장하거나 표시하기 전에 HTML을 제거하거나 이스케이프합니다. OWASP Java HTML Sanitizer 기반입니다 |
| `DataMaskingUtils` | 종류가 정해진 값을 마스킹합니다: 이메일, 전화번호, 카드 번호, 주민등록번호, IP 주소, 결제 토큰 |
| `LogMasker` | 로그에 남기기 전에 자유 형식 문자열에서 이런 값을 찾아 마스킹합니다 |
| `IpAddressMaskingUtils` | IP 주소를 서브넷 단위로 마스킹합니다 |
| `InputSanitizer` | 값이 사용되는 위치에 맞게 이스케이프합니다: SQL, HTML, JavaScript, LDAP, OS 명령, 파일 이름, `LIKE` 패턴 |
| `SqlInjectionValidator` | 입력이 안전한 패턴과 일치하는지 판정하고, `LIKE` 와일드카드를 이스케이프합니다 |

### 정리 정책

`HtmlSanitizer.sanitize(html)`은 모든 요소를 제거하고 텍스트만 남깁니다. `sanitizeWithPolicy(html, policy)`로 남길 HTML의 범위를 선택합니다.

| 정책 | 남기는 내용 |
|---|---|
| `STRICT` | HTML 없음 |
| `PLAIN_TEXT` | 모든 요소를 제거한 텍스트 |
| `BASIC_FORMATTING` | 기본 텍스트 서식 |
| `FORMATTING_WITH_LINKS` | 서식과 안전한 링크 |
| `RICH_TEXT` | 서식, 링크, 표, 이미지 |

입력이 `<b>B</b><a href="https://x.dev">l</a><script>x</script>`일 때 `BASIC_FORMATTING`은 `<b>B</b>l`을, `FORMATTING_WITH_LINKS`는 `<b>B</b><a href="https://x.dev" rel="nofollow">l</a>`을, `PLAIN_TEXT`는 `Bl`을 반환합니다. `RICH_TEXT`는 표와 이미지도 유지합니다.

정책은 `HtmlSanitizer.SanitizationPolicy` 값입니다. 정책 없이 `HtmlSanitizer.sanitize(html)`을 호출하면 모든 태그를 제거하고, `escapeHtml(html)`은 마크업을 제거하지 않고 엔티티로 변환합니다. `containsDangerousContent(html)`은 문자열에 스크립트가 포함되어 있는지 판정합니다. `<img src=x onerror=alert(1)>`와 인코딩된 형태인 `%3Cscript%3E`에는 true를, `<b>ok</b>`에는 false를 반환합니다.

### 필드 이름에 따른 마스킹

`LogMasker.maskFieldValue(fieldName, value)`는 필드 이름으로 마스킹 방식을 선택합니다. 이름에 `password`, `secret`, `token`, `apikey`가 들어 있으면 `********`를 반환하고, `email`이 들어 있으면 이메일로, `phone`, `mobile`, `tel`이 들어 있으면 전화번호로 마스킹합니다.

## 마스킹 함수별 결과

| 호출 | 결과 | 유지하는 부분 |
|---|---|---|
| `maskEmail("ursula@example.com")` | `ur***@example.com` | 로컬 파트의 앞부분과 도메인 |
| `maskEmail("a@example.com")` | `**@example.com` | 로컬 파트가 짧으면 도메인만 |
| `maskPhoneNumber("010-1234-5678")` | `010-****-****` | 지역 번호 |
| `maskCreditCard("4111-1111-1111-1111")` | `****-****-****-1111` | 마지막 네 자리 |
| `maskRRN("900101-1234567")` | `900101-*******` | 생년월일 부분 |
| `maskIpAddress("192.168.10.25")` | `192.168.10.0` | 네트워크 부분 |
| `maskIpAddress("2001:db8:85a3::8a2e:370:7334")` | `2001:db8:85a3::8a2e:370:0` | 마지막 그룹을 제외한 부분 |
| `maskPaymentToken("pm_1234567890abcdef")` | `pm_****cdef` | 접두어와 마지막 네 자 |
| `maskGeneric("AB1234567890", 2, 2)` | `AB********90` | 양 끝의 지정한 글자 수 |
| `maskFull("secret-value", 8)` | `********` | 유지하는 부분이 없습니다. 길이는 지정한 최대값으로 제한합니다 |

## 로그 기록 전 자유 형식 문자열 마스킹

`LogMasker`는 문장 안에서 민감한 값을 찾습니다. `maskSensitiveData`는 모든 패턴을 적용하고, 나머지 메서드는 패턴 하나만 적용합니다.

| 호출 | 결과 |
|---|---|
| `maskEmail("mail ursula@example.com now")` | `mail ur***@example.com now` |
| `maskPhoneNumber("call 010-1234-5678")` | `call 010-****-****` |
| `maskRRN("rrn 900101-1234567")` | `rrn 900101-*******` |
| `maskPassword("password=hunter2&x=1")` | `password=********` |
| `maskIPAddress("from 192.168.10.25")` | `from 192.168.10.0` |
| `containsSensitiveData("card 4111-1111-1111-1111")` | `true` |

`maskSensitiveData`는 이메일 주소, 전화번호, 카드 번호, 주민등록번호, 비밀번호를 마스킹합니다. IP 주소는 그대로 유지하므로 `maskIPAddress`를 따로 호출하세요.

## 사용 위치에 맞는 이스케이프

`InputSanitizer`는 값을 사용하는 위치에 맞게 가공합니다. 값을 기록할 위치에 해당하는 메서드를 사용하세요.

| 호출 | 결과 | 설명 |
|---|---|---|
| `sanitizeForHtml("<b>&\"x\"</b>")` | `&lt;b&gt;&amp;&quot;x&quot;&lt;&#x2F;b&gt;` | 모든 HTML 메타 문자를 엔티티로 변환 |
| `sanitizeForJavaScript("a'b\"c</script>")` | `a\'b\"c\x3C\/script\x3E` | 스크립트 문자열 안에서 안전한 형태 |
| `sanitizeForLdap("a*(b)\\c")` | `abc` | LDAP 필터 문자를 제거 |
| `sanitizeForOsCommand("file; rm -rf /")` | `file rm -rf /` | 셸 구분 문자를 제거합니다. 인자 목록으로 전달할 수 있으면 사용자 입력으로 명령줄을 만들지 마세요 |
| `sanitizeFileName("../../etc/pass wd?.txt")` | `etcpasswd.txt` | 경로 요소와 특수 문자를 제거 |
| `escapeLikePattern("50%_off")` | `50\%\_off` | `LIKE`의 와일드카드를 이스케이프 |
| `sanitizeForSql("O'Brien; DROP TABLE x")` | an empty text | 인젝션으로 보이는 값은 전체를 거부합니다. SQL 인젝션은 바인드 매개변수로 방어해야 합니다 |

## 입력 판정

`SqlInjectionValidator`는 입력의 안전 여부를 판정합니다. `new`로 생성하며, 상태를 보관하지 않으므로 인스턴스 하나를 공유해도 됩니다.

| 호출 | 결과 |
|---|---|
| `isSafeInput("Ursula Le Guin")` | `true` |
| `isSafeInput("x' OR 1=1 --")`, `isSafeInput("DROP TABLE users")` | `false` |
| `isSafeEmail("ursula@example.com")` | `true` |
| `isSafePhoneNumber("+821012345678")` | `true`. `010-1234`는 거부됩니다. 구분 기호가 없는 국제 전화번호 형식이어야 합니다 |
| `isValidSortField("penName", List.of("penName", "createdAt"))` | `true`. 목록에 없는 필드는 거부됩니다 |
| `isValidPagination(0, 20)` | `true`. 음수 페이지나 지나치게 큰 크기는 거부됩니다 |
| `isValidUUID(id)`, `isAlphanumeric(text, allowSpaces)`, `isSafeHash(hash)` | 형식 검사 |
| `sanitizeInput("x' OR 1=1 --")` | `x OR 1=1` |

SQL 키워드(`SELECT`, `DROP`, `UNION` 등), 주석 기호, 따옴표와 세미콜론, 16진수 리터럴, `OR 1=1 OR` 같은 항진식, 지연 함수, 시스템 테이블, 파일 함수를 거부합니다. `O'Brien` 같은 이름도 거부되므로 자유 형식 문자열이 아닌 식별자, 코드, 정렬 필드에 사용하세요.

## 값을 저장하지 않고 검색

`HashingUtils.hash(value)`는 값의 SHA-256 해시를 Base64 44자로 반환합니다. 같은 입력은 항상 같은 해시가 되므로, 암호화한 컬럼 옆에 해시 컬럼을 두면 그 값으로 검색할 수 있습니다. `HashingAttributeConverter`는 데이터베이스에 저장할 때 해싱하며, 이미 해시인 값은 그대로 저장합니다.

```java
@Column(name = "email_hash")
@Convert(converter = HashingAttributeConverter.class)
private String emailHash;
```

저장하기 전에 값을 정규화하세요. 예를 들어 `email.toLowerCase().trim()`처럼 처리합니다. 변환기를 지정한 속성으로 조회할 때는 평문과 해시를 모두 사용할 수 있습니다. 변환기가 평문 매개변수도 같은 방식으로 해싱합니다.

### 해시 함수

| 호출 | 결과 |
|---|---|
| `HashingUtils.hash("ursula@example.com")` | `ALQdJLZSQvjJmM7KT6a5ps6ip4QjskVXrW5yrlBQJ28=` |
| `HashingUtils.hash(value, "SHA-512")` | Base64 문자 88자 |
| `HashingUtils.isValidHash(text)` | Base64로 표현한 SHA-256 해시이면 `true`, 그 밖의 문자열은 `false` |
| `HashingUtils.isValidHashForAlgorithm(text, "SHA-512")` | 다른 알고리즘에 대한 같은 검사 |
| `HashingUtils.hash(value, "NOPE")` | `HashingUtils.HashingException` 발생 |

해시는 암호화가 아닙니다. 해시에서 원래 값을 복원할 수 없으며, 전화번호처럼 후보가 적은 값은 모든 후보를 해시해 찾아낼 수 있습니다. 읽어야 하는 값은 암호화한 컬럼에 저장하고, 해시는 행을 찾는 용도로만 사용하세요.

## 엔티티 단위 마스킹

`UniversalMaskingListener`는 엔티티를 삽입하거나 수정하기 전에 `@MaskSensitive`가 지정된 필드를 마스킹하므로, 테이블에는 마스킹된 값이 저장됩니다. 원본 값을 다시 읽을 필요가 없는 값에 사용하세요.

```java
@Entity
@EntityListeners(UniversalMaskingListener.class)
public class PaymentMethod extends SimpliXBaseEntity<String> {

    @MaskSensitive(type = MaskSensitive.MaskType.PARTIAL, keepFirst = 4, keepLast = 4)
    private String accountNumber;
}
```

| `MaskType` | 결과 |
|---|---|
| `FULL` | 값 전체를 마스킹 |
| `PARTIAL` | 앞의 `keepFirst`자와 뒤의 `keepLast`자를 유지 |
| `EMAIL` | 로컬 파트의 앞부분과 도메인을 유지 |
| `PHONE` | 지역 번호를 유지 |
| `CREDIT_CARD` | 마지막 네 자리를 유지 |
| `PAYMENT_TOKEN` | 접두어와 마지막 문자를 유지 |
| `IP_ADDRESS` | 앞의 두 옥텟을 유지 |
| `JSON` | JSON 문자열 안의 민감한 값을 마스킹 |

| `@MaskSensitive`의 속성 | 기본값 | 의미 |
|---|---|---|
| `type` | `FULL` | 마스킹 규칙. `MaskSensitive.MaskType` 값입니다 |
| `keepFirst` | `3` | `PARTIAL`에서 앞쪽에 유지하는 글자 수 |
| `keepLast` | `4` | `PARTIAL`에서 뒤쪽에 유지하는 글자 수 |
| `minLength` | `0` | 이 길이보다 짧은 값은 그대로 저장합니다 |
| `enabled` | `true` | `false`이면 필드를 마스킹하지 않습니다 |
| `maskChar` | `*` | 효과가 없습니다. 리스너는 항상 `*`로 마스킹합니다 |

리스너는 `String` 필드만 마스킹하며, `FULL`은 값의 길이와 관계없이 마스킹 문자를 최대 50자까지 기록합니다. 데이터베이스에는 마스킹한 값이 저장되어 원본을 다시 읽을 수 없으므로, 애플리케이션이 나중에 표시하거나 비교해야 하는 필드에는 리스너를 사용하지 마세요.

`MaskingConverter`는 복구할 수 있어야 하는 값에 사용합니다. 값을 AES-GCM으로 암호화해 저장하고, 엔티티를 읽을 때는 `****MASKED****`를 반환합니다. 키는 32자 이상의 `simplix.core.masking.key`로 지정하며, 지정하지 않으면 고정된 개발용 키를 사용하므로 운영 환경에서는 안전하지 않습니다. `simplix.core.masking.enabled: false`를 지정하면 변환기가 동작하지 않고, JVM 시스템 속성 `simplix.core.masking.unmask=true`를 지정하면 복호화한 값을 반환합니다. 키 교체가 필요한 암호화에는 [simplix-encryption](../../../simplix-encryption/README.ko.md)을 사용하세요.

## 보관하는 기록의 IP 주소 마스킹

```java
IpAddressMaskingUtils.maskSubnetLevel("192.168.10.25");                  // 192.168.10.0
IpAddressMaskingUtils.maskSubnetLevel("2001:db8:85a3::8a2e:370:7334");   // 2001:db8:85a3::8a2e:370:0
IpAddressMaskingUtils.maskSubnetLevel("not-an-ip");                      // not-an-ip
IpAddressMaskingUtils.isMasked("192.168.10.0");                          // true
IpAddressMaskingUtils.isValidIpAddress("192.168.10.25");                 // true
```

| `IpAddressMaskingUtils`의 메서드 | 반환값 |
|---|---|
| `maskSubnetLevel(ip)` | 마지막 부분을 0으로 바꾼 주소. 네트워크 대역은 남고 호스트는 식별되지 않습니다. `null`이면 `null`을, 주소 형식이 아니면 입력값을 그대로 반환합니다 |
| `isMasked(ip)` | 주소가 0으로 끝나면 true를 반환합니다. `10.0.0.0`처럼 실제로 0으로 끝나는 주소에도 true를 반환합니다 |
| `isValidIpAddress(ip)` | 문자열이 IPv4 또는 IPv6 주소인지 여부 |

감사 기록과 접근 기록에 사용하세요. 서브넷 수준의 주소로도 요청의 출처 대역을 확인할 수 있습니다.

## 위험별 사용 도구

| 위험 | 사용할 도구 |
|---|---|
| 사용자 입력에 포함된 마크업 | DTO 필드의 `@SafeHtml` 또는 저장 · 표시 위치의 `HtmlSanitizer` |
| 문자열로 조립하는 쿼리(예: 정렬 컬럼)에 들어가는 사용자 입력 | 먼저 바인딩 매개변수를 사용하고, 바인딩할 수 없는 값에는 `SqlInjectionValidator`를 사용 |
| 로그에 포함되는 개인정보 | 로그 기록 전 문자열에 `LogMasker` 적용 |
| API 응답이나 저장하는 감사 기록의 개인정보 | `DataMaskingUtils`, `@MaskSensitive`, `IpAddressMaskingUtils` |
| 값을 읽을 수 있는 형태로 저장하지 않고 조회 | 검색 컬럼에 `HashingUtils` 사용. 비밀번호에는 `HashingUtils`가 아닌 Spring Security의 `PasswordEncoder`를 사용 |

## 관련 문서

- [입력 검증](./validating-input.md)
- [simplix-encryption](../../../simplix-encryption/README.ko.md)
