package com.example.couponservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Coupon Service API")
                        .version("1.0.0")
                        .description("Deals and Coupons Management with Subscription Verification & Circuit Breaker"));
    }
}
