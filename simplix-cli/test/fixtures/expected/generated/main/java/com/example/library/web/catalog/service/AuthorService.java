package com.example.library.web.catalog.service;

import com.example.library.web.catalog.dto.AuthorDTOs.*;
import com.example.library.domain.catalog.entity.Author;

import com.example.library.domain.catalog.repository.AuthorRepository;

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
 * Service class for managing Author entities.
 * Provides business logic for CRUD operations, batch processing, and search functionality for Author entities.

 */
@Service
@Transactional(readOnly = true)
public class AuthorService extends SimpliXBaseService<Author, String> {

    private final MessageSource messageSource;

    /**
     * Constructs a new AuthorService with required dependencies.
     *
     * @param repository The repository for Author entities
     * @param entityManager JPA EntityManager for database operations
     * @param messageSource Message source for i18n error messages
     */
    public AuthorService(
        AuthorRepository repository,
        EntityManager entityManager,
        MessageSource messageSource
    ) {
        super(repository, entityManager);

        this.messageSource = messageSource;

    }

    /**
     * Creates a new Author entity from the provided DTO.
     *
     * @param createDTO DTO containing the data for the new Author
     * @return AuthorDetailDTO of the created entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    @Transactional
    public AuthorDetailDTO create(AuthorCreateDTO createDTO) {
        Author entity = new Author();
        modelMapper.map(createDTO, entity);

        return saveAndGetProjection(entity);
    }

    /**
     * Updates an existing Author entity with the provided DTO data.
     *
     * @param entity The existing Author entity to update
     * @param updateDto DTO containing the updated data
     * @return AuthorDetailDTO of the updated entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_CONFLICT if the authorId is changed, or ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    @Transactional
    public AuthorDetailDTO update(Author entity, AuthorUpdateDTO updateDto) {
        if (!Objects.equals(entity.getAuthorId(), updateDto.getAuthorId())) {
            throw new SimpliXGeneralException(ErrorCode.GEN_CONFLICT, "{error.id.cannot.change}", null);
        }
        modelMapper.map(updateDto, entity);
        return saveAndGetProjection(entity);
    }

    /**
     * Deletes a Author entity by its ID.
     *
     * @param authorId The ID of the Author to delete
     */
    @Transactional
    public void delete(String authorId) {
        deleteById(authorId);
    }

    /**
     * Deletes multiple Author entities by their IDs.
     *
     * @param authorIds List of Author IDs to delete
     */
    @Transactional
    public void batchDelete(List<String> authorIds) {
        deleteAllByIds(authorIds);
    }

    /**
     * Searches for Author entities using provided search parameters.
     *
     * @param params Map of search parameters and their values
     * @return Page of AuthorListDTO matching the search criteria
     */
    public Page<AuthorListDTO> search(Map<String, String> params) {
        SearchCondition<AuthorSearchDTO> searchCondition =
                new SearchableParamsParser<AuthorSearchDTO>(AuthorSearchDTO.class)
                        .convert(params);
        return findAllWithSearch(searchCondition, AuthorListDTO.class);
    }

    /**
     * Searches for Author entities using a SearchCondition object.
     *
     * @param searchCondition Search conditions for filtering Author entities
     * @return Page of AuthorListDTO matching the search criteria
     */
    public Page<AuthorListDTO> search(SearchCondition<AuthorSearchDTO> searchCondition) {
        return findAllWithSearch(searchCondition, AuthorListDTO.class);
    }

    /**
     * Updates multiple Author entities in a single operation.
     *
     * @param updateDtos Set of DTOs containing update data for multiple Authors
     * @return List of AuthorDetailDTO for the updated entities
     * @throws SimpliXGeneralException with ErrorCode.GEN_CONFLICT or ErrorCode.GEN_NOT_FOUND propagated from update()
     */
    @Transactional
    public List<AuthorDetailDTO> multiUpdate(Set<AuthorUpdateDTO> updateDtos) {
        List<AuthorDetailDTO> updatedEntities = new ArrayList<>();

        for (AuthorUpdateDTO updateDto : updateDtos) {
            if (updateDto.getAuthorId() == null) {
                continue;
            }

            Optional<Author> entityOpt = findById(updateDto.getAuthorId());
            if (entityOpt.isPresent()) {
                Author entity = entityOpt.get();
                AuthorDetailDTO updatedEntity = update(entity, updateDto);
                updatedEntities.add(updatedEntity);
            }
        }

        return updatedEntities;
    }

    /**
     * Performs batch updates on multiple Author entities.
     *
     * @param dto DTO containing the batch update data and target IDs
     * @throws UnsupportedOperationException always, as no fields are configured for batch update
     */
    @Transactional
    public void batchUpdate(AuthorBatchUpdateDTO dto) {
        // TODO: No fields configured for batch update - consider removing this method if not needed
		throw new UnsupportedOperationException("Unimplemented method 'batchUpdate'");
    }

    //----------------------------------

    /**
     * Saves a Author entity and returns its projection.
     * Handles the relationships with other entities.
     *
     * @param entity The Author entity to save
     * @return AuthorDetailDTO of the saved entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    private AuthorDetailDTO saveAndGetProjection(Author entity) {

        Author savedEntity = saveAndFlush(entity);
        // A formula, a join-derived name and the auditing fields are filled when the row is read, so
        // the row just written is read again before it is answered.
        entityManager.refresh(savedEntity);
        return findById(savedEntity.getAuthorId(), AuthorDetailDTO.class)
            .orElseThrow(() -> new SimpliXGeneralException(ErrorCode.GEN_NOT_FOUND, "Failed to retrieve saved entity", null));
    }

    //----------------------------------

    /**
     * Checks if the current user has the specified permission for the entity.
     *
     * @param permission The permission to check (e.g., "view", "edit", "delete")
     * @param authorId The ID of the entity to check permissions for. Can be null for new entities
     * @param dto The DTO object containing entity data. Used when authorId is null
     * @return true if the user has the permission, false otherwise
     * @throws UnsupportedOperationException as this method is not yet implemented
     */
    @Override
    public boolean hasOwnerPermission(String permission, String authorId, Object dto) {
        // // Example implementation
        // Author entity = new Author();
        // if (authorId != null) {
        //     entity = findById(authorId).orElseThrow(() -> new RuntimeException("Author not found"));
        // } else {
        //     modelMapper.map(dto, entity);
        // }

        // TODO: Implement dynamic permission checking based on entity fields
        // Use entity field analysis to determine ownership field dynamically

        throw new UnsupportedOperationException("Unimplemented method 'hasPermission'");
    }
}
