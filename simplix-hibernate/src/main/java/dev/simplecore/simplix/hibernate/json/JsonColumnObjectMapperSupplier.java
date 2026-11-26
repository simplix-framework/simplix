package dev.simplecore.simplix.hibernate.json;

import dev.simplecore.simplix.core.enums.SimpliXLabeledEnum;
import io.hypersistence.utils.hibernate.type.util.ObjectMapperSupplier;
import io.hypersistence.utils.hibernate.type.util.ObjectMapperWrapper;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.module.SimpleModule;

import java.time.OffsetDateTime;

/**
 * Supplies the mapper every {@code JsonType} column is written, read and copied with.
 *
 * <p>The mapper stores a value in the form the JSON column type wrote it in while it used Jackson 2:
 * dates as timestamps, an {@link OffsetDateTime} as ISO-8601 text, properties in declaration order.
 * It reads a labeled enum from both forms a column holds: its name, and the object its
 * {@code OBJECT} shape writes.
 */
public class JsonColumnObjectMapperSupplier implements ObjectMapperSupplier {

    @Override
    public ObjectMapper get() {
        return JsonMapper.builderWithJackson2Defaults()
                .findAndAddModules()
                .addModule(new SimpleModule()
                        .addSerializer(OffsetDateTime.class, ObjectMapperWrapper.OffsetDateTimeSerializer.INSTANCE)
                        .addDeserializer(OffsetDateTime.class, new OffsetDateTimeJsonColumnDeserializer()))
                .addMixIn(SimpliXLabeledEnum.class, LabeledEnumJsonColumnMixIn.class)
                .build();
    }
}
