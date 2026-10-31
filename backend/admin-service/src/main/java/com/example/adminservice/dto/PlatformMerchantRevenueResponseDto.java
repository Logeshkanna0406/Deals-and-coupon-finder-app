package com.example.adminservice.dto;

import java.math.BigDecimal;
import java.util.List;

public class PlatformMerchantRevenueResponseDto {
    private BigDecimal totalPlatformRevenue;
    private String currency;
    private List<MerchantRevenueItemDto> merchants;

    public PlatformMerchantRevenueResponseDto() {}

    public PlatformMerchantRevenueResponseDto(BigDecimal totalPlatformRevenue, String currency, List<MerchantRevenueItemDto> merchants) {
        this.totalPlatformRevenue = totalPlatformRevenue;
        this.currency = currency;
        this.merchants = merchants;
    }

    public BigDecimal getTotalPlatformRevenue() {
        return totalPlatformRevenue;
    }

    public void setTotalPlatformRevenue(BigDecimal totalPlatformRevenue) {
        this.totalPlatformRevenue = totalPlatformRevenue;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public List<MerchantRevenueItemDto> getMerchants() {
        return merchants;
    }

    public void setMerchants(List<MerchantRevenueItemDto> merchants) {
        this.merchants = merchants;
    }
}
