package com.example.cashbackservice.controller;

import com.example.cashbackservice.dto.PointAccountResponse;
import com.example.cashbackservice.dto.PointTransactionResponse;
import com.example.cashbackservice.dto.RedeemPointsRequest;
import com.example.cashbackservice.dto.RedeemPointsResponse;
import com.example.cashbackservice.service.CashbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/points")
@Tag(name = "Points Controller", description = "Endpoints for customer points balance, point history, and points-to-wallet conversion")
public class PointsController {

    private final CashbackService cashbackService;

    public PointsController(CashbackService cashbackService) {
        this.cashbackService = cashbackService;
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get customer point balance")
    public ResponseEntity<PointAccountResponse> getPointAccount(
            @PathVariable("customerId") Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(cashbackService.getPointAccount(customerId, authUserId, authUserRole));
    }

    @GetMapping("/customer/{customerId}/transactions")
    @Operation(summary = "Get point transaction history for a customer")
    public ResponseEntity<List<PointTransactionResponse>> getPointTransactions(
            @PathVariable("customerId") Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(cashbackService.getPointTransactions(customerId, authUserId, authUserRole));
    }

    @GetMapping("/customer/{customerId}/tier")
    @Operation(summary = "Get customer loyalty tier and next tier requirements")
    public ResponseEntity<com.example.cashbackservice.dto.CustomerTierResponse> getCustomerTier(
            @PathVariable("customerId") Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(cashbackService.getCustomerTier(customerId, authUserId, authUserRole));
    }

    @GetMapping("/my-tier")
    @Operation(summary = "Get current authenticated customer loyalty tier")
    public ResponseEntity<com.example.cashbackservice.dto.CustomerTierResponse> getMyTier(
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        Long targetCustomerId = customerId;
        if (targetCustomerId == null && authUserId != null && !authUserId.isBlank()) {
            targetCustomerId = Long.valueOf(authUserId);
        }
        if (targetCustomerId == null) {
            throw new com.example.cashbackservice.exception.BadRequestException("Customer ID must be provided or user must be authenticated.");
        }
        return ResponseEntity.ok(cashbackService.getCustomerTier(targetCustomerId, authUserId, authUserRole));
    }

    @PostMapping("/redeem")
    @Operation(summary = "Convert customer points to wallet money (100 points = ₹10)")
    public ResponseEntity<RedeemPointsResponse> redeemPoints(
            @Valid @RequestBody RedeemPointsRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(cashbackService.redeemPoints(request, authUserId, authUserRole));
    }
}
