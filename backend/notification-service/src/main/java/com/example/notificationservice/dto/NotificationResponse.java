package com.example.notificationservice.dto;

import com.example.notificationservice.entity.NotificationChannel;
import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id;
    private String recipient;
    private String recipientType;
    private String subject;
    private String message;
    private NotificationChannel channel;
    private LocalDateTime sentAt;

    public NotificationResponse() {}

    public NotificationResponse(Long id, String recipient, String recipientType, String subject, String message, NotificationChannel channel, LocalDateTime sentAt) {
        this.id = id;
        this.recipient = recipient;
        this.recipientType = recipientType;
        this.subject = subject;
        this.message = message;
        this.channel = channel;
        this.sentAt = sentAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getRecipientType() { return recipientType; }
    public void setRecipientType(String recipientType) { this.recipientType = recipientType; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationChannel getChannel() { return channel; }
    public void setChannel(NotificationChannel channel) { this.channel = channel; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
