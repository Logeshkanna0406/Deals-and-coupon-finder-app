package com.example.customerservice.controller;

import com.example.customerservice.dto.*;
import com.example.customerservice.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customer Controller", description = "Endpoints for managing customer profile, preferences, wallet and redemptions")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer profile by ID")
    public ResponseEntity<CustomerResponse> getCustomer(@PathVariable("id") Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer name and phone")
    public ResponseEntity<CustomerResponse> updateCustomer(@PathVariable("id") Long id,
                                                           @Valid @RequestBody UpdateCustomerRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request));
    }

    @PutMapping("/{id}/preferences")
    @Operation(summary = "Update customer shopping preferences")
    public ResponseEntity<CustomerResponse> updatePreferences(@PathVariable("id") Long id,
                                                              @Valid @RequestBody UpdatePreferencesRequest request) {
        return ResponseEntity.ok(customerService.updatePreferences(id, request));
    }

    @PostMapping("/internal")
    @Operation(summary = "Internal endpoint: create customer profile synced from auth-service")
    public ResponseEntity<CustomerProfileDto> createInternalCustomer(@RequestBody CustomerProfileDto dto) {
        return new ResponseEntity<>(customerService.createInternalCustomer(dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/wallet")
    @Operation(summary = "Get customer wallet balance from cashback service")
    public ResponseEntity<WalletResponse> getCustomerWallet(@PathVariable("id") Long id) {
        return ResponseEntity.ok(customerService.getCustomerWallet(id));
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Get customer cashback transaction history")
    public ResponseEntity<List<CashbackTransactionResponse>> getCustomerTransactions(@PathVariable("id") Long id) {
        return ResponseEntity.ok(customerService.getCustomerTransactions(id));
    }

    @GetMapping("/{id}/redemptions")
    @Operation(summary = "Get customer coupon redemption history")
    public ResponseEntity<List<RedemptionResponse>> getCustomerRedemptions(@PathVariable("id") Long id) {
        return ResponseEntity.ok(customerService.getCustomerRedemptions(id));
    }
}
