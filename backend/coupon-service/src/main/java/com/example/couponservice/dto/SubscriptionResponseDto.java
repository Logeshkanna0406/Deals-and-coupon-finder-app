package com.example.couponservice.dto;

import java.time.LocalDate;

public class SubscriptionResponseDto {
    private Long subscriptionId;
    private Long merchantId;
    private String planName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer couponLimit;
    private Integer couponsGenerated;
    private Integer remainingCoupons;

    public SubscriptionResponseDto() {}

    public SubscriptionResponseDto(Long subscriptionId, Long merchantId, String planName, LocalDate startDate, LocalDate endDate, String status) {
        this(subscriptionId, merchantId, planName, startDate, endDate, status, null, null, null);
    }

    public SubscriptionResponseDto(Long subscriptionId, Long merchantId, String planName, LocalDate startDate, LocalDate endDate, String status, Integer couponLimit) {
        this(subscriptionId, merchantId, planName, startDate, endDate, status, couponLimit, 0, couponLimit);
    }

    public SubscriptionResponseDto(Long subscriptionId, Long merchantId, String planName, LocalDate startDate, LocalDate endDate, String status, Integer couponLimit, Integer couponsGenerated, Integer remainingCoupons) {
        this.subscriptionId = subscriptionId;
        this.merchantId = merchantId;
        this.planName = planName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.couponLimit = couponLimit;
        this.couponsGenerated = couponsGenerated != null ? couponsGenerated : 0;
        this.remainingCoupons = remainingCoupons != null ? remainingCoupons : (couponLimit != null ? couponLimit - this.couponsGenerated : null);
    }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getCouponLimit() { return couponLimit; }
    public void setCouponLimit(Integer couponLimit) { this.couponLimit = couponLimit; }

    public Integer getCouponsGenerated() { return couponsGenerated; }
    public void setCouponsGenerated(Integer couponsGenerated) { this.couponsGenerated = couponsGenerated; }

    public Integer getRemainingCoupons() { return remainingCoupons; }
    public void setRemainingCoupons(Integer remainingCoupons) { this.remainingCoupons = remainingCoupons; }
}
