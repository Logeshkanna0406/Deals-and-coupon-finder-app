package com.example.redemptionservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class CreateRedemptionRequest {

    @NotNull(message = "Coupon ID is required")
    private Long couponId;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Purchase amount is required")
    @Positive(message = "Purchase amount must be positive")
    private BigDecimal purchaseAmount;

    public CreateRedemptionRequest() {}

    public CreateRedemptionRequest(Long couponId, Long customerId, BigDecimal purchaseAmount) {
        this.couponId = couponId;
        this.customerId = customerId;
        this.purchaseAmount = purchaseAmount;
    }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getPurchaseAmount() { return purchaseAmount; }
    public void setPurchaseAmount(BigDecimal purchaseAmount) { this.purchaseAmount = purchaseAmount; }
}
