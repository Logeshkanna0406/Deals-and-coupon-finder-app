package com.example.merchantalertservice.repository;

import com.example.merchantalertservice.entity.MerchantCouponNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantCouponNotificationRepository extends JpaRepository<MerchantCouponNotification, Long> {
    Optional<MerchantCouponNotification> findByCustomerIdAndCouponId(Long customerId, Long couponId);
    boolean existsByCustomerIdAndCouponId(Long customerId, Long couponId);
    List<MerchantCouponNotification> findByCustomerId(Long customerId);
    List<MerchantCouponNotification> findByCouponId(Long couponId);
}
