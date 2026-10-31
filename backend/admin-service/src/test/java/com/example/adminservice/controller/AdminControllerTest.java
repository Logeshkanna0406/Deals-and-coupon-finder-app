package com.example.adminservice.controller;

import com.example.adminservice.dto.*;
import com.example.adminservice.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @Test
    void shouldGetAllMerchants() throws Exception {
        MerchantResponseDto merchant = new MerchantResponseDto();
        merchant.setMerchantId(101L);
        merchant.setBusinessName("Pizza Planet");
        merchant.setStatus("PENDING");

        when(adminService.getAllMerchants()).thenReturn(List.of(merchant));

        mockMvc.perform(get("/api/admin/merchants")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].merchantId").value(101))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void shouldSuspendMerchant() throws Exception {
        MerchantResponseDto merchant = new MerchantResponseDto();
        merchant.setMerchantId(101L);
        merchant.setBusinessName("Pizza Planet");
        merchant.setStatus("SUSPENDED");

        when(adminService.suspendMerchant(eq(101L), any())).thenReturn(merchant);

        mockMvc.perform(put("/api/admin/merchants/101/suspend")
                .header("X-User-Email", "admin@deals.com")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$['merchantId']").value(101))
                .andExpect(jsonPath("$['status']").value("SUSPENDED"));
    }

    @Test
    void shouldCreateSubscriptionPlan() throws Exception {
        com.example.adminservice.dto.SubscriptionPlanResponseDto plan =
                new com.example.adminservice.dto.SubscriptionPlanResponseDto(6L, "Ultra Plan", 6, new java.math.BigDecimal("2999.00"), 60, "ACTIVE");

        when(adminService.createSubscriptionPlan(any(), eq("admin@deals.com"))).thenReturn(plan);

        String json = "{\"name\":\"Ultra Plan\",\"durationInMonths\":6,\"price\":2999.00,\"couponLimit\":60,\"status\":\"ACTIVE\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/admin/subscription-plans")
                .header("X-User-Email", "admin@deals.com")
                .header("X-User-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planId").value(6))
                .andExpect(jsonPath("$.name").value("Ultra Plan"))
                .andExpect(jsonPath("$.couponLimit").value(60));
    }

    @Test
    void shouldRejectPlanCreationWhenNotAdminRole() throws Exception {
        String json = "{\"name\":\"Ultra Plan\",\"durationInMonths\":6,\"price\":2999.00,\"couponLimit\":60,\"status\":\"ACTIVE\"}";

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/admin/subscription-plans")
                .header("X-User-Email", "user@deals.com")
                .header("X-User-Role", "CUSTOMER")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldGetTotalRevenue() throws Exception {
        RevenueResponseDto rev = new RevenueResponseDto(new BigDecimal("12990.00"), 5);
        when(adminService.getRevenue(any(), any())).thenReturn(rev);

        mockMvc.perform(get("/api/admin/revenue")
                .header("X-User-Role", "ADMIN")
                .param("fromDate", "2026-09-01")
                .param("toDate", "2026-09-30")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").value(12990.00))
                .andExpect(jsonPath("$.totalVerifiedTransactions").value(5));
    }

    @Test
    void shouldGetMerchantWiseRevenue() throws Exception {
        MerchantRevenueItemDto m1 = new MerchantRevenueItemDto(2L, "Merchant A", new BigDecimal("5999.00"), 3L);
        MerchantRevenueItemDto m2 = new MerchantRevenueItemDto(3L, "Merchant B", new BigDecimal("6991.00"), 4L);
        PlatformMerchantRevenueResponseDto response = new PlatformMerchantRevenueResponseDto(
                new BigDecimal("12990.00"), "INR", List.of(m1, m2)
        );

        when(adminService.getMerchantRevenueSummary(any(), any())).thenReturn(response);

        mockMvc.perform(get("/api/admin/revenue/merchants")
                .header("X-User-Role", "ADMIN")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPlatformRevenue").value(12990.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.merchants[0].merchantId").value(2))
                .andExpect(jsonPath("$.merchants[0].merchantName").value("Merchant A"))
                .andExpect(jsonPath("$.merchants[0].totalRevenue").value(5999.00))
                .andExpect(jsonPath("$.merchants[0].successfulPayments").value(3))
                .andExpect(jsonPath("$.merchants[1].merchantId").value(3))
                .andExpect(jsonPath("$.merchants[1].merchantName").value("Merchant B"))
                .andExpect(jsonPath("$.merchants[1].totalRevenue").value(6991.00))
                .andExpect(jsonPath("$.merchants[1].successfulPayments").value(4));
    }

    @Test
    void shouldGetSpecificMerchantRevenue() throws Exception {
        SpecificMerchantRevenueResponseDto res = new SpecificMerchantRevenueResponseDto(
                2L, "Merchant A", new BigDecimal("5999.00"), 3L, "INR"
        );

        when(adminService.getSpecificMerchantRevenue(eq(2L), any(), any())).thenReturn(res);

        mockMvc.perform(get("/api/admin/revenue/merchants/2")
                .header("X-User-Role", "ADMIN")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.merchantId").value(2))
                .andExpect(jsonPath("$.merchantName").value("Merchant A"))
                .andExpect(jsonPath("$.totalRevenue").value(5999.00))
                .andExpect(jsonPath("$.successfulPayments").value(3))
                .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    void shouldRejectNonAdminAccessToRevenueEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/revenue/merchants")
                .header("X-User-Role", "MERCHANT")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/admin/revenue/merchants/2")
                .header("X-User-Role", "CUSTOMER")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}

