package com.example.merchantservice.controller;

import com.example.merchantservice.dto.MerchantDashboardResponse;
import com.example.merchantservice.dto.MerchantProfileDto;
import com.example.merchantservice.dto.MerchantResponse;
import com.example.merchantservice.dto.UpdateMerchantRequest;
import com.example.merchantservice.entity.MerchantStatus;
import com.example.merchantservice.service.MerchantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/merchants")
@Tag(name = "Merchant Controller", description = "Endpoints for merchant profile, dashboard and administration")
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @GetMapping
    @Operation(summary = "Get all registered merchants (Admin/Internal)")
    public ResponseEntity<List<MerchantResponse>> getAllMerchants() {
        return ResponseEntity.ok(merchantService.getAllMerchants());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get merchant profile by ID")
    public ResponseEntity<MerchantResponse> getMerchantById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(merchantService.getMerchantById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update merchant business profile details")
    public ResponseEntity<MerchantResponse> updateMerchant(@PathVariable("id") Long id,
                                                           @Valid @RequestBody UpdateMerchantRequest request) {
        return ResponseEntity.ok(merchantService.updateMerchant(id, request));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Get merchant dashboard with active subscription, coupon count and redemption stats")
    public ResponseEntity<MerchantDashboardResponse> getDashboard(@PathVariable("id") Long id) {
        return ResponseEntity.ok(merchantService.getDashboard(id));
    }

    @PostMapping("/internal")
    @Operation(summary = "Internal sync endpoint: create merchant profile synced from auth-service")
    public ResponseEntity<MerchantProfileDto> createInternalMerchant(@RequestBody MerchantProfileDto dto) {
        return new ResponseEntity<>(merchantService.createInternalMerchant(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update merchant status (PENDING, APPROVED, REJECTED, SUSPENDED) - Called by Admin")
    public ResponseEntity<MerchantResponse> updateStatus(@PathVariable("id") Long id,
                                                         @RequestParam("status") MerchantStatus status) {
        return ResponseEntity.ok(merchantService.updateStatus(id, status));
    }
}
