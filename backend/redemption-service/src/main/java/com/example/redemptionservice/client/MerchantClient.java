package com.example.redemptionservice.client;

import com.example.redemptionservice.dto.MerchantResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "merchant-service")
public interface MerchantClient {

    @GetMapping("/api/merchants/{id}")
    @CircuitBreaker(name = "merchantService", fallbackMethod = "getMerchantFallback")
    @Retry(name = "merchantService")
    MerchantResponseDto getMerchantById(@PathVariable("id") Long id);

    default MerchantResponseDto getMerchantFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(MerchantClient.class)
                .warn("Circuit breaker fallback: merchant-service unavailable for merchant ID {}. Reason: {}", id, t.getMessage());
        return new MerchantResponseDto(id, "Merchant #" + id);
    }
}
