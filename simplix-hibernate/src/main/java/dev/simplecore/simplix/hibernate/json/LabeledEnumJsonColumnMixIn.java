package dev.simplecore.simplix.hibernate.json;

import tools.jackson.databind.annotation.JsonDeserialize;

/**
 * Attaches {@link LabeledEnumJsonColumnDeserializer} to labeled enums for the Jackson 3 mapper of
 * the JSON columns, which their own Jackson 2 annotation does not reach.
 */
@JsonDeserialize(using = LabeledEnumJsonColumnDeserializer.class)
public interface LabeledEnumJsonColumnMixIn {
}
