package com.example.notificationservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MerchantCouponAlertEvent implements Serializable {
    private Long customerId;
    private Long merchantId;
    private String merchantName;
    private Long couponId;
    private String couponTitle;
    private String couponCode;
    private BigDecimal discount;
    private String category;
    private LocalDateTime validUntil;
    private boolean emailEnabled;
    private boolean smsEnabled;
    private boolean inAppEnabled;

    public MerchantCouponAlertEvent() {}

    public MerchantCouponAlertEvent(Long customerId, Long merchantId, String merchantName,
                                    Long couponId, String couponTitle, String couponCode,
                                    BigDecimal discount, String category, LocalDateTime validUntil,
                                    boolean emailEnabled, boolean smsEnabled, boolean inAppEnabled) {
        this.customerId = customerId;
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.couponId = couponId;
        this.couponTitle = couponTitle;
        this.couponCode = couponCode;
        this.discount = discount;
        this.category = category;
        this.validUntil = validUntil;
        this.emailEnabled = emailEnabled;
        this.smsEnabled = smsEnabled;
        this.inAppEnabled = inAppEnabled;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public String getCouponTitle() { return couponTitle; }
    public void setCouponTitle(String couponTitle) { this.couponTitle = couponTitle; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public boolean isEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }

    public boolean isSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(boolean smsEnabled) { this.smsEnabled = smsEnabled; }

    public boolean isInAppEnabled() { return inAppEnabled; }
    public void setInAppEnabled(boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
}
