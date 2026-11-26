package dev.simplecore.simplix.hibernate.json;

import dev.simplecore.simplix.core.enums.SimpliXLabeledEnum;
import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.BeanProperty;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ValueDeserializer;

import java.util.Arrays;

/**
 * Reads a labeled enum from a JSON column, where the value is stored either as its name or as the
 * object {@code @JsonFormat(shape = OBJECT)} on {@link SimpliXLabeledEnum} writes.
 *
 * <p>The JSON column type writes and reads with Jackson 3, which does not read the Jackson 2
 * {@code @JsonDeserialize} a labeled enum declares. This class answers both stored shapes for that
 * mapper and is attached to it by {@link LabeledEnumJsonColumnMixIn}.
 */
public class LabeledEnumJsonColumnDeserializer extends ValueDeserializer<SimpliXLabeledEnum> {

    private final Class<? extends Enum<?>> enumClass;

    public LabeledEnumJsonColumnDeserializer() {
        this(null);
    }

    private LabeledEnumJsonColumnDeserializer(Class<? extends Enum<?>> enumClass) {
        this.enumClass = enumClass;
    }

    @SuppressWarnings("unchecked")
    @Override
    public ValueDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) {
        JavaType type = property != null ? property.getType() : ctxt.getContextualType();
        // A collection property contextualizes with the container type; the enum is its element.
        while (type != null && type.isContainerType()) {
            type = type.getContentType();
        }
        if (type == null || !type.isEnumType()) {
            return this;
        }
        return new LabeledEnumJsonColumnDeserializer((Class<? extends Enum<?>>) type.getRawClass());
    }

    @Override
    public SimpliXLabeledEnum deserialize(JsonParser parser, DeserializationContext ctxt) throws JacksonException {
        if (parser.currentToken() == JsonToken.START_OBJECT) {
            return resolveByName(ctxt, readNameFromObject(parser));
        }
        return resolveByName(ctxt, parser.getString());
    }

    private String readNameFromObject(JsonParser parser) throws JacksonException {
        String name = null;
        while (parser.nextToken() != JsonToken.END_OBJECT) {
            String field = parser.currentName();
            parser.nextToken();
            if ("value".equals(field) || "name".equals(field)) {
                name = parser.getString();
            } else {
                parser.skipChildren();
            }
        }
        return name;
    }

    /**
     * Resolves the constant carrying the given name. A name the type does not declare is handed to
     * {@link DeserializationContext#handleWeirdStringValue}, so a stored value whose constant was
     * removed fails with the field path and is not dropped from a copy unnoticed.
     */
    private SimpliXLabeledEnum resolveByName(DeserializationContext ctxt, String name) throws JacksonException {
        if (name == null || enumClass == null) {
            return null;
        }
        for (Enum<?> constant : enumClass.getEnumConstants()) {
            if (constant.name().equals(name)) {
                return (SimpliXLabeledEnum) constant;
            }
        }
        return (SimpliXLabeledEnum) ctxt.handleWeirdStringValue(enumClass, name,
                "not one of the values accepted for Enum class: "
                        + Arrays.toString(enumClass.getEnumConstants()));
    }
}
