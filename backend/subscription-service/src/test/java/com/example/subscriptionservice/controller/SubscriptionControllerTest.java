package com.example.subscriptionservice.controller;

import com.example.subscriptionservice.dto.SubscriptionPlanResponse;
import com.example.subscriptionservice.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SubscriptionController.class)
@AutoConfigureMockMvc(addFilters = false)
class SubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubscriptionService subscriptionService;

    @Test
    void shouldReturnPlansList() throws Exception {
        SubscriptionPlanResponse plan = new SubscriptionPlanResponse(1L, "Basic", 1, new BigDecimal("499.00"), 10, "ACTIVE");
        when(subscriptionService.getAllPlans()).thenReturn(List.of(plan));

        mockMvc.perform(get("/api/subscriptions/plans")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Basic"))
                .andExpect(jsonPath("$[0].price").value(499.00));
    }

    @Test
    void shouldCreateSubscriptionPlan() throws Exception {
        SubscriptionPlanResponse plan = new SubscriptionPlanResponse(5L, "Enterprise", 12, new BigDecimal("4999.00"), 150, "ACTIVE");
        when(subscriptionService.createPlan(any())).thenReturn(plan);

        String json = "{\"name\":\"Enterprise\",\"durationInMonths\":12,\"price\":4999.00,\"couponLimit\":150,\"status\":\"ACTIVE\"}";

        mockMvc.perform(post("/api/subscriptions/plans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planId").value(5))
                .andExpect(jsonPath("$.name").value("Enterprise"))
                .andExpect(jsonPath("$.price").value(4999.00));
    }
}
