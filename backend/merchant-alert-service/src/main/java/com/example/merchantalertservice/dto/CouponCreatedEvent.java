package com.example.merchantalertservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponCreatedEvent implements Serializable {
    private Long couponId;
    private Long merchantId;
    private String title;
    private String description;
    private String category;
    private String couponCode;
    private BigDecimal discount;
    private BigDecimal cashbackPercentage;
    private BigDecimal minimumPurchase;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private String status;
    private LocalDateTime createdAt;

    public CouponCreatedEvent() {}

    public CouponCreatedEvent(Long couponId, Long merchantId, String title, String description,
                              String category, String couponCode, BigDecimal discount,
                              BigDecimal cashbackPercentage, BigDecimal minimumPurchase,
                              LocalDateTime validFrom, LocalDateTime validUntil,
                              String status, LocalDateTime createdAt) {
        this.couponId = couponId;
        this.merchantId = merchantId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.couponCode = couponCode;
        this.discount = discount;
        this.cashbackPercentage = cashbackPercentage;
        this.minimumPurchase = minimumPurchase;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getCashbackPercentage() { return cashbackPercentage; }
    public void setCashbackPercentage(BigDecimal cashbackPercentage) { this.cashbackPercentage = cashbackPercentage; }

    public BigDecimal getMinimumPurchase() { return minimumPurchase; }
    public void setMinimumPurchase(BigDecimal minimumPurchase) { this.minimumPurchase = minimumPurchase; }

    public LocalDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
