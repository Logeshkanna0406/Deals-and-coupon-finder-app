package com.example.subscriptionservice.service;

import com.example.subscriptionservice.client.MerchantClient;
import com.example.subscriptionservice.client.PaymentClient;
import com.example.subscriptionservice.dto.*;
import com.example.subscriptionservice.entity.Subscription;
import com.example.subscriptionservice.entity.SubscriptionPlan;
import com.example.subscriptionservice.entity.SubscriptionStatus;
import com.example.subscriptionservice.exception.BadRequestException;
import com.example.subscriptionservice.exception.BusinessException;
import com.example.subscriptionservice.exception.ResourceNotFoundException;
import com.example.subscriptionservice.repository.SubscriptionPlanRepository;
import com.example.subscriptionservice.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PaymentClient paymentClient;
    private final MerchantClient merchantClient;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               SubscriptionPlanRepository planRepository,
                               PaymentClient paymentClient,
                               MerchantClient merchantClient) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.paymentClient = paymentClient;
        this.merchantClient = merchantClient;
    }

    public List<SubscriptionPlanResponse> getAllPlans() {
        log.info("Fetching all subscription plans");
        return planRepository.findAll().stream()
                .map(p -> new SubscriptionPlanResponse(p.getPlanId(), p.getName(), p.getDurationInMonths(), p.getPrice(), p.getCouponLimit(), p.getStatus()))
                .collect(Collectors.toList());
    }

    public SubscriptionPlanResponse getPlanById(Long planId) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with ID: " + planId));
        return new SubscriptionPlanResponse(plan.getPlanId(), plan.getName(), plan.getDurationInMonths(), plan.getPrice(), plan.getCouponLimit(), plan.getStatus());
    }

    @Transactional
    public SubscriptionPlanResponse createPlan(CreateSubscriptionPlanRequest request) {
        log.info("Creating new subscription plan: {}", request.getName());

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Plan name cannot be empty");
        }

        String planName = request.getName().trim();
        if (planRepository.existsByNameIgnoreCase(planName)) {
            throw new BadRequestException("Subscription plan with name '" + planName + "' already exists");
        }

        String status = (request.getStatus() != null && !request.getStatus().trim().isEmpty())
                ? request.getStatus().trim().toUpperCase()
                : "ACTIVE";

        SubscriptionPlan plan = new SubscriptionPlan(
                null,
                planName,
                request.getDurationInMonths(),
                request.getPrice(),
                request.getCouponLimit(),
                status
        );

        SubscriptionPlan saved = planRepository.save(plan);
        log.info("Subscription plan created successfully with ID: {}", saved.getPlanId());

        return new SubscriptionPlanResponse(
                saved.getPlanId(),
                saved.getName(),
                saved.getDurationInMonths(),
                saved.getPrice(),
                saved.getCouponLimit(),
                saved.getStatus()
        );
    }

    @Transactional
    public SubscriptionPlanResponse updatePlan(Long planId, CreateSubscriptionPlanRequest request) {
        log.info("Updating subscription plan ID: {}", planId);

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with ID: " + planId));

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Plan name cannot be empty");
        }

        String planName = request.getName().trim();
        if (planRepository.existsByNameIgnoreCaseAndPlanIdNot(planName, planId)) {
            throw new BadRequestException("Subscription plan with name '" + planName + "' already exists");
        }

        plan.setName(planName);
        if (request.getDurationInMonths() != null) {
            plan.setDurationInMonths(request.getDurationInMonths());
        }
        if (request.getPrice() != null) {
            plan.setPrice(request.getPrice());
        }
        if (request.getCouponLimit() != null) {
            plan.setCouponLimit(request.getCouponLimit());
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            plan.setStatus(request.getStatus().trim().toUpperCase());
        }

        SubscriptionPlan updated = planRepository.save(plan);
        log.info("Subscription plan ID {} updated successfully", planId);

        return new SubscriptionPlanResponse(
                updated.getPlanId(),
                updated.getName(),
                updated.getDurationInMonths(),
                updated.getPrice(),
                updated.getCouponLimit(),
                updated.getStatus()
        );
    }

    @Transactional
    public void deletePlan(Long planId) {
        log.info("Deleting subscription plan ID: {}", planId);

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with ID: " + planId));

        planRepository.delete(plan);
        log.info("Subscription plan ID {} deleted successfully", planId);
    }

    @Transactional
    public SubscriptionResponse createSubscription(CreateSubscriptionRequest request) {
        log.info("Creating subscription for merchantId: {}, planId: {}", request.getMerchantId(), request.getPlanId());

        // RULE: Merchant must be APPROVED by admin to purchase/subscribe to plans
        try {
            MerchantResponseDto merchant = merchantClient.getMerchantById(request.getMerchantId());
            if (merchant == null) {
                throw new BusinessException("Merchant account not found. Only registered and approved merchants can purchase subscriptions.");
            }
            if (!"APPROVED".equalsIgnoreCase(merchant.getStatus())) {
                String currentStatus = merchant.getStatus() != null ? merchant.getStatus() : "PENDING";
                throw new BusinessException("Your merchant account is currently " + currentStatus + ". You can only purchase subscription plans after your account is approved by admin.");
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Failed to verify merchant approval status with merchant-service: {}", e.getMessage());
            throw new BusinessException("Unable to verify merchant approval status. Please ensure your account is approved by admin.");
        }

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with ID: " + request.getPlanId()));

        Subscription subscription = new Subscription();
        subscription.setMerchantId(request.getMerchantId());
        subscription.setPlanId(plan.getPlanId());
        subscription.setAmount(plan.getPrice());
        subscription.setStatus(SubscriptionStatus.PENDING_VERIFICATION);
        subscription.setCouponsGenerated(0);

        Subscription saved = subscriptionRepository.save(subscription);
        log.info("Subscription created with ID: {} in PENDING_VERIFICATION state (awaiting payment)", saved.getSubscriptionId());

        return mapToResponse(saved, plan);
    }

    public SubscriptionResponse getSubscriptionById(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + id));
        SubscriptionPlan plan = planRepository.findById(subscription.getPlanId()).orElse(null);
        return mapToResponse(subscription, plan);
    }

    public List<SubscriptionResponse> getSubscriptionsByMerchantId(Long merchantId) {
        refreshMerchantSubscriptionStatus(merchantId);
        return subscriptionRepository.findByMerchantId(merchantId).stream()
                .map(s -> {
                    SubscriptionPlan plan = planRepository.findById(s.getPlanId()).orElse(null);
                    return mapToResponse(s, plan);
                })
                .collect(Collectors.toList());
    }

    public SubscriptionResponse getActiveSubscription(Long merchantId) {
        log.info("Checking active subscription for merchant ID: {}", merchantId);
        refreshMerchantSubscriptionStatus(merchantId);

        Subscription subscription = subscriptionRepository.findTopByMerchantIdAndStatusOrderBySubscriptionIdDesc(merchantId, SubscriptionStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active subscription found for merchant ID: " + merchantId));

        SubscriptionPlan plan = planRepository.findById(subscription.getPlanId()).orElse(null);
        return mapToResponse(subscription, plan);
    }

    public List<SubscriptionResponse> getUpcomingSubscriptions(Long merchantId) {
        refreshMerchantSubscriptionStatus(merchantId);
        return subscriptionRepository.findByMerchantIdAndStatusOrderByStartDateAsc(merchantId, SubscriptionStatus.SCHEDULED).stream()
                .map(s -> {
                    SubscriptionPlan plan = planRepository.findById(s.getPlanId()).orElse(null);
                    return mapToResponse(s, plan);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void activateSubscriptionFromPayment(PaymentVerifiedEvent event) {
        log.info("Activating subscription via RabbitMQ event: Subscription ID {}, Merchant ID {}, Payment ID {}",
                event.getSubscriptionId(), event.getMerchantId(), event.getPaymentId());

        Subscription subscription = subscriptionRepository.findById(event.getSubscriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + event.getSubscriptionId()));

        if (!subscription.getMerchantId().equals(event.getMerchantId())) {
            log.error("Merchant ID mismatch: subscription belongs to merchant {}, but payment event has merchant {}",
                    subscription.getMerchantId(), event.getMerchantId());
            throw new BusinessException("Payment does not belong to the subscription's merchant");
        }

        SubscriptionPlan plan = planRepository.findById(subscription.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with ID: " + subscription.getPlanId()));

        Long merchantId = subscription.getMerchantId();

        // Double check merchant approval status
        try {
            MerchantResponseDto merchant = merchantClient.getMerchantById(merchantId);
            if (merchant != null && !"APPROVED".equalsIgnoreCase(merchant.getStatus())) {
                log.warn("Payment event received for unapproved merchant ID: {}. Rejecting activation.", merchantId);
                subscription.setStatus(SubscriptionStatus.CANCELLED);
                subscriptionRepository.save(subscription);
                return;
            }
        } catch (Exception e) {
            log.warn("Could not check merchant status during payment activation: {}", e.getMessage());
        }

        refreshMerchantSubscriptionStatus(merchantId);

        // Check if merchant already has an active subscription
        Optional<Subscription> currentActiveOpt = subscriptionRepository
                .findTopByMerchantIdAndStatusOrderBySubscriptionIdDesc(merchantId, SubscriptionStatus.ACTIVE);

        LocalDate startDate;
        LocalDate endDate;
        SubscriptionStatus targetStatus;

        if (currentActiveOpt.isEmpty()) {
            // CASE 1: Merchant has no active subscription -> becomes ACTIVE immediately
            startDate = LocalDate.now();
            endDate = startDate.plusMonths(plan.getDurationInMonths()).minusDays(1);
            targetStatus = SubscriptionStatus.ACTIVE;
            log.info("Merchant {} has no active plan. Subscription ID {} is ACTIVE from {} to {}",
                    merchantId, subscription.getSubscriptionId(), startDate, endDate);
        } else {
            // CASE 2: Merchant currently has an ACTIVE subscription -> becomes SCHEDULED
            Subscription currentActive = currentActiveOpt.get();
            LocalDate latestEndDate = currentActive.getEndDate();

            // Check if there are already other SCHEDULED subscriptions queued
            List<Subscription> scheduledSubs = subscriptionRepository
                    .findByMerchantIdAndStatusOrderByStartDateAsc(merchantId, SubscriptionStatus.SCHEDULED);
            for (Subscription s : scheduledSubs) {
                if (s.getEndDate() != null && (latestEndDate == null || s.getEndDate().isAfter(latestEndDate))) {
                    latestEndDate = s.getEndDate();
                }
            }

            startDate = (latestEndDate != null ? latestEndDate : LocalDate.now()).plusDays(1);
            endDate = startDate.plusMonths(plan.getDurationInMonths()).minusDays(1);
            targetStatus = SubscriptionStatus.SCHEDULED;
            log.info("Merchant {} has active plan (ends {}). Subscription ID {} is SCHEDULED from {} to {}",
                    merchantId, latestEndDate, subscription.getSubscriptionId(), startDate, endDate);
        }

        subscription.setStartDate(startDate);
        subscription.setEndDate(endDate);
        subscription.setPaymentId(event.getPaymentId());
        subscription.setStatus(targetStatus);
        subscription.setCouponsGenerated(0);

        subscriptionRepository.save(subscription);
        log.info("Subscription ID {} saved with status {} for merchant ID {}",
                subscription.getSubscriptionId(), targetStatus, merchantId);
    }

    @Transactional
    public SubscriptionResponse incrementCouponCount(Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BusinessException("Cannot create coupons under a non-active subscription (Status: " + subscription.getStatus() + ")");
        }

        SubscriptionPlan plan = planRepository.findById(subscription.getPlanId()).orElse(null);
        int limit = plan != null && plan.getCouponLimit() != null ? plan.getCouponLimit() : Integer.MAX_VALUE;
        int currentCount = subscription.getCouponsGenerated();

        if (currentCount >= limit) {
            throw new BusinessException("Coupon creation limit reached for your current subscription plan.");
        }

        subscription.setCouponsGenerated(currentCount + 1);
        Subscription saved = subscriptionRepository.save(subscription);
        log.info("Subscription ID {} couponsGenerated count incremented: {} / {}",
                subscriptionId, saved.getCouponsGenerated(), limit);
        return mapToResponse(saved, plan);
    }

    @Transactional
    public SubscriptionResponse manuallyActivateSubscription(Long subscriptionId, Long merchantId) {
        log.info("Merchant {} requested manual activation of subscription {}", merchantId, subscriptionId);

        // RULE: Merchant must be APPROVED by admin to activate subscription plans
        try {
            MerchantResponseDto merchant = merchantClient.getMerchantById(merchantId);
            if (merchant != null && !"APPROVED".equalsIgnoreCase(merchant.getStatus())) {
                throw new BusinessException("Only approved merchants can activate subscription plans.");
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.warn("Merchant service check warning during manual activation: {}", e.getMessage());
        }

        Subscription target = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + subscriptionId));

        if (!target.getMerchantId().equals(merchantId)) {
            throw new BusinessException("Subscription does not belong to the requesting merchant");
        }

        if (target.getStatus() == SubscriptionStatus.ACTIVE) {
            SubscriptionPlan plan = planRepository.findById(target.getPlanId()).orElse(null);
            return mapToResponse(target, plan);
        }

        if (target.getStatus() != SubscriptionStatus.SCHEDULED && target.getStatus() != SubscriptionStatus.PENDING_VERIFICATION) {
            throw new BusinessException("Only SCHEDULED or queued subscriptions can be activated (Current status: " + target.getStatus() + ")");
        }

        // 1. Expire/supercede current active subscription(s) for this merchant
        List<Subscription> activeSubs = subscriptionRepository.findByMerchantIdAndStatus(merchantId, SubscriptionStatus.ACTIVE);
        for (Subscription active : activeSubs) {
            active.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(active);
            log.info("Active subscription {} for merchant {} superceded by manual activation of subscription {}",
                    active.getSubscriptionId(), merchantId, subscriptionId);
        }

        // 2. Activate target subscription starting today
        SubscriptionPlan plan = planRepository.findById(target.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with ID: " + target.getPlanId()));

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(plan.getDurationInMonths()).minusDays(1);

        target.setStartDate(startDate);
        target.setEndDate(endDate);
        target.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepository.save(target);
        log.info("Subscription {} is now ACTIVE from {} to {} for merchant {}",
                saved.getSubscriptionId(), startDate, endDate, merchantId);

        // 3. Re-queue subsequent SCHEDULED subscriptions if any
        List<Subscription> remainingScheduled = subscriptionRepository
                .findByMerchantIdAndStatusOrderByStartDateAsc(merchantId, SubscriptionStatus.SCHEDULED);
        LocalDate runningEnd = endDate;
        for (Subscription sub : remainingScheduled) {
            if (!sub.getSubscriptionId().equals(saved.getSubscriptionId())) {
                SubscriptionPlan subPlan = planRepository.findById(sub.getPlanId()).orElse(null);
                int duration = subPlan != null ? subPlan.getDurationInMonths() : 1;
                LocalDate subStart = runningEnd.plusDays(1);
                LocalDate subEnd = subStart.plusMonths(duration).minusDays(1);
                sub.setStartDate(subStart);
                sub.setEndDate(subEnd);
                subscriptionRepository.save(sub);
                runningEnd = subEnd;
            }
        }

        return mapToResponse(saved, plan);
    }

    @Transactional
    public void refreshMerchantSubscriptionStatus(Long merchantId) {
        LocalDate today = LocalDate.now();

        // 1. Expire past active subscriptions
        List<Subscription> activeSubs = subscriptionRepository.findByMerchantIdAndStatus(merchantId, SubscriptionStatus.ACTIVE);
        boolean hasActive = false;
        for (Subscription sub : activeSubs) {
            if (sub.getEndDate() != null && sub.getEndDate().isBefore(today)) {
                sub.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(sub);
                log.info("Subscription ID {} for merchant ID {} expired on {}", sub.getSubscriptionId(), merchantId, sub.getEndDate());
            } else {
                hasActive = true;
            }
        }

        // 2. If no active subscription exists, transition the earliest eligible SCHEDULED subscription to ACTIVE
        if (!hasActive) {
            List<Subscription> scheduledSubs = subscriptionRepository
                    .findByMerchantIdAndStatusOrderByStartDateAsc(merchantId, SubscriptionStatus.SCHEDULED);
            for (Subscription scheduled : scheduledSubs) {
                if (scheduled.getStartDate() != null && !scheduled.getStartDate().isAfter(today)) {
                    // Check if scheduled end date hasn't already passed
                    if (scheduled.getEndDate() != null && scheduled.getEndDate().isBefore(today)) {
                        scheduled.setStatus(SubscriptionStatus.EXPIRED);
                        subscriptionRepository.save(scheduled);
                        continue;
                    }
                    scheduled.setStatus(SubscriptionStatus.ACTIVE);
                    scheduled.setCouponsGenerated(0); // Starts fresh at 0 (Rule 5)
                    subscriptionRepository.save(scheduled);
                    log.info("SCHEDULED subscription ID {} for merchant ID {} is now ACTIVE (from {} to {})",
                            scheduled.getSubscriptionId(), merchantId, scheduled.getStartDate(), scheduled.getEndDate());
                    break; // Only ONE active subscription at a time
                }
            }
        }
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processScheduledTransitions() {
        LocalDate today = LocalDate.now();
        List<Subscription> expiredActive = subscriptionRepository.findByStatusAndEndDateBefore(SubscriptionStatus.ACTIVE, today);
        for (Subscription sub : expiredActive) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
            refreshMerchantSubscriptionStatus(sub.getMerchantId());
        }

        List<Subscription> scheduledReady = subscriptionRepository.findByStatusAndStartDateLessThanEqual(SubscriptionStatus.SCHEDULED, today);
        for (Subscription sub : scheduledReady) {
            refreshMerchantSubscriptionStatus(sub.getMerchantId());
        }
    }

    private SubscriptionResponse mapToResponse(Subscription subscription, SubscriptionPlan plan) {
        String planName = plan != null ? plan.getName() : "Unknown";
        Integer couponLimit = plan != null ? plan.getCouponLimit() : null;
        return new SubscriptionResponse(
                subscription.getSubscriptionId(),
                subscription.getMerchantId(),
                subscription.getPlanId(),
                planName,
                subscription.getStartDate(),
                subscription.getEndDate(),
                subscription.getAmount(),
                subscription.getPaymentId(),
                subscription.getStatus(),
                couponLimit,
                subscription.getCouponsGenerated()
        );
    }

    private SubscriptionResponse mapToResponse(Subscription subscription, String planName) {
        SubscriptionPlan plan = planRepository.findById(subscription.getPlanId()).orElse(null);
        return mapToResponse(subscription, plan);
    }
}
