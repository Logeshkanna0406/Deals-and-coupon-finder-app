package com.example.cashbackservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class RedeemCashbackRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount to redeem must be positive")
    private BigDecimal amount;

    public RedeemCashbackRequest() {}

    public RedeemCashbackRequest(Long customerId, BigDecimal amount) {
        this.customerId = customerId;
        this.amount = amount;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
