package com.example.merchantservice.service;

import com.example.merchantservice.client.CouponClient;
import com.example.merchantservice.client.SubscriptionClient;
import com.example.merchantservice.dto.*;
import com.example.merchantservice.entity.Merchant;
import com.example.merchantservice.entity.MerchantStatus;
import com.example.merchantservice.exception.BusinessException;
import com.example.merchantservice.exception.ResourceNotFoundException;
import com.example.merchantservice.repository.MerchantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MerchantService {

    private static final Logger log = LoggerFactory.getLogger(MerchantService.class);

    private final MerchantRepository merchantRepository;
    private final SubscriptionClient subscriptionClient;
    private final CouponClient couponClient;

    public MerchantService(MerchantRepository merchantRepository,
                           SubscriptionClient subscriptionClient,
                           CouponClient couponClient) {
        this.merchantRepository = merchantRepository;
        this.subscriptionClient = subscriptionClient;
        this.couponClient = couponClient;
    }

    public MerchantResponse getMerchantById(Long id) {
        log.info("Fetching merchant by ID: {}", id);
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + id));
        return mapToResponse(merchant);
    }

    public List<MerchantResponse> getAllMerchants() {
        log.info("Fetching all merchants for administration");
        return merchantRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MerchantResponse updateMerchant(Long id, UpdateMerchantRequest request) {
        log.info("Updating merchant profile with ID: {}", id);
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + id));

        merchant.setBusinessName(request.getBusinessName());
        merchant.setOwnerName(request.getOwnerName());
        merchant.setPhone(request.getPhone());
        merchant.setCategory(request.getCategory());
        merchant.setAddress(request.getAddress());
        merchant.setDescription(request.getDescription());

        Merchant saved = merchantRepository.save(merchant);
        return mapToResponse(saved);
    }

    @Transactional
    public MerchantProfileDto createInternalMerchant(MerchantProfileDto dto) {
        log.info("Creating internal merchant synced from Auth Service: ID {}", dto.getMerchantId());
        if (merchantRepository.existsById(dto.getMerchantId())) {
            return dto;
        }

        Merchant merchant = new Merchant();
        merchant.setMerchantId(dto.getMerchantId());
        merchant.setBusinessName(dto.getBusinessName());
        merchant.setOwnerName(dto.getOwnerName());
        merchant.setEmail(dto.getEmail());
        merchant.setPhone(dto.getPhone());
        merchant.setCategory(dto.getCategory());
        merchant.setAddress(dto.getAddress());
        merchant.setDescription(dto.getDescription());
        merchant.setStatus(MerchantStatus.PENDING);

        merchantRepository.save(merchant);
        return dto;
    }

    @Transactional
    public MerchantResponse updateStatus(Long id, MerchantStatus newStatus) {
        log.info("Updating merchant status: ID {} -> {}", id, newStatus);
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + id));

        merchant.setStatus(newStatus);
        Merchant saved = merchantRepository.save(merchant);
        return mapToResponse(saved);
    }

    public MerchantDashboardResponse getDashboard(Long id) {
        log.info("Generating dashboard statistics for merchant ID: {}", id);
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + id));

        if (merchant.getStatus() != MerchantStatus.APPROVED) {
            throw new BusinessException("Merchant account is not APPROVED. Current status: " + merchant.getStatus());
        }

        SubscriptionResponse activeSub = null;
        try {
            activeSub = subscriptionClient.getActiveSubscription(id);
        } catch (Exception e) {
            log.warn("Subscription service unavailable: {}", e.getMessage());
        }

        List<CouponResponse> coupons = Collections.emptyList();
        try {
            coupons = couponClient.getCouponsByMerchantId(id);
        } catch (Exception e) {
            log.warn("Coupon service unavailable: {}", e.getMessage());
        }

        int totalCoupons = coupons.size();
        int activeCoupons = (int) coupons.stream().filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus())).count();
        int totalRedemptions = coupons.stream().mapToInt(c -> c.getUsageCount() != null ? c.getUsageCount() : 0).sum();

        return new MerchantDashboardResponse(
                mapToResponse(merchant),
                activeSub,
                totalCoupons,
                activeCoupons,
                totalRedemptions
        );
    }

    private MerchantResponse mapToResponse(Merchant merchant) {
        return new MerchantResponse(
                merchant.getMerchantId(),
                merchant.getBusinessName(),
                merchant.getOwnerName(),
                merchant.getEmail(),
                merchant.getPhone(),
                merchant.getCategory(),
                merchant.getAddress(),
                merchant.getDescription(),
                merchant.getStatus(),
                merchant.getCreatedAt()
        );
    }
}
