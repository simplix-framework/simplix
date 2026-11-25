# 엔티티와 저장소

SimpliX 기본 클래스로 엔티티와 저장소를 작성하는 방법을 설명합니다. 식별자, 복합 키, 소프트 삭제, JSON을 저장하는 컬럼을 다룹니다.

## 엔티티 작성

`SimpliXBaseEntity<K>`는 `getId`와 `setId` 구현을 요구합니다. SimpliX가 생성하는 서비스와 컨트롤러가 이 메서드로 식별자를 읽으므로, 필드 이름은 자유롭게 지정할 수 있습니다.

```java
@Entity
@Table(name = "articles")
@SQLDelete(sql = "UPDATE articles SET deleted = true WHERE article_id = ?")
@SQLRestriction("deleted = false")
@Getter
@Setter
@NoArgsConstructor
public class Article extends SimpliXBaseEntity<String> implements SoftDeletable {

    @Id
    @UuidV7Generator
    @Column(name = "article_id")
    private String articleId;

    @Column(nullable = false)
    private String title;

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> tags = new ArrayList<>();

    @Column(nullable = false)
    private boolean deleted = false;

    @Override
    public String getId() {
        return articleId;
    }

    @Override
    public void setId(String id) {
        this.articleId = id;
    }
}
```

### 시간순 식별자

`@UuidV7Generator`는 `String` 식별자에 UUID 버전 7 값을 생성합니다. 앞쪽 비트가 생성 시각이므로 새 행이 기존 행 뒤에 정렬되고, 인덱스 페이지가 순서대로 채워집니다. 엔티티 밖에서는 `UuidUtils.generateUuidV7()`로 같은 형식의 값을 얻습니다.

| `UuidUtils` 메서드 | 반환 |
|---|---|
| `generateUuidV7()`, `generateUuidV7Object()` | 버전 7 UUID. 36자 문자열 또는 `UUID` 객체입니다 |
| `generateShortUuid()` | 8자 문자열. 좁은 범위에서만 유일하면 되는 값에 사용합니다 |
| `generateTraceId()` | 시간순으로 정렬되는 13자 문자열. 예: `01a20e3c695a7` |
| `extractTimestamp(uuid)` | 버전 7 UUID의 생성 시각(밀리초) |
| `isUuidV7(uuid)` | UUID가 버전 7인지 여부 |
| `generateUuidV4()`, `generateUuidV4Object()` | 무작위 UUID. 생성 시각이 드러나면 안 되는 값에 사용합니다 |

### 컬럼 하나에 목록과 맵 저장

`JsonListConverter`는 `List<String>`을 텍스트 컬럼에 JSON 배열로 저장하고, `JsonMapConverter`는 `Map<String, String>`을 JSON 객체로 저장합니다. 파싱할 수 없는 값은 빈 목록으로 읽습니다.

## 저장소 작성

```java
public interface AuthorRepository extends SimpliXBaseRepository<Author, String> {
}
```

`SimpliXBaseRepository`는 `JpaSpecificationExecutor`를 포함한 `JpaRepository`입니다. 저장소는 [시작하기](ko/getting-started.md)에 있는 대로 `SimpliXRepositoryFactoryBean`으로 등록하세요.

## 소프트 삭제

위의 `Article`은 삭제할 때 행을 지우지 않고 갱신합니다. `@SQLDelete`가 플래그를 설정하고, `@SQLRestriction`이 플래그가 설정된 행을 모든 조회에서 제외합니다. `repository.delete(article)`을 실행하면 행은 테이블에 남지만, `existsById`와 `findById`로는 조회되지 않습니다.

`SoftDeletable`은 이런 갱신이 삭제라는 사실을 SimpliX에 알립니다. 생명주기 이벤트를 발행하는 엔티티는 이때 수정 이벤트 대신 삭제 이벤트를 발행합니다. 자세한 내용은 [이벤트 발행](ko/core/publishing-events.md)을 참고하세요.

Hibernate `@Filter`로 행을 숨기는 애플리케이션에서도 `findById`의 결과가 같습니다. 저장소 기본 클래스는 세션에서 활성화된 필터를 통과한 행만 식별자 조회 결과로 반환합니다.

## 복합 키

키 클래스는 `SimpliXCompositeKey`를 구현하고 정적 팩토리 `fromUrlPath`와 `fromString`을 제공합니다. `toCompositeKeyString`은 필드를 `__`로 연결하며, URL에서 키를 이 형태로 표기합니다.

```java
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class LoanId implements SimpliXCompositeKey {

    private Long memberId;
    private String authorId;

    public static LoanId fromUrlPath(String... pathVariables) {
        if (pathVariables.length != 2) {
            throw new IllegalArgumentException("Expected the member id and the author id");
        }
        return new LoanId(Long.parseLong(pathVariables[0]), pathVariables[1]);
    }

    public static LoanId fromString(String compositeId) {
        return fromUrlPath(compositeId.split("__"));
    }

    @Override
    public SimpliXCompositeKey fromPathVariables(String... pathVariables) {
        return fromUrlPath(pathVariables);
    }

    @Override
    public SimpliXCompositeKey fromCompositeId(String compositeId) {
        return fromString(compositeId);
    }

    @Override
    public void validate() {
        if (memberId == null || authorId == null) {
            throw new IllegalArgumentException("Both parts of the loan id are required");
        }
    }

    @Override
    public String toString() {
        return toCompositeKeyString();
    }
}
```

`new LoanId(7L, "a1").toString()`은 `7__a1`을 반환하고, `LoanId.fromString("7__a1")`은 이 문자열에서 키를 복원합니다.

## 엔티티와 DTO 변환

| 메서드 | 동작 |
|---|---|
| `DtoUtils.toDto(entity, Dto.class)` | 엔티티 한 건을 DTO로 매핑 |
| `DtoUtils.toDtoList(entities, Dto.class)` | 목록을 매핑 |
| `DtoUtils.toDtoPage(page, Dto.class)` | 페이지를 매핑하고 페이징 정보를 유지 |
| `EntityUtils.convertToEntity(source, Entity.class)` | 필드 이름이 정확히 일치하는 값을 엔티티로 매핑하며, null 값은 건너뜀 |
| `EntityUtils.getEntityId(entity)` | `@Id` 필드의 값을 조회 |

## 관련 문서

- [트리 구조](ko/core/tree-structures.md)
- [화면을 위한 엔티티 설명](ko/core/describing-entities-for-screens.md)
- [CRUD API 만들기](ko/building-a-crud-api.md)
