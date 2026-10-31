package com.example.cashbackservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "point_accounts")
public class PointAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pointAccountId;

    @Column(nullable = false, unique = true)
    private Long customerId;

    @Column(nullable = false)
    private Integer pointsBalance = 0;

    public PointAccount() {}

    public PointAccount(Long pointAccountId, Long customerId, Integer pointsBalance) {
        this.pointAccountId = pointAccountId;
        this.customerId = customerId;
        this.pointsBalance = pointsBalance != null ? pointsBalance : 0;
    }

    public Long getPointAccountId() { return pointAccountId; }
    public void setPointAccountId(Long pointAccountId) { this.pointAccountId = pointAccountId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Integer getPointsBalance() { return pointsBalance; }
    public void setPointsBalance(Integer pointsBalance) { this.pointsBalance = pointsBalance; }
}
