package com.example.cashbackservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RedeemPointsRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Points to redeem is required")
    @Min(value = 100, message = "Minimum points to redeem is 100")
    private Integer points;

    public RedeemPointsRequest() {}

    public RedeemPointsRequest(Long customerId, Integer points) {
        this.customerId = customerId;
        this.points = points;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
}
