package com.example.subscriptionservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Value("${rabbitmq.exchange.payment:deals.payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.queue.payment-verified:subscription.payment.verified.queue}")
    private String paymentVerifiedQueue;

    @Value("${rabbitmq.routingkey.payment-verified:payment.verified}")
    private String paymentVerifiedRoutingKey;

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(paymentExchange);
    }

    @Bean
    public Queue paymentVerifiedQueue() {
        return new Queue(paymentVerifiedQueue, true);
    }

    @Bean
    public Binding paymentVerifiedBinding() {
        return BindingBuilder.bind(paymentVerifiedQueue())
                .to(paymentExchange())
                .with(paymentVerifiedRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultClassMapper classMapper = new DefaultClassMapper();
        classMapper.setTrustedPackages("*");
        java.util.Map<String, Class<?>> idClassMapping = new java.util.HashMap<>();
        idClassMapping.put("com.example.paymentservice.dto.PaymentVerifiedEvent", com.example.subscriptionservice.dto.PaymentVerifiedEvent.class);
        classMapper.setIdClassMapping(idClassMapping);
        classMapper.setDefaultType(com.example.subscriptionservice.dto.PaymentVerifiedEvent.class);
        converter.setClassMapper(classMapper);
        return converter;
    }

    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
