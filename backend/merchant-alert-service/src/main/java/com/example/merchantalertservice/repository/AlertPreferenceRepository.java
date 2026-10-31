package com.example.merchantalertservice.repository;

import com.example.merchantalertservice.entity.AlertPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertPreferenceRepository extends JpaRepository<AlertPreference, Long> {
    Optional<AlertPreference> findByCustomerId(Long customerId);
    boolean existsByCustomerId(Long customerId);
}
