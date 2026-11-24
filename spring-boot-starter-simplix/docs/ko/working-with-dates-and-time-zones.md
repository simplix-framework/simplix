# 날짜와 시간대 다루기

날짜 시각 값이 데이터베이스, 애플리케이션, 클라이언트 사이에서 전달되는 방식을 설명합니다. 스타터는 애플리케이션 시간대를 정하고, 시각을 UTC로 저장하며, 모든 날짜 시각을 오프셋과 함께 JSON으로 직렬화합니다.

## 애플리케이션 시간대 설정

```yaml
simplix:
  date-time:
    default-timezone: Asia/Seoul
    use-utc-for-database: true
    normalize-timezone: true
```

시간대는 다음 중 먼저 설정된 값으로 정해집니다: `simplix.date-time.default-timezone`, `spring.jackson.time-zone`, JVM의 `user.timezone`, 시스템의 시간대.

| 속성 | 기본값 | 의미 |
|---|---|---|
| `simplix.date-time.default-timezone` | 위 설명 참고 | 애플리케이션 시간대 |
| `simplix.date-time.use-utc-for-database` | `true` | `OffsetDateTime` 값을 저장하기 전에 UTC로 변환 |
| `simplix.date-time.normalize-timezone` | `true` | `LocalDateTime` 값을 애플리케이션 시간대의 시각으로 해석 |
| `simplix.date-time.request-timezone-enabled` | `true` | `X-Timezone` 헤더에서 요청의 시간대를 읽음 |

## 클라이언트가 받는 값

시간대가 `Asia/Seoul`일 때, `2026-03-01T00:30:00Z`인 `Instant`와 `OffsetDateTime`, `2026-03-01T09:30:00`인 `LocalDateTime`은 모두 같은 형식으로 직렬화됩니다.

```json
{
  "instant" : "2026-03-01T09:30:00.000+09:00",
  "offset" : "2026-03-01T09:30:00.000+09:00",
  "local" : "2026-03-01T09:30:00.000+09:00"
}
```

### 독자의 시간대

클라이언트가 `X-Timezone: America/New_York`을 보내면 `Instant` 값을 해당 시간대로 받습니다. `OffsetDateTime`과 `LocalDateTime` 값은 애플리케이션 시간대를 유지하며, 유효한 시간대가 아닌 헤더 값은 무시합니다.

```json
{
  "instant" : "2026-02-28T19:30:00.000-05:00",
  "offset" : "2026-03-01T09:30:00.000+09:00",
  "local" : "2026-03-01T09:30:00.000+09:00"
}
```

서비스는 `TimezoneContext`에서 요청의 시간대를 읽습니다. [타입 변환](../../../simplix-core/docs/ko/converting-types.md)을 참고하세요.

## 데이터베이스에 저장되는 값

| 클래스 | 동작 |
|---|---|
| `SimpliXOffsetDateTimeConverter` | `OffsetDateTime`을 UTC로 저장하고 애플리케이션 시간대로 반환하는 JPA 변환기 |
| `SimpliXLocalDateTimeConverter` | `LocalDateTime`을 애플리케이션 시간대의 시각으로 처리하는 JPA 변환기 |
| `SimpliXTimezoneService` | 같은 규칙을 메서드로 제공: `normalizeToApplicationTimezone(LocalDateTime)`, `normalizeForDatabase(OffsetDateTime)`, `normalizeFromDatabase(OffsetDateTime)`, `getApplicationZoneId()` |

애플리케이션 시간대는 `applicationZoneId`(`ZoneId`)와 `applicationZoneOffset`(`ZoneOffset`) 빈으로도 사용할 수 있습니다. `ModelMapper` 빈은 엔티티를 DTO로 매핑할 때 같은 시간대로 `LocalDateTime`과 `OffsetDateTime`을 변환합니다.

## 코드에서 직접 변환

서비스에서 같은 규칙을 직접 적용해야 할 때는 `SimpliXTimezoneService`를 주입하세요. 일반 JDBC로 읽은 값을 변환하는 경우가 여기에 해당합니다. 아래 결과는 애플리케이션 시간대가 `Asia/Seoul`일 때의 값입니다.

```java
@Service
@RequiredArgsConstructor
public class LoanCalendar {

    private final SimpliXTimezoneService timezones;

    public OffsetDateTime dueAt(LocalDateTime wallClock) {
        return timezones.normalizeToApplicationTimezone(wallClock);
    }
}
```

| 호출 | 결과 |
|---|---|
| `getApplicationZoneId()` | `Asia/Seoul` |
| `getApplicationZoneOffset()` | 해당 시간대의 현재 오프셋 |
| `normalizeToApplicationTimezone(2026-03-01T09:30)` | `2026-03-01T09:30+09:00`. 로컬 시각을 애플리케이션 시간대의 시각으로 해석합니다 |
| `normalizeForDatabase(2026-03-01T09:30+09:00)` | `2026-03-01T00:30Z`. 같은 시점의 UTC 값입니다 |
| `normalizeFromDatabase(2026-03-01T00:30Z)` | `2026-03-01T09:30+09:00`. 같은 시점의 애플리케이션 시간대 값입니다 |
| `isUseUtcForDatabase()`, `isNormalizeTimezone()` | 해당 설정 값 |

## 타입 선택

| 타입 | 용도 | 다른 시간대의 사용자에게 표시되는 값 |
|---|---|---|
| `Instant` | 생성 · 전송 · 서명 시각 같은 특정 시점 | `X-Timezone`을 보내면 사용자의 시간대로 변환한 시점 |
| `OffsetDateTime` | 항상 애플리케이션 시간대로 표시하는 시점 | 애플리케이션 시간대의 시점 |
| `LocalDateTime` | 영업시간처럼 애플리케이션이 서비스하는 지역의 현지 시각 | 애플리케이션 오프셋을 포함한 같은 현지 시각 |
| `LocalDate` | 반납일처럼 시각이 없는 날짜 | 같은 날짜 |

## 관련 문서

- [엔티티 감사](./auditing-entities.md)
- [타입 변환](../../../simplix-core/docs/ko/converting-types.md)
