package com.example.paymentservice.dto;

import com.example.paymentservice.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {
    private Long paymentId;
    private Long merchantId;
    private Long subscriptionId;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private String paymentMethod;
    private String transactionReference;
    private PaymentStatus status;
    private String verifiedBy;
    private LocalDateTime verifiedAt;

    public PaymentResponse() {}

    public PaymentResponse(Long paymentId, Long merchantId, Long subscriptionId, BigDecimal amount, LocalDateTime paymentDate, String paymentMethod, String transactionReference, PaymentStatus status, String verifiedBy, LocalDateTime verifiedAt) {
        this.paymentId = paymentId;
        this.merchantId = merchantId;
        this.subscriptionId = subscriptionId;
        this.amount = amount;
        this.paymentDate = paymentDate;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.status = status;
        this.verifiedBy = verifiedBy;
        this.verifiedAt = verifiedAt;
    }

    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}
