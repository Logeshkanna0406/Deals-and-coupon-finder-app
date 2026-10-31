package com.example.merchantservice.client;

import com.example.merchantservice.dto.CouponResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Collections;
import java.util.List;

@FeignClient(name = "coupon-service")
public interface CouponClient {

    @GetMapping("/api/coupons/merchant/{merchantId}")
    @CircuitBreaker(name = "couponService", fallbackMethod = "getCouponsByMerchantFallback")
    @Retry(name = "couponService")
    List<CouponResponse> getCouponsByMerchantId(@PathVariable("merchantId") Long merchantId);

    default List<CouponResponse> getCouponsByMerchantFallback(Long merchantId, Throwable t) {
        LoggerFactory.getLogger(CouponClient.class)
                .warn("Circuit breaker fallback: coupon-service unavailable for merchant {}. Reason: {}", merchantId, t.getMessage());
        return Collections.emptyList();
    }
}
