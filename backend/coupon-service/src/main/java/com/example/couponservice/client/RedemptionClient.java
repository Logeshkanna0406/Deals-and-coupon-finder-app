package com.example.couponservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "redemption-service")
public interface RedemptionClient {

    @GetMapping("/api/redemptions/check")
    boolean hasCustomerRedeemed(@RequestParam("customerId") Long customerId, @RequestParam("couponId") Long couponId);
}
