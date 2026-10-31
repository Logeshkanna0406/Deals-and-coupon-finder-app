package com.example.customerservice.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateCustomerRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String preferences;

    public UpdateCustomerRequest() {}

    public UpdateCustomerRequest(String name, String phone, String preferences) {
        this.name = name;
        this.phone = phone;
        this.preferences = preferences;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }
}
