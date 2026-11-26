package dev.simplecore.simplix.web.meta;

import java.util.Collection;
import java.util.List;

/**
 * A declaration SimpliX Meta refuses: a default sort a search cannot order by, a reference with no
 * target, two DTO classes of one simple name. A check throws it with one violation;
 * {@link DtoMetaBuilder} gathers the violations of the checks that do not depend on one another
 * and throws them together, so one request names everything to correct.
 */
public class SimpliXMetaViolationException extends IllegalStateException {

    private final transient List<String> violations;

    public SimpliXMetaViolationException(String violation) {
        super(violation);
        this.violations = List.of(violation);
    }

    public SimpliXMetaViolationException(Collection<String> violations) {
        super(describe(violations));
        this.violations = List.copyOf(violations);
    }

    /** Every refused declaration, in the order the document met them. */
    public List<String> violations() {
        return violations;
    }

    private static String describe(Collection<String> violations) {
        if (violations.size() == 1) return violations.iterator().next();
        return "SimpliX Meta refuses " + violations.size() + " declarations:\n- "
                + String.join("\n- ", violations);
    }
}
