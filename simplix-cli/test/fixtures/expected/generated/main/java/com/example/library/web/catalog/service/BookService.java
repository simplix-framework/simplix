package com.example.library.web.catalog.service;

import com.example.library.web.catalog.dto.BookDTOs.*;
import com.example.library.domain.catalog.entity.Book;

import com.example.library.domain.catalog.repository.BookRepository;

import dev.simplecore.simplix.core.exception.ErrorCode;
import dev.simplecore.simplix.core.exception.SimpliXGeneralException;
import dev.simplecore.simplix.web.service.SimpliXBaseService;
import dev.simplecore.searchable.core.condition.SearchCondition;
import dev.simplecore.searchable.core.condition.parser.SearchableParamsParser;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import dev.simplecore.simplix.excel.export.SearchExport;
import dev.simplecore.simplix.excel.export.ExportFormat;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.util.*;

/**
 * Service class for managing Book entities.
 * Provides business logic for CRUD operations, batch processing, and search functionality for Book entities.

 */
@Service
@Transactional(readOnly = true)
public class BookService extends SimpliXBaseService<Book, String> {

    private final MessageSource messageSource;

    /**
     * Constructs a new BookService with required dependencies.
     *
     * @param repository The repository for Book entities
     * @param entityManager JPA EntityManager for database operations
     * @param messageSource Message source for i18n error messages
     */
    public BookService(
        BookRepository repository,
        EntityManager entityManager,
        MessageSource messageSource
    ) {
        super(repository, entityManager);

        this.messageSource = messageSource;

    }

    /**
     * Creates a new Book entity from the provided DTO.
     *
     * @param createDTO DTO containing the data for the new Book
     * @return BookDetailDTO of the created entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    @Transactional
    public BookDetailDTO create(BookCreateDTO createDTO) {
        Book entity = new Book();
        modelMapper.map(createDTO, entity);

        return saveAndGetProjection(entity, createDTO.getAuthorId());
    }

    /**
     * Updates an existing Book entity with the provided DTO data.
     *
     * @param entity The existing Book entity to update
     * @param updateDto DTO containing the updated data
     * @return BookDetailDTO of the updated entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_CONFLICT if the bookId is changed, or ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    @Transactional
    public BookDetailDTO update(Book entity, BookUpdateDTO updateDto) {
        if (!Objects.equals(entity.getBookId(), updateDto.getBookId())) {
            throw new SimpliXGeneralException(ErrorCode.GEN_CONFLICT, "{error.id.cannot.change}", null);
        }
        modelMapper.map(updateDto, entity);
        return saveAndGetProjection(entity, updateDto.getAuthorId());
    }

    /**
     * Deletes a Book entity by its ID.
     *
     * @param bookId The ID of the Book to delete
     */
    @Transactional
    public void delete(String bookId) {
        deleteById(bookId);
    }

    /**
     * Deletes multiple Book entities by their IDs.
     *
     * @param bookIds List of Book IDs to delete
     */
    @Transactional
    public void batchDelete(List<String> bookIds) {
        deleteAllByIds(bookIds);
    }

    /**
     * Searches for Book entities using provided search parameters.
     *
     * @param params Map of search parameters and their values
     * @return Page of BookListDTO matching the search criteria
     */
    public Page<BookListDTO> search(Map<String, String> params) {
        SearchCondition<BookSearchDTO> searchCondition =
                new SearchableParamsParser<BookSearchDTO>(BookSearchDTO.class)
                        .convert(params);
        return findAllWithSearch(searchCondition, BookListDTO.class);
    }

    /**
     * Searches for Book entities using a SearchCondition object.
     *
     * @param searchCondition Search conditions for filtering Book entities
     * @return Page of BookListDTO matching the search criteria
     */
    public Page<BookListDTO> search(SearchCondition<BookSearchDTO> searchCondition) {
        return findAllWithSearch(searchCondition, BookListDTO.class);
    }

    /**
     * Writes every entry the list's search parameters match, so the file holds what the list
     * shows under the same filters and order rather than only its first page.
     *
     * @param params the list's search parameters; {@code page} and {@code size} are ignored
     * @param format the file kind
     * @param response where the file is written
     * @throws IOException when the response cannot be written
     */
    public void export(Map<String, String> params, ExportFormat format, HttpServletResponse response)
            throws IOException {
        SearchExport.of(BookListDTO.class, filters -> search(filters))
                .baseName("book")
                .write(params, format, response);
    }

    /**
     * Updates multiple Book entities in a single operation.
     *
     * @param updateDtos Set of DTOs containing update data for multiple Books
     * @return List of BookDetailDTO for the updated entities
     * @throws SimpliXGeneralException with ErrorCode.GEN_CONFLICT or ErrorCode.GEN_NOT_FOUND propagated from update()
     */
    @Transactional
    public List<BookDetailDTO> multiUpdate(Set<BookUpdateDTO> updateDtos) {
        List<BookDetailDTO> updatedEntities = new ArrayList<>();

        for (BookUpdateDTO updateDto : updateDtos) {
            if (updateDto.getBookId() == null) {
                continue;
            }

            Optional<Book> entityOpt = findById(updateDto.getBookId());
            if (entityOpt.isPresent()) {
                Book entity = entityOpt.get();
                BookDetailDTO updatedEntity = update(entity, updateDto);
                updatedEntities.add(updatedEntity);
            }
        }

        return updatedEntities;
    }

    /**
     * Performs batch updates on multiple Book entities.
     *
     * @param dto DTO containing the batch update data and target IDs
     */
    @Transactional
    public void batchUpdate(BookBatchUpdateDTO dto) {
        List<Book> entities = findAllById(dto.getBookIds());

        if (!entities.isEmpty()) {
            entities.forEach(entity -> {

                if (dto.getStatus() != null) {
                    entity.setStatus(dto.getStatus());
                }

                if (dto.getReferenceOnly() != null) {
                    entity.setReferenceOnly(dto.getReferenceOnly());
                }

                if (dto.getPublishedOn() != null) {
                    entity.setPublishedOn(dto.getPublishedOn());
                }

            });

            saveAll(entities);
        }
    }

    //----------------------------------

    /**
     * Saves a Book entity and returns its projection.
     * Handles the relationships with other entities.
     *
     * @param entity The Book entity to save
     * @param authorId The Author ID to set
     * @return BookDetailDTO of the saved entity
     * @throws SimpliXGeneralException with ErrorCode.GEN_NOT_FOUND if the saved entity cannot be retrieved
     */
    private BookDetailDTO saveAndGetProjection(Book entity, String authorId) {

        //----------------------------------
        // Many-to-one relationships
        //----------------------------------

        // Author - set FK ID field directly
        if (authorId != null) {
            entity.setAuthorId(authorId);
        }

        //----------------------------------
        // Many-to-many relationships
        //----------------------------------

        Book savedEntity = saveAndFlush(entity);
        // A formula, a join-derived name and the auditing fields are filled when the row is read, so
        // the row just written is read again before it is answered.
        entityManager.refresh(savedEntity);
        return findById(savedEntity.getBookId(), BookDetailDTO.class)
            .orElseThrow(() -> new SimpliXGeneralException(ErrorCode.GEN_NOT_FOUND, "Failed to retrieve saved entity", null));
    }

    //----------------------------------

    /**
     * Checks if the current user has the specified permission for the entity.
     *
     * @param permission The permission to check (e.g., "view", "edit", "delete")
     * @param bookId The ID of the entity to check permissions for. Can be null for new entities
     * @param dto The DTO object containing entity data. Used when bookId is null
     * @return true if the user has the permission, false otherwise
     * @throws UnsupportedOperationException as this method is not yet implemented
     */
    @Override
    public boolean hasOwnerPermission(String permission, String bookId, Object dto) {
        // // Example implementation
        // Book entity = new Book();
        // if (bookId != null) {
        //     entity = findById(bookId).orElseThrow(() -> new RuntimeException("Book not found"));
        // } else {
        //     modelMapper.map(dto, entity);
        // }

        // TODO: Implement dynamic permission checking based on entity fields
        // Use entity field analysis to determine ownership field dynamically

        throw new UnsupportedOperationException("Unimplemented method 'hasPermission'");
    }
}
