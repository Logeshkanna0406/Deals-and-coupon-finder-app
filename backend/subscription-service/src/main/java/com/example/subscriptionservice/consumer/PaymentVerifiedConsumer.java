package com.example.subscriptionservice.consumer;

import com.example.subscriptionservice.dto.PaymentVerifiedEvent;
import com.example.subscriptionservice.service.SubscriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentVerifiedConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentVerifiedConsumer.class);

    private final SubscriptionService subscriptionService;

    public PaymentVerifiedConsumer(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @RabbitListener(queues = "${rabbitmq.queue.payment-verified:subscription.payment.verified.queue}")
    public void handlePaymentVerified(PaymentVerifiedEvent event) {
        log.info("Received PaymentVerifiedEvent for subscriptionId: {}, paymentId: {}", event.getSubscriptionId(), event.getPaymentId());
        try {
            subscriptionService.activateSubscriptionFromPayment(event);
        } catch (Exception e) {
            log.error("Failed to activate subscription from PaymentVerifiedEvent: {}", e.getMessage(), e);
        }
    }
}
