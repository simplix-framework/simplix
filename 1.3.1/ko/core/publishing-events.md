# 이벤트 발행

SimpliX의 이벤트 모델을 설명합니다. 엔티티가 생성 · 수정 · 삭제될 때 발행하는 이벤트와, 모듈이 전달 방식과 무관하게 자체 이벤트를 발행하는 인터페이스를 다룹니다.

## 엔티티 이벤트

엔티티에 `@EntityEventConfig`를 지정해 삽입 · 수정 · 삭제 시 발행할 이벤트를 정합니다. 이벤트를 발행하는 리스너 `EntityEventPublishingListener`는 [simplix-hibernate](ko/hibernate/readme.md)에 있으며, `@EntityListeners`로 엔티티에 등록합니다. 리스너는 Spring 이벤트 버스에 `EventMessage`를 발행합니다.

```java
@Entity
@EntityListeners(EntityEventPublishingListener.class)
@EntityEventConfig(onCreate = "AUTHOR_CREATED", onDelete = "AUTHOR_DELETED", publishUpdate = false)
public class Author extends SimpliXBaseEntity<String> {
    // ...
}
```

| 속성 | 기본값 | 의미 |
|---|---|---|
| `onCreate`, `onUpdate`, `onDelete` | `ENTITY_CREATED`, `ENTITY_UPDATED`, `ENTITY_DELETED` | 변경 종류별 이벤트 타입 |
| `enabled` | `true` | 엔티티의 이벤트 발행 여부 |
| `publishCreate`, `publishUpdate`, `publishDelete` | `true` | 종류별 이벤트 발행 여부 |
| `failOnError` | `true` | 발행에 실패하면 변경도 실패 처리할지 여부 |
| `ignoreProperties` | 없음 | 이 속성만 바뀐 경우에는 수정 이벤트를 발행하지 않습니다 |
| `watchProperties` | 없음 | 지정하면 이 속성이 바뀐 경우에만 수정 이벤트를 발행합니다 |

- `SoftDeletable`을 구현하고 갱신으로 삭제하는 엔티티는 삭제 이벤트를 발행하며, 메타데이터에 `softDelete`가 설정됩니다.
- `EntityEventPayloadProvider`를 구현한 엔티티는 이벤트의 페이로드를 직접 구성합니다.

### 이벤트 수신

```java
@Component
public class AuthorEvents {

    @EventListener
    public void on(EventMessage event) {
        if ("AUTHOR_CREATED".equals(event.eventType())) {
            String authorId = event.aggregateId();
            // ...
        }
    }
}
```

`EventMessage`는 애그리거트의 식별자와 타입, 이벤트 타입, 페이로드, 메타데이터, 변경된 속성으로 구성된 레코드입니다. `payloadString(key)`, `payloadLong(key)`, `payloadList(key)`로 페이로드를 읽고, `actor()`로 변경한 사용자를 조회하며, `hasChangedProperty(name)`으로 속성의 변경 여부를 확인합니다.

### 이벤트 발행 억제

일괄 가져오기를 실행하면 행마다 이벤트가 발행됩니다. `EventContext.suppressEvents` 안에서 실행하면 현재 스레드에서는 이벤트를 발행하지 않습니다.

```java
EventContext.suppressEvents(() -> importService.importAuthors(rows));
```

## 직접 정의하는 이벤트

`EventManager`는 클래스패스에 있는 `EventPublisher`를 통해 `Event`를 발행합니다. `GenericEvent`는 바로 사용할 수 있는 `Event` 구현입니다.

```java
GenericEvent event = GenericEvent.builder()
    .eventType("LOAN_OPENED")
    .aggregateType("Loan")
    .aggregateId(loanId)
    .userId(memberId)
    .payload(Map.of("authorId", authorId))
    .build();

EventManager.getInstance().publish(event);
```

`EventPublisher`는 Java 서비스 로더로 찾습니다. 라이브러리는 `META-INF/services/dev.simplecore.simplix.core.event.EventPublisher`에 구현 클래스를 등록합니다. 구현이 없으면 `publish`는 아무 동작도 하지 않으므로, 모듈은 전달 수단의 유무와 관계없이 이벤트를 발행할 수 있습니다.

| `GenericEvent` 빌더 메서드 | 설정하는 값 |
|---|---|
| `eventType` | 발생한 일의 이름. 예: `LOAN_OPENED` |
| `aggregateType`, `aggregateId` | 이벤트 대상 레코드의 종류와 식별자 |
| `payload` | 이벤트 데이터 |
| `userId`, `tenantId` | 이벤트를 발생시킨 사용자와 테넌트 |
| `metadata`, `addMetadata(key, value)` | 추적 식별자처럼 전달에 사용하는 값 |
| `eventId`, `occurredAt` | 이벤트의 식별자와 발생 시각. 기존 이벤트를 다시 발행할 때만 지정합니다 |

## 관련 문서

- [simplix-hibernate](ko/hibernate/readme.md): 엔티티 이벤트를 발행하는 리스너
- [simplix-messaging](ko/messaging/readme.md): 브로커를 통한 메시지 전달
