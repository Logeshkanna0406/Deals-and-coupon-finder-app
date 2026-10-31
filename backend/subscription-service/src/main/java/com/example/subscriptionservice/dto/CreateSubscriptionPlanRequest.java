package com.example.subscriptionservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateSubscriptionPlanRequest {

    @NotBlank(message = "Plan name is required")
    private String name;

    @NotNull(message = "Duration in months is required")
    @Min(value = 1, message = "Duration must be at least 1 month")
    private Integer durationInMonths;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Coupon limit is required")
    @Min(value = 1, message = "Coupon limit must be at least 1")
    private Integer couponLimit;

    private String status;

    public CreateSubscriptionPlanRequest() {}

    public CreateSubscriptionPlanRequest(String name, Integer durationInMonths, BigDecimal price, Integer couponLimit, String status) {
        this.name = name;
        this.durationInMonths = durationInMonths;
        this.price = price;
        this.couponLimit = couponLimit;
        this.status = status;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getDurationInMonths() {
        return durationInMonths;
    }

    public void setDurationInMonths(Integer durationInMonths) {
        this.durationInMonths = durationInMonths;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getCouponLimit() {
        return couponLimit;
    }

    public void setCouponLimit(Integer couponLimit) {
        this.couponLimit = couponLimit;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
