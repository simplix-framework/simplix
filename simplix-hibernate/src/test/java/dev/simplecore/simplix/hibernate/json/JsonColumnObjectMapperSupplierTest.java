package dev.simplecore.simplix.hibernate.json;

import dev.simplecore.simplix.hibernate.json.it.Step;
import dev.simplecore.simplix.hibernate.json.it.StepKind;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JsonColumnObjectMapperSupplier - the form a JSON column is stored in")
class JsonColumnObjectMapperSupplierTest {

    private static final Step STEP = new Step(StepKind.REVIEW, Instant.parse("2026-03-04T05:06:07.123Z"),
            LocalDate.of(2026, 3, 10), "Review", Map.of("ko", "검토"));

    /** The mapper the JSON column type used before it moved to Jackson 3. */
    private final com.fasterxml.jackson.databind.ObjectMapper jackson2Mapper =
            new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
    private final ObjectMapper columnMapper = new JsonColumnObjectMapperSupplier().get();

    @Test
    @DisplayName("Should read a value the Jackson 2 mapper wrote")
    void readsJackson2Form() throws Exception {
        String stored = jackson2Mapper.writeValueAsString(STEP);

        assertThat(columnMapper.readValue(stored, Step.class)).isEqualTo(STEP);
    }

    @Test
    @DisplayName("Should write a value in the form the Jackson 2 mapper wrote it in")
    void writesJackson2Form() throws Exception {
        String stored = jackson2Mapper.writeValueAsString(STEP);

        assertThat(columnMapper.readTree(columnMapper.writeValueAsString(STEP)))
                .isEqualTo(columnMapper.readTree(stored));
    }

    @Test
    @DisplayName("Should read a labeled enum stored as its name")
    void readsEnumStoredAsName() {
        String stored = "{\"kind\":\"APPROVAL\",\"name\":\"Approval\"}";

        assertThat(columnMapper.readValue(stored, Step.class).kind()).isEqualTo(StepKind.APPROVAL);
    }

    @Test
    @DisplayName("Should read a list of values the Jackson 2 mapper wrote")
    void readsJackson2List() throws Exception {
        String stored = jackson2Mapper.writeValueAsString(List.of(STEP, STEP));

        assertThat(columnMapper.readValue(stored, new TypeReference<List<Step>>() { })).containsExactly(STEP, STEP);
    }

    @Test
    @DisplayName("JsonColumnCloner should copy a list of value objects without sharing an element")
    void clonerCopiesValueObjects() {
        List<Step> values = new ArrayList<>(List.of(STEP));

        List<Step> copy = new JsonColumnCloner().clone(values);

        assertThat(copy).isEqualTo(values).isNotSameAs(values);
        assertThat(copy.get(0)).isNotSameAs(values.get(0));
    }
}
