package com.example.couponservice.dto;

import com.example.couponservice.entity.CouponStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponResponse {
    private Long couponId;
    private Long merchantId;
    private String title;
    private String description;
    private String category;
    private BigDecimal discount;
    private BigDecimal cashbackPercentage;
    private String couponCode;
    private BigDecimal minimumPurchase;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Integer usageLimit;
    private Integer usageCount;
    private CouponStatus status;
    private LocalDateTime createdAt;
    private String approvedBy;
    private Integer upvoteCount;
    private Integer downvoteCount;
    private Integer totalVotes;
    private BigDecimal reliabilityScore;
    private Long subscriptionId;

    public CouponResponse() {}

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

    public Integer getTotalVotes() { return totalVotes; }
    public void setTotalVotes(Integer totalVotes) { this.totalVotes = totalVotes; }

    public BigDecimal getReliabilityScore() { return reliabilityScore; }
    public void setReliabilityScore(BigDecimal reliabilityScore) { this.reliabilityScore = reliabilityScore; }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }
}
