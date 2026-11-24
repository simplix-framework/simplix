package com.example.library.web.catalog.dto;

import com.example.library.domain.catalog.entity.Author;

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

public class AuthorDTOs {

    //----------------------------------
    // Search
    //----------------------------------

    @Getter
    @Setter
    public static class AuthorSearchDTO {

        @Schema(description = "Unique identifier of the author")
		@FieldLabel("{entities.Author.authorId}")
        // sortable because the list's default order is this id descending, and IN because the
        // filter for this entity resolves the labels of what is selected by asking for those ids
        // at once. Without either half the list is refused rather than merely narrowed.
        @SearchableField(operators = {EQUALS, IN}, sortable = true)
        private String authorId;

        @Schema(description = "The name printed on the books")
		@FieldLabel("{entities.Author.penName}")
        @SearchableField(entityField = "penName", operators = {EQUALS, CONTAINS}, sortable = true)
        private String penName;

        @Schema(description = "A short account of the author's life")
		@FieldLabel("{entities.Author.biography}")
        @SearchableField(entityField = "biography", operators = {EQUALS, CONTAINS}, sortable = true)
        private String biography;

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
    public static class AuthorCreateDTO {

        @Schema(description = "The name printed on the books")
        @FieldLabel("{entities.Author.penName}")
        @NotBlank
        @Length(max = 120)
        private String penName;

        @Schema(description = "A short account of the author's life")
        @FieldLabel("{entities.Author.biography}")
        @Length(max = 2000)
        private String biography;

    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class AuthorUpdateDTO extends AuthorCreateDTO {

        @Schema(description = "Author ID")
		@FieldLabel("{entities.Author.authorId}")
        @NotBlank(message = "ID is required")
        private String authorId;

    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class AuthorUpdateFormDTO extends AuthorUpdateDTO {

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
    public static class AuthorBatchUpdateDTO {

        @Schema(description = "Author ID list")
        @FieldLabel("{entities.Author.authorId}")
        private Set<String> authorIds;

    }

    //----------------------------------
    // Projection
    //----------------------------------

    @Data
    public static class AuthorDetailDTO {

        @Schema(description = "Unique identifier of the author")
        private String authorId;

        @Schema(description = "The name printed on the books")
        private String penName;

        @Schema(description = "A short account of the author's life")
        private String biography;

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
    public static class AuthorListDTO {

        @Schema(description = "Unique identifier of the author")
        private String authorId;

        @Schema(description = "The name printed on the books")
        private String penName;

        @Schema(description = "A short account of the author's life")
        private String biography;

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
