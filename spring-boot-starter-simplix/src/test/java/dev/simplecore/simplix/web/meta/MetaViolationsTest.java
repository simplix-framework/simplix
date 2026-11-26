package dev.simplecore.simplix.web.meta;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.simplecore.searchable.core.annotation.SearchableField;
import dev.simplecore.searchable.core.condition.SearchCondition;
import dev.simplecore.searchable.core.condition.operator.SearchOperator;
import dev.simplecore.simplix.core.annotation.References;
import dev.simplecore.simplix.core.exception.SimpliXGeneralException;
import dev.simplecore.simplix.core.model.SimpliXApiResponse;
import dev.simplecore.simplix.web.advice.SimpliXExceptionHandler;
import dev.simplecore.simplix.web.controller.SimpliXBaseController;
import dev.simplecore.simplix.web.controller.SimpliXDefaultSort;
import dev.simplecore.simplix.web.controller.SimpliXListFigures;
import jakarta.persistence.Id;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.pattern.PathPatternParser;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.InstanceOfAssertFactories.LIST;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** One request names every declaration SimpliX Meta refuses, and the endpoint answers with them. */
class MetaViolationsTest {

    static class Shelf {
        @Id String shelfId;
        String shelfCode;
    }

    static class Crate {
        @Id String crateId;
        String crateCode;
    }

    static class Pallet {
        @Id String palletId;
        String palletCode;
        @References(entity = "Depot") String depotId;
    }

    /** Both carry a reference to an entity nobody serves, so the types themselves are refused. */
    static class PalletDTOs {
        static class PalletSearchDTO {
            @SearchableField(operators = {SearchOperator.EQUALS}, sortable = true)
            public String palletCode;
            @SearchableField(entityField = "depotId", operators = {SearchOperator.EQUALS})
            public String depotId;
        }

        static class PalletListDTO {
            public String palletId;
            public String depotId;
        }
    }

    @SimpliXDefaultSort(field = "palletCode")
    static class PalletRestController extends SimpliXBaseController<Pallet, String> {
        PalletRestController() { super(null); }

        @PostMapping("/search")
        public SimpliXApiResponse<Page<PalletDTOs.PalletListDTO>> search(
                @RequestBody SearchCondition<PalletDTOs.PalletSearchDTO> condition) {
            return null;
        }
    }

    static class ShelfSearchDTO {
        @SearchableField(operators = {SearchOperator.EQUALS}, sortable = true)
        public String shelfCode;
        @SearchableField(operators = {SearchOperator.EQUALS})
        public String room;
    }

    static class CrateSearchDTO {
        @SearchableField(operators = {SearchOperator.EQUALS}, sortable = true)
        public String crateCode;
    }

    static class ShelfDTO {
        public String shelfId;
        public String shelfCode;
    }

    static class CrateDTO {
        public String crateId;
        public String crateCode;
    }

    @SimpliXDefaultSort(field = "shelfCode")
    static class ShelfRestController extends SimpliXBaseController<Shelf, String> {
        ShelfRestController() { super(null); }

        @PostMapping("/search")
        public SimpliXApiResponse<Page<ShelfDTO>> search(@RequestBody SearchCondition<ShelfSearchDTO> condition) {
            return null;
        }
    }

    @SimpliXDefaultSort(field = "crateCode")
    static class CrateRestController extends SimpliXBaseController<Crate, String> {
        CrateRestController() { super(null); }

        @PostMapping("/search")
        public SimpliXApiResponse<Page<CrateDTO>> search(@RequestBody SearchCondition<CrateSearchDTO> condition) {
            return null;
        }
    }

    /** Orders by a field its search DTO declares but cannot sort by. */
    @SimpliXDefaultSort(field = "room")
    static class ShelfByRoom extends ShelfRestController {}

    /** Orders by a field its search DTO does not declare, and counts by one nobody declares. */
    @SimpliXDefaultSort(field = "weight")
    @SimpliXListFigures(statusCounts = "ghost")
    static class CrateByWeight extends CrateRestController {}

    private static Map<RequestMappingInfo, HandlerMethod> handlers(ShelfRestController shelves,
                                                                   CrateRestController crates) throws Exception {
        RequestMappingInfo.BuilderConfiguration config = new RequestMappingInfo.BuilderConfiguration();
        config.setPatternParser(new PathPatternParser());
        Map<RequestMappingInfo, HandlerMethod> map = new LinkedHashMap<>();
        map.put(RequestMappingInfo.paths("/shelves/search").methods(RequestMethod.POST).options(config).build(),
                new HandlerMethod(shelves, ShelfRestController.class.getMethod("search", SearchCondition.class)));
        map.put(RequestMappingInfo.paths("/crates/search").methods(RequestMethod.POST).options(config).build(),
                new HandlerMethod(crates, CrateRestController.class.getMethod("search", SearchCondition.class)));
        return map;
    }

    private static DtoMetaBuilder builder() {
        return new DtoMetaBuilder(new ObjectMapper(), List.of(), key -> Map.of());
    }

    @Test
    void aDocumentWithoutViolationsIsBuilt() throws Exception {
        assertThat(builder().build(handlers(new ShelfRestController(), new CrateRestController())).operations())
                .hasSize(2);
    }

    @Test
    void theViolationsOfSeparateControllersAreReportedTogether() throws Exception {
        Map<RequestMappingInfo, HandlerMethod> handlers = handlers(new ShelfByRoom(), new CrateByWeight());

        SimpliXMetaViolationException refused = catchThrowableOfType(
                () -> builder().build(handlers), SimpliXMetaViolationException.class);

        assertThat(refused.violations()).containsExactlyInAnyOrder(
                "Default sort of Shelf names 'room', which its search DTO does not declare sortable",
                "Default sort of Crate names 'weight', which its search DTO does not declare sortable",
                "List figures of Crate name 'ghost', which is neither a field of the entity nor of its search DTO");
        assertThat(refused.getMessage()).startsWith("SimpliX Meta refuses 3 declarations:")
                .contains("\n- Default sort of Shelf").contains("\n- List figures of Crate");
    }

    @Test
    void aRefusedTypeIsNotReportedAgainByTheChecksThatReadIt() throws Exception {
        Map<RequestMappingInfo, HandlerMethod> handlers = handlers(new ShelfByRoom(), new CrateRestController());
        RequestMappingInfo.BuilderConfiguration config = new RequestMappingInfo.BuilderConfiguration();
        config.setPatternParser(new PathPatternParser());
        handlers.put(RequestMappingInfo.paths("/pallets/search").methods(RequestMethod.POST).options(config).build(),
                new HandlerMethod(new PalletRestController(),
                        PalletRestController.class.getMethod("search", SearchCondition.class)));

        SimpliXMetaViolationException refused = catchThrowableOfType(
                () -> builder().build(handlers), SimpliXMetaViolationException.class);

        // The sort of Pallet is correct; its search DTO is what was refused. The sort of Shelf is
        // checked once the types are complete.
        assertThat(refused.violations()).isNotEmpty().allSatisfy(violation -> assertThat(violation)
                .contains("@References(entity = \"Depot\")").contains("serves no entity"));
    }

    @Test
    void aSingleViolationKeepsItsOwnMessage() throws Exception {
        Map<RequestMappingInfo, HandlerMethod> handlers = handlers(new ShelfByRoom(), new CrateRestController());

        assertThatThrownBy(() -> builder().build(handlers))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Default sort of Shelf names 'room', which its search DTO does not declare sortable");
    }

    @RestControllerAdvice
    static class Advice extends SimpliXExceptionHandler<SimpliXApiResponse<Object>> {
        Advice() {
            super(new StaticMessageSource(), new ObjectMapper());
        }
    }

    @Test
    void theAnswerListsTheViolationsUnderErrorDetail() throws Exception {
        RequestMappingHandlerMapping mapping = mock(RequestMappingHandlerMapping.class);
        when(mapping.getHandlerMethods()).thenReturn(handlers(new ShelfByRoom(), new CrateByWeight()));
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new SimpliXMetaDevController(
                        mapping, new ObjectMapper(), List.of(), new StaticMessageSource()))
                .setControllerAdvice(new Advice())
                .build();

        mockMvc.perform(get("/dev/meta/dto"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("GEN_CONFLICT"))
                .andExpect(jsonPath("$.message", containsString("Default sort of Shelf")))
                .andExpect(jsonPath("$.errorDetail.length()").value(3));
    }

    @Test
    void theEndpointAnswersWithEveryViolation() throws Exception {
        RequestMappingHandlerMapping mapping = mock(RequestMappingHandlerMapping.class);
        when(mapping.getHandlerMethods()).thenReturn(handlers(new ShelfByRoom(), new CrateByWeight()));
        SimpliXMetaDevController controller = new SimpliXMetaDevController(
                mapping, new ObjectMapper(), List.of(), new StaticMessageSource());

        SimpliXGeneralException answered = catchThrowableOfType(controller::dto, SimpliXGeneralException.class);

        assertThat(answered.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(answered.getMessage()).contains("Default sort of Shelf").contains("Default sort of Crate");
        assertThat(answered.getDetail()).asInstanceOf(LIST).hasSize(3);
    }
}
