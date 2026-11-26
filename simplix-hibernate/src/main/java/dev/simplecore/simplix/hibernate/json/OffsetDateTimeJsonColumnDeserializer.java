package dev.simplecore.simplix.hibernate.json;

import io.hypersistence.utils.hibernate.type.util.ObjectMapperWrapper;
import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.ext.javatime.deser.InstantDeserializer;

import java.time.OffsetDateTime;

/**
 * Reads an {@link OffsetDateTime} from a JSON column. The JSON column type stores it as ISO-8601
 * text and reads it back with its offset; a column a mapper with plain Jackson 2 defaults wrote
 * holds a timestamp, which is read as the moment it names.
 */
public class OffsetDateTimeJsonColumnDeserializer extends ValueDeserializer<OffsetDateTime> {

    @Override
    public OffsetDateTime deserialize(JsonParser parser, DeserializationContext context) throws JacksonException {
        if (parser.hasToken(JsonToken.VALUE_STRING)) {
            return ObjectMapperWrapper.OffsetDateTimeDeserializer.INSTANCE.deserialize(parser, context);
        }
        return InstantDeserializer.OFFSET_DATE_TIME.deserialize(parser, context);
    }

    @Override
    public Class<OffsetDateTime> handledType() {
        return OffsetDateTime.class;
    }
}
