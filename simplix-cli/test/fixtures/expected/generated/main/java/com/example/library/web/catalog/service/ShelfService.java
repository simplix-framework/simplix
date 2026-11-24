package com.example.library.web.catalog.service;

import com.example.library.web.catalog.dto.ShelfDTOs.*;
import com.example.library.domain.catalog.entity.Shelf;

import com.example.library.domain.catalog.repository.ShelfRepository;

import dev.simplecore.simplix.core.exception.ErrorCode;
import dev.simplecore.simplix.core.exception.SimpliXGeneralException;
import dev.simplecore.simplix.web.service.SimpliXBaseService;
import dev.simplecore.searchable.core.condition.SearchCondition;
import dev.simplecore.searchable.core.condition.parser.SearchableParamsParser;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.util.*;

/**
 * Service class for managing Shelf entities.
 * Provides business logic for CRUD operations, batch processing, and search functionality for Shelf entities.

 */
@Service
@Transactional(readOnly = true)
public class ShelfService extends SimpliXBaseService<Shelf, String> {

    private final MessageSource messageSource;

    /**
     * Constructs a new ShelfService with required dependencies.
     *
     * @param repository The repository for Shelf entities
     * @param entityManager JPA EntityManager for database operations
     * @param messageSource Message source for i18n error messages
     */
    public ShelfService(
        ShelfRepository repository,
        EntityManager entityManager,
        MessageSource messageSource
    ) {
        super(repository, entityManager);

        this.messageSource = messageSource;

    }

    /**
     * Creates a new Shelf entity from the provided DTO.
     *
     * @param createDTO DTO containing the data for the new Shelf
     * @return ShelfDetailDTO of the created entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    @Transactional
    public ShelfDetailDTO create(ShelfCreateDTO createDTO) {
        Shelf entity = new Shelf();
        modelMapper.map(createDTO, entity);

        return saveAndGetProjection(entity);
    }

    /**
     * Updates an existing Shelf entity with the provided DTO data.
     *
     * @param entity The existing Shelf entity to update
     * @param updateDto DTO containing the updated data
     * @return ShelfDetailDTO of the updated entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_CONFLICT if the shelfId is changed, or ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    @Transactional
    public ShelfDetailDTO update(Shelf entity, ShelfUpdateDTO updateDto) {
        if (!Objects.equals(entity.getShelfId(), updateDto.getShelfId())) {
            throw new SimpliXGeneralException(ErrorCode.GEN_CONFLICT, "{error.id.cannot.change}", null);
        }
        modelMapper.map(updateDto, entity);
        return saveAndGetProjection(entity);
    }

    /**
     * Deletes a Shelf entity by its ID.
     *
     * @param shelfId The ID of the Shelf to delete
     */
    @Transactional
    public void delete(String shelfId) {
        deleteById(shelfId);
    }

    /**
     * Deletes multiple Shelf entities by their IDs.
     *
     * @param shelfIds List of Shelf IDs to delete
     */
    @Transactional
    public void batchDelete(List<String> shelfIds) {
        deleteAllByIds(shelfIds);
    }

    /**
     * Searches for Shelf entities using provided search parameters.
     *
     * @param params Map of search parameters and their values
     * @return Page of ShelfListDTO matching the search criteria
     */
    public Page<ShelfListDTO> search(Map<String, String> params) {
        SearchCondition<ShelfSearchDTO> searchCondition =
                new SearchableParamsParser<ShelfSearchDTO>(ShelfSearchDTO.class)
                        .convert(params);
        return findAllWithSearch(searchCondition, ShelfListDTO.class);
    }

    /**
     * Searches for Shelf entities using a SearchCondition object.
     *
     * @param searchCondition Search conditions for filtering Shelf entities
     * @return Page of ShelfListDTO matching the search criteria
     */
    public Page<ShelfListDTO> search(SearchCondition<ShelfSearchDTO> searchCondition) {
        return findAllWithSearch(searchCondition, ShelfListDTO.class);
    }

    /**
     * Updates multiple Shelf entities in a single operation.
     *
     * @param updateDtos Set of DTOs containing update data for multiple Shelfs
     * @return List of ShelfDetailDTO for the updated entities
     * @throws SimpliXGeneralException with ErrorCode.GEN_CONFLICT or ErrorCode.GEN_NOT_FOUND propagated from update()
     */
    @Transactional
    public List<ShelfDetailDTO> multiUpdate(Set<ShelfUpdateDTO> updateDtos) {
        List<ShelfDetailDTO> updatedEntities = new ArrayList<>();

        for (ShelfUpdateDTO updateDto : updateDtos) {
            if (updateDto.getShelfId() == null) {
                continue;
            }

            Optional<Shelf> entityOpt = findById(updateDto.getShelfId());
            if (entityOpt.isPresent()) {
                Shelf entity = entityOpt.get();
                ShelfDetailDTO updatedEntity = update(entity, updateDto);
                updatedEntities.add(updatedEntity);
            }
        }

        return updatedEntities;
    }

    /**
     * Performs batch updates on multiple Shelf entities.
     *
     * @param dto DTO containing the batch update data and target IDs
     * @throws UnsupportedOperationException always, as no fields are configured for batch update
     */
    @Transactional
    public void batchUpdate(ShelfBatchUpdateDTO dto) {
        // TODO: No fields configured for batch update - consider removing this method if not needed
		throw new UnsupportedOperationException("Unimplemented method 'batchUpdate'");
    }

    //----------------------------------

    /**
     * Saves a Shelf entity and returns its projection.
     * Handles the relationships with other entities.
     *
     * @param entity The Shelf entity to save
     * @return ShelfDetailDTO of the saved entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    private ShelfDetailDTO saveAndGetProjection(Shelf entity) {

        Shelf savedEntity = saveAndFlush(entity);
        // A formula, a join-derived name and the auditing fields are filled when the row is read, so
        // the row just written is read again before it is answered.
        entityManager.refresh(savedEntity);
        return findById(savedEntity.getShelfId(), ShelfDetailDTO.class)
            .orElseThrow(() -> new SimpliXGeneralException(ErrorCode.GEN_NOT_FOUND, "Failed to retrieve saved entity", null));
    }

    //----------------------------------

    /**
     * Updates the order of a Shelf entity.
     *
     * @param orderUpdateDto DTO containing the ID and new order value
     * @return ShelfDetailDTO of the updated entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if the entity is not found
     */
    @Transactional
    public ShelfDetailDTO updateOrder(ShelfOrderUpdateDTO orderUpdateDto) {
        Shelf entity = findById(orderUpdateDto.getShelfId())
            .orElseThrow(() -> new SimpliXGeneralException(ErrorCode.GEN_NOT_FOUND, "Shelf not found", null));

        entity.setSortOrder(orderUpdateDto.getSortOrder());

        return saveAndGetProjection(entity);
    }

    /**
     * Updates the order of multiple Shelf entities.
     *
     * @param orderUpdateDtos List of DTOs containing the IDs and new order values
     * @return List of ShelfDetailDTO of the updated entities
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if any entity is not found
     */
    @Transactional
    public List<ShelfDetailDTO> updateOrders(List<ShelfOrderUpdateDTO> orderUpdateDtos) {
        List<ShelfDetailDTO> updatedEntities = new ArrayList<>();

        for (ShelfOrderUpdateDTO orderUpdateDto : orderUpdateDtos) {
            if (orderUpdateDto.getShelfId() == null) {
                continue;
            }

            Shelf entity = findById(orderUpdateDto.getShelfId())
                .orElseThrow(() -> new SimpliXGeneralException(ErrorCode.GEN_NOT_FOUND, "Shelf not found with ID: " + orderUpdateDto.getShelfId(), null));

            entity.setSortOrder(orderUpdateDto.getSortOrder());
            ShelfDetailDTO updatedEntity = saveAndGetProjection(entity);
            updatedEntities.add(updatedEntity);
        }

        return updatedEntities;
    }

    /**
     * Checks if the current user has the specified permission for the entity.
     *
     * @param permission The permission to check (e.g., "view", "edit", "delete")
     * @param shelfId The ID of the entity to check permissions for. Can be null for new entities
     * @param dto The DTO object containing entity data. Used when shelfId is null
     * @return true if the user has the permission, false otherwise
     * @throws UnsupportedOperationException as this method is not yet implemented
     */
    @Override
    public boolean hasOwnerPermission(String permission, String shelfId, Object dto) {
        // // Example implementation
        // Shelf entity = new Shelf();
        // if (shelfId != null) {
        //     entity = findById(shelfId).orElseThrow(() -> new RuntimeException("Shelf not found"));
        // } else {
        //     modelMapper.map(dto, entity);
        // }

        // TODO: Implement dynamic permission checking based on entity fields
        // Use entity field analysis to determine ownership field dynamically

        throw new UnsupportedOperationException("Unimplemented method 'hasPermission'");
    }
}
