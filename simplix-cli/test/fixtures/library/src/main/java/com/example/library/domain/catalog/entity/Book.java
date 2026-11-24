package com.example.library.domain.catalog.entity;

import com.example.library.domain.catalog.enums.BookStatus;
import com.example.library.domain.core.entity.BaseEntity;
import dev.simplecore.simplix.core.annotation.NameField;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.List;

/**
 * A book the library holds.
 */
@Entity
@Table(name = "books")
@Comment("A book the library holds")
@Getter
@Setter
@NoArgsConstructor
public class Book extends BaseEntity<String> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "book_id", nullable = false, unique = true, updatable = false)
    @Comment("Unique identifier of the book")
    private String bookId;

    @Column(name = "title", nullable = false, length = 200)
    @Comment("The title on the cover")
    @NameField
    private String title;

    @Column(name = "isbn", nullable = false, unique = true, length = 17)
    @Comment("The ISBN printed on the book")
    private String isbn;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Comment("Whether the book can be borrowed")
    private BookStatus status;

    @Column(name = "page_count")
    @Comment("The number of pages")
    private Integer pageCount;

    @Column(name = "reference_only", nullable = false)
    @Comment("Whether the book stays in the reading room")
    private Boolean referenceOnly;

    @Column(name = "published_on")
    @Comment("The day the edition was published")
    private LocalDate publishedOn;

    @Column(name = "author_id", length = 36)
    @Comment("The author of the book")
    private String authorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", insertable = false, updatable = false)
    private Author author;

    @Column(name = "shelf_id", length = 36)
    @Comment("The shelf the book stands on")
    private String shelfId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelf_id", insertable = false, updatable = false)
    private Shelf shelf;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reviews")
    @Comment("What readers wrote about the book")
    private List<BookReview> reviews;
}
