package com.example.paymentservice.controller;

import com.example.paymentservice.dto.MerchantRevenueResponse;
import com.example.paymentservice.dto.PaymentResponse;
import com.example.paymentservice.dto.RevenueResponse;
import com.example.paymentservice.entity.PaymentStatus;
import com.example.paymentservice.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    @Test
    void shouldGetPaymentById() throws Exception {
        PaymentResponse response = new PaymentResponse(
                501L, 101L, 10L, new BigDecimal("1299.00"), LocalDateTime.now(), "UPI", "TXN-12345678", PaymentStatus.VERIFIED, "ADMIN", LocalDateTime.now()
        );
        when(paymentService.getPaymentById(501L)).thenReturn(response);

        mockMvc.perform(get("/api/payments/501")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").value(501))
                .andExpect(jsonPath("$.status").value("VERIFIED"));
    }

    @Test
    void shouldGetRevenueSummary() throws Exception {
        RevenueResponse res = new RevenueResponse(new BigDecimal("12990.00"), 5);
        when(paymentService.getRevenueSummary(any(), any())).thenReturn(res);

        mockMvc.perform(get("/api/payments/revenue")
                .param("fromDate", "2026-09-01")
                .param("toDate", "2026-09-30")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").value(12990.00))
                .andExpect(jsonPath("$.totalVerifiedTransactions").value(5));
    }

    @Test
    void shouldGetMerchantRevenueSummary() throws Exception {
        MerchantRevenueResponse r1 = new MerchantRevenueResponse(101L, new BigDecimal("5999.00"), 3L);
        when(paymentService.getMerchantRevenueSummary(any(), any())).thenReturn(List.of(r1));

        mockMvc.perform(get("/api/payments/revenue/merchants")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].merchantId").value(101))
                .andExpect(jsonPath("$[0].totalRevenue").value(5999.00))
                .andExpect(jsonPath("$[0].successfulPayments").value(3));
    }

    @Test
    void shouldGetRevenueForSpecificMerchant() throws Exception {
        MerchantRevenueResponse r = new MerchantRevenueResponse(101L, new BigDecimal("5999.00"), 3L);
        when(paymentService.getRevenueForMerchant(eq(101L), any(), any())).thenReturn(r);

        mockMvc.perform(get("/api/payments/revenue/merchants/101")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.merchantId").value(101))
                .andExpect(jsonPath("$.totalRevenue").value(5999.00))
                .andExpect(jsonPath("$.successfulPayments").value(3));
    }
}

