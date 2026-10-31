package com.example.notificationservice.service;

import com.example.notificationservice.dto.NotificationResponse;
import com.example.notificationservice.entity.NotificationChannel;
import com.example.notificationservice.entity.NotificationLog;
import com.example.notificationservice.repository.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationLogRepository notificationLogRepository;

    public NotificationService(NotificationLogRepository notificationLogRepository) {
        this.notificationLogRepository = notificationLogRepository;
    }

    @Transactional
    public void sendNotification(String recipient, String recipientType, String subject, String message, NotificationChannel channel) {
        log.info("[SIMULATED {}] To: {} [{}] | Subject: {} | Message: {}",
                channel, recipient, recipientType, subject, message);

        NotificationLog logEntry = new NotificationLog(null, recipient, recipientType, subject, message, channel);
        notificationLogRepository.save(logEntry);
    }

    public List<NotificationResponse> getAllNotifications() {
        return notificationLogRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getNotificationsByRecipient(String recipient) {
        return notificationLogRepository.findByRecipientOrderBySentAtDesc(recipient).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private NotificationResponse mapToResponse(NotificationLog n) {
        return new NotificationResponse(
                n.getId(),
                n.getRecipient(),
                n.getRecipientType(),
                n.getSubject(),
                n.getMessage(),
                n.getChannel(),
                n.getSentAt()
        );
    }
}
