package com.example.adminservice.client;

import com.example.adminservice.dto.CouponResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.Collections;
import java.util.List;

@FeignClient(name = "coupon-service")
public interface CouponAdminClient {

    @GetMapping("/api/coupons/all")
    @CircuitBreaker(name = "couponAdminService", fallbackMethod = "getAllCouponsFallback")
    @Retry(name = "couponAdminService")
    List<CouponResponseDto> getAllCoupons();

    @PutMapping("/api/coupons/{id}/approve")
    @CircuitBreaker(name = "couponAdminService", fallbackMethod = "approveCouponFallback")
    @Retry(name = "couponAdminService")
    CouponResponseDto approveCoupon(@PathVariable("id") Long id);

    @PutMapping("/api/coupons/{id}/reject")
    @CircuitBreaker(name = "couponAdminService", fallbackMethod = "rejectCouponFallback")
    @Retry(name = "couponAdminService")
    CouponResponseDto rejectCoupon(@PathVariable("id") Long id);

    default List<CouponResponseDto> getAllCouponsFallback(Throwable t) {
        LoggerFactory.getLogger(CouponAdminClient.class)
                .warn("Circuit breaker fallback: coupon-service unavailable for getAllCoupons. Reason: {}", t.getMessage());
        return Collections.emptyList();
    }

    default CouponResponseDto approveCouponFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(CouponAdminClient.class)
                .error("Circuit breaker fallback: coupon-service unavailable for approveCoupon {}. Reason: {}", id, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Coupon service is temporarily unavailable. Could not approve coupon.");
    }

    default CouponResponseDto rejectCouponFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(CouponAdminClient.class)
                .error("Circuit breaker fallback: coupon-service unavailable for rejectCoupon {}. Reason: {}", id, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Coupon service is temporarily unavailable. Could not reject coupon.");
    }
}
