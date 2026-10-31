package com.example.paymentservice.controller;

import com.example.paymentservice.dto.MerchantRevenueResponse;
import com.example.paymentservice.dto.PaymentRequest;
import com.example.paymentservice.dto.PaymentResponse;
import com.example.paymentservice.dto.RevenueResponse;
import com.example.paymentservice.service.PaymentService;
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
@RequestMapping("/api/payments")
@Tag(name = "Payment Controller", description = "Endpoints for mock payment processing and admin verification")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @Operation(summary = "Create a new mock payment for a subscription (Status: PENDING)")
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
        return new ResponseEntity<>(paymentService.createPayment(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment details by ID")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/merchant/{merchantId}")
    @Operation(summary = "Get all payments made by a merchant")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByMerchant(@PathVariable("merchantId") Long merchantId) {
        return ResponseEntity.ok(paymentService.getPaymentsByMerchantId(merchantId));
    }

    @GetMapping
    @Operation(summary = "Get all payment records (Admin)")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @PutMapping("/{id}/verify")
    @Operation(summary = "Verify payment and trigger RabbitMQ PaymentVerifiedEvent (Admin)")
    public ResponseEntity<PaymentResponse> verifyPayment(@PathVariable("id") Long id,
                                                         @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(paymentService.verifyPayment(id, adminEmail));
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Reject payment (Admin)")
    public ResponseEntity<PaymentResponse> rejectPayment(@PathVariable("id") Long id,
                                                         @RequestHeader(value = "X-User-Email", required = false) String adminEmail) {
        return ResponseEntity.ok(paymentService.rejectPayment(id, adminEmail));
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get total verified platform subscription revenue (Admin)")
    public ResponseEntity<RevenueResponse> getRevenueSummary(
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(paymentService.getRevenueSummary(fromDate, toDate));
    }

    @GetMapping("/revenue/merchants")
    @Operation(summary = "Get verified subscription revenue grouped by merchant (Admin/Internal)")
    public ResponseEntity<List<MerchantRevenueResponse>> getMerchantRevenueSummary(
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(paymentService.getMerchantRevenueSummary(fromDate, toDate));
    }

    @GetMapping("/revenue/merchants/{merchantId}")
    @Operation(summary = "Get verified subscription revenue for a specific merchant (Admin/Internal)")
    public ResponseEntity<MerchantRevenueResponse> getRevenueForMerchant(
            @PathVariable("merchantId") Long merchantId,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(paymentService.getRevenueForMerchant(merchantId, fromDate, toDate));
    }
}

