package dev.simplecore.simplix.hibernate.json.config;

import dev.simplecore.simplix.hibernate.json.JsonColumnCloner;
import dev.simplecore.simplix.hibernate.json.JsonColumnObjectMapperSupplier;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;

/**
 * Hands the JSON column type of hypersistence-utils a mapper and a copy that work with value
 * objects of an application.
 *
 * <p>The column type reads both from the properties of the persistence unit, so they are added
 * there and nothing has to be placed in a properties file. A value the application set under
 * {@code spring.jpa.properties} is kept.
 */
@AutoConfiguration(before = HibernateJpaAutoConfiguration.class)
@ConditionalOnClass(name = {
        "io.hypersistence.utils.hibernate.type.json.JsonType",
        "tools.jackson.databind.ObjectMapper",
        "org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer"
})
@ConditionalOnProperty(prefix = "simplix.hibernate.json-column", name = "enabled",
        havingValue = "true", matchIfMissing = true)
public class SimpliXJsonColumnAutoConfiguration {

    /** The persistence unit property that names the mapper supplier of the JSON column type. */
    public static final String OBJECT_MAPPER_PROPERTY = "hypersistence.utils.jackson.object.mapper";

    /** The persistence unit property that names the class copying a JSON column value. */
    public static final String JSON_SERIALIZER_PROPERTY = "hypersistence.utils.json.serializer";

    @Bean
    public HibernatePropertiesCustomizer simplixJsonColumnPropertiesCustomizer() {
        return properties -> {
            properties.putIfAbsent(OBJECT_MAPPER_PROPERTY, JsonColumnObjectMapperSupplier.class.getName());
            properties.putIfAbsent(JSON_SERIALIZER_PROPERTY, JsonColumnCloner.class.getName());
        };
    }
}
