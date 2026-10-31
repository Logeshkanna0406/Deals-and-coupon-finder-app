package com.example.subscriptionservice.repository;

import com.example.subscriptionservice.entity.Subscription;
import com.example.subscriptionservice.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByMerchantId(Long merchantId);
    List<Subscription> findByMerchantIdOrderByStartDateAsc(Long merchantId);
    List<Subscription> findByMerchantIdAndStatus(Long merchantId, SubscriptionStatus status);
    List<Subscription> findByMerchantIdAndStatusOrderByStartDateAsc(Long merchantId, SubscriptionStatus status);
    Optional<Subscription> findTopByMerchantIdAndStatusOrderBySubscriptionIdDesc(Long merchantId, SubscriptionStatus status);
    List<Subscription> findByStatusAndEndDateBefore(SubscriptionStatus status, java.time.LocalDate date);
    List<Subscription> findByStatusAndStartDateLessThanEqual(SubscriptionStatus status, java.time.LocalDate date);
}
