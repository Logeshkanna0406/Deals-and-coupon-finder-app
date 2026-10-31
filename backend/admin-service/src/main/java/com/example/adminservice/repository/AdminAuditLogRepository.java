package com.example.adminservice.repository;

import com.example.adminservice.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    List<AdminAuditLog> findByEntityTypeOrderByPerformedAtDesc(String entityType);
}
