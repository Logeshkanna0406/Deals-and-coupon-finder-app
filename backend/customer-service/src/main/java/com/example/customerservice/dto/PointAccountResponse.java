package com.example.customerservice.dto;

public class PointAccountResponse {
    private Long customerId;
    private Integer points;

    public PointAccountResponse() {}

    public PointAccountResponse(Long customerId, Integer points) {
        this.customerId = customerId;
        this.points = points;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
}
