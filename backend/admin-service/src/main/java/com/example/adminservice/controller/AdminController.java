package com.example.adminservice.controller;

import com.example.adminservice.dto.*;
import com.example.adminservice.exception.BadRequestException;
import com.example.adminservice.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Controller", description = "Back-Office management: approvals for merchants, subscriptions, coupons, payments and revenue")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/merchants")
    @Operation(summary = "Get all registered merchants")
    public ResponseEntity<List<MerchantResponseDto>> getAllMerchants() {
        return ResponseEntity.ok(adminService.getAllMerchants());
    }

    @PutMapping("/merchants/{id}/approve")
    @Operation(summary = "Approve merchant application")
    public ResponseEntity<MerchantResponseDto> approveMerchant(@PathVariable("id") Long id,
                                                               @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(adminService.approveMerchant(id, adminEmail));
    }

    @PutMapping("/merchants/{id}/reject")
    @Operation(summary = "Reject merchant application")
    public ResponseEntity<MerchantResponseDto> rejectMerchant(@PathVariable("id") Long id,
                                                              @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(adminService.rejectMerchant(id, adminEmail));
    }

    @PutMapping("/merchants/{id}/suspend")
    @Operation(summary = "Suspend merchant")
    public ResponseEntity<MerchantResponseDto> suspendMerchant(@PathVariable("id") Long id,
                                                               @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(adminService.suspendMerchant(id, adminEmail));
    }

    @GetMapping("/coupons")
    @Operation(summary = "Get all coupons for review")
    public ResponseEntity<List<CouponResponseDto>> getAllCoupons() {
        return ResponseEntity.ok(adminService.getAllCoupons());
    }

    @PutMapping("/coupons/{id}/approve")
    @Operation(summary = "Approve coupon (Status -> ACTIVE)")
    public ResponseEntity<CouponResponseDto> approveCoupon(@PathVariable("id") Long id,
                                                           @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(adminService.approveCoupon(id, adminEmail));
    }

    @PutMapping("/coupons/{id}/reject")
    @Operation(summary = "Reject coupon (Status -> REJECTED)")
    public ResponseEntity<CouponResponseDto> rejectCoupon(@PathVariable("id") Long id,
                                                           @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(adminService.rejectCoupon(id, adminEmail));
    }

    @GetMapping("/payments")
    @Operation(summary = "Get all platform payments")
    public ResponseEntity<List<PaymentResponseDto>> getAllPayments() {
        return ResponseEntity.ok(adminService.getAllPayments());
    }

    @PutMapping("/payments/{id}/verify")
    @Operation(summary = "Verify payment (Triggers RabbitMQ PaymentVerifiedEvent)")
    public ResponseEntity<PaymentResponseDto> verifyPayment(@PathVariable("id") Long id,
                                                            @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(adminService.verifyPayment(id, adminEmail));
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get total verified platform subscription revenue")
    public ResponseEntity<RevenueResponseDto> getRevenue(
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        checkAdminRole(userRole);
        return ResponseEntity.ok(adminService.getRevenue(fromDate, toDate));
    }

    @GetMapping("/revenue/merchants")
    @Operation(summary = "Get verified subscription revenue grouped by merchant")
    public ResponseEntity<PlatformMerchantRevenueResponseDto> getMerchantRevenueSummary(
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        checkAdminRole(userRole);
        return ResponseEntity.ok(adminService.getMerchantRevenueSummary(fromDate, toDate));
    }

    @GetMapping("/revenue/merchants/{merchantId}")
    @Operation(summary = "Get verified subscription revenue for a specific merchant")
    public ResponseEntity<SpecificMerchantRevenueResponseDto> getSpecificMerchantRevenue(
            @PathVariable("merchantId") Long merchantId,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        checkAdminRole(userRole);
        return ResponseEntity.ok(adminService.getSpecificMerchantRevenue(merchantId, fromDate, toDate));
    }

    @PostMapping("/subscription-plans")
    @Operation(summary = "Create a new subscription plan (Admin only)")
    public ResponseEntity<SubscriptionPlanResponseDto> createSubscriptionPlan(
            @Valid @RequestBody CreateSubscriptionPlanRequestDto request,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        checkAdminRole(userRole);
        return new ResponseEntity<>(adminService.createSubscriptionPlan(request, adminEmail), HttpStatus.CREATED);
    }

    @PutMapping("/subscription-plans/{planId}")
    @Operation(summary = "Update an existing subscription plan (Admin only)")
    public ResponseEntity<SubscriptionPlanResponseDto> updateSubscriptionPlan(
            @PathVariable("planId") Long planId,
            @Valid @RequestBody CreateSubscriptionPlanRequestDto request,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        checkAdminRole(userRole);
        return ResponseEntity.ok(adminService.updateSubscriptionPlan(planId, request, adminEmail));
    }

    @DeleteMapping("/subscription-plans/{planId}")
    @Operation(summary = "Delete a subscription plan (Admin only)")
    public ResponseEntity<Void> deleteSubscriptionPlan(
            @PathVariable("planId") Long planId,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        checkAdminRole(userRole);
        adminService.deleteSubscriptionPlan(planId, adminEmail);
        return ResponseEntity.noContent().build();
    }

    private void checkAdminRole(String userRole) {
        if (userRole != null && !userRole.isBlank() && !"ADMIN".equalsIgnoreCase(userRole)) {
            throw new BadRequestException("Access denied: ADMIN role required");
        }
    }
}

