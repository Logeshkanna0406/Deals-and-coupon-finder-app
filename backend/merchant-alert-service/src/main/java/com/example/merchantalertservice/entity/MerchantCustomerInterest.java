package com.example.merchantalertservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "merchant_customer_interests", uniqueConstraints = {
        @UniqueConstraint(name = "uk_interest_customer_merchant", columnNames = {"customer_id", "merchant_id"})
})
public class MerchantCustomerInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterestSource source;

    @Column(name = "followed_at", nullable = false)
    private LocalDateTime followedAt;

    public MerchantCustomerInterest() {}

    public MerchantCustomerInterest(Long customerId, Long merchantId, InterestSource source) {
        this.customerId = customerId;
        this.merchantId = merchantId;
        this.source = source;
        this.followedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.followedAt == null) {
            this.followedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public InterestSource getSource() { return source; }
    public void setSource(InterestSource source) { this.source = source; }

    public LocalDateTime getFollowedAt() { return followedAt; }
    public void setFollowedAt(LocalDateTime followedAt) { this.followedAt = followedAt; }
}
