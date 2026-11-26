package dev.simplecore.simplix.hibernate.json.it;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

/** A value object the way a JSON column keeps one: not Serializable, with a labeled enum and times. */
public record Step(StepKind kind, Instant decidedAt, LocalDate dueOn, String name, Map<String, String> nameI18n) {
}
