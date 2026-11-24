package com.example.library.domain.catalog.entity;

import com.example.library.domain.core.entity.BaseEntity;
import dev.simplecore.simplix.core.annotation.NameField;
import dev.simplecore.simplix.core.tree.annotation.TreeEntityAttributes;
import dev.simplecore.simplix.core.tree.entity.TreeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Comment;

import java.util.ArrayList;
import java.util.List;

/**
 * A place books stand in: a room, a bookcase in it, a shelf of the bookcase.
 */
@Entity
@Table(name = "shelves")
@Comment("A place books stand in")
@TreeEntityAttributes(
    tableName = "shelves",
    idColumn = "shelf_id",
    parentIdColumn = "parent_id",
    sortOrderColumn = "sort_order"
)
@Getter
@Setter
@NoArgsConstructor
public class Shelf extends BaseEntity<String> implements TreeEntity<Shelf, String> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "shelf_id", nullable = false, unique = true, updatable = false)
    @Comment("Unique identifier of the shelf")
    private String shelfId;

    @Column(name = "label", nullable = false, length = 80)
    @Comment("The label on the shelf")
    @NameField
    private String label;

    @Column(name = "parent_id", length = 36)
    @Comment("The place this one is part of")
    private String parentId;

    @Column(name = "sort_order", nullable = false)
    @Comment("The position among the places of the same parent")
    private Integer sortOrder;

    @Transient
    private List<Shelf> children = new ArrayList<>();

    @Override
    public String getId() {
        return shelfId;
    }

    @Override
    public void setId(String id) {
        this.shelfId = id;
    }

    @Override
    public Comparable<?> getSortKey() {
        return sortOrder;
    }
}
