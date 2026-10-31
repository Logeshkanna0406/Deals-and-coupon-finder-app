package com.example.notificationservice.service;

import com.example.notificationservice.entity.NotificationChannel;
import com.example.notificationservice.entity.NotificationLog;
import com.example.notificationservice.repository.NotificationLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationLogRepository repository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void shouldSendNotificationAndSaveLog() {
        notificationService.sendNotification(
                "merchant_101@deals.com", "MERCHANT", "Sub Activated", "Your sub is active", NotificationChannel.EMAIL
        );

        verify(repository, times(1)).save(any(NotificationLog.class));
    }

    @Test
    void shouldReturnNotificationsByRecipient() {
        NotificationLog log = new NotificationLog(1L, "customer@test.com", "CUSTOMER", "Alert", "Hello", NotificationChannel.SMS);
        when(repository.findByRecipientOrderBySentAtDesc("customer@test.com")).thenReturn(List.of(log));

        var res = notificationService.getNotificationsByRecipient("customer@test.com");

        assertEquals(1, res.size());
        assertEquals("customer@test.com", res.get(0).getRecipient());
    }
}
