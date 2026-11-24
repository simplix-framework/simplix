# Protecting sensitive data

Utilities that keep personal data out of pages, logs and plain-text columns: cleaning HTML, masking values, hashing values that have to be searched, and masking at the entity.

## Clean and mask values

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

| Class | Use it to |
|---|---|
| `HtmlSanitizer` | remove or escape HTML before it is stored or shown; built on the OWASP Java HTML Sanitizer |
| `DataMaskingUtils` | mask one value of a known kind: e-mail, phone number, card number, resident registration number, IP address, payment token |
| `LogMasker` | find and mask such values inside free text before it is logged |
| `IpAddressMaskingUtils` | mask an IP address to its subnet |
| `InputSanitizer` | escape a value for the place it goes to: SQL, HTML, JavaScript, LDAP, an OS command, a file name, a `LIKE` pattern |
| `SqlInjectionValidator` | judge whether an input matches the safe pattern, and escape `LIKE` wildcards |

### Sanitization policies

`HtmlSanitizer.sanitize(html)` removes every element and keeps the text. `sanitizeWithPolicy(html, policy)` chooses how much HTML stays.

| Policy | Keeps |
|---|---|
| `STRICT` | no HTML |
| `PLAIN_TEXT` | the text, with every element removed |
| `BASIC_FORMATTING` | basic text formatting |
| `FORMATTING_WITH_LINKS` | formatting and safe links |
| `RICH_TEXT` | formatting, links, tables and images |

For the input `<b>B</b><a href="https://x.dev">l</a><script>x</script>`, `BASIC_FORMATTING` returns `<b>B</b>l`, `FORMATTING_WITH_LINKS` returns `<b>B</b><a href="https://x.dev" rel="nofollow">l</a>` and `PLAIN_TEXT` returns `Bl`. `RICH_TEXT` also keeps tables and images.

The policy is an `HtmlSanitizer.SanitizationPolicy`. `HtmlSanitizer.sanitize(html)` without a policy removes every tag, `escapeHtml(html)` turns the markup into entities instead of removing it, and `containsDangerousContent(html)` tells whether a text carries script: it answers true for `<img src=x onerror=alert(1)>` and for the encoded form `%3Cscript%3E`, and false for `<b>ok</b>`.

### Masking by field name

`LogMasker.maskFieldValue(fieldName, value)` chooses the masking from the name of the field: a name containing `password`, `secret`, `token` or `apikey` gives `********`, one containing `email` is masked as an e-mail, and one containing `phone`, `mobile` or `tel` as a phone number.

## What each masking function returns

| Call | Result | Keeps |
|---|---|---|
| `maskEmail("ursula@example.com")` | `ur***@example.com` | the start of the local part and the domain |
| `maskEmail("a@example.com")` | `**@example.com` | the domain, when the local part is short |
| `maskPhoneNumber("010-1234-5678")` | `010-****-****` | the area code |
| `maskCreditCard("4111-1111-1111-1111")` | `****-****-****-1111` | the last four digits |
| `maskRRN("900101-1234567")` | `900101-*******` | the birth date part |
| `maskIpAddress("192.168.10.25")` | `192.168.10.0` | the network part |
| `maskIpAddress("2001:db8:85a3::8a2e:370:7334")` | `2001:db8:85a3::8a2e:370:0` | everything but the last group |
| `maskPaymentToken("pm_1234567890abcdef")` | `pm_****cdef` | the prefix and the last four characters |
| `maskGeneric("AB1234567890", 2, 2)` | `AB********90` | the given number of characters at each end |
| `maskFull("secret-value", 8)` | `********` | nothing; the length is capped at the given maximum |

## Mask free text before logging

`LogMasker` finds sensitive values inside a sentence. `maskSensitiveData` applies every pattern; the other methods apply one.

| Call | Result |
|---|---|
| `maskEmail("mail ursula@example.com now")` | `mail ur***@example.com now` |
| `maskPhoneNumber("call 010-1234-5678")` | `call 010-****-****` |
| `maskRRN("rrn 900101-1234567")` | `rrn 900101-*******` |
| `maskPassword("password=hunter2&x=1")` | `password=********` |
| `maskIPAddress("from 192.168.10.25")` | `from 192.168.10.0` |
| `containsSensitiveData("card 4111-1111-1111-1111")` | `true` |

`maskSensitiveData` masks e-mail addresses, phone numbers, card numbers, resident registration numbers and passwords. It leaves IP addresses as they are; call `maskIPAddress` for those.

## Escape a value for where it goes

`InputSanitizer` prepares a value for one destination. Use the method of the place the value is written into.

| Call | Result | Note |
|---|---|---|
| `sanitizeForHtml("<b>&\"x\"</b>")` | `&lt;b&gt;&amp;&quot;x&quot;&lt;&#x2F;b&gt;` | every HTML metacharacter becomes an entity |
| `sanitizeForJavaScript("a'b\"c</script>")` | `a\'b\"c\x3C\/script\x3E` | safe inside a script string |
| `sanitizeForLdap("a*(b)\\c")` | `abc` | LDAP filter characters are removed |
| `sanitizeForOsCommand("file; rm -rf /")` | `file rm -rf /` | shell separators are removed; never build a command line from user input when an argument list is possible |
| `sanitizeFileName("../../etc/pass wd?.txt")` | `etcpasswd.txt` | path parts and unusual characters are removed |
| `escapeLikePattern("50%_off")` | `50\%\_off` | the wildcards of `LIKE` are escaped |
| `sanitizeForSql("O'Brien; DROP TABLE x")` | an empty text | a value that looks like an injection is rejected whole; bind parameters remain the protection against SQL injection |

## Judge an input

`SqlInjectionValidator` answers yes or no. Create it with `new`; it keeps no state, so one instance can be shared.

| Call | Result |
|---|---|
| `isSafeInput("Ursula Le Guin")` | `true` |
| `isSafeInput("x' OR 1=1 --")`, `isSafeInput("DROP TABLE users")` | `false` |
| `isSafeEmail("ursula@example.com")` | `true` |
| `isSafePhoneNumber("+821012345678")` | `true`; `010-1234` is refused, the number is in international form without separators |
| `isValidSortField("penName", List.of("penName", "createdAt"))` | `true`; a field that is not in the list is refused |
| `isValidPagination(0, 20)` | `true`; a negative page or a very large size is refused |
| `isValidUUID(id)`, `isAlphanumeric(text, allowSpaces)`, `isSafeHash(hash)` | format checks |
| `sanitizeInput("x' OR 1=1 --")` | `x OR 1=1` |

It refuses SQL keywords (`SELECT`, `DROP`, `UNION` and others), comment marks, quotes and semicolons, hexadecimal literals, tautologies such as `OR 1=1 OR`, timing functions, system tables and file functions. A name like `O'Brien` is refused as well, so use it for identifiers, codes and sort fields, not for free text.

## Search a value without storing it

`HashingUtils.hash(value)` gives the SHA-256 of a value as 44 Base64 characters. The same input always gives the same hash, so an encrypted column can be found through a hash column beside it. `HashingAttributeConverter` hashes on the way to the database and leaves a value that is already a hash unchanged.

```java
@Column(name = "email_hash")
@Convert(converter = HashingAttributeConverter.class)
private String emailHash;
```

Normalise the value before it is stored, for example `email.toLowerCase().trim()`. A query through the converted attribute accepts the plain value as well as its hash: the converter hashes a plain parameter the same way.

### Hashing functions

| Call | Result |
|---|---|
| `HashingUtils.hash("ursula@example.com")` | `ALQdJLZSQvjJmM7KT6a5ps6ip4QjskVXrW5yrlBQJ28=` |
| `HashingUtils.hash(value, "SHA-512")` | 88 Base64 characters |
| `HashingUtils.isValidHash(text)` | `true` for a SHA-256 hash in Base64, `false` for other text |
| `HashingUtils.isValidHashForAlgorithm(text, "SHA-512")` | the same check for another algorithm |
| `HashingUtils.hash(value, "NOPE")` | throws `HashingUtils.HashingException` |

A hash is not encryption: the value cannot be recovered from it, and a value from a small set, such as a phone number, can be found by hashing every candidate. Keep the readable value in an encrypted column and use the hash only to find the row.

## Mask at the entity

`UniversalMaskingListener` masks the fields marked `@MaskSensitive` before the entity is inserted or updated, so the table holds the masked value. Use it for values that never have to be read back in full.

```java
@Entity
@EntityListeners(UniversalMaskingListener.class)
public class PaymentMethod extends SimpliXBaseEntity<String> {

    @MaskSensitive(type = MaskSensitive.MaskType.PARTIAL, keepFirst = 4, keepLast = 4)
    private String accountNumber;
}
```

| `MaskType` | Result |
|---|---|
| `FULL` | the whole value is masked |
| `PARTIAL` | the first `keepFirst` and last `keepLast` characters stay |
| `EMAIL` | the start of the local part and the domain stay |
| `PHONE` | the area code stays |
| `CREDIT_CARD` | the last four digits stay |
| `PAYMENT_TOKEN` | the prefix and the last characters stay |
| `IP_ADDRESS` | the first two octets stay |
| `JSON` | sensitive values inside a JSON text are masked |

| Attribute of `@MaskSensitive` | Default | Meaning |
|---|---|---|
| `type` | `FULL` | the rule, a `MaskSensitive.MaskType` |
| `keepFirst` | `3` | characters kept at the start, for `PARTIAL` |
| `keepLast` | `4` | characters kept at the end, for `PARTIAL` |
| `minLength` | `0` | a value shorter than this is stored as it is |
| `enabled` | `true` | `false` leaves the field unmasked |
| `maskChar` | `*` | no effect: the listener always masks with `*` |

The listener masks `String` fields only, and `FULL` writes at most 50 mask characters whatever the length of the value. The masked value is what the database holds: the original cannot be read back, so do not use the listener on a field the application has to show or compare later.

`MaskingConverter` is for a value that has to be recoverable: it stores the value encrypted with AES-GCM and gives the entity `****MASKED****` when it is read. The key is `simplix.core.masking.key`, at least 32 characters; without it a fixed development key is used, which is not safe for production. `simplix.core.masking.enabled: false` switches the converter off, and the JVM system property `simplix.core.masking.unmask=true` makes it return the decrypted value. For encryption with key rotation, use [simplix-encryption](en/encryption/readme.md).

## Mask an IP address for a record you keep

```java
IpAddressMaskingUtils.maskSubnetLevel("192.168.10.25");                  // 192.168.10.0
IpAddressMaskingUtils.maskSubnetLevel("2001:db8:85a3::8a2e:370:7334");   // 2001:db8:85a3::8a2e:370:0
IpAddressMaskingUtils.maskSubnetLevel("not-an-ip");                      // not-an-ip
IpAddressMaskingUtils.isMasked("192.168.10.0");                          // true
IpAddressMaskingUtils.isValidIpAddress("192.168.10.25");                 // true
```

| Method of `IpAddressMaskingUtils` | Returns |
|---|---|
| `maskSubnetLevel(ip)` | the address with its last part set to zero, so that the network stays visible and the host does not; `null` for `null`, and the text unchanged when it is not an address |
| `isMasked(ip)` | whether the address ends in zero. An address that really ends in zero, such as `10.0.0.0`, also answers true |
| `isValidIpAddress(ip)` | whether the text is an IPv4 or IPv6 address |

Use it for audit and access records: an address at the level of its subnet still shows where requests come from.

## Which tool for which risk

| Risk | Use |
|---|---|
| markup in text a user typed | `@SafeHtml` on the DTO field, or `HtmlSanitizer` where the text is stored or shown |
| user input in a query you build as text, such as a sort column | bound parameters first; `SqlInjectionValidator` for what cannot be bound |
| personal data in a log line | `LogMasker` on the text before it is logged |
| personal data in an API response or a stored audit record | `DataMaskingUtils`, `@MaskSensitive` and `IpAddressMaskingUtils` |
| looking a value up without storing it readable | `HashingUtils` for the search column; passwords go through the `PasswordEncoder` of Spring Security, not through `HashingUtils` |

## Related documents

- [Validating input](en/core/validating-input.md)
- [simplix-encryption](en/encryption/readme.md)
