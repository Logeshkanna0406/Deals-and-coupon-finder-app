package com.example.subscriptionservice.config;

import com.example.subscriptionservice.entity.SubscriptionPlan;
import com.example.subscriptionservice.repository.SubscriptionPlanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class SubscriptionDataInitializer implements CommandLineRunner {

    private final SubscriptionPlanRepository planRepository;

    public SubscriptionDataInitializer(SubscriptionPlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Override
    public void run(String... args) {
        if (planRepository.count() == 0) {
            planRepository.save(new SubscriptionPlan(null, "Basic", 1, new BigDecimal("499.00"), 10, "ACTIVE"));
            planRepository.save(new SubscriptionPlan(null, "Standard", 3, new BigDecimal("1299.00"), 25, "ACTIVE"));
            planRepository.save(new SubscriptionPlan(null, "Premium", 6, new BigDecimal("2299.00"), 50, "ACTIVE"));
            planRepository.save(new SubscriptionPlan(null, "Business", 12, new BigDecimal("3999.00"), 100, "ACTIVE"));
            System.out.println("Default Subscription Plans (Basic, Standard, Premium, Business) Seeded successfully.");
        }
    }
}
