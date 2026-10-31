package com.example.merchantalertservice.consumer;

import com.example.merchantalertservice.dto.CouponRedeemedEvent;
import com.example.merchantalertservice.service.MerchantAlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class CouponRedeemedListener {

    private static final Logger log = LoggerFactory.getLogger(CouponRedeemedListener.class);

    private final MerchantAlertService merchantAlertService;

    public CouponRedeemedListener(MerchantAlertService merchantAlertService) {
        this.merchantAlertService = merchantAlertService;
    }

    @RabbitListener(queues = "${rabbitmq.queue.merchant-alert-redemption:merchant.alert.redemption.queue}")
    public void handleCouponRedeemed(CouponRedeemedEvent event) {
        log.info("Received CouponRedeemedEvent in Merchant Alert Service: customerId={}, merchantId={}",
                event.getCustomerId(), event.getMerchantId());
        try {
            merchantAlertService.recordCustomerRedemptionInterest(event.getCustomerId(), event.getMerchantId());
        } catch (Exception e) {
            log.error("Failed to process redemption interest for customerId={}: {}", event.getCustomerId(), e.getMessage(), e);
        }
    }
}
