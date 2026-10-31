package com.example.cashbackservice.service;

import com.example.cashbackservice.dto.*;
import com.example.cashbackservice.entity.*;
import com.example.cashbackservice.exception.BadRequestException;
import com.example.cashbackservice.exception.BusinessException;
import com.example.cashbackservice.repository.CashbackTransactionRepository;
import com.example.cashbackservice.repository.PointAccountRepository;
import com.example.cashbackservice.repository.PointTransactionRepository;
import com.example.cashbackservice.repository.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CashbackService {

    private static final Logger log = LoggerFactory.getLogger(CashbackService.class);

    private final WalletRepository walletRepository;
    private final CashbackTransactionRepository transactionRepository;
    private final PointAccountRepository pointAccountRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.cashback:deals.cashback.exchange}")
    private String cashbackExchange = "deals.cashback.exchange";

    @Value("${rabbitmq.routingkey.cashback-credited:cashback.credited}")
    private String cashbackCreditedRoutingKey = "cashback.credited";

    public CashbackService(WalletRepository walletRepository,
                           CashbackTransactionRepository transactionRepository,
                           PointAccountRepository pointAccountRepository,
                           PointTransactionRepository pointTransactionRepository,
                           RabbitTemplate rabbitTemplate) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.pointAccountRepository = pointAccountRepository;
        this.pointTransactionRepository = pointTransactionRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    // ==========================================
    // POINT ACCOUNT & TRANSACTIONS
    // ==========================================

    public PointAccountResponse getPointAccount(Long customerId, String authUserId, String authUserRole) {
        validateCustomerAccess(customerId, authUserId, authUserRole);
        log.info("Fetching point account for customer ID: {}", customerId);
        PointAccount account = pointAccountRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    PointAccount newAcc = new PointAccount(null, customerId, 0);
                    return pointAccountRepository.save(newAcc);
                });
        return new PointAccountResponse(account.getCustomerId(), account.getPointsBalance());
    }

    public List<PointTransactionResponse> getPointTransactions(Long customerId, String authUserId, String authUserRole) {
        validateCustomerAccess(customerId, authUserId, authUserRole);
        log.info("Fetching point transactions for customer ID: {}", customerId);
        return pointTransactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(t -> new PointTransactionResponse(
                        t.getTransactionId(),
                        t.getCustomerId(),
                        t.getPoints(),
                        t.getType(),
                        t.getReferenceId(),
                        t.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public CustomerTierResponse getCustomerTier(Long customerId, String authUserId, String authUserRole) {
        validateCustomerAccess(customerId, authUserId, authUserRole);
        log.info("Fetching customer tier for customer ID: {}", customerId);
        Integer lifetimePoints = pointTransactionRepository.getTotalLifetimeEarnedPoints(customerId);
        if (lifetimePoints == null) {
            lifetimePoints = 0;
        }
        return calculateTierResponse(customerId, lifetimePoints);
    }

    public CustomerTierResponse calculateTierResponse(Long customerId, int points) {
        CustomerTier tier;
        CustomerTier nextTier;
        int pointsRequired;

        if (points < 100) {
            tier = CustomerTier.NO_TIER;
            nextTier = CustomerTier.BRONZE;
            pointsRequired = 100 - points;
        } else if (points < 200) {
            tier = CustomerTier.BRONZE;
            nextTier = CustomerTier.SILVER;
            pointsRequired = 200 - points;
        } else if (points < 500) {
            tier = CustomerTier.SILVER;
            nextTier = CustomerTier.GOLD;
            pointsRequired = 500 - points;
        } else if (points < 1000) {
            tier = CustomerTier.GOLD;
            nextTier = CustomerTier.PLATINUM;
            pointsRequired = 1000 - points;
        } else {
            tier = CustomerTier.PLATINUM;
            nextTier = null;
            pointsRequired = 0;
        }

        return new CustomerTierResponse(customerId, points, tier, nextTier, pointsRequired);
    }

    /**
     * Consumes CouponRedeemedEvent.
     * Enforces the rule: Successful coupon redemption = +10 POINTS added to Customer Point Account.
     * ZERO direct money is credited to the wallet.
     * Idempotent check ensures duplicate delivery does not reward duplicate points.
     */
    @Transactional
    public void processCouponRedeemedEvent(CouponRedeemedEvent event) {
        log.info("Processing points reward for CouponRedeemedEvent: Customer ID: {}, Redemption ID: {}, Points: {}",
                event.getCustomerId(), event.getRedemptionId(), event.getPointsEarned());

        String referenceId = "REDEMPTION-" + event.getRedemptionId();

        // Idempotency check: Do not reward points twice for the same redemption event
        if (pointTransactionRepository.existsByReferenceId(referenceId)) {
            log.warn("Point reward already processed for reference: {}. Ignoring duplicate event.", referenceId);
            return;
        }

        // Fetch or initialize customer point account
        PointAccount account = pointAccountRepository.findByCustomerId(event.getCustomerId())
                .orElseGet(() -> new PointAccount(null, event.getCustomerId(), 0));

        // RULE: Exactly 10 points awarded per successful redemption
        int pointsToAdd = event.getPointsEarned() != null ? event.getPointsEarned() : 10;
        account.setPointsBalance(account.getPointsBalance() + pointsToAdd);
        PointAccount savedAccount = pointAccountRepository.save(account);

        // Record CREDIT Point Transaction
        PointTransaction pointTransaction = new PointTransaction();
        pointTransaction.setCustomerId(event.getCustomerId());
        pointTransaction.setPoints(pointsToAdd);
        pointTransaction.setType(TransactionType.CREDIT);
        pointTransaction.setReferenceId(referenceId);
        pointTransactionRepository.save(pointTransaction);

        log.info("+{} points credited to customer ID: {}. New Point Balance: {}",
                pointsToAdd, event.getCustomerId(), savedAccount.getPointsBalance());
    }

    /**
     * Converts Customer Points to Wallet Money.
     * Conversion Rule: 100 POINTS = ₹10
     * Customer explicitly requests redemption in multiples of 100 points.
     * Validates:
     * - requested points >= 100
     * - requested points % 100 == 0
     * - available points >= requested points
     */
    @Transactional
    public RedeemPointsResponse redeemPoints(RedeemPointsRequest request, String authUserId, String authUserRole) {
        validateCustomerAccess(request.getCustomerId(), authUserId, authUserRole);
        log.info("Customer ID: {} requesting point conversion: {} points", request.getCustomerId(), request.getPoints());

        if (request.getPoints() == null || request.getPoints() < 100) {
            throw new BusinessException("Minimum points required for redemption is 100 points.");
        }

        if (request.getPoints() % 100 != 0) {
            throw new BusinessException("Points to redeem must be in multiples of 100 points (100 points = ₹10).");
        }

        PointAccount account = pointAccountRepository.findByCustomerId(request.getCustomerId())
                .orElseThrow(() -> new BusinessException("Point account not found for customer ID: " + request.getCustomerId()));

        if (account.getPointsBalance() < request.getPoints()) {
            throw new BusinessException("Insufficient point balance. Available: " + account.getPointsBalance() +
                    ", Requested: " + request.getPoints());
        }

        // Calculate money to credit: 100 points = ₹10
        long hundredBatches = request.getPoints() / 100;
        BigDecimal walletCredit = BigDecimal.valueOf(hundredBatches * 10L).setScale(2, RoundingMode.HALF_UP);

        // 1. Deduct Points atomically
        account.setPointsBalance(account.getPointsBalance() - request.getPoints());
        PointAccount updatedAccount = pointAccountRepository.save(account);

        // Record Point DEBIT transaction
        String pointRef = "POINT-REDEMPTION-" + System.currentTimeMillis();
        PointTransaction pt = new PointTransaction();
        pt.setCustomerId(request.getCustomerId());
        pt.setPoints(request.getPoints());
        pt.setType(TransactionType.DEBIT);
        pt.setReferenceId(pointRef);
        pointTransactionRepository.save(pt);

        // 2. Credit Wallet Money atomically
        Wallet wallet = walletRepository.findByCustomerId(request.getCustomerId())
                .orElseGet(() -> new Wallet(null, request.getCustomerId(), BigDecimal.ZERO));

        wallet.setBalance(wallet.getBalance().add(walletCredit));
        Wallet savedWallet = walletRepository.save(wallet);

        // Record Wallet CREDIT transaction
        String walletRef = "POINT-CONVERSION-" + System.currentTimeMillis();
        CashbackTransaction wt = new CashbackTransaction();
        wt.setCustomerId(request.getCustomerId());
        wt.setAmount(walletCredit);
        wt.setType(TransactionType.CREDIT);
        wt.setReferenceId(walletRef);
        transactionRepository.save(wt);

        log.info("Successfully converted {} points to ₹{} for customer ID: {}. Remaining Points: {}, New Wallet Balance: ₹{}",
                request.getPoints(), walletCredit, request.getCustomerId(), updatedAccount.getPointsBalance(), savedWallet.getBalance());

        return new RedeemPointsResponse(
                request.getCustomerId(),
                request.getPoints(),
                updatedAccount.getPointsBalance(),
                walletCredit,
                savedWallet.getBalance()
        );
    }

    // ==========================================
    // WALLET & CASHBACK WITHDRAWAL
    // ==========================================

    public WalletResponse getWalletByCustomerId(Long customerId, String authUserId, String authUserRole) {
        validateCustomerAccess(customerId, authUserId, authUserRole);
        log.info("Fetching wallet for customer ID: {}", customerId);
        Wallet wallet = walletRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Wallet newWallet = new Wallet(null, customerId, BigDecimal.ZERO);
                    return walletRepository.save(newWallet);
                });
        return new WalletResponse(wallet.getWalletId(), wallet.getCustomerId(), wallet.getBalance());
    }

    public WalletResponse getWalletByCustomerId(Long customerId) {
        return getWalletByCustomerId(customerId, null, null);
    }

    public List<CashbackTransactionResponse> getTransactionsByCustomerId(Long customerId, String authUserId, String authUserRole) {
        validateCustomerAccess(customerId, authUserId, authUserRole);
        log.info("Fetching wallet transactions for customer ID: {}", customerId);
        return transactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(t -> new CashbackTransactionResponse(
                        t.getTransactionId(),
                        t.getCustomerId(),
                        t.getAmount(),
                        t.getType(),
                        t.getReferenceId(),
                        t.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public List<CashbackTransactionResponse> getTransactionsByCustomerId(Long customerId) {
        return getTransactionsByCustomerId(customerId, null, null);
    }

    @Transactional
    public WalletResponse redeemCashback(RedeemCashbackRequest request, String authUserId, String authUserRole) {
        validateCustomerAccess(request.getCustomerId(), authUserId, authUserRole);
        log.info("Customer ID: {} requesting wallet money withdrawal: ₹{}", request.getCustomerId(), request.getAmount());

        Wallet wallet = walletRepository.findByCustomerId(request.getCustomerId())
                .orElseThrow(() -> new BadRequestException("Wallet not found for customer ID: " + request.getCustomerId()));

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BusinessException("Insufficient wallet balance. Available: ₹" + wallet.getBalance() +
                    ", Requested: ₹" + request.getAmount());
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        Wallet saved = walletRepository.save(wallet);

        // Record DEBIT transaction
        CashbackTransaction transaction = new CashbackTransaction();
        transaction.setCustomerId(request.getCustomerId());
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.DEBIT);
        transaction.setReferenceId("WITHDRAWAL-" + System.currentTimeMillis());
        transactionRepository.save(transaction);

        log.info("Wallet money ₹{} withdrawn for customer ID: {}. Remaining Balance: ₹{}",
                request.getAmount(), request.getCustomerId(), saved.getBalance());

        return new WalletResponse(saved.getWalletId(), saved.getCustomerId(), saved.getBalance());
    }

    public WalletResponse redeemCashback(RedeemCashbackRequest request) {
        return redeemCashback(request, null, null);
    }

    private void validateCustomerAccess(Long customerId, String authUserId, String authUserRole) {
        if (authUserId != null && !authUserId.isBlank() && "CUSTOMER".equalsIgnoreCase(authUserRole)) {
            if (!customerId.toString().equals(authUserId)) {
                throw new BadRequestException("Access denied: You cannot view or modify another customer's points or wallet.");
            }
        }
    }
}
