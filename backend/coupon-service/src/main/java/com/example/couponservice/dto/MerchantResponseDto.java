package com.example.couponservice.dto;

public class MerchantResponseDto {
    private Long merchantId;
    private String businessName;
    private String status;

    public MerchantResponseDto() {}

    public MerchantResponseDto(Long merchantId, String businessName, String status) {
        this.merchantId = merchantId;
        this.businessName = businessName;
        this.status = status;
    }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
