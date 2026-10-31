package com.example.cashbackservice.dto;

import com.example.cashbackservice.entity.TransactionType;
import java.time.LocalDateTime;

public class PointTransactionResponse {
    private Long transactionId;
    private Long customerId;
    private Integer points;
    private TransactionType type;
    private String referenceId;
    private LocalDateTime createdAt;

    public PointTransactionResponse() {}

    public PointTransactionResponse(Long transactionId, Long customerId, Integer points, TransactionType type, String referenceId, LocalDateTime createdAt) {
        this.transactionId = transactionId;
        this.customerId = customerId;
        this.points = points;
        this.type = type;
        this.referenceId = referenceId;
        this.createdAt = createdAt;
    }

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
