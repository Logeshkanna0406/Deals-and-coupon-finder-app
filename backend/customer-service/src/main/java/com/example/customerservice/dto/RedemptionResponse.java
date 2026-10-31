package com.example.customerservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RedemptionResponse {
    private Long redemptionId;
    private Long couponId;
    private Long merchantId;
    private Long customerId;
    private LocalDateTime redeemedAt;
    private BigDecimal purchaseAmount;
    private BigDecimal discountAmount;
    private String status;

    public RedemptionResponse() {}

    public Long getRedemptionId() { return redemptionId; }
    public void setRedemptionId(Long redemptionId) { this.redemptionId = redemptionId; }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public LocalDateTime getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(LocalDateTime redeemedAt) { this.redeemedAt = redeemedAt; }

    public BigDecimal getPurchaseAmount() { return purchaseAmount; }
    public void setPurchaseAmount(BigDecimal purchaseAmount) { this.purchaseAmount = purchaseAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
