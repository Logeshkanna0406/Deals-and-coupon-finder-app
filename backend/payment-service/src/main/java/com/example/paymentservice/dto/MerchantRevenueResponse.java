package com.example.paymentservice.dto;

import java.math.BigDecimal;

public class MerchantRevenueResponse {
    private Long merchantId;
    private BigDecimal totalRevenue;
    private Long successfulPayments;

    public MerchantRevenueResponse() {}

    public MerchantRevenueResponse(Long merchantId, BigDecimal totalRevenue, Long successfulPayments) {
        this.merchantId = merchantId;
        this.totalRevenue = totalRevenue;
        this.successfulPayments = successfulPayments;
    }

    public Long getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(Long merchantId) {
        this.merchantId = merchantId;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Long getSuccessfulPayments() {
        return successfulPayments;
    }

    public void setSuccessfulPayments(Long successfulPayments) {
        this.successfulPayments = successfulPayments;
    }
}
