package com.example.redemptionservice.service;

import com.example.redemptionservice.client.CouponClient;
import com.example.redemptionservice.dto.*;
import com.example.redemptionservice.entity.Redemption;
import com.example.redemptionservice.entity.RedemptionStatus;
import com.example.redemptionservice.exception.BadRequestException;
import com.example.redemptionservice.exception.BusinessException;
import com.example.redemptionservice.exception.ResourceNotFoundException;
import com.example.redemptionservice.repository.RedemptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RedemptionService {

    private static final Logger log = LoggerFactory.getLogger(RedemptionService.class);

    private final RedemptionRepository redemptionRepository;
    private final CouponClient couponClient;
    private final com.example.redemptionservice.client.MerchantClient merchantClient;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.redemption:deals.redemption.exchange}")
    private String redemptionExchange = "deals.redemption.exchange";

    @Value("${rabbitmq.routingkey.coupon-redeemed:coupon.redeemed}")
    private String couponRedeemedRoutingKey = "coupon.redeemed";

    public RedemptionService(RedemptionRepository redemptionRepository,
                             CouponClient couponClient,
                             com.example.redemptionservice.client.MerchantClient merchantClient,
                             RabbitTemplate rabbitTemplate) {
        this.redemptionRepository = redemptionRepository;
        this.couponClient = couponClient;
        this.merchantClient = merchantClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public RedemptionResponse redeemCoupon(CreateRedemptionRequest request, String authUserId, String authUserRole) {
        log.info("Processing coupon redemption: Coupon ID: {}, Customer ID: {}, Purchase Amount: ₹{}",
                request.getCouponId(), request.getCustomerId(), request.getPurchaseAmount());

        // Security check: Customer can only redeem for themselves
        if (authUserId != null && !authUserId.isBlank() && "CUSTOMER".equalsIgnoreCase(authUserRole)) {
            if (!request.getCustomerId().toString().equals(authUserId)) {
                throw new BadRequestException("Access denied: You cannot redeem coupons on behalf of another customer.");
            }
        }

        // ONE CUSTOMER = ONE USE OF ONE COUPON validation
        if (redemptionRepository.existsByCustomerIdAndCouponId(request.getCustomerId(), request.getCouponId())) {
            throw new BusinessException("Customer has already used this coupon.");
        }

        // 1. Fetch and Validate Coupon
        CouponValidationDto coupon = couponClient.getCouponById(request.getCouponId());
        if (coupon == null) {
            throw new ResourceNotFoundException("Coupon not found with ID: " + request.getCouponId());
        }

        if ("HIDDEN".equalsIgnoreCase(coupon.getStatus())) {
            throw new BusinessException("Coupon is currently HIDDEN due to low reliability score and cannot be redeemed.");
        }

        if (!"ACTIVE".equalsIgnoreCase(coupon.getStatus())) {
            throw new BusinessException("Coupon is not ACTIVE. Current status: " + coupon.getStatus());
        }

        if (coupon.getValidFrom() != null && coupon.getValidFrom().isAfter(LocalDateTime.now())) {
            throw new BusinessException("Coupon is not yet valid. Valid from: " + coupon.getValidFrom());
        }

        if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Coupon has expired on: " + coupon.getValidUntil());
        }

        if (coupon.getMinimumPurchase() != null && request.getPurchaseAmount().compareTo(coupon.getMinimumPurchase()) < 0) {
            throw new BusinessException("Purchase amount ₹" + request.getPurchaseAmount() +
                    " does not meet the minimum requirement of ₹" + coupon.getMinimumPurchase());
        }

        if (coupon.getUsageCount() != null && coupon.getUsageLimit() != null && coupon.getUsageCount() >= coupon.getUsageLimit()) {
            throw new BusinessException("Coupon usage limit has been reached (" + coupon.getUsageLimit() + " uses)");
        }

        // Calculate discount amount (e.g. discount cannot exceed purchase amount)
        BigDecimal discountAmount = coupon.getDiscount() != null ? coupon.getDiscount() : BigDecimal.ZERO;
        if (discountAmount.compareTo(request.getPurchaseAmount()) > 0) {
            discountAmount = request.getPurchaseAmount();
        }

        // 2. Increment usage in Coupon Service
        try {
            couponClient.incrementUsage(coupon.getCouponId());
        } catch (Exception e) {
            log.warn("Failed to increment coupon usage count: {}", e.getMessage());
        }

        // 3. Save Redemption record
        Redemption redemption = new Redemption();
        redemption.setCouponId(coupon.getCouponId());
        redemption.setMerchantId(coupon.getMerchantId());
        redemption.setCustomerId(request.getCustomerId());
        redemption.setPurchaseAmount(request.getPurchaseAmount());
        redemption.setDiscountAmount(discountAmount);
        redemption.setRedeemedAt(LocalDateTime.now());
        redemption.setStatus(RedemptionStatus.REDEEMED);

        Redemption saved = redemptionRepository.save(redemption);
        log.info("Coupon redemption successful with ID: {}", saved.getRedemptionId());

        // 4. Publish CouponRedeemedEvent to RabbitMQ (100 points awarded)
        CouponRedeemedEvent event = new CouponRedeemedEvent(
                saved.getRedemptionId(),
                saved.getCouponId(),
                saved.getMerchantId(),
                saved.getCustomerId(),
                saved.getPurchaseAmount(),
                saved.getDiscountAmount(),
                coupon.getCashbackPercentage() != null ? coupon.getCashbackPercentage() : BigDecimal.ZERO,
                saved.getRedeemedAt(),
                10
        );

        try {
            rabbitTemplate.convertAndSend(redemptionExchange, couponRedeemedRoutingKey, event);
            log.info("Published CouponRedeemedEvent to exchange: {} with routingKey: {}", redemptionExchange, couponRedeemedRoutingKey);
        } catch (Exception e) {
            log.error("Failed to publish CouponRedeemedEvent to RabbitMQ: {}", e.getMessage(), e);
        }

        return mapToResponse(saved);
    }

    public RedemptionResponse redeemCoupon(CreateRedemptionRequest request) {
        return redeemCoupon(request, null, null);
    }

    public RedemptionResponse getRedemptionById(Long id) {
        Redemption redemption = redemptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Redemption not found with ID: " + id));
        return mapToResponse(redemption);
    }

    public List<RedemptionResponse> getRedemptionsByCustomerId(Long customerId) {
        return redemptionRepository.findByCustomerId(customerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CustomerRedemptionHistoryResponse getCustomerRedemptionHistory(Long customerId, org.springframework.data.domain.Pageable pageable, String authUserId, String authUserRole) {
        validateCustomerAccess(customerId, authUserId, authUserRole);
        org.springframework.data.domain.Page<Redemption> page = redemptionRepository.findByCustomerIdOrderByRedeemedAtDesc(customerId, pageable);
        List<CustomerRedemptionHistoryItemDto> items = page.getContent().stream()
                .map(this::mapToHistoryItem)
                .collect(Collectors.toList());
        return new CustomerRedemptionHistoryResponse(
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    public List<CustomerRedemptionHistoryItemDto> getRecentRedemptionHistory(Long customerId, int limit, String authUserId, String authUserRole) {
        validateCustomerAccess(customerId, authUserId, authUserRole);
        List<Redemption> list = redemptionRepository.findTop10ByCustomerIdOrderByRedeemedAtDesc(customerId);
        if (limit > 0 && limit < list.size()) {
            list = list.subList(0, limit);
        }
        return list.stream()
                .map(this::mapToHistoryItem)
                .collect(Collectors.toList());
    }

    private void validateCustomerAccess(Long customerId, String authUserId, String authUserRole) {
        if (customerId == null) {
            throw new BadRequestException("Customer ID cannot be null.");
        }
        if (authUserId != null && !authUserId.isBlank() && "CUSTOMER".equalsIgnoreCase(authUserRole)) {
            if (!customerId.toString().equals(authUserId)) {
                throw new BadRequestException("Access denied: You cannot view redemption history of another customer.");
            }
        }
    }

    private CustomerRedemptionHistoryItemDto mapToHistoryItem(Redemption r) {
        String couponTitle = null;
        String couponCode = null;
        String merchantName = null;

        if (r.getCouponId() != null) {
            try {
                CouponValidationDto coupon = couponClient.getCouponById(r.getCouponId());
                if (coupon != null) {
                    couponTitle = coupon.getTitle();
                    couponCode = coupon.getCouponCode();
                }
            } catch (Exception e) {
                log.warn("Could not fetch coupon details for coupon ID {}: {}", r.getCouponId(), e.getMessage());
            }
        }

        if (r.getMerchantId() != null) {
            try {
                MerchantResponseDto merchant = merchantClient.getMerchantById(r.getMerchantId());
                if (merchant != null) {
                    merchantName = merchant.getBusinessName();
                }
            } catch (Exception e) {
                log.warn("Could not fetch merchant details for merchant ID {}: {}", r.getMerchantId(), e.getMessage());
            }
        }

        return new CustomerRedemptionHistoryItemDto(
                r.getRedemptionId(),
                r.getCouponId(),
                couponTitle,
                couponCode,
                r.getMerchantId(),
                merchantName,
                r.getRedeemedAt(),
                r.getPurchaseAmount(),
                r.getDiscountAmount(),
                10,
                r.getStatus() != null ? r.getStatus().name() : null
        );
    }

    public List<RedemptionResponse> getRedemptionsByMerchantId(Long merchantId) {
        return redemptionRepository.findByMerchantId(merchantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public boolean hasCustomerRedeemed(Long customerId, Long couponId) {
        if (customerId == null || couponId == null) {
            return false;
        }
        return redemptionRepository.existsByCustomerIdAndCouponId(customerId, couponId);
    }

    private RedemptionResponse mapToResponse(Redemption r) {
        return new RedemptionResponse(
                r.getRedemptionId(),
                r.getCouponId(),
                r.getMerchantId(),
                r.getCustomerId(),
                r.getRedeemedAt(),
                r.getPurchaseAmount(),
                r.getDiscountAmount(),
                r.getStatus(),
                10
        );
    }
}
