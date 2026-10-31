package com.example.adminservice.client;

import com.example.adminservice.dto.MerchantResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
import java.util.List;

@FeignClient(name = "merchant-service")
public interface MerchantAdminClient {

    @GetMapping("/api/merchants")
    @CircuitBreaker(name = "merchantAdminService", fallbackMethod = "getAllMerchantsFallback")
    @Retry(name = "merchantAdminService")
    List<MerchantResponseDto> getAllMerchants();

    @GetMapping("/api/merchants/{id}")
    @CircuitBreaker(name = "merchantAdminService", fallbackMethod = "getMerchantByIdFallback")
    @Retry(name = "merchantAdminService")
    MerchantResponseDto getMerchantById(@PathVariable("id") Long id);

    @PutMapping("/api/merchants/{id}/status")
    @CircuitBreaker(name = "merchantAdminService", fallbackMethod = "updateMerchantStatusFallback")
    @Retry(name = "merchantAdminService")
    MerchantResponseDto updateMerchantStatus(@PathVariable("id") Long id, @RequestParam("status") String status);

    default List<MerchantResponseDto> getAllMerchantsFallback(Throwable t) {
        LoggerFactory.getLogger(MerchantAdminClient.class)
                .warn("Circuit breaker fallback: merchant-service unavailable for getAllMerchants. Reason: {}", t.getMessage());
        return Collections.emptyList();
    }

    default MerchantResponseDto getMerchantByIdFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(MerchantAdminClient.class)
                .error("Circuit breaker fallback: merchant-service unavailable for getMerchantById {}. Reason: {}", id, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Merchant service is temporarily unavailable.");
    }

    default MerchantResponseDto updateMerchantStatusFallback(Long id, String status, Throwable t) {
        LoggerFactory.getLogger(MerchantAdminClient.class)
                .error("Circuit breaker fallback: merchant-service unavailable for updateMerchantStatus {}. Reason: {}", id, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Merchant service is temporarily unavailable. Could not update merchant status.");
    }
}
