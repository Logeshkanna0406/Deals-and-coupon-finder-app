package com.example.couponservice.service;

import com.example.couponservice.client.MerchantClient;
import com.example.couponservice.client.RedemptionClient;
import com.example.couponservice.client.SubscriptionClient;
import com.example.couponservice.dto.*;
import com.example.couponservice.entity.Coupon;
import com.example.couponservice.entity.CouponStatus;
import com.example.couponservice.entity.CouponVote;
import com.example.couponservice.entity.VoteType;
import com.example.couponservice.exception.BadRequestException;
import com.example.couponservice.exception.BusinessException;
import com.example.couponservice.exception.ResourceNotFoundException;
import com.example.couponservice.repository.CouponRepository;
import com.example.couponservice.repository.CouponVoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private CouponVoteRepository couponVoteRepository;

    @Mock
    private MerchantClient merchantClient;

    @Mock
    private SubscriptionClient subscriptionClient;

    @Mock
    private RedemptionClient redemptionClient;

    @Mock
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @InjectMocks
    private CouponService couponService;

    private CreateCouponRequest validRequest;
    private SubscriptionResponseDto activeSubscription;

    @BeforeEach
    void setUp() {
        validRequest = new CreateCouponRequest();
        validRequest.setMerchantId(101L);
        validRequest.setTitle("50% Off Pizza");
        validRequest.setDescription("Flat 50% discount on all medium pizzas");
        validRequest.setCategory("Food & Dining");
        validRequest.setDiscount(new BigDecimal("50.00"));
        validRequest.setCashbackPercentage(new BigDecimal("5.00"));
        validRequest.setCouponCode("PIZZA50");
        validRequest.setMinimumPurchase(new BigDecimal("500.00"));
        validRequest.setValidFrom(LocalDateTime.now().plusDays(1));
        validRequest.setValidUntil(LocalDateTime.now().plusDays(30));
        validRequest.setUsageLimit(100);

        activeSubscription = new SubscriptionResponseDto(
                10L, 101L, "Standard", LocalDate.now().minusDays(5), LocalDate.now().plusMonths(3), "ACTIVE", 25
        );
    }

    @Test
    void shouldCreateCouponWhenMerchantIsApprovedAndSubscriptionIsActive() {
        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(activeSubscription);
        when(couponRepository.findByCouponCode("PIZZA50")).thenReturn(Optional.empty());

        Coupon savedCoupon = new Coupon();
        savedCoupon.setCouponId(1L);
        savedCoupon.setMerchantId(101L);
        savedCoupon.setSubscriptionId(10L);
        savedCoupon.setTitle("50% Off Pizza");
        savedCoupon.setCouponCode("PIZZA50");
        savedCoupon.setStatus(CouponStatus.PENDING_APPROVAL);
        savedCoupon.setUsageLimit(100);
        savedCoupon.setUsageCount(0);
        when(couponRepository.save(any(Coupon.class))).thenReturn(savedCoupon);

        CouponResponse response = couponService.createCoupon(validRequest);

        assertNotNull(response);
        assertEquals(CouponStatus.PENDING_APPROVAL, response.getStatus());
        assertEquals("PIZZA50", response.getCouponCode());
        assertEquals(10L, response.getSubscriptionId());
        verify(subscriptionClient).incrementCouponCount(10L);
    }

    @Test
    void shouldCreateCouponWithValidityHours() {
        validRequest.setValidFrom(null);
        validRequest.setValidUntil(null);
        validRequest.setValidityHours(24);

        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(activeSubscription);
        when(couponRepository.findByCouponCode("PIZZA50")).thenReturn(Optional.empty());

        Coupon savedCoupon = new Coupon();
        savedCoupon.setCouponId(2L);
        savedCoupon.setMerchantId(101L);
        savedCoupon.setSubscriptionId(10L);
        savedCoupon.setTitle("50% Off Pizza");
        savedCoupon.setCouponCode("PIZZA50");
        savedCoupon.setStatus(CouponStatus.PENDING_APPROVAL);
        savedCoupon.setUsageLimit(100);
        savedCoupon.setUsageCount(0);
        when(couponRepository.save(any(Coupon.class))).thenReturn(savedCoupon);

        CouponResponse response = couponService.createCoupon(validRequest);

        assertNotNull(response);
        verify(couponRepository).save(argThat(c ->
                c.getValidFrom() != null && c.getValidUntil() != null &&
                c.getValidUntil().isAfter(c.getValidFrom())
        ));
        verify(subscriptionClient).incrementCouponCount(10L);
    }

    @Test
    void shouldRejectWhenSubscriptionCouponLimitReached() {
        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        activeSubscription.setCouponLimit(10);
        activeSubscription.setCouponsGenerated(10);
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(activeSubscription);

        BusinessException ex = assertThrows(BusinessException.class, () -> couponService.createCoupon(validRequest));
        assertEquals("Coupon creation limit reached for your current subscription plan.", ex.getMessage());
        verify(couponRepository, never()).save(any(Coupon.class));
    }

    @Test
    void shouldRejectWhenNoActiveSubscription() {
        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class, () -> couponService.createCoupon(validRequest));
        assertEquals("No active subscription. Please purchase a subscription plan to create coupons.", ex.getMessage());
        verify(couponRepository, never()).save(any(Coupon.class));
    }

    @Test
    void shouldRejectWhenSubscriptionIsExpired() {
        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        activeSubscription.setEndDate(LocalDate.now().minusDays(1));
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(activeSubscription);

        BusinessException ex = assertThrows(BusinessException.class, () -> couponService.createCoupon(validRequest));
        assertEquals("No active subscription. Please purchase a subscription plan to create coupons.", ex.getMessage());
        verify(couponRepository, never()).save(any(Coupon.class));
    }

    @Test
    void shouldRejectWhenMerchantUsesAnotherMerchantsSubscription() {
        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        activeSubscription.setMerchantId(999L); // Belongs to different merchant
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(activeSubscription);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> couponService.createCoupon(validRequest));
        assertEquals("Merchant cannot use another merchant's subscription.", ex.getMessage());
        verify(couponRepository, never()).save(any(Coupon.class));
    }

    @Test
    void shouldAllowCouponValidityExceedingSubscriptionEndDate() {
        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        // Subscription ends in 5 days, but coupon is valid for 30 days
        activeSubscription.setEndDate(LocalDate.now().plusDays(5));
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(activeSubscription);
        when(couponRepository.findByCouponCode("PIZZA50")).thenReturn(Optional.empty());

        Coupon savedCoupon = new Coupon();
        savedCoupon.setCouponId(3L);
        savedCoupon.setMerchantId(101L);
        savedCoupon.setSubscriptionId(10L);
        savedCoupon.setStatus(CouponStatus.PENDING_APPROVAL);
        when(couponRepository.save(any(Coupon.class))).thenReturn(savedCoupon);

        CouponResponse response = couponService.createCoupon(validRequest);
        assertNotNull(response);
        verify(couponRepository).save(any(Coupon.class));
    }

    @Test
    void shouldRejectWhenValidFromIsAfterValidUntil() {
        validRequest.setValidFrom(LocalDateTime.now().plusDays(10));
        validRequest.setValidUntil(LocalDateTime.now().plusDays(5));

        MerchantResponseDto merchant = new MerchantResponseDto(101L, "Pizza Planet", "APPROVED");
        when(merchantClient.getMerchantById(101L)).thenReturn(merchant);
        when(subscriptionClient.getActiveSubscription(101L)).thenReturn(activeSubscription);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> couponService.createCoupon(validRequest));
        assertEquals("Coupon validFrom cannot be after validUntil.", ex.getMessage());
    }

    @Test
    void shouldUpdateOnlyPermittedFieldsAndKeepOriginalDatesUnchanged() {
        Long couponId = 1L;
        Coupon existing = new Coupon();
        existing.setCouponId(couponId);
        existing.setMerchantId(101L);
        existing.setTitle("Old Title");
        existing.setDescription("Old Description");
        existing.setCategory("Food & Dining");
        existing.setDiscount(new BigDecimal("10.00"));
        existing.setCashbackPercentage(new BigDecimal("2.00"));
        existing.setCouponCode("PIZZA10");
        existing.setMinimumPurchase(new BigDecimal("100.00"));
        existing.setUsageLimit(50);
        existing.setUsageCount(5);
        existing.setStatus(CouponStatus.ACTIVE);
        LocalDateTime originalFrom = LocalDateTime.now().minusDays(2);
        LocalDateTime originalUntil = LocalDateTime.now().plusDays(10);
        existing.setValidFrom(originalFrom);
        existing.setValidUntil(originalUntil);

        when(couponRepository.findById(couponId)).thenReturn(Optional.of(existing));
        when(couponRepository.save(any(Coupon.class))).thenAnswer(i -> i.getArgument(0));

        CouponUpdateRequest updateReq = new CouponUpdateRequest(
                "New Title", "New Description", "Food & Dining",
                new BigDecimal("20.00"), new BigDecimal("5.00"),
                new BigDecimal("200.00"), 100
        );

        CouponResponse updated = couponService.updateCoupon(couponId, updateReq, "101", "MERCHANT");

        assertNotNull(updated);
        assertEquals("New Title", updated.getTitle());
        assertEquals("New Description", updated.getDescription());
        assertEquals(new BigDecimal("20.00"), updated.getDiscount());
        assertEquals(new BigDecimal("5.00"), updated.getCashbackPercentage());
        assertEquals(new BigDecimal("200.00"), updated.getMinimumPurchase());
        assertEquals(100, updated.getUsageLimit());

        // Immutable fields verified
        assertEquals("PIZZA10", updated.getCouponCode());
        assertEquals(101L, updated.getMerchantId());
        assertEquals(originalFrom, updated.getValidFrom());
        assertEquals(originalUntil, updated.getValidUntil());
        assertEquals(5, updated.getUsageCount());
        assertEquals(CouponStatus.ACTIVE, updated.getStatus());
    }

    @Test
    void shouldRejectUnauthorizedMerchantUpdate() {
        Long couponId = 1L;
        Coupon existing = new Coupon();
        existing.setCouponId(couponId);
        existing.setMerchantId(101L); // Owner is merchant 101

        when(couponRepository.findById(couponId)).thenReturn(Optional.of(existing));

        CouponUpdateRequest updateReq = new CouponUpdateRequest(
                "Hacked Title", "Hacked Desc", "Electronics",
                new BigDecimal("50.00"), BigDecimal.ZERO,
                new BigDecimal("100.00"), 50
        );

        // Merchant 202 tries to update merchant 101's coupon
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                couponService.updateCoupon(couponId, updateReq, "202", "MERCHANT"));
        assertEquals("Access denied: You cannot update coupons belonging to another merchant.", ex.getMessage());
    }

    @Test
    void shouldApproveCouponSuccessfully() {
        Long couponId = 1L;
        Coupon coupon = new Coupon();
        coupon.setCouponId(couponId);
        coupon.setStatus(CouponStatus.PENDING_APPROVAL);

        when(couponRepository.findById(couponId)).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any(Coupon.class))).thenAnswer(i -> i.getArgument(0));

        CouponResponse res = couponService.approveCoupon(couponId, "admin@deals.com");

        assertNotNull(res);
        assertEquals(CouponStatus.ACTIVE, res.getStatus());
        assertEquals("admin@deals.com", res.getApprovedBy());
    }

    @Test
    void shouldRejectCouponSuccessfully() {
        Long couponId = 1L;
        Coupon coupon = new Coupon();
        coupon.setCouponId(couponId);
        coupon.setStatus(CouponStatus.PENDING_APPROVAL);

        when(couponRepository.findById(couponId)).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any(Coupon.class))).thenAnswer(i -> i.getArgument(0));

        CouponResponse res = couponService.rejectCoupon(couponId, "admin@deals.com");

        assertNotNull(res);
        assertEquals(CouponStatus.REJECTED, res.getStatus());
        assertEquals("admin@deals.com", res.getApprovedBy());
    }

    @Test
    void shouldCastUpvoteSuccessfullyForEligibleCustomer() {
        Long couponId = 1L;
        Long customerId = 5L;
        VoteRequest request = new VoteRequest(VoteType.UPVOTE, customerId);

        Coupon coupon = new Coupon();
        coupon.setCouponId(couponId);
        coupon.setStatus(CouponStatus.ACTIVE);

        when(couponRepository.findById(couponId)).thenReturn(Optional.of(coupon));
        when(redemptionClient.hasCustomerRedeemed(customerId, couponId)).thenReturn(true);
        when(couponVoteRepository.findByCustomerIdAndCouponId(customerId, couponId)).thenReturn(Optional.empty());
        when(couponVoteRepository.countByCouponIdAndVoteType(couponId, VoteType.UPVOTE)).thenReturn(94L);
        when(couponVoteRepository.countByCouponIdAndVoteType(couponId, VoteType.DOWNVOTE)).thenReturn(6L);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(i -> i.getArgument(0));

        VoteResponse response = couponService.castVote(couponId, request, "5", "CUSTOMER");

        assertNotNull(response);
        assertEquals(94, response.getUpvoteCount());
        assertEquals(6, response.getDownvoteCount());
        assertEquals(100, response.getTotalVotes());
        assertEquals(new BigDecimal("87.52"), response.getReliabilityScore());
        assertEquals(CouponStatus.ACTIVE, response.getStatus());
        verify(couponVoteRepository).save(any(CouponVote.class));
    }

    @Test
    void shouldCalculateWilsonScoreForVariousVoteScenarios() {
        // 1 upvote, 0 downvotes -> 20.65%
        assertEquals(new BigDecimal("20.65"), couponService.calculateWilsonScore(1, 0));

        // 100 upvotes, 2 downvotes -> 93.13%
        assertEquals(new BigDecimal("93.13"), couponService.calculateWilsonScore(100, 2));

        // 2 upvotes, 8 downvotes -> 5.67%
        assertEquals(new BigDecimal("5.67"), couponService.calculateWilsonScore(2, 8));

        // 1 upvote, 4 downvotes -> 3.62%
        assertEquals(new BigDecimal("3.62"), couponService.calculateWilsonScore(1, 4));

        // 0 upvotes, 0 downvotes -> 0.00%
        assertEquals(new BigDecimal("0.00"), couponService.calculateWilsonScore(0, 0));

        // 50 upvotes, 50 downvotes -> 40.38%
        assertEquals(new BigDecimal("40.38"), couponService.calculateWilsonScore(50, 50));
    }

    @Test
    void shouldSortActiveCouponsByWilsonScoreRankAndTieBreakers() {
        LocalDateTime now = LocalDateTime.now();

        Coupon c1 = new Coupon();
        c1.setCouponId(1L);
        c1.setStatus(CouponStatus.ACTIVE);
        c1.setValidFrom(now.minusDays(1));
        c1.setValidUntil(now.plusDays(10));
        c1.setUsageCount(0);
        c1.setUsageLimit(100);
        c1.setUpvoteCount(100);
        c1.setDownvoteCount(2);
        c1.setReliabilityScore(couponService.calculateWilsonScore(100, 2)); // 93.13
        c1.setCreatedAt(now.minusDays(5));

        Coupon c2 = new Coupon();
        c2.setCouponId(2L);
        c2.setStatus(CouponStatus.ACTIVE);
        c2.setValidFrom(now.minusDays(1));
        c2.setValidUntil(now.plusDays(10));
        c2.setUsageCount(0);
        c2.setUsageLimit(100);
        c2.setUpvoteCount(50);
        c2.setDownvoteCount(50);
        c2.setReliabilityScore(couponService.calculateWilsonScore(50, 50)); // 40.38
        c2.setCreatedAt(now.minusDays(4));

        Coupon c3 = new Coupon();
        c3.setCouponId(3L);
        c3.setStatus(CouponStatus.ACTIVE);
        c3.setValidFrom(now.minusDays(1));
        c3.setValidUntil(now.plusDays(10));
        c3.setUsageCount(0);
        c3.setUsageLimit(100);
        c3.setUpvoteCount(1);
        c3.setDownvoteCount(0);
        c3.setReliabilityScore(couponService.calculateWilsonScore(1, 0)); // 20.65
        c3.setCreatedAt(now.minusDays(3));

        Coupon c4 = new Coupon();
        c4.setCouponId(4L);
        c4.setStatus(CouponStatus.ACTIVE);
        c4.setValidFrom(now.minusDays(1));
        c4.setValidUntil(now.plusDays(10));
        c4.setUsageCount(0);
        c4.setUsageLimit(100);
        c4.setUpvoteCount(1);
        c4.setDownvoteCount(4);
        c4.setReliabilityScore(couponService.calculateWilsonScore(1, 4)); // 3.62
        c4.setCreatedAt(now.minusDays(2));

        Coupon c5 = new Coupon();
        c5.setCouponId(5L);
        c5.setStatus(CouponStatus.ACTIVE);
        c5.setValidFrom(now.minusDays(1));
        c5.setValidUntil(now.plusDays(10));
        c5.setUsageCount(0);
        c5.setUsageLimit(100);
        c5.setUpvoteCount(0);
        c5.setDownvoteCount(0);
        c5.setReliabilityScore(couponService.calculateWilsonScore(0, 0)); // 0.00
        c5.setCreatedAt(now.minusDays(1));

        when(couponRepository.findByStatus(CouponStatus.ACTIVE)).thenReturn(List.of(c5, c4, c3, c2, c1));

        List<CouponResponse> ranked = couponService.getRankedActiveCoupons();

        assertEquals(5, ranked.size());
        assertEquals(1L, ranked.get(0).getCouponId());
        assertEquals(2L, ranked.get(1).getCouponId());
        assertEquals(3L, ranked.get(2).getCouponId());
        assertEquals(4L, ranked.get(3).getCouponId());
        assertEquals(5L, ranked.get(4).getCouponId());
    }

    @Test
    void shouldExcludeHiddenCouponsFromRankedDiscovery() {
        when(couponRepository.findByStatus(CouponStatus.ACTIVE)).thenReturn(List.of());

        List<CouponResponse> ranked = couponService.getRankedActiveCoupons();

        assertTrue(ranked.isEmpty());
        verify(couponRepository).findByStatus(CouponStatus.ACTIVE);
    }
}
