package com.example.authservice.service;

import com.example.authservice.client.CustomerClient;
import com.example.authservice.client.MerchantClient;
import com.example.authservice.dto.*;
import com.example.authservice.entity.RefreshToken;
import com.example.authservice.entity.Role;
import com.example.authservice.entity.User;
import com.example.authservice.exception.BadRequestException;
import com.example.authservice.repository.RefreshTokenRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private CustomerClient customerClient;

    @Mock
    private MerchantClient merchantClient;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private RefreshToken sampleRefreshToken;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setName("John Doe");
        sampleUser.setEmail("john@example.com");
        sampleUser.setPassword("encodedPassword");
        sampleUser.setRole(Role.CUSTOMER);

        sampleRefreshToken = new RefreshToken("sample-refresh-token", sampleUser, LocalDateTime.now().plusDays(7));
    }

    @Test
    void shouldRegisterCustomerSuccessfully() {
        RegisterCustomerRequest req = new RegisterCustomerRequest();
        req.setName("John Doe");
        req.setEmail("john@example.com");
        req.setPassword("secret123");
        req.setPhone("9876543210");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtUtil.generateToken(any(), anyString(), anyString())).thenReturn("mock-jwt-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(sampleRefreshToken);

        AuthResponse response = authService.registerCustomer(req);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("sample-refresh-token", response.getRefreshToken());
        assertEquals("john@example.com", response.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void shouldThrowExceptionWhenRegisteringExistingEmail() {
        RegisterCustomerRequest req = new RegisterCustomerRequest();
        req.setEmail("john@example.com");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.registerCustomer(req));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldLoginSuccessfullyWithValidCredentials() {
        LoginRequest req = new LoginRequest("john@example.com", "secret123");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("secret123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(1L, "john@example.com", "CUSTOMER")).thenReturn("mock-jwt-token");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(sampleRefreshToken);

        AuthResponse response = authService.login(req);

        assertNotNull(response);
        assertEquals("CUSTOMER", response.getRole());
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("sample-refresh-token", response.getRefreshToken());
    }

    @Test
    void shouldThrowExceptionWhenLoginWithInvalidPassword() {
        LoginRequest req = new LoginRequest("john@example.com", "wrongpassword");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.login(req));
    }

    @Test
    void shouldRefreshTokenSuccessfully() {
        RefreshTokenRequest request = new RefreshTokenRequest("sample-refresh-token");

        when(refreshTokenRepository.findByToken("sample-refresh-token")).thenReturn(Optional.of(sampleRefreshToken));
        when(jwtUtil.generateToken(1L, "john@example.com", "CUSTOMER")).thenReturn("new-access-token");

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new-access-token", response.getToken());
        assertEquals("sample-refresh-token", response.getRefreshToken());
        assertEquals("john@example.com", response.getEmail());
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenRevoked() {
        sampleRefreshToken.setRevoked(true);
        RefreshTokenRequest request = new RefreshTokenRequest("sample-refresh-token");

        when(refreshTokenRepository.findByToken("sample-refresh-token")).thenReturn(Optional.of(sampleRefreshToken));

        assertThrows(BadRequestException.class, () -> authService.refreshToken(request));
    }

    @Test
    void shouldThrowExceptionWhenRefreshTokenExpired() {
        sampleRefreshToken.setExpiryDate(LocalDateTime.now().minusDays(1));
        RefreshTokenRequest request = new RefreshTokenRequest("sample-refresh-token");

        when(refreshTokenRepository.findByToken("sample-refresh-token")).thenReturn(Optional.of(sampleRefreshToken));

        assertThrows(BadRequestException.class, () -> authService.refreshToken(request));
        assertTrue(sampleRefreshToken.isRevoked());
        verify(refreshTokenRepository, times(1)).save(sampleRefreshToken);
    }

    @Test
    void shouldRevokeRefreshTokenOnLogout() {
        LogoutRequest request = new LogoutRequest("sample-refresh-token");

        when(refreshTokenRepository.findByToken("sample-refresh-token")).thenReturn(Optional.of(sampleRefreshToken));

        authService.logout(request);

        assertTrue(sampleRefreshToken.isRevoked());
        verify(refreshTokenRepository, times(1)).save(sampleRefreshToken);
    }

    @Test
    void shouldGenerateResetTokenOnForgotPassword() {
        ForgotPasswordRequest req = new ForgotPasswordRequest("john@example.com");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        ForgotPasswordResponse res = authService.forgotPassword(req);

        assertNotNull(res);
        assertNotNull(res.getResetToken());
        assertEquals("john@example.com", res.getEmail());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    void shouldThrowExceptionWhenForgotPasswordForUnknownEmail() {
        ForgotPasswordRequest req = new ForgotPasswordRequest("unknown@example.com");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> authService.forgotPassword(req));
    }

    @Test
    void shouldResetPasswordSuccessfullyWithValidToken() {
        sampleUser.setResetToken("valid-token-123");
        sampleUser.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));

        ResetPasswordRequest req = new ResetPasswordRequest("valid-token-123", "newSecret123");

        when(userRepository.findByResetToken("valid-token-123")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("newSecret123")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        ResetPasswordResponse res = authService.resetPassword(req);

        assertNotNull(res);
        assertTrue(res.getMessage().contains("successfully"));
        assertNull(sampleUser.getResetToken());
        assertNull(sampleUser.getResetTokenExpiry());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    void shouldThrowExceptionWhenResetPasswordTokenIsExpired() {
        sampleUser.setResetToken("expired-token-123");
        sampleUser.setResetTokenExpiry(LocalDateTime.now().minusMinutes(5));

        ResetPasswordRequest req = new ResetPasswordRequest("expired-token-123", "newSecret123");

        when(userRepository.findByResetToken("expired-token-123")).thenReturn(Optional.of(sampleUser));

        assertThrows(BadRequestException.class, () -> authService.resetPassword(req));
    }

    @Test
    void shouldThrowExceptionWhenResetPasswordTokenIsInvalid() {
        ResetPasswordRequest req = new ResetPasswordRequest("nonexistent-token", "newSecret123");

        when(userRepository.findByResetToken("nonexistent-token")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> authService.resetPassword(req));
    }
}
