package com.example.couponservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long couponId;

    @Column(nullable = false)
    private Long merchantId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal cashbackPercentage;

    @Column(nullable = false, unique = true)
    private String couponCode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal minimumPurchase;

    @Column(nullable = false)
    private LocalDateTime validFrom;

    @Column(nullable = false)
    private LocalDateTime validUntil;

    @Column(nullable = false)
    private Integer usageLimit;

    @Column(nullable = false)
    private Integer usageCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private String approvedBy;

    @Column(nullable = false)
    private Integer upvoteCount = 0;

    @Column(nullable = false)
    private Integer downvoteCount = 0;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal reliabilityScore = BigDecimal.ZERO;

    @Column(name = "subscription_id")
    private Long subscriptionId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.usageCount == null) {
            this.usageCount = 0;
        }
        if (this.status == null) {
            this.status = CouponStatus.PENDING_APPROVAL;
        }
        if (this.upvoteCount == null) {
            this.upvoteCount = 0;
        }
        if (this.downvoteCount == null) {
            this.downvoteCount = 0;
        }
        if (this.reliabilityScore == null) {
            this.reliabilityScore = BigDecimal.ZERO;
        }
    }

    public Coupon() {}

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

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getCashbackPercentage() { return cashbackPercentage; }
    public void setCashbackPercentage(BigDecimal cashbackPercentage) { this.cashbackPercentage = cashbackPercentage; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public BigDecimal getMinimumPurchase() { return minimumPurchase; }
    public void setMinimumPurchase(BigDecimal minimumPurchase) { this.minimumPurchase = minimumPurchase; }

    public LocalDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public Integer getUsageLimit() { return usageLimit; }
    public void setUsageLimit(Integer usageLimit) { this.usageLimit = usageLimit; }

    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }

    public CouponStatus getStatus() { return status; }
    public void setStatus(CouponStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public Integer getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(Integer upvoteCount) { this.upvoteCount = upvoteCount; }

    public Integer getDownvoteCount() { return downvoteCount; }
    public void setDownvoteCount(Integer downvoteCount) { this.downvoteCount = downvoteCount; }

    public BigDecimal getReliabilityScore() { return reliabilityScore; }
    public void setReliabilityScore(BigDecimal reliabilityScore) { this.reliabilityScore = reliabilityScore; }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }
}
