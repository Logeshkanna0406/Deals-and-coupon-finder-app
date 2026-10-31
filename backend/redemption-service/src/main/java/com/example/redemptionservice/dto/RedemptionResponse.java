package com.example.redemptionservice.dto;

import com.example.redemptionservice.entity.RedemptionStatus;
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
    private RedemptionStatus status;
    private Integer pointsEarned;

    public RedemptionResponse() {}

    public RedemptionResponse(Long redemptionId, Long couponId, Long merchantId, Long customerId, LocalDateTime redeemedAt, BigDecimal purchaseAmount, BigDecimal discountAmount, RedemptionStatus status) {
        this(redemptionId, couponId, merchantId, customerId, redeemedAt, purchaseAmount, discountAmount, status, 10);
    }

    public RedemptionResponse(Long redemptionId, Long couponId, Long merchantId, Long customerId, LocalDateTime redeemedAt, BigDecimal purchaseAmount, BigDecimal discountAmount, RedemptionStatus status, Integer pointsEarned) {
        this.redemptionId = redemptionId;
        this.couponId = couponId;
        this.merchantId = merchantId;
        this.customerId = customerId;
        this.redeemedAt = redeemedAt;
        this.purchaseAmount = purchaseAmount;
        this.discountAmount = discountAmount;
        this.status = status;
        this.pointsEarned = pointsEarned;
    }

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

    public RedemptionStatus getStatus() { return status; }
    public void setStatus(RedemptionStatus status) { this.status = status; }

    public Integer getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Integer pointsEarned) { this.pointsEarned = pointsEarned; }
}
