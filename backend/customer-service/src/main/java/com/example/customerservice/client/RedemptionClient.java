package com.example.customerservice.client;

import com.example.customerservice.dto.RedemptionResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Collections;
import java.util.List;

@FeignClient(name = "redemption-service")
public interface RedemptionClient {

    @GetMapping("/api/customers/{id}/redemptions")
    @CircuitBreaker(name = "redemptionService", fallbackMethod = "getRedemptionsFallback")
    @Retry(name = "redemptionService")
    List<RedemptionResponse> getRedemptionsByCustomerId(@PathVariable("id") Long id);

    default List<RedemptionResponse> getRedemptionsFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(RedemptionClient.class)
                .warn("Circuit breaker fallback: redemption-service unavailable for redemptions of customer {}. Reason: {}", id, t.getMessage());
        return Collections.emptyList();
    }
}
