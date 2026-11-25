# Validating input

Bean Validation constraints that SimpliX adds: values that must be unique in a table, checks delegated to a service, and HTML that must be safe. They are used on DTOs like `@NotBlank`, and a failure is answered as a validation error.

## Unique values

`@Unique` on a field checks that no row of the entity has the same value.

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

With an author named `Ursula` stored, a registration with the same pen name is refused on `penName`. The message key is `validation.unique`.

### On update

An update has to leave the record itself out of the comparison. `@UniqueFields` on the class reads the record's id from the DTO: `idProperty` names the DTO property, `idField` the entity field.

```java
@UniqueFields({
    @UniqueField(entity = Author.class, field = "penName", property = "penName", idProperty = "authorId", idField = "authorId")
})
public class AuthorUpdate {

    private String authorId;
    private String penName;
}
```

### Across several fields

`@UniqueComposites` checks a combination of fields, and reports the failure on `errorProperty`. Its message key is `validation.unique.composite`. A combination in which a value is `null` is not checked.

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

### Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `entity` | required | the entity whose table is searched |
| `field` / `fields` | required | the entity field or fields compared |
| `property` / `properties` | required on the class-level forms | the DTO properties that hold the values |
| `idField` | `id` | the identifier field of the entity |
| `idProperty` | none | the DTO property that holds the id of the record being updated |
| `softDeleteField` | none | the entity field that marks a deleted row |
| `softDeleteType` | `NONE` | a `SoftDeleteType`: `BOOLEAN` for a flag, `TIMESTAMP` for a deletion time; deleted rows are left out of the check |

## A check a service makes

`@ValidateWith` calls a method of a Spring bean, written as `beanName.methodName`. The method is public, takes the value and returns a boolean. On a class, it receives the whole DTO.

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

## Safe HTML

`@SafeHtml` refuses a value that the OWASP sanitizer would change, such as one with a `<script>` element. The registration above accepts `<b>Writer</b>` and refuses `<b>Writer</b><script>alert(1)</script>`.

| Attribute | Default | Meaning |
|---|---|---|
| `allowBasicFormatting` | `false` | accepts formatting elements such as `<b>` and `<i>` |
| `allowLinks` | `false` | accepts `<a>` elements |
| `allowedTags` | none | further element names to accept |
| `maxLength` | `-1` | the longest value accepted; `-1` is unlimited |

To clean a value instead of refusing it, use `HtmlSanitizer`; see [Protecting sensitive data](en/core/protecting-sensitive-data.md).

## Related documents

- [API responses and errors](en/core/api-responses-and-errors.md)
- [Protecting sensitive data](en/core/protecting-sensitive-data.md)
