package com.example.library.domain.catalog.entity;

import com.example.library.domain.core.entity.BaseEntity;
import dev.simplecore.simplix.core.annotation.NameField;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Comment;

/**
 * A person who wrote books the library holds.
 */
@Entity
@Table(name = "authors")
@Comment("A person who wrote books the library holds")
@Getter
@Setter
@NoArgsConstructor
public class Author extends BaseEntity<String> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "author_id", nullable = false, unique = true, updatable = false)
    @Comment("Unique identifier of the author")
    private String authorId;

    @Column(name = "pen_name", nullable = false, length = 120)
    @Comment("The name printed on the books")
    @NameField
    private String penName;

    @Column(name = "biography", length = 2000)
    @Comment("A short account of the author's life")
    private String biography;
    @Override
    public String getId() {
        return authorId;
    }

    @Override
    public void setId(String id) {
        this.authorId = id;
    }
}
