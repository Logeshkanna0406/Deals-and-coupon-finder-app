package com.example.paymentservice.service;

import com.example.paymentservice.dto.*;
import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.entity.PaymentStatus;
import com.example.paymentservice.exception.BadRequestException;
import com.example.paymentservice.exception.ResourceNotFoundException;
import com.example.paymentservice.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.payment:deals.payment.exchange}")
    private String paymentExchange = "deals.payment.exchange";

    @Value("${rabbitmq.routingkey.payment-verified:payment.verified}")
    private String paymentVerifiedRoutingKey = "payment.verified";

    public PaymentService(PaymentRepository paymentRepository, RabbitTemplate rabbitTemplate) {
        this.paymentRepository = paymentRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        log.info("Processing payment for merchantId: {}, subscriptionId: {}, amount: {}", request.getMerchantId(), request.getSubscriptionId(), request.getAmount());

        Payment payment = new Payment();
        payment.setMerchantId(request.getMerchantId());
        payment.setSubscriptionId(request.getSubscriptionId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "MOCK_GATEWAY");
        payment.setTransactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setStatus(PaymentStatus.VERIFIED);
        payment.setVerifiedBy("MERCHANT_PAYMENT_GATEWAY");
        payment.setVerifiedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        log.info("Payment completed successfully with ID: {} and Ref: {} (Status: VERIFIED)", saved.getPaymentId(), saved.getTransactionReference());

        // Automatically publish PaymentVerifiedEvent to RabbitMQ to activate subscription
        PaymentVerifiedEvent event = new PaymentVerifiedEvent(
                saved.getPaymentId(),
                saved.getMerchantId(),
                saved.getSubscriptionId(),
                saved.getAmount(),
                saved.getVerifiedAt()
        );

        try {
            rabbitTemplate.convertAndSend(paymentExchange, paymentVerifiedRoutingKey, event);
            log.info("Published PaymentVerifiedEvent to exchange: {} with routingKey: {}", paymentExchange, paymentVerifiedRoutingKey);
        } catch (Exception e) {
            log.error("Failed to publish PaymentVerifiedEvent to RabbitMQ: {}", e.getMessage(), e);
        }

        return mapToResponse(saved);
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));
        return mapToResponse(payment);
    }

    public List<PaymentResponse> getPaymentsByMerchantId(Long merchantId) {
        return paymentRepository.findByMerchantId(merchantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentResponse verifyPayment(Long id, String adminEmail) {
        log.info("Admin [{}] verifying payment ID: {}", adminEmail, id);

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));

        if (payment.getStatus() == PaymentStatus.VERIFIED) {
            log.info("Payment ID: {} is already VERIFIED, returning idempotent response", id);
            return mapToResponse(payment);
        }

        payment.setStatus(PaymentStatus.VERIFIED);
        payment.setVerifiedBy(adminEmail != null ? adminEmail : "ADMIN");
        payment.setVerifiedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        log.info("Payment ID: {} marked as VERIFIED", saved.getPaymentId());

        // Publish PaymentVerifiedEvent to RabbitMQ
        PaymentVerifiedEvent event = new PaymentVerifiedEvent(
                saved.getPaymentId(),
                saved.getMerchantId(),
                saved.getSubscriptionId(),
                saved.getAmount(),
                saved.getVerifiedAt()
        );

        try {
            rabbitTemplate.convertAndSend(paymentExchange, paymentVerifiedRoutingKey, event);
            log.info("Published PaymentVerifiedEvent to exchange: {} with routingKey: {}", paymentExchange, paymentVerifiedRoutingKey);
        } catch (Exception e) {
            log.error("Failed to publish PaymentVerifiedEvent to RabbitMQ: {}", e.getMessage(), e);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public PaymentResponse rejectPayment(Long id, String adminEmail) {
        log.info("Admin [{}] rejecting payment ID: {}", adminEmail, id);

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));

        payment.setStatus(PaymentStatus.REJECTED);
        payment.setVerifiedBy(adminEmail != null ? adminEmail : "ADMIN");
        payment.setVerifiedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        return mapToResponse(saved);
    }

    public RevenueResponse getRevenueSummary() {
        return getRevenueSummary(null, null);
    }

    public RevenueResponse getRevenueSummary(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        LocalDateTime startDate = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime endDate = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

        BigDecimal totalRevenue;
        long verifiedCount;

        if (startDate != null || endDate != null) {
            totalRevenue = paymentRepository.calculateTotalVerifiedRevenueByDateRange(startDate, endDate);
            verifiedCount = paymentRepository.countVerifiedTransactionsByDateRange(startDate, endDate);
        } else {
            totalRevenue = paymentRepository.calculateTotalVerifiedRevenue();
            verifiedCount = paymentRepository.findByStatus(PaymentStatus.VERIFIED).size();
        }

        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        return new RevenueResponse(totalRevenue.setScale(2, RoundingMode.HALF_UP), verifiedCount);
    }

    public List<MerchantRevenueResponse> getMerchantRevenueSummary(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        LocalDateTime startDate = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime endDate = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

        List<MerchantRevenueProjection> projections;
        if (startDate != null || endDate != null) {
            projections = paymentRepository.findMerchantRevenueSummaryByDateRange(startDate, endDate);
        } else {
            projections = paymentRepository.findMerchantRevenueSummary();
        }

        return projections.stream()
                .map(p -> new MerchantRevenueResponse(
                        p.getMerchantId(),
                        p.getTotalRevenue() != null ? p.getTotalRevenue().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                        p.getSuccessfulPayments() != null ? p.getSuccessfulPayments() : 0L
                ))
                .collect(Collectors.toList());
    }

    public MerchantRevenueResponse getRevenueForMerchant(Long merchantId, LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        LocalDateTime startDate = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime endDate = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

        var projectionOpt = (startDate != null || endDate != null)
                ? paymentRepository.findRevenueByMerchantIdAndDateRange(merchantId, startDate, endDate)
                : paymentRepository.findRevenueByMerchantId(merchantId);

        return projectionOpt.map(p -> new MerchantRevenueResponse(
                merchantId,
                p.getTotalRevenue() != null ? p.getTotalRevenue().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                p.getSuccessfulPayments() != null ? p.getSuccessfulPayments() : 0L
        )).orElseGet(() -> new MerchantRevenueResponse(
                merchantId,
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                0L
        ));
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate cannot be after toDate");
        }
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return new PaymentResponse(
                payment.getPaymentId(),
                payment.getMerchantId(),
                payment.getSubscriptionId(),
                payment.getAmount(),
                payment.getPaymentDate(),
                payment.getPaymentMethod(),
                payment.getTransactionReference(),
                payment.getStatus(),
                payment.getVerifiedBy(),
                payment.getVerifiedAt()
        );
    }
}

