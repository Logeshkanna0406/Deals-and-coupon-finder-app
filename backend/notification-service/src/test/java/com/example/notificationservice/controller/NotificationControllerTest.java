package com.example.notificationservice.controller;

import com.example.notificationservice.dto.NotificationResponse;
import com.example.notificationservice.entity.NotificationChannel;
import com.example.notificationservice.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @Test
    void shouldGetAllNotifications() throws Exception {
        NotificationResponse res = new NotificationResponse(
                1L, "merchant_101@test.com", "MERCHANT", "Payment Verified", "Message", NotificationChannel.EMAIL, LocalDateTime.now()
        );
        when(notificationService.getAllNotifications()).thenReturn(List.of(res));

        mockMvc.perform(get("/api/notifications")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].recipient").value("merchant_101@test.com"));
    }
}
