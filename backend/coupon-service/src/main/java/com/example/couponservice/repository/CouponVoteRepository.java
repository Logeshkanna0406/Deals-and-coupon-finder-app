package com.example.couponservice.repository;

import com.example.couponservice.entity.CouponVote;
import com.example.couponservice.entity.VoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponVoteRepository extends JpaRepository<CouponVote, Long> {
    Optional<CouponVote> findByCustomerIdAndCouponId(Long customerId, Long couponId);
    long countByCouponIdAndVoteType(Long couponId, VoteType voteType);
    long countByCouponId(Long couponId);
}
