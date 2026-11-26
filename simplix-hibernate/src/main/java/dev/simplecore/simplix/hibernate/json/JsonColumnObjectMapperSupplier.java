package dev.simplecore.simplix.hibernate.json;

import dev.simplecore.simplix.core.enums.SimpliXLabeledEnum;
import io.hypersistence.utils.hibernate.type.util.ObjectMapperSupplier;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * Supplies the mapper every {@code JsonType} column is written, read and copied with.
 *
 * <p>The mapper keeps the Jackson 2 defaults, so a value is stored in the form a Jackson 2 mapper
 * wrote it in (dates as timestamps, properties in declaration order), and it reads a labeled enum
 * from both forms a column holds: its name, and the object its {@code OBJECT} shape writes.
 */
public class JsonColumnObjectMapperSupplier implements ObjectMapperSupplier {

    @Override
    public ObjectMapper get() {
        return JsonMapper.builderWithJackson2Defaults()
                .findAndAddModules()
                .addMixIn(SimpliXLabeledEnum.class, LabeledEnumJsonColumnMixIn.class)
                .build();
    }
}
