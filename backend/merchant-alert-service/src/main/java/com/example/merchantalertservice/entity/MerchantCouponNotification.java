package com.example.merchantalertservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "merchant_coupon_notifications", uniqueConstraints = {
        @UniqueConstraint(name = "uk_notif_customer_coupon", columnNames = {"customer_id", "coupon_id"})
})
public class MerchantCouponNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "coupon_id", nullable = false)
    private Long couponId;

    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @Column(name = "notified_at", nullable = false)
    private LocalDateTime notifiedAt;

    public MerchantCouponNotification() {}

    public MerchantCouponNotification(Long customerId, Long couponId, Long merchantId, NotificationStatus status) {
        this.customerId = customerId;
        this.couponId = couponId;
        this.merchantId = merchantId;
        this.status = status;
        this.notifiedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.notifiedAt == null) {
            this.notifiedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public NotificationStatus getStatus() { return status; }
    public void setStatus(NotificationStatus status) { this.status = status; }

    public LocalDateTime getNotifiedAt() { return notifiedAt; }
    public void setNotifiedAt(LocalDateTime notifiedAt) { this.notifiedAt = notifiedAt; }
}
