# 엔티티 감사

행을 생성한 사용자와 마지막으로 수정한 사용자, 그 시각을 기록하는 방법을 설명합니다. 스타터가 Spring Data JPA 감사를 활성화하고 현재 사용자와 현재 시각을 제공합니다.

## 감사 필드가 있는 기본 클래스 작성

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class AuditedEntity<K> extends SimpliXBaseEntity<K> {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;
}
```

이 클래스를 상속한 엔티티에는 추가 작업이 필요 없습니다. 사용자 `alice`가 저장한 노트는 다음과 같이 기록됩니다.

```json
{
  "createdAt" : "2026-11-24T23:40:11.824+09:00",
  "updatedAt" : "2026-11-24T23:40:11.824+09:00",
  "createdBy" : "alice",
  "updatedBy" : "alice",
  "noteId" : "<id>",
  "text" : "Return by Friday",
  "id" : "<id>"
}
```

## 값의 출처

| 값 | 빈 | 제공하는 값 |
|---|---|---|
| `@CreatedBy`, `@LastModifiedBy` | `auditorProvider`(`AuditorAware<String>`) | 인증된 사용자의 이름. 로그인한 사용자가 없으면 `SYSTEM` |
| `@CreatedDate`, `@LastModifiedDate` | `dateTimeProvider`(`DateTimeProvider`) | 현재 시각 |

값을 바꾸려면 해당 타입의 빈을 등록하세요. 예를 들어 이름 대신 사용자의 식별자를 반환하는 `AuditorAware`를 등록할 수 있습니다. 애플리케이션에 `@EnableJpaAuditing`을 추가하지 마세요. 스타터가 이미 선언합니다.

> ℹ CLI가 생성하는 서비스 테스트는 엔티티 yml에 `createdAt`과 `updatedAt`이 있으면 이 값을 설정합니다. 생성된 코드는 이런 형태의 기본 클래스를 전제로 합니다.

## 관련 문서

- [엔티티와 저장소](ko/core/entities-and-repositories.md)
- [날짜와 시간대 다루기](ko/starter/working-with-dates-and-time-zones.md)
