package com.example.merchantalertservice.dto;

public class UpdateAlertPreferenceRequest {
    private Long customerId;
    private Boolean emailEnabled;
    private Boolean smsEnabled;
    private Boolean inAppEnabled;

    public UpdateAlertPreferenceRequest() {}

    public UpdateAlertPreferenceRequest(Long customerId, Boolean emailEnabled, Boolean smsEnabled, Boolean inAppEnabled) {
        this.customerId = customerId;
        this.emailEnabled = emailEnabled;
        this.smsEnabled = smsEnabled;
        this.inAppEnabled = inAppEnabled;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Boolean getEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }

    public Boolean getSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(Boolean smsEnabled) { this.smsEnabled = smsEnabled; }

    public Boolean getInAppEnabled() { return inAppEnabled; }
    public void setInAppEnabled(Boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
}
