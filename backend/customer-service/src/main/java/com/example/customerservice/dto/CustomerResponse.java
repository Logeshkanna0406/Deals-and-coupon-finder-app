package com.example.customerservice.dto;

import com.example.customerservice.entity.CustomerStatus;
import java.time.LocalDateTime;

public class CustomerResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String preferences;
    private CustomerStatus status;
    private LocalDateTime createdAt;

    public CustomerResponse() {}

    public CustomerResponse(Long id, String name, String email, String phone, String preferences, CustomerStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.preferences = preferences;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }

    public CustomerStatus getStatus() { return status; }
    public void setStatus(CustomerStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
