package dev.simplecore.simplix.hibernate.json;

import io.hypersistence.utils.hibernate.type.util.ObjectMapperWrapper;
import org.assertj.core.api.RecursiveComparisonAssert;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JsonColumnObjectMapperSupplier - rows other mappers of the JSON column type stored")
class JsonColumnStoredFormTest {

    public enum Kind { FIRST, SECOND }

    public static class Part {
        public String code = "P-1";
        public BigDecimal amount = new BigDecimal("12.50");
    }

    public static class Sample {
        public String text = "plain";
        public int count = 3;
        public Boolean flag = true;
        public String missing = null;
        public Kind kind = Kind.SECOND;
        public LocalDate date = LocalDate.of(2026, 3, 1);
        public LocalTime time = LocalTime.of(9, 30, 15);
        public LocalDateTime dateTime = LocalDateTime.of(2026, 3, 1, 9, 30, 15);
        public OffsetDateTime offset = OffsetDateTime.of(2026, 3, 1, 9, 30, 15, 0, ZoneOffset.ofHours(9));
        public ZonedDateTime zoned = ZonedDateTime.of(2026, 3, 1, 9, 30, 15, 0, ZoneId.of("Asia/Seoul"));
        public Instant instant = Instant.parse("2026-03-01T00:30:15Z");
        public Duration duration = Duration.ofMinutes(90);
        public UUID uuid = UUID.fromString("0b7e2f6a-3c1d-4e5f-8a9b-0c1d2e3f4a5b");
        public Optional<String> optional = Optional.of("held");
        public List<String> tags = List.of("a", "b");
        public Map<String, Integer> totals = new LinkedHashMap<>(Map.of("x", 1));
        public Part part = new Part();
    }

    /**
     * What the JSON column type of hypersistence-utils 3.9.4, the version the Spring Boot 3 line
     * builds on, stores for a {@link Sample}: printed by its {@code ObjectMapperWrapper.INSTANCE}.
     */
    private static final String STORED_BY_HYPERSISTENCE_3_9_4 = "{\"text\":\"plain\",\"count\":3,\"flag\":true,\"missing\":null,\"kind\":\"SECOND\",\"date\":[2026,3,1],\"time\":[9,30,15],\"dateTime\":[2026,3,1,9,30,15],\"offset\":\"2026-03-01T09:30:15+09:00\",\"zoned\":1772325015.000000000,\"instant\":1772325015.000000000,\"duration\":5400.000000000,\"uuid\":\"0b7e2f6a-3c1d-4e5f-8a9b-0c1d2e3f4a5b\",\"optional\":\"held\",\"tags\":[\"a\",\"b\"],\"totals\":{\"x\":1},\"part\":{\"code\":\"P-1\",\"amount\":12.50}}";

    private final ObjectMapper columnMapper = new JsonColumnObjectMapperSupplier().get();

    @Test
    @DisplayName("Should write a value as hypersistence-utils 3.9.4 stored it")
    void writesTheFormOfTheBoot3Line() {
        assertThat(columnMapper.writeValueAsString(new Sample())).isEqualTo(STORED_BY_HYPERSISTENCE_3_9_4);
    }

    @Test
    @DisplayName("Should read a row hypersistence-utils 3.9.4 stored")
    void readsTheFormOfTheBoot3Line() {
        assertSameMoment(columnMapper.readValue(STORED_BY_HYPERSISTENCE_3_9_4, Sample.class));
    }

    @Test
    @DisplayName("Should read a row the default mapper of the JSON column type stored")
    void readsTheFormOfTheDefaultMapper() {
        String stored = new ObjectMapperWrapper().toString(new Sample());

        assertSameMoment(columnMapper.readValue(stored, Sample.class));
    }

    @Test
    @DisplayName("Should read an OffsetDateTime a mapper with plain Jackson 2 defaults stored as a timestamp")
    void readsAnOffsetDateTimeStoredAsATimestamp() {
        String stored = STORED_BY_HYPERSISTENCE_3_9_4.replace(
                "\"offset\":\"2026-03-01T09:30:15+09:00\"", "\"offset\":1772325015.000000000");

        assertThat(stored).isNotEqualTo(STORED_BY_HYPERSISTENCE_3_9_4);
        assertSameMoment(columnMapper.readValue(stored, Sample.class));
    }

    @Test
    @DisplayName("Should read an OffsetDateTime back with the offset it was stored with")
    void keepsTheOffsetOfAnOffsetDateTime() {
        assertThat(columnMapper.readValue(STORED_BY_HYPERSISTENCE_3_9_4, Sample.class).offset.getOffset())
                .isEqualTo(ZoneOffset.ofHours(9));
    }

    /** A date with a zone or an offset is read back as the same moment, in the zone of the mapper. */
    private static void assertSameMoment(Sample read) {
        RecursiveComparisonAssert<?> comparison = assertThat(read).usingRecursiveComparison()
                .withEqualsForType((a, b) -> a.toInstant().equals(b.toInstant()), OffsetDateTime.class)
                .withEqualsForType((a, b) -> a.toInstant().equals(b.toInstant()), ZonedDateTime.class);
        comparison.isEqualTo(new Sample());
    }
}
