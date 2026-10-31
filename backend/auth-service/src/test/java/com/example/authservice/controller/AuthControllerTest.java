package com.example.authservice.controller;

import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.LogoutRequest;
import com.example.authservice.dto.RefreshTokenRequest;
import com.example.authservice.dto.RegisterCustomerRequest;
import com.example.authservice.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void shouldReturn201OnCustomerRegistration() throws Exception {
        RegisterCustomerRequest req = new RegisterCustomerRequest();
        req.setName("Alice");
        req.setEmail("alice@test.com");
        req.setPassword("password123");
        req.setPhone("1234567890");

        AuthResponse response = new AuthResponse("token123", "refresh123", 2L, "Alice", "alice@test.com", "CUSTOMER", "Success");
        when(authService.registerCustomer(any(RegisterCustomerRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register/customer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("token123"))
                .andExpect(jsonPath("$.refreshToken").value("refresh123"))
                .andExpect(jsonPath("$.email").value("alice@test.com"));
    }

    @Test
    void shouldReturn200OnLogin() throws Exception {
        LoginRequest req = new LoginRequest("alice@test.com", "password123");
        AuthResponse response = new AuthResponse("token123", "refresh123", 2L, "Alice", "alice@test.com", "CUSTOMER", "Success");
        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token123"))
                .andExpect(jsonPath("$.refreshToken").value("refresh123"));
    }

    @Test
    void shouldReturn200OnRefreshToken() throws Exception {
        RefreshTokenRequest req = new RefreshTokenRequest("valid-refresh-token");
        AuthResponse response = new AuthResponse("new-token-456", "valid-refresh-token", 2L, "Alice", "alice@test.com", "CUSTOMER", "Success");
        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/refresh-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new-token-456"))
                .andExpect(jsonPath("$.refreshToken").value("valid-refresh-token"));
    }

    @Test
    void shouldReturn200OnLogout() throws Exception {
        LogoutRequest req = new LogoutRequest("valid-refresh-token");
        doNothing().when(authService).logout(any(LogoutRequest.class));

        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully. Refresh token revoked. Please discard the JWT token client-side."));
    }

    @Test
    void shouldReturn200OnForgotPassword() throws Exception {
        com.example.authservice.dto.ForgotPasswordRequest req = new com.example.authservice.dto.ForgotPasswordRequest("alice@test.com");
        com.example.authservice.dto.ForgotPasswordResponse res = new com.example.authservice.dto.ForgotPasswordResponse("Success", "alice@test.com", "reset-token-xyz");

        when(authService.forgotPassword(any(com.example.authservice.dto.ForgotPasswordRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken").value("reset-token-xyz"))
                .andExpect(jsonPath("$.email").value("alice@test.com"));
    }

    @Test
    void shouldReturn200OnResetPassword() throws Exception {
        com.example.authservice.dto.ResetPasswordRequest req = new com.example.authservice.dto.ResetPasswordRequest("reset-token-xyz", "newPassword123");
        com.example.authservice.dto.ResetPasswordResponse res = new com.example.authservice.dto.ResetPasswordResponse("Password reset successfully");

        when(authService.resetPassword(any(com.example.authservice.dto.ResetPasswordRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully"));
    }
}
