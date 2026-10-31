package com.example.redemptionservice.client;

import com.example.redemptionservice.dto.CouponValidationDto;
import com.example.redemptionservice.exception.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "coupon-service")
public interface CouponClient {

    @GetMapping("/api/coupons/{id}")
    @CircuitBreaker(name = "couponService", fallbackMethod = "getCouponFallback")
    @Retry(name = "couponService")
    CouponValidationDto getCouponById(@PathVariable("id") Long id);

    @PutMapping("/api/coupons/{id}/increment-usage")
    @CircuitBreaker(name = "couponService", fallbackMethod = "incrementUsageFallback")
    @Retry(name = "couponService")
    void incrementUsage(@PathVariable("id") Long id);

    default CouponValidationDto getCouponFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(CouponClient.class)
                .error("Circuit breaker triggered: coupon-service unavailable for coupon ID {}. Reason: {}", id, t.getMessage());
        throw new ServiceUnavailableException("Coupon validation service is temporarily unavailable. Please retry shortly.");
    }

    default void incrementUsageFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(CouponClient.class)
                .warn("Circuit breaker triggered: could not increment usage directly for coupon ID {}. Fallback triggered. Reason: {}", id, t.getMessage());
    }
}
