package com.example.subscriptionservice.dto;

import java.math.BigDecimal;

public class SubscriptionPlanResponse {
    private Long planId;
    private String name;
    private Integer durationInMonths;
    private BigDecimal price;
    private Integer couponLimit;
    private String status;

    public SubscriptionPlanResponse() {}

    public SubscriptionPlanResponse(Long planId, String name, Integer durationInMonths, BigDecimal price, Integer couponLimit, String status) {
        this.planId = planId;
        this.name = name;
        this.durationInMonths = durationInMonths;
        this.price = price;
        this.couponLimit = couponLimit;
        this.status = status;
    }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getDurationInMonths() { return durationInMonths; }
    public void setDurationInMonths(Integer durationInMonths) { this.durationInMonths = durationInMonths; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getCouponLimit() { return couponLimit; }
    public void setCouponLimit(Integer couponLimit) { this.couponLimit = couponLimit; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
