package com.example.merchantalertservice.repository;

import com.example.merchantalertservice.entity.MerchantCustomerInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantCustomerInterestRepository extends JpaRepository<MerchantCustomerInterest, Long> {
    Optional<MerchantCustomerInterest> findByCustomerIdAndMerchantId(Long customerId, Long merchantId);
    boolean existsByCustomerIdAndMerchantId(Long customerId, Long merchantId);
    List<MerchantCustomerInterest> findByCustomerId(Long customerId);
    List<MerchantCustomerInterest> findByMerchantId(Long merchantId);
    void deleteByCustomerIdAndMerchantId(Long customerId, Long merchantId);
}
