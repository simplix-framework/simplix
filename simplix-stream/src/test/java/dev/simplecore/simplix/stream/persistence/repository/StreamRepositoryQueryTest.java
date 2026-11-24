package dev.simplecore.simplix.stream.persistence.repository;

import dev.simplecore.simplix.stream.core.enums.SessionState;
import dev.simplecore.simplix.stream.core.enums.TransportType;
import dev.simplecore.simplix.stream.persistence.entity.StreamSessionEntity;
import dev.simplecore.simplix.stream.persistence.entity.StreamSubscriptionEntity;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Stream repository update queries")
class StreamRepositoryQueryTest {

    private AnnotationConfigApplicationContext context;
    private StreamSessionRepository sessionRepository;
    private StreamSubscriptionRepository subscriptionRepository;
    private TransactionTemplate transaction;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigApplicationContext(JpaConfig.class);
        sessionRepository = context.getBean(StreamSessionRepository.class);
        subscriptionRepository = context.getBean(StreamSubscriptionRepository.class);
        transaction = new TransactionTemplate(context.getBean(PlatformTransactionManager.class));
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    @DisplayName("terminateSessionsByInstanceId terminates the sessions of one instance and stamps the time")
    void terminateSessionsByInstanceId() {
        sessionRepository.saveAll(List.of(session("s1", "node-a"), session("s2", "node-b")));

        Integer updated = transaction.execute(status -> sessionRepository.terminateSessionsByInstanceId("node-a"));

        assertThat(updated).isEqualTo(1);
        StreamSessionEntity terminated = sessionRepository.findById("s1").orElseThrow();
        assertThat(terminated.getState()).isEqualTo(SessionState.TERMINATED);
        assertThat(terminated.getTerminatedAt()).isNotNull();
        StreamSessionEntity untouched = sessionRepository.findById("s2").orElseThrow();
        assertThat(untouched.getState()).isEqualTo(SessionState.CONNECTED);
        assertThat(untouched.getTerminatedAt()).isNull();
    }

    @Test
    @DisplayName("deactivateBySessionId deactivates every subscription of the session and stamps the time")
    void deactivateBySessionId() {
        subscriptionRepository.saveAll(List.of(
                subscription("s1", "stock:a"), subscription("s1", "stock:b"), subscription("s2", "stock:a")));

        Integer updated = transaction.execute(status -> subscriptionRepository.deactivateBySessionId("s1"));

        assertThat(updated).isEqualTo(2);
        assertThat(subscriptionRepository.findAll())
                .filteredOn(subscription -> subscription.getSessionId().equals("s1"))
                .allSatisfy(subscription -> {
                    assertThat(subscription.getActive()).isFalse();
                    assertThat(subscription.getUnsubscribedAt()).isNotNull();
                });
        assertThat(subscriptionRepository.findAll())
                .filteredOn(subscription -> subscription.getSessionId().equals("s2"))
                .allSatisfy(subscription -> assertThat(subscription.getActive()).isTrue());
    }

    @Test
    @DisplayName("deactivateBySessionIdAndSubscriptionKey deactivates one subscription and stamps the time")
    void deactivateBySessionIdAndSubscriptionKey() {
        subscriptionRepository.saveAll(List.of(subscription("s1", "stock:a"), subscription("s1", "stock:b")));

        Integer updated = transaction.execute(
                status -> subscriptionRepository.deactivateBySessionIdAndSubscriptionKey("s1", "stock:a"));

        assertThat(updated).isEqualTo(1);
        assertThat(subscriptionRepository.findAll())
                .filteredOn(subscription -> subscription.getSubscriptionKey().equals("stock:a"))
                .allSatisfy(subscription -> {
                    assertThat(subscription.getActive()).isFalse();
                    assertThat(subscription.getUnsubscribedAt()).isNotNull();
                });
        assertThat(subscriptionRepository.findAll())
                .filteredOn(subscription -> subscription.getSubscriptionKey().equals("stock:b"))
                .allSatisfy(subscription -> assertThat(subscription.getActive()).isTrue());
    }

    private static StreamSessionEntity session(String id, String instanceId) {
        Instant now = Instant.now();
        return StreamSessionEntity.builder()
                .id(id)
                .transportType(TransportType.SSE)
                .state(SessionState.CONNECTED)
                .instanceId(instanceId)
                .connectedAt(now)
                .lastActiveAt(now)
                .build();
    }

    private static StreamSubscriptionEntity subscription(String sessionId, String subscriptionKey) {
        return StreamSubscriptionEntity.builder()
                .sessionId(sessionId)
                .subscriptionKey(subscriptionKey)
                .resource("stock")
                .intervalMs(1000L)
                .subscribedAt(Instant.now())
                .active(true)
                .build();
    }

    @Configuration
    @EnableJpaRepositories(basePackageClasses = StreamSessionRepository.class)
    static class JpaConfig {

        @Bean
        DataSource dataSource() {
            return new EmbeddedDatabaseBuilder()
                    .setType(EmbeddedDatabaseType.H2)
                    .generateUniqueName(true)
                    .build();
        }

        @Bean
        LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setPackagesToScan(StreamSessionEntity.class.getPackageName());
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            // The entities name index and constraint columns by property, as Spring Boot's naming resolves them
            factory.setJpaPropertyMap(Map.of(
                    "hibernate.hbm2ddl.auto", "create-drop",
                    "hibernate.physical_naming_strategy",
                    "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy"));
            return factory;
        }

        @Bean
        PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
            return new JpaTransactionManager(entityManagerFactory);
        }
    }
}
