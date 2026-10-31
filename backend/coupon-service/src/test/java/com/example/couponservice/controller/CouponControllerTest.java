package com.example.couponservice.controller;

import com.example.couponservice.dto.*;
import com.example.couponservice.entity.CouponStatus;
import com.example.couponservice.entity.VoteType;
import com.example.couponservice.service.CouponService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CouponController.class)
@AutoConfigureMockMvc(addFilters = false)
class CouponControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CouponService couponService;

    @Test
    void shouldReturnActiveCoupons() throws Exception {
        CouponResponse coupon = new CouponResponse();
        coupon.setCouponId(1L);
        coupon.setMerchantId(101L);
        coupon.setTitle("Flat 50% Off");
        coupon.setCouponCode("DISCOUNT50");
        coupon.setDiscount(new BigDecimal("50.00"));
        coupon.setStatus(CouponStatus.ACTIVE);
        coupon.setValidUntil(LocalDateTime.now().plusMonths(1));

        when(couponService.getActiveCoupons()).thenReturn(List.of(coupon));

        mockMvc.perform(get("/api/coupons")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].couponCode").value("DISCOUNT50"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void shouldCastVoteSuccessfully() throws Exception {
        VoteRequest req = new VoteRequest(VoteType.UPVOTE, 5L);
        VoteResponse voteResponse = new VoteResponse(
                1L, 5L, VoteType.UPVOTE, 10, 1, 11, new BigDecimal("90.91"), CouponStatus.ACTIVE, "Vote recorded successfully as UPVOTE"
        );

        when(couponService.castVote(eq(1L), any(VoteRequest.class), any(), any())).thenReturn(voteResponse);

        mockMvc.perform(post("/api/coupons/1/votes")
                .header("X-User-Id", "5")
                .header("X-User-Role", "CUSTOMER")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.couponId").value(1))
                .andExpect(jsonPath("$.voteType").value("UPVOTE"))
                .andExpect(jsonPath("$.upvoteCount").value(10))
                .andExpect(jsonPath("$.reliabilityScore").value(90.91))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void shouldGetCouponReliability() throws Exception {
        CouponReliabilityResponse res = new CouponReliabilityResponse(
                1L, 15, 3, 18, new BigDecimal("83.33"), 10, CouponStatus.ACTIVE
        );

        when(couponService.getCouponReliability(1L)).thenReturn(res);

        mockMvc.perform(get("/api/coupons/1/reliability")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.couponId").value(1))
                .andExpect(jsonPath("$.upvoteCount").value(15))
                .andExpect(jsonPath("$.downvoteCount").value(3))
                .andExpect(jsonPath("$.totalVotes").value(18))
                .andExpect(jsonPath("$.reliabilityScore").value(83.33));
    }

    @Test
    void shouldGetRankedActiveCoupons() throws Exception {
        CouponResponse coupon = new CouponResponse();
        coupon.setCouponId(1L);
        coupon.setMerchantId(101L);
        coupon.setTitle("Flat 50% Off");
        coupon.setCouponCode("DISCOUNT50");
        coupon.setDiscount(new BigDecimal("50.00"));
        coupon.setStatus(CouponStatus.ACTIVE);
        coupon.setReliabilityScore(new BigDecimal("95.00"));
        coupon.setValidUntil(LocalDateTime.now().plusMonths(1));

        when(couponService.getRankedActiveCoupons()).thenReturn(List.of(coupon));

        mockMvc.perform(get("/api/coupons/ranked")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].couponCode").value("DISCOUNT50"))
                .andExpect(jsonPath("$[0].reliabilityScore").value(95.00));
    }

    @Test
    void shouldUpdateCouponSuccessfully() throws Exception {
        CouponUpdateRequest req = new CouponUpdateRequest(
                "Updated Pizza 50", "Updated description", "Food & Dining",
                new BigDecimal("50.00"), new BigDecimal("5.00"),
                new BigDecimal("500.00"), 200
        );

        CouponResponse res = new CouponResponse();
        res.setCouponId(1L);
        res.setMerchantId(101L);
        res.setTitle("Updated Pizza 50");
        res.setUsageLimit(200);

        when(couponService.updateCoupon(eq(1L), any(CouponUpdateRequest.class), eq("101"), eq("MERCHANT"))).thenReturn(res);

        mockMvc.perform(put("/api/coupons/1")
                .header("X-User-Id", "101")
                .header("X-User-Role", "MERCHANT")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.couponId").value(1))
                .andExpect(jsonPath("$.title").value("Updated Pizza 50"))
                .andExpect(jsonPath("$.usageLimit").value(200));
    }

    @Test
    void shouldRejectUpdateWhenValidityDateModificationIsAttempted() throws Exception {
        String payloadWithValidUntil = """
                {
                    "title": "Hack validity",
                    "description": "Attempting to change validUntil",
                    "category": "Food & Dining",
                    "discount": 50.00,
                    "minimumPurchase": 500.00,
                    "usageLimit": 100,
                    "validUntil": "2029-12-31T23:59:59"
                }
                """;

        mockMvc.perform(put("/api/coupons/1")
                .header("X-User-Id", "101")
                .header("X-User-Role", "MERCHANT")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadWithValidUntil))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Coupon validity dates cannot be modified after creation."));
    }
}
