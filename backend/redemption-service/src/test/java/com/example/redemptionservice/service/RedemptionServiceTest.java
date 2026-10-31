package com.example.redemptionservice.service;

import com.example.redemptionservice.client.CouponClient;
import com.example.redemptionservice.client.MerchantClient;
import com.example.redemptionservice.dto.*;
import com.example.redemptionservice.entity.Redemption;
import com.example.redemptionservice.entity.RedemptionStatus;
import com.example.redemptionservice.exception.BadRequestException;
import com.example.redemptionservice.exception.BusinessException;
import com.example.redemptionservice.repository.RedemptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedemptionServiceTest {

    @Mock
    private RedemptionRepository redemptionRepository;

    @Mock
    private CouponClient couponClient;

    @Mock
    private MerchantClient merchantClient;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private RedemptionService redemptionService;

    private CouponValidationDto sampleCoupon;

    @BeforeEach
    void setUp() {
        sampleCoupon = new CouponValidationDto();
        sampleCoupon.setCouponId(1L);
        sampleCoupon.setMerchantId(101L);
        sampleCoupon.setTitle("50% Off Pizza");
        sampleCoupon.setCouponCode("PIZZA50");
        sampleCoupon.setDiscount(new BigDecimal("50.00"));
        sampleCoupon.setCashbackPercentage(new BigDecimal("5.00"));
        sampleCoupon.setMinimumPurchase(new BigDecimal("500.00"));
        sampleCoupon.setValidFrom(LocalDateTime.now().minusDays(1));
        sampleCoupon.setValidUntil(LocalDateTime.now().plusMonths(1));
        sampleCoupon.setUsageLimit(100);
        sampleCoupon.setUsageCount(10);
        sampleCoupon.setStatus("ACTIVE");
    }

    @Test
    void shouldRedeemCouponSuccessfully() {
        CreateRedemptionRequest req = new CreateRedemptionRequest(1L, 2L, new BigDecimal("1000.00"));
        when(couponClient.getCouponById(1L)).thenReturn(sampleCoupon);

        Redemption saved = new Redemption();
        saved.setRedemptionId(10L);
        saved.setCouponId(1L);
        saved.setMerchantId(101L);
        saved.setCustomerId(2L);
        saved.setPurchaseAmount(new BigDecimal("1000.00"));
        saved.setDiscountAmount(new BigDecimal("50.00"));
        saved.setStatus(RedemptionStatus.REDEEMED);
        saved.setRedeemedAt(LocalDateTime.now());

        when(redemptionRepository.save(any(Redemption.class))).thenReturn(saved);

        RedemptionResponse response = redemptionService.redeemCoupon(req);

        assertNotNull(response);
        assertEquals(RedemptionStatus.REDEEMED, response.getStatus());
        assertEquals(new BigDecimal("1000.00"), response.getPurchaseAmount());
        assertEquals(10, response.getPointsEarned());
        verify(couponClient, times(1)).incrementUsage(1L);
        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(CouponRedeemedEvent.class));
    }

    @Test
    void shouldFailWhenCustomerHasAlreadyUsedCoupon() {
        CreateRedemptionRequest req = new CreateRedemptionRequest(1L, 2L, new BigDecimal("1000.00"));
        when(redemptionRepository.existsByCustomerIdAndCouponId(2L, 1L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> redemptionService.redeemCoupon(req));
        assertEquals("Customer has already used this coupon.", ex.getMessage());
        verify(couponClient, never()).incrementUsage(anyLong());
        verify(redemptionRepository, never()).save(any(Redemption.class));
    }

    @Test
    void shouldFailWhenPurchaseAmountBelowMinimum() {
        CreateRedemptionRequest req = new CreateRedemptionRequest(1L, 2L, new BigDecimal("200.00"));
        when(couponClient.getCouponById(1L)).thenReturn(sampleCoupon);

        assertThrows(BusinessException.class, () -> redemptionService.redeemCoupon(req));
        verify(redemptionRepository, never()).save(any(Redemption.class));
    }

    @Test
    void shouldFailWhenUsageLimitReached() {
        sampleCoupon.setUsageCount(100);
        sampleCoupon.setUsageLimit(100);
        CreateRedemptionRequest req = new CreateRedemptionRequest(1L, 2L, new BigDecimal("1000.00"));
        when(couponClient.getCouponById(1L)).thenReturn(sampleCoupon);

        assertThrows(BusinessException.class, () -> redemptionService.redeemCoupon(req));
    }

    @Test
    void shouldFailWhenCouponIsHiddenDueToLowReliability() {
        sampleCoupon.setStatus("HIDDEN");
        CreateRedemptionRequest req = new CreateRedemptionRequest(1L, 2L, new BigDecimal("1000.00"));
        when(couponClient.getCouponById(1L)).thenReturn(sampleCoupon);

        BusinessException ex = assertThrows(BusinessException.class, () -> redemptionService.redeemCoupon(req));
        assertEquals("Coupon is currently HIDDEN due to low reliability score and cannot be redeemed.", ex.getMessage());
        verify(redemptionRepository, never()).save(any(Redemption.class));
    }

    @Test
    void shouldCheckIfCustomerHasRedeemed() {
        when(redemptionRepository.existsByCustomerIdAndCouponId(2L, 1L)).thenReturn(true);
        when(redemptionRepository.existsByCustomerIdAndCouponId(3L, 1L)).thenReturn(false);

        assertTrue(redemptionService.hasCustomerRedeemed(2L, 1L));
        assertFalse(redemptionService.hasCustomerRedeemed(3L, 1L));
    }

    @Test
    void shouldGetCustomerRedemptionHistorySuccessfully() {
        Redemption r = new Redemption();
        r.setRedemptionId(10L);
        r.setCouponId(1L);
        r.setMerchantId(101L);
        r.setCustomerId(2L);
        r.setPurchaseAmount(new BigDecimal("1000.00"));
        r.setDiscountAmount(new BigDecimal("50.00"));
        r.setStatus(RedemptionStatus.REDEEMED);
        r.setRedeemedAt(LocalDateTime.now());

        Pageable pageable = PageRequest.of(0, 10);
        when(redemptionRepository.findByCustomerIdOrderByRedeemedAtDesc(2L, pageable))
                .thenReturn(new PageImpl<>(List.of(r), pageable, 1));
        when(couponClient.getCouponById(1L)).thenReturn(sampleCoupon);
        when(merchantClient.getMerchantById(101L)).thenReturn(new MerchantResponseDto(101L, "Dominos Pizza"));

        CustomerRedemptionHistoryResponse response = redemptionService.getCustomerRedemptionHistory(2L, pageable, "2", "CUSTOMER");

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        CustomerRedemptionHistoryItemDto item = response.getContent().get(0);
        assertEquals("50% Off Pizza", item.getCouponTitle());
        assertEquals("PIZZA50", item.getCouponCode());
        assertEquals("Dominos Pizza", item.getMerchantName());
        assertEquals(10, item.getPointsEarned());
    }

    @Test
    void shouldDenyCustomerRedemptionHistoryForDifferentCustomer() {
        Pageable pageable = PageRequest.of(0, 10);
        assertThrows(BadRequestException.class, () ->
                redemptionService.getCustomerRedemptionHistory(2L, pageable, "3", "CUSTOMER"));
    }

    @Test
    void shouldGetRecentRedemptionHistory() {
        Redemption r = new Redemption();
        r.setRedemptionId(10L);
        r.setCouponId(1L);
        r.setMerchantId(101L);
        r.setCustomerId(2L);
        r.setPurchaseAmount(new BigDecimal("1000.00"));
        r.setDiscountAmount(new BigDecimal("50.00"));
        r.setStatus(RedemptionStatus.REDEEMED);
        r.setRedeemedAt(LocalDateTime.now());

        when(redemptionRepository.findTop10ByCustomerIdOrderByRedeemedAtDesc(2L)).thenReturn(List.of(r));
        when(couponClient.getCouponById(1L)).thenReturn(sampleCoupon);
        when(merchantClient.getMerchantById(101L)).thenReturn(new MerchantResponseDto(101L, "Dominos Pizza"));

        List<CustomerRedemptionHistoryItemDto> recent = redemptionService.getRecentRedemptionHistory(2L, 5, "2", "CUSTOMER");
        assertNotNull(recent);
        assertEquals(1, recent.size());
        assertEquals("Dominos Pizza", recent.get(0).getMerchantName());
    }
}

