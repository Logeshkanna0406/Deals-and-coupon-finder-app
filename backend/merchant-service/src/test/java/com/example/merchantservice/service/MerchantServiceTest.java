package com.example.merchantservice.service;

import com.example.merchantservice.client.CouponClient;
import com.example.merchantservice.client.SubscriptionClient;
import com.example.merchantservice.dto.MerchantDashboardResponse;
import com.example.merchantservice.dto.MerchantResponse;
import com.example.merchantservice.dto.UpdateMerchantRequest;
import com.example.merchantservice.entity.Merchant;
import com.example.merchantservice.entity.MerchantStatus;
import com.example.merchantservice.exception.BusinessException;
import com.example.merchantservice.exception.ResourceNotFoundException;
import com.example.merchantservice.repository.MerchantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MerchantServiceTest {

    @Mock
    private MerchantRepository merchantRepository;

    @Mock
    private SubscriptionClient subscriptionClient;

    @Mock
    private CouponClient couponClient;

    @InjectMocks
    private MerchantService merchantService;

    private Merchant sampleMerchant;

    @BeforeEach
    void setUp() {
        sampleMerchant = new Merchant();
        sampleMerchant.setMerchantId(101L);
        sampleMerchant.setBusinessName("Pizza Planet");
        sampleMerchant.setOwnerName("John Doe");
        sampleMerchant.setEmail("pizza@planet.com");
        sampleMerchant.setPhone("9876543210");
        sampleMerchant.setCategory("Food & Dining");
        sampleMerchant.setAddress("123 Food Street");
        sampleMerchant.setStatus(MerchantStatus.APPROVED);
        sampleMerchant.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void shouldReturnMerchantById() {
        when(merchantRepository.findById(101L)).thenReturn(Optional.of(sampleMerchant));

        MerchantResponse response = merchantService.getMerchantById(101L);

        assertNotNull(response);
        assertEquals("Pizza Planet", response.getBusinessName());
        assertEquals("pizza@planet.com", response.getEmail());
    }

    @Test
    void shouldThrowExceptionWhenMerchantNotFound() {
        when(merchantRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> merchantService.getMerchantById(999L));
    }

    @Test
    void shouldUpdateMerchantStatusToApproved() {
        sampleMerchant.setStatus(MerchantStatus.PENDING);
        when(merchantRepository.findById(101L)).thenReturn(Optional.of(sampleMerchant));
        when(merchantRepository.save(any(Merchant.class))).thenReturn(sampleMerchant);

        MerchantResponse response = merchantService.updateStatus(101L, MerchantStatus.APPROVED);

        assertNotNull(response);
        assertEquals(MerchantStatus.APPROVED, sampleMerchant.getStatus());
    }

    @Test
    void shouldThrowExceptionWhenPendingMerchantAccessesDashboard() {
        sampleMerchant.setStatus(MerchantStatus.PENDING);
        when(merchantRepository.findById(101L)).thenReturn(Optional.of(sampleMerchant));

        assertThrows(BusinessException.class, () -> merchantService.getDashboard(101L));
    }

    @Test
    void shouldReturnDashboardForApprovedMerchant() {
        when(merchantRepository.findById(101L)).thenReturn(Optional.of(sampleMerchant));
        when(couponClient.getCouponsByMerchantId(101L)).thenReturn(Collections.emptyList());

        MerchantDashboardResponse response = merchantService.getDashboard(101L);

        assertNotNull(response);
        assertEquals("Pizza Planet", response.getMerchantProfile().getBusinessName());
        assertEquals(0, response.getTotalCoupons());
    }
}
