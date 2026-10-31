package com.example.subscriptionservice.controller;

import com.example.subscriptionservice.dto.CreateSubscriptionPlanRequest;
import com.example.subscriptionservice.dto.CreateSubscriptionRequest;
import com.example.subscriptionservice.dto.SubscriptionPlanResponse;
import com.example.subscriptionservice.dto.SubscriptionResponse;
import com.example.subscriptionservice.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@Tag(name = "Subscription Controller", description = "Endpoints for subscription plans, purchases, renewals and verification")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/plans")
    @Operation(summary = "Get all available subscription plans (Basic, Standard, Premium, Business)")
    public ResponseEntity<List<SubscriptionPlanResponse>> getAllPlans() {
        return ResponseEntity.ok(subscriptionService.getAllPlans());
    }

    @GetMapping("/plans/{planId}")
    @Operation(summary = "Get subscription plan by ID")
    public ResponseEntity<SubscriptionPlanResponse> getPlanById(@PathVariable("planId") Long planId) {
        return ResponseEntity.ok(subscriptionService.getPlanById(planId));
    }

    @PostMapping("/plans")
    @Operation(summary = "Create a new subscription plan")
    public ResponseEntity<SubscriptionPlanResponse> createPlan(@Valid @RequestBody CreateSubscriptionPlanRequest request) {
        return new ResponseEntity<>(subscriptionService.createPlan(request), HttpStatus.CREATED);
    }

    @PutMapping("/plans/{planId}")
    @Operation(summary = "Update an existing subscription plan")
    public ResponseEntity<SubscriptionPlanResponse> updatePlan(
            @PathVariable("planId") Long planId,
            @Valid @RequestBody CreateSubscriptionPlanRequest request) {
        return ResponseEntity.ok(subscriptionService.updatePlan(planId, request));
    }

    @DeleteMapping("/plans/{planId}")
    @Operation(summary = "Delete a subscription plan")
    public ResponseEntity<Void> deletePlan(@PathVariable("planId") Long planId) {
        subscriptionService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    @Operation(summary = "Purchase a subscription (Created as PENDING_VERIFICATION)")
    public ResponseEntity<SubscriptionResponse> createSubscription(@Valid @RequestBody CreateSubscriptionRequest request) {
        return new ResponseEntity<>(subscriptionService.createSubscription(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get subscription details by ID")
    public ResponseEntity<SubscriptionResponse> getSubscriptionById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    @GetMapping("/merchant/{merchantId}")
    @Operation(summary = "Get all subscription records for a merchant")
    public ResponseEntity<List<SubscriptionResponse>> getSubscriptionsByMerchant(@PathVariable("merchantId") Long merchantId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByMerchantId(merchantId));
    }

    @GetMapping("/merchant/{merchantId}/active")
    @Operation(summary = "Get the current active subscription for a merchant")
    public ResponseEntity<SubscriptionResponse> getActiveSubscription(@PathVariable("merchantId") Long merchantId) {
        return ResponseEntity.ok(subscriptionService.getActiveSubscription(merchantId));
    }

    @GetMapping("/merchant/{merchantId}/upcoming")
    @Operation(summary = "Get upcoming scheduled subscriptions for a merchant")
    public ResponseEntity<List<SubscriptionResponse>> getUpcomingSubscriptions(@PathVariable("merchantId") Long merchantId) {
        return ResponseEntity.ok(subscriptionService.getUpcomingSubscriptions(merchantId));
    }

    @PostMapping("/{id}/increment-coupon-count")
    @Operation(summary = "Increment coupon count for an active subscription")
    public ResponseEntity<SubscriptionResponse> incrementCouponCount(@PathVariable("id") Long id) {
        return ResponseEntity.ok(subscriptionService.incrementCouponCount(id));
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Manually activate a scheduled subscription plan (like recharge pack activation)")
    public ResponseEntity<SubscriptionResponse> activateSubscription(
            @PathVariable("id") Long id,
            @RequestParam("merchantId") Long merchantId) {
        return ResponseEntity.ok(subscriptionService.manuallyActivateSubscription(id, merchantId));
    }
}
