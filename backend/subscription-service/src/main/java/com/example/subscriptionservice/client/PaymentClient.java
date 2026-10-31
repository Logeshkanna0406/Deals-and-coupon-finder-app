package com.example.subscriptionservice.client;

import com.example.subscriptionservice.dto.PaymentRequestDto;
import com.example.subscriptionservice.dto.PaymentResponseDto;
import com.example.subscriptionservice.exception.ServiceUnavailableException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service")
public interface PaymentClient {

    @PostMapping("/api/payments")
    @CircuitBreaker(name = "paymentService", fallbackMethod = "createPaymentFallback")
    @Retry(name = "paymentService")
    PaymentResponseDto createPayment(@RequestBody PaymentRequestDto request);

    default PaymentResponseDto createPaymentFallback(PaymentRequestDto request, Throwable t) {
        LoggerFactory.getLogger(PaymentClient.class)
                .error("Circuit breaker triggered: payment-service unavailable for subscription purchase. Reason: {}", t.getMessage());
        throw new ServiceUnavailableException("Payment gateway is temporarily unreachable. Please try again.");
    }
}
