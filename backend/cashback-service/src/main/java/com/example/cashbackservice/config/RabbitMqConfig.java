package com.example.cashbackservice.config;

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

    @Value("${rabbitmq.exchange.redemption:deals.redemption.exchange}")
    private String redemptionExchange;

    @Value("${rabbitmq.queue.coupon-redeemed:cashback.coupon.redeemed.queue}")
    private String couponRedeemedQueue;

    @Value("${rabbitmq.routingkey.coupon-redeemed:coupon.redeemed}")
    private String couponRedeemedRoutingKey;

    @Value("${rabbitmq.exchange.cashback:deals.cashback.exchange}")
    private String cashbackExchange;

    @Bean
    public TopicExchange redemptionExchange() {
        return new TopicExchange(redemptionExchange);
    }

    @Bean
    public TopicExchange cashbackExchange() {
        return new TopicExchange(cashbackExchange);
    }

    @Bean
    public Queue couponRedeemedQueue() {
        return new Queue(couponRedeemedQueue, true);
    }

    @Bean
    public Binding couponRedeemedBinding() {
        return BindingBuilder.bind(couponRedeemedQueue())
                .to(redemptionExchange())
                .with(couponRedeemedRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        org.springframework.amqp.support.converter.DefaultClassMapper classMapper = new org.springframework.amqp.support.converter.DefaultClassMapper();
        classMapper.setTrustedPackages("*");
        java.util.Map<String, Class<?>> idClassMapping = new java.util.HashMap<>();
        idClassMapping.put("com.example.redemptionservice.dto.CouponRedeemedEvent", com.example.cashbackservice.dto.CouponRedeemedEvent.class);
        classMapper.setIdClassMapping(idClassMapping);
        classMapper.setDefaultType(com.example.cashbackservice.dto.CouponRedeemedEvent.class);
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
