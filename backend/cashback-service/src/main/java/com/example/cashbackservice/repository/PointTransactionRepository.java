package com.example.cashbackservice.repository;

import com.example.cashbackservice.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    boolean existsByReferenceId(String referenceId);

    @Query("SELECT COALESCE(SUM(pt.points), 0) FROM PointTransaction pt WHERE pt.customerId = :customerId AND pt.type = com.example.cashbackservice.entity.TransactionType.CREDIT")
    Integer getTotalLifetimeEarnedPoints(@Param("customerId") Long customerId);
}
