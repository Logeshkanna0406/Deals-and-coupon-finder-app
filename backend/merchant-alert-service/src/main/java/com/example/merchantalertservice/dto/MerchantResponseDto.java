package com.example.merchantalertservice.dto;

public class MerchantResponseDto {
    private Long merchantId;
    private String businessName;

    public MerchantResponseDto() {}

    public MerchantResponseDto(Long merchantId, String businessName) {
        this.merchantId = merchantId;
        this.businessName = businessName;
    }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
}
