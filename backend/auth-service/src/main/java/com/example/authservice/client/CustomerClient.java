package com.example.authservice.client;

import com.example.authservice.dto.CustomerProfileDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "customer-service")
public interface CustomerClient {
    @PostMapping("/api/customers/internal")
    CustomerProfileDto createCustomerProfile(@RequestBody CustomerProfileDto request);
}
