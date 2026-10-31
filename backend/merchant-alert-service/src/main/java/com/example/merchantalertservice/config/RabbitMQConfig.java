package com.example.merchantalertservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.exchange.redemption:deals.redemption.exchange}")
    private String redemptionExchange;

    @Value("${rabbitmq.routingkey.coupon-redeemed:coupon.redeemed}")
    private String couponRedeemedRoutingKey;

    @Value("${rabbitmq.queue.merchant-alert-redemption:merchant.alert.redemption.queue}")
    private String merchantAlertRedemptionQueue;

    @Value("${rabbitmq.exchange.coupon:deals.coupon.exchange}")
    private String couponExchange;

    @Value("${rabbitmq.routingkey.coupon-created:coupon.created}")
    private String couponCreatedRoutingKey;

    @Value("${rabbitmq.queue.merchant-alert-coupon-created:merchant.alert.coupon.created.queue}")
    private String merchantAlertCouponCreatedQueue;

    @Value("${rabbitmq.exchange.notification:deals.notification.exchange}")
    private String notificationExchange;

    @Bean
    public TopicExchange redemptionExchange() {
        return new TopicExchange(redemptionExchange);
    }

    @Bean
    public Queue merchantAlertRedemptionQueue() {
        return new Queue(merchantAlertRedemptionQueue, true);
    }

    @Bean
    public Binding redemptionAlertBinding() {
        return BindingBuilder.bind(merchantAlertRedemptionQueue())
                .to(redemptionExchange())
                .with(couponRedeemedRoutingKey);
    }

    @Bean
    public TopicExchange couponExchange() {
        return new TopicExchange(couponExchange);
    }

    @Bean
    public Queue merchantAlertCouponCreatedQueue() {
        return new Queue(merchantAlertCouponCreatedQueue, true);
    }

    @Bean
    public Binding couponCreatedAlertBinding() {
        return BindingBuilder.bind(merchantAlertCouponCreatedQueue())
                .to(couponExchange())
                .with(couponCreatedRoutingKey);
    }

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(notificationExchange);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter());
        return rabbitTemplate;
    }
}
