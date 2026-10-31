package com.example.merchantalertservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponRedeemedEvent implements Serializable {
    private Long redemptionId;
    private Long couponId;
    private Long merchantId;
    private Long customerId;
    private BigDecimal purchaseAmount;
    private BigDecimal discountAmount;
    private BigDecimal cashbackPercentage;
    private LocalDateTime redeemedAt;
    private Integer pointsEarned;

    public CouponRedeemedEvent() {}

    public CouponRedeemedEvent(Long redemptionId, Long couponId, Long merchantId, Long customerId,
                               BigDecimal purchaseAmount, BigDecimal discountAmount,
                               BigDecimal cashbackPercentage, LocalDateTime redeemedAt, Integer pointsEarned) {
        this.redemptionId = redemptionId;
        this.couponId = couponId;
        this.merchantId = merchantId;
        this.customerId = customerId;
        this.purchaseAmount = purchaseAmount;
        this.discountAmount = discountAmount;
        this.cashbackPercentage = cashbackPercentage;
        this.redeemedAt = redeemedAt;
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

    public BigDecimal getPurchaseAmount() { return purchaseAmount; }
    public void setPurchaseAmount(BigDecimal purchaseAmount) { this.purchaseAmount = purchaseAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getCashbackPercentage() { return cashbackPercentage; }
    public void setCashbackPercentage(BigDecimal cashbackPercentage) { this.cashbackPercentage = cashbackPercentage; }

    public LocalDateTime getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(LocalDateTime redeemedAt) { this.redeemedAt = redeemedAt; }

    public Integer getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Integer pointsEarned) { this.pointsEarned = pointsEarned; }
}
