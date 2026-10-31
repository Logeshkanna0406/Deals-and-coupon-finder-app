package com.example.cashbackservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long walletId;

    @Column(nullable = false, unique = true)
    private Long customerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal balance;

    public Wallet() {}

    public Wallet(Long walletId, Long customerId, BigDecimal balance) {
        this.walletId = walletId;
        this.customerId = customerId;
        this.balance = balance;
    }

    public Long getWalletId() { return walletId; }
    public void setWalletId(Long walletId) { this.walletId = walletId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
}
