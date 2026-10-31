package com.example.couponservice.service;

import com.example.couponservice.client.MerchantClient;
import com.example.couponservice.client.RedemptionClient;
import com.example.couponservice.client.SubscriptionClient;
import com.example.couponservice.dto.*;
import com.example.couponservice.entity.Coupon;
import com.example.couponservice.entity.CouponStatus;
import com.example.couponservice.entity.CouponVote;
import com.example.couponservice.entity.VoteType;
import com.example.couponservice.exception.BadRequestException;
import com.example.couponservice.exception.BusinessException;
import com.example.couponservice.exception.ResourceNotFoundException;
import com.example.couponservice.repository.CouponRepository;
import com.example.couponservice.repository.CouponVoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CouponService {

    private static final Logger log = LoggerFactory.getLogger(CouponService.class);

    private final CouponRepository couponRepository;
    private final CouponVoteRepository couponVoteRepository;
    private final MerchantClient merchantClient;
    private final SubscriptionClient subscriptionClient;
    private final RedemptionClient redemptionClient;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.coupon:deals.coupon.exchange}")
    private String couponExchange = "deals.coupon.exchange";

    @Value("${rabbitmq.routingkey.coupon-created:coupon.created}")
    private String couponCreatedRoutingKey = "coupon.created";

    @Value("${coupon.voting.minimum-threshold:10}")
    private int minimumVoteThreshold = 10;

    public CouponService(CouponRepository couponRepository,
                         CouponVoteRepository couponVoteRepository,
                         MerchantClient merchantClient,
                         SubscriptionClient subscriptionClient,
                         RedemptionClient redemptionClient,
                         org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate) {
        this.couponRepository = couponRepository;
        this.couponVoteRepository = couponVoteRepository;
        this.merchantClient = merchantClient;
        this.subscriptionClient = subscriptionClient;
        this.redemptionClient = redemptionClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    public void setMinimumVoteThreshold(int minimumVoteThreshold) {
        this.minimumVoteThreshold = minimumVoteThreshold;
    }

    public int getMinimumVoteThreshold() {
        return minimumVoteThreshold;
    }

    @Transactional
    public CouponResponse createCoupon(CreateCouponRequest request, String authUserId, String authUserRole) {
        log.info("Creating coupon for merchant ID: {}, Code: {}", request.getMerchantId(), request.getCouponCode());

        // Security check: Merchant can only create coupons for themselves
        if (authUserId != null && !authUserId.isBlank() && "MERCHANT".equalsIgnoreCase(authUserRole)) {
            if (!request.getMerchantId().toString().equals(authUserId)) {
                throw new BadRequestException("Access denied: You cannot create coupons for another merchant.");
            }
        }

        // RULE 1: Merchant must be APPROVED
        try {
            MerchantResponseDto merchant = merchantClient.getMerchantById(request.getMerchantId());
            if (merchant == null || !"APPROVED".equalsIgnoreCase(merchant.getStatus())) {
                throw new BusinessException("Only an APPROVED merchant can create coupons. Current merchant status: " + (merchant != null ? merchant.getStatus() : "NOT_FOUND"));
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Merchant service check skipped or warning: {}", e.getMessage());
        }

        // RULE 2: Merchant must have an ACTIVE subscription
        SubscriptionResponseDto activeSub;
        try {
            activeSub = subscriptionClient.getActiveSubscription(request.getMerchantId());
        } catch (Exception e) {
            throw new BusinessException("No active subscription. Please purchase a subscription plan to create coupons.");
        }

        if (activeSub == null || !"ACTIVE".equalsIgnoreCase(activeSub.getStatus())) {
            throw new BusinessException("No active subscription. Please purchase a subscription plan to create coupons.");
        }

        // RULE 3: Verify subscription belongs to the authenticated merchant
        if (activeSub.getMerchantId() != null && !activeSub.getMerchantId().equals(request.getMerchantId())) {
            throw new BadRequestException("Merchant cannot use another merchant's subscription.");
        }

        // RULE 4: Subscription coupon limit check
        int couponsGenerated = activeSub.getCouponsGenerated() != null ? activeSub.getCouponsGenerated() : 0;
        int couponLimit = activeSub.getCouponLimit() != null ? activeSub.getCouponLimit() : Integer.MAX_VALUE;
        if (couponsGenerated >= couponLimit) {
            throw new BusinessException("Coupon creation limit reached for your current subscription plan.");
        }

        // RULE 5: Calculate and validate validFrom and validUntil (Hour-based validity support)
        LocalDateTime validFrom;
        LocalDateTime validUntil;

        if (request.getValidityHours() != null) {
            if (request.getValidityHours() <= 0) {
                throw new BadRequestException("validityHours must be greater than 0");
            }
            validFrom = request.getValidFrom() != null ? request.getValidFrom() : LocalDateTime.now();
            validUntil = validFrom.plusHours(request.getValidityHours());
        } else {
            if (request.getValidUntil() == null) {
                throw new BadRequestException("Either validityHours or validUntil must be provided");
            }
            validFrom = request.getValidFrom() != null ? request.getValidFrom() : LocalDateTime.now();
            validUntil = request.getValidUntil();
        }

        if (validFrom.isAfter(validUntil)) {
            throw new BadRequestException("Coupon validFrom cannot be after validUntil.");
        }

        // Active subscription must not be expired
        if (activeSub.getEndDate() != null && activeSub.getEndDate().isBefore(java.time.LocalDate.now())) {
            throw new BusinessException("No active subscription. Please purchase a subscription plan to create coupons.");
        }

        // RULE: Coupon validity end date cannot exceed the active subscription end date
        if (activeSub.getEndDate() != null && validUntil.toLocalDate().isAfter(activeSub.getEndDate())) {
            throw new BadRequestException("Coupon validity end date (" + validUntil.toLocalDate() + ") cannot exceed your active subscription end date (" + activeSub.getEndDate() + ").");
        }

        if (couponRepository.findByCouponCode(request.getCouponCode()).isPresent()) {
            throw new BadRequestException("Coupon code already exists: " + request.getCouponCode());
        }

        Coupon coupon = new Coupon();
        coupon.setMerchantId(request.getMerchantId());
        coupon.setSubscriptionId(activeSub.getSubscriptionId());
        coupon.setTitle(request.getTitle());
        coupon.setDescription(request.getDescription());
        coupon.setCategory(request.getCategory());
        coupon.setDiscount(request.getDiscount());
        coupon.setCashbackPercentage(request.getCashbackPercentage() != null ? request.getCashbackPercentage() : BigDecimal.ZERO);
        coupon.setCouponCode(request.getCouponCode().toUpperCase());
        coupon.setMinimumPurchase(request.getMinimumPurchase());
        coupon.setValidFrom(validFrom);
        coupon.setValidUntil(validUntil);
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setUsageCount(0);
        coupon.setStatus(CouponStatus.PENDING_APPROVAL);
        coupon.setUpvoteCount(0);
        coupon.setDownvoteCount(0);
        coupon.setReliabilityScore(BigDecimal.ZERO);

        Coupon saved = couponRepository.save(coupon);
        log.info("Coupon created successfully with ID: {} under subscription ID: {} (Status: PENDING_APPROVAL)",
                saved.getCouponId(), activeSub.getSubscriptionId());

        // Increment coupon count in subscription-service
        try {
            subscriptionClient.incrementCouponCount(activeSub.getSubscriptionId());
        } catch (Exception e) {
            log.error("Failed to increment coupon count for subscription ID {}: {}", activeSub.getSubscriptionId(), e.getMessage());
        }

        // Note: Coupon is created with status PENDING_APPROVAL.
        // Notification events are only published when admin approves the coupon in approveCoupon().

        return mapToResponse(saved);
    }

    public CouponResponse createCoupon(CreateCouponRequest request) {
        return createCoupon(request, null, null);
    }

    @Transactional
    public VoteResponse castVote(Long couponId, VoteRequest request, String authUserId, String authUserRole) {
        log.info("Processing vote for coupon ID: {}, voteType: {}", couponId, request.getVoteType());

        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + couponId));

        // 1. Resolve customer ID
        Long customerId = null;
        if (authUserId != null && !authUserId.isBlank() && "CUSTOMER".equalsIgnoreCase(authUserRole)) {
            try {
                customerId = Long.parseLong(authUserId);
            } catch (NumberFormatException ignored) {}
        }
        if (customerId == null) {
            customerId = request.getCustomerId();
        }
        if (customerId == null) {
            throw new BadRequestException("Customer ID is required to cast a vote.");
        }

        // 2. Eligibility check: Customer must have redeemed the coupon
        try {
            boolean hasRedeemed = redemptionClient.hasCustomerRedeemed(customerId, couponId);
            if (!hasRedeemed) {
                throw new BusinessException("You can only vote for coupons you have used/redeemed.");
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.warn("Redemption client check error/bypass in testing: {}", e.getMessage());
        }

        // 3. Upsert Vote record
        Optional<CouponVote> existingVoteOpt = couponVoteRepository.findByCustomerIdAndCouponId(customerId, couponId);
        CouponVote vote;
        String message;
        if (existingVoteOpt.isPresent()) {
            vote = existingVoteOpt.get();
            vote.setVoteType(request.getVoteType());
            vote.setUpdatedAt(LocalDateTime.now());
            message = "Vote updated successfully to " + request.getVoteType();
        } else {
            vote = new CouponVote(couponId, customerId, request.getVoteType());
            message = "Vote recorded successfully as " + request.getVoteType();
        }
        couponVoteRepository.save(vote);

        // 4. Recalculate vote counts & Wilson confidence score
        long upvotes = couponVoteRepository.countByCouponIdAndVoteType(couponId, VoteType.UPVOTE);
        long downvotes = couponVoteRepository.countByCouponIdAndVoteType(couponId, VoteType.DOWNVOTE);
        long totalVotes = upvotes + downvotes;

        BigDecimal rawReliability = BigDecimal.ZERO;
        if (totalVotes > 0) {
            rawReliability = BigDecimal.valueOf(upvotes)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalVotes), 2, RoundingMode.HALF_UP);
        }

        BigDecimal wilsonScore = calculateWilsonScore(upvotes, downvotes);

        coupon.setUpvoteCount((int) upvotes);
        coupon.setDownvoteCount((int) downvotes);
        coupon.setReliabilityScore(wilsonScore);

        // 5. Automatic Hiding / Recovery based on threshold (using raw reliability < 40%)
        if (totalVotes >= minimumVoteThreshold) {
            if (rawReliability.compareTo(BigDecimal.valueOf(40.00)) < 0) {
                if (coupon.getStatus() == CouponStatus.ACTIVE) {
                    coupon.setStatus(CouponStatus.HIDDEN);
                    log.warn("Coupon ID: {} automatically HIDDEN due to low raw reliability: {}% (Wilson Score: {}%, {} votes)",
                            couponId, rawReliability, wilsonScore, totalVotes);
                }
            } else {
                if (coupon.getStatus() == CouponStatus.HIDDEN) {
                    coupon.setStatus(CouponStatus.ACTIVE);
                    log.info("Coupon ID: {} restored to ACTIVE with raw reliability: {}% (Wilson Score: {}%, {} votes)",
                            couponId, rawReliability, wilsonScore, totalVotes);
                }
            }
        }

        Coupon saved = couponRepository.save(coupon);

        return new VoteResponse(
                couponId,
                customerId,
                vote.getVoteType(),
                saved.getUpvoteCount(),
                saved.getDownvoteCount(),
                saved.getUpvoteCount() + saved.getDownvoteCount(),
                saved.getReliabilityScore(),
                saved.getStatus(),
                message
        );
    }

    /**
     * Calculates the lower bound of the Wilson Score Confidence Interval (z = 1.96 for 95% confidence).
     * Returns a percentage value (0.00 to 100.00) scaled to 2 decimal places.
     * Safely returns 0.00 for zero votes.
     */
    public BigDecimal calculateWilsonScore(long upvotes, long downvotes) {
        long totalVotes = upvotes + downvotes;
        if (totalVotes <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        double z = 1.96; // 95% confidence
        double zSquared = z * z; // 3.8416
        double n = (double) totalVotes;
        double p = (double) upvotes / n;

        double numerator = p + (zSquared / (2.0 * n)) - z * Math.sqrt((p * (1.0 - p) + (zSquared / (4.0 * n))) / n);
        double denominator = 1.0 + (zSquared / n);

        double wilsonLowerBound = numerator / denominator;
        double scorePercentage = Math.max(0.0, wilsonLowerBound * 100.0);

        return BigDecimal.valueOf(scorePercentage).setScale(2, RoundingMode.HALF_UP);
    }

    public VoteResponse castVote(Long couponId, VoteRequest request) {
        return castVote(couponId, request, null, null);
    }

    public CouponReliabilityResponse getCouponReliability(Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + couponId));

        int upvotes = coupon.getUpvoteCount() != null ? coupon.getUpvoteCount() : 0;
        int downvotes = coupon.getDownvoteCount() != null ? coupon.getDownvoteCount() : 0;
        int total = upvotes + downvotes;
        BigDecimal score = coupon.getReliabilityScore() != null ? coupon.getReliabilityScore() : BigDecimal.ZERO;

        return new CouponReliabilityResponse(
                coupon.getCouponId(),
                upvotes,
                downvotes,
                total,
                score,
                minimumVoteThreshold,
                coupon.getStatus()
        );
    }

    public List<CouponResponse> getRankedActiveCoupons() {
        log.info("Fetching ranked active coupons for customer discovery");
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findByStatus(CouponStatus.ACTIVE).stream()
                .filter(c -> !c.getValidUntil().isBefore(now))
                .filter(c -> !c.getValidFrom().isAfter(now))
                .filter(c -> c.getUsageCount() < c.getUsageLimit())
                .sorted(Comparator
                        .comparing(Coupon::getReliabilityScore, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(c -> (c.getUpvoteCount() != null ? c.getUpvoteCount() : 0) + (c.getDownvoteCount() != null ? c.getDownvoteCount() : 0), Comparator.reverseOrder())
                        .thenComparing(Coupon::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Coupon::getCouponId, Comparator.reverseOrder()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CouponResponse> getActiveCoupons() {
        log.info("Fetching all active coupons for customer discovery");
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findByStatus(CouponStatus.ACTIVE).stream()
                .filter(c -> !c.getValidUntil().isBefore(now))
                .filter(c -> !c.getValidFrom().isAfter(now))
                .filter(c -> c.getUsageCount() < c.getUsageLimit())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CouponResponse> getActiveCouponsByCategory(String category) {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findByCategoryAndStatus(category, CouponStatus.ACTIVE).stream()
                .filter(c -> !c.getValidUntil().isBefore(now))
                .filter(c -> !c.getValidFrom().isAfter(now))
                .filter(c -> c.getUsageCount() < c.getUsageLimit())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CouponResponse> getCouponsByMerchantId(Long merchantId) {
        return couponRepository.findByMerchantId(merchantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CouponResponse> getCouponsBySubscriptionId(Long subscriptionId) {
        return couponRepository.findBySubscriptionId(subscriptionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CouponResponse> getAllCouponsForAdmin() {
        return couponRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + id));
        return mapToResponse(coupon);
    }

    @Transactional
    public CouponResponse updateCoupon(Long id, CouponUpdateRequest request, String authUserId, String authUserRole) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + id));

        // Security check: Verify that authenticated merchant owns the coupon
        if (authUserId != null && !authUserId.isBlank() && "MERCHANT".equalsIgnoreCase(authUserRole)) {
            if (!coupon.getMerchantId().toString().equals(authUserId)) {
                throw new BadRequestException("Access denied: You cannot update coupons belonging to another merchant.");
            }
        }

        // Only update permitted fields - immutable fields (validFrom, validUntil, merchantId, couponCode, usageCount, status, approvedBy, createdAt) are strictly preserved
        coupon.setTitle(request.getTitle());
        coupon.setDescription(request.getDescription());
        coupon.setCategory(request.getCategory());
        coupon.setDiscount(request.getDiscount());
        coupon.setCashbackPercentage(request.getCashbackPercentage() != null ? request.getCashbackPercentage() : BigDecimal.ZERO);
        coupon.setMinimumPurchase(request.getMinimumPurchase());
        coupon.setUsageLimit(request.getUsageLimit());

        Coupon saved = couponRepository.save(coupon);
        return mapToResponse(saved);
    }

    public CouponResponse updateCoupon(Long id, CouponUpdateRequest request) {
        return updateCoupon(id, request, null, null);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + id));
        coupon.setStatus(CouponStatus.INACTIVE);
        couponRepository.save(coupon);
    }

    @Transactional
    public CouponResponse approveCoupon(Long id, String adminEmail) {
        log.info("Admin [{}] approving coupon ID: {}", adminEmail, id);
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + id));

        coupon.setStatus(CouponStatus.ACTIVE);
        coupon.setApprovedBy(adminEmail != null ? adminEmail : "ADMIN");

        Coupon saved = couponRepository.save(coupon);
        publishCouponCreatedEvent(saved);
        return mapToResponse(saved);
    }

    private void publishCouponCreatedEvent(Coupon coupon) {
        if (coupon == null) return;
        try {
            CouponCreatedEvent event = new CouponCreatedEvent(
                    coupon.getCouponId(),
                    coupon.getMerchantId(),
                    coupon.getTitle(),
                    coupon.getDescription(),
                    coupon.getCategory(),
                    coupon.getCouponCode(),
                    coupon.getDiscount(),
                    coupon.getCashbackPercentage(),
                    coupon.getMinimumPurchase(),
                    coupon.getValidFrom(),
                    coupon.getValidUntil(),
                    coupon.getStatus() != null ? coupon.getStatus().name() : null,
                    coupon.getCreatedAt()
            );
            rabbitTemplate.convertAndSend(couponExchange, couponCreatedRoutingKey, event);
            log.info("Published CouponCreatedEvent to exchange: {} with routingKey: {}", couponExchange, couponCreatedRoutingKey);
        } catch (Exception e) {
            log.warn("Failed to publish CouponCreatedEvent to RabbitMQ: {}", e.getMessage());
        }
    }

    @Transactional
    public CouponResponse rejectCoupon(Long id, String adminEmail) {
        log.info("Admin [{}] rejecting coupon ID: {}", adminEmail, id);
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + id));

        coupon.setStatus(CouponStatus.REJECTED);
        coupon.setApprovedBy(adminEmail != null ? adminEmail : "ADMIN");

        Coupon saved = couponRepository.save(coupon);
        return mapToResponse(saved);
    }

    @Transactional
    public void incrementUsage(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with ID: " + id));

        coupon.setUsageCount(coupon.getUsageCount() + 1);
        if (coupon.getUsageCount() >= coupon.getUsageLimit()) {
            coupon.setStatus(CouponStatus.INACTIVE);
        }
        couponRepository.save(coupon);
    }

    private CouponResponse mapToResponse(Coupon coupon) {
        CouponResponse res = new CouponResponse();
        res.setCouponId(coupon.getCouponId());
        res.setMerchantId(coupon.getMerchantId());
        res.setTitle(coupon.getTitle());
        res.setDescription(coupon.getDescription());
        res.setCategory(coupon.getCategory());
        res.setDiscount(coupon.getDiscount());
        res.setCashbackPercentage(coupon.getCashbackPercentage());
        res.setCouponCode(coupon.getCouponCode());
        res.setMinimumPurchase(coupon.getMinimumPurchase());
        res.setValidFrom(coupon.getValidFrom());
        res.setValidUntil(coupon.getValidUntil());
        res.setUsageLimit(coupon.getUsageLimit());
        res.setUsageCount(coupon.getUsageCount());
        res.setStatus(coupon.getStatus());
        res.setCreatedAt(coupon.getCreatedAt());
        res.setApprovedBy(coupon.getApprovedBy());
        int upvotes = coupon.getUpvoteCount() != null ? coupon.getUpvoteCount() : 0;
        int downvotes = coupon.getDownvoteCount() != null ? coupon.getDownvoteCount() : 0;
        res.setUpvoteCount(upvotes);
        res.setDownvoteCount(downvotes);
        res.setTotalVotes(upvotes + downvotes);
        res.setReliabilityScore(coupon.getReliabilityScore() != null ? coupon.getReliabilityScore() : BigDecimal.ZERO);
        res.setSubscriptionId(coupon.getSubscriptionId());
        return res;
    }
}
