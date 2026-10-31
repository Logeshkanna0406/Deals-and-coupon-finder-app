package com.example.adminservice.client;

import com.example.adminservice.dto.MerchantRevenueResponseDto;
import com.example.adminservice.dto.PaymentResponseDto;
import com.example.adminservice.dto.RevenueResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@FeignClient(name = "payment-service")
public interface PaymentAdminClient {

    @GetMapping("/api/payments")
    @CircuitBreaker(name = "paymentAdminService", fallbackMethod = "getAllPaymentsFallback")
    @Retry(name = "paymentAdminService")
    List<PaymentResponseDto> getAllPayments();

    @PutMapping("/api/payments/{id}/verify")
    @CircuitBreaker(name = "paymentAdminService", fallbackMethod = "verifyPaymentFallback")
    @Retry(name = "paymentAdminService")
    PaymentResponseDto verifyPayment(@PathVariable("id") Long id);

    @PutMapping("/api/payments/{id}/reject")
    @CircuitBreaker(name = "paymentAdminService", fallbackMethod = "rejectPaymentFallback")
    @Retry(name = "paymentAdminService")
    PaymentResponseDto rejectPayment(@PathVariable("id") Long id);

    @GetMapping("/api/payments/revenue")
    @CircuitBreaker(name = "paymentAdminService", fallbackMethod = "getRevenueSummaryFallback")
    @Retry(name = "paymentAdminService")
    RevenueResponseDto getRevenueSummary(
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate);

    @GetMapping("/api/payments/revenue/merchants")
    @CircuitBreaker(name = "paymentAdminService", fallbackMethod = "getMerchantRevenueSummaryFallback")
    @Retry(name = "paymentAdminService")
    List<MerchantRevenueResponseDto> getMerchantRevenueSummary(
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate);

    @GetMapping("/api/payments/revenue/merchants/{merchantId}")
    @CircuitBreaker(name = "paymentAdminService", fallbackMethod = "getRevenueForMerchantFallback")
    @Retry(name = "paymentAdminService")
    MerchantRevenueResponseDto getRevenueForMerchant(
            @PathVariable("merchantId") Long merchantId,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate);

    default List<PaymentResponseDto> getAllPaymentsFallback(Throwable t) {
        LoggerFactory.getLogger(PaymentAdminClient.class)
                .warn("Circuit breaker fallback: payment-service unavailable for getAllPayments. Reason: {}", t.getMessage());
        return Collections.emptyList();
    }

    default PaymentResponseDto verifyPaymentFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(PaymentAdminClient.class)
                .error("Circuit breaker fallback: payment-service unavailable for verifyPayment {}. Reason: {}", id, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Payment service is temporarily unavailable. Could not verify payment.");
    }

    default PaymentResponseDto rejectPaymentFallback(Long id, Throwable t) {
        LoggerFactory.getLogger(PaymentAdminClient.class)
                .error("Circuit breaker fallback: payment-service unavailable for rejectPayment {}. Reason: {}", id, t.getMessage());
        throw new com.example.adminservice.exception.BadRequestException("Payment service is temporarily unavailable. Could not reject payment.");
    }

    default RevenueResponseDto getRevenueSummaryFallback(LocalDate fromDate, LocalDate toDate, Throwable t) {
        LoggerFactory.getLogger(PaymentAdminClient.class)
                .warn("Circuit breaker fallback: payment-service unavailable for revenue summary. Reason: {}", t.getMessage());
        return new RevenueResponseDto(BigDecimal.ZERO, 0L);
    }

    default List<MerchantRevenueResponseDto> getMerchantRevenueSummaryFallback(LocalDate fromDate, LocalDate toDate, Throwable t) {
        LoggerFactory.getLogger(PaymentAdminClient.class)
                .warn("Circuit breaker fallback: payment-service unavailable for merchant revenue summary. Reason: {}", t.getMessage());
        return Collections.emptyList();
    }

    default MerchantRevenueResponseDto getRevenueForMerchantFallback(Long merchantId, LocalDate fromDate, LocalDate toDate, Throwable t) {
        LoggerFactory.getLogger(PaymentAdminClient.class)
                .warn("Circuit breaker fallback: payment-service unavailable for merchant {} revenue. Reason: {}", merchantId, t.getMessage());
        return new MerchantRevenueResponseDto(merchantId, BigDecimal.ZERO, 0L);
    }
}
