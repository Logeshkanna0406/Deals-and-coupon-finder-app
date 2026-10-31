package com.example.couponservice.repository;

import com.example.couponservice.entity.Coupon;
import com.example.couponservice.entity.CouponStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByMerchantId(Long merchantId);
    List<Coupon> findBySubscriptionId(Long subscriptionId);
    long countByMerchantId(Long merchantId);
    List<Coupon> findByStatus(CouponStatus status);
    List<Coupon> findByCategoryAndStatus(String category, CouponStatus status);
    Optional<Coupon> findByCouponCode(String couponCode);
}
