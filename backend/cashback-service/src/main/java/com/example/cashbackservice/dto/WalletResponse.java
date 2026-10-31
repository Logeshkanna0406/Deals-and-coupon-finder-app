package com.example.cashbackservice.dto;

import java.math.BigDecimal;

public class WalletResponse {
    private Long walletId;
    private Long customerId;
    private BigDecimal balance;

    public WalletResponse() {}

    public WalletResponse(Long walletId, Long customerId, BigDecimal balance) {
        this.walletId = walletId;
        this.customerId = customerId;
        this.balance = balance;
    }

    public Long getWalletId() { return walletId; }
    public void setWalletId(Long walletId) { this.walletId = walletId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
}
