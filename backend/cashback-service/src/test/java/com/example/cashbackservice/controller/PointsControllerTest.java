package com.example.cashbackservice.controller;

import com.example.cashbackservice.dto.PointAccountResponse;
import com.example.cashbackservice.dto.RedeemPointsRequest;
import com.example.cashbackservice.dto.RedeemPointsResponse;
import com.example.cashbackservice.service.CashbackService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PointsController.class)
@AutoConfigureMockMvc(addFilters = false)
class PointsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CashbackService cashbackService;

    @Test
    void shouldGetPointAccount() throws Exception {
        when(cashbackService.getPointAccount(eq(3L), any(), any()))
                .thenReturn(new PointAccountResponse(3L, 90));

        mockMvc.perform(get("/api/points/customer/3")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value(3))
                .andExpect(jsonPath("$.points").value(90));
    }

    @Test
    void shouldRedeemPoints() throws Exception {
        RedeemPointsRequest request = new RedeemPointsRequest(3L, 100);
        RedeemPointsResponse response = new RedeemPointsResponse(
                3L, 100, 0, new BigDecimal("10.00"), new BigDecimal("10.00")
        );

        when(cashbackService.redeemPoints(any(RedeemPointsRequest.class), any(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/points/redeem")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value(3))
                .andExpect(jsonPath("$.pointsDeducted").value(100))
                .andExpect(jsonPath("$.remainingPoints").value(0))
                .andExpect(jsonPath("$.walletCredited").value(10.00))
                .andExpect(jsonPath("$.newWalletBalance").value(10.00));
    }

    @Test
    void shouldGetCustomerTier() throws Exception {
        com.example.cashbackservice.dto.CustomerTierResponse tierResp =
                new com.example.cashbackservice.dto.CustomerTierResponse(
                        3L, 250, com.example.cashbackservice.entity.CustomerTier.SILVER,
                        com.example.cashbackservice.entity.CustomerTier.GOLD, 250
                );

        when(cashbackService.getCustomerTier(eq(3L), any(), any())).thenReturn(tierResp);

        mockMvc.perform(get("/api/points/customer/3/tier")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value(3))
                .andExpect(jsonPath("$.totalPoints").value(250))
                .andExpect(jsonPath("$.tier").value("SILVER"))
                .andExpect(jsonPath("$.nextTier").value("GOLD"))
                .andExpect(jsonPath("$.pointsRequiredForNextTier").value(250));
    }

    @Test
    void shouldGetMyTier() throws Exception {
        com.example.cashbackservice.dto.CustomerTierResponse tierResp =
                new com.example.cashbackservice.dto.CustomerTierResponse(
                        3L, 50, com.example.cashbackservice.entity.CustomerTier.NO_TIER,
                        com.example.cashbackservice.entity.CustomerTier.BRONZE, 50
                );

        when(cashbackService.getCustomerTier(eq(3L), eq("3"), eq("CUSTOMER"))).thenReturn(tierResp);

        mockMvc.perform(get("/api/points/my-tier")
                .header("X-User-Id", "3")
                .header("X-User-Role", "CUSTOMER")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value(3))
                .andExpect(jsonPath("$.tier").value("NO_TIER"))
                .andExpect(jsonPath("$.nextTier").value("BRONZE"))
                .andExpect(jsonPath("$.pointsRequiredForNextTier").value(50));
    }
}
