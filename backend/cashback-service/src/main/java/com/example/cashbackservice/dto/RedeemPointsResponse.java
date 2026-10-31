package com.example.cashbackservice.dto;

import java.math.BigDecimal;

public class RedeemPointsResponse {
    private Long customerId;
    private Integer pointsDeducted;
    private Integer remainingPoints;
    private BigDecimal walletCredited;
    private BigDecimal newWalletBalance;

    public RedeemPointsResponse() {}

    public RedeemPointsResponse(Long customerId, Integer pointsDeducted, Integer remainingPoints, BigDecimal walletCredited, BigDecimal newWalletBalance) {
        this.customerId = customerId;
        this.pointsDeducted = pointsDeducted;
        this.remainingPoints = remainingPoints;
        this.walletCredited = walletCredited;
        this.newWalletBalance = newWalletBalance;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Integer getPointsDeducted() { return pointsDeducted; }
    public void setPointsDeducted(Integer pointsDeducted) { this.pointsDeducted = pointsDeducted; }

    public Integer getRemainingPoints() { return remainingPoints; }
    public void setRemainingPoints(Integer remainingPoints) { this.remainingPoints = remainingPoints; }

    public BigDecimal getWalletCredited() { return walletCredited; }
    public void setWalletCredited(BigDecimal walletCredited) { this.walletCredited = walletCredited; }

    public BigDecimal getNewWalletBalance() { return newWalletBalance; }
    public void setNewWalletBalance(BigDecimal newWalletBalance) { this.newWalletBalance = newWalletBalance; }
}
