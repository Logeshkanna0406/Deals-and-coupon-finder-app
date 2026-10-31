package com.example.cashbackservice.repository;

import com.example.cashbackservice.entity.CashbackTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CashbackTransactionRepository extends JpaRepository<CashbackTransaction, Long> {
    List<CashbackTransaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
