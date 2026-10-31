package com.example.merchantalertservice.controller;

import com.example.merchantalertservice.dto.AlertPreferenceResponse;
import com.example.merchantalertservice.dto.MerchantInterestResponse;
import com.example.merchantalertservice.dto.UpdateAlertPreferenceRequest;
import com.example.merchantalertservice.entity.InterestSource;
import com.example.merchantalertservice.service.MerchantAlertService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MerchantAlertController.class)
@AutoConfigureMockMvc(addFilters = false)
class MerchantAlertControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MerchantAlertService merchantAlertService;

    @Test
    void shouldGetCustomerInterests() throws Exception {
        MerchantInterestResponse item = new MerchantInterestResponse(
                1L, 2L, 101L, "Pizza Planet", InterestSource.REDEMPTION, LocalDateTime.now()
        );

        when(merchantAlertService.getCustomerInterests(eq(2L), eq("2"), eq("CUSTOMER")))
                .thenReturn(List.of(item));

        mockMvc.perform(get("/api/merchant-alerts/interests")
                .param("customerId", "2")
                .header("X-User-Id", "2")
                .header("X-User-Role", "CUSTOMER")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].merchantId").value(101))
                .andExpect(jsonPath("$[0].merchantName").value("Pizza Planet"))
                .andExpect(jsonPath("$[0].source").value("REDEMPTION"));
    }

    @Test
    void shouldFollowMerchant() throws Exception {
        MerchantInterestResponse item = new MerchantInterestResponse(
                1L, 2L, 101L, "Pizza Planet", InterestSource.MANUAL_FOLLOW, LocalDateTime.now()
        );

        when(merchantAlertService.followMerchant(eq(2L), eq(101L), eq("2"), eq("CUSTOMER")))
                .thenReturn(item);

        mockMvc.perform(post("/api/merchant-alerts/follow/101")
                .param("customerId", "2")
                .header("X-User-Id", "2")
                .header("X-User-Role", "CUSTOMER")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.merchantId").value(101))
                .andExpect(jsonPath("$.source").value("MANUAL_FOLLOW"));
    }

    @Test
    void shouldUnfollowMerchant() throws Exception {
        mockMvc.perform(delete("/api/merchant-alerts/follow/101")
                .param("customerId", "2")
                .header("X-User-Id", "2")
                .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isNoContent());

        verify(merchantAlertService).unfollowMerchant(eq(2L), eq(101L), eq("2"), eq("CUSTOMER"));
    }

    @Test
    void shouldGetAlertPreferences() throws Exception {
        AlertPreferenceResponse pref = new AlertPreferenceResponse(
                2L, true, true, false, LocalDateTime.now()
        );

        when(merchantAlertService.getAlertPreference(eq(2L), eq("2"), eq("CUSTOMER")))
                .thenReturn(pref);

        mockMvc.perform(get("/api/merchant-alerts/preferences")
                .param("customerId", "2")
                .header("X-User-Id", "2")
                .header("X-User-Role", "CUSTOMER")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value(2))
                .andExpect(jsonPath("$.emailEnabled").value(true))
                .andExpect(jsonPath("$.smsEnabled").value(true))
                .andExpect(jsonPath("$.inAppEnabled").value(false));
    }

    @Test
    void shouldUpdateAlertPreferences() throws Exception {
        UpdateAlertPreferenceRequest req = new UpdateAlertPreferenceRequest(2L, true, false, true);
        AlertPreferenceResponse pref = new AlertPreferenceResponse(
                2L, true, false, true, LocalDateTime.now()
        );

        when(merchantAlertService.updateAlertPreference(any(UpdateAlertPreferenceRequest.class), eq("2"), eq("CUSTOMER")))
                .thenReturn(pref);

        mockMvc.perform(put("/api/merchant-alerts/preferences")
                .header("X-User-Id", "2")
                .header("X-User-Role", "CUSTOMER")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailEnabled").value(true))
                .andExpect(jsonPath("$.smsEnabled").value(false))
                .andExpect(jsonPath("$.inAppEnabled").value(true));
    }
}
