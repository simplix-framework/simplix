package com.example.library.web.catalog.service;

import com.example.library.web.catalog.dto.ShelfDTOs.ShelfCreateDTO;
import com.example.library.web.catalog.dto.ShelfDTOs.ShelfUpdateDTO;
import com.example.library.web.catalog.dto.ShelfDTOs.ShelfDetailDTO;

import com.example.library.domain.catalog.entity.Shelf;

import com.example.library.domain.catalog.repository.ShelfRepository;

import dev.simplecore.simplix.core.exception.SimpliXGeneralException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;

import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.MessageSource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ShelfService
 *
 * This test class verifies:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Search and pagination functionality
 * - Batch update operations
 * - Exception handling
 * - Data validation
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShelfService Tests")
class ShelfServiceTest {

    @Mock
    private ShelfRepository repository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private MessageSource messageSource;

    @Mock
    private ModelMapper modelMapper;

    private ShelfService service;

    private Shelf entity;
    private ShelfCreateDTO createDto;
    private ShelfUpdateDTO updateDto;

    private String testId;

    @BeforeEach
    void setUp() {
        service = new ShelfService(
            repository,
            entityManager,
            messageSource
        );

        // Inject ModelMapper using reflection since it's not in the constructor
        ReflectionTestUtils.setField(service, "modelMapper", modelMapper);

        testId = UUID.randomUUID().toString();

        // Setup test entity
        entity = new Shelf();
        entity.setId(testId);

        entity.setShelfId(testId);

        entity.setLabel("test-label");

        entity.setParentId("test-parentId");

        entity.setSortOrder(1);

        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());

        // Setup DTOs
        createDto = new ShelfCreateDTO();

        createDto.setLabel("test-label");

        createDto.setParentId("test-parentId");

        createDto.setSortOrder(1);

        updateDto = new ShelfUpdateDTO();
        updateDto.setShelfId(testId);

        updateDto.setLabel("updated-label");

        updateDto.setParentId("updated-parentId");

        updateDto.setSortOrder(2);

    }

    @Test
    @DisplayName("Should create entity successfully")
    void testCreate() {
        // Given
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(repository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        when(repository.findById(any())).thenReturn(Optional.of(entity));
        doAnswer(invocation -> {
            // Simulate mapping from DTO to entity
            return null;
        }).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = service.create(createDto);

        // Then
        assertThat(result).isNotNull();

        assertThat(result.getShelfId()).isEqualTo(testId);

        verify(repository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should find entity by ID")
    void testFindById() {
        // Given
        when(repository.findById(testId))
            .thenReturn(Optional.of(entity));

        // When
        Optional<Shelf> result = service.findById(testId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(entity);
        verify(repository, times(1)).findById(testId);
    }

    @Test
    @DisplayName("Should return empty when entity not found")
    void testFindByIdNotFound() {
        // Given
        when(repository.findById(testId))
            .thenReturn(Optional.empty());

        // When
        Optional<Shelf> result = service.findById(testId);

        // Then
        assertThat(result).isEmpty();
        verify(repository, times(1)).findById(testId);
    }

    @Test
    @DisplayName("Should update entity successfully")
    void testUpdate() {
        // Given
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(repository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        when(repository.findById(any())).thenReturn(Optional.of(entity));
        doAnswer(invocation -> {
            // Simulate mapping from DTO to entity
            return null;
        }).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = service.update(entity, updateDto);

        // Then
        assertThat(result).isNotNull();
        verify(repository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should handle entity update with save")
    void testUpdateWithSave() {
        // Given
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(repository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        when(repository.findById(any())).thenReturn(Optional.of(entity));
        doAnswer(invocation -> {
            return null;
        }).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = service.update(entity, updateDto);

        // Then
        assertThat(result).isNotNull();
        verify(repository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should refuse an update that changes the ID")
    void testUpdateRefusesChangedId() {
        // Given
        updateDto.setShelfId(UUID.randomUUID().toString());

        // When/Then: the message is the key a placeholder names, resolved only at the HTTP layer
        assertThatThrownBy(() -> service.update(entity, updateDto))
            .isInstanceOf(SimpliXGeneralException.class)
            .hasMessageContaining("error.id.cannot.change");

        verify(repository, never()).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should delete entity successfully")
    void testDelete() {
        // Given

        String deleteId = testId;

        doNothing().when(repository).deleteById(deleteId);

        // When
        service.delete(deleteId);

        // Then
        verify(repository, times(1)).deleteById(deleteId);
    }

    @Test
    @DisplayName("Should handle batch delete")
    void testBatchDelete() {
        // Given

        List<String> deleteIds = Arrays.asList(testId, UUID.randomUUID().toString());

        doNothing().when(repository).deleteById(any());

        // When
        service.batchDelete(deleteIds);

        // Then
        // SimpliXBaseService calls deleteById for each ID
        verify(repository, times(deleteIds.size())).deleteById(any());
    }

    @Test
    @DisplayName("Should find all entities with pagination")
    void testFindAllWithPagination() {
        // Given
        List<Shelf> entities = Arrays.asList(entity);
        Page<Shelf> page = new PageImpl<>(entities, PageRequest.of(0, 10), 1);
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(repository.findAll(any(Pageable.class))).thenReturn(page);
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        Page<ShelfDetailDTO> result = service.findAll(PageRequest.of(0, 10), ShelfDetailDTO.class);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        verify(repository, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @DisplayName("Should find all entities")
    void testFindAll() {
        // Given
        List<Shelf> entities = Arrays.asList(entity);
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(repository.findAll()).thenReturn(entities);
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        List<ShelfDetailDTO> result = service.findAll(ShelfDetailDTO.class);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(repository, times(1)).findAll();
    }

    // Note: SimpliXBaseService doesn't have a count() method
    // Count functionality is not available in the base service

    @Test
    @DisplayName("Should check if entity exists by ID")
    void testExistsById() {
        // Given
        when(repository.existsById(testId)).thenReturn(true);

        // When
        boolean result = service.existsById(testId);

        // Then
        assertThat(result).isTrue();
        verify(repository, times(1)).existsById(testId);
    }

}
