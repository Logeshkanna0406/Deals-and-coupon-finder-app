package com.example.merchantservice.client;

import com.example.merchantservice.dto.SubscriptionResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "subscription-service")
public interface SubscriptionClient {

    @GetMapping("/api/subscriptions/merchant/{merchantId}/active")
    @CircuitBreaker(name = "subscriptionService", fallbackMethod = "getActiveSubscriptionFallback")
    @Retry(name = "subscriptionService")
    SubscriptionResponse getActiveSubscription(@PathVariable("merchantId") Long merchantId);

    default SubscriptionResponse getActiveSubscriptionFallback(Long merchantId, Throwable t) {
        LoggerFactory.getLogger(SubscriptionClient.class)
                .warn("Circuit breaker fallback: subscription-service unavailable for merchant {}. Reason: {}", merchantId, t.getMessage());
        SubscriptionResponse fallback = new SubscriptionResponse();
        fallback.setMerchantId(merchantId);
        fallback.setPlanName("Service Temporarily Unavailable");
        fallback.setStatus("UNAVAILABLE");
        return fallback;
    }
}
