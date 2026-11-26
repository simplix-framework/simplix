package com.example.library.web.catalog.controller;

import dev.simplecore.simplix.web.controller.SimpliXBaseController;
import dev.simplecore.simplix.web.controller.SimpliXStandardApi;
import dev.simplecore.simplix.core.model.SimpliXApiResponse;
import com.example.library.web.catalog.dto.AuthorDTOs.*;
import com.example.library.domain.catalog.entity.Author;

import com.example.library.web.catalog.service.AuthorService;

import dev.simplecore.searchable.core.condition.SearchCondition;
import dev.simplecore.searchable.openapi.annotation.SearchableParams;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST Controller for A person who wrote books the library holds.
 * <p>
 * Provides CRUD operations and search functionality for Author entities.
 *
 * @see AuthorService
 * @see Author
 */
@RestController
@RequestMapping("/catalog/author")
@Tag(name = "catalog.Author", description = "A person who wrote books the library holds")
public class AuthorRestController extends SimpliXBaseController<Author, String> {

    private final AuthorService service;

    /**
     * Constructs a new AuthorRestController.
     *
     * @param service the service for handling Author operations
     */

    public AuthorRestController(AuthorService service) {
        super(service);
        this.service = service;
    }

    /**
     * Creates a new Author entity.
     *
     * @param createDto the DTO containing data for the new Author
     * @return response containing the created AuthorDetailDTO
     */
    @PostMapping("/create")
    @Operation(summary = "Create Author", description = "Creates a new Author")
    @PreAuthorize("hasPermission('CATALOG', 'create')")
    public SimpliXApiResponse<AuthorDetailDTO> create(@RequestBody @Validated AuthorCreateDTO createDto) {

        return SimpliXApiResponse.success(service.create(createDto));

    }

    /**
     * Updates an existing Author entity.
     *
     * @param authorId the ID of the Author to update
     * @param updateDto the DTO containing updated data
     * @return response containing the updated AuthorDetailDTO, or failure if not found
     */
    @PutMapping("/{authorId}")
    @Operation(summary = "Update Author", description = "Updates existing Author")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<AuthorDetailDTO> update(@PathVariable String authorId, @RequestBody @Validated AuthorUpdateDTO updateDto) {

        return service.findById(authorId)
                .map(entity -> SimpliXApiResponse.success(service.update(entity, updateDto)))
                .orElse(SimpliXApiResponse.failure(null, "Author not found"));

    }

    /**
     * Updates multiple Author entities in a single operation.
     *
     * @param updateDtos set of DTOs containing update data; {@code @Valid} on the element validates
     *                   each one as a single update is, since a bare set is not validated
     * @return response containing the list of updated AuthorDetailDTOs
     */
    @PatchMapping
    @Operation(summary = "Update Multiple Author", description = "Updates multiple existing Author")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<List<AuthorDetailDTO>> multiUpdate(@RequestBody Set<@Valid AuthorUpdateDTO> updateDtos) {

        List<AuthorDetailDTO> updatedItems = service.multiUpdate(updateDtos);

        return SimpliXApiResponse.success(updatedItems);
    }

    /**
     * Deletes a Author by its ID.
     *
     * @param authorId the ID of the Author to delete
     * @return response with success or failure message
     */
    @DeleteMapping("/{authorId}")
    @Operation(summary = "Delete Author", description = "Deletes Author by ID")
    @PreAuthorize("hasPermission('CATALOG', 'delete')")
    public SimpliXApiResponse<Void> delete(@PathVariable String authorId) {

        if (!service.existsById(authorId)) {
            return SimpliXApiResponse.failure(null, "Author not found");
        }
        service.delete(authorId);

        return SimpliXApiResponse.success(null, "Author deleted successfully");

    }

    /**
     * Retrieves a Author by its ID.
     *
     * @param authorId the ID of the Author to retrieve
     * @return response containing the AuthorDetailDTO, or failure if not found
     */
    @GetMapping("/{authorId}")
    @Operation(summary = "Get Author", description = "Retrieves Author by ID")
    @PreAuthorize("hasPermission('CATALOG', 'view')")
    public SimpliXApiResponse<AuthorDetailDTO> get(@PathVariable String authorId) {

        return service.findById(authorId, AuthorDetailDTO.class)
                .map(result -> SimpliXApiResponse.success(result))
                .orElse(SimpliXApiResponse.failure(null, "Author not found"));
    }

    /**
     * Retrieves a Author for update purposes.
     *
     * @param authorId the ID of the Author to retrieve
     * @return response containing the AuthorUpdateDTO, or failure if not found
     */
    @GetMapping("/{authorId}/edit")
    @Operation(summary = "Get Author for Update", description = "Retrieves Author by ID for update purposes")
    @PreAuthorize("hasPermission('CATALOG', 'view')")
    public SimpliXApiResponse<AuthorUpdateFormDTO> updateForm(@PathVariable String authorId) {

        return service.findById(authorId, AuthorUpdateFormDTO.class)
                .map(result -> SimpliXApiResponse.success(result))
                .orElse(SimpliXApiResponse.failure(null, "Author not found"));
    }

    /**
     * Batch updates multiple Author entities.
     *
     * @param batchUpdateDto the DTO containing batch update data
     * @return response with success or failure message
     */
    @PatchMapping("/batch")
    @Operation(summary = "Batch Update Authors", description = "Updates multiple Authors")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<Void> batchUpdate(@RequestBody @Validated AuthorBatchUpdateDTO batchUpdateDto) {
        service.batchUpdate(batchUpdateDto);
        return SimpliXApiResponse.success(null, "Authors updated successfully");
    }

    /**
     * Deletes multiple Author entities by their IDs.
     *
     * @param authorIds list of IDs to delete
     * @return response with success or failure message
     */
    @DeleteMapping("/batch")
    @Operation(summary = "Delete multiple Authors", description = "Deletes multiple Author by their IDs")
    @PreAuthorize("hasPermission('CATALOG', 'delete')")
    public SimpliXApiResponse<Void> batchDelete(@RequestParam List<String> authorIds) {

        service.batchDelete(authorIds);

        return SimpliXApiResponse.success(null, "Authors deleted successfully");

    }

    //----------------------------------
    // Searchable JPA
    //----------------------------------

    /**
     * Searches Author entities using GET method.
     *
     * @param params map of search parameters
     * @return response containing a page of AuthorListDTO
     */
    @GetMapping("/search")
    @Operation(summary = "Search Author list (GET)", description = "Searches Author with various conditions using GET method")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<Page<AuthorListDTO>> simpleSearch(@RequestParam(required = false) @SearchableParams(AuthorSearchDTO.class) Map<String, String> params) {
        return SimpliXApiResponse.success(service.search(params));
    }

    /**
     * Searches Author entities using POST method.
     *
     * @param searchCondition the search conditions for filtering
     * @return response containing a page of AuthorListDTO
     */
    @PostMapping("/search")
    @Operation(summary = "Search Author list (POST)", description = "Searches Author with various conditions using POST method")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<Page<AuthorListDTO>> search(@RequestBody @Validated SearchCondition<AuthorSearchDTO> searchCondition) {
        return SimpliXApiResponse.success(service.search(searchCondition));
    }
}
