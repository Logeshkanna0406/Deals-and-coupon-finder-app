package com.example.authservice.client;

import com.example.authservice.dto.MerchantProfileDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "merchant-service")
public interface MerchantClient {
    @PostMapping("/api/merchants/internal")
    MerchantProfileDto createMerchantProfile(@RequestBody MerchantProfileDto request);
}
