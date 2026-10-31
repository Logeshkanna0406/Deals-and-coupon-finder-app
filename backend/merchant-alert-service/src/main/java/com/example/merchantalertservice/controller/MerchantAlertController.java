package com.example.merchantalertservice.controller;

import com.example.merchantalertservice.dto.AlertPreferenceResponse;
import com.example.merchantalertservice.dto.MerchantInterestResponse;
import com.example.merchantalertservice.dto.UpdateAlertPreferenceRequest;
import com.example.merchantalertservice.exception.BadRequestException;
import com.example.merchantalertservice.service.MerchantAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/merchant-alerts")
@Tag(name = "Merchant Alert Controller", description = "Endpoints for following merchants and configuring new-coupon alert preferences")
public class MerchantAlertController {

    private final MerchantAlertService merchantAlertService;

    public MerchantAlertController(MerchantAlertService merchantAlertService) {
        this.merchantAlertService = merchantAlertService;
    }

    @GetMapping("/interests")
    @Operation(summary = "Get list of merchants the customer is following / interested in")
    public ResponseEntity<List<MerchantInterestResponse>> getCustomerInterests(
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        Long targetCustomerId = resolveCustomerId(customerId, authUserId);
        return ResponseEntity.ok(merchantAlertService.getCustomerInterests(targetCustomerId, authUserId, authUserRole));
    }

    @PostMapping("/follow/{merchantId}")
    @Operation(summary = "Customer follows a merchant to receive new-coupon alerts")
    public ResponseEntity<MerchantInterestResponse> followMerchant(
            @PathVariable("merchantId") Long merchantId,
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        Long targetCustomerId = resolveCustomerId(customerId, authUserId);
        return new ResponseEntity<>(merchantAlertService.followMerchant(targetCustomerId, merchantId, authUserId, authUserRole), HttpStatus.CREATED);
    }

    @DeleteMapping("/follow/{merchantId}")
    @Operation(summary = "Customer unfollows a merchant to stop receiving alerts")
    public ResponseEntity<Void> unfollowMerchant(
            @PathVariable("merchantId") Long merchantId,
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        Long targetCustomerId = resolveCustomerId(customerId, authUserId);
        merchantAlertService.unfollowMerchant(targetCustomerId, merchantId, authUserId, authUserRole);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get alert notification channel preferences for a customer")
    public ResponseEntity<AlertPreferenceResponse> getAlertPreferences(
            @RequestParam(value = "customerId", required = false) Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        Long targetCustomerId = resolveCustomerId(customerId, authUserId);
        return ResponseEntity.ok(merchantAlertService.getAlertPreference(targetCustomerId, authUserId, authUserRole));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update alert notification channel preferences (email, sms, in-app)")
    public ResponseEntity<AlertPreferenceResponse> updateAlertPreferences(
            @RequestBody UpdateAlertPreferenceRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        if (request.getCustomerId() == null && authUserId != null && !authUserId.isBlank()) {
            request.setCustomerId(Long.valueOf(authUserId));
        }
        if (request.getCustomerId() == null) {
            throw new BadRequestException("Customer ID is required to update alert preferences.");
        }
        return ResponseEntity.ok(merchantAlertService.updateAlertPreference(request, authUserId, authUserRole));
    }

    private Long resolveCustomerId(Long customerId, String authUserId) {
        if (customerId != null) {
            return customerId;
        }
        if (authUserId != null && !authUserId.isBlank()) {
            try {
                return Long.parseLong(authUserId);
            } catch (NumberFormatException ignored) {}
        }
        throw new BadRequestException("Customer ID must be provided or user must be authenticated.");
    }
}
