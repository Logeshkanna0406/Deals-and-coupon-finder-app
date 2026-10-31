package com.example.adminservice.dto;

import java.math.BigDecimal;

public class RevenueResponseDto {
    private BigDecimal totalRevenue;
    private long totalVerifiedTransactions;

    public RevenueResponseDto() {}

    public RevenueResponseDto(BigDecimal totalRevenue, long totalVerifiedTransactions) {
        this.totalRevenue = totalRevenue;
        this.totalVerifiedTransactions = totalVerifiedTransactions;
    }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getTotalVerifiedTransactions() { return totalVerifiedTransactions; }
    public void setTotalVerifiedTransactions(long totalVerifiedTransactions) { this.totalVerifiedTransactions = totalVerifiedTransactions; }
}
