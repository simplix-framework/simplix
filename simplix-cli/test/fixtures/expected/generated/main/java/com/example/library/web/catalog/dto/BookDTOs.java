package com.example.library.web.catalog.dto;

import com.example.library.domain.catalog.entity.Book;

import com.example.library.domain.catalog.enums.BookStatus;
import com.example.library.domain.catalog.entity.Author;
import com.example.library.domain.catalog.entity.Shelf;
import com.example.library.domain.catalog.entity.BookReview;
import java.util.*;
import java.time.*;
import java.math.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.hibernate.validator.constraints.Length;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIncludeProperties;

import dev.simplecore.simplix.core.jackson.annotation.I18nTrans;
import dev.simplecore.simplix.core.validator.SoftDeleteType;
import dev.simplecore.simplix.core.validator.Unique;
import dev.simplecore.simplix.core.validator.UniqueField;
import dev.simplecore.simplix.core.validator.UniqueFields;
import dev.simplecore.searchable.core.annotation.SearchableField;
import dev.simplecore.simplix.core.annotation.FieldLabel;

import static dev.simplecore.searchable.core.condition.operator.SearchOperator.*;

public class BookDTOs {

    //----------------------------------
    // Search
    //----------------------------------

    @Getter
    @Setter
    public static class BookSearchDTO {

        @Schema(description = "Unique identifier of the book")
		@FieldLabel("{entities.Book.bookId}")
        // sortable because the list's default order is this id descending, and IN because the
        // filter for this entity resolves the labels of what is selected by asking for those ids
        // at once. Without either half the list is refused rather than merely narrowed.
        @SearchableField(operators = {EQUALS, IN}, sortable = true)
        private String bookId;

        @Schema(description = "The title on the cover")
		@FieldLabel("{entities.Book.title}")
        @SearchableField(entityField = "title", operators = {EQUALS, CONTAINS}, sortable = true, keyword = true)
        private String title;

        @Schema(description = "The ISBN printed on the book")
		@FieldLabel("{entities.Book.isbn}")
        @SearchableField(entityField = "isbn", operators = {EQUALS, CONTAINS}, sortable = true)
        private String isbn;

        @Schema(description = "Whether the book can be borrowed")
		@FieldLabel("{entities.Book.status}")
        @SearchableField(entityField = "status", operators = {EQUALS, IN}, sortable = true)
        private BookStatus status;

        @Schema(description = "The number of pages")
		@FieldLabel("{entities.Book.pageCount}")
        @SearchableField(entityField = "pageCount", operators = {EQUALS, GREATER_THAN, LESS_THAN}, sortable = true)
        private Integer pageCount;

        @Schema(description = "Whether the book stays in the reading room")
		@FieldLabel("{entities.Book.referenceOnly}")
        @SearchableField(entityField = "referenceOnly", operators = {EQUALS})
        private Boolean referenceOnly;

        @Schema(description = "The day the edition was published")
		@FieldLabel("{entities.Book.publishedOn}")
        @SearchableField(entityField = "publishedOn", operators = {BETWEEN, GREATER_THAN_OR_EQUAL_TO, LESS_THAN_OR_EQUAL_TO}, sortable = true)
        private LocalDate publishedOn;

        @Schema(description = "The author of the book")
		@FieldLabel("{entities.Book.authorId}")
        @SearchableField(entityField = "authorId", operators = {EQUALS, IN}, sortable = true)
        private String authorId;

        @Schema(description = "The shelf the book stands on")
		@FieldLabel("{entities.Book.shelfId}")
        @SearchableField(entityField = "shelfId", operators = {EQUALS, IN}, sortable = true)
        private String shelfId;

        //----------

        @Schema(description = "Created by")
        @SearchableField(entityField = "createdBy", operators = {EQUALS, CONTAINS})
        private String createdBy;

        @Schema(description = "Created at")
        @SearchableField(entityField = "createdAt", operators = {GREATER_THAN_OR_EQUAL_TO, LESS_THAN_OR_EQUAL_TO, BETWEEN}, sortable = true)
        private Instant createdAt;

        @Schema(description = "Updated by")
        @SearchableField(entityField = "updatedBy", operators = {EQUALS, CONTAINS})
        private String updatedBy;

        @Schema(description = "Updated at")
        @SearchableField(entityField = "updatedAt", operators = {GREATER_THAN_OR_EQUAL_TO, LESS_THAN_OR_EQUAL_TO, BETWEEN}, sortable = true)
        private Instant updatedAt;
    }

    //----------------------------------
    // Create, Update
    //----------------------------------

    @Data
    @UniqueFields({
        @UniqueField(entity = Book.class, field = "isbn", property = "isbn",
                idField = "bookId", idProperty = "bookId")
    })
    public static class BookCreateDTO {

        @Schema(description = "The title on the cover")
        @FieldLabel("{entities.Book.title}")
        @NotBlank
        @Length(max = 200)
        private String title;

        @Schema(description = "The ISBN printed on the book")
        @FieldLabel("{entities.Book.isbn}")
        @NotBlank
        @Length(max = 17)
        private String isbn;

        @Schema(description = "Whether the book can be borrowed")
        @FieldLabel("{entities.Book.status}")
        @NotNull
        private BookStatus status;

        @Schema(description = "Whether the book stays in the reading room")
        @FieldLabel("{entities.Book.referenceOnly}")
        @NotNull
        private Boolean referenceOnly;

        @Schema(description = "The day the edition was published")
        @FieldLabel("{entities.Book.publishedOn}")
        private LocalDate publishedOn;

        @Schema(description = "The author of the book")
        @FieldLabel("{entities.Book.authorId}")
        @Length(max = 36)
        private String authorId;

        @Schema(description = "What readers wrote about the book")
        @FieldLabel("{entities.Book.reviews}")
        private List<BookReview> reviews;

    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class BookUpdateDTO extends BookCreateDTO {

        @Schema(description = "Book ID")
		@FieldLabel("{entities.Book.bookId}")
        @NotBlank(message = "ID is required")
        private String bookId;

    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class BookUpdateFormDTO extends BookUpdateDTO {

        @Schema(description = "Created by")
        private String createdBy;

        @Schema(description = "Created at")
        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm")
        private Instant createdAt;

        @Schema(description = "Updated by")
        private String updatedBy;

        @Schema(description = "Updated at")
        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm")
        private Instant updatedAt;
    }

    @Data
    public static class BookBatchUpdateDTO {

        @Schema(description = "Book ID list")
        @FieldLabel("{entities.Book.bookId}")
        private Set<String> bookIds;

        @Schema(description = "Whether the book can be borrowed")
        @FieldLabel("{entities.Book.status}")
        private BookStatus status;

        @Schema(description = "Whether the book stays in the reading room")
        @FieldLabel("{entities.Book.referenceOnly}")
        private Boolean referenceOnly;

        @Schema(description = "The day the edition was published")
        @FieldLabel("{entities.Book.publishedOn}")
        private LocalDate publishedOn;

    }

    //----------------------------------
    // Projection
    //----------------------------------

    @Data
    public static class BookDetailDTO {

        @Schema(description = "Unique identifier of the book")
        private String bookId;

        @Schema(description = "The title on the cover")
        private String title;

        @Schema(description = "The ISBN printed on the book")
        private String isbn;

        @Schema(description = "Whether the book can be borrowed")
        private BookStatus status;

        @Schema(description = "The number of pages")
        private Integer pageCount;

        @Schema(description = "Whether the book stays in the reading room")
        private Boolean referenceOnly;

        @Schema(description = "The day the edition was published")
        private LocalDate publishedOn;

        @Schema(description = "The author of the book")
        private String authorId;

        @Schema(description = "Author")
        private Author author;

        @Schema(description = "The shelf the book stands on")
        private String shelfId;

        @Schema(description = "Shelf")
        private Shelf shelf;

        @Schema(description = "What readers wrote about the book")
        private List<BookReview> reviews;

        //----------

        @Schema(description = "Created by")
        private String createdBy;

        @Schema(description = "Created at")
        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm")
        private Instant createdAt;

        @Schema(description = "Updated by")
        private String updatedBy;

        @Schema(description = "Updated at")
        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm")
        private Instant updatedAt;
    }

    @Data
    public static class BookListDTO {

        @Schema(description = "Unique identifier of the book")
        private String bookId;

        @Schema(description = "The title on the cover")
        private String title;

        @Schema(description = "The ISBN printed on the book")
        private String isbn;

        @Schema(description = "Whether the book can be borrowed")
        private BookStatus status;

        @Schema(description = "The number of pages")
        private Integer pageCount;

        @Schema(description = "Whether the book stays in the reading room")
        private Boolean referenceOnly;

        @Schema(description = "The day the edition was published")
        private LocalDate publishedOn;

        @Schema(description = "The author of the book")
        private String authorId;

        @Schema(description = "Author")
        private Author author;

        @Schema(description = "The shelf the book stands on")
        private String shelfId;

        @Schema(description = "Shelf")
        private Shelf shelf;

        //----------

        @Schema(description = "Created by")
        private String createdBy;

        @Schema(description = "Created at")
        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm")
        private Instant createdAt;

        @Schema(description = "Updated by")
        private String updatedBy;

        @Schema(description = "Updated at")
        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm")
        private Instant updatedAt;

    }

}
