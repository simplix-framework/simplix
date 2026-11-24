package com.example.library.web.catalog.dto;

import com.example.library.domain.catalog.entity.Shelf;

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

public class ShelfDTOs {

    //----------------------------------
    // Search
    //----------------------------------

    @Getter
    @Setter
    public static class ShelfSearchDTO {

        @Schema(description = "Unique identifier of the shelf")
		@FieldLabel("{entities.Shelf.shelfId}")
        // sortable because the list's default order is this id descending, and IN because the
        // filter for this entity resolves the labels of what is selected by asking for those ids
        // at once. Without either half the list is refused rather than merely narrowed.
        @SearchableField(operators = {EQUALS, IN}, sortable = true)
        private String shelfId;

        @Schema(description = "The label on the shelf")
		@FieldLabel("{entities.Shelf.label}")
        @SearchableField(entityField = "label", operators = {EQUALS, CONTAINS}, sortable = true)
        private String label;

        @Schema(description = "The place this one is part of")
		@FieldLabel("{entities.Shelf.parentId}")
        @SearchableField(entityField = "parentId", operators = {EQUALS, CONTAINS}, sortable = true)
        private String parentId;

        @Schema(description = "The position among the places of the same parent")
		@FieldLabel("{entities.Shelf.sortOrder}")
        @SearchableField(entityField = "sortOrder", operators = {EQUALS, GREATER_THAN, LESS_THAN}, sortable = true)
        private Integer sortOrder;

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
    public static class ShelfCreateDTO {

        @Schema(description = "The label on the shelf")
        @FieldLabel("{entities.Shelf.label}")
        @NotBlank
        @Length(max = 80)
        private String label;

        @Schema(description = "The place this one is part of")
        @FieldLabel("{entities.Shelf.parentId}")
        @Length(max = 36)
        private String parentId;

        @Schema(description = "The position among the places of the same parent")
        @FieldLabel("{entities.Shelf.sortOrder}")
        @NotNull
        private Integer sortOrder;

    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class ShelfUpdateDTO extends ShelfCreateDTO {

        @Schema(description = "Shelf ID")
		@FieldLabel("{entities.Shelf.shelfId}")
        @NotBlank(message = "ID is required")
        private String shelfId;

    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class ShelfUpdateFormDTO extends ShelfUpdateDTO {

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
    public static class ShelfBatchUpdateDTO {

        @Schema(description = "Shelf ID list")
        @FieldLabel("{entities.Shelf.shelfId}")
        private Set<String> shelfIds;

    }

    //----------------------------------
    // Projection
    //----------------------------------

    @Data
    public static class ShelfDetailDTO {

        @Schema(description = "Unique identifier of the shelf")
        private String shelfId;

        @Schema(description = "The label on the shelf")
        private String label;

        @Schema(description = "The place this one is part of")
        private String parentId;

        @Schema(description = "The position among the places of the same parent")
        private Integer sortOrder;

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
    public static class ShelfListDTO {

        @Schema(description = "Unique identifier of the shelf")
        private String shelfId;

        @Schema(description = "The label on the shelf")
        private String label;

        @Schema(description = "The place this one is part of")
        private String parentId;

        @Schema(description = "The position among the places of the same parent")
        private Integer sortOrder;

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

        //----------
        // Tree Structure

        @Schema(description = "Child nodes in tree hierarchy")
        private List<ShelfListDTO> children;

    }

    //----------------------------------
    // Order Update
    //----------------------------------

    /**
     * DTO for updating the display order of Shelf entities.
     */
    @Data
    public static class ShelfOrderUpdateDTO {

        @Schema(description = "Shelf ID")
        @FieldLabel("{entities.Shelf.shelfId}")
        @NotBlank(message = "ID is required")
        private String shelfId;

        @Schema(description = "The position among the places of the same parent")
        @FieldLabel("{entities.Shelf.sortOrder}")
        private Integer sortOrder;
    }

}
