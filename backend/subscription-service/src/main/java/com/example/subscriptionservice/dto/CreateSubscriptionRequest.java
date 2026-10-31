package com.example.subscriptionservice.dto;

import jakarta.validation.constraints.NotNull;

public class CreateSubscriptionRequest {

    @NotNull(message = "Merchant ID is required")
    private Long merchantId;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    public CreateSubscriptionRequest() {}

    public CreateSubscriptionRequest(Long merchantId, Long planId) {
        this.merchantId = merchantId;
        this.planId = planId;
    }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
}
