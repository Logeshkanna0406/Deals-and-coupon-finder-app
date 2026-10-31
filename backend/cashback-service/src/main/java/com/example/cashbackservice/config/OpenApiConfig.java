package com.example.cashbackservice.config;

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
                        .title("Cashback Service API")
                        .version("1.0.0")
                        .description("Customer Wallet, 5% Cashback Calculation & Redemption Engine"));
    }
}
