package com.example.redemptionservice.controller;

import com.example.redemptionservice.dto.RedemptionResponse;
import com.example.redemptionservice.entity.RedemptionStatus;
import com.example.redemptionservice.service.RedemptionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RedemptionController.class)
@AutoConfigureMockMvc(addFilters = false)
class RedemptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RedemptionService redemptionService;

    @Test
    void shouldGetRedemptionById() throws Exception {
        RedemptionResponse response = new RedemptionResponse(
                10L, 1L, 101L, 2L, LocalDateTime.now(), new BigDecimal("1000.00"), new BigDecimal("50.00"), RedemptionStatus.REDEEMED
        );
        when(redemptionService.getRedemptionById(10L)).thenReturn(response);

        mockMvc.perform(get("/api/redemptions/10")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redemptionId").value(10))
                .andExpect(jsonPath("$.status").value("REDEEMED"));
    }

    @Test
    void shouldCheckRedemptionEligibility() throws Exception {
        when(redemptionService.hasCustomerRedeemed(2L, 1L)).thenReturn(true);

        mockMvc.perform(get("/api/redemptions/check")
                .param("customerId", "2")
                .param("couponId", "1")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void shouldGetMyRedemptionHistory() throws Exception {
        com.example.redemptionservice.dto.CustomerRedemptionHistoryItemDto item =
                new com.example.redemptionservice.dto.CustomerRedemptionHistoryItemDto(
                        10L, 1L, "50% Off Pizza", "PIZZA50", 101L, "Dominos Pizza",
                        LocalDateTime.now(), new BigDecimal("1000.00"), new BigDecimal("50.00"), 10, "REDEEMED"
                );
        com.example.redemptionservice.dto.CustomerRedemptionHistoryResponse historyResp =
                new com.example.redemptionservice.dto.CustomerRedemptionHistoryResponse(
                        List.of(item), 0, 10, 1, 1, true
                );

        when(redemptionService.getCustomerRedemptionHistory(org.mockito.ArgumentMatchers.eq(2L), any(), org.mockito.ArgumentMatchers.eq("2"), org.mockito.ArgumentMatchers.eq("CUSTOMER")))
                .thenReturn(historyResp);

        mockMvc.perform(get("/api/redemptions/my-history")
                .param("customerId", "2")
                .header("X-User-Id", "2")
                .header("X-User-Role", "CUSTOMER")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].redemptionId").value(10))
                .andExpect(jsonPath("$.content[0].couponTitle").value("50% Off Pizza"))
                .andExpect(jsonPath("$.content[0].merchantName").value("Dominos Pizza"))
                .andExpect(jsonPath("$.content[0].pointsEarned").value(10));
    }

    @Test
    void shouldGetRecentRedemptionHistory() throws Exception {
        com.example.redemptionservice.dto.CustomerRedemptionHistoryItemDto item =
                new com.example.redemptionservice.dto.CustomerRedemptionHistoryItemDto(
                        10L, 1L, "50% Off Pizza", "PIZZA50", 101L, "Dominos Pizza",
                        LocalDateTime.now(), new BigDecimal("1000.00"), new BigDecimal("50.00"), 10, "REDEEMED"
                );

        when(redemptionService.getRecentRedemptionHistory(org.mockito.ArgumentMatchers.eq(2L), org.mockito.ArgumentMatchers.eq(5), org.mockito.ArgumentMatchers.eq("2"), org.mockito.ArgumentMatchers.eq("CUSTOMER")))
                .thenReturn(List.of(item));

        mockMvc.perform(get("/api/redemptions/my-history/recent")
                .param("customerId", "2")
                .param("limit", "5")
                .header("X-User-Id", "2")
                .header("X-User-Role", "CUSTOMER")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].couponCode").value("PIZZA50"))
                .andExpect(jsonPath("$[0].pointsEarned").value(10));
    }
}
