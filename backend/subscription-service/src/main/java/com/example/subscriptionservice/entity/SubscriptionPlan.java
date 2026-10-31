package com.example.subscriptionservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planId;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Integer durationInMonths;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer couponLimit;

    @Column(nullable = false)
    private String status;

    public SubscriptionPlan() {}

    public SubscriptionPlan(Long planId, String name, Integer durationInMonths, BigDecimal price, Integer couponLimit, String status) {
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
