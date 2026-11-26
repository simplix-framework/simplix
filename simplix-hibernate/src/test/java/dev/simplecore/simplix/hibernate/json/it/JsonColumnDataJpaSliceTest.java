package dev.simplecore.simplix.hibernate.json.it;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "simplix.hibernate.cache.disabled=true"
})
@DisplayName("A JsonType column that holds value objects, in the JPA test slice")
class JsonColumnDataJpaSliceTest {

    private static final Step REVIEW = new Step(StepKind.REVIEW, Instant.parse("2026-03-04T05:06:07.123Z"),
            LocalDate.of(2026, 3, 10), "Review", Map.of("ko", "검토"));

    @Autowired
    private TestEntityManager em;

    @Test
    @DisplayName("Should store value objects that are not Serializable and read them back")
    void storesAndReadsValueObjects() {
        JsonColumnItem item = new JsonColumnItem(new ArrayList<>(List.of(REVIEW)), Map.of("en", "Flow"));

        String id = em.persistAndFlush(item).getId();
        em.clear();

        assertThat(em.find(JsonColumnItem.class, id).getSteps()).containsExactly(REVIEW);
    }
}
