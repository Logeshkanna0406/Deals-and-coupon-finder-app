package com.example.authservice.dto;

public class ForgotPasswordResponse {

    private String message;
    private String email;
    private String resetToken;

    public ForgotPasswordResponse() {}

    public ForgotPasswordResponse(String message, String email, String resetToken) {
        this.message = message;
        this.email = email;
        this.resetToken = resetToken;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
}
