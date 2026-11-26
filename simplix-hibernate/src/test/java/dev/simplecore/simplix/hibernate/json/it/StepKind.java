package dev.simplecore.simplix.hibernate.json.it;

import dev.simplecore.simplix.core.enums.LabeledEnum;

public enum StepKind implements LabeledEnum {
    REVIEW,
    APPROVAL;

    @Override
    public String getLabel() {
        return name().toLowerCase();
    }
}
