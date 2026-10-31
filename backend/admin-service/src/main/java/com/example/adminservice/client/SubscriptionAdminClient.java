package com.example.adminservice.client;

import com.example.adminservice.dto.CreateSubscriptionPlanRequestDto;
import com.example.adminservice.dto.SubscriptionPlanResponseDto;
import com.example.adminservice.dto.SubscriptionResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "subscription-service")
public interface SubscriptionAdminClient {

    @GetMapping("/api/subscriptions/{id}")
    @CircuitBreaker(name = "subscriptionAdminService", fallbackMethod = "getSubscriptionByIdFallback")
    @Retry(name = "subscriptionAdminService")
    SubscriptionResponseDto getSubscriptionById(@PathVariable("id") Long id);

    @PostMapping("/api/subscriptions/plans")
    @CircuitBreaker(name = "subscriptionAdminService", fallbackMethod = "createSubscriptionPlanFallback")
    @Retry(name = "subscriptionAdminService")
    SubscriptionPlanResponseDto createSubscriptionPlan(@RequestBody CreateSubscriptionPlanRequestDto request);

    @PutMapping("/api/subscriptions/plans/{planId}")
    @CircuitBreaker(name = "subscriptionAdminService", fallbackMethod = "updateSubscriptionPlanFallback")
    @Retry(name = "subscriptionAdminService")
    SubscriptionPlanResponseDto updateSubscriptionPlan(@PathVariable("planId") Long planId, @RequestBody CreateSubscriptionPlanRequestDto request);

    @DeleteMapping("/api/subscriptions/plans/{planId}")
    @CircuitBreaker(name = "subscriptionAdminService", fallbackMethod = "deleteSubscriptionPlanFallback")
    @Retry(name = "subscriptionAdminService")
    void deleteSubscriptionPlan(@PathVariable("planId") Long planId);

    default SubscriptionResponseDto getSubscriptionByIdFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(SubscriptionAdminClient.class)
                .error("Circuit breaker fallback: subscription-service unavailable for getSubscriptionById {}. Reason: {}", id, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Subscription service is temporarily unavailable.");
    }

    default SubscriptionPlanResponseDto createSubscriptionPlanFallback(CreateSubscriptionPlanRequestDto request, Throwable t) {
        LoggerFactory.getLogger(SubscriptionAdminClient.class)
                .error("Circuit breaker fallback: subscription-service unavailable for createSubscriptionPlan. Reason: {}", t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Subscription service is temporarily unavailable. Could not create plan.");
    }

    default SubscriptionPlanResponseDto updateSubscriptionPlanFallback(Long planId, CreateSubscriptionPlanRequestDto request, Throwable t) {
        LoggerFactory.getLogger(SubscriptionAdminClient.class)
                .error("Circuit breaker fallback: subscription-service unavailable for updateSubscriptionPlan {}. Reason: {}", planId, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Subscription service is temporarily unavailable. Could not update plan.");
    }

    default void deleteSubscriptionPlanFallback(Long planId, Throwable t) {
        LoggerFactory.getLogger(SubscriptionAdminClient.class)
                .error("Circuit breaker fallback: subscription-service unavailable for deleteSubscriptionPlan {}. Reason: {}", planId, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Subscription service is temporarily unavailable. Could not delete plan.");
    }
}
