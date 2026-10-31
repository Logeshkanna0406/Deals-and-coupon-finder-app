package com.example.merchantalertservice.consumer;

import com.example.merchantalertservice.dto.CouponCreatedEvent;
import com.example.merchantalertservice.service.MerchantAlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class CouponCreatedListener {

    private static final Logger log = LoggerFactory.getLogger(CouponCreatedListener.class);

    private final MerchantAlertService merchantAlertService;

    public CouponCreatedListener(MerchantAlertService merchantAlertService) {
        this.merchantAlertService = merchantAlertService;
    }

    @RabbitListener(queues = "${rabbitmq.queue.merchant-alert-coupon-created:merchant.alert.coupon.created.queue}")
    public void handleCouponCreated(CouponCreatedEvent event) {
        log.info("Received CouponCreatedEvent in Merchant Alert Service: couponId={}, merchantId={}, status={}",
                event.getCouponId(), event.getMerchantId(), event.getStatus());
        try {
            merchantAlertService.processCouponCreatedAlerts(event);
        } catch (Exception e) {
            log.error("Failed to process coupon created alert for couponId={}: {}", event.getCouponId(), e.getMessage(), e);
        }
    }
}
