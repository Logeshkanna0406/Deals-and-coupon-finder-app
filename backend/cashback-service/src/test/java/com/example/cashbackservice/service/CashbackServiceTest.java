package com.example.cashbackservice.service;

import com.example.cashbackservice.dto.*;
import com.example.cashbackservice.entity.*;
import com.example.cashbackservice.exception.BusinessException;
import com.example.cashbackservice.repository.CashbackTransactionRepository;
import com.example.cashbackservice.repository.PointAccountRepository;
import com.example.cashbackservice.repository.PointTransactionRepository;
import com.example.cashbackservice.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CashbackServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private CashbackTransactionRepository transactionRepository;

    @Mock
    private PointAccountRepository pointAccountRepository;

    @Mock
    private PointTransactionRepository pointTransactionRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private CashbackService cashbackService;

    private Wallet sampleWallet;
    private PointAccount samplePointAccount;

    @BeforeEach
    void setUp() {
        sampleWallet = new Wallet(1L, 2L, new BigDecimal("0.00"));
        samplePointAccount = new PointAccount(1L, 2L, 0);
    }

    @Test
    void shouldCredit10PointsOnCouponRedemptionAndZeroWalletMoney() {
        // Purchase: 1000, Cashback %: 5% => Customer gets +10 points (NOT ₹50 cashback)
        CouponRedeemedEvent event = new CouponRedeemedEvent(
                10L, 1L, 101L, 2L, new BigDecimal("1000.00"), new BigDecimal("50.00"), new BigDecimal("5.00"), LocalDateTime.now(), 10
        );

        when(pointTransactionRepository.existsByReferenceId("REDEMPTION-10")).thenReturn(false);
        when(pointAccountRepository.findByCustomerId(2L)).thenReturn(Optional.of(samplePointAccount));
        when(pointAccountRepository.save(any(PointAccount.class))).thenReturn(samplePointAccount);

        cashbackService.processCouponRedeemedEvent(event);

        // Points must be 10
        assertEquals(10, samplePointAccount.getPointsBalance());
        verify(pointTransactionRepository, times(1)).save(any(PointTransaction.class));
        // Wallet must NEVER be touched during coupon redemption
        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void shouldNotCreditPointsIfEventIsDuplicate() {
        CouponRedeemedEvent event = new CouponRedeemedEvent(
                10L, 1L, 101L, 2L, new BigDecimal("1000.00"), new BigDecimal("50.00"), new BigDecimal("5.00"), LocalDateTime.now(), 10
        );

        when(pointTransactionRepository.existsByReferenceId("REDEMPTION-10")).thenReturn(true);

        cashbackService.processCouponRedeemedEvent(event);

        verify(pointAccountRepository, never()).save(any(PointAccount.class));
        verify(pointTransactionRepository, never()).save(any(PointTransaction.class));
    }

    @Test
    void shouldCalculateCustomerTiersCorrectly() {
        // 0-99 => NO_TIER
        CustomerTierResponse t0 = cashbackService.calculateTierResponse(1L, 50);
        assertEquals(CustomerTier.NO_TIER, t0.getTier());
        assertEquals(CustomerTier.BRONZE, t0.getNextTier());
        assertEquals(50, t0.getPointsRequiredForNextTier());

        // 100-199 => BRONZE
        CustomerTierResponse t1 = cashbackService.calculateTierResponse(1L, 120);
        assertEquals(CustomerTier.BRONZE, t1.getTier());
        assertEquals(CustomerTier.SILVER, t1.getNextTier());
        assertEquals(80, t1.getPointsRequiredForNextTier());

        // 200-499 => SILVER
        CustomerTierResponse t2 = cashbackService.calculateTierResponse(1L, 350);
        assertEquals(CustomerTier.SILVER, t2.getTier());
        assertEquals(CustomerTier.GOLD, t2.getNextTier());
        assertEquals(150, t2.getPointsRequiredForNextTier());

        // 500-999 => GOLD
        CustomerTierResponse t3 = cashbackService.calculateTierResponse(1L, 750);
        assertEquals(CustomerTier.GOLD, t3.getTier());
        assertEquals(CustomerTier.PLATINUM, t3.getNextTier());
        assertEquals(250, t3.getPointsRequiredForNextTier());

        // 1000+ => PLATINUM
        CustomerTierResponse t4 = cashbackService.calculateTierResponse(1L, 1500);
        assertEquals(CustomerTier.PLATINUM, t4.getTier());
        assertNull(t4.getNextTier());
        assertEquals(0, t4.getPointsRequiredForNextTier());
    }

    @Test
    void shouldRedeem100PointsFor10RupeesWalletSuccessfully() {
        samplePointAccount.setPointsBalance(100);
        when(pointAccountRepository.findByCustomerId(2L)).thenReturn(Optional.of(samplePointAccount));
        when(pointAccountRepository.save(any(PointAccount.class))).thenReturn(samplePointAccount);
        when(walletRepository.findByCustomerId(2L)).thenReturn(Optional.of(sampleWallet));
        when(walletRepository.save(any(Wallet.class))).thenReturn(sampleWallet);

        RedeemPointsRequest req = new RedeemPointsRequest(2L, 100);
        RedeemPointsResponse response = cashbackService.redeemPoints(req, null, null);

        assertNotNull(response);
        assertEquals(100, response.getPointsDeducted());
        assertEquals(0, response.getRemainingPoints());
        assertEquals(new BigDecimal("10.00"), response.getWalletCredited());
        assertEquals(new BigDecimal("10.00"), sampleWallet.getBalance());

        verify(pointTransactionRepository, times(1)).save(any(PointTransaction.class));
        verify(transactionRepository, times(1)).save(any(CashbackTransaction.class));
    }

    @Test
    void shouldRedeem100PointsFrom150PointsLeaving50Points() {
        samplePointAccount.setPointsBalance(150);
        when(pointAccountRepository.findByCustomerId(2L)).thenReturn(Optional.of(samplePointAccount));
        when(pointAccountRepository.save(any(PointAccount.class))).thenReturn(samplePointAccount);
        when(walletRepository.findByCustomerId(2L)).thenReturn(Optional.of(sampleWallet));
        when(walletRepository.save(any(Wallet.class))).thenReturn(sampleWallet);

        RedeemPointsRequest req = new RedeemPointsRequest(2L, 100);
        RedeemPointsResponse response = cashbackService.redeemPoints(req, null, null);

        assertNotNull(response);
        assertEquals(100, response.getPointsDeducted());
        assertEquals(50, response.getRemainingPoints());
        assertEquals(new BigDecimal("10.00"), response.getWalletCredited());
        assertEquals(new BigDecimal("10.00"), sampleWallet.getBalance());
    }

    @Test
    void shouldRejectRedemptionWhenPointsBelow100() {
        samplePointAccount.setPointsBalance(90);
        when(pointAccountRepository.findByCustomerId(2L)).thenReturn(Optional.of(samplePointAccount));

        RedeemPointsRequest req = new RedeemPointsRequest(2L, 100);
        BusinessException ex = assertThrows(BusinessException.class, () -> cashbackService.redeemPoints(req, null, null));
        assertTrue(ex.getMessage().contains("Insufficient point balance"));

        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void shouldRejectRedemptionWhenPointsNotMultipleOf100() {
        RedeemPointsRequest req = new RedeemPointsRequest(2L, 150);
        BusinessException ex = assertThrows(BusinessException.class, () -> cashbackService.redeemPoints(req, null, null));
        assertTrue(ex.getMessage().contains("multiples of 100 points"));

        verify(pointAccountRepository, never()).findByCustomerId(anyLong());
    }

    @Test
    void shouldRedeemCashbackSuccessfully() {
        sampleWallet.setBalance(new BigDecimal("100.00"));
        RedeemCashbackRequest req = new RedeemCashbackRequest(2L, new BigDecimal("40.00"));
        when(walletRepository.findByCustomerId(2L)).thenReturn(Optional.of(sampleWallet));
        when(walletRepository.save(any(Wallet.class))).thenReturn(sampleWallet);

        WalletResponse response = cashbackService.redeemCashback(req, null, null);

        assertNotNull(response);
        // 100 - 40 = 60
        assertEquals(new BigDecimal("60.00"), sampleWallet.getBalance());
        verify(transactionRepository, times(1)).save(any(CashbackTransaction.class));
    }

    @Test
    void shouldThrowExceptionWhenRedeemingMoreThanBalance() {
        sampleWallet.setBalance(new BigDecimal("100.00"));
        RedeemCashbackRequest req = new RedeemCashbackRequest(2L, new BigDecimal("200.00"));
        when(walletRepository.findByCustomerId(2L)).thenReturn(Optional.of(sampleWallet));

        assertThrows(BusinessException.class, () -> cashbackService.redeemCashback(req, null, null));
        verify(walletRepository, never()).save(any(Wallet.class));
    }
}
