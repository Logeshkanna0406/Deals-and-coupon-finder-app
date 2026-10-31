package com.example.authservice.controller;

import com.example.authservice.dto.*;
import com.example.authservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication Controller", description = "Endpoints for customer/merchant registration, login, refresh token, forgot password, reset password, and logout")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/customer")
    @Operation(summary = "Register a new Customer account")
    public ResponseEntity<AuthResponse> registerCustomer(@Valid @RequestBody RegisterCustomerRequest request) {
        AuthResponse response = authService.registerCustomer(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/register/merchant")
    @Operation(summary = "Register a new Merchant account (Status: PENDING)")
    public ResponseEntity<AuthResponse> registerMerchant(@Valid @RequestBody RegisterMerchantRequest request) {
        AuthResponse response = authService.registerMerchant(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with Email and Password to retrieve JWT Bearer and Refresh tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Generate a new access token using a valid, non-revoked refresh token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset OTP for a registered email")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/verify-otp")
    @Operation(summary = "Verify OTP code sent for password reset")
    public ResponseEntity<VerifyOtpResponse> verifyForgotPasswordOtp(@Valid @RequestBody VerifyOtpRequest request) {
        VerifyOtpResponse response = authService.verifyForgotPasswordOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using valid reset token")
    public ResponseEntity<ResetPasswordResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ResetPasswordResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user session and revoke refresh token")
    public ResponseEntity<Map<String, String>> logout(@RequestBody(required = false) LogoutRequest request) {
        authService.logout(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully. Refresh token revoked. Please discard the JWT token client-side.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    @Operation(summary = "Login or register using Google Single Sign-On")
    public ResponseEntity<AuthResponse> loginWithGoogle(@RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.loginWithGoogle(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send verification OTP to user email")
    public ResponseEntity<SendOtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        SendOtpResponse response = authService.sendOtp(request.getEmail(), request.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP code sent to user email")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        VerifyOtpResponse response = authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(response);
    }
}
