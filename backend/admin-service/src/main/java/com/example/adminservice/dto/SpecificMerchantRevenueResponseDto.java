package com.example.adminservice.dto;

import java.math.BigDecimal;

public class SpecificMerchantRevenueResponseDto {
    private Long merchantId;
    private String merchantName;
    private BigDecimal totalRevenue;
    private Long successfulPayments;
    private String currency;

    public SpecificMerchantRevenueResponseDto() {}

    public SpecificMerchantRevenueResponseDto(Long merchantId, String merchantName, BigDecimal totalRevenue, Long successfulPayments, String currency) {
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.totalRevenue = totalRevenue;
        this.successfulPayments = successfulPayments;
        this.currency = currency;
    }

    public Long getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(Long merchantId) {
        this.merchantId = merchantId;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
