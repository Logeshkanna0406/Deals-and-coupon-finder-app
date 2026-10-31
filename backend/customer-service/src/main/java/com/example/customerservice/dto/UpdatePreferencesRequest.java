package com.example.customerservice.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdatePreferencesRequest {

    @NotBlank(message = "Preferences string is required")
    private String preferences;

    public UpdatePreferencesRequest() {}

    public UpdatePreferencesRequest(String preferences) {
        this.preferences = preferences;
    }

    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }
}
