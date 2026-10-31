package com.example.cashbackservice.dto;

import com.example.cashbackservice.entity.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CashbackTransactionResponse {
    private Long transactionId;
    private Long customerId;
    private BigDecimal amount;
    private TransactionType type;
    private String referenceId;
    private LocalDateTime createdAt;

    public CashbackTransactionResponse() {}

    public CashbackTransactionResponse(Long transactionId, Long customerId, BigDecimal amount, TransactionType type, String referenceId, LocalDateTime createdAt) {
        this.transactionId = transactionId;
        this.customerId = customerId;
        this.amount = amount;
        this.type = type;
        this.referenceId = referenceId;
        this.createdAt = createdAt;
    }

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
