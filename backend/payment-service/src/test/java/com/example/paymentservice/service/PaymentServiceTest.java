package com.example.paymentservice.service;

import com.example.paymentservice.dto.*;
import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.entity.PaymentStatus;
import com.example.paymentservice.exception.BadRequestException;
import com.example.paymentservice.exception.ResourceNotFoundException;
import com.example.paymentservice.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private PaymentService paymentService;

    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        samplePayment = new Payment();
        samplePayment.setPaymentId(501L);
        samplePayment.setMerchantId(101L);
        samplePayment.setSubscriptionId(10L);
        samplePayment.setAmount(new BigDecimal("1299.00"));
        samplePayment.setPaymentDate(LocalDateTime.now());
        samplePayment.setPaymentMethod("UPI");
        samplePayment.setTransactionReference("TXN-12345678");
        samplePayment.setStatus(PaymentStatus.PENDING);
    }

    private MerchantRevenueProjection createMockProjection(Long merchantId, BigDecimal totalRevenue, Long count) {
        return new MerchantRevenueProjection() {
            @Override
            public Long getMerchantId() { return merchantId; }
            @Override
            public BigDecimal getTotalRevenue() { return totalRevenue; }
            @Override
            public Long getSuccessfulPayments() { return count; }
        };
    }

    @Test
    void shouldCreatePaymentAsVerifiedAndPublishEvent() {
        PaymentRequest req = new PaymentRequest(101L, 10L, new BigDecimal("1299.00"), "UPI");
        samplePayment.setStatus(PaymentStatus.VERIFIED);
        when(paymentRepository.save(any(Payment.class))).thenReturn(samplePayment);

        PaymentResponse response = paymentService.createPayment(req);

        assertNotNull(response);
        assertEquals(PaymentStatus.VERIFIED, response.getStatus());
        assertEquals(new BigDecimal("1299.00"), response.getAmount());
        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(PaymentVerifiedEvent.class));
    }

    @Test
    void shouldVerifyPaymentAndPublishRabbitMqEvent() {
        when(paymentRepository.findById(501L)).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(samplePayment);

        PaymentResponse response = paymentService.verifyPayment(501L, "admin@dealsplatform.com");

        assertEquals(PaymentStatus.VERIFIED, samplePayment.getStatus());
        assertEquals("admin@dealsplatform.com", samplePayment.getVerifiedBy());
        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(PaymentVerifiedEvent.class));
    }

    @Test
    void shouldReturnPaymentWhenVerifyingAlreadyVerifiedPayment() {
        samplePayment.setStatus(PaymentStatus.VERIFIED);
        when(paymentRepository.findById(501L)).thenReturn(Optional.of(samplePayment));

        PaymentResponse response = paymentService.verifyPayment(501L, "admin@dealsplatform.com");

        assertNotNull(response);
        assertEquals(PaymentStatus.VERIFIED, response.getStatus());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void shouldGetRevenueSummaryWithoutDateFilter() {
        when(paymentRepository.calculateTotalVerifiedRevenue()).thenReturn(new BigDecimal("12990.00"));
        when(paymentRepository.findByStatus(PaymentStatus.VERIFIED)).thenReturn(List.of(samplePayment, samplePayment));

        RevenueResponse res = paymentService.getRevenueSummary();

        assertNotNull(res);
        assertEquals(new BigDecimal("12990.00"), res.getTotalRevenue());
        assertEquals(2, res.getTotalVerifiedTransactions());
    }

    @Test
    void shouldGetRevenueSummaryWithDateFilter() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        when(paymentRepository.calculateTotalVerifiedRevenueByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("5999.00"));
        when(paymentRepository.countVerifiedTransactionsByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(3L);

        RevenueResponse res = paymentService.getRevenueSummary(from, to);

        assertNotNull(res);
        assertEquals(new BigDecimal("5999.00"), res.getTotalRevenue());
        assertEquals(3, res.getTotalVerifiedTransactions());
    }

    @Test
    void shouldThrowExceptionWhenFromDateIsAfterToDate() {
        LocalDate from = LocalDate.of(2026, 9, 30);
        LocalDate to = LocalDate.of(2026, 9, 1);

        assertThrows(BadRequestException.class, () -> paymentService.getRevenueSummary(from, to));
        assertThrows(BadRequestException.class, () -> paymentService.getMerchantRevenueSummary(from, to));
        assertThrows(BadRequestException.class, () -> paymentService.getRevenueForMerchant(101L, from, to));
    }

    @Test
    void shouldGetMerchantRevenueSummaryWithoutDateRange() {
        MerchantRevenueProjection p1 = createMockProjection(101L, new BigDecimal("5999.00"), 3L);
        MerchantRevenueProjection p2 = createMockProjection(102L, new BigDecimal("6991.00"), 4L);

        when(paymentRepository.findMerchantRevenueSummary()).thenReturn(List.of(p1, p2));

        List<MerchantRevenueResponse> list = paymentService.getMerchantRevenueSummary(null, null);

        assertNotNull(list);
        assertEquals(2, list.size());
        assertEquals(101L, list.get(0).getMerchantId());
        assertEquals(new BigDecimal("5999.00"), list.get(0).getTotalRevenue());
        assertEquals(3L, list.get(0).getSuccessfulPayments());
        assertEquals(102L, list.get(1).getMerchantId());
        assertEquals(new BigDecimal("6991.00"), list.get(1).getTotalRevenue());
        assertEquals(4L, list.get(1).getSuccessfulPayments());
    }

    @Test
    void shouldGetMerchantRevenueSummaryWithDateRange() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        MerchantRevenueProjection p1 = createMockProjection(101L, new BigDecimal("2999.00"), 1L);

        when(paymentRepository.findMerchantRevenueSummaryByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(p1));

        List<MerchantRevenueResponse> list = paymentService.getMerchantRevenueSummary(from, to);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals(101L, list.get(0).getMerchantId());
        assertEquals(new BigDecimal("2999.00"), list.get(0).getTotalRevenue());
    }

    @Test
    void shouldGetRevenueForMerchantWhenFound() {
        MerchantRevenueProjection p = createMockProjection(101L, new BigDecimal("5999.00"), 3L);
        when(paymentRepository.findRevenueByMerchantId(101L)).thenReturn(Optional.of(p));

        MerchantRevenueResponse res = paymentService.getRevenueForMerchant(101L, null, null);

        assertNotNull(res);
        assertEquals(101L, res.getMerchantId());
        assertEquals(new BigDecimal("5999.00"), res.getTotalRevenue());
        assertEquals(3L, res.getSuccessfulPayments());
    }

    @Test
    void shouldGetZeroRevenueForMerchantWhenNotFound() {
        when(paymentRepository.findRevenueByMerchantId(999L)).thenReturn(Optional.empty());

        MerchantRevenueResponse res = paymentService.getRevenueForMerchant(999L, null, null);

        assertNotNull(res);
        assertEquals(999L, res.getMerchantId());
        assertEquals(new BigDecimal("0.00"), res.getTotalRevenue());
        assertEquals(0L, res.getSuccessfulPayments());
    }
}

