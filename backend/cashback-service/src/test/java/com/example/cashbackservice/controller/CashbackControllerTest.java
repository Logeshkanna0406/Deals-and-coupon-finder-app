package com.example.cashbackservice.controller;

import com.example.cashbackservice.dto.WalletResponse;
import com.example.cashbackservice.service.CashbackService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CashbackController.class)
@AutoConfigureMockMvc(addFilters = false)
class CashbackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CashbackService cashbackService;

    @Test
    void shouldGetCustomerWallet() throws Exception {
        WalletResponse response = new WalletResponse(1L, 2L, new BigDecimal("150.00"));
        when(cashbackService.getWalletByCustomerId(eq(2L), any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/cashback/wallet/2")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value(2))
                .andExpect(jsonPath("$.balance").value(150.00));
    }
}
