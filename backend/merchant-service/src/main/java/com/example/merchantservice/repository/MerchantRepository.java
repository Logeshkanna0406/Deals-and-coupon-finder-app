package com.example.merchantservice.repository;

import com.example.merchantservice.entity.Merchant;
import com.example.merchantservice.entity.MerchantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Long> {
    Optional<Merchant> findByEmail(String email);
    List<Merchant> findByStatus(MerchantStatus status);
}
