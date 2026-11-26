package dev.simplecore.simplix.hibernate.json;

import io.hypersistence.utils.hibernate.type.util.JsonSerializer;
import org.hibernate.internal.util.SerializationHelper;
import org.hibernate.type.SerializationException;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.Serializable;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;

/**
 * Copies the value of a {@code JsonType} column for Hibernate's dirty check.
 *
 * <p>A value object kept in a JSON column is usually a plain class or a record, not
 * {@link Serializable}, and the column type's own copy refuses such a value. This class copies it
 * by writing the value as JSON and reading it back with the mapper the column itself uses. Java
 * serialization is used only where every part of the value supports it.
 */
public class JsonColumnCloner implements JsonSerializer {

    private static final ObjectMapper MAPPER = new JsonColumnObjectMapperSupplier().get();

    @Override
    @SuppressWarnings("unchecked")
    public <T> T clone(T value) {
        if (value == null || value instanceof String) {
            return value;
        }
        if (value instanceof JsonNode node) {
            return (T) node.deepCopy();
        }
        if (value instanceof Collection<?> collection) {
            Class<?> elementType = commonType(collection);
            if (elementType != null && !Serializable.class.isAssignableFrom(elementType)) {
                return copyThroughJson(value,
                        MAPPER.getTypeFactory().constructParametricType(value.getClass(), elementType));
            }
        } else if (value instanceof Map<?, ?> map) {
            Class<?> keyType = commonType(map.keySet());
            Class<?> valueType = commonType(map.values());
            if (keyType != null && valueType != null
                    && !(copiesBySerialization(keyType) && copiesBySerialization(valueType))) {
                return copyThroughJson(value,
                        MAPPER.getTypeFactory().constructParametricType(value.getClass(), keyType, valueType));
            }
        }
        if (value instanceof Serializable serializable) {
            try {
                return (T) SerializationHelper.clone(serializable);
            } catch (SerializationException e) {
                // The container is serializable and something inside it is not: copy through JSON.
            }
        }
        return copyThroughJson(value, MAPPER.constructType(value.getClass()));
    }

    private static <T> T copyThroughJson(T value, JavaType type) {
        return MAPPER.readValue(MAPPER.writeValueAsBytes(value), type);
    }

    /** A JDK type is copied through JSON, so a map of strings keeps the form the column stores. */
    private static boolean copiesBySerialization(Class<?> type) {
        return Serializable.class.isAssignableFrom(type) && !type.getPackageName().startsWith("java");
    }

    /**
     * The nearest class every non-null element is an instance of, or null when the elements share
     * nothing below {@link Object} or there are none.
     */
    private static Class<?> commonType(Collection<?> elements) {
        Class<?> common = null;
        for (Object element : elements) {
            if (element == null) {
                continue;
            }
            if (common == null) {
                common = element.getClass();
                continue;
            }
            while (!common.isAssignableFrom(element.getClass())) {
                common = common.getSuperclass();
                if (common == null || Objects.equals(common, Object.class)) {
                    return null;
                }
            }
        }
        return common;
    }
}
