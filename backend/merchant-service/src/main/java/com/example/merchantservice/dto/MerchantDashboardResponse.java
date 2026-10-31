package com.example.merchantservice.dto;

import java.util.List;

public class MerchantDashboardResponse {
    private MerchantResponse merchantProfile;
    private SubscriptionResponse activeSubscription;
    private int totalCoupons;
    private int activeCoupons;
    private int totalRedemptions;

    public MerchantDashboardResponse() {}

    public MerchantDashboardResponse(MerchantResponse merchantProfile, SubscriptionResponse activeSubscription, int totalCoupons, int activeCoupons, int totalRedemptions) {
        this.merchantProfile = merchantProfile;
        this.activeSubscription = activeSubscription;
        this.totalCoupons = totalCoupons;
        this.activeCoupons = activeCoupons;
        this.totalRedemptions = totalRedemptions;
    }

    public MerchantResponse getMerchantProfile() { return merchantProfile; }
    public void setMerchantProfile(MerchantResponse merchantProfile) { this.merchantProfile = merchantProfile; }

    public SubscriptionResponse getActiveSubscription() { return activeSubscription; }
    public void setActiveSubscription(SubscriptionResponse activeSubscription) { this.activeSubscription = activeSubscription; }

    public int getTotalCoupons() { return totalCoupons; }
    public void setTotalCoupons(int totalCoupons) { this.totalCoupons = totalCoupons; }

    public int getActiveCoupons() { return activeCoupons; }
    public void setActiveCoupons(int activeCoupons) { this.activeCoupons = activeCoupons; }

    public int getTotalRedemptions() { return totalRedemptions; }
    public void setTotalRedemptions(int totalRedemptions) { this.totalRedemptions = totalRedemptions; }
}
