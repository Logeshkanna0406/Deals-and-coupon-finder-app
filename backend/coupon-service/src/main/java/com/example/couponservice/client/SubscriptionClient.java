package com.example.couponservice.client;

import com.example.couponservice.dto.SubscriptionResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "subscription-service")
public interface SubscriptionClient {

    @GetMapping("/api/subscriptions/merchant/{merchantId}/active")
    @CircuitBreaker(name = "subscriptionService", fallbackMethod = "getActiveSubscriptionFallback")
    @Retry(name = "subscriptionService")
    SubscriptionResponseDto getActiveSubscription(@PathVariable("merchantId") Long merchantId);

    @PostMapping("/api/subscriptions/{subscriptionId}/increment-coupon-count")
    SubscriptionResponseDto incrementCouponCount(@PathVariable("subscriptionId") Long subscriptionId);

    default SubscriptionResponseDto getActiveSubscriptionFallback(Long merchantId, Throwable t) {
        throw new com.example.couponservice.exception.ServiceUnavailableException(
                "Subscription service is temporarily unavailable. Please try again later."
        );
    }
}
