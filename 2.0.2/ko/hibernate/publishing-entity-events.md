# 엔티티 이벤트 발행

레코드가 생성 · 수정 · 삭제될 때 대응하는 코드를 서비스마다 호출하지 않고 처리하는 방법을 설명합니다. 엔티티에 이벤트를 선언하면, 애플리케이션의 리스너가 트랜잭션 안에서 또는 트랜잭션 후에 이벤트를 받습니다.

## 1단계. 이벤트 선언

```java
@Entity
@Table(name = "branches")
@EntityListeners(EntityEventPublishingListener.class)
@EntityEventConfig(onCreate = "BRANCH_OPENED", onUpdate = "BRANCH_CHANGED", onDelete = "BRANCH_CLOSED")
@Getter
@Setter
@NoArgsConstructor
public class Branch extends SimpliXBaseEntity<String> implements EntityEventPayloadProvider {

    @Id
    @UuidV7Generator
    private String branchId;

    private String name;
    private boolean open = true;

    @Override
    public Map<String, Object> getEventPayloadData() {
        return Map.of("name", name);
    }

    @Override
    public String getId() {
        return branchId;
    }

    @Override
    public void setId(String id) {
        this.branchId = id;
    }
}
```

`@EntityListeners`로 리스너를 등록하고 `@EntityEventConfig`로 이벤트 이름을 지정합니다. `EntityEventPayloadProvider`는 선택 사항이며, 모든 이벤트에 포함되는 `id`와 `className` 외에 페이로드에 데이터를 추가합니다.

## 2단계. 이벤트 수신

```java
@Component
public class BranchEvents {

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void record(EventMessage event) {
        // runs in the same transaction, before the commit
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void notify(EventMessage event) {
        // runs once the change is committed
    }
}
```

| 리스너 | 실행 시점 | 용도 |
|---|---|---|
| `@EventListener` | 이벤트가 발행되는 즉시 | 트랜잭션 결과와 무관한 작업 |
| `@TransactionalEventListener(BEFORE_COMMIT)` | 커밋 전, 같은 트랜잭션 안 | 아웃박스 행처럼 변경과 함께 성공하거나 실패해야 하는 기록 |
| `@TransactionalEventListener(AFTER_COMMIT)` | 커밋이 성공한 뒤 | 알림과 다른 시스템 호출 |

## 이벤트의 내용

이름이 Central인 지점을 생성하고, 이름을 바꾸고, 삭제하면 다음 이벤트가 발행됩니다.

| 이벤트 타입 | 페이로드 | 변경된 속성 |
|---|---|---|
| `BRANCH_OPENED` | `{name=Central, className=Branch, id=<id>}` | 없음 |
| `BRANCH_CHANGED` | `{name=Central Library, className=Branch, id=<id>}` | `name` |
| `BRANCH_CLOSED` | `{name=Central Library, className=Branch, id=<id>}` | 없음 |

- 수정 이벤트는 속성이 바뀌었을 때만 발행합니다. `ignoreProperties`와 `watchProperties`로 대상 변경을 좁힐 수 있습니다.
- 삭제 이벤트는 행을 제거하기 전에 발행하므로, 페이로드에서 엔티티를 읽을 수 있습니다.
- `SoftDeletable`을 구현하고 갱신으로 삭제하는 엔티티는 삭제 이벤트를 발행합니다.
- `event.actor()`는 변경한 인증 사용자입니다.
- `@Modifying` 쿼리는 엔티티를 불러오지 않고 행을 변경하므로 이벤트를 발행하지 않습니다.

## 발행에 실패했을 때

| `failOnError` | 페이로드 구성이나 즉시 실행 리스너에서 실패했을 때 | 용도 |
|---|---|---|
| `true`(기본값) | 트랜잭션을 롤백 | 변경과 함께 저장되어야 하는 이벤트 |
| `false` | 로그에 기록하고 트랜잭션을 커밋 | 유실되어도 업무 처리를 막으면 안 되는 감사 기록과 알림 |

`BEFORE_COMMIT` 리스너의 본문에서 발생한 예외는 이 설정과 관계없이 항상 트랜잭션을 롤백합니다.

## 일괄 작업의 이벤트 생략

```java
EventContext.suppressEvents(() -> importService.importAuthors(rows));
```

## 관련 문서

- [트랜잭션 커밋 방식](ko/hibernate/how-it-works.md)
- [이벤트 발행](ko/core/publishing-events.md): `@EntityEventConfig`의 속성
