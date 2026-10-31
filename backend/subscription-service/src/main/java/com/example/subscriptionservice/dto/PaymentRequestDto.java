package com.example.subscriptionservice.dto;

import java.math.BigDecimal;

public class PaymentRequestDto {
    private Long merchantId;
    private Long subscriptionId;
    private BigDecimal amount;
    private String paymentMethod;

    public PaymentRequestDto() {}

    public PaymentRequestDto(Long merchantId, Long subscriptionId, BigDecimal amount, String paymentMethod) {
        this.merchantId = merchantId;
        this.subscriptionId = subscriptionId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
