# 입력 검증

SimpliX가 추가로 제공하는 Bean Validation 제약을 설명합니다. 테이블에서 고유해야 하는 값, 서비스에 위임하는 검사, 안전해야 하는 HTML을 다룹니다. `@NotBlank`처럼 DTO에 사용하며, 검증에 실패하면 검증 오류로 응답합니다.

## 고유한 값

필드에 `@Unique`를 지정하면 엔티티 테이블에 값이 같은 행이 없는지 검사합니다.

```java
@Getter
@Setter
public class AuthorRegistration {

    @NotBlank
    @Unique(entity = Author.class, field = "penName")
    private String penName;

    @SafeHtml(allowBasicFormatting = true)
    private String biography;
}
```

이름이 `Ursula`인 작가가 저장되어 있으면, 같은 필명으로 요청한 등록은 `penName`에서 거부됩니다. 메시지 키는 `validation.unique`입니다.

### 수정할 때

수정할 때는 해당 레코드 자신을 비교 대상에서 제외해야 합니다. 클래스에 지정하는 `@UniqueFields`는 DTO에서 레코드의 식별자를 읽습니다. `idProperty`에는 DTO 속성을, `idField`에는 엔티티 필드를 지정합니다.

```java
@UniqueFields({
    @UniqueField(entity = Author.class, field = "penName", property = "penName", idProperty = "authorId", idField = "authorId")
})
public class AuthorUpdate {

    private String authorId;
    private String penName;
}
```

### 여러 필드 조합

`@UniqueComposites`는 필드 조합의 고유성을 검사하고, 실패를 `errorProperty`에 보고합니다. 메시지 키는 `validation.unique.composite`입니다. 값 중에 `null`이 있는 조합은 검사하지 않습니다.

```java
@UniqueComposites({
    @UniqueComposite(
        entity = Category.class,
        fields = {"parentId", "name"},
        properties = {"parentId", "name"},
        errorProperty = "name"
    )
})
public class CategoryCreate {

    private String parentId;
    private String name;
}
```

### 속성

| 속성 | 기본값 | 의미 |
|---|---|---|
| `entity` | 필수 | 검색할 테이블의 엔티티 |
| `field` / `fields` | 필수 | 비교하는 엔티티 필드 |
| `property` / `properties` | 클래스 단위 형식에서 필수 | 값을 담은 DTO 속성 |
| `idField` | `id` | 엔티티의 식별자 필드 |
| `idProperty` | 없음 | 수정하는 레코드의 식별자를 담은 DTO 속성 |
| `softDeleteField` | 없음 | 삭제된 행을 표시하는 엔티티 필드 |
| `softDeleteType` | `NONE` | `SoftDeleteType` 값. 플래그이면 `BOOLEAN`, 삭제 시각이면 `TIMESTAMP`. 삭제된 행은 검사에서 제외합니다 |

## 서비스에 위임하는 검사

`@ValidateWith`는 `빈이름.메서드이름` 형식으로 지정한 Spring 빈의 메서드를 호출합니다. 메서드는 public이어야 하고, 값을 인자로 받아 boolean을 반환합니다. 클래스에 지정하면 DTO 전체를 인자로 받습니다.

```java
public class LoanRequest {

    @ValidateWith(service = "memberService.canBorrow", message = "This member cannot borrow")
    private Long memberId;
}

@Service
public class MemberService {

    public boolean canBorrow(Long memberId) {
        return memberRepository.existsById(memberId);
    }
}
```

## 안전한 HTML

`@SafeHtml`은 OWASP 새니타이저가 변경하게 되는 값을 거부합니다. `<script>` 요소가 있는 값이 그 예입니다. 위의 등록 DTO는 `<b>Writer</b>`를 허용하고 `<b>Writer</b><script>alert(1)</script>`를 거부합니다.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `allowBasicFormatting` | `false` | `<b>`, `<i>` 같은 서식 요소 허용 |
| `allowLinks` | `false` | `<a>` 요소 허용 |
| `allowedTags` | 없음 | 추가로 허용할 요소 이름 |
| `maxLength` | `-1` | 허용하는 최대 길이. `-1`은 제한 없음 |

값을 거부하지 않고 정리하려면 `HtmlSanitizer`를 사용하세요. [민감한 데이터 보호](ko/core/protecting-sensitive-data.md)에 설명이 있습니다.

## 관련 문서

- [API 응답과 오류](ko/core/api-responses-and-errors.md)
- [민감한 데이터 보호](ko/core/protecting-sensitive-data.md)
