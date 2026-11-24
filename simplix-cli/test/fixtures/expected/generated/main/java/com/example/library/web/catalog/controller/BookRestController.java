package com.example.library.web.catalog.controller;

import dev.simplecore.simplix.web.controller.SimpliXBaseController;
import dev.simplecore.simplix.web.controller.SimpliXStandardApi;
import dev.simplecore.simplix.web.controller.SimpliXDefaultSort;
import dev.simplecore.simplix.core.model.SimpliXApiResponse;
import com.example.library.web.catalog.dto.BookDTOs.*;
import com.example.library.domain.catalog.entity.Book;

import com.example.library.web.catalog.service.BookService;

import dev.simplecore.searchable.core.condition.SearchCondition;
import dev.simplecore.searchable.openapi.annotation.SearchableParams;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import dev.simplecore.simplix.excel.export.ExportFormat;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST Controller for A book the library holds.
 * <p>
 * Provides CRUD operations and search functionality for Book entities.
 *
 * @see BookService
 * @see Book
 */
@RestController
@RequestMapping("/catalog/book")
@Tag(name = "catalog.Book", description = "A book the library holds")
@SimpliXDefaultSort(field = "title", direction = "asc")
public class BookRestController extends SimpliXBaseController<Book, String> {

    private final BookService service;

    /**
     * Constructs a new BookRestController.
     *
     * @param service the service for handling Book operations
     */

    public BookRestController(BookService service) {
        super(service);
        this.service = service;
    }

    /**
     * Creates a new Book entity.
     *
     * @param createDto the DTO containing data for the new Book
     * @return response containing the created BookDetailDTO
     */
    @PostMapping("/create")
    @Operation(summary = "Create Book", description = "Creates a new Book")
    @PreAuthorize("hasPermission('CATALOG', 'create')")
    public SimpliXApiResponse<BookDetailDTO> create(@RequestBody @Validated BookCreateDTO createDto) {

        return SimpliXApiResponse.success(service.create(createDto));

    }

    /**
     * Updates an existing Book entity.
     *
     * @param bookId the ID of the Book to update
     * @param updateDto the DTO containing updated data
     * @return response containing the updated BookDetailDTO, or failure if not found
     */
    @PutMapping("/{bookId}")
    @Operation(summary = "Update Book", description = "Updates existing Book")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<BookDetailDTO> update(@PathVariable String bookId, @RequestBody @Validated BookUpdateDTO updateDto) {

        return service.findById(bookId)
                .map(entity -> SimpliXApiResponse.success(service.update(entity, updateDto)))
                .orElse(SimpliXApiResponse.failure(null, "Book not found"));

    }

    /**
     * Updates multiple Book entities in a single operation.
     *
     * @param updateDtos set of DTOs containing update data
     * @return response containing the list of updated BookDetailDTOs
     */
    @PatchMapping
    @Operation(summary = "Update Multiple Book", description = "Updates multiple existing Book")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<List<BookDetailDTO>> multiUpdate(@RequestBody Set<BookUpdateDTO> updateDtos) {

        List<BookDetailDTO> updatedItems = service.multiUpdate(updateDtos);

        return SimpliXApiResponse.success(updatedItems);
    }

    /**
     * Deletes a Book by its ID.
     *
     * @param bookId the ID of the Book to delete
     * @return response with success or failure message
     */
    @DeleteMapping("/{bookId}")
    @Operation(summary = "Delete Book", description = "Deletes Book by ID")
    @PreAuthorize("hasPermission('CATALOG', 'delete')")
    public SimpliXApiResponse<Void> delete(@PathVariable String bookId) {

        if (!service.existsById(bookId)) {
            return SimpliXApiResponse.failure(null, "Book not found");
        }
        service.delete(bookId);

        return SimpliXApiResponse.success(null, "Book deleted successfully");

    }

    /**
     * Retrieves a Book by its ID.
     *
     * @param bookId the ID of the Book to retrieve
     * @return response containing the BookDetailDTO, or failure if not found
     */
    @GetMapping("/{bookId}")
    @Operation(summary = "Get Book", description = "Retrieves Book by ID")
    @PreAuthorize("hasPermission('CATALOG', 'view')")
    public SimpliXApiResponse<BookDetailDTO> get(@PathVariable String bookId) {

        return service.findById(bookId, BookDetailDTO.class)
                .map(result -> SimpliXApiResponse.success(result))
                .orElse(SimpliXApiResponse.failure(null, "Book not found"));
    }

    /**
     * Retrieves a Book for update purposes.
     *
     * @param bookId the ID of the Book to retrieve
     * @return response containing the BookUpdateDTO, or failure if not found
     */
    @GetMapping("/{bookId}/edit")
    @Operation(summary = "Get Book for Update", description = "Retrieves Book by ID for update purposes")
    @PreAuthorize("hasPermission('CATALOG', 'view')")
    public SimpliXApiResponse<BookUpdateFormDTO> updateForm(@PathVariable String bookId) {

        return service.findById(bookId, BookUpdateFormDTO.class)
                .map(result -> SimpliXApiResponse.success(result))
                .orElse(SimpliXApiResponse.failure(null, "Book not found"));
    }

    /**
     * Batch updates multiple Book entities.
     *
     * @param batchUpdateDto the DTO containing batch update data
     * @return response with success or failure message
     */
    @PatchMapping("/batch")
    @Operation(summary = "Batch Update Books", description = "Updates multiple Books")
    @PreAuthorize("hasPermission('CATALOG', 'edit')")
    public SimpliXApiResponse<Void> batchUpdate(@RequestBody @Validated BookBatchUpdateDTO batchUpdateDto) {
        service.batchUpdate(batchUpdateDto);
        return SimpliXApiResponse.success(null, "Books updated successfully");
    }

    /**
     * Deletes multiple Book entities by their IDs.
     *
     * @param bookIds list of IDs to delete
     * @return response with success or failure message
     */
    @DeleteMapping("/batch")
    @Operation(summary = "Delete multiple Books", description = "Deletes multiple Book by their IDs")
    @PreAuthorize("hasPermission('CATALOG', 'delete')")
    public SimpliXApiResponse<Void> batchDelete(@RequestParam List<String> bookIds) {

        service.batchDelete(bookIds);

        return SimpliXApiResponse.success(null, "Books deleted successfully");

    }

    //----------------------------------
    // Searchable JPA
    //----------------------------------

    /**
     * Searches Book entities using GET method.
     *
     * @param params map of search parameters
     * @return response containing a page of BookListDTO
     */
    @GetMapping("/search")
    @Operation(summary = "Search Book list (GET)", description = "Searches Book with various conditions using GET method")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<Page<BookListDTO>> simpleSearch(@RequestParam(required = false) @SearchableParams(BookSearchDTO.class) Map<String, String> params) {
        return SimpliXApiResponse.success(service.search(params));
    }

    /**
     * Downloads every entry the list's search parameters match as CSV or Excel.
     *
     * <p>Writes the file to the response rather than returning an envelope: the body is the file,
     * streamed page by page through simplix-excel. Errors still reach the global handler as
     * exceptions.
     *
     * @param params map of search parameters, the same the list takes
     * @param format the file kind, CSV when absent
     * @param response where the file is written
     * @throws IOException when the response cannot be written
     */
    @GetMapping("/export")
    @Operation(summary = "Export Book list",
            description = "Downloads every Book the search conditions match as a CSV or XLSX file")
    @PreAuthorize("hasPermission('CATALOG', 'export')")
    public void export(
            @RequestParam(required = false) @SearchableParams(BookSearchDTO.class) Map<String, String> params,
            @RequestParam(defaultValue = "CSV") ExportFormat format,
            HttpServletResponse response) throws IOException {
        service.export(params, format, response);
    }

    /**
     * Searches Book entities using POST method.
     *
     * @param searchCondition the search conditions for filtering
     * @return response containing a page of BookListDTO
     */
    @PostMapping("/search")
    @Operation(summary = "Search Book list (POST)", description = "Searches Book with various conditions using POST method")
    @PreAuthorize("hasPermission('CATALOG', 'list')")
    public SimpliXApiResponse<Page<BookListDTO>> search(@RequestBody @Validated SearchCondition<BookSearchDTO> searchCondition) {
        return SimpliXApiResponse.success(service.search(searchCondition));
    }
}
