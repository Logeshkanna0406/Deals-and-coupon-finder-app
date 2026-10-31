package com.example.couponservice.controller;

import com.example.couponservice.dto.*;
import com.example.couponservice.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@Tag(name = "Coupon Controller", description = "Endpoints for creating deals/coupons, customer discovery, voting and admin approval")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping
    @Operation(summary = "Create a new coupon (Merchant only, status: PENDING_APPROVAL)")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CreateCouponRequest request,
                                                       @RequestHeader(value = "X-User-Id", required = false) String authUserId,
                                                       @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return new ResponseEntity<>(couponService.createCoupon(request, authUserId, authUserRole), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/votes")
    @Operation(summary = "Customer casts a vote on a coupon (UPVOTE/DOWNVOTE)")
    public ResponseEntity<VoteResponse> castVote(@PathVariable("id") Long id,
                                                 @Valid @RequestBody VoteRequest request,
                                                 @RequestHeader(value = "X-User-Id", required = false) String authUserId,
                                                 @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(couponService.castVote(id, request, authUserId, authUserRole));
    }

    @GetMapping("/{id}/reliability")
    @Operation(summary = "Get crowdsourced reliability score and vote counts for a coupon")
    public ResponseEntity<CouponReliabilityResponse> getCouponReliability(@PathVariable("id") Long id) {
        return ResponseEntity.ok(couponService.getCouponReliability(id));
    }

    @GetMapping("/ranked")
    @Operation(summary = "Get active coupons sorted by smart rank (reliability score, total votes, newest)")
    public ResponseEntity<List<CouponResponse>> getRankedCoupons() {
        return ResponseEntity.ok(couponService.getRankedActiveCoupons());
    }

    @GetMapping
    @Operation(summary = "Get all active coupons for customer discovery")
    public ResponseEntity<List<CouponResponse>> getActiveCoupons(@RequestParam(value = "sort", required = false) String sort) {
        if ("smart".equalsIgnoreCase(sort) || "ranked".equalsIgnoreCase(sort)) {
            return ResponseEntity.ok(couponService.getRankedActiveCoupons());
        }
        return ResponseEntity.ok(couponService.getActiveCoupons());
    }

    @GetMapping("/all")
    @Operation(summary = "Get all coupons including pending for admin review")
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCouponsForAdmin());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get coupon details by ID")
    public ResponseEntity<CouponResponse> getCouponById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(couponService.getCouponById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update coupon details (Immutable validity dates)")
    public ResponseEntity<CouponResponse> updateCoupon(@PathVariable("id") Long id,
                                                       @Valid @RequestBody CouponUpdateRequest request,
                                                       @RequestHeader(value = "X-User-Id", required = false) String authUserId,
                                                       @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(couponService.updateCoupon(id, request, authUserId, authUserRole));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate / delete coupon")
    public ResponseEntity<Void> deleteCoupon(@PathVariable("id") Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get active coupons by category")
    public ResponseEntity<List<CouponResponse>> getCouponsByCategory(@PathVariable("category") String category) {
        return ResponseEntity.ok(couponService.getActiveCouponsByCategory(category));
    }

    @GetMapping("/merchant/{merchantId}")
    @Operation(summary = "Get all coupons created by a merchant")
    public ResponseEntity<List<CouponResponse>> getCouponsByMerchant(@PathVariable("merchantId") Long merchantId) {
        return ResponseEntity.ok(couponService.getCouponsByMerchantId(merchantId));
    }

    @GetMapping("/subscription/{subscriptionId}")
    @Operation(summary = "Get all coupons created under a specific subscription plan")
    public ResponseEntity<List<CouponResponse>> getCouponsBySubscription(@PathVariable("subscriptionId") Long subscriptionId) {
        return ResponseEntity.ok(couponService.getCouponsBySubscriptionId(subscriptionId));
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Admin approves coupon (Status -> ACTIVE)")
    public ResponseEntity<CouponResponse> approveCoupon(@PathVariable("id") Long id,
                                                        @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(couponService.approveCoupon(id, adminEmail));
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Admin rejects coupon (Status -> REJECTED)")
    public ResponseEntity<CouponResponse> rejectCoupon(@PathVariable("id") Long id,
                                                        @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(couponService.rejectCoupon(id, adminEmail));
    }

    @PutMapping("/{id}/increment-usage")
    @Operation(summary = "Internal: Increment coupon usage counter upon successful redemption")
    public ResponseEntity<Void> incrementUsage(@PathVariable("id") Long id) {
        couponService.incrementUsage(id);
        return ResponseEntity.ok().build();
    }
}
