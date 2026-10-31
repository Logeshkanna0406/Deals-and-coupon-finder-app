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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final CustomerClient customerClient;
    private final MerchantClient merchantClient;
    private final EmailSenderService emailSenderService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       CustomerClient customerClient,
                       MerchantClient merchantClient,
                       EmailSenderService emailSenderService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.customerClient = customerClient;
        this.merchantClient = merchantClient;
        this.emailSenderService = emailSenderService;
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID().toString().replace("-", ""),
                user,
                LocalDateTime.now().plusDays(7)
        );
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public AuthResponse registerCustomer(RegisterCustomerRequest request) {
        log.info("Registering new customer with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.CUSTOMER);
        User savedUser = userRepository.save(user);

        try {
            CustomerProfileDto profile = new CustomerProfileDto(
                    savedUser.getId(),
                    request.getName(),
                    request.getEmail(),
                    request.getPhone(),
                    request.getPreferences()
            );
            customerClient.createCustomerProfile(profile);
            log.info("Customer profile synced successfully for user ID: {}", savedUser.getId());
        } catch (Exception e) {
            log.warn("Customer service sync failed or is running in mock mode: {}", e.getMessage());
        }

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());
        RefreshToken refreshToken = createRefreshToken(savedUser);
        return new AuthResponse(token, refreshToken.getToken(), savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole().name(), "Customer registered successfully");
    }

    @Transactional
    public AuthResponse registerMerchant(RegisterMerchantRequest request) {
        log.info("Registering new merchant with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getBusinessName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.MERCHANT);
        User savedUser = userRepository.save(user);

        try {
            MerchantProfileDto profile = new MerchantProfileDto(
                    savedUser.getId(),
                    request.getBusinessName(),
                    request.getOwnerName(),
                    request.getEmail(),
                    request.getPhone(),
                    request.getCategory(),
                    request.getAddress(),
                    request.getDescription()
            );
            merchantClient.createMerchantProfile(profile);
            log.info("Merchant profile synced successfully for merchant ID: {}", savedUser.getId());
        } catch (Exception e) {
            log.warn("Merchant service sync failed or is running in mock mode: {}", e.getMessage());
        }

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());
        RefreshToken refreshToken = createRefreshToken(savedUser);
        return new AuthResponse(token, refreshToken.getToken(), savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole().name(), "Merchant registered successfully. Pending Admin approval.");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Attempting login for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Invalid password attempt for email: {}", request.getEmail());
            throw new BadRequestException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = createRefreshToken(user);
        log.info("User logged in successfully: {} (Role: {})", user.getEmail(), user.getRole());

        return new AuthResponse(token, refreshToken.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole().name(), "Login successful");
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        log.info("Processing refresh token request");

        String reqToken = request.getRefreshToken();
        if (reqToken == null || reqToken.isBlank()) {
            throw new BadRequestException("Refresh token is required");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(reqToken)
                .orElseThrow(() -> new BadRequestException("Invalid or non-existent refresh token"));

        if (refreshToken.isRevoked()) {
            throw new BadRequestException("Refresh token has been revoked. Please log in again.");
        }

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new BadRequestException("Refresh token has expired. Please log in again.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(
                newAccessToken,
                refreshToken.getToken(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                "Access token refreshed successfully"
        );
    }

    @Transactional
    public void logout(LogoutRequest request) {
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshTokenRepository.findByToken(request.getRefreshToken()).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
                log.info("Revoked refresh token on logout for user ID: {}", token.getUser().getId());
            });
        }
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Registered email address is required");
        }
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        log.info("Processing forgot password request for email: {}", normalizedEmail);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("No registered account found with email: " + normalizedEmail));

        // Generate 6-digit numeric OTP
        int randomCode = 100000 + new java.util.Random().nextInt(900000);
        String otp = String.valueOf(randomCode);

        user.setResetToken(otp);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        otpCache.put(normalizedEmail, new OtpEntry(otp, LocalDateTime.now().plusMinutes(15)));

        // Send real email via configured SMTP
        emailSenderService.sendPasswordResetOtpEmail(normalizedEmail, user.getName(), otp);

        log.info("Generated 6-digit password reset OTP for user: {}", normalizedEmail);
        return new ForgotPasswordResponse(
                "A 6-digit verification code has been sent to " + normalizedEmail + ". Please check your inbox.",
                normalizedEmail,
                null
        );
    }

    public VerifyOtpResponse verifyForgotPasswordOtp(String email, String otp) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (otp == null || otp.isBlank()) {
            throw new BadRequestException("Verification OTP is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String trimmedOtp = otp.trim();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("No registered account found with email: " + normalizedEmail));

        boolean matched = false;
        if (user.getResetToken() != null && user.getResetToken().equals(trimmedOtp)) {
            if (user.getResetTokenExpiry() != null && user.getResetTokenExpiry().isAfter(LocalDateTime.now())) {
                matched = true;
            } else {
                throw new BadRequestException("Verification code has expired. Please request a new code.");
            }
        }

        if (!matched) {
            OtpEntry entry = otpCache.get(normalizedEmail);
            if (entry != null && entry.getOtp().equals(trimmedOtp)) {
                if (entry.getExpiryTime().isAfter(LocalDateTime.now())) {
                    matched = true;
                } else {
                    otpCache.remove(normalizedEmail);
                    throw new BadRequestException("Verification code has expired. Please request a new code.");
                }
            }
        }

        if (!matched) {
            throw new BadRequestException("Invalid verification code. Please check your email and try again.");
        }

        log.info("Forgot password OTP successfully verified for email: {}", normalizedEmail);
        return new VerifyOtpResponse(true, "OTP verified successfully. You can now set a new password.");
    }

    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        log.info("Processing password reset with provided token/OTP");

        String token = request.getToken() != null ? request.getToken().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;

        User user = null;
        if (email != null && !email.isBlank()) {
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (user == null) {
            user = userRepository.findByResetToken(token)
                    .orElseThrow(() -> new BadRequestException("Invalid or expired verification code"));
        } else {
            if (user.getResetToken() == null || !user.getResetToken().equals(token)) {
                throw new BadRequestException("Invalid verification code for this account.");
            }
        }

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification code has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        if (email != null) {
            otpCache.remove(email);
        }

        log.info("Password successfully reset for user: {}", user.getEmail());
        return new ResetPasswordResponse("Password has been reset successfully. You can now log in with your new password.");
    }

    public static class OtpEntry {
        private final String otp;
        private final LocalDateTime expiryTime;

        public OtpEntry(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }

        public String getOtp() { return otp; }
        public LocalDateTime getExpiryTime() { return expiryTime; }
    }

    private final java.util.concurrent.ConcurrentHashMap<String, OtpEntry> otpCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Google email is required");
        }
        String email = request.getEmail().trim().toLowerCase();
        String name = (request.getName() != null && !request.getName().isBlank())
                ? request.getName().trim()
                : email.split("@")[0];

        log.info("Processing Google login for email: {}", email);

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.info("Creating new customer account via Google SSO for: {}", email);
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setRole(Role.CUSTOMER);
            user = userRepository.save(user);

            try {
                CustomerProfileDto profile = new CustomerProfileDto(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        "",
                        "General"
                );
                customerClient.createCustomerProfile(profile);
                log.info("Customer profile synced successfully for Google user ID: {}", user.getId());
            } catch (Exception e) {
                log.warn("Customer service sync failed or is running in mock mode: {}", e.getMessage());
            }
        } else {
            log.info("Existing user logged in via Google SSO: {} (Role: {})", email, user.getRole());
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = createRefreshToken(user);

        return new AuthResponse(
                token,
                refreshToken.getToken(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                "Successfully signed in with Google"
        );
    }

    public SendOtpResponse sendOtp(String email, String name) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with email " + normalizedEmail + " already exists. Please sign in instead.");
        }

        int randomCode = 100000 + new java.util.Random().nextInt(900000);
        String otp = String.valueOf(randomCode);

        otpCache.put(normalizedEmail, new OtpEntry(otp, LocalDateTime.now().plusMinutes(10)));

        // Send real email via EmailSenderService
        emailSenderService.sendOtpEmail(normalizedEmail, name, otp);

        return new SendOtpResponse(
                true,
                "Verification code sent to " + normalizedEmail,
                normalizedEmail
        );
    }

    public VerifyOtpResponse verifyOtp(String email, String otp) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (otp == null || otp.isBlank()) {
            throw new BadRequestException("Verification OTP is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String trimmedOtp = otp.trim();

        OtpEntry entry = otpCache.get(normalizedEmail);
        if (entry == null) {
            throw new BadRequestException("No verification code found for " + normalizedEmail + ". Please request an OTP first.");
        }

        if (entry.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpCache.remove(normalizedEmail);
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }

        if (!entry.getOtp().equals(trimmedOtp)) {
            throw new BadRequestException("Invalid verification code. Please check and try again.");
        }

        otpCache.remove(normalizedEmail);
        log.info("OTP successfully verified for email: {}", normalizedEmail);

        return new VerifyOtpResponse(true, "Email verified successfully!");
    }
}
