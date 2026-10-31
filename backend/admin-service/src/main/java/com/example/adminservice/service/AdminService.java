package com.example.adminservice.service;

import com.example.adminservice.client.CouponAdminClient;
import com.example.adminservice.client.MerchantAdminClient;
import com.example.adminservice.client.PaymentAdminClient;
import com.example.adminservice.client.SubscriptionAdminClient;
import com.example.adminservice.dto.*;
import com.example.adminservice.entity.AdminAuditLog;
import com.example.adminservice.exception.BadRequestException;
import com.example.adminservice.exception.ResourceNotFoundException;
import com.example.adminservice.repository.AdminAuditLogRepository;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final MerchantAdminClient merchantAdminClient;
    private final SubscriptionAdminClient subscriptionAdminClient;
    private final CouponAdminClient couponAdminClient;
    private final PaymentAdminClient paymentAdminClient;
    private final AdminAuditLogRepository auditLogRepository;

    public AdminService(MerchantAdminClient merchantAdminClient,
                        SubscriptionAdminClient subscriptionAdminClient,
                        CouponAdminClient couponAdminClient,
                        PaymentAdminClient paymentAdminClient,
                        AdminAuditLogRepository auditLogRepository) {
        this.merchantAdminClient = merchantAdminClient;
        this.subscriptionAdminClient = subscriptionAdminClient;
        this.couponAdminClient = couponAdminClient;
        this.paymentAdminClient = paymentAdminClient;
        this.auditLogRepository = auditLogRepository;
    }

    public List<MerchantResponseDto> getAllMerchants() {
        log.info("Admin fetching all registered merchants");
        return merchantAdminClient.getAllMerchants();
    }

    public MerchantResponseDto approveMerchant(Long id, String adminEmail) {
        log.info("Admin [{}] approving merchant ID: {}", adminEmail, id);
        MerchantResponseDto res = merchantAdminClient.updateMerchantStatus(id, "APPROVED");
        auditLogRepository.save(new AdminAuditLog(null, "APPROVE_MERCHANT", "MERCHANT", id, adminEmail != null ? adminEmail : "ADMIN", "Merchant approved"));
        return res;
    }

    public MerchantResponseDto rejectMerchant(Long id, String adminEmail) {
        log.info("Admin [{}] rejecting merchant ID: {}", adminEmail, id);
        MerchantResponseDto res = merchantAdminClient.updateMerchantStatus(id, "REJECTED");
        auditLogRepository.save(new AdminAuditLog(null, "REJECT_MERCHANT", "MERCHANT", id, adminEmail != null ? adminEmail : "ADMIN", "Merchant rejected"));
        return res;
    }

    public MerchantResponseDto suspendMerchant(Long id, String adminEmail) {
        log.info("Admin [{}] suspending merchant ID: {}", adminEmail, id);
        MerchantResponseDto res = merchantAdminClient.updateMerchantStatus(id, "SUSPENDED");
        auditLogRepository.save(new AdminAuditLog(null, "SUSPEND_MERCHANT", "MERCHANT", id, adminEmail != null ? adminEmail : "ADMIN", "Merchant suspended"));
        return res;
    }

    public List<CouponResponseDto> getAllCoupons() {
        log.info("Admin fetching all coupons");
        return couponAdminClient.getAllCoupons();
    }

    public CouponResponseDto approveCoupon(Long id, String adminEmail) {
        log.info("Admin [{}] approving coupon ID: {}", adminEmail, id);
        CouponResponseDto res = couponAdminClient.approveCoupon(id);
        auditLogRepository.save(new AdminAuditLog(null, "APPROVE_COUPON", "COUPON", id, adminEmail != null ? adminEmail : "ADMIN", "Coupon approved"));
        return res;
    }

    public CouponResponseDto rejectCoupon(Long id, String adminEmail) {
        log.info("Admin [{}] rejecting coupon ID: {}", adminEmail, id);
        CouponResponseDto res = couponAdminClient.rejectCoupon(id);
        auditLogRepository.save(new AdminAuditLog(null, "REJECT_COUPON", "COUPON", id, adminEmail != null ? adminEmail : "ADMIN", "Coupon rejected"));
        return res;
    }

    public List<PaymentResponseDto> getAllPayments() {
        log.info("Admin fetching all payments");
        return paymentAdminClient.getAllPayments();
    }

    public PaymentResponseDto verifyPayment(Long id, String adminEmail) {
        log.info("Admin [{}] verifying payment ID: {}", adminEmail, id);
        PaymentResponseDto res = paymentAdminClient.verifyPayment(id);
        auditLogRepository.save(new AdminAuditLog(null, "VERIFY_PAYMENT", "PAYMENT", id, adminEmail != null ? adminEmail : "ADMIN", "Payment verified and activated"));
        return res;
    }

    public RevenueResponseDto getRevenue() {
        return getRevenue(null, null);
    }

    public RevenueResponseDto getRevenue(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        log.info("Admin fetching total platform revenue with fromDate: {} and toDate: {}", fromDate, toDate);
        return paymentAdminClient.getRevenueSummary(fromDate, toDate);
    }

    public PlatformMerchantRevenueResponseDto getMerchantRevenueSummary(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        log.info("Admin fetching merchant-wise revenue with fromDate: {} and toDate: {}", fromDate, toDate);

        List<MerchantResponseDto> allMerchants = merchantAdminClient.getAllMerchants();
        List<MerchantRevenueResponseDto> revenueList = paymentAdminClient.getMerchantRevenueSummary(fromDate, toDate);

        Map<Long, MerchantRevenueResponseDto> revenueMap = (revenueList != null)
                ? revenueList.stream().collect(Collectors.toMap(MerchantRevenueResponseDto::getMerchantId, Function.identity(), (a, b) -> a))
                : Collections.emptyMap();

        Set<Long> processedMerchantIds = new HashSet<>();
        List<MerchantRevenueItemDto> merchantItems = new ArrayList<>();

        if (allMerchants != null) {
            for (MerchantResponseDto merchant : allMerchants) {
                Long merchantId = merchant.getMerchantId();
                processedMerchantIds.add(merchantId);

                MerchantRevenueResponseDto rev = revenueMap.get(merchantId);
                BigDecimal totalRevenue = (rev != null && rev.getTotalRevenue() != null)
                        ? rev.getTotalRevenue().setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
                Long successfulPayments = (rev != null && rev.getSuccessfulPayments() != null)
                        ? rev.getSuccessfulPayments()
                        : 0L;

                merchantItems.add(new MerchantRevenueItemDto(
                        merchantId,
                        merchant.getBusinessName() != null ? merchant.getBusinessName() : "Merchant " + merchantId,
                        totalRevenue,
                        successfulPayments
                ));
            }
        }

        // Include any remaining merchants from payment records if not present in allMerchants
        if (revenueList != null) {
            for (MerchantRevenueResponseDto rev : revenueList) {
                if (!processedMerchantIds.contains(rev.getMerchantId())) {
                    merchantItems.add(new MerchantRevenueItemDto(
                            rev.getMerchantId(),
                            "Merchant " + rev.getMerchantId(),
                            rev.getTotalRevenue() != null ? rev.getTotalRevenue().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                            rev.getSuccessfulPayments() != null ? rev.getSuccessfulPayments() : 0L
                    ));
                }
            }
        }

        BigDecimal totalPlatformRevenue = merchantItems.stream()
                .map(MerchantRevenueItemDto::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new PlatformMerchantRevenueResponseDto(totalPlatformRevenue, "INR", merchantItems);
    }

    public SpecificMerchantRevenueResponseDto getSpecificMerchantRevenue(Long merchantId, LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        log.info("Admin fetching revenue for specific merchant ID: {} with fromDate: {}, toDate: {}", merchantId, fromDate, toDate);

        MerchantResponseDto merchant;
        try {
            merchant = merchantAdminClient.getMerchantById(merchantId);
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Merchant not found with ID: " + merchantId);
        } catch (Exception e) {
            log.error("Error fetching merchant with ID {}: {}", merchantId, e.getMessage());
            throw new ResourceNotFoundException("Merchant not found with ID: " + merchantId);
        }

        if (merchant == null) {
            throw new ResourceNotFoundException("Merchant not found with ID: " + merchantId);
        }

        MerchantRevenueResponseDto rev = paymentAdminClient.getRevenueForMerchant(merchantId, fromDate, toDate);
        BigDecimal totalRevenue = (rev != null && rev.getTotalRevenue() != null)
                ? rev.getTotalRevenue().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        Long successfulPayments = (rev != null && rev.getSuccessfulPayments() != null)
                ? rev.getSuccessfulPayments()
                : 0L;

        return new SpecificMerchantRevenueResponseDto(
                merchantId,
                merchant.getBusinessName() != null ? merchant.getBusinessName() : "Merchant " + merchantId,
                totalRevenue,
                successfulPayments,
                "INR"
        );
    }

    public SubscriptionPlanResponseDto createSubscriptionPlan(CreateSubscriptionPlanRequestDto request, String adminEmail) {
        log.info("Admin [{}] creating new subscription plan: {}", adminEmail, request.getName());
        SubscriptionPlanResponseDto createdPlan = subscriptionAdminClient.createSubscriptionPlan(request);
        auditLogRepository.save(new AdminAuditLog(
                null,
                "CREATE_SUBSCRIPTION_PLAN",
                "SUBSCRIPTION_PLAN",
                createdPlan.getPlanId(),
                adminEmail != null ? adminEmail : "ADMIN",
                "Created subscription plan: " + createdPlan.getName()
        ));
        return createdPlan;
    }

    public SubscriptionPlanResponseDto updateSubscriptionPlan(Long planId, CreateSubscriptionPlanRequestDto request, String adminEmail) {
        log.info("Admin [{}] updating subscription plan ID {}: {}", adminEmail, planId, request.getName());
        SubscriptionPlanResponseDto updatedPlan = subscriptionAdminClient.updateSubscriptionPlan(planId, request);
        auditLogRepository.save(new AdminAuditLog(
                null,
                "UPDATE_SUBSCRIPTION_PLAN",
                "SUBSCRIPTION_PLAN",
                planId,
                adminEmail != null ? adminEmail : "ADMIN",
                "Updated subscription plan: " + updatedPlan.getName()
        ));
        return updatedPlan;
    }

    public void deleteSubscriptionPlan(Long planId, String adminEmail) {
        log.info("Admin [{}] deleting subscription plan ID: {}", adminEmail, planId);
        subscriptionAdminClient.deleteSubscriptionPlan(planId);
        auditLogRepository.save(new AdminAuditLog(
                null,
                "DELETE_SUBSCRIPTION_PLAN",
                "SUBSCRIPTION_PLAN",
                planId,
                adminEmail != null ? adminEmail : "ADMIN",
                "Deleted subscription plan ID: " + planId
        ));
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate cannot be after toDate");
        }
    }
}

