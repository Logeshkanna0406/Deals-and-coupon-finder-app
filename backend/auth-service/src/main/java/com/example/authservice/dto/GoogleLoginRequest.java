package com.example.authservice.dto;

public class GoogleLoginRequest {
    private String email;
    private String name;
    private String googleId;
    private String avatarUrl;

    public GoogleLoginRequest() {}

    public GoogleLoginRequest(String email, String name, String googleId, String avatarUrl) {
        this.email = email;
        this.name = name;
        this.googleId = googleId;
        this.avatarUrl = avatarUrl;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
