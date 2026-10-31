package com.example.notificationservice.controller;

import com.example.notificationservice.dto.NotificationResponse;
import com.example.notificationservice.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notification Controller", description = "Endpoints for viewing simulated SMS/Email alert logs dispatched by RabbitMQ events")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get all dispatched notification logs")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/recipient/{recipient}")
    @Operation(summary = "Get notification logs for a specific recipient email/phone")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByRecipient(@PathVariable("recipient") String recipient) {
        return ResponseEntity.ok(notificationService.getNotificationsByRecipient(recipient));
    }

    @PostMapping
    @Operation(summary = "Create and record a new notification log")
    public ResponseEntity<NotificationResponse> createNotification(@RequestBody com.example.notificationservice.dto.CreateNotificationRequest request) {
        com.example.notificationservice.entity.NotificationChannel channel = request.getChannel() != null
                ? request.getChannel()
                : com.example.notificationservice.entity.NotificationChannel.IN_APP;
        String recipientType = request.getRecipientType() != null && !request.getRecipientType().isBlank()
                ? request.getRecipientType()
                : "CUSTOMER";

        notificationService.sendNotification(request.getRecipient(), recipientType, request.getSubject(), request.getMessage(), channel);
        return ResponseEntity.ok(new NotificationResponse(
                null,
                request.getRecipient(),
                recipientType,
                request.getSubject(),
                request.getMessage(),
                channel,
                java.time.LocalDateTime.now()
        ));
    }
}
