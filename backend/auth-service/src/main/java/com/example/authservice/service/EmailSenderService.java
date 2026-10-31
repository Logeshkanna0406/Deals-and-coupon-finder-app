package com.example.authservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.*;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);

    @Value("${mail.provider:auto}")
    private String mailProvider; // "resend", "brevo", "smtp", or "auto"

    @Value("${mail.api.key:}")
    private String apiKey;

    @Value("${mail.smtp.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${mail.smtp.port:587}")
    private int smtpPort;

    @Value("${mail.smtp.username:}")
    private String smtpUsername;

    @Value("${mail.smtp.password:}")
    private String smtpPassword;

    @Value("${mail.from.email:}")
    private String fromEmail;

    @Value("${mail.from.name:Deals & Coupons Finder}")
    private String fromName;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public boolean sendOtpEmail(String recipientEmail, String recipientName, String otp) {
        log.info("Dispatching real verification email to: {}", recipientEmail);

        String subject = "Your Verification Code: " + otp + " - Deals & Coupons Finder";

        String htmlBody = "<div style=\"font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "<div style=\"text-align: center; margin-bottom: 20px;\">"
                + "<h2 style=\"color: #1e3a8a; margin: 0;\">🏷️ Deals & Coupons Finder</h2>"
                + "<p style=\"color: #64748b; font-size: 14px; margin-top: 4px;\">Account Registration Verification</p>"
                + "</div>"
                + "<p style=\"color: #334155; font-size: 15px;\">Hello <strong>" + (recipientName != null && !recipientName.isBlank() ? recipientName : "there") + "</strong>,</p>"
                + "<p style=\"color: #334155; font-size: 15px; line-height: 1.5;\">Thank you for registering with Deals & Coupons Finder. Please use the verification code below to complete your account setup:</p>"
                + "<div style=\"text-align: center; margin: 28px 0;\">"
                + "<span style=\"display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e40af; background: #eff6ff; padding: 12px 28px; border-radius: 8px; border: 1.5px dashed #3b82f6;\">"
                + otp
                + "</span>"
                + "</div>"
                + "<p style=\"color: #64748b; font-size: 13px;\">This code is valid for <strong>10 minutes</strong>. If you did not request this, please disregard this email.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;\">"
                + "<p style=\"color: #94a3b8; font-size: 12px; text-align: center; margin: 0;\">© 2026 Deals & Coupons Finder. All rights reserved.</p>"
                + "</div>";

        // 1. If Resend API key is provided or mailProvider is resend
        if ("resend".equalsIgnoreCase(mailProvider) || (apiKey != null && apiKey.startsWith("re_"))) {
            return sendViaResend(recipientEmail, subject, htmlBody);
        }

        // 2. If Brevo API key is provided or mailProvider is brevo
        if ("brevo".equalsIgnoreCase(mailProvider) || (apiKey != null && apiKey.startsWith("xkeysib-"))) {
            return sendViaBrevo(recipientEmail, recipientName, subject, htmlBody);
        }

        // 3. If SMTP credentials configured
        if (smtpUsername != null && !smtpUsername.isBlank() && smtpPassword != null && !smtpPassword.isBlank()) {
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : smtpUsername;
            try {
                sendViaSmtp(smtpHost, smtpPort, smtpUsername, smtpPassword, sender, fromName, recipientEmail, subject, htmlBody);
                log.info("✅ Verification email successfully delivered via SMTP to {}", recipientEmail);
                return true;
            } catch (Exception e) {
                log.error("❌ Failed to deliver email via SMTP: {}", e.getMessage());
                return false;
            }
        }

        log.warn("==========================================================================");
        log.warn("⚠️ No email delivery service configured yet! To receive real emails in your inbox:");
        log.warn("   Option A (Resend): Set mail.api.key=re_... in application.properties");
        log.warn("   Option B (Brevo):  Set mail.api.key=xkeysib-... in application.properties");
        log.warn("   Option C (Gmail):  Set mail.smtp.username & mail.smtp.password in application.properties");
        log.warn("==========================================================================");
        return false;
    }

    public boolean sendPasswordResetOtpEmail(String recipientEmail, String recipientName, String otp) {
        log.info("Dispatching real password reset OTP email to: {}", recipientEmail);

        String subject = "Password Reset Code: " + otp + " - Deals & Coupons Finder";

        String htmlBody = "<div style=\"font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;\">"
                + "<div style=\"text-align: center; margin-bottom: 20px;\">"
                + "<h2 style=\"color: #1e3a8a; margin: 0;\">🔐 Deals & Coupons Finder</h2>"
                + "<p style=\"color: #64748b; font-size: 14px; margin-top: 4px;\">Password Reset Verification</p>"
                + "</div>"
                + "<p style=\"color: #334155; font-size: 15px;\">Hello <strong>" + (recipientName != null && !recipientName.isBlank() ? recipientName : "User") + "</strong>,</p>"
                + "<p style=\"color: #334155; font-size: 15px; line-height: 1.5;\">We received a request to reset your password for your Deals & Coupons Finder account. Please use the 6-digit verification code below to set a new password:</p>"
                + "<div style=\"text-align: center; margin: 28px 0;\">"
                + "<span style=\"display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #dc2626; background: #fef2f2; padding: 12px 28px; border-radius: 8px; border: 1.5px dashed #ef4444;\">"
                + otp
                + "</span>"
                + "</div>"
                + "<p style=\"color: #64748b; font-size: 13px;\">This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or check your account security.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;\">"
                + "<p style=\"color: #94a3b8; font-size: 12px; text-align: center; margin: 0;\">© 2026 Deals & Coupons Finder. All rights reserved.</p>"
                + "</div>";

        // 1. If Resend API key is provided or mailProvider is resend
        if ("resend".equalsIgnoreCase(mailProvider) || (apiKey != null && apiKey.startsWith("re_"))) {
            return sendViaResend(recipientEmail, subject, htmlBody);
        }

        // 2. If Brevo API key is provided or mailProvider is brevo
        if ("brevo".equalsIgnoreCase(mailProvider) || (apiKey != null && apiKey.startsWith("xkeysib-"))) {
            return sendViaBrevo(recipientEmail, recipientName, subject, htmlBody);
        }

        // 3. If SMTP credentials configured
        if (smtpUsername != null && !smtpUsername.isBlank() && smtpPassword != null && !smtpPassword.isBlank()) {
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : smtpUsername;
            try {
                sendViaSmtp(smtpHost, smtpPort, smtpUsername, smtpPassword, sender, fromName, recipientEmail, subject, htmlBody);
                log.info("✅ Password reset OTP email successfully delivered via SMTP to {}", recipientEmail);
                return true;
            } catch (Exception e) {
                log.error("❌ Failed to deliver password reset OTP email via SMTP: {}", e.getMessage());
                return false;
            }
        }

        log.warn("⚠️ No email delivery service configured for password reset OTP!");
        return false;
    }

    private boolean sendViaResend(String toEmail, String subject, String htmlContent) {
        log.info("Sending email via Resend API...");
        try {
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "Deals & Coupons <onboarding@resend.dev>";
            String escapedSubject = escapeJson(subject);
            String escapedHtml = escapeJson(htmlContent);

            String requestBody = "{"
                    + "\"from\":\"" + sender + "\","
                    + "\"to\":[\"" + toEmail + "\"],"
                    + "\"subject\":\"" + escapedSubject + "\","
                    + "\"html\":\"" + escapedHtml + "\""
                    + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ Resend API email dispatched successfully: {}", response.body());
                return true;
            } else {
                log.error("❌ Resend API error (status {}): {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Exception dispatching via Resend: {}", e.getMessage());
            return false;
        }
    }

    private boolean sendViaBrevo(String toEmail, String toName, String subject, String htmlContent) {
        log.info("Sending email via Brevo API...");
        try {
            String senderEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "deals.coupons.finder@gmail.com";
            String escapedSubject = escapeJson(subject);
            String escapedHtml = escapeJson(htmlContent);
            String safeName = (toName != null && !toName.isBlank()) ? escapeJson(toName) : "User";

            String requestBody = "{"
                    + "\"sender\":{\"name\":\"" + fromName + "\",\"email\":\"" + senderEmail + "\"},"
                    + "\"to\":[{\"email\":\"" + toEmail + "\",\"name\":\"" + safeName + "\"}],"
                    + "\"subject\":\"" + escapedSubject + "\","
                    + "\"htmlContent\":\"" + escapedHtml + "\""
                    + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ Brevo API email dispatched successfully: {}", response.body());
                return true;
            } else {
                log.error("❌ Brevo API error (status {}): {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Exception dispatching via Brevo: {}", e.getMessage());
            return false;
        }
    }

    private void sendViaSmtp(String host, int port, String user, String pass,
                            String from, String fromDisplayName, String to,
                            String subject, String htmlContent) throws IOException {
        String cleanUser = user.trim();
        String cleanPass = pass.replaceAll("\\s+", "");

        Socket rawSocket = new Socket(host, port);
        rawSocket.setSoTimeout(15000);

        BufferedReader reader = new BufferedReader(new InputStreamReader(rawSocket.getInputStream(), StandardCharsets.UTF_8));
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(rawSocket.getOutputStream(), StandardCharsets.UTF_8));

        String line = reader.readLine();
        if (line == null || !line.startsWith("220")) {
            rawSocket.close();
            throw new IOException("Unexpected SMTP banner: " + line);
        }

        sendCommand(writer, reader, "EHLO localhost", "250");

        Socket activeSocket = rawSocket;
        if (port == 587) {
            sendCommand(writer, reader, "STARTTLS", "220");
            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            SSLSocket sslSocket = (SSLSocket) factory.createSocket(rawSocket, host, port, true);
            sslSocket.startHandshake();
            activeSocket = sslSocket;
            reader = new BufferedReader(new InputStreamReader(activeSocket.getInputStream(), StandardCharsets.UTF_8));
            writer = new BufferedWriter(new OutputStreamWriter(activeSocket.getOutputStream(), StandardCharsets.UTF_8));
            sendCommand(writer, reader, "EHLO localhost", "250");
        }

        sendCommand(writer, reader, "AUTH LOGIN", "334");
        sendCommand(writer, reader, Base64.getEncoder().encodeToString(cleanUser.getBytes(StandardCharsets.UTF_8)), "334");
        sendCommand(writer, reader, Base64.getEncoder().encodeToString(cleanPass.getBytes(StandardCharsets.UTF_8)), "235");

        sendCommand(writer, reader, "MAIL FROM:<" + from + ">", "250");
        sendCommand(writer, reader, "RCPT TO:<" + to + ">", "250");
        sendCommand(writer, reader, "DATA", "354");

        writer.write("From: \"" + fromDisplayName + "\" <" + from + ">\r\n");
        writer.write("To: <" + to + ">\r\n");
        writer.write("Subject: " + subject + "\r\n");
        writer.write("MIME-Version: 1.0\r\n");
        writer.write("Content-Type: text/html; charset=UTF-8\r\n");
        writer.write("\r\n");
        writer.write(htmlContent);
        writer.write("\r\n.\r\n");
        writer.flush();

        line = reader.readLine();
        if (line == null || !line.startsWith("250")) {
            throw new IOException("Failed to send DATA: " + line);
        }

        sendCommand(writer, reader, "QUIT", "221");
        activeSocket.close();
    }

    private void sendCommand(BufferedWriter writer, BufferedReader reader, String cmd, String expectedPrefix) throws IOException {
        writer.write(cmd + "\r\n");
        writer.flush();

        String resp;
        boolean hasPrefix = false;
        while ((resp = reader.readLine()) != null) {
            if (resp.startsWith(expectedPrefix)) {
                hasPrefix = true;
            }
            if (resp.length() >= 4 && resp.charAt(3) == ' ') {
                break;
            }
        }
        if (!hasPrefix) {
            throw new IOException("SMTP command '" + cmd + "' rejected or unexpected response: " + resp);
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
