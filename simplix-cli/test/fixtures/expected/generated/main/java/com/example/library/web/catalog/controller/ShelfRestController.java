package com.example.library.web.catalog.controller;

import dev.simplecore.simplix.web.controller.SimpliXBaseController;
import dev.simplecore.simplix.web.controller.SimpliXStandardApi;
import dev.simplecore.simplix.core.model.SimpliXApiResponse;
import com.example.library.web.catalog.dto.ShelfDTOs.*;
import com.example.library.domain.catalog.entity.Shelf;

import com.example.library.web.catalog.service.ShelfService;

import com.example.library.web.catalog.service.ShelfTreeService;
import dev.simplecore.simplix.core.exception.SimpliXGeneralException;

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
 * REST Controller for A place books stand in.
 * <p>
 * Provides CRUD operations and search functionality for Shelf entities.
 *
 * @see ShelfService
 * @see Shelf
 */
@RestController
@RequestMapping("/catalog/shelf")
@Tag(name = "catalog.Shelf", description = "A place books stand in")
public class ShelfRestController extends SimpliXBaseController<Shelf, String> {

    private final ShelfService service;

    private final ShelfTreeService treeService;

    /**
     * Constructs a new ShelfRestController.
     *
     * @param service the service for handling Shelf operations

     * @param treeService the tree service for handling tree-specific Shelf operations
     */

    public ShelfRestController(ShelfService service, ShelfTreeService treeService) {
        super(service);
        this.service = service;
        this.treeService = treeService;
    }

    /**
     * Creates a new Shelf entity.
     *
     * @param createDto the DTO containing data for the new Shelf
     * @return response containing the created ShelfDetailDTO
     */
    @PostMapping("/create")
    @Operation(summary = "Create Shelf", description = "Creates a new Shelf")
    @PreAuthorize("hasPermission('CATALOG', 'create')")
    public SimpliXApiResponse<ShelfDetailDTO> create(@RequestBody @Validated ShelfCreateDTO createDto) {

        return SimpliXApiResponse.success(treeService.createNode(createDto));

    }

    /**
     * Updates an existing Shelf entity.
     *
     * @param shelfId the ID of the Shelf to update
     * @param updateDto the DTO containing updated data
     * @return response containing the updated ShelfDetailDTO, or failure if not found
     */
    @PutMapping("/{shelfId}")
    @Operation(summary = "Update Shelf", description = "Updates existing Shelf")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<ShelfDetailDTO> update(@PathVariable String shelfId, @RequestBody @Validated ShelfUpdateDTO updateDto) {

        return treeService.findById(shelfId)
                .map(entity -> SimpliXApiResponse.success(treeService.updateNode(entity, updateDto)))
                .orElse(SimpliXApiResponse.failure(null, "Shelf not found"));

    }

    /**
     * Updates multiple Shelf entities in a single operation.
     *
     * @param updateDtos set of DTOs containing update data; {@code @Valid} on the element validates
     *                   each one as a single update is, since a bare set is not validated
     * @return response containing the list of updated ShelfDetailDTOs
     */
    @PatchMapping
    @Operation(summary = "Update Multiple Shelf", description = "Updates multiple existing Shelf")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<List<ShelfDetailDTO>> multiUpdate(@RequestBody Set<@Valid ShelfUpdateDTO> updateDtos) {

        // TreeService doesn't support multiUpdate - use service instead
        List<ShelfDetailDTO> updatedItems = service.multiUpdate(updateDtos);

        return SimpliXApiResponse.success(updatedItems);
    }

    /**
     * Deletes a Shelf by its ID.
     *
     * @param shelfId the ID of the Shelf to delete
     * @return response with success or failure message
     */
    @DeleteMapping("/{shelfId}")
    @Operation(summary = "Delete Shelf", description = "Deletes Shelf by ID")
    @PreAuthorize("hasPermission('CATALOG', 'delete')")
    public SimpliXApiResponse<Void> delete(@PathVariable String shelfId) {

        if (!service.existsById(shelfId)) {
            return SimpliXApiResponse.failure(null, "Shelf not found");
        }
        try {
            treeService.deleteNode(shelfId);
            return SimpliXApiResponse.success(null, "Shelf deleted successfully");
        } catch (SimpliXGeneralException e) {
            return SimpliXApiResponse.failure(null, e.getMessage());
        }

    }

    /**
     * Retrieves a Shelf by its ID.
     *
     * @param shelfId the ID of the Shelf to retrieve
     * @return response containing the ShelfDetailDTO, or failure if not found
     */
    @GetMapping("/{shelfId}")
    @Operation(summary = "Get Shelf", description = "Retrieves Shelf by ID")
    @PreAuthorize("hasPermission('CATALOG', 'view')")
    public SimpliXApiResponse<ShelfDetailDTO> get(@PathVariable String shelfId) {

        return service.findById(shelfId, ShelfDetailDTO.class)
                .map(result -> SimpliXApiResponse.success(result))
                .orElse(SimpliXApiResponse.failure(null, "Shelf not found"));
    }

    /**
     * Retrieves a Shelf for update purposes.
     *
     * @param shelfId the ID of the Shelf to retrieve
     * @return response containing the ShelfUpdateDTO, or failure if not found
     */
    @GetMapping("/{shelfId}/edit")
    @Operation(summary = "Get Shelf for Update", description = "Retrieves Shelf by ID for update purposes")
    @PreAuthorize("hasPermission('CATALOG', 'view')")
    public SimpliXApiResponse<ShelfUpdateFormDTO> updateForm(@PathVariable String shelfId) {

        return service.findById(shelfId, ShelfUpdateFormDTO.class)
                .map(result -> SimpliXApiResponse.success(result))
                .orElse(SimpliXApiResponse.failure(null, "Shelf not found"));
    }

    /**
     * Batch updates multiple Shelf entities.
     *
     * @param batchUpdateDto the DTO containing batch update data
     * @return response with success or failure message
     */
    @PatchMapping("/batch")
    @Operation(summary = "Batch Update Shelfs", description = "Updates multiple Shelfs")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<Void> batchUpdate(@RequestBody @Validated ShelfBatchUpdateDTO batchUpdateDto) {
        service.batchUpdate(batchUpdateDto);
        return SimpliXApiResponse.success(null, "Shelfs updated successfully");
    }

    /**
     * Deletes multiple Shelf entities by their IDs.
     *
     * @param shelfIds list of IDs to delete
     * @return response with success or failure message
     */
    @DeleteMapping("/batch")
    @Operation(summary = "Delete multiple Shelfs", description = "Deletes multiple Shelf by their IDs")
    @PreAuthorize("hasPermission('CATALOG', 'delete')")
    public SimpliXApiResponse<Void> batchDelete(@RequestParam List<String> shelfIds) {

        try {
            treeService.batchDeleteNodes(shelfIds);
            return SimpliXApiResponse.success(null, "Shelfs deleted successfully");
        } catch (SimpliXGeneralException e) {
            return SimpliXApiResponse.failure(null, e.getMessage());
        }

    }

    //----------------------------------
    // Order Update
    //----------------------------------

    /**
     * Updates the order of sibling nodes under a specific parent.
     *
     * @param parentId the parent node ID (empty string or null for root level)
     * @param orderUpdateDtos list of DTOs containing the IDs and new order values
     * @return response containing the list of updated ShelfListDTOs
     */
    @PatchMapping("/order")
    @Operation(summary = "Update Shelf Orders", description = "Updates the order of sibling Shelf entities under a parent")
    @SimpliXStandardApi
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<List<ShelfListDTO>> updateTreeOrder(
            @RequestParam(required = false) String parentId,
            @RequestBody List<@Valid ShelfOrderUpdateDTO> orderUpdateDtos) {
        try {
            List<ShelfListDTO> updatedEntities = treeService.updateOrders(parentId, orderUpdateDtos);
            return SimpliXApiResponse.success(updatedEntities, "Shelf orders updated successfully");
        } catch (SimpliXGeneralException e) {
            return SimpliXApiResponse.failure(null, e.getMessage());
        }
    }

    //----------------------------------
    // Tree Operations
    //----------------------------------

    /**
     * Retrieves the tree structure starting from root nodes.
     *
     * @param fullTree if true, returns full tree with all descendants; if false, returns only root nodes
     * @return response containing the list of ShelfListDTO representing the tree structure
     */
    @GetMapping("/tree")
    @Operation(summary = "Get Shelf Tree", description = "Retrieves the tree structure of Shelf entities")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<List<ShelfListDTO>> getTree(
            @RequestParam(value = "fullTree", defaultValue = "false") boolean fullTree) {
        List<ShelfListDTO> tree = treeService.findTree(fullTree);
        return SimpliXApiResponse.success(tree);
    }

    /**
     * Retrieves the subtree starting from a specific node.
     *
     * @param shelfId the root node ID to start from
     * @param fullTree if true, returns full subtree with all descendants; if false, returns only immediate children
     * @return response containing the list of ShelfListDTO representing the subtree
     */
    @GetMapping("/tree/{shelfId}")
    @Operation(summary = "Get Shelf Subtree", description = "Retrieves the subtree of Shelf entities starting from a specific node")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<List<ShelfListDTO>> getSubtree(
            @PathVariable String shelfId,
            @RequestParam(value = "fullTree", defaultValue = "false") boolean fullTree) {
        List<ShelfListDTO> subtree = treeService.findTree(shelfId, fullTree);
        return SimpliXApiResponse.success(subtree);
    }

    //----------------------------------
    // Searchable JPA
    //----------------------------------

    /**
     * Searches Shelf entities using GET method.
     *
     * @param params map of search parameters
     * @return response containing a page of ShelfListDTO
     */
    @GetMapping("/search")
    @Operation(summary = "Search Shelf list (GET)", description = "Searches Shelf with various conditions using GET method")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<Page<ShelfListDTO>> simpleSearch(@RequestParam(required = false) @SearchableParams(ShelfSearchDTO.class) Map<String, String> params) {
        return SimpliXApiResponse.success(service.search(params));
    }

    /**
     * Searches Shelf entities using POST method.
     *
     * @param searchCondition the search conditions for filtering
     * @return response containing a page of ShelfListDTO
     */
    @PostMapping("/search")
    @Operation(summary = "Search Shelf list (POST)", description = "Searches Shelf with various conditions using POST method")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<Page<ShelfListDTO>> search(@RequestBody @Validated SearchCondition<ShelfSearchDTO> searchCondition) {
        return SimpliXApiResponse.success(service.search(searchCondition));
    }
}
