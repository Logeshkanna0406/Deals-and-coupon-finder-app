package com.example.cashbackservice.consumer;

import com.example.cashbackservice.dto.CouponRedeemedEvent;
import com.example.cashbackservice.service.CashbackService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class CouponRedeemedConsumer {

    private static final Logger log = LoggerFactory.getLogger(CouponRedeemedConsumer.class);

    private final CashbackService cashbackService;

    public CouponRedeemedConsumer(CashbackService cashbackService) {
        this.cashbackService = cashbackService;
    }

    @RabbitListener(queues = "${rabbitmq.queue.coupon-redeemed:cashback.coupon.redeemed.queue}")
    public void handleCouponRedeemed(CouponRedeemedEvent event) {
        log.info("Received CouponRedeemedEvent for customer ID: {}, redemption ID: {}",
                event.getCustomerId(), event.getRedemptionId());
        try {
            cashbackService.processCouponRedeemedEvent(event);
        } catch (Exception e) {
            log.error("Failed to process cashback for redemption: {}", e.getMessage(), e);
        }
    }
}
