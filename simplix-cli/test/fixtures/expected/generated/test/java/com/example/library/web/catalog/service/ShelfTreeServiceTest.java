package com.example.library.web.catalog.service;

import com.example.library.web.catalog.dto.ShelfDTOs.ShelfCreateDTO;
import com.example.library.web.catalog.dto.ShelfDTOs.ShelfUpdateDTO;
import com.example.library.web.catalog.dto.ShelfDTOs.ShelfDetailDTO;
import com.example.library.web.catalog.dto.ShelfDTOs.ShelfListDTO;

import com.example.library.web.catalog.dto.ShelfDTOs.ShelfOrderUpdateDTO;

import com.example.library.domain.catalog.entity.Shelf;

import dev.simplecore.simplix.core.exception.ErrorCode;
import dev.simplecore.simplix.core.exception.SimpliXGeneralException;
import dev.simplecore.simplix.core.tree.repository.SimpliXTreeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.modelmapper.ModelMapper;
import org.springframework.context.MessageSource;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ShelfTreeService
 * <p>
 * This test class verifies:
 * <ul>
 *   <li>Tree node CRUD operations (createNode, updateNode, deleteNode)</li>
 *   <li>Tree structure operations (findTree, findSubtree)</li>
 *   <li>Children validation for delete operations</li>
 *   <li>Order update operations</li>
 *   <li>Exception handling</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ShelfTreeService Tests")
class ShelfTreeServiceTest {

    @Mock
    private SimpliXTreeRepository<Shelf, String> treeRepository;

    @Mock
    private MessageSource messageSource;

    @Mock
    private ModelMapper modelMapper;

    private ShelfTreeService treeService;

    private Shelf entity;
    private Shelf childEntity;
    private ShelfCreateDTO createDto;
    private ShelfUpdateDTO updateDto;

    private String testId;
    private String childId;

    @BeforeEach
    void setUp() {
        treeService = new ShelfTreeService(
            treeRepository,
            modelMapper,
            messageSource
        );

        testId = "test-id-1";
        childId = "child-id-1";

        // Setup test entity (root node)
        entity = new Shelf();
        entity.setId(testId);

        entity.setShelfId(testId);

        entity.setParentId(null); // Root node

        entity.setLabel("test-label");

        entity.setSortOrder(1);

        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());

        // Setup child entity
        childEntity = new Shelf();
        childEntity.setId(childId);
        childEntity.setShelfId(childId);
        childEntity.setParentId(testId); // Child of test entity

        childEntity.setLabel("child-label");

        childEntity.setSortOrder(2);

        childEntity.setCreatedAt(Instant.now());
        childEntity.setUpdatedAt(Instant.now());

        // Setup DTOs
        createDto = new ShelfCreateDTO();
        createDto.setParentId(null); // Root node

        createDto.setLabel("test-label");

        createDto.setSortOrder(1);

        updateDto = new ShelfUpdateDTO();
        updateDto.setShelfId(testId);
        updateDto.setParentId(null); // Keep as root

        updateDto.setLabel("updated-label");

        updateDto.setSortOrder(2);

    }

    //----------------------------------
    // Tree Node CRUD Tests
    //----------------------------------

    @Test
    @DisplayName("Should create root node successfully")
    void testCreateRootNode() {
        // Given
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(treeRepository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        doAnswer(invocation -> null).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = treeService.createNode(createDto);

        // Then
        assertThat(result).isNotNull();

        assertThat(result.getShelfId()).isEqualTo(testId);

        verify(treeRepository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should create child node successfully")
    void testCreateChildNode() {
        // Given
        createDto.setParentId(testId);
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(childId);
        detailDto.setParentId(testId);

        // Mock parent validation
        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));
        when(treeRepository.saveAndFlush(any(Shelf.class))).thenReturn(childEntity);
        doAnswer(invocation -> null).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = treeService.createNode(createDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getParentId()).isEqualTo(testId);
        verify(treeRepository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should handle empty parentId as null for root node")
    void testCreateNodeWithEmptyParentId() {
        // Given
        createDto.setParentId(""); // Empty string for root
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);
        detailDto.setParentId(null);

        when(treeRepository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        doAnswer(invocation -> null).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = treeService.createNode(createDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getParentId()).isNull();
    }

    @Test
    @DisplayName("Should update node successfully")
    void testUpdateNode() {
        // Given
        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));
        when(treeRepository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        doAnswer(invocation -> null).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = treeService.updateNode(entity, updateDto);

        // Then
        assertThat(result).isNotNull();
        verify(treeRepository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should throw exception when ID is changed during update")
    void testUpdateNodeWithChangedId() {
        // Given

        updateDto.setShelfId(childId); // Different ID

        // When/Then
        assertThatThrownBy(() -> treeService.updateNode(entity, updateDto))
            .isInstanceOf(SimpliXGeneralException.class)
            .hasMessageContaining("error.id.cannot.change");
    }

    @Test
    @DisplayName("Should delete node without children successfully")
    void testDeleteNodeWithoutChildren() {
        // Given
        when(treeRepository.findDirectChildren(testId)).thenReturn(Collections.emptyList());
        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));
        when(treeRepository.findItemWithAllDescendants(testId)).thenReturn(Arrays.asList(entity));
        doNothing().when(treeRepository).deleteById(testId);

        // When
        treeService.deleteNode(testId);

        // Then
        verify(treeRepository, times(1)).findDirectChildren(testId);
        verify(treeRepository, times(1)).deleteById(testId);
    }

    @Test
    @DisplayName("Should throw exception when deleting node with children")
    void testDeleteNodeWithChildren() {
        // Given
        when(treeRepository.findDirectChildren(testId)).thenReturn(Arrays.asList(childEntity));
        when(messageSource.getMessage(eq("error.tree.has.children"), any(), anyString(), any()))
            .thenReturn("Cannot delete node with children");

        // When/Then
        assertThatThrownBy(() -> treeService.deleteNode(testId))
            .isInstanceOf(SimpliXGeneralException.class)
            .hasMessageContaining("Cannot delete node with children");

        verify(treeRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Should batch delete nodes without children")
    void testBatchDeleteNodesWithoutChildren() {
        // Given
        List<String> ids = Arrays.asList(testId, childId);
        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));
        when(treeRepository.findById(childId)).thenReturn(Optional.of(childEntity));
        when(treeRepository.findDirectChildren(any())).thenReturn(Collections.emptyList());
        when(treeRepository.findItemWithAllDescendants(any())).thenReturn(Collections.emptyList());
        doNothing().when(treeRepository).deleteAllById(ids);

        // When
        treeService.batchDeleteNodes(ids);

        // Then
        // findDirectChildren is called twice per ID: once in batchDeleteNodes() validation, once in deleteBatch()
        verify(treeRepository, atLeast(2)).findDirectChildren(any());
        verify(treeRepository, times(1)).deleteAllById(ids);
    }

    @Test
    @DisplayName("Should throw exception when batch deleting node with children")
    void testBatchDeleteNodesWithChildren() {
        // Given
        List<String> ids = Arrays.asList(testId);
        when(treeRepository.findDirectChildren(testId)).thenReturn(Arrays.asList(childEntity));
        when(messageSource.getMessage(eq("error.tree.has.children"), any(), anyString(), any()))
            .thenReturn("Cannot delete node with children");

        // When/Then
        assertThatThrownBy(() -> treeService.batchDeleteNodes(ids))
            .isInstanceOf(SimpliXGeneralException.class)
            .hasMessageContaining("Cannot delete node with children");

        verify(treeRepository, never()).deleteAllById(any());
    }

    //----------------------------------
    // Tree Structure Tests
    //----------------------------------

    @Test
    @DisplayName("Should find root nodes only")
    void testFindTreeRootsOnly() {
        // Given
        when(treeRepository.findRootItems()).thenReturn(Arrays.asList(entity));
        ShelfListDTO listDto = new ShelfListDTO();
        listDto.setShelfId(testId);
        when(modelMapper.map(any(Shelf.class), eq(ShelfListDTO.class)))
            .thenReturn(listDto);

        // When
        List<ShelfListDTO> result = treeService.findTree(false);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(treeRepository, times(1)).findRootItems();
    }

    @Test
    @DisplayName("Should find complete tree hierarchy")
    void testFindTreeFullHierarchy() {
        // Given
        when(treeRepository.findCompleteHierarchy()).thenReturn(Arrays.asList(entity, childEntity));
        ShelfListDTO listDto1 = new ShelfListDTO();
        listDto1.setShelfId(testId);
        ShelfListDTO listDto2 = new ShelfListDTO();
        listDto2.setShelfId(childId);
        when(modelMapper.map(any(Shelf.class), eq(ShelfListDTO.class)))
            .thenReturn(listDto1, listDto2);

        // When
        List<ShelfListDTO> result = treeService.findTree(true);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        verify(treeRepository, times(1)).findCompleteHierarchy();
    }

    @Test
    @DisplayName("Should find direct children of a node")
    void testFindTreeDirectChildren() {
        // Given
        when(treeRepository.findDirectChildren(testId)).thenReturn(Arrays.asList(childEntity));
        ShelfListDTO listDto = new ShelfListDTO();
        listDto.setShelfId(childId);
        listDto.setParentId(testId);
        when(modelMapper.map(any(Shelf.class), eq(ShelfListDTO.class)))
            .thenReturn(listDto);

        // When
        List<ShelfListDTO> result = treeService.findTree(testId, false);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(treeRepository, times(1)).findDirectChildren(testId);
    }

    @Test
    @DisplayName("Should find all descendants of a node")
    void testFindTreeAllDescendants() {
        // Given
        when(treeRepository.findItemWithAllDescendants(testId)).thenReturn(Arrays.asList(childEntity));
        ShelfListDTO listDto = new ShelfListDTO();
        listDto.setShelfId(childId);
        when(modelMapper.map(any(Shelf.class), eq(ShelfListDTO.class)))
            .thenReturn(listDto);

        // When
        List<ShelfListDTO> result = treeService.findTree(testId, true);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(treeRepository, times(1)).findItemWithAllDescendants(testId);
    }

    //----------------------------------
    // Order Update Tests
    //----------------------------------

    @Test
    @DisplayName("Should update sibling node orders successfully")
    void testUpdateOrders() {
        // Given
        ShelfOrderUpdateDTO orderDto1 = new ShelfOrderUpdateDTO();
        orderDto1.setShelfId(testId);
        orderDto1.setSortOrder(2);

        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));
        when(treeRepository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        ShelfListDTO listDto = new ShelfListDTO();
        listDto.setShelfId(testId);
        listDto.setSortOrder(2);
        when(modelMapper.map(any(Shelf.class), eq(ShelfListDTO.class)))
            .thenReturn(listDto);

        // When
        List<ShelfListDTO> result = treeService.updateOrders(null, Arrays.asList(orderDto1));

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(treeRepository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should throw exception when updating order for node with wrong parent")
    void testUpdateOrdersWithWrongParent() {
        // Given
        ShelfOrderUpdateDTO orderDto = new ShelfOrderUpdateDTO();
        orderDto.setShelfId(childId);
        orderDto.setSortOrder(1);

        // childEntity has parentId = testId, but we're trying to update under null parent
        when(treeRepository.findById(childId)).thenReturn(Optional.of(childEntity));
        when(messageSource.getMessage(eq("error.tree.invalid.parent"), any(), anyString(), any()))
            .thenReturn("Node does not belong to parent");

        // When/Then
        assertThatThrownBy(() -> treeService.updateOrders(null, Arrays.asList(orderDto)))
            .isInstanceOf(SimpliXGeneralException.class)
            .hasMessageContaining("Node does not belong to parent");
    }

    @Test
    @DisplayName("Should skip non-existent entities in order update")
    void testUpdateOrdersSkipsNonExistent() {
        // Given
        ShelfOrderUpdateDTO orderDto = new ShelfOrderUpdateDTO();
        orderDto.setShelfId("non-existent-id");
        orderDto.setSortOrder(1);

        when(treeRepository.findById(any())).thenReturn(Optional.empty());

        // When
        List<ShelfListDTO> result = treeService.updateOrders(null, Arrays.asList(orderDto));

        // Then
        assertThat(result).isEmpty();
        verify(treeRepository, never()).save(any());
    }

    //----------------------------------
    // Parent Change Validation Tests
    //----------------------------------

    @Test
    @DisplayName("Should update node successfully when parentId changes to valid parent")
    void testUpdateNodeWithValidParentChange() {
        // Given
        String newParentId = "new-parent-id";
        Shelf newParent = new Shelf();
        newParent.setId(newParentId);
        newParent.setShelfId(newParentId);

        entity.setParentId(null); // Currently a root node
        updateDto.setParentId(newParentId); // Move to new parent

        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(testId);

        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));
        when(treeRepository.findById(newParentId)).thenReturn(Optional.of(newParent));
        when(treeRepository.findItemWithAllDescendants(testId)).thenReturn(Collections.emptyList());
        when(treeRepository.saveAndFlush(any(Shelf.class))).thenReturn(entity);
        doAnswer(invocation -> null).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = treeService.updateNode(entity, updateDto);

        // Then
        assertThat(result).isNotNull();
        verify(treeRepository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should throw exception when moving to non-existent parent")
    void testUpdateNodeWithNonExistentParent() {
        // Given
        String nonExistentParentId = "non-existent-parent";
        entity.setParentId(null);
        updateDto.setParentId(nonExistentParentId);

        when(treeRepository.findById(nonExistentParentId)).thenReturn(Optional.empty());
        when(messageSource.getMessage(eq("error.entity.not.found"), any(), anyString(), any()))
            .thenReturn("Parent not found");

        // When/Then
        assertThatThrownBy(() -> treeService.updateNode(entity, updateDto))
            .isInstanceOf(SimpliXGeneralException.class)
            .hasMessageContaining("Parent not found");

        verify(treeRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should throw exception when moving node to its own descendant (circular reference)")
    void testUpdateNodeWithCircularReference() {
        // Given
        // entity (testId) is parent of childEntity (childId)
        // Trying to move entity under childEntity would create circular reference
        entity.setParentId(null);
        updateDto.setParentId(childId); // Try to set child as parent

        // Mock for new parent lookup
        when(treeRepository.findById(childId)).thenReturn(Optional.of(childEntity));
        // Mock for ancestor lookup: childEntity -> entity (testId) -> null
        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));
        // When/Then
        assertThatThrownBy(() -> treeService.updateNode(entity, updateDto))
            .isInstanceOf(SimpliXGeneralException.class)
            .hasMessageContaining("error.tree.circular.reference");

        verify(treeRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should update node successfully when moving to root (parentId null)")
    void testUpdateNodeMoveToRoot() {
        // Given
        childEntity.setParentId(testId); // Currently has parent
        ShelfUpdateDTO childUpdateDto = new ShelfUpdateDTO();
        childUpdateDto.setShelfId(childId);
        childUpdateDto.setParentId(null); // Move to root

        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(childId);

        when(treeRepository.findById(childId)).thenReturn(Optional.of(childEntity));
        when(treeRepository.saveAndFlush(any(Shelf.class))).thenReturn(childEntity);
        doAnswer(invocation -> null).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = treeService.updateNode(childEntity, childUpdateDto);

        // Then
        assertThat(result).isNotNull();
        verify(treeRepository, times(1)).saveAndFlush(any(Shelf.class));
    }

    @Test
    @DisplayName("Should handle empty string parentId as null (move to root)")
    void testUpdateNodeWithEmptyParentId() {
        // Given
        childEntity.setParentId(testId); // Currently has parent
        ShelfUpdateDTO childUpdateDto = new ShelfUpdateDTO();
        childUpdateDto.setShelfId(childId);
        childUpdateDto.setParentId(""); // Empty string should be treated as null

        ShelfDetailDTO detailDto = new ShelfDetailDTO();
        detailDto.setShelfId(childId);

        when(treeRepository.findById(childId)).thenReturn(Optional.of(childEntity));
        when(treeRepository.saveAndFlush(any(Shelf.class))).thenAnswer(invocation -> {
            Shelf savedEntity = invocation.getArgument(0);
            // Verify parentId is set to null (not empty string)
            assertThat(savedEntity.getParentId()).isNull();
            return savedEntity;
        });
        doAnswer(invocation -> null).when(modelMapper).map(any(), any(Shelf.class));
        when(modelMapper.map(any(Shelf.class), eq(ShelfDetailDTO.class)))
            .thenReturn(detailDto);

        // When
        ShelfDetailDTO result = treeService.updateNode(childEntity, childUpdateDto);

        // Then
        assertThat(result).isNotNull();
        verify(treeRepository, times(1)).saveAndFlush(any(Shelf.class));
    }

    //----------------------------------
    // Helper Method Tests
    //----------------------------------

    @Test
    @DisplayName("Should find entity by ID")
    void testFindById() {
        // Given
        when(treeRepository.findById(testId)).thenReturn(Optional.of(entity));

        // When
        Optional<Shelf> result = treeService.findById(testId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(entity);
    }

    @Test
    @DisplayName("Should return empty when entity not found")
    void testFindByIdNotFound() {
        // Given
        when(treeRepository.findById(testId)).thenReturn(Optional.empty());

        // When
        Optional<Shelf> result = treeService.findById(testId);

        // Then
        assertThat(result).isEmpty();
    }
}
