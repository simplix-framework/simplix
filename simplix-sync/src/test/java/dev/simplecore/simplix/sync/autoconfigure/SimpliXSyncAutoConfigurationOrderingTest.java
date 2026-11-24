package dev.simplecore.simplix.sync.autoconfigure;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.util.ClassUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SimpliXSyncAutoConfiguration ordering")
class SimpliXSyncAutoConfigurationOrderingTest {

    // The Redis auto-configuration of Spring Boot 4 and of Spring Boot 3
    private static final List<String> REDIS_AUTO_CONFIGURATIONS = List.of(
            "org.springframework.boot.data.redis.autoconfigure.DataRedisAutoConfiguration",
            "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration");

    @Test
    @DisplayName("is ordered after the Redis auto-configuration on the classpath, whose connection factory its conditions look for")
    void orderedAfterRedisAutoConfiguration() {
        String present = REDIS_AUTO_CONFIGURATIONS.stream()
                .filter(name -> ClassUtils.isPresent(name, getClass().getClassLoader()))
                .findFirst()
                .orElseThrow();

        AutoConfiguration annotation = SimpliXSyncAutoConfiguration.class.getAnnotation(AutoConfiguration.class);

        assertThat(annotation.afterName()).contains(present);
    }

    @Test
    @DisplayName("is ordered after the messaging auto-configuration, which provides the NATS connection")
    void orderedAfterMessagingAutoConfiguration() {
        AutoConfiguration annotation = SimpliXSyncAutoConfiguration.class.getAnnotation(AutoConfiguration.class);

        assertThat(annotation.afterName())
                .contains("dev.simplecore.simplix.messaging.autoconfigure.MessagingAutoConfiguration");
    }
}
