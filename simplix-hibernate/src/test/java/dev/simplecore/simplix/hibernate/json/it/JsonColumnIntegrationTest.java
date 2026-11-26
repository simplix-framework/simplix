package dev.simplecore.simplix.hibernate.json.it;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = JsonColumnITApplication.class, properties = {
        "spring.datasource.url=jdbc:h2:mem:jsoncolumn;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "simplix.hibernate.cache.disabled=true"
})
@DisplayName("A JsonType column that holds value objects")
class JsonColumnIntegrationTest {

    private static final Step REVIEW = new Step(StepKind.REVIEW, Instant.parse("2026-03-04T05:06:07.123Z"),
            LocalDate.of(2026, 3, 10), "Review", Map.of("ko", "검토"));
    private static final Step APPROVAL = new Step(StepKind.APPROVAL, null, LocalDate.of(2026, 3, 12), "Approval", Map.of());

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @PersistenceContext
    private EntityManager em;

    @Test
    @DisplayName("The persistence unit names the mapper and the copy of the module")
    void persistenceUnitCarriesTheJsonColumnSettings() {
        assertThat(entityManagerFactory.getProperties())
                .containsEntry("hypersistence.utils.jackson.object.mapper",
                        "dev.simplecore.simplix.hibernate.json.JsonColumnObjectMapperSupplier")
                .containsEntry("hypersistence.utils.json.serializer",
                        "dev.simplecore.simplix.hibernate.json.JsonColumnCloner");
    }

    @Test
    @DisplayName("Should store a list of value objects and read it back as it was saved")
    void storesAndReadsValueObjects() {
        JsonColumnItem item = new JsonColumnItem(new ArrayList<>(List.of(REVIEW, APPROVAL)), Map.of("en", "Flow"));
        transactionTemplate.executeWithoutResult(tx -> em.persist(item));

        JsonColumnItem read = transactionTemplate.execute(tx -> {
            em.clear();
            return em.find(JsonColumnItem.class, item.getId());
        });

        assertThat(read.getSteps()).containsExactly(REVIEW, APPROVAL);
        assertThat(read.getLabels()).containsEntry("en", "Flow");
    }

    @Test
    @DisplayName("Should leave the row untouched when a read value is not changed")
    void readingDoesNotDirtyTheRow() {
        JsonColumnItem item = new JsonColumnItem(new ArrayList<>(List.of(REVIEW)), Map.of());
        transactionTemplate.executeWithoutResult(tx -> em.persist(item));
        Long versionAfterInsert = transactionTemplate.execute(tx -> em.find(JsonColumnItem.class, item.getId()).getVersion());

        transactionTemplate.executeWithoutResult(tx -> em.find(JsonColumnItem.class, item.getId()).getSteps().size());

        Long versionAfterRead = transactionTemplate.execute(tx -> em.find(JsonColumnItem.class, item.getId()).getVersion());
        assertThat(versionAfterRead).isEqualTo(versionAfterInsert);
    }

    @Test
    @DisplayName("Should write the row when a value object of the list is replaced")
    void changingAValueObjectUpdatesTheRow() {
        JsonColumnItem item = new JsonColumnItem(new ArrayList<>(List.of(REVIEW)), Map.of());
        transactionTemplate.executeWithoutResult(tx -> em.persist(item));

        transactionTemplate.executeWithoutResult(tx -> {
            JsonColumnItem managed = em.find(JsonColumnItem.class, item.getId());
            managed.setSteps(new ArrayList<>(List.of(REVIEW, APPROVAL)));
        });

        List<Step> stored = transactionTemplate.execute(tx -> {
            em.clear();
            return em.find(JsonColumnItem.class, item.getId()).getSteps();
        });
        assertThat(stored).containsExactly(REVIEW, APPROVAL);
    }
}
