package com.example.couponservice.dto;

import com.example.couponservice.exception.BadRequestException;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public class CouponUpdateRequest {

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

    @NotNull(message = "Minimum purchase is required")
    @PositiveOrZero(message = "Minimum purchase must be zero or positive")
    private BigDecimal minimumPurchase;

    @NotNull(message = "Usage limit is required")
    @Positive(message = "Usage limit must be at least 1")
    private Integer usageLimit;

    public CouponUpdateRequest() {}

    public CouponUpdateRequest(String title, String description, String category, BigDecimal discount,
                               BigDecimal cashbackPercentage, BigDecimal minimumPurchase, Integer usageLimit) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.discount = discount;
        this.cashbackPercentage = cashbackPercentage;
        this.minimumPurchase = minimumPurchase;
        this.usageLimit = usageLimit;
    }

    @JsonSetter("validFrom")
    public void setValidFrom(Object validFrom) {
        if (validFrom != null) {
            throw new BadRequestException("Coupon validity dates cannot be modified after creation.");
        }
    }

    @JsonSetter("validUntil")
    public void setValidUntil(Object validUntil) {
        if (validUntil != null) {
            throw new BadRequestException("Coupon validity dates cannot be modified after creation.");
        }
    }

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

    public BigDecimal getMinimumPurchase() { return minimumPurchase; }
    public void setMinimumPurchase(BigDecimal minimumPurchase) { this.minimumPurchase = minimumPurchase; }

    public Integer getUsageLimit() { return usageLimit; }
    public void setUsageLimit(Integer usageLimit) { this.usageLimit = usageLimit; }
}
