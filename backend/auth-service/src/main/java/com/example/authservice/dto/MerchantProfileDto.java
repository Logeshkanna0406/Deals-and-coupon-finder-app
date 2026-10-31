package com.example.authservice.dto;

public class MerchantProfileDto {
    private Long merchantId;
    private String businessName;
    private String ownerName;
    private String email;
    private String phone;
    private String category;
    private String address;
    private String description;

    public MerchantProfileDto() {}

    public MerchantProfileDto(Long merchantId, String businessName, String ownerName, String email, String phone, String category, String address, String description) {
        this.merchantId = merchantId;
        this.businessName = businessName;
        this.ownerName = ownerName;
        this.email = email;
        this.phone = phone;
        this.category = category;
        this.address = address;
        this.description = description;
    }

    public Long getMerchantId() { return merchantId; }
    public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
