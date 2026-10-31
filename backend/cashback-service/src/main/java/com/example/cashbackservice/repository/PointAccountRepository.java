package com.example.cashbackservice.repository;

import com.example.cashbackservice.entity.PointAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PointAccountRepository extends JpaRepository<PointAccount, Long> {
    Optional<PointAccount> findByCustomerId(Long customerId);
}
