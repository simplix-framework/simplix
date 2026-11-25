# Working with dates and time zones

How date-time values travel between the database, the application and the client. The starter fixes one application time zone, stores instants in UTC, and writes every date-time to JSON with an offset.

## Set the application time zone

```yaml
simplix:
  date-time:
    default-timezone: Asia/Seoul
    use-utc-for-database: true
    normalize-timezone: true
```

The zone is the first of these that is set: `simplix.date-time.default-timezone`, `spring.jackson.time-zone`, the JVM's `user.timezone`, the zone of the system.

| Property | Default | Meaning |
|---|---|---|
| `simplix.date-time.default-timezone` | see above | the application time zone |
| `simplix.date-time.use-utc-for-database` | `true` | converts `OffsetDateTime` values to UTC before they are saved |
| `simplix.date-time.normalize-timezone` | `true` | reads a `LocalDateTime` value as a time in the application time zone |
| `simplix.date-time.request-timezone-enabled` | `true` | reads the time zone of a request from the `X-Timezone` header |

## What a client receives

With the zone `Asia/Seoul`, an `Instant` and an `OffsetDateTime` of `2026-03-01T00:30:00Z` and a `LocalDateTime` of `2026-03-01T09:30:00` are all written the same way.

```json
{
  "instant" : "2026-03-01T09:30:00.000+09:00",
  "offset" : "2026-03-01T09:30:00.000+09:00",
  "local" : "2026-03-01T09:30:00.000+09:00"
}
```

### The time zone of the reader

A client that sends `X-Timezone: America/New_York` receives `Instant` values in that zone. `OffsetDateTime` and `LocalDateTime` values keep the application zone, and a header that names no valid zone is ignored.

```json
{
  "instant" : "2026-02-28T19:30:00.000-05:00",
  "offset" : "2026-03-01T09:30:00.000+09:00",
  "local" : "2026-03-01T09:30:00.000+09:00"
}
```

Services read the zone of the request from `TimezoneContext`; see [Converting types](en/core/converting-types.md).

## What the database receives

| Class | Does |
|---|---|
| `SimpliXOffsetDateTimeConverter` | a JPA converter that stores `OffsetDateTime` in UTC and returns it in the application zone |
| `SimpliXLocalDateTimeConverter` | a JPA converter that treats `LocalDateTime` as a time in the application zone |
| `SimpliXTimezoneService` | the same rules as methods: `normalizeToApplicationTimezone(LocalDateTime)`, `normalizeForDatabase(OffsetDateTime)`, `normalizeFromDatabase(OffsetDateTime)`, `getApplicationZoneId()` |

The application zone is also available as the beans `applicationZoneId` (`ZoneId`) and `applicationZoneOffset` (`ZoneOffset`). The `ModelMapper` bean converts between `LocalDateTime` and `OffsetDateTime` with the same zone when it maps an entity to a DTO.

## Convert in your own code

Inject `SimpliXTimezoneService` where a service has to apply the same rules by hand, for example to a value read with plain JDBC. The results below are for the application zone `Asia/Seoul`.

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

| Call | Result |
|---|---|
| `getApplicationZoneId()` | `Asia/Seoul` |
| `getApplicationZoneOffset()` | the current offset of that zone |
| `normalizeToApplicationTimezone(2026-03-01T09:30)` | `2026-03-01T09:30+09:00`: the local time read as a time in the application zone |
| `normalizeForDatabase(2026-03-01T09:30+09:00)` | `2026-03-01T00:30Z`: the same instant in UTC |
| `normalizeFromDatabase(2026-03-01T00:30Z)` | `2026-03-01T09:30+09:00`: the same instant in the application zone |
| `isUseUtcForDatabase()`, `isNormalizeTimezone()` | the settings of the same names |

## Choose a type

| Type | Use it for | A reader in another zone sees |
|---|---|---|
| `Instant` | a moment: when something was created, sent or signed | the moment in their own zone, when they send `X-Timezone` |
| `OffsetDateTime` | a moment the application always shows in its own zone | the moment in the application zone |
| `LocalDateTime` | a wall-clock time of the place the application serves, such as opening hours | the same wall-clock time, written with the application offset |
| `LocalDate` | a calendar date without a time, such as a due date | the same date |

## Related documents

- [Auditing entities](en/starter/auditing-entities.md)
- [Converting types](en/core/converting-types.md)
