package com.example.notificationservice.consumer;

import com.example.notificationservice.dto.CashbackCreditedEvent;
import com.example.notificationservice.dto.CouponRedeemedEvent;
import com.example.notificationservice.dto.PaymentVerifiedEvent;
import com.example.notificationservice.entity.NotificationChannel;
import com.example.notificationservice.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventConsumers {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventConsumers.class);

    private final NotificationService notificationService;

    public NotificationEventConsumers(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = "${rabbitmq.queue.payment-notification:notification.payment.queue}")
    public void handlePaymentVerified(PaymentVerifiedEvent event) {
        try {
            log.info("Notification Service received PaymentVerifiedEvent for merchantId: {}", event.getMerchantId());
            String subject = "Subscription Payment Verified & Activated!";
            String message = String.format("Dear Merchant (ID: %d), your payment of ₹%s (Payment ID: %d) has been verified. Your subscription (ID: %d) is now ACTIVE.",
                    event.getMerchantId(), event.getAmount(), event.getPaymentId(), event.getSubscriptionId());

            notificationService.sendNotification("merchant_" + event.getMerchantId() + "@dealsplatform.com", "MERCHANT", subject, message, NotificationChannel.EMAIL);
        } catch (Exception e) {
            log.error("Failed to process payment verified notification for merchantId: {}: {}", event.getMerchantId(), e.getMessage(), e);
        }
    }

    @RabbitListener(queues = "${rabbitmq.queue.redemption-notification:notification.redemption.queue}")
    public void handleCouponRedeemed(CouponRedeemedEvent event) {
        try {
            log.info("Notification Service received CouponRedeemedEvent for customerId: {}, merchantId: {}",
                    event.getCustomerId(), event.getMerchantId());

            int points = event.getPointsEarned() != null ? event.getPointsEarned() : 10;
            String message = String.format("Coupon ID %d redeemed for purchase of ₹%s. Discount of ₹%s applied. +%d Points added to your account!",
                    event.getCouponId(), event.getPurchaseAmount(), event.getDiscountAmount(), points);

            notificationService.sendNotification("customer_" + event.getCustomerId() + "@dealsplatform.com", "CUSTOMER", "Coupon Redeemed Successfully", message, NotificationChannel.IN_APP);
        } catch (Exception e) {
            log.error("Failed to process coupon redeemed notification for customerId: {}: {}", event.getCustomerId(), e.getMessage(), e);
        }
    }

    @RabbitListener(queues = "${rabbitmq.queue.cashback-notification:notification.cashback.queue}")
    public void handleCashbackCredited(CashbackCreditedEvent event) {
        log.info("Notification Service received CashbackCreditedEvent for customerId: {} - suppressed upon coupon redemption as requested", event.getCustomerId());
    }

    @RabbitListener(queues = "${rabbitmq.queue.merchant-alert-notification:notification.merchant.alert.queue}")
    public void handleMerchantCouponAlert(com.example.notificationservice.dto.MerchantCouponAlertEvent event) {
        log.info("Notification Service received MerchantCouponAlertEvent for customerId: {}, merchantId: {}, couponId: {}",
                event.getCustomerId(), event.getMerchantId(), event.getCouponId());

        if (!event.isInAppEnabled()) {
            log.info("In-app alert is not enabled for customerId: {}. Skipping notification.", event.getCustomerId());
            return;
        }

        try {
            String merchantDisplay = event.getMerchantName() != null ? event.getMerchantName() : "Merchant #" + event.getMerchantId();
            String subject = "New Coupon Alert from " + merchantDisplay + "!";
            String message = String.format("Great news! %s just launched a new coupon: \"%s\" (Code: %s) for ₹%s OFF! Grab it before it expires.",
                    merchantDisplay, event.getCouponTitle(), event.getCouponCode(), event.getDiscount());

            String recipient = "customer_" + event.getCustomerId() + "@dealsplatform.com";

            // Only IN_APP notifications as requested
            notificationService.sendNotification(recipient, "CUSTOMER", subject, message, NotificationChannel.IN_APP);
        } catch (Exception e) {
            log.error("Failed to process merchant coupon alert for customerId: {}, couponId: {}: {}",
                    event.getCustomerId(), event.getCouponId(), e.getMessage(), e);
        }
    }
}
