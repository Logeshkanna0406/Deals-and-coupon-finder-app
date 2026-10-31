package com.example.cashbackservice.dto;

import com.example.cashbackservice.entity.CustomerTier;

public class CustomerTierResponse {
    private Long customerId;
    private Integer totalPoints;
    private CustomerTier tier;
    private CustomerTier nextTier;
    private Integer pointsRequiredForNextTier;

    public CustomerTierResponse() {}

    public CustomerTierResponse(Long customerId, Integer totalPoints, CustomerTier tier, CustomerTier nextTier, Integer pointsRequiredForNextTier) {
        this.customerId = customerId;
        this.totalPoints = totalPoints;
        this.tier = tier;
        this.nextTier = nextTier;
        this.pointsRequiredForNextTier = pointsRequiredForNextTier;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public CustomerTier getTier() {
        return tier;
    }

    public void setTier(CustomerTier tier) {
        this.tier = tier;
    }

    public CustomerTier getNextTier() {
        return nextTier;
    }

    public void setNextTier(CustomerTier nextTier) {
        this.nextTier = nextTier;
    }

    public Integer getPointsRequiredForNextTier() {
        return pointsRequiredForNextTier;
    }

    public void setPointsRequiredForNextTier(Integer pointsRequiredForNextTier) {
        this.pointsRequiredForNextTier = pointsRequiredForNextTier;
    }
}
