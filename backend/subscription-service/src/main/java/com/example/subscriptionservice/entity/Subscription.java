package com.example.subscriptionservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subscriptionId;

    @Column(nullable = false)
    private Long merchantId;

    @Column(nullable = false)
    private Long planId;

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private Long paymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    @Column(name = "coupons_generated", nullable = false)
    private Integer couponsGenerated = 0;

    public Subscription() {
        this.couponsGenerated = 0;
    }

    public Subscription(Long subscriptionId, Long merchantId, Long planId, LocalDate startDate, LocalDate endDate, BigDecimal amount, Long paymentId, SubscriptionStatus status) {
        this(subscriptionId, merchantId, planId, startDate, endDate, amount, paymentId, status, 0);
    }

    public Subscription(Long subscriptionId, Long merchantId, Long planId, LocalDate startDate, LocalDate endDate, BigDecimal amount, Long paymentId, SubscriptionStatus status, Integer couponsGenerated) {
        this.subscriptionId = subscriptionId;
        this.merchantId = merchantId;
        this.planId = planId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.amount = amount;
        this.paymentId = paymentId;
        this.status = status;
        this.couponsGenerated = couponsGenerated != null ? couponsGenerated : 0;
    }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }

    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { this.status = status; }

    public Integer getCouponsGenerated() { return couponsGenerated != null ? couponsGenerated : 0; }
    public void setCouponsGenerated(Integer couponsGenerated) { this.couponsGenerated = couponsGenerated != null ? couponsGenerated : 0; }
}
