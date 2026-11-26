package dev.simplecore.simplix.hibernate.json.it;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.Type;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "json_column_items")
public class JsonColumnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Version
    private Long version;

    @Type(JsonType.class)
    @Column(name = "steps", columnDefinition = "TEXT")
    private List<Step> steps;

    @Type(JsonType.class)
    @Column(name = "labels", columnDefinition = "TEXT")
    private Map<String, String> labels;

    protected JsonColumnItem() {
    }

    public JsonColumnItem(List<Step> steps, Map<String, String> labels) {
        this.steps = steps;
        this.labels = labels;
    }

    public String getId() {
        return id;
    }

    public Long getVersion() {
        return version;
    }

    public List<Step> getSteps() {
        return steps;
    }

    public void setSteps(List<Step> steps) {
        this.steps = steps;
    }

    public Map<String, String> getLabels() {
        return labels;
    }
}
