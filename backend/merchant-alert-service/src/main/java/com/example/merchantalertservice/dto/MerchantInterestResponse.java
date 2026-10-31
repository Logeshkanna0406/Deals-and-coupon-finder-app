package com.example.merchantalertservice.dto;

import com.example.merchantalertservice.entity.InterestSource;
import java.time.LocalDateTime;

public class MerchantInterestResponse {
    private Long id;
    private Long customerId;
    private Long merchantId;
    private String merchantName;
    private InterestSource source;
    private LocalDateTime followedAt;

    public MerchantInterestResponse() {}

    public MerchantInterestResponse(Long id, Long customerId, Long merchantId, String merchantName, InterestSource source, LocalDateTime followedAt) {
        this.id = id;
        this.customerId = customerId;
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.source = source;
        this.followedAt = followedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }

    public InterestSource getSource() { return source; }
    public void setSource(InterestSource source) { this.source = source; }

    public LocalDateTime getFollowedAt() { return followedAt; }
    public void setFollowedAt(LocalDateTime followedAt) { this.followedAt = followedAt; }
}
