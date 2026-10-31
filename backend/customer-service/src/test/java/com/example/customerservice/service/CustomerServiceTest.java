package com.example.customerservice.service;

import com.example.customerservice.client.CashbackClient;
import com.example.customerservice.client.RedemptionClient;
import com.example.customerservice.dto.CustomerResponse;
import com.example.customerservice.dto.UpdateCustomerRequest;
import com.example.customerservice.entity.Customer;
import com.example.customerservice.entity.CustomerStatus;
import com.example.customerservice.exception.ResourceNotFoundException;
import com.example.customerservice.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CashbackClient cashbackClient;

    @Mock
    private RedemptionClient redemptionClient;

    @InjectMocks
    private CustomerService customerService;

    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer();
        sampleCustomer.setId(1L);
        sampleCustomer.setName("Bob Smith");
        sampleCustomer.setEmail("bob@example.com");
        sampleCustomer.setPhone("1234567890");
        sampleCustomer.setPreferences("Electronics, Fashion");
        sampleCustomer.setStatus(CustomerStatus.ACTIVE);
        sampleCustomer.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void shouldReturnCustomerById() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));

        CustomerResponse response = customerService.getCustomerById(1L);

        assertNotNull(response);
        assertEquals("Bob Smith", response.getName());
        assertEquals("bob@example.com", response.getEmail());
    }

    @Test
    void shouldThrowExceptionWhenCustomerNotFound() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> customerService.getCustomerById(99L));
    }

    @Test
    void shouldUpdateCustomerProfile() {
        UpdateCustomerRequest request = new UpdateCustomerRequest("Robert Smith", "9999999999", "Tech, Books");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.save(any(Customer.class))).thenReturn(sampleCustomer);

        CustomerResponse response = customerService.updateCustomer(1L, request);

        assertNotNull(response);
        assertEquals("Robert Smith", sampleCustomer.getName());
        assertEquals("9999999999", sampleCustomer.getPhone());
    }
}
