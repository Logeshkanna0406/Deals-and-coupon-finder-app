package com.example.merchantservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "merchants")
public class Merchant {

    @Id
    private Long merchantId;

    @Column(nullable = false)
    private String businessName;

    @Column(nullable = false)
    private String ownerName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String category;

    private String address;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MerchantStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = MerchantStatus.PENDING;
        }
    }

    public Merchant() {}

    public Merchant(Long merchantId, String businessName, String ownerName, String email, String phone, String category, String address, String description, MerchantStatus status) {
        this.merchantId = merchantId;
        this.businessName = businessName;
        this.ownerName = ownerName;
        this.email = email;
        this.phone = phone;
        this.category = category;
        this.address = address;
        this.description = description;
        this.status = status;
    }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public MerchantStatus getStatus() { return status; }
    public void setStatus(MerchantStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
