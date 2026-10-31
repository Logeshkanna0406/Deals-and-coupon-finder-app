package com.example.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Value("${rabbitmq.exchange.payment:deals.payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.queue.payment-notification:notification.payment.queue}")
    private String paymentNotificationQueue;

    @Value("${rabbitmq.routingkey.payment-verified:payment.verified}")
    private String paymentVerifiedRoutingKey;

    @Value("${rabbitmq.exchange.redemption:deals.redemption.exchange}")
    private String redemptionExchange;

    @Value("${rabbitmq.queue.redemption-notification:notification.redemption.queue}")
    private String redemptionNotificationQueue;

    @Value("${rabbitmq.routingkey.coupon-redeemed:coupon.redeemed}")
    private String couponRedeemedRoutingKey;

    @Value("${rabbitmq.exchange.cashback:deals.cashback.exchange}")
    private String cashbackExchange;

    @Value("${rabbitmq.queue.cashback-notification:notification.cashback.queue}")
    private String cashbackNotificationQueue;

    @Value("${rabbitmq.routingkey.cashback-credited:cashback.credited}")
    private String cashbackCreditedRoutingKey;

    @Value("${rabbitmq.exchange.notification:deals.notification.exchange}")
    private String notificationExchange;

    @Value("${rabbitmq.queue.merchant-alert-notification:notification.merchant.alert.queue}")
    private String merchantAlertNotificationQueue;

    @Value("${rabbitmq.routingkey.merchant-alert:merchant.coupon.alert}")
    private String merchantAlertRoutingKey;

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(paymentExchange);
    }

    @Bean
    public TopicExchange redemptionExchange() {
        return new TopicExchange(redemptionExchange);
    }

    @Bean
    public TopicExchange cashbackExchange() {
        return new TopicExchange(cashbackExchange);
    }

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(notificationExchange);
    }

    @Bean
    public Queue paymentNotificationQueue() {
        return new Queue(paymentNotificationQueue, true);
    }

    @Bean
    public Queue redemptionNotificationQueue() {
        return new Queue(redemptionNotificationQueue, true);
    }

    @Bean
    public Queue cashbackNotificationQueue() {
        return new Queue(cashbackNotificationQueue, true);
    }

    @Bean
    public Queue merchantAlertNotificationQueue() {
        return new Queue(merchantAlertNotificationQueue, true);
    }

    @Bean
    public Binding paymentNotificationBinding() {
        return BindingBuilder.bind(paymentNotificationQueue())
                .to(paymentExchange())
                .with(paymentVerifiedRoutingKey);
    }

    @Bean
    public Binding redemptionNotificationBinding() {
        return BindingBuilder.bind(redemptionNotificationQueue())
                .to(redemptionExchange())
                .with(couponRedeemedRoutingKey);
    }

    @Bean
    public Binding cashbackNotificationBinding() {
        return BindingBuilder.bind(cashbackNotificationQueue())
                .to(cashbackExchange())
                .with(cashbackCreditedRoutingKey);
    }

    @Bean
    public Binding merchantAlertNotificationBinding() {
        return BindingBuilder.bind(merchantAlertNotificationQueue())
                .to(notificationExchange())
                .with(merchantAlertRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        org.springframework.amqp.support.converter.DefaultClassMapper classMapper = new org.springframework.amqp.support.converter.DefaultClassMapper();
        classMapper.setTrustedPackages("*");
        java.util.Map<String, Class<?>> idClassMapping = new java.util.HashMap<>();
        idClassMapping.put("com.example.paymentservice.dto.PaymentVerifiedEvent", com.example.notificationservice.dto.PaymentVerifiedEvent.class);
        idClassMapping.put("com.example.redemptionservice.dto.CouponRedeemedEvent", com.example.notificationservice.dto.CouponRedeemedEvent.class);
        idClassMapping.put("com.example.cashbackservice.dto.CashbackCreditedEvent", com.example.notificationservice.dto.CashbackCreditedEvent.class);
        idClassMapping.put("com.example.merchantalertservice.dto.MerchantCouponAlertEvent", com.example.notificationservice.dto.MerchantCouponAlertEvent.class);
        classMapper.setIdClassMapping(idClassMapping);
        converter.setClassMapper(classMapper);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
