# 화면을 위한 엔티티 설명

필드의 Java 타입만으로는 알 수 없는 의미를 표시하는 어노테이션을 설명합니다. 어느 필드가 레코드의 이름인지, 어느 숫자가 금액인지, 어느 상태가 경고인지를 지정합니다. [스타터](../../../spring-boot-starter-simplix/README.ko.md)의 메타데이터 엔드포인트인 SimpliX Meta가 이 정보를 제공하므로, 클라이언트는 추측하지 않고 계약에 따라 목록, 배지, 폼을 그립니다.

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

## 레코드의 이름

| 어노테이션 | 지정 위치 | 의미 |
|---|---|---|
| `@NameField` | 필드 | 레코드의 이름으로 사용하는 필드: 목록의 첫 열, 삭제 확인 문구의 이름, 상세 화면의 제목. 여러 필드로 이름을 구성할 때는 `order`로 순서를 지정합니다 |
| `@NameFields` | 엔티티 | 같은 내용을 목록으로 선언합니다. 상속받은 필드를 이름에 사용할 때 쓰는 형식이며, 엔티티에는 둘 중 한 형식만 사용합니다 |

## 값의 형식

| 어노테이션 | 필드의 값 | 제공 형식 |
|---|---|---|
| `@MoneyValue(currency, scale)` | 통화의 최소 저장 단위로 표현한 금액 | `format: "money"` |
| `@CreditValue(signed)` | 크레딧 수량. `signed`는 부호로 방향을 나타내는 원장 금액 | `format: "credits"` 또는 `"signedCredits"` |
| `@BytesValue` | 바이트 단위 크기 | `format: "bytes"` |
| `@DurationValue` | 밀리초 단위 시간 길이 | `format: "duration"` |
| `@CodeValue` | 사용자가 입력하거나 문자 단위로 비교하는 코드 | `format: "code"` |
| `@ExcerptValue` | 오류 메시지나 해시처럼 사용자가 복사하는 기계 생성 문자열 | `format: "excerpt"` |

엔티티 필드에 지정한 형식은 그 필드에 매핑된 모든 DTO 필드에 적용됩니다. DTO 필드에 지정하면 컬럼이 없는 파생 값에 적용됩니다.

## 상태의 색조

| 어노테이션 | 지정 위치 | 의미 |
|---|---|---|
| `@Tone(ToneKind)` | 열거형 상수 | 해당 값의 배지에 적용할 색조. 지정하지 않은 상수는 중립입니다 |
| `@BooleanTone(whenTrue, whenFalse)` | 불리언 필드 | 플래그의 값별 색조 |

`ToneKind`는 `NEUTRAL`, `INFO`, `SUCCESS`, `WARNING`, `DANGER`, `PENDING`, `PROCESSING` 중 하나입니다. `PENDING`은 시작을 기다리는 값이고, `PROCESSING`은 작업이 진행 중인 값입니다.

## 참조와 동작

| 어노테이션 | 지정 위치 | 의미 |
|---|---|---|
| `@References` | 필드 | JPA 매핑만으로는 알 수 없지만, 필드에 다른 엔티티의 식별자나 식별자 컬렉션이 저장되어 있음을 표시합니다. `field`로 대상의 다른 고유 필드를 지정할 수 있습니다 |
| `@ReferencesByKind` | 필드 | 필드에 여러 엔티티 중 한 엔티티의 식별자가 저장되어 있으며, `kindField`로 지정한 필드가 그 엔티티를 결정합니다 |
| `@MappingEntity` | 엔티티 | 레코드와 레코드를 연결하는 매핑 행만 보관하는 엔티티입니다. 연결한 레코드의 보유 엔티티 목록에 포함하지 않습니다 |
| `@VerbOnly` | 필드 | 활성화와 비활성화처럼 전용 동작으로만 값이 바뀌며, 생성이나 수정 폼으로는 바뀌지 않습니다 |
| `@FieldLabel` | DTO 필드, 또는 필드 없이 getter가 계산하는 속성의 getter | 필드의 라벨 |

### 매핑에 나타나지 않는 참조

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

| 속성 | 어노테이션 | 의미 |
|---|---|---|
| `value` | `@References` | 참조하는 엔티티의 클래스 |
| `entity` | `@References` | 참조하는 엔티티의 단순 이름. 이 모듈이 의존하지 않는 모듈의 엔티티에 사용합니다. 대상은 `value`와 `entity` 중 하나로만 지정합니다 |
| `field` | `@References` | 값이 대상의 식별자가 아닌 다른 유일 필드를 가리킬 때 그 필드 |
| `nameField` | 공통 | 참조한 레코드의 이름을 보관하는 이 레코드의 프로퍼티. 화면에서 식별자와 함께 이름을 표시할 수 있습니다 |
| `kindField` | `@ReferencesByKind` | 식별자가 어느 엔티티를 가리키는지 나타내는 같은 엔티티의 필드. 보통 열거형입니다 |
| `kinds` | `@ReferencesByKind` | 종류 필드의 값마다 지정하는 `@ReferencesByKind.Kind`. `value`는 종류 값, `entity`는 해당 엔티티의 단순 이름입니다 |

같은 조인 컬럼에 `@ManyToOne`이 함께 선언된 컬럼에는 이 어노테이션이 필요하지 않습니다. 참조 정보를 JPA 매핑에서 읽습니다.

## 관련 문서

- [엔티티와 저장소](./entities-and-repositories.md)
- [spring-boot-starter-simplix](../../../spring-boot-starter-simplix/README.ko.md): 이 어노테이션의 정보를 제공하는 메타데이터 엔드포인트
