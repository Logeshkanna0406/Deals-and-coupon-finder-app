package com.example.redemptionservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "redemptions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_customer_coupon", columnNames = {"customerId", "couponId"})
})
public class Redemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long redemptionId;

    @Column(nullable = false)
    private Long couponId;

    @Column(nullable = false)
    private Long merchantId;

    @Column(nullable = false)
    private Long customerId;

    @Column(name = "redeemed_at", nullable = false)
    private LocalDateTime redeemedAt;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal purchaseAmount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RedemptionStatus status;

    @PrePersist
    protected void onCreate() {
        if (this.redeemedAt == null) {
            this.redeemedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = RedemptionStatus.REDEEMED;
        }
    }

    public Redemption() {}

    public Long getRedemptionId() { return redemptionId; }
    public void setRedemptionId(Long redemptionId) { this.redemptionId = redemptionId; }

    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public LocalDateTime getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(LocalDateTime redeemedAt) { this.redeemedAt = redeemedAt; }

    public BigDecimal getPurchaseAmount() { return purchaseAmount; }
    public void setPurchaseAmount(BigDecimal purchaseAmount) { this.purchaseAmount = purchaseAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public RedemptionStatus getStatus() { return status; }
    public void setStatus(RedemptionStatus status) { this.status = status; }
}
