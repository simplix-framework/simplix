package dev.simplecore.simplix.web.advice;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.simplecore.simplix.core.model.SimpliXApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("SimpliXExceptionHandler - a collection body whose elements fail validation")
class SimpliXExceptionHandlerMethodValidationTest {

    static class Item {

        @NotBlank
        private String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    @RestController
    static class ItemController {

        @PatchMapping("/items/set")
        String updateSet(@RequestBody Set<@Valid Item> items) {
            return "ok";
        }

        @PatchMapping("/items/list")
        String updateList(@RequestBody List<@Valid Item> items) {
            return "ok";
        }
    }

    @RestControllerAdvice
    static class Advice extends SimpliXExceptionHandler<SimpliXApiResponse<Object>> {

        Advice(MessageSource messageSource) {
            super(messageSource, new ObjectMapper());
        }
    }

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ItemController())
                .setControllerAdvice(new Advice(new StaticMessageSource()))
                .build();
    }

    @Test
    @DisplayName("Should answer 400 with the validation code and the failing field of a set element")
    void setElementFailsValidation() throws Exception {
        mockMvc.perform(patch("/items/set").contentType(MediaType.APPLICATION_JSON).content("[{\"name\":\"\"}]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("ERROR"))
                .andExpect(jsonPath("$.errorCode").value("VAL_VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errorDetail[0].field").value("name"))
                .andExpect(jsonPath("$.errorDetail[0].code").value("NotBlank"));
    }

    @Test
    @DisplayName("Should name the position of the failing element of a list")
    void listElementFailsValidation() throws Exception {
        mockMvc.perform(patch("/items/list").contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"name\":\"first\"},{\"name\":\"\"}]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VAL_VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errorDetail.length()").value(1))
                .andExpect(jsonPath("$.errorDetail[0].field").value("[1].name"));
    }

    @Test
    @DisplayName("Should let a collection through when every element is valid")
    void validElementsPass() throws Exception {
        mockMvc.perform(patch("/items/list").contentType(MediaType.APPLICATION_JSON).content("[{\"name\":\"first\"}]"))
                .andExpect(status().isOk());
    }
}
