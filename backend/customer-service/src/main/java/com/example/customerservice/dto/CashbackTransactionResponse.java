package com.example.customerservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CashbackTransactionResponse {
    private Long transactionId;
    private Long customerId;
    private BigDecimal amount;
    private String type;
    private String referenceId;
    private LocalDateTime createdAt;

    public CashbackTransactionResponse() {}

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
