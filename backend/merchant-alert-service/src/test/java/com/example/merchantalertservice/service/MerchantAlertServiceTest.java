package com.example.merchantalertservice.service;

import com.example.merchantalertservice.client.MerchantClient;
import com.example.merchantalertservice.dto.*;
import com.example.merchantalertservice.entity.*;
import com.example.merchantalertservice.exception.BadRequestException;
import com.example.merchantalertservice.repository.AlertPreferenceRepository;
import com.example.merchantalertservice.repository.MerchantCouponNotificationRepository;
import com.example.merchantalertservice.repository.MerchantCustomerInterestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MerchantAlertServiceTest {

    @Mock
    private MerchantCustomerInterestRepository interestRepository;

    @Mock
    private MerchantCouponNotificationRepository notificationRepository;

    @Mock
    private AlertPreferenceRepository preferenceRepository;

    @Mock
    private MerchantClient merchantClient;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private MerchantAlertService merchantAlertService;

    private CouponCreatedEvent sampleCouponEvent;

    @BeforeEach
    void setUp() {
        sampleCouponEvent = new CouponCreatedEvent(
                1L, 101L, "50% Off Pizza", "Flat 50% discount",
                "Food & Dining", "PIZZA50", new BigDecimal("50.00"),
                new BigDecimal("5.00"), new BigDecimal("500.00"),
                LocalDateTime.now(), LocalDateTime.now().plusDays(30),
                "ACTIVE", LocalDateTime.now()
        );
    }

    @Test
    void shouldRecordRedemptionInterestIfNotExists() {
        when(interestRepository.existsByCustomerIdAndMerchantId(2L, 101L)).thenReturn(false);

        merchantAlertService.recordCustomerRedemptionInterest(2L, 101L);

        verify(interestRepository, times(1)).save(argThat(i ->
                i.getCustomerId().equals(2L) &&
                i.getMerchantId().equals(101L) &&
                i.getSource() == InterestSource.REDEMPTION
        ));
    }

    @Test
    void shouldNotDuplicateRedemptionInterestIfExists() {
        when(interestRepository.existsByCustomerIdAndMerchantId(2L, 101L)).thenReturn(true);

        merchantAlertService.recordCustomerRedemptionInterest(2L, 101L);

        verify(interestRepository, never()).save(any(MerchantCustomerInterest.class));
    }

    @Test
    void shouldProcessCouponCreatedAlertsForInterestedCustomers() {
        MerchantCustomerInterest interest = new MerchantCustomerInterest(2L, 101L, InterestSource.REDEMPTION);
        when(interestRepository.findByMerchantId(101L)).thenReturn(List.of(interest));
        when(merchantClient.getMerchantById(101L)).thenReturn(new MerchantResponseDto(101L, "Pizza Planet"));
        when(notificationRepository.existsByCustomerIdAndCouponId(2L, 1L)).thenReturn(false);
        when(preferenceRepository.findByCustomerId(2L)).thenReturn(Optional.of(new AlertPreference(2L, true, true, true)));

        merchantAlertService.processCouponCreatedAlerts(sampleCouponEvent);

        verify(notificationRepository, times(1)).save(any(MerchantCouponNotification.class));
        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(MerchantCouponAlertEvent.class));
    }

    @Test
    void shouldSkipAlertIfCustomerAlreadyNotified() {
        MerchantCustomerInterest interest = new MerchantCustomerInterest(2L, 101L, InterestSource.REDEMPTION);
        when(interestRepository.findByMerchantId(101L)).thenReturn(List.of(interest));
        when(merchantClient.getMerchantById(101L)).thenReturn(new MerchantResponseDto(101L, "Pizza Planet"));
        when(notificationRepository.existsByCustomerIdAndCouponId(2L, 1L)).thenReturn(true);

        merchantAlertService.processCouponCreatedAlerts(sampleCouponEvent);

        verify(notificationRepository, never()).save(any(MerchantCouponNotification.class));
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(MerchantCouponAlertEvent.class));
    }

    @Test
    void shouldSkipAlertIfAllChannelsDisabledInPreferences() {
        MerchantCustomerInterest interest = new MerchantCustomerInterest(2L, 101L, InterestSource.REDEMPTION);
        when(interestRepository.findByMerchantId(101L)).thenReturn(List.of(interest));
        when(merchantClient.getMerchantById(101L)).thenReturn(new MerchantResponseDto(101L, "Pizza Planet"));
        when(notificationRepository.existsByCustomerIdAndCouponId(2L, 1L)).thenReturn(false);
        when(preferenceRepository.findByCustomerId(2L)).thenReturn(Optional.of(new AlertPreference(2L, false, false, false)));

        merchantAlertService.processCouponCreatedAlerts(sampleCouponEvent);

        verify(notificationRepository, never()).save(any(MerchantCouponNotification.class));
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(MerchantCouponAlertEvent.class));
    }

    @Test
    void shouldFollowMerchantManually() {
        when(interestRepository.findByCustomerIdAndMerchantId(2L, 101L)).thenReturn(Optional.empty());
        MerchantCustomerInterest savedInterest = new MerchantCustomerInterest(2L, 101L, InterestSource.MANUAL_FOLLOW);
        savedInterest.setId(10L);
        when(interestRepository.save(any(MerchantCustomerInterest.class))).thenReturn(savedInterest);
        when(merchantClient.getMerchantById(101L)).thenReturn(new MerchantResponseDto(101L, "Pizza Planet"));

        MerchantInterestResponse response = merchantAlertService.followMerchant(2L, 101L, "2", "CUSTOMER");

        assertNotNull(response);
        assertEquals(2L, response.getCustomerId());
        assertEquals(101L, response.getMerchantId());
        assertEquals("Pizza Planet", response.getMerchantName());
        assertEquals(InterestSource.MANUAL_FOLLOW, response.getSource());
    }

    @Test
    void shouldUnfollowMerchant() {
        merchantAlertService.unfollowMerchant(2L, 101L, "2", "CUSTOMER");
        verify(interestRepository, times(1)).deleteByCustomerIdAndMerchantId(2L, 101L);
    }

    @Test
    void shouldDenyAccessToOtherCustomerAlerts() {
        assertThrows(BadRequestException.class, () ->
                merchantAlertService.getCustomerInterests(2L, "3", "CUSTOMER"));
    }

    @Test
    void shouldUpdateAlertPreferences() {
        AlertPreference pref = new AlertPreference(2L, true, true, true);
        when(preferenceRepository.findByCustomerId(2L)).thenReturn(Optional.of(pref));
        when(preferenceRepository.save(any(AlertPreference.class))).thenAnswer(i -> i.getArgument(0));

        UpdateAlertPreferenceRequest req = new UpdateAlertPreferenceRequest(2L, true, false, true);
        AlertPreferenceResponse updated = merchantAlertService.updateAlertPreference(req, "2", "CUSTOMER");

        assertNotNull(updated);
        assertTrue(updated.isEmailEnabled());
        assertFalse(updated.isSmsEnabled());
        assertTrue(updated.isInAppEnabled());
    }
}
