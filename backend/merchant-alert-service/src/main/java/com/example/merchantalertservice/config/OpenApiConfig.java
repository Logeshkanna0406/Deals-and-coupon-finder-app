package com.example.merchantalertservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI merchantAlertServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Merchant Alert Service API")
                        .description("REST API documentation for Merchant New-Coupon Alerts and Customer Interest Management")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Deals & Coupons Platform Team")
                                .email("support@dealsplatform.com")));
    }
}
