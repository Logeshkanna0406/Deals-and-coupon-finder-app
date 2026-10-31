package com.example.couponservice.client;

import com.example.couponservice.dto.MerchantResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "merchant-service")
public interface MerchantClient {

    @GetMapping("/api/merchants/{id}")
    MerchantResponseDto getMerchantById(@PathVariable("id") Long id);
}
