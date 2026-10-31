package com.example.redemptionservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerRedemptionHistoryItemDto {
    private Long redemptionId;
    private Long couponId;
    private String couponTitle;
    private String couponCode;
    private Long merchantId;
    private String merchantName;
    private LocalDateTime redemptionDate;
    private BigDecimal purchaseAmount;
    private BigDecimal discountAmount;
    private Integer pointsEarned;
    private String status;

    public CustomerRedemptionHistoryItemDto() {}

    public CustomerRedemptionHistoryItemDto(Long redemptionId, Long couponId, String couponTitle, String couponCode,
                                           Long merchantId, String merchantName, LocalDateTime redemptionDate,
                                           BigDecimal purchaseAmount, BigDecimal discountAmount,
                                           Integer pointsEarned, String status) {
        this.redemptionId = redemptionId;
        this.couponId = couponId;
        this.couponTitle = couponTitle;
        this.couponCode = couponCode;
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.redemptionDate = redemptionDate;
        this.purchaseAmount = purchaseAmount;
        this.discountAmount = discountAmount;
        this.pointsEarned = pointsEarned;
        this.status = status;
    }

    public Long getRedemptionId() { return redemptionId; }
    public void setRedemptionId(Long redemptionId) { this.redemptionId = redemptionId; }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public String getCouponTitle() { return couponTitle; }
    public void setCouponTitle(String couponTitle) { this.couponTitle = couponTitle; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }

    public LocalDateTime getRedemptionDate() { return redemptionDate; }
    public void setRedemptionDate(LocalDateTime redemptionDate) { this.redemptionDate = redemptionDate; }

    public BigDecimal getPurchaseAmount() { return purchaseAmount; }
    public void setPurchaseAmount(BigDecimal purchaseAmount) { this.purchaseAmount = purchaseAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public Integer getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Integer pointsEarned) { this.pointsEarned = pointsEarned; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
