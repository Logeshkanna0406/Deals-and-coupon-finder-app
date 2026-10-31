package com.example.adminservice.service;

import com.example.adminservice.client.CouponAdminClient;
import com.example.adminservice.client.MerchantAdminClient;
import com.example.adminservice.client.PaymentAdminClient;
import com.example.adminservice.client.SubscriptionAdminClient;
import com.example.adminservice.dto.*;
import com.example.adminservice.entity.AdminAuditLog;
import com.example.adminservice.exception.BadRequestException;
import com.example.adminservice.exception.ResourceNotFoundException;
import com.example.adminservice.repository.AdminAuditLogRepository;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private MerchantAdminClient merchantAdminClient;

    @Mock
    private SubscriptionAdminClient subscriptionAdminClient;

    @Mock
    private CouponAdminClient couponAdminClient;

    @Mock
    private PaymentAdminClient paymentAdminClient;

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    @InjectMocks
    private AdminService adminService;

    @Test
    void shouldApproveMerchantAndAuditLog() {
        MerchantResponseDto merchant = new MerchantResponseDto();
        merchant.setMerchantId(101L);
        merchant.setBusinessName("Pizza Planet");
        merchant.setStatus("APPROVED");

        when(merchantAdminClient.updateMerchantStatus(101L, "APPROVED")).thenReturn(merchant);

        MerchantResponseDto response = adminService.approveMerchant(101L, "admin@test.com");

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldVerifyPaymentAndAuditLog() {
        PaymentResponseDto payment = new PaymentResponseDto();
        payment.setPaymentId(501L);
        payment.setStatus("VERIFIED");

        when(paymentAdminClient.verifyPayment(501L)).thenReturn(payment);

        PaymentResponseDto response = adminService.verifyPayment(501L, "admin@test.com");

        assertNotNull(response);
        assertEquals("VERIFIED", response.getStatus());
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldSuspendMerchantAndAuditLog() {
        MerchantResponseDto merchant = new MerchantResponseDto();
        merchant.setMerchantId(101L);
        merchant.setBusinessName("Pizza Planet");
        merchant.setStatus("SUSPENDED");

        when(merchantAdminClient.updateMerchantStatus(101L, "SUSPENDED")).thenReturn(merchant);

        MerchantResponseDto response = adminService.suspendMerchant(101L, "admin@test.com");

        assertNotNull(response);
        assertEquals("SUSPENDED", response.getStatus());
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldCreateSubscriptionPlanAndAuditLog() {
        com.example.adminservice.dto.CreateSubscriptionPlanRequestDto request =
                new com.example.adminservice.dto.CreateSubscriptionPlanRequestDto("Enterprise", 12, new java.math.BigDecimal("4999.00"), 150, "ACTIVE");

        com.example.adminservice.dto.SubscriptionPlanResponseDto createdPlan =
                new com.example.adminservice.dto.SubscriptionPlanResponseDto(5L, "Enterprise", 12, new java.math.BigDecimal("4999.00"), 150, "ACTIVE");

        when(subscriptionAdminClient.createSubscriptionPlan(request)).thenReturn(createdPlan);

        com.example.adminservice.dto.SubscriptionPlanResponseDto response =
                adminService.createSubscriptionPlan(request, "admin@test.com");

        assertNotNull(response);
        assertEquals(5L, response.getPlanId());
        assertEquals("Enterprise", response.getName());
        verify(subscriptionAdminClient, times(1)).createSubscriptionPlan(request);
        verify(auditLogRepository, times(1)).save(any(AdminAuditLog.class));
    }

    @Test
    void shouldGetTotalRevenueWithAndWithoutDateFilter() {
        RevenueResponseDto rev = new RevenueResponseDto(new BigDecimal("12990.00"), 5);
        when(paymentAdminClient.getRevenueSummary(null, null)).thenReturn(rev);

        RevenueResponseDto res = adminService.getRevenue();
        assertNotNull(res);
        assertEquals(new BigDecimal("12990.00"), res.getTotalRevenue());

        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        when(paymentAdminClient.getRevenueSummary(from, to)).thenReturn(new RevenueResponseDto(new BigDecimal("5999.00"), 3));

        RevenueResponseDto filteredRes = adminService.getRevenue(from, to);
        assertNotNull(filteredRes);
        assertEquals(new BigDecimal("5999.00"), filteredRes.getTotalRevenue());
    }

    @Test
    void shouldGetMerchantRevenueSummaryAndHandleZeroRevenueMerchants() {
        MerchantResponseDto m1 = new MerchantResponseDto();
        m1.setMerchantId(2L);
        m1.setBusinessName("Merchant A");

        MerchantResponseDto m2 = new MerchantResponseDto();
        m2.setMerchantId(3L);
        m2.setBusinessName("Merchant B");

        MerchantResponseDto m3 = new MerchantResponseDto();
        m3.setMerchantId(4L);
        m3.setBusinessName("Merchant C (Zero Sales)");

        when(merchantAdminClient.getAllMerchants()).thenReturn(List.of(m1, m2, m3));

        MerchantRevenueResponseDto r1 = new MerchantRevenueResponseDto(2L, new BigDecimal("5999.00"), 3L);
        MerchantRevenueResponseDto r2 = new MerchantRevenueResponseDto(3L, new BigDecimal("6991.00"), 4L);

        when(paymentAdminClient.getMerchantRevenueSummary(null, null)).thenReturn(List.of(r1, r2));

        PlatformMerchantRevenueResponseDto result = adminService.getMerchantRevenueSummary(null, null);

        assertNotNull(result);
        assertEquals("INR", result.getCurrency());
        assertEquals(new BigDecimal("12990.00"), result.getTotalPlatformRevenue());
        assertEquals(3, result.getMerchants().size());

        MerchantRevenueItemDto item1 = result.getMerchants().stream().filter(m -> m.getMerchantId().equals(2L)).findFirst().orElseThrow();
        assertEquals("Merchant A", item1.getMerchantName());
        assertEquals(new BigDecimal("5999.00"), item1.getTotalRevenue());
        assertEquals(3L, item1.getSuccessfulPayments());

        MerchantRevenueItemDto item3 = result.getMerchants().stream().filter(m -> m.getMerchantId().equals(4L)).findFirst().orElseThrow();
        assertEquals("Merchant C (Zero Sales)", item3.getMerchantName());
        assertEquals(new BigDecimal("0.00"), item3.getTotalRevenue());
        assertEquals(0L, item3.getSuccessfulPayments());
    }

    @Test
    void shouldGetSpecificMerchantRevenue() {
        MerchantResponseDto m1 = new MerchantResponseDto();
        m1.setMerchantId(2L);
        m1.setBusinessName("Merchant A");

        when(merchantAdminClient.getMerchantById(2L)).thenReturn(m1);
        when(paymentAdminClient.getRevenueForMerchant(2L, null, null))
                .thenReturn(new MerchantRevenueResponseDto(2L, new BigDecimal("5999.00"), 3L));

        SpecificMerchantRevenueResponseDto res = adminService.getSpecificMerchantRevenue(2L, null, null);

        assertNotNull(res);
        assertEquals(2L, res.getMerchantId());
        assertEquals("Merchant A", res.getMerchantName());
        assertEquals(new BigDecimal("5999.00"), res.getTotalRevenue());
        assertEquals(3L, res.getSuccessfulPayments());
        assertEquals("INR", res.getCurrency());
    }

    @Test
    void shouldThrowNotFoundWhenSpecificMerchantDoesNotExist() {
        Request request = Request.create(Request.HttpMethod.GET, "/api/merchants/999", Collections.emptyMap(), null, new RequestTemplate());
        when(merchantAdminClient.getMerchantById(999L)).thenThrow(new FeignException.NotFound("Not Found", request, null, null));

        assertThrows(ResourceNotFoundException.class, () -> adminService.getSpecificMerchantRevenue(999L, null, null));
    }

    @Test
    void shouldRejectInvalidDateRange() {
        LocalDate from = LocalDate.of(2026, 9, 30);
        LocalDate to = LocalDate.of(2026, 9, 1);

        assertThrows(BadRequestException.class, () -> adminService.getRevenue(from, to));
        assertThrows(BadRequestException.class, () -> adminService.getMerchantRevenueSummary(from, to));
        assertThrows(BadRequestException.class, () -> adminService.getSpecificMerchantRevenue(2L, from, to));
    }
}

