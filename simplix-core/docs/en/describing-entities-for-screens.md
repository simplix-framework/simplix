# Describing entities for screens

Annotations that say what a field means, beyond its Java type: which field names a record, which number is money, which status is a warning. SimpliX Meta, the metadata endpoint of the [starter](../../../spring-boot-starter-simplix/README.md), publishes them, so a client draws a list, a badge or a form from the contract instead of guessing.

```java
@Entity
@NameFields({"loanCode", "createdAt"})
public class Loan extends BaseEntity<String> {

    @CodeValue
    private String loanCode;

    @MoneyValue(currency = "KRW")
    private Long lateFee;

    @DurationValue
    private Long processingMillis;

    @BooleanTone(whenTrue = ToneKind.DANGER, whenFalse = ToneKind.SUCCESS)
    private boolean overdue;

    @VerbOnly
    private boolean closed;

    @References(Author.class)
    @ElementCollection
    private List<String> authorIds;
}

public enum LoanStatus {
    @Tone(ToneKind.INFO) OPEN,
    @Tone(ToneKind.SUCCESS) RETURNED,
    @Tone(ToneKind.DANGER) OVERDUE
}
```

## The name of a record

| Annotation | On | Meaning |
|---|---|---|
| `@NameField` | a field | the field a record is named by: the first column of its list, the name in a delete confirmation, the title of its detail. `order` places it when several fields form the name |
| `@NameFields` | the entity | the same, declared as a list; the form for a name that uses an inherited field. An entity uses one form or the other |

## The format of a value

| Annotation | The field holds | Published as |
|---|---|---|
| `@MoneyValue(currency, scale)` | an amount in the smallest stored unit of the currency | `format: "money"` |
| `@CreditValue(signed)` | an amount of credits; `signed` for a ledger amount whose sign is its direction | `format: "credits"` or `"signedCredits"` |
| `@BytesValue` | a size in bytes | `format: "bytes"` |
| `@DurationValue` | a length of time in milliseconds | `format: "duration"` |
| `@CodeValue` | a code a reader types or compares character by character | `format: "code"` |
| `@ExcerptValue` | machine-written text a reader copies, such as an error message or a hash | `format: "excerpt"` |

Placed on the entity field, a format reaches every DTO field mapped to it. Placed on a DTO field, it covers a derived value that has no column.

## The tone of a status

| Annotation | On | Meaning |
|---|---|---|
| `@Tone(ToneKind)` | an enum constant | the tone a badge of that value takes; a constant without it is neutral |
| `@BooleanTone(whenTrue, whenFalse)` | a boolean field | the tone of each value of the flag |

`ToneKind` is `NEUTRAL`, `INFO`, `SUCCESS`, `WARNING`, `DANGER`, `PENDING` or `PROCESSING`. `PENDING` is a value waiting for something to start, `PROCESSING` one whose work is running now.

## References and behaviour

| Annotation | On | Meaning |
|---|---|---|
| `@References` | a field | the field holds the id, or a collection of ids, of another entity where the JPA mapping does not say so; `field` names another unique field of the target |
| `@ReferencesByKind` | a field | the field holds the id of one of several entities, and `kindField` names the sibling field that says which |
| `@MappingEntity` | an entity | the rows map one record to another and own nothing themselves, so the entity is not listed as a holder of the records it joins |
| `@VerbOnly` | a field | the value changes only through an action of its own, such as enable and disable, never through the create or update form |
| `@FieldLabel` | a DTO field, or the getter of a property no field holds | a label for the field |

### A reference the mapping does not show

```java
// A plain id column that names a record of another entity
@References(value = Author.class, nameField = "authorName")
@Column(name = "author_id")
private String authorId;

// An id that names a member or a branch, according to ownerType
@ReferencesByKind(
    kindField = "ownerType",
    kinds = {
        @ReferencesByKind.Kind(value = "MEMBER", entity = "Member"),
        @ReferencesByKind.Kind(value = "BRANCH", entity = "Branch")
    },
    nameField = "ownerName"
)
@Column(name = "owner_id")
private String ownerId;
```

| Attribute | Of | Meaning |
|---|---|---|
| `value` | `@References` | the class of the referenced entity |
| `entity` | `@References` | the simple name of the referenced entity, for an entity in a module this one does not depend on; name the target by `value` or by `entity`, never by both |
| `field` | `@References` | the unique field of the target the value holds, when it is not the id |
| `nameField` | both | the property of this record that carries the name of the referenced record, so a screen can show a name beside the id |
| `kindField` | `@ReferencesByKind` | the sibling field whose value says which entity the id names, usually an enum |
| `kinds` | `@ReferencesByKind` | one `@ReferencesByKind.Kind` per value of the kind field: `value` is the kind and `entity` the simple name of the entity it names |

A column paired with a `@ManyToOne` over the same join column needs neither annotation: the reference is read from the JPA mapping.

## Related documents

- [Entities and repositories](./entities-and-repositories.md)
- [spring-boot-starter-simplix](../../../spring-boot-starter-simplix/README.md): the metadata endpoint that publishes these annotations
