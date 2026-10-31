package com.example.customerservice.client;

import com.example.customerservice.dto.CashbackTransactionResponse;
import com.example.customerservice.dto.PointAccountResponse;
import com.example.customerservice.dto.WalletResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@FeignClient(name = "cashback-service")
public interface CashbackClient {

    @GetMapping("/api/cashback/wallet/{customerId}")
    @CircuitBreaker(name = "cashbackService", fallbackMethod = "getWalletFallback")
    @Retry(name = "cashbackService")
    WalletResponse getWalletByCustomerId(@PathVariable("customerId") Long customerId);

    @GetMapping("/api/cashback/transactions/{customerId}")
    @CircuitBreaker(name = "cashbackService", fallbackMethod = "getTransactionsFallback")
    @Retry(name = "cashbackService")
    List<CashbackTransactionResponse> getTransactionsByCustomerId(@PathVariable("customerId") Long customerId);

    @GetMapping("/api/points/customer/{customerId}")
    @CircuitBreaker(name = "cashbackService", fallbackMethod = "getPointAccountFallback")
    @Retry(name = "cashbackService")
    PointAccountResponse getPointAccount(@PathVariable("customerId") Long customerId);

    default WalletResponse getWalletFallback(Long customerId, Throwable t) {
        LoggerFactory.getLogger(CashbackClient.class)
                .warn("Circuit breaker fallback: cashback-service unavailable for wallet query of customer {}. Reason: {}", customerId, t.getMessage());
        return new WalletResponse(null, customerId, BigDecimal.ZERO);
    }

    default List<CashbackTransactionResponse> getTransactionsFallback(Long customerId, Throwable t) {
        LoggerFactory.getLogger(CashbackClient.class)
                .warn("Circuit breaker fallback: cashback-service unavailable for transactions query of customer {}. Reason: {}", customerId, t.getMessage());
        return Collections.emptyList();
    }

    default PointAccountResponse getPointAccountFallback(Long customerId, Throwable t) {
        LoggerFactory.getLogger(CashbackClient.class)
                .warn("Circuit breaker fallback: cashback-service unavailable for points query of customer {}. Reason: {}", customerId, t.getMessage());
        return new PointAccountResponse(customerId, 0);
    }
}
