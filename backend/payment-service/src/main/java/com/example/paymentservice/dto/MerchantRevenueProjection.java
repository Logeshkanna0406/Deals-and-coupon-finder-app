package com.example.paymentservice.dto;

import java.math.BigDecimal;

public interface MerchantRevenueProjection {
    Long getMerchantId();
    BigDecimal getTotalRevenue();
    Long getSuccessfulPayments();
}
