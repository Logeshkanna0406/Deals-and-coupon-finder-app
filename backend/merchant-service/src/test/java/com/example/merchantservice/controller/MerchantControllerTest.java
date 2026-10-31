package com.example.merchantservice.controller;

import com.example.merchantservice.dto.MerchantResponse;
import com.example.merchantservice.entity.MerchantStatus;
import com.example.merchantservice.service.MerchantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MerchantController.class)
@AutoConfigureMockMvc(addFilters = false)
class MerchantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MerchantService merchantService;

    @Test
    void shouldGetMerchantById() throws Exception {
        MerchantResponse response = new MerchantResponse(
                101L, "Pizza Planet", "John Doe", "pizza@planet.com", "9876543210",
                "Food & Dining", "123 Food Street", "Tasty pizzas", MerchantStatus.APPROVED, LocalDateTime.now()
        );
        when(merchantService.getMerchantById(101L)).thenReturn(response);

        mockMvc.perform(get("/api/merchants/101")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.businessName").value("Pizza Planet"))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
