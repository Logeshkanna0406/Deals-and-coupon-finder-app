package com.example.paymentservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentVerifiedEvent implements Serializable {
    private Long paymentId;
    private Long merchantId;
    private Long subscriptionId;
    private BigDecimal amount;
    private LocalDateTime verifiedAt;

    public PaymentVerifiedEvent() {}

    public PaymentVerifiedEvent(Long paymentId, Long merchantId, Long subscriptionId, BigDecimal amount, LocalDateTime verifiedAt) {
        this.paymentId = paymentId;
        this.merchantId = merchantId;
        this.subscriptionId = subscriptionId;
        this.amount = amount;
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

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}
