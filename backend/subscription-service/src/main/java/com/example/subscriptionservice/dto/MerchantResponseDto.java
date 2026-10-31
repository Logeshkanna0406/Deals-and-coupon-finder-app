package com.example.subscriptionservice.dto;

public class MerchantResponseDto {
    private Long merchantId;
    private String businessName;
    private String email;
    private String status;

    public MerchantResponseDto() {}

    public MerchantResponseDto(Long merchantId, String businessName, String email, String status) {
        this.merchantId = merchantId;
        this.businessName = businessName;
        this.email = email;
        this.status = status;
    }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
