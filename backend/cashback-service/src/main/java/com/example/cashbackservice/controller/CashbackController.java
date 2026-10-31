package com.example.cashbackservice.controller;

import com.example.cashbackservice.dto.CashbackTransactionResponse;
import com.example.cashbackservice.dto.RedeemCashbackRequest;
import com.example.cashbackservice.dto.WalletResponse;
import com.example.cashbackservice.service.CashbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cashback")
@Tag(name = "Cashback Controller", description = "Endpoints for customer wallet, cashback transactions and withdrawals")
public class CashbackController {

    private final CashbackService cashbackService;

    public CashbackController(CashbackService cashbackService) {
        this.cashbackService = cashbackService;
    }

    @GetMapping("/wallet/{customerId}")
    @Operation(summary = "Get customer wallet balance")
    public ResponseEntity<WalletResponse> getWallet(
            @PathVariable("customerId") Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(cashbackService.getWalletByCustomerId(customerId, authUserId, authUserRole));
    }

    @GetMapping("/transactions/{customerId}")
    @Operation(summary = "Get all cashback credit/debit transaction history for a customer")
    public ResponseEntity<List<CashbackTransactionResponse>> getTransactions(
            @PathVariable("customerId") Long customerId,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(cashbackService.getTransactionsByCustomerId(customerId, authUserId, authUserRole));
    }

    @PostMapping("/redeem")
    @Operation(summary = "Redeem/Withdraw customer wallet cashback balance")
    public ResponseEntity<WalletResponse> redeemCashback(
            @Valid @RequestBody RedeemCashbackRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String authUserId,
            @RequestHeader(value = "X-User-Role", required = false) String authUserRole) {
        return ResponseEntity.ok(cashbackService.redeemCashback(request, authUserId, authUserRole));
    }
}
