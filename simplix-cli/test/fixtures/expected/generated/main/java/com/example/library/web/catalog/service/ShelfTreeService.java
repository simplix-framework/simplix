package com.example.library.web.catalog.service;

import com.example.library.web.catalog.dto.ShelfDTOs.*;
import com.example.library.domain.catalog.entity.Shelf;

import dev.simplecore.simplix.core.exception.ErrorCode;
import dev.simplecore.simplix.core.exception.SimpliXGeneralException;
import dev.simplecore.simplix.core.tree.repository.SimpliXTreeRepository;
import dev.simplecore.simplix.core.tree.service.SimpliXTreeBaseService;
import org.modelmapper.ModelMapper;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Tree service class for managing Shelf entities.
 * <p>
 * Provides tree-specific CRUD operations, including parent-child relationship management,
 * tree traversal, and sibling reordering for Shelf entities.
 * <p>
 * This service extends SimpliXTreeBaseService which provides:
 * <ul>
 *   <li>Tree structure retrieval (findRoots, findDirectChildren, getAllDescendants)</li>
 *   <li>Tree traversal (findAncestors, getPath)</li>
 *   <li>Tree manipulation (move, copy)</li>
 * </ul>

 *
 * @see SimpliXTreeBaseService
 * @see ShelfService
 */
@Service
@Transactional(readOnly = true)
public class ShelfTreeService extends SimpliXTreeBaseService<Shelf, String> {

    protected final ModelMapper modelMapper;
    private final MessageSource messageSource;

    /**
     * Constructs a new ShelfTreeService with required dependencies.
     *
     * @param treeRepository The tree repository for Shelf entities
     * @param modelMapper ModelMapper for DTO-Entity mapping
     * @param messageSource Message source for i18n error messages
     */
    public ShelfTreeService(
        SimpliXTreeRepository<Shelf, String> treeRepository,
        ModelMapper modelMapper,
        MessageSource messageSource
    ) {
        super(treeRepository);
        this.modelMapper = modelMapper;
        this.messageSource = messageSource;
    }

    //----------------------------------
    // CRUD Operations for Tree Nodes
    //----------------------------------

    /**
     * Creates a new Shelf tree node from the provided DTO.
     * <p>
     * Handles empty parentId conversion to null for root nodes.
     * FK ID fields are mapped directly by ModelMapper from DTO to entity.
     *
     * @param createDTO DTO containing the data for the new Shelf
     * @return ShelfDetailDTO of the created entity
     */
    @Transactional
    public ShelfDetailDTO createNode(ShelfCreateDTO createDTO) {
        Shelf entity = new Shelf();
        modelMapper.map(createDTO, entity);

        // Handle empty parentId - convert to null for root nodes
        entity.setParentId(normalizeParentId(entity.getParentId()));

        Shelf savedEntity = create(entity);
        return modelMapper.map(savedEntity, ShelfDetailDTO.class);
    }

    /**
     * Updates an existing Shelf tree node with the provided DTO data.
     * <p>
     * Handles empty parentId conversion to null for root nodes.
     * Validates tree structure integrity (circular reference prevention, parent existence).
     *
     * @param entity The existing Shelf entity to update
     * @param updateDto DTO containing the updated data
     * @return ShelfDetailDTO of the updated entity
     * @throws SimpliXGeneralException if ID is changed, circular reference detected, or related entities are not found
     */
    @Transactional
    public ShelfDetailDTO updateNode(Shelf entity, ShelfUpdateDTO updateDto) {
        if (!Objects.equals(entity.getShelfId(), updateDto.getShelfId())) {
            throw new SimpliXGeneralException(ErrorCode.GEN_CONFLICT, "{error.id.cannot.change}", null);
        }

        // Preserve existing parentId for comparison
        String existingParentId = entity.getParentId();

        // Normalize new parentId
        final String newParentId = normalizeParentId(updateDto.getParentId());

        // Validate parentId change with tree structure validation
        if (!Objects.equals(existingParentId, newParentId)) {
            if (newParentId != null) {
                // Validate new parent exists
                findById(newParentId).orElseThrow(() -> {
                    String message = messageSource.getMessage("error.entity.not.found",
                        new Object[]{"Parent", newParentId},
                        "Parent not found", LocaleContextHolder.getLocale());
                    return new SimpliXGeneralException(ErrorCode.GEN_NOT_FOUND, message, null);
                });

                // Check for circular reference using base service utility method
                validateNoCircularReference(entity.getShelfId(), newParentId,
                    () -> new SimpliXGeneralException(ErrorCode.VAL_VALIDATION_FAILED, "{error.tree.circular.reference}", null));
            }
        }

        modelMapper.map(updateDto, entity);

        // Set validated parentId (overwrite whatever modelMapper set)
        entity.setParentId(newParentId);

        Shelf savedEntity = update(entity);
        return modelMapper.map(savedEntity, ShelfDetailDTO.class);
    }

    /**
     * Deletes a Shelf tree node by its ID.
     * <p>
     * This operation will fail if the node has children. Move or delete children first.
     * Caller should verify entity exists before calling this method.
     *
     * @param shelfId The ID of the Shelf to delete
     * @throws SimpliXGeneralException if the node has children
     */
    @Transactional
    public void deleteNode(String shelfId) {
        // Check if node has children using base service utility method
        validateNoChildren(shelfId, () -> {
            String message = messageSource.getMessage("error.tree.has.children",
                null, "Cannot delete node with children. Delete or move children first.",
                LocaleContextHolder.getLocale());
            return new SimpliXGeneralException(ErrorCode.VAL_VALIDATION_FAILED, message, null);
        });

        deleteById(shelfId);
    }

    /**
     * Deletes multiple Shelf tree nodes by their IDs.
     * <p>
     * Validates that none of the nodes have children before deletion.
     *
     * @param shelfIds List of Shelf IDs to delete
     * @throws SimpliXGeneralException if any node has children
     */
    @Transactional
    public void batchDeleteNodes(List<String> shelfIds) {
        // Validate none have children using base service utility method
        for (String shelfId : shelfIds) {
            validateNoChildren(shelfId, () -> {
                String message = messageSource.getMessage("error.tree.has.children",
                    new Object[]{shelfId},
                    "Cannot delete node " + shelfId + " with children.",
                    LocaleContextHolder.getLocale());
                return new SimpliXGeneralException(ErrorCode.VAL_VALIDATION_FAILED, message, null);
            });
        }
        deleteBatch(shelfIds);
    }

    //----------------------------------
    // Tree-Specific Operations
    //----------------------------------

    /**
     * Retrieves the tree structure starting from root nodes.
     *
     * @param fullTree If true, returns full tree with all descendants; if false, returns only root nodes
     * @return List of ShelfListDTO representing the tree structure
     */
    public List<ShelfListDTO> findTree(boolean fullTree) {
        return findTree(null, fullTree);
    }

    /**
     * Retrieves the tree structure starting from a specific node.
     *
     * @param parentId The root node ID to start from (null for top-level roots)
     * @param fullTree If true, returns full subtree with all descendants; if false, returns only immediate children
     * @return List of ShelfListDTO representing the tree structure
     */
    public List<ShelfListDTO> findTree(String parentId, boolean fullTree) {
        // Handle empty parentId using base service utility method
        parentId = normalizeParentId(parentId);

        List<Shelf> nodes;
        if (fullTree) {
            // Return full tree with all descendants (already structured with children)
            if (parentId == null) {
                nodes = findCompleteHierarchy();
            } else {
                nodes = getAllDescendants(parentId);
            }
            // Convert to DTOs preserving tree structure
            return mapToTreeDtoWithModelMapper(nodes);
        } else {
            // Return only immediate children (or roots) - flat list
            nodes = parentId == null ? findRoots() : findDirectChildren(parentId);
            return nodes.stream()
                .map(node -> modelMapper.map(node, ShelfListDTO.class))
                .collect(Collectors.toList());
        }
    }

    /**
     * Converts entity tree to DTO tree using ModelMapper.
     * <p>
     * Uses base class utility method with ModelMapper for entity-to-DTO conversion.
     *
     * @param entities List of entities with children populated
     * @return List of DTOs with children populated
     */
    private List<ShelfListDTO> mapToTreeDtoWithModelMapper(List<Shelf> entities) {
        return mapToTreeDto(
            entities,
            entity -> modelMapper.map(entity, ShelfListDTO.class),
            Shelf::getChildren,
            ShelfListDTO::setChildren
        );
    }

    /**
     * Updates the order of sibling nodes under a specific parent.
     * <p>
     * This method reorders children nodes within the same parent. Use null parentId for root nodes.
     *
     * @param parentId The parent node ID (null for root level)
     * @param orderUpdateDtos List of DTOs containing the IDs and new order values
     * @return List of ShelfListDTO of the reordered entities
     * @throws SimpliXGeneralException if any entity doesn't belong to the specified parent
     */
    @Transactional
    public List<ShelfListDTO> updateOrders(String parentId, List<ShelfOrderUpdateDTO> orderUpdateDtos) {
        // Handle empty parentId - convert to null for root nodes
        parentId = normalizeParentId(parentId);

        List<ShelfListDTO> updatedEntities = new ArrayList<>();

        for (ShelfOrderUpdateDTO orderUpdateDto : orderUpdateDtos) {
            if (orderUpdateDto.getShelfId() == null) {
                continue;
            }

            Optional<Shelf> entityOpt = findById(orderUpdateDto.getShelfId());
            if (entityOpt.isEmpty()) {
                continue; // Skip non-existent entities
            }

            Shelf entity = entityOpt.get();

            // Validate that the entity belongs to the specified parent
            if (!Objects.equals(entity.getParentId(), parentId)) {
                String message = messageSource.getMessage("error.tree.invalid.parent",
                    new Object[]{orderUpdateDto.getShelfId(), parentId},
                    "Node " + orderUpdateDto.getShelfId() + " does not belong to parent " + parentId,
                    LocaleContextHolder.getLocale());
                throw new SimpliXGeneralException(ErrorCode.VAL_VALIDATION_FAILED, message, null);
            }

            entity.setSortOrder(orderUpdateDto.getSortOrder());
            Shelf savedEntity = update(entity);

            updatedEntities.add(modelMapper.map(savedEntity, ShelfListDTO.class));
        }

        return updatedEntities;
    }

}
