package com.example.cashbackservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CashbackCreditedEvent implements Serializable {
    private Long customerId;
    private BigDecimal amount;
    private BigDecimal newBalance;
    private Long redemptionId;
    private LocalDateTime creditedAt;

    public CashbackCreditedEvent() {}

    public CashbackCreditedEvent(Long customerId, BigDecimal amount, BigDecimal newBalance, Long redemptionId, LocalDateTime creditedAt) {
        this.customerId = customerId;
        this.amount = amount;
        this.newBalance = newBalance;
        this.redemptionId = redemptionId;
        this.creditedAt = creditedAt;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getNewBalance() { return newBalance; }
    public void setNewBalance(BigDecimal newBalance) { this.newBalance = newBalance; }

    public Long getRedemptionId() { return redemptionId; }
    public void setRedemptionId(Long redemptionId) { this.redemptionId = redemptionId; }

    public LocalDateTime getCreditedAt() { return creditedAt; }
    public void setCreditedAt(LocalDateTime creditedAt) { this.creditedAt = creditedAt; }
}
