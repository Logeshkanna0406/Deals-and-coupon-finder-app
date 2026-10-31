package com.example.couponservice.dto;

import com.example.couponservice.exception.BadRequestException;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * @deprecated Use {@link CouponUpdateRequest} instead. Retained for backwards compatibility.
 */
@Deprecated
public class UpdateCouponRequest extends CouponUpdateRequest {

    public UpdateCouponRequest() {
        super();
    }

    public UpdateCouponRequest(String title, String description, String category, BigDecimal discount,
                               BigDecimal cashbackPercentage, BigDecimal minimumPurchase, Integer usageLimit) {
        super(title, description, category, discount, cashbackPercentage, minimumPurchase, usageLimit);
    }
}
