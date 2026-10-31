package com.example.notificationservice.dto;

import com.example.notificationservice.entity.NotificationChannel;

public class CreateNotificationRequest {
    private String recipient;
    private String recipientType;
    private String subject;
    private String message;
    private NotificationChannel channel;

    public CreateNotificationRequest() {}

    public CreateNotificationRequest(String recipient, String recipientType, String subject, String message, NotificationChannel channel) {
        this.recipient = recipient;
        this.recipientType = recipientType;
        this.subject = subject;
        this.message = message;
        this.channel = channel;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getRecipientType() {
        return recipientType;
    }

    public void setRecipientType(String recipientType) {
        this.recipientType = recipientType;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }
}
