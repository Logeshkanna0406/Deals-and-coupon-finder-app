package com.example.merchantalertservice.dto;

import java.time.LocalDateTime;

public class AlertPreferenceResponse {
    private Long customerId;
    private boolean emailEnabled;
    private boolean smsEnabled;
    private boolean inAppEnabled;
    private LocalDateTime updatedAt;

    public AlertPreferenceResponse() {}

    public AlertPreferenceResponse(Long customerId, boolean emailEnabled, boolean smsEnabled, boolean inAppEnabled, LocalDateTime updatedAt) {
        this.customerId = customerId;
        this.emailEnabled = emailEnabled;
        this.smsEnabled = smsEnabled;
        this.inAppEnabled = inAppEnabled;
        this.updatedAt = updatedAt;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public boolean isEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }

    public boolean isSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(boolean smsEnabled) { this.smsEnabled = smsEnabled; }

    public boolean isInAppEnabled() { return inAppEnabled; }
    public void setInAppEnabled(boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
