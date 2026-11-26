package dev.simplecore.simplix.hibernate.json.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SimpliXJsonColumnAutoConfiguration - settings handed to the persistence unit")
class SimpliXJsonColumnAutoConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(SimpliXJsonColumnAutoConfiguration.class));

    @Test
    @DisplayName("Should name the mapper supplier and the copy of the module")
    void addsBothSettings() {
        runner.run(context -> {
            Map<String, Object> properties = new HashMap<>();
            context.getBean(HibernatePropertiesCustomizer.class).customize(properties);

            assertThat(properties)
                    .containsEntry(SimpliXJsonColumnAutoConfiguration.OBJECT_MAPPER_PROPERTY,
                            "dev.simplecore.simplix.hibernate.json.JsonColumnObjectMapperSupplier")
                    .containsEntry(SimpliXJsonColumnAutoConfiguration.JSON_SERIALIZER_PROPERTY,
                            "dev.simplecore.simplix.hibernate.json.JsonColumnCloner");
        });
    }

    @Test
    @DisplayName("Should keep a value the application set")
    void keepsApplicationValue() {
        runner.run(context -> {
            Map<String, Object> properties = new HashMap<>();
            properties.put(SimpliXJsonColumnAutoConfiguration.OBJECT_MAPPER_PROPERTY, "com.example.OwnSupplier");
            context.getBean(HibernatePropertiesCustomizer.class).customize(properties);

            assertThat(properties)
                    .containsEntry(SimpliXJsonColumnAutoConfiguration.OBJECT_MAPPER_PROPERTY, "com.example.OwnSupplier");
        });
    }

    @Test
    @DisplayName("Should register nothing when simplix.hibernate.json-column.enabled is false")
    void canBeSwitchedOff() {
        runner.withPropertyValues("simplix.hibernate.json-column.enabled=false")
                .run(context -> assertThat(context).doesNotHaveBean(HibernatePropertiesCustomizer.class));
    }
}
