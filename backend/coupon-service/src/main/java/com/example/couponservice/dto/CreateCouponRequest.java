package com.example.couponservice.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateCouponRequest {

    @NotNull(message = "Merchant ID is required")
    private Long merchantId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Discount is required")
    @PositiveOrZero(message = "Discount must be zero or positive")
    private BigDecimal discount;

    @PositiveOrZero(message = "Cashback percentage must be zero or positive")
    private BigDecimal cashbackPercentage;

    @NotBlank(message = "Coupon code is required")
    private String couponCode;

    @NotNull(message = "Minimum purchase is required")
    @PositiveOrZero(message = "Minimum purchase must be zero or positive")
    private BigDecimal minimumPurchase;

    private Integer validityHours;

    private LocalDateTime validFrom;

    private LocalDateTime validUntil;

    @NotNull(message = "Usage limit is required")
    @Positive(message = "Usage limit must be at least 1")
    private Integer usageLimit;

    public CreateCouponRequest() {}

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getCashbackPercentage() { return cashbackPercentage; }
    public void setCashbackPercentage(BigDecimal cashbackPercentage) { this.cashbackPercentage = cashbackPercentage; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public BigDecimal getMinimumPurchase() { return minimumPurchase; }
    public void setMinimumPurchase(BigDecimal minimumPurchase) { this.minimumPurchase = minimumPurchase; }

    public Integer getValidityHours() { return validityHours; }
    public void setValidityHours(Integer validityHours) { this.validityHours = validityHours; }

    public LocalDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public Integer getUsageLimit() { return usageLimit; }
    public void setUsageLimit(Integer usageLimit) { this.usageLimit = usageLimit; }
}
