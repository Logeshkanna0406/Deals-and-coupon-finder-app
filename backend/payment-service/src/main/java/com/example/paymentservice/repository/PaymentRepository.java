package com.example.paymentservice.repository;

import com.example.paymentservice.dto.MerchantRevenueProjection;
import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByMerchantId(Long merchantId);
    List<Payment> findByStatus(PaymentStatus status);
    Optional<Payment> findByTransactionReference(String transactionReference);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'VERIFIED'")
    BigDecimal calculateTotalVerifiedRevenue();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'VERIFIED' " +
           "AND (:startDate IS NULL OR p.paymentDate >= :startDate) " +
           "AND (:endDate IS NULL OR p.paymentDate <= :endDate)")
    BigDecimal calculateTotalVerifiedRevenueByDateRange(@Param("startDate") LocalDateTime startDate,
                                                        @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'VERIFIED' " +
           "AND (:startDate IS NULL OR p.paymentDate >= :startDate) " +
           "AND (:endDate IS NULL OR p.paymentDate <= :endDate)")
    long countVerifiedTransactionsByDateRange(@Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p.merchantId AS merchantId, COALESCE(SUM(p.amount), 0) AS totalRevenue, COUNT(p) AS successfulPayments " +
           "FROM Payment p WHERE p.status = 'VERIFIED' " +
           "GROUP BY p.merchantId")
    List<MerchantRevenueProjection> findMerchantRevenueSummary();

    @Query("SELECT p.merchantId AS merchantId, COALESCE(SUM(p.amount), 0) AS totalRevenue, COUNT(p) AS successfulPayments " +
           "FROM Payment p WHERE p.status = 'VERIFIED' " +
           "AND (:startDate IS NULL OR p.paymentDate >= :startDate) " +
           "AND (:endDate IS NULL OR p.paymentDate <= :endDate) " +
           "GROUP BY p.merchantId")
    List<MerchantRevenueProjection> findMerchantRevenueSummaryByDateRange(@Param("startDate") LocalDateTime startDate,
                                                                         @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p.merchantId AS merchantId, COALESCE(SUM(p.amount), 0) AS totalRevenue, COUNT(p) AS successfulPayments " +
           "FROM Payment p WHERE p.status = 'VERIFIED' AND p.merchantId = :merchantId " +
           "GROUP BY p.merchantId")
    Optional<MerchantRevenueProjection> findRevenueByMerchantId(@Param("merchantId") Long merchantId);

    @Query("SELECT p.merchantId AS merchantId, COALESCE(SUM(p.amount), 0) AS totalRevenue, COUNT(p) AS successfulPayments " +
           "FROM Payment p WHERE p.status = 'VERIFIED' AND p.merchantId = :merchantId " +
           "AND (:startDate IS NULL OR p.paymentDate >= :startDate) " +
           "AND (:endDate IS NULL OR p.paymentDate <= :endDate) " +
           "GROUP BY p.merchantId")
    Optional<MerchantRevenueProjection> findRevenueByMerchantIdAndDateRange(@Param("merchantId") Long merchantId,
                                                                            @Param("startDate") LocalDateTime startDate,
                                                                            @Param("endDate") LocalDateTime endDate);
}

